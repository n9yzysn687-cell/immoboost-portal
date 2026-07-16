import { NextResponse } from "next/server";
import { requireCommerceRepository } from "../../../../lib/commerce/config";
import { clearSessionCookie, sessionFromRequest } from "../../../../lib/commerce/session";
import { assertSameOrigin, readJsonBody } from "../../../../lib/security/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJsonBody(request, 500);
    if (body.confirmation !== "SUPPRIMER") {
      return NextResponse.json({ error: "Confirmation requise." }, { status: 400 });
    }
    const repository = requireCommerceRepository();
    const session = await sessionFromRequest(request, repository);
    if (!session) return NextResponse.json({ error: "Accès requis." }, { status: 401 });
    await repository.deleteAccount(session.accountId);
    const response = NextResponse.json({ deleted: true });
    response.headers.set("Cache-Control", "no-store");
    clearSessionCookie(response);
    return response;
  } catch {
    return NextResponse.json({ error: "Suppression momentanément indisponible." }, { status: 503 });
  }
}

