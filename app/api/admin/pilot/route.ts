import { NextResponse } from "next/server";
import { requireCommerceRepository } from "../../../../lib/commerce/config";
import { safeEqual } from "../../../../lib/commerce/crypto";
import { assertSameOrigin, getClientAddress, readJsonBody } from "../../../../lib/security/http";
import { hashRateLimitKey } from "../../../../lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const repository = requireCommerceRepository();
    const rateLimit = await repository.consumeRateLimit(
      `pilot-admin:${hashRateLimitKey(getClientAddress(request), process.env.AUTH_PEPPER)}`,
      5,
      15 * 60 * 1_000,
    );
    if (!rateLimit.allowed) return new Response(null, { status: 429 });
    const body = await readJsonBody(request, 1_000);
    const suppliedSecret = typeof body.secret === "string" ? body.secret : "";
    const adminSecret = process.env.PILOT_ADMIN_SECRET ?? "";
    if (adminSecret.length < 32 || !safeEqual(suppliedSecret, adminSecret)) return new Response(null, { status: 401 });
    const email = typeof body.email === "string" ? body.email : "";
    const boosts = Number(body.boosts ?? 10);
    const accessDays = Number(body.accessDays ?? 14);
    const invite = await repository.createPilotInvite(email, boosts, accessDays);
    const url = new URL("/", request.url);
    url.hash = `pilot=${encodeURIComponent(invite.token)}`;
    return NextResponse.json(
      { url: url.toString(), expiresAt: invite.inviteExpiresAt, boosts: invite.boosts, accessDays: invite.accessDays },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Lien pilote indisponible." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const repository = requireCommerceRepository();
    const rateLimit = await repository.consumeRateLimit(
      `pilot-admin:${hashRateLimitKey(getClientAddress(request), process.env.AUTH_PEPPER)}`,
      10,
      15 * 60 * 1_000,
    );
    if (!rateLimit.allowed) return new Response(null, { status: 429 });
    const body = await readJsonBody(request, 1_000);
    const suppliedSecret = typeof body.secret === "string" ? body.secret : "";
    const adminSecret = process.env.PILOT_ADMIN_SECRET ?? "";
    if (adminSecret.length < 32 || !safeEqual(suppliedSecret, adminSecret)) return new Response(null, { status: 401 });
    const token = typeof body.token === "string" ? body.token : "";
    await repository.revokePilotInvite(token);
    return NextResponse.json({ revoked: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Révocation indisponible." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
