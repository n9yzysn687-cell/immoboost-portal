import { requireCommerceRepository } from "../../../../lib/commerce/config";
import { rechargeUrl } from "../../../../lib/commerce/recharge";
import { sessionFromRequest } from "../../../../lib/commerce/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const repository = requireCommerceRepository();
    const session = await sessionFromRequest(request, repository);
    if (!session) return Response.redirect(new URL("/?access=required", request.url), 303);
    const target = rechargeUrl(session.source);
    if (!target) return Response.redirect(new URL("/?recharge=unavailable", request.url), 303);
    return Response.redirect(target, 303);
  } catch {
    return Response.redirect(new URL("/?recharge=unavailable", request.url), 303);
  }
}
