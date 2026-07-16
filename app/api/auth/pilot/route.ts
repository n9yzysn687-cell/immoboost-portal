import { NextResponse } from "next/server";
import { requireCommerceRepository } from "../../../../lib/commerce/config";
import { CommerceRepositoryError } from "../../../../lib/commerce/repository";
import { setSessionCookie } from "../../../../lib/commerce/session";
import { rechargeUrl, subscriptionUrl } from "../../../../lib/commerce/recharge";
import { assertSameOrigin, readJsonBody } from "../../../../lib/security/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJsonBody(request, 1_000);
    const token = typeof body.token === "string" ? body.token : "";
    const activation = await requireCommerceRepository().claimPilotInvite(token);
    const response = NextResponse.json({
      authenticated: true,
      balance: activation.balance,
      available: activation.available,
      source: activation.source,
      canRecharge: Boolean(rechargeUrl(activation.source)),
      canSubscribe: Boolean(subscriptionUrl(activation.source)),
    });
    response.headers.set("Cache-Control", "no-store");
    setSessionCookie(response, activation.sessionToken, activation.sessionExpiresAt);
    return response;
  } catch (error) {
    const status = error instanceof CommerceRepositoryError && error.code === "INVALID_LICENSE" ? 401 : 503;
    return NextResponse.json(
      { error: status === 401 ? "Ce lien pilote est invalide, expiré ou déjà utilisé." : "Activation pilote momentanément indisponible." },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
