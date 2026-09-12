export type AIUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type AIResult = {
  outputText: string;
  model: string;
  usage: AIUsage;
};

export interface AIProvider {
  generateStructured(payload: Record<string, unknown>, requestId: string): Promise<AIResult>;
}

export class AIProviderError extends Error {
  readonly kind: "configuration" | "timeout" | "rate_limit" | "upstream" | "invalid_response";
  readonly status?: number;

  constructor(kind: "configuration" | "timeout" | "rate_limit" | "upstream" | "invalid_response", status?: number) {
    super(kind);
    this.name = "AIProviderError";
    this.kind = kind;
    this.status = status;
  }
}

function extractOutputText(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const response = data as { output_text?: unknown; output?: unknown };
  if (typeof response.output_text === "string") return response.output_text.trim();
  if (!Array.isArray(response.output)) return "";

  const chunks: string[] = [];
  for (const item of response.output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content && typeof content === "object" && "text" in content && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function extractUsage(data: unknown): AIUsage {
  if (!data || typeof data !== "object" || !("usage" in data) || !data.usage || typeof data.usage !== "object") {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }
  const usage = data.usage as Record<string, unknown>;
  const inputTokens = typeof usage.input_tokens === "number" ? usage.input_tokens : 0;
  const outputTokens = typeof usage.output_tokens === "number" ? usage.output_tokens : 0;
  const totalTokens = typeof usage.total_tokens === "number" ? usage.total_tokens : inputTokens + outputTokens;
  return { inputTokens, outputTokens, totalTokens };
}

function retryDelay(response: Response, attempt: number) {
  const retryAfter = Number(response.headers.get("retry-after") ?? "0");
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1_000, 2_000);
  return 300 * (attempt + 1);
}

export class OpenAIResponsesProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(
    apiKey: string,
    model: string,
    timeoutMs = 60_000,
  ) {
    if (!apiKey) throw new AIProviderError("configuration");
    this.apiKey = apiKey;
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async generateStructured(payload: Record<string, unknown>, requestId: string): Promise<AIResult> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response: Response;
      try {
        response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "X-Client-Request-Id": requestId,
          },
          body: JSON.stringify({ ...payload, model: this.model, store: false }),
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (error) {
        if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
          throw new AIProviderError("timeout");
        }
        throw new AIProviderError("upstream");
      }

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
          continue;
        }
        throw new AIProviderError(response.status === 429 ? "rate_limit" : "upstream", response.status);
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new AIProviderError("invalid_response");
      }

      const outputText = extractOutputText(data);
      if (!outputText) throw new AIProviderError("invalid_response");
      return { outputText, model: this.model, usage: extractUsage(data) };
    }

    throw new AIProviderError("upstream");
  }
}
