const JSON_CONTENT_TYPE = "application/json";

export class SecureRequestError extends Error {
  readonly status: number;
  readonly publicMessage: string;

  constructor(status: number, publicMessage: string) {
    super(publicMessage);
    this.name = "SecureRequestError";
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

function normalizedOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const expected = new URL(request.url).origin;
  if (normalizedOrigin(origin) !== expected) {
    throw new SecureRequestError(403, "Cette requête n’est pas autorisée.");
  }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith(JSON_CONTENT_TYPE)) {
    throw new SecureRequestError(415, "Le format de la requête n’est pas pris en charge.");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new SecureRequestError(413, "La demande est trop volumineuse.");
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new SecureRequestError(413, "La demande est trop volumineuse.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SecureRequestError(400, "La demande est illisible.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SecureRequestError(400, "La demande est invalide.");
  }
  return parsed as Record<string, unknown>;
}

export function normalizeUserText(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[ \t]{3,}/g, "  ")
    .trim();
}

export function getClientAddress(request: Request) {
  const cloudflare = request.headers.get("cf-connecting-ip");
  if (cloudflare) return cloudflare.trim().slice(0, 64);

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim().slice(0, 64);

  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || "unknown";
}

export function publicErrorResponse(error: unknown) {
  if (error instanceof SecureRequestError) {
    return { status: error.status, message: error.publicMessage };
  }
  return { status: 500, message: "Une erreur inattendue est survenue." };
}
