import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { hashEmail, hashOrderReference, normalizeEmail, verifyEtsySignature, verifyLemonSignature } from "../lib/commerce/crypto.ts";

const pepper = "test-pepper-with-at-least-thirty-two-characters";

test("customer identifiers are normalized and stored as keyed hashes", () => {
  assert.equal(normalizeEmail("  Agent@Example.BE "), "agent@example.be");
  assert.equal(hashEmail(pepper, "Agent@Example.BE"), hashEmail(pepper, "agent@example.be"));
  assert.equal(hashOrderReference(pepper, "etsy", " 123-ABC "), hashOrderReference(pepper, "etsy", "123-abc"));
  assert.notEqual(hashOrderReference(pepper, "etsy", "123-abc"), hashOrderReference(pepper, "lemon", "123-abc"));
});

test("Etsy webhook signatures reject tampering and stale replays", () => {
  const key = Buffer.from("a-secure-webhook-signing-key");
  const secret = `whsec_${key.toString("base64")}`;
  const rawBody = JSON.stringify({ event_type: "order.paid" });
  const timestamp = "2000";
  const signature = createHmac("sha256", key).update(`event-1.${timestamp}.${rawBody}`).digest("base64");
  assert.doesNotThrow(() => verifyEtsySignature({ rawBody, webhookId: "event-1", timestamp, signatureHeader: `v1,${signature}`, secret, now: 2_000_000 }));
  assert.throws(() => verifyEtsySignature({ rawBody: `${rawBody} `, webhookId: "event-1", timestamp, signatureHeader: signature, secret, now: 2_000_000 }));
  assert.throws(() => verifyEtsySignature({ rawBody, webhookId: "event-1", timestamp, signatureHeader: signature, secret, now: 3_000_000 }));
});

test("Lemon Squeezy webhooks use timing-safe HMAC verification", () => {
  const body = JSON.stringify({ data: { id: "42" } });
  const secret = "long-test-signing-secret";
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert.doesNotThrow(() => verifyLemonSignature(body, signature, secret));
  assert.throws(() => verifyLemonSignature(`${body} `, signature, secret));
});

