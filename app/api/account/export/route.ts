import { NextResponse } from "next/server";
import { requireCommerceRepository } from "../../../../lib/commerce/config";
import { sessionFromRequest } from "../../../../lib/commerce/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const repository = requireCommerceRepository();
    const session = await sessionFromRequest(request, repository);
    if (!session) return NextResponse.json({ error: "Accès requis." }, { status: 401 });
    const response = NextResponse.json(await repository.exportAccount(session.accountId));
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Content-Disposition", `attachment; filename="immoboost-export-${new Date().toISOString().slice(0, 10)}.json"`);
    return response;
  } catch {
    return NextResponse.json({ error: "Export momentanément indisponible." }, { status: 503 });
  }
}

