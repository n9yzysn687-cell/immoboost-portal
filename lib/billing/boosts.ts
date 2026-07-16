export type BoostAction = "text_kit" | "complex_analysis" | "verified_research" | "generative_visual";

export const BOOST_COSTS: Record<BoostAction, number> = {
  text_kit: 1,
  complex_analysis: 3,
  verified_research: 3,
  generative_visual: 10,
};

export function estimateMissionBoosts(options: { hasImage: boolean; needsOfficialSources: boolean }) {
  if (options.needsOfficialSources) return BOOST_COSTS.verified_research;
  if (options.hasImage) return BOOST_COSTS.complex_analysis;
  return BOOST_COSTS.text_kit;
}

type OperationState = "reserved" | "settled" | "released";
type Operation = { walletId: string; cost: number; state: OperationState };

export type BoostLedgerEntry = {
  idempotencyKey: string;
  walletId: string;
  type: "grant" | "reserve" | "debit" | "release";
  amount: number;
  createdAt: string;
};

export class BoostWalletError extends Error {
  readonly code: "INSUFFICIENT_BOOSTS" | "OPERATION_CONFLICT" | "UNKNOWN_OPERATION";

  constructor(code: "INSUFFICIENT_BOOSTS" | "OPERATION_CONFLICT" | "UNKNOWN_OPERATION") {
    super(code);
    this.name = "BoostWalletError";
    this.code = code;
  }
}

export class InMemoryBoostLedger {
  private readonly balances = new Map<string, number>();
  private readonly operations = new Map<string, Operation>();
  private readonly grantKeys = new Set<string>();
  private readonly entries: BoostLedgerEntry[] = [];

  grant(walletId: string, amount: number, idempotencyKey: string) {
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new TypeError("Boost grant must be a positive integer");
    if (this.grantKeys.has(idempotencyKey)) return this.balance(walletId);
    this.grantKeys.add(idempotencyKey);
    this.balances.set(walletId, this.balance(walletId) + amount);
    this.record(idempotencyKey, walletId, "grant", amount);
    return this.balance(walletId);
  }

  reserve(walletId: string, cost: number, operationId: string) {
    if (!Number.isSafeInteger(cost) || cost <= 0) throw new TypeError("Boost cost must be a positive integer");
    const existing = this.operations.get(operationId);
    if (existing) {
      if (existing.walletId !== walletId || existing.cost !== cost) throw new BoostWalletError("OPERATION_CONFLICT");
      return existing.state;
    }

    const reserved = [...this.operations.values()]
      .filter((operation) => operation.walletId === walletId && operation.state === "reserved")
      .reduce((total, operation) => total + operation.cost, 0);
    if (this.balance(walletId) - reserved < cost) throw new BoostWalletError("INSUFFICIENT_BOOSTS");

    this.operations.set(operationId, { walletId, cost, state: "reserved" });
    this.record(operationId, walletId, "reserve", cost);
    return "reserved" as const;
  }

  settle(operationId: string) {
    const operation = this.operations.get(operationId);
    if (!operation) throw new BoostWalletError("UNKNOWN_OPERATION");
    if (operation.state === "settled") return this.balance(operation.walletId);
    if (operation.state === "released") throw new BoostWalletError("OPERATION_CONFLICT");

    operation.state = "settled";
    this.balances.set(operation.walletId, this.balance(operation.walletId) - operation.cost);
    this.record(operationId, operation.walletId, "debit", -operation.cost);
    return this.balance(operation.walletId);
  }

  release(operationId: string) {
    const operation = this.operations.get(operationId);
    if (!operation) throw new BoostWalletError("UNKNOWN_OPERATION");
    if (operation.state === "released") return this.balance(operation.walletId);
    if (operation.state === "settled") throw new BoostWalletError("OPERATION_CONFLICT");

    operation.state = "released";
    this.record(operationId, operation.walletId, "release", operation.cost);
    return this.balance(operation.walletId);
  }

  balance(walletId: string) {
    return this.balances.get(walletId) ?? 0;
  }

  history(walletId: string) {
    return this.entries.filter((entry) => entry.walletId === walletId).map((entry) => ({ ...entry }));
  }

  private record(idempotencyKey: string, walletId: string, type: BoostLedgerEntry["type"], amount: number) {
    this.entries.push({ idempotencyKey, walletId, type, amount, createdAt: new Date().toISOString() });
  }
}
