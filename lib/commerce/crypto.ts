import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";

export class CommerceSecurityError extends Error {
  readonly code: "CONFIGURATION" | "INVALID_EMAIL" | "INVALID_SIGNATURE" | "EXPIRED_SIGNATURE";

  constructor(code: "CONFIGURATION" | "INVALID_EMAIL" | "INVALID_SIGNATURE" | "EXPIRED_SIGNATURE") {
    super(code);
    this.name = "CommerceSecurityError";
    this.code = code;
  }
}

export function normalizeEmail(value: string) {
  const normalized = value.normalize("NFKC").trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new CommerceSecurityError("INVALID_EMAIL");
  }
  return normalized;
}

export function normalizeOrderReference(value: string) {
  const normalized = value.normalize("NFKC").trim().replace(/\s+/g, "").slice(0, 128);
  if (!/^[A-Za-z0-9_-]{3,128}$/.test(normalized)) throw new TypeError("Invalid order reference");
  return normalized.toLowerCase();
}

export function hmacHex(secret: string, value: string) {
  if (secret.length < 32) throw new CommerceSecurityError("CONFIGURATION");
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashEmail(secret: string, email: string) {
  return hmacHex(secret, `email:${normalizeEmail(email)}`);
}

export function hashOrderReference(secret: string, source: string, orderReference: string) {
  return hmacHex(secret, `order:${source}:${normalizeOrderReference(orderReference)}`);
}

export function hashSessionToken(secret: string, token: string) {
  return hmacHex(secret, `session:${token}`);
}

export function hashPilotToken(secret: string, token: string) {
  return hmacHex(secret, `pilot:${token}`);
}

export function safeEqual(left: string, right: string, encoding: BufferEncoding = "utf8") {
  try {
    const leftBuffer = Buffer.from(left, encoding);
    const rightBuffer = Buffer.from(right, encoding);
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

export function assertFreshTimestamp(timestamp: string, now = Date.now(), toleranceSeconds = 300) {
  const timestampMs = Number(timestamp) * 1_000;
  if (!Number.isFinite(timestampMs) || Math.abs(now - timestampMs) > toleranceSeconds * 1_000) {
    throw new CommerceSecurityError("EXPIRED_SIGNATURE");
  }
}

export function verifyEtsySignature(options: {
  rawBody: string;
  webhookId: string;
  timestamp: string;
  signatureHeader: string;
  secret: string;
  now?: number;
}) {
  assertFreshTimestamp(options.timestamp, options.now);
  if (!options.secret.startsWith("whsec_")) throw new CommerceSecurityError("CONFIGURATION");

  const key = Buffer.from(options.secret.slice(6), "base64");
  if (key.length < 16) throw new CommerceSecurityError("CONFIGURATION");
  const signed = `${options.webhookId}.${options.timestamp}.${options.rawBody}`;
  const expected = createHmac("sha256", key).update(signed, "utf8").digest("base64");
  const candidates = options.signatureHeader
    .split(/\s+/)
    .flatMap((entry) => [entry, entry.split(",").at(-1) ?? ""])
    .filter(Boolean);

  if (!candidates.some((candidate) => safeEqual(candidate, expected))) {
    throw new CommerceSecurityError("INVALID_SIGNATURE");
  }
}

export function verifyLemonSignature(rawBody: string, signature: string, secret: string) {
  if (secret.length < 16) throw new CommerceSecurityError("CONFIGURATION");
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  if (!safeEqual(signature.toLowerCase(), expected, "hex")) {
    throw new CommerceSecurityError("INVALID_SIGNATURE");
  }
}
