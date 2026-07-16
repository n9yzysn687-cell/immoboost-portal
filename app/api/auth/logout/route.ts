import { NextResponse } from "next/server";
import { commerceRepositoryFromEnv } from "../../../../lib/commerce/config";
import { clearSessionCookie, readSessionCookie } from "../../../../lib/commerce/session";
import { assertSameOrigin } from "../../../../lib/security/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Cette requête n’est pas autorisée." }, { status: 403 });
  }
  const token = readSessionCookie(request);
  const repository = commerceRepositoryFromEnv();
  if (token && repository) await repository.deleteSession(token).catch(() => undefined);
  const response = NextResponse.json({ authenticated: false });
  response.headers.set("Cache-Control", "no-store");
  clearSessionCookie(response);
  return response;
}
