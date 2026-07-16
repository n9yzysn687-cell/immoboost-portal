import { grantForQuantity, parseProductCatalog, type ProductGrant } from "./catalog";

type LemonPayload = {
  meta?: { event_name?: string };
  data?: {
    id?: string;
    attributes?: Record<string, unknown>;
  };
};

function stringValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function parseLemonEvent(payload: unknown, headerEventName: string, env = process.env) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("INVALID_LEMON_PAYLOAD");
  const data = payload as LemonPayload;
  const eventName = data.meta?.event_name ?? headerEventName;
  if (!eventName || (headerEventName && eventName !== headerEventName)) throw new Error("INVALID_LEMON_EVENT");
  const attributes = data.data?.attributes ?? {};
  const dataId = stringValue(data.data?.id);
  const orderReference = stringValue(attributes.identifier) || dataId;
  const purchaserEmail = stringValue(attributes.user_email) || stringValue(attributes.customer_email);
  const firstItem = attributes.first_order_item && typeof attributes.first_order_item === "object"
    ? attributes.first_order_item as Record<string, unknown>
    : {};
  const variantId = stringValue(firstItem.variant_id) || stringValue(attributes.variant_id);
  const quantity = Number(firstItem.quantity ?? attributes.quantity ?? 1);
  const grant = parseProductCatalog(env.LEMON_PRODUCT_CATALOG).get(variantId);
  const product: ProductGrant | null = grant
    ? grantForQuantity(grant, quantity)
    : null;

  if (!dataId || !orderReference) throw new Error("INVALID_LEMON_EVENT");
  return {
    eventName,
    eventId: `${eventName}:${dataId}`,
    orderReference,
    purchaserEmail,
    product,
  };
}
