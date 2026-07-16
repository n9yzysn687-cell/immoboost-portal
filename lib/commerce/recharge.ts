import type { CommerceSource } from "./catalog";

const etsyHost = (hostname: string) => hostname === "etsy.com" || hostname.endsWith(".etsy.com");
const directCheckoutHost = (hostname: string) => (
  hostname === "lemonsqueezy.com"
  || hostname.endsWith(".lemonsqueezy.com")
  || hostname === "buy.stripe.com"
  || hostname === "checkout.stripe.com"
);

function trustedUrl(raw: string | undefined, allowedHost: (hostname: string) => boolean) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || !allowedHost(url.hostname.toLowerCase())) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function rechargeUrl(source: CommerceSource, env: Record<string, string | undefined> = process.env) {
  if (source === "etsy" && env.ETSY_DIRECT_UPGRADE_ENABLED !== "true") {
    return trustedUrl(env.ETSY_RECHARGE_URL, etsyHost);
  }
  return trustedUrl(env.DIRECT_RECHARGE_URL || env.LEMON_RECHARGE_URL, directCheckoutHost);
}

export function subscriptionUrl(source: CommerceSource, env: Record<string, string | undefined> = process.env) {
  if (source === "etsy" && env.ETSY_DIRECT_UPGRADE_ENABLED !== "true") return null;
  return trustedUrl(env.DIRECT_SUBSCRIPTION_URL, directCheckoutHost);
}
