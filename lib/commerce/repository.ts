import { randomUUID } from "node:crypto";
import type { ProductGrant, CommerceSource } from "./catalog";
import { createSessionToken, hashEmail, hashOrderReference, hashPilotToken, hashSessionToken } from "./crypto";
import { D1Error, type D1Client } from "./d1";

type SessionRow = {
  account_id: string;
  balance: number;
  reserved: number;
  expires_at: string;
  source: CommerceSource;
};

type LicenseRow = {
  id: string;
  account_id: string;
  balance: number;
  reserved: number;
  product_sku: string;
  status: string;
};

type OperationRow = {
  operation_id: string;
  account_id: string;
  cost: number;
  status: "reserved" | "settled" | "released";
  balance: number;
  reserved: number;
};

export class CommerceRepositoryError extends Error {
  readonly code: "INVALID_LICENSE" | "INSUFFICIENT_BOOSTS" | "OPERATION_CONFLICT" | "DATABASE_UNAVAILABLE";

  constructor(code: "INVALID_LICENSE" | "INSUFFICIENT_BOOSTS" | "OPERATION_CONFLICT" | "DATABASE_UNAVAILABLE") {
    super(code);
    this.name = "CommerceRepositoryError";
    this.code = code;
  }
}

export class CommerceRepository {
  private readonly db: D1Client;
  private readonly pepper: string;

  constructor(db: D1Client, pepper: string) {
    this.db = db;
    this.pepper = pepper;
  }

  async recordEvent(provider: CommerceSource, eventId: string, eventType: string, payloadHash: string) {
    const now = new Date().toISOString();
    await this.db.query(
      `INSERT OR IGNORE INTO commerce_events(provider, event_id, event_type, payload_hash, status, created_at)
       VALUES (?, ?, ?, ?, 'received', ?)`,
      [provider, eventId, eventType, payloadHash, now],
    );
    const result = await this.db.query<{ status: string; payload_hash: string }>(
      "SELECT status, payload_hash FROM commerce_events WHERE provider = ? AND event_id = ? LIMIT 1",
      [provider, eventId],
    );
    const event = result.results?.[0];
    if (!event || event.payload_hash !== payloadHash) throw new CommerceRepositoryError("OPERATION_CONFLICT");
    return event.status;
  }

  async completeEvent(provider: CommerceSource, eventId: string, status: "processed" | "ignored" | "failed") {
    await this.db.query(
      "UPDATE commerce_events SET status = ?, processed_at = ? WHERE provider = ? AND event_id = ?",
      [status, new Date().toISOString(), provider, eventId],
    );
  }

  async issueLicense(input: {
    source: CommerceSource;
    orderReference: string;
    purchaserEmail: string;
    product: ProductGrant;
  }) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const orderHash = hashOrderReference(this.pepper, input.source, input.orderReference);
    const emailHash = hashEmail(this.pepper, input.purchaserEmail);
    await this.db.query(
      `INSERT OR IGNORE INTO licenses(
        id, source, order_reference_hash, purchaser_email_hash, product_sku, boost_grant,
        grants_access, duration_days, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?)`,
      [id, input.source, orderHash, emailHash, input.product.sku, input.product.boosts, input.product.grantsAccess ? 1 : 0, input.product.durationDays, now],
    );
    const result = await this.db.query<{ id: string; purchaser_email_hash: string; product_sku: string }>(
      "SELECT id, purchaser_email_hash, product_sku FROM licenses WHERE source = ? AND order_reference_hash = ? LIMIT 1",
      [input.source, orderHash],
    );
    const license = result.results?.[0];
    if (!license || license.purchaser_email_hash !== emailHash || license.product_sku !== input.product.sku) {
      throw new CommerceRepositoryError("OPERATION_CONFLICT");
    }
    return license.id;
  }

  async revokeLicense(source: CommerceSource, orderReference: string, status: "refunded" | "revoked") {
    const orderHash = hashOrderReference(this.pepper, source, orderReference);
    const now = new Date().toISOString();
    await this.db.batch([
      {
        sql: `UPDATE wallet_operations SET status = 'released', updated_at = ?
              WHERE status = 'reserved' AND account_id = (
                SELECT account_id FROM licenses WHERE source = ? AND order_reference_hash = ?
              )`,
        params: [now, source, orderHash],
      },
      {
        sql: `UPDATE licenses SET status = ?, revoked_at = ?
              WHERE source = ? AND order_reference_hash = ? AND status IN ('issued', 'active')`,
        params: [status, now, source, orderHash],
      },
    ]);
  }

  async applyLicenseToExistingAccount(source: CommerceSource, orderReference: string, email: string) {
    const emailHash = hashEmail(this.pepper, email);
    const orderHash = hashOrderReference(this.pepper, source, orderReference);
    const now = new Date().toISOString();
    await this.db.query(
      `UPDATE licenses
       SET account_id = (SELECT id FROM accounts WHERE email_hash = ?),
           status = 'active', activated_at = COALESCE(activated_at, ?),
           expires_at = CASE WHEN duration_days IS NULL THEN NULL ELSE strftime('%Y-%m-%dT%H:%M:%fZ', ?, '+' || duration_days || ' days') END
       WHERE source = ? AND order_reference_hash = ? AND purchaser_email_hash = ? AND status = 'issued'
         AND EXISTS (SELECT 1 FROM accounts WHERE email_hash = ?)`,
      [emailHash, now, now, source, orderHash, emailHash, emailHash],
    );
  }

  async activateLicense(source: CommerceSource, orderReference: string, email: string) {
    const accountId = randomUUID();
    const sessionToken = createSessionToken();
    const tokenHash = hashSessionToken(this.pepper, sessionToken);
    const emailHash = hashEmail(this.pepper, email);
    const orderHash = hashOrderReference(this.pepper, source, orderReference);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000).toISOString();
    const nowIso = now.toISOString();

    const results = await this.db.batch<LicenseRow>([
      {
        sql: "INSERT OR IGNORE INTO accounts(id, email_hash, country_code, created_at) VALUES (?, ?, 'BE', ?)",
        params: [accountId, emailHash, nowIso],
      },
      {
        sql: `UPDATE licenses
              SET account_id = (SELECT id FROM accounts WHERE email_hash = ?),
                  status = 'active', activated_at = COALESCE(activated_at, ?),
                  expires_at = CASE WHEN duration_days IS NULL THEN NULL ELSE strftime('%Y-%m-%dT%H:%M:%fZ', ?, '+' || duration_days || ' days') END
              WHERE source = ? AND order_reference_hash = ? AND purchaser_email_hash = ?
                AND (status = 'issued' OR (status = 'active' AND account_id = (SELECT id FROM accounts WHERE email_hash = ?)))`,
        params: [emailHash, nowIso, nowIso, source, orderHash, emailHash, emailHash],
      },
      {
        sql: `DELETE FROM sessions
              WHERE account_id = (SELECT account_id FROM licenses WHERE source = ? AND order_reference_hash = ? AND purchaser_email_hash = ?)
                AND (expires_at <= ? OR token_hash NOT IN (
                  SELECT token_hash FROM sessions
                  WHERE account_id = (SELECT account_id FROM licenses WHERE source = ? AND order_reference_hash = ? AND purchaser_email_hash = ?)
                  ORDER BY created_at DESC LIMIT 4
                ))`,
        params: [source, orderHash, emailHash, nowIso, source, orderHash, emailHash],
      },
      {
        sql: `INSERT OR REPLACE INTO sessions(token_hash, account_id, created_at, expires_at)
              SELECT ?, account_id, ?, ? FROM licenses
              WHERE source = ? AND order_reference_hash = ? AND purchaser_email_hash = ? AND status = 'active'
                AND (expires_at IS NULL OR expires_at > ?)`,
        params: [tokenHash, nowIso, expiresAt, source, orderHash, emailHash, nowIso],
      },
      {
        sql: `SELECT l.id, l.account_id, l.product_sku, l.status, w.balance, w.reserved
              FROM licenses l JOIN wallets w ON w.account_id = l.account_id
              WHERE l.source = ? AND l.order_reference_hash = ? AND l.purchaser_email_hash = ?
                AND l.status = 'active' AND (l.expires_at IS NULL OR l.expires_at > ?)
              LIMIT 1`,
        params: [source, orderHash, emailHash, nowIso],
      },
    ]);
    const activation = results.at(-1)?.results?.[0];
    if (!activation) throw new CommerceRepositoryError("INVALID_LICENSE");
    return {
      sessionToken,
      sessionExpiresAt: expiresAt,
      accountId: activation.account_id,
      balance: activation.balance,
      available: activation.balance - activation.reserved,
      productSku: activation.product_sku,
    };
  }

  async getSession(sessionToken: string) {
    if (!sessionToken || sessionToken.length > 128) return null;
    const tokenHash = hashSessionToken(this.pepper, sessionToken);
    const now = new Date().toISOString();
    const result = await this.db.query<SessionRow>(
      `SELECT s.account_id, s.expires_at, w.balance, w.reserved,
              (SELECT l.source FROM licenses l
               WHERE l.account_id = s.account_id AND l.grants_access = 1
               ORDER BY l.activated_at ASC, l.created_at ASC LIMIT 1) AS source
       FROM sessions s JOIN wallets w ON w.account_id = s.account_id
       WHERE s.token_hash = ? AND s.expires_at > ?
         AND EXISTS (
           SELECT 1 FROM licenses l WHERE l.account_id = s.account_id AND l.status = 'active'
             AND l.grants_access = 1 AND (l.expires_at IS NULL OR l.expires_at > ?)
         )
       LIMIT 1`,
      [tokenHash, now, now],
    );
    const session = result.results?.[0];
    if (!session) return null;
    return {
      accountId: session.account_id,
      balance: session.balance,
      reserved: session.reserved,
      available: session.balance - session.reserved,
      expiresAt: session.expires_at,
      source: session.source,
    };
  }

  async createPilotInvite(email: string, boosts = 10, accessDays = 14) {
    if (!Number.isSafeInteger(boosts) || boosts < 3 || boosts > 50) throw new TypeError("Invalid pilot grant");
    if (!Number.isSafeInteger(accessDays) || accessDays < 1 || accessDays > 30) throw new TypeError("Invalid pilot duration");
    const inviteId = randomUUID();
    const accountId = randomUUID();
    const licenseId = randomUUID();
    const token = createSessionToken();
    const tokenHash = hashPilotToken(this.pepper, token);
    const accountHash = hashEmail(this.pepper, email);
    const orderHash = hashOrderReference(this.pepper, "manual", inviteId);
    const now = new Date();
    const nowIso = now.toISOString();
    const inviteExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1_000).toISOString();
    await this.db.batch([
      {
        sql: `DELETE FROM accounts WHERE id IN (
                SELECT account_id FROM pilot_invites WHERE status = 'issued' AND expires_at <= ?
              )`,
        params: [nowIso],
      },
      {
        sql: "INSERT INTO accounts(id, email_hash, country_code, created_at) VALUES (?, ?, 'BE', ?)",
        params: [accountId, accountHash, nowIso],
      },
      {
        sql: `INSERT INTO licenses(
                id, source, order_reference_hash, purchaser_email_hash, product_sku, boost_grant,
                grants_access, duration_days, status, account_id, created_at
              ) VALUES (?, 'manual', ?, ?, 'pilot-be', ?, 1, ?, 'issued', ?, ?)`,
        params: [licenseId, orderHash, accountHash, boosts, accessDays, accountId, nowIso],
      },
      {
        sql: `INSERT INTO pilot_invites(token_hash, account_id, license_id, status, created_at, expires_at)
              VALUES (?, ?, ?, 'issued', ?, ?)`,
        params: [tokenHash, accountId, licenseId, nowIso, inviteExpiresAt],
      },
    ]);
    return { token, inviteExpiresAt, boosts, accessDays };
  }

  async revokePilotInvite(token: string) {
    if (!token || token.length > 128) return;
    const tokenHash = hashPilotToken(this.pepper, token);
    const now = new Date().toISOString();
    await this.db.batch([
      {
        sql: `UPDATE wallet_operations SET status = 'released', updated_at = ?
              WHERE status = 'reserved' AND account_id = (SELECT account_id FROM pilot_invites WHERE token_hash = ?)`,
        params: [now, tokenHash],
      },
      {
        sql: `UPDATE licenses SET status = 'revoked', revoked_at = ?
              WHERE id = (SELECT license_id FROM pilot_invites WHERE token_hash = ?) AND status IN ('issued', 'active')`,
        params: [now, tokenHash],
      },
      {
        sql: "DELETE FROM sessions WHERE account_id = (SELECT account_id FROM pilot_invites WHERE token_hash = ?)",
        params: [tokenHash],
      },
      {
        sql: `UPDATE pilot_invites SET status = 'revoked', revoked_at = ?
              WHERE token_hash = ? AND status IN ('issued', 'claimed')`,
        params: [now, tokenHash],
      },
    ]);
  }

  async claimPilotInvite(token: string) {
    if (!token || token.length > 128) throw new CommerceRepositoryError("INVALID_LICENSE");
    const tokenHash = hashPilotToken(this.pepper, token);
    const sessionToken = createSessionToken();
    const sessionHash = hashSessionToken(this.pepper, sessionToken);
    const now = new Date();
    const nowIso = now.toISOString();
    const sessionExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000).toISOString();
    const results = await this.db.batch<SessionRow>([
      {
        sql: `UPDATE pilot_invites SET status = 'claimed', claimed_at = ?
              WHERE token_hash = ? AND status = 'issued' AND expires_at > ?`,
        params: [nowIso, tokenHash, nowIso],
      },
      {
        sql: `UPDATE licenses
              SET status = 'active', activated_at = ?,
                  expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', ?, '+' || duration_days || ' days')
              WHERE id = (SELECT license_id FROM pilot_invites WHERE token_hash = ? AND status = 'claimed' AND claimed_at = ?)
                AND status = 'issued'`,
        params: [nowIso, nowIso, tokenHash, nowIso],
      },
      {
        sql: `INSERT INTO sessions(token_hash, account_id, created_at, expires_at)
              SELECT ?, account_id, ?, ? FROM pilot_invites
              WHERE token_hash = ? AND status = 'claimed' AND claimed_at = ?`,
        params: [sessionHash, nowIso, sessionExpiresAt, tokenHash, nowIso],
      },
      {
        sql: `SELECT i.account_id, s.expires_at, w.balance, w.reserved, 'manual' AS source
              FROM pilot_invites i
              JOIN sessions s ON s.account_id = i.account_id AND s.token_hash = ?
              JOIN wallets w ON w.account_id = i.account_id
              WHERE i.token_hash = ? AND i.claimed_at = ? LIMIT 1`,
        params: [sessionHash, tokenHash, nowIso],
      },
    ]);
    const session = results.at(-1)?.results?.[0];
    if (!session) throw new CommerceRepositoryError("INVALID_LICENSE");
    return {
      sessionToken,
      sessionExpiresAt,
      balance: session.balance,
      available: session.balance - session.reserved,
      source: session.source,
    };
  }

  async deleteSession(sessionToken: string) {
    if (!sessionToken || sessionToken.length > 128) return;
    await this.db.query("DELETE FROM sessions WHERE token_hash = ?", [hashSessionToken(this.pepper, sessionToken)]);
  }

  async exportAccount(accountId: string) {
    const [wallet, licenses, ledger] = await this.db.batch<Record<string, unknown>>([
      { sql: "SELECT balance, reserved, updated_at FROM wallets WHERE account_id = ?", params: [accountId] },
      {
        sql: `SELECT source, product_sku, boost_grant, grants_access, status, created_at, activated_at, expires_at
              FROM licenses WHERE account_id = ? ORDER BY created_at DESC`,
        params: [accountId],
      },
      {
        sql: `SELECT type, amount, operation_id, created_at FROM ledger_entries
              WHERE account_id = ? ORDER BY created_at DESC LIMIT 1000`,
        params: [accountId],
      },
    ]);
    return {
      exportedAt: new Date().toISOString(),
      wallet: wallet.results?.[0] ?? null,
      licenses: licenses.results ?? [],
      ledger: ledger.results ?? [],
    };
  }

  async deleteAccount(accountId: string) {
    const now = new Date().toISOString();
    await this.db.batch([
      {
        sql: "UPDATE licenses SET status = 'revoked', revoked_at = ? WHERE account_id = ? AND status = 'active'",
        params: [now, accountId],
      },
      { sql: "DELETE FROM sessions WHERE account_id = ?", params: [accountId] },
      { sql: "DELETE FROM accounts WHERE id = ?", params: [accountId] },
    ]);
  }

  async reserveMission(accountId: string, operationId: string, cost: number) {
    const now = new Date().toISOString();
    const staleBefore = new Date(Date.now() - 15 * 60 * 1_000).toISOString();
    try {
      await this.db.query(
        "UPDATE wallet_operations SET status = 'released', updated_at = ? WHERE account_id = ? AND status = 'reserved' AND created_at < ?",
        [now, accountId, staleBefore],
      );
      await this.db.query(
        `INSERT OR IGNORE INTO wallet_operations(operation_id, account_id, cost, status, created_at, updated_at)
         VALUES (?, ?, ?, 'reserved', ?, ?)`,
        [operationId, accountId, cost, now, now],
      );
    } catch (error) {
      if (error instanceof D1Error && error.detailCode === "INSUFFICIENT_BOOSTS") {
        throw new CommerceRepositoryError("INSUFFICIENT_BOOSTS");
      }
      throw error;
    }
    const operation = await this.operation(operationId);
    if (!operation || operation.account_id !== accountId || operation.cost !== cost) {
      throw new CommerceRepositoryError("OPERATION_CONFLICT");
    }
    return operation;
  }

  async settleMission(operationId: string) {
    await this.db.query(
      "UPDATE wallet_operations SET status = 'settled', updated_at = ? WHERE operation_id = ? AND status = 'reserved'",
      [new Date().toISOString(), operationId],
    );
    const operation = await this.operation(operationId);
    if (!operation || operation.status !== "settled") throw new CommerceRepositoryError("OPERATION_CONFLICT");
    return operation;
  }

  async releaseMission(operationId: string) {
    await this.db.query(
      "UPDATE wallet_operations SET status = 'released', updated_at = ? WHERE operation_id = ? AND status = 'reserved'",
      [new Date().toISOString(), operationId],
    );
    return this.operation(operationId);
  }

  async consumeRateLimit(bucketKey: string, limit: number, windowMs: number, now = Date.now()) {
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const expiresAt = windowStart + windowMs * 2;
    const results = await this.db.batch<{ request_count: number }>([
      { sql: "DELETE FROM rate_limit_buckets WHERE expires_at < ?", params: [now] },
      {
        sql: `INSERT INTO rate_limit_buckets(bucket_key, window_start, request_count, expires_at)
              VALUES (?, ?, 1, ?)
              ON CONFLICT(bucket_key, window_start) DO UPDATE SET request_count = request_count + 1`,
        params: [bucketKey, windowStart, expiresAt],
      },
      { sql: "SELECT request_count FROM rate_limit_buckets WHERE bucket_key = ? AND window_start = ?", params: [bucketKey, windowStart] },
    ]);
    const count = results.at(-1)?.results?.[0]?.request_count ?? limit + 1;
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1_000)),
    };
  }

  private async operation(operationId: string) {
    const result = await this.db.query<OperationRow>(
      `SELECT o.operation_id, o.account_id, o.cost, o.status, w.balance, w.reserved
       FROM wallet_operations o JOIN wallets w ON w.account_id = o.account_id
       WHERE o.operation_id = ? LIMIT 1`,
      [operationId],
    );
    return result.results?.[0] ?? null;
  }
}
