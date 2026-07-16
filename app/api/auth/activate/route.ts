import { NextResponse } from "next/server";
import { commerceMode, requireCommerceRepository } from "../../../../lib/commerce/config";
import type { CommerceSource } from "../../../../lib/commerce/catalog";
import { CommerceRepositoryError } from "../../../../lib/commerce/repository";
import { setSessionCookie } from "../../../../lib/commerce/session";
import { CommerceSecurityError } from "../../../../lib/commerce/crypto";
import { rechargeUrl, subscriptionUrl } from "../../../../lib/commerce/recharge";
import { assertSameOrigin, getClientAddress, readJsonBody } from "../../../../lib/security/http";
import { hashRateLimitKey } from "../../../../lib/security/rate-limit";

export const runtime = "nodejs";

const SOURCES = new Set<CommerceSource>(["etsy", "lemon", "manual"]);

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (commerceMode() !== "enforced") {
      return NextResponse.json({ error: "L’activation est désactivée sur cette preview." }, { status: 409 });
    }
    const repository = requireCommerceRepository();
    const rateLimit = await repository.consumeRateLimit(
      `activate:${hashRateLimitKey(getClientAddress(request), process.env.AUTH_PEPPER)}`,
      6,
      15 * 60 * 1_000,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const body = await readJsonBody(request, 2_000);
    const source = typeof body.source === "string" ? body.source.toLowerCase() as CommerceSource : "etsy";
    const orderReference = typeof body.orderReference === "string" ? body.orderReference : "";
    const email = typeof body.email === "string" ? body.email : "";
    if (!SOURCES.has(source) || !orderReference || !email) {
      return NextResponse.json({ error: "Vérifiez l’email et la référence de commande." }, { status: 400 });
    }

    const activation = await repository.activateLicense(source, orderReference, email);
    const response = NextResponse.json({
      authenticated: true,
      balance: activation.balance,
      available: activation.available,
      product: activation.productSku,
      canRecharge: Boolean(rechargeUrl(source)),
      canSubscribe: Boolean(subscriptionUrl(source)),
    });
    response.headers.set("Cache-Control", "no-store");
    setSessionCookie(response, activation.sessionToken, activation.sessionExpiresAt);
    return response;
  } catch (error) {
    const invalidInput = (error instanceof CommerceRepositoryError && error.code === "INVALID_LICENSE")
      || (error instanceof CommerceSecurityError && error.code === "INVALID_EMAIL")
      || error instanceof TypeError;
    const status = invalidInput ? 401 : 503;
    return NextResponse.json(
      { error: status === 401 ? "Commande introuvable ou déjà associée à un autre compte." : "Activation momentanément indisponible." },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
