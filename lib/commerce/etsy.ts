import { grantForQuantity, parseProductCatalog, ProductCatalogError, type ProductGrant } from "./catalog";

type EtsyReceipt = {
  receipt_id?: number | string;
  buyer_email?: string;
  email?: string;
  transactions?: Array<{ listing_id?: number | string; quantity?: number }>;
};

function assertEtsyResourceUrl(value: string, shopId: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !["api.etsy.com", "openapi.etsy.com"].includes(url.hostname)) throw new Error("INVALID_ETSY_RESOURCE");
  const match = url.pathname.match(/^\/v3\/application\/shops\/(\d+)\/receipts\/(\d+)\/?$/);
  if (!match || match[1] !== shopId) throw new Error("INVALID_ETSY_RESOURCE");
  return { url: url.toString(), receiptId: match[2] };
}

async function etsyAccessToken(env = process.env) {
  if (env.ETSY_ACCESS_TOKEN?.trim()) return env.ETSY_ACCESS_TOKEN.trim();
  const key = env.ETSY_API_KEY?.trim() ?? "";
  const refreshToken = env.ETSY_REFRESH_TOKEN?.trim() ?? "";
  if (!key || !refreshToken) throw new Error("ETSY_NOT_CONFIGURED");
  const response = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: key, refresh_token: refreshToken }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const payload = await response.json().catch(() => null) as { access_token?: string } | null;
  if (!response.ok || !payload?.access_token) throw new Error("ETSY_TOKEN_FAILED");
  return payload.access_token;
}

export async function fetchEtsyOrder(resourceUrl: string, shopIdFromWebhook: string, env = process.env) {
  const shopId = env.ETSY_SHOP_ID?.trim() ?? "";
  const apiKey = env.ETSY_API_KEY?.trim() ?? "";
  const sharedSecret = env.ETSY_SHARED_SECRET?.trim() ?? "";
  if (!/^\d+$/.test(shopId) || shopId !== shopIdFromWebhook || !apiKey || !sharedSecret) throw new Error("ETSY_NOT_CONFIGURED");
  const resource = assertEtsyResourceUrl(resourceUrl, shopId);
  const response = await fetch(resource.url, {
    headers: {
      Authorization: `Bearer ${await etsyAccessToken(env)}`,
      "x-api-key": `${apiKey}:${sharedSecret}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const receipt = await response.json().catch(() => null) as EtsyReceipt | null;
  if (!response.ok || !receipt) throw new Error("ETSY_RECEIPT_FAILED");
  const orderReference = String(receipt.receipt_id ?? resource.receiptId);
  const purchaserEmail = receipt.buyer_email ?? receipt.email ?? "";
  if (!purchaserEmail || orderReference !== resource.receiptId) throw new Error("INVALID_ETSY_RECEIPT");

  const catalog = parseProductCatalog(env.ETSY_PRODUCT_CATALOG);
  const grants = (receipt.transactions ?? []).flatMap((transaction) => {
    const grant = catalog.get(String(transaction.listing_id ?? ""));
    if (!grant) return [];
    const quantity = transaction.quantity == null ? 1 : Number(transaction.quantity);
    return [{ grant: grantForQuantity(grant, quantity) }];
  });
  if (!grants.length) return { orderReference, purchaserEmail, product: null };
  const totalBoosts = grants.reduce((total, item) => total + item.grant.boosts, 0);
  if (!Number.isSafeInteger(totalBoosts) || totalBoosts > 100_000) {
    throw new ProductCatalogError("Order grant exceeds the safety limit");
  }
  const product: ProductGrant = {
    sku: grants.length === 1 ? grants[0].grant.sku : "etsy_bundle",
    boosts: totalBoosts,
    grantsAccess: grants.some((item) => item.grant.grantsAccess),
    durationDays: grants.every((item) => item.grant.durationDays === grants[0].grant.durationDays) ? grants[0].grant.durationDays : null,
  };
  return { orderReference, purchaserEmail, product };
}

export function etsyReceiptIdFromResource(resourceUrl: string, shopId: string) {
  return assertEtsyResourceUrl(resourceUrl, shopId).receiptId;
}
