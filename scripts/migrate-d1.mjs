import { readFile } from "node:fs/promises";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID ?? "";
const apiToken = process.env.CLOUDFLARE_D1_API_TOKEN ?? "";

if (!/^[a-f0-9]{32}$/i.test(accountId) || !/^[a-f0-9-]{32,36}$/i.test(databaseId) || apiToken.length < 32) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_D1_API_TOKEN are required.");
}

const sql = await readFile(new URL("../migrations/0001_commerce.sql", import.meta.url), "utf8");
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
    signal: AbortSignal.timeout(20_000),
  },
);
const result = await response.json().catch(() => null);
if (!response.ok || !result?.success || !result?.result?.every((entry) => entry.success)) {
  throw new Error("D1 migration failed. Check the scoped token and database identifiers.");
}
process.stdout.write("D1 migration completed successfully.\n");

