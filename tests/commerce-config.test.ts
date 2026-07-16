import assert from "node:assert/strict";
import test from "node:test";
import { commerceMode } from "../lib/commerce/mode.ts";
import {
  D1BindingClient,
  d1ConfigFromEnv,
  D1Error,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
} from "../lib/commerce/d1.ts";

test("production cannot be downgraded to preview mode", () => {
  assert.equal(commerceMode({ VERCEL_ENV: "production", COMMERCE_MODE: "preview" }), "enforced");
  assert.equal(commerceMode({ NODE_ENV: "production", COMMERCE_MODE: "preview" }), "enforced");
  assert.equal(commerceMode({ VERCEL_ENV: "preview" }), "preview");
  assert.equal(commerceMode({ NODE_ENV: "development", COMMERCE_MODE: "preview" }), "preview");
});

test("partial D1 configuration fails closed", () => {
  assert.equal(d1ConfigFromEnv({}), null);
  assert.throws(
    () => d1ConfigFromEnv({ CLOUDFLARE_ACCOUNT_ID: "a".repeat(32) }),
    (error) => error instanceof D1Error && error.kind === "configuration",
  );
});

test("native D1 binding executes parameterized queries and batches", async () => {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const prepare = (sql: string): D1PreparedStatementLike => {
    const call = { sql, params: [] as unknown[] };
    calls.push(call);
    return {
      bind(...values) {
        call.params = values;
        return this;
      },
      async all<T>() {
        return { success: true, results: [{ value: 1 } as T] };
      },
    };
  };
  const database: D1DatabaseLike = {
    prepare,
    async batch<T extends Record<string, unknown>>(statements: D1PreparedStatementLike[]) {
      return Promise.all(statements.map((statement) => statement.all<T>()));
    },
  };
  const client = new D1BindingClient(database);

  const result = await client.query<{ value: number }>("SELECT ? AS value", [1]);
  assert.equal(result.results?.[0]?.value, 1);
  await client.batch([{ sql: "UPDATE wallets SET balance = balance + ?", params: [5] }]);
  assert.deepEqual(calls.map((call) => call.params), [[1], [5]]);
});
