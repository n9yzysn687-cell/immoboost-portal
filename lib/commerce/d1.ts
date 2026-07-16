export type D1Value = string | number | null;
export type D1Statement = { sql: string; params?: D1Value[] };

export type D1Result<T> = {
  success: boolean;
  results?: T[];
  meta?: { changes?: number };
};

export interface D1Client {
  query<T extends Record<string, unknown>>(sql: string, params?: D1Value[]): Promise<D1Result<T>>;
  batch<T extends Record<string, unknown>>(statements: D1Statement[]): Promise<Array<D1Result<T>>>;
}

export type D1PreparedStatementLike = {
  bind(...values: D1Value[]): D1PreparedStatementLike;
  all<T extends Record<string, unknown>>(): Promise<D1Result<T>>;
};

export type D1DatabaseLike = {
  prepare(sql: string): D1PreparedStatementLike;
  batch<T extends Record<string, unknown>>(statements: D1PreparedStatementLike[]): Promise<Array<D1Result<T>>>;
};

type D1Envelope<T> = {
  success: boolean;
  result?: Array<D1Result<T>>;
  errors?: Array<{ code?: number; message?: string }>;
};

export class D1Error extends Error {
  readonly kind: "configuration" | "unavailable" | "query";
  readonly detailCode: "INSUFFICIENT_BOOSTS" | null;

  constructor(
    kind: "configuration" | "unavailable" | "query",
    message: string = kind,
    detailCode: "INSUFFICIENT_BOOSTS" | null = null,
  ) {
    super(message);
    this.name = "D1Error";
    this.kind = kind;
    this.detailCode = detailCode;
  }
}

export type D1Config = {
  accountId: string;
  databaseId: string;
  apiToken: string;
};

export function d1ConfigFromEnv(env: Record<string, string | undefined> = process.env): D1Config | null {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "";
  const databaseId = env.CLOUDFLARE_D1_DATABASE_ID?.trim() ?? "";
  const apiToken = env.CLOUDFLARE_D1_API_TOKEN?.trim() ?? "";
  if (!accountId && !databaseId && !apiToken) return null;
  if (!accountId || !databaseId || !apiToken) throw new D1Error("configuration");
  if (!/^[a-f0-9]{32}$/i.test(accountId) || !/^[a-f0-9-]{32,36}$/i.test(databaseId) || apiToken.length < 32) {
    throw new D1Error("configuration");
  }
  return { accountId, databaseId, apiToken };
}

function d1Failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return new D1Error(
    "query",
    "D1 query failed",
    message.includes("INSUFFICIENT_BOOSTS") ? "INSUFFICIENT_BOOSTS" : null,
  );
}

export class D1BindingClient implements D1Client {
  private readonly database: D1DatabaseLike;

  constructor(database: D1DatabaseLike) {
    this.database = database;
  }

  async query<T extends Record<string, unknown>>(sql: string, params: D1Value[] = []) {
    try {
      const result = await this.database.prepare(sql).bind(...params).all<T>();
      if (!result.success) throw new Error("D1_QUERY_FAILED");
      return result;
    } catch (error) {
      throw d1Failure(error);
    }
  }

  async batch<T extends Record<string, unknown>>(statements: D1Statement[]) {
    if (!statements.length || statements.length > 25) throw new D1Error("query", "Invalid batch size");
    try {
      const prepared = statements.map(({ sql, params = [] }) => this.database.prepare(sql).bind(...params));
      const results = await this.database.batch<T>(prepared);
      if (!results.every((result) => result.success)) throw new Error("D1_BATCH_FAILED");
      return results;
    } catch (error) {
      if (error instanceof D1Error) throw error;
      throw d1Failure(error);
    }
  }
}

export class D1RestClient implements D1Client {
  private readonly endpoint: string;
  private readonly config: D1Config;
  private readonly fetcher: typeof fetch;

  constructor(config: D1Config, fetcher: typeof fetch = fetch) {
    this.config = config;
    this.fetcher = fetcher;
    this.endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`;
  }

  async query<T extends Record<string, unknown>>(sql: string, params: D1Value[] = []) {
    const results = await this.request<T>({ sql, params });
    return results[0] ?? { success: true, results: [] };
  }

  async batch<T extends Record<string, unknown>>(statements: D1Statement[]) {
    if (!statements.length || statements.length > 25) throw new D1Error("query", "Invalid batch size");
    return this.request<T>({ batch: statements });
  }

  private async request<T extends Record<string, unknown>>(body: Record<string, unknown>) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await this.fetcher(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null) as D1Envelope<T> | null;
      if (!response.ok || !payload?.success || !payload.result?.every((result) => result.success)) {
        const code = payload?.errors?.[0]?.code;
        const insufficient = payload?.errors?.some((error) => error.message?.includes("INSUFFICIENT_BOOSTS"));
        throw new D1Error(
          response.status >= 500 || response.status === 429 ? "unavailable" : "query",
          `D1 request failed${code ? ` (${code})` : ""}`,
          insufficient ? "INSUFFICIENT_BOOSTS" : null,
        );
      }
      return payload.result;
    } catch (error) {
      if (error instanceof D1Error) throw error;
      throw new D1Error("unavailable");
    } finally {
      clearTimeout(timeout);
    }
  }
}
