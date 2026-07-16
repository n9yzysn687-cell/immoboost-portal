import { NextResponse } from "next/server";
import { requireCommerceRepository } from "../../../../lib/commerce/config";
import { sha256Hex, verifyLemonSignature } from "../../../../lib/commerce/crypto";
import { parseLemonEvent } from "../../../../lib/commerce/lemon";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return new Response(null, { status: 415 });
  }
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 256_000) return new Response(null, { status: 413 });
  const signature = request.headers.get("x-signature") ?? "";
  const headerEventName = request.headers.get("x-event-name") ?? "";
  try {
    verifyLemonSignature(rawBody, signature, process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "");
  } catch {
    return new Response(null, { status: 401 });
  }

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(rawBody);
  } catch {
    return new Response(null, { status: 400 });
  }

  const repository = requireCommerceRepository();
  try {
    const event = parseLemonEvent(rawPayload, headerEventName);
    const state = await repository.recordEvent("lemon", event.eventId, event.eventName, sha256Hex(rawBody));
    if (state === "processed" || state === "ignored") return NextResponse.json({ received: true });

    if (["order_created", "subscription_payment_success"].includes(event.eventName)) {
      if (!event.product || !event.purchaserEmail) {
        await repository.completeEvent("lemon", event.eventId, "ignored");
        return NextResponse.json({ received: true });
      }
      await repository.issueLicense({
        source: "lemon",
        orderReference: event.orderReference,
        purchaserEmail: event.purchaserEmail,
        product: event.product,
      });
      await repository.applyLicenseToExistingAccount("lemon", event.orderReference, event.purchaserEmail);
      await repository.completeEvent("lemon", event.eventId, "processed");
      return NextResponse.json({ received: true });
    }

    if (["order_refunded", "subscription_expired"].includes(event.eventName)) {
      await repository.revokeLicense("lemon", event.orderReference, "refunded");
      await repository.completeEvent("lemon", event.eventId, "processed");
      return NextResponse.json({ received: true });
    }

    await repository.completeEvent("lemon", event.eventId, "ignored");
    return NextResponse.json({ received: true });
  } catch {
    return new Response(null, { status: 503 });
  }
}
