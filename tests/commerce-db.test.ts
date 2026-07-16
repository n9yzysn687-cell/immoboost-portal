import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0001_commerce.sql", import.meta.url), "utf8"));
  db.prepare("INSERT INTO accounts(id, email_hash, country_code, created_at) VALUES (?, ?, ?, ?)")
    .run("account-1", "email-hash", "BE", "2026-07-17T10:00:00.000Z");
  db.prepare(`INSERT INTO licenses(
    id, source, order_reference_hash, purchaser_email_hash, product_sku, boost_grant,
    grants_access, duration_days, status, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run("license-1", "etsy", "order-hash", "email-hash", "launch", 10, 1, null, "issued", "2026-07-17T10:00:00.000Z");
  db.prepare("UPDATE licenses SET status = 'active', account_id = ?, activated_at = ? WHERE id = ?")
    .run("account-1", "2026-07-17T10:01:00.000Z", "license-1");
  return db;
}

test("license activation grants Boosts exactly once", () => {
  const db = database();
  assert.deepEqual({ ...db.prepare("SELECT balance, reserved FROM wallets WHERE account_id = ?").get("account-1") }, { balance: 10, reserved: 0 });
  db.prepare("UPDATE licenses SET status = 'active' WHERE id = ?").run("license-1");
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM ledger_entries WHERE type = 'grant'").get() as { count: number }).count, 1);
  assert.equal((db.prepare("SELECT balance FROM wallets WHERE account_id = ?").get("account-1") as { balance: number }).balance, 10);
  db.close();
});

test("wallet triggers reserve, settle and prevent double debit", () => {
  const db = database();
  const reserve = db.prepare(`INSERT OR IGNORE INTO wallet_operations(operation_id, account_id, cost, status, created_at, updated_at)
    VALUES (?, ?, ?, 'reserved', ?, ?)`);
  reserve.run("mission-1", "account-1", 3, "2026-07-17T10:02:00.000Z", "2026-07-17T10:02:00.000Z");
  reserve.run("mission-1", "account-1", 3, "2026-07-17T10:02:00.000Z", "2026-07-17T10:02:00.000Z");
  assert.deepEqual({ ...db.prepare("SELECT balance, reserved FROM wallets WHERE account_id = ?").get("account-1") }, { balance: 10, reserved: 3 });

  const settle = db.prepare("UPDATE wallet_operations SET status = 'settled', updated_at = ? WHERE operation_id = ? AND status = 'reserved'");
  settle.run("2026-07-17T10:03:00.000Z", "mission-1");
  settle.run("2026-07-17T10:03:01.000Z", "mission-1");
  assert.deepEqual({ ...db.prepare("SELECT balance, reserved FROM wallets WHERE account_id = ?").get("account-1") }, { balance: 7, reserved: 0 });
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM ledger_entries WHERE type = 'debit'").get() as { count: number }).count, 1);
  assert.throws(() => reserve.run("mission-2", "account-1", 8, "2026-07-17T10:04:00.000Z", "2026-07-17T10:04:00.000Z"), /INSUFFICIENT_BOOSTS/);
  db.close();
});

test("refunds revoke only the unspent part and never create a negative balance", () => {
  const db = database();
  db.prepare(`INSERT INTO wallet_operations(operation_id, account_id, cost, status, created_at, updated_at)
    VALUES (?, ?, ?, 'reserved', ?, ?)`)
    .run("mission-1", "account-1", 3, "2026-07-17T10:02:00.000Z", "2026-07-17T10:02:00.000Z");
  db.prepare("UPDATE wallet_operations SET status = 'settled', updated_at = ? WHERE operation_id = ?")
    .run("2026-07-17T10:03:00.000Z", "mission-1");
  db.prepare("UPDATE licenses SET status = 'refunded', revoked_at = ? WHERE id = ?")
    .run("2026-07-17T10:04:00.000Z", "license-1");
  assert.equal((db.prepare("SELECT balance FROM wallets WHERE account_id = ?").get("account-1") as { balance: number }).balance, 0);
  assert.equal((db.prepare("SELECT amount FROM ledger_entries WHERE type = 'refund'").get() as { amount: number }).amount, -7);
  db.close();
});

test("refund processing releases pending missions before removing the remaining grant", () => {
  const db = database();
  db.prepare(`INSERT INTO wallet_operations(operation_id, account_id, cost, status, created_at, updated_at)
    VALUES (?, ?, ?, 'reserved', ?, ?)`)
    .run("mission-pending", "account-1", 3, "2026-07-17T10:02:00.000Z", "2026-07-17T10:02:00.000Z");
  db.prepare("UPDATE wallet_operations SET status = 'released', updated_at = ? WHERE account_id = ? AND status = 'reserved'")
    .run("2026-07-17T10:03:00.000Z", "account-1");
  db.prepare("UPDATE licenses SET status = 'refunded', revoked_at = ? WHERE id = ?")
    .run("2026-07-17T10:04:00.000Z", "license-1");
  assert.deepEqual(
    { ...db.prepare("SELECT balance, reserved FROM wallets WHERE account_id = ?").get("account-1") },
    { balance: 0, reserved: 0 },
  );
  db.close();
});

test("a pilot invite can activate its grant only once", () => {
  const db = database();
  db.prepare(`INSERT INTO licenses(
    id, source, order_reference_hash, purchaser_email_hash, product_sku, boost_grant,
    grants_access, duration_days, status, account_id, created_at
  ) VALUES (?, 'manual', ?, ?, 'pilot-be', 5, 1, 14, 'issued', ?, ?)`)
    .run("pilot-license", "pilot-order", "pilot-email", "account-1", "2026-07-17T10:05:00.000Z");
  db.prepare(`INSERT INTO pilot_invites(token_hash, account_id, license_id, status, created_at, expires_at)
    VALUES (?, ?, ?, 'issued', ?, ?)`)
    .run("pilot-token", "account-1", "pilot-license", "2026-07-17T10:05:00.000Z", "2026-07-24T10:05:00.000Z");
  const claim = db.prepare(`UPDATE pilot_invites SET status = 'claimed', claimed_at = ?
    WHERE token_hash = ? AND status = 'issued' AND expires_at > ?`);
  assert.equal(claim.run("2026-07-17T10:06:00.000Z", "pilot-token", "2026-07-17T10:06:00.000Z").changes, 1);
  db.prepare("UPDATE licenses SET status = 'active', activated_at = ? WHERE id = ? AND status = 'issued'")
    .run("2026-07-17T10:06:00.000Z", "pilot-license");
  assert.equal(claim.run("2026-07-17T10:07:00.000Z", "pilot-token", "2026-07-17T10:07:00.000Z").changes, 0);
  assert.equal((db.prepare("SELECT balance FROM wallets WHERE account_id = ?").get("account-1") as { balance: number }).balance, 15);
  db.close();
});
