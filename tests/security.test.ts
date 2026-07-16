import assert from "node:assert/strict";
import test from "node:test";
import { assertSameOrigin, getClientAddress, normalizeUserText, readJsonBody, SecureRequestError } from "../lib/security/http.ts";
import { clearRateLimitsForTests, consumeRateLimit, hashRateLimitKey } from "../lib/security/rate-limit.ts";

test("same-origin requests are accepted and cross-origin requests are rejected", () => {
  assert.doesNotThrow(() => assertSameOrigin(new Request("https://app.immoboost.ai/api/chat", { headers: { origin: "https://app.immoboost.ai" } })));
  assert.throws(
    () => assertSameOrigin(new Request("https://app.immoboost.ai/api/chat", { headers: { origin: "https://attacker.example" } })),
    (error) => error instanceof SecureRequestError && error.status === 403,
  );
});

test("JSON parsing enforces content type and byte limit", async () => {
  const valid = new Request("https://app.immoboost.ai/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "Une visite demain" }),
  });
  assert.deepEqual(await readJsonBody(valid, 100), { question: "Une visite demain" });

  const oversized = new Request("https://app.immoboost.ai/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "x".repeat(100) }),
  });
  await assert.rejects(() => readJsonBody(oversized, 20), (error) => error instanceof SecureRequestError && error.status === 413);
});

test("control characters are removed from user text", () => {
  assert.equal(normalizeUserText("  Offre\u0000  demain  "), "Offre  demain");
});

test("Cloudflare client address has priority", () => {
  const request = new Request("https://app.immoboost.ai", {
    headers: { "cf-connecting-ip": "203.0.113.4", "x-forwarded-for": "198.51.100.8" },
  });
  assert.equal(getClientAddress(request), "203.0.113.4");
});

test("rate limits fail closed after the configured allowance", () => {
  clearRateLimitsForTests();
  const key = hashRateLimitKey("203.0.113.4");
  assert.equal(consumeRateLimit(key, { limit: 2, windowMs: 60_000, now: 1 }).allowed, true);
  assert.equal(consumeRateLimit(key, { limit: 2, windowMs: 60_000, now: 2 }).allowed, true);
  assert.equal(consumeRateLimit(key, { limit: 2, windowMs: 60_000, now: 3 }).allowed, false);
});
