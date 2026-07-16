import { NextResponse } from "next/server";
import { commerceMode, commerceRepositoryFromEnv } from "../../../../lib/commerce/config";
import { sessionFromRequest } from "../../../../lib/commerce/session";
import { rechargeUrl, subscriptionUrl } from "../../../../lib/commerce/recharge";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const mode = commerceMode();
  if (mode === "preview") {
    return NextResponse.json(
      { mode, authenticated: false, balance: null, available: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  const repository = commerceRepositoryFromEnv();
  if (!repository) {
    return NextResponse.json(
      { mode, authenticated: false, error: "SERVICE_NOT_CONFIGURED" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const session = await sessionFromRequest(request, repository).catch(() => null);
  return NextResponse.json(
    session
      ? {
          mode,
          authenticated: true,
          balance: session.balance,
          available: session.available,
          source: session.source,
          canRecharge: Boolean(rechargeUrl(session.source)),
          canSubscribe: Boolean(subscriptionUrl(session.source)),
        }
      : { mode, authenticated: false, balance: 0, available: 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
