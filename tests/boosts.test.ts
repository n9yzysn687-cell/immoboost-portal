import assert from "node:assert/strict";
import test from "node:test";
import { BoostWalletError, InMemoryBoostLedger, estimateMissionBoosts } from "../lib/billing/boosts.ts";

test("a grant is idempotent", () => {
  const ledger = new InMemoryBoostLedger();
  assert.equal(ledger.grant("wallet-1", 300, "sale-1"), 300);
  assert.equal(ledger.grant("wallet-1", 300, "sale-1"), 300);
  assert.equal(ledger.history("wallet-1").filter((entry) => entry.type === "grant").length, 1);
});

test("a mission is charged once after settlement", () => {
  const ledger = new InMemoryBoostLedger();
  ledger.grant("wallet-1", 300, "sale-1");
  assert.equal(ledger.reserve("wallet-1", 3, "mission-1"), "reserved");
  assert.equal(ledger.reserve("wallet-1", 3, "mission-1"), "reserved");
  assert.equal(ledger.settle("mission-1"), 297);
  assert.equal(ledger.settle("mission-1"), 297);
  assert.equal(ledger.history("wallet-1").filter((entry) => entry.type === "debit").length, 1);
});

test("a failed mission releases its reservation without a debit", () => {
  const ledger = new InMemoryBoostLedger();
  ledger.grant("wallet-1", 10, "sale-1");
  ledger.reserve("wallet-1", 3, "mission-1");
  assert.equal(ledger.release("mission-1"), 10);
  assert.equal(ledger.release("mission-1"), 10);
  assert.equal(ledger.history("wallet-1").some((entry) => entry.type === "debit"), false);
});

test("reservations cannot overspend the wallet", () => {
  const ledger = new InMemoryBoostLedger();
  ledger.grant("wallet-1", 3, "sale-1");
  ledger.reserve("wallet-1", 3, "mission-1");
  assert.throws(
    () => ledger.reserve("wallet-1", 1, "mission-2"),
    (error) => error instanceof BoostWalletError && error.code === "INSUFFICIENT_BOOSTS",
  );
});

test("mission pricing is stable and independent from provider tokens", () => {
  assert.equal(estimateMissionBoosts({ hasImage: false, needsOfficialSources: false }), 1);
  assert.equal(estimateMissionBoosts({ hasImage: true, needsOfficialSources: false }), 3);
  assert.equal(estimateMissionBoosts({ hasImage: false, needsOfficialSources: true }), 3);
});
