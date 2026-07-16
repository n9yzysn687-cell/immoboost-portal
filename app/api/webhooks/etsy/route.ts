import { NextResponse } from "next/server";
import { requireCommerceRepository } from "../../../../lib/commerce/config";
import { verifyEtsySignature, sha256Hex } from "../../../../lib/commerce/crypto";
import { etsyReceiptIdFromResource, fetchEtsyOrder } from "../../../../lib/commerce/etsy";

export const runtime = "nodejs";

type EtsyWebhook = { event_type?: string; resource_url?: string; shop_id?: string | number };

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return new Response(null, { status: 415 });
  }
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 64_000) return new Response(null, { status: 413 });

  const eventId = request.headers.get("webhook-id")?.slice(0, 128) ?? "";
  const timestamp = request.headers.get("webhook-timestamp") ?? "";
  const signature = request.headers.get("webhook-signature") ?? "";
  const secret = process.env.ETSY_WEBHOOK_SECRET ?? "";
  if (!eventId || !timestamp || !signature || !secret) return new Response(null, { status: 401 });

  try {
    verifyEtsySignature({ rawBody, webhookId: eventId, timestamp, signatureHeader: signature, secret });
  } catch {
    return new Response(null, { status: 401 });
  }

  let payload: EtsyWebhook;
  try {
    payload = JSON.parse(rawBody) as EtsyWebhook;
  } catch {
    return new Response(null, { status: 400 });
  }

  const eventType = typeof payload.event_type === "string" ? payload.event_type : "";
  const resourceUrl = typeof payload.resource_url === "string" ? payload.resource_url : "";
  const shopId = String(payload.shop_id ?? "");
  const repository = requireCommerceRepository();

  try {
    const state = await repository.recordEvent("etsy", eventId, eventType, sha256Hex(rawBody));
    if (state === "processed" || state === "ignored") return NextResponse.json({ received: true });

    if (eventType === "order.paid") {
      const order = await fetchEtsyOrder(resourceUrl, shopId);
      if (!order.product) {
        await repository.completeEvent("etsy", eventId, "ignored");
        return NextResponse.json({ received: true });
      }
      await repository.issueLicense({
        source: "etsy",
        orderReference: order.orderReference,
        purchaserEmail: order.purchaserEmail,
        product: order.product,
      });
      await repository.applyLicenseToExistingAccount("etsy", order.orderReference, order.purchaserEmail);
      await repository.completeEvent("etsy", eventId, "processed");
      return NextResponse.json({ received: true });
    }

    if (eventType === "order.canceled") {
      const configuredShop = process.env.ETSY_SHOP_ID?.trim() ?? "";
      if (shopId !== configuredShop) throw new Error("INVALID_ETSY_SHOP");
      const orderReference = etsyReceiptIdFromResource(resourceUrl, configuredShop);
      await repository.revokeLicense("etsy", orderReference, "revoked");
      await repository.completeEvent("etsy", eventId, "processed");
      return NextResponse.json({ received: true });
    }

    await repository.completeEvent("etsy", eventId, "ignored");
    return NextResponse.json({ received: true });
  } catch {
    await repository.completeEvent("etsy", eventId, "failed").catch(() => undefined);
    return new Response(null, { status: 503 });
  }
}
