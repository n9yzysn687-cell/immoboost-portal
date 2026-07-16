import assert from "node:assert/strict";
import test from "node:test";
import { grantForQuantity, parseProductCatalog, ProductCatalogError } from "../lib/commerce/catalog.ts";
import { rechargeUrl, subscriptionUrl } from "../lib/commerce/recharge.ts";

test("commerce catalogs map marketplace products to stable Boost grants", () => {
  const catalog = parseProductCatalog(JSON.stringify({
    "12345": { sku: "launch-be", boosts: 300, grantsAccess: true, durationDays: null },
  }));
  assert.deepEqual(catalog.get("12345"), { sku: "launch-be", boosts: 300, grantsAccess: true, durationDays: null });
});

test("invalid or excessive marketplace grants fail closed", () => {
  assert.throws(() => parseProductCatalog('{"123":{"sku":"bad","boosts":1000000}}'), ProductCatalogError);
  assert.throws(() => parseProductCatalog("not-json"), ProductCatalogError);
  assert.throws(
    () => grantForQuantity({ sku: "boost", boosts: 200, grantsAccess: true, durationDays: null }, 1_000),
    ProductCatalogError,
  );
});

test("recharge destinations stay on the original trusted sales channel", () => {
  assert.equal(
    rechargeUrl("etsy", { ETSY_RECHARGE_URL: "https://www.etsy.com/listing/123/recharge" }),
    "https://www.etsy.com/listing/123/recharge",
  );
  assert.equal(
    rechargeUrl("lemon", { DIRECT_RECHARGE_URL: "https://immoboost.lemonsqueezy.com/buy/abc" }),
    "https://immoboost.lemonsqueezy.com/buy/abc",
  );
  assert.equal(rechargeUrl("etsy", { ETSY_RECHARGE_URL: "https://evil.example/checkout" }), null);
  assert.equal(rechargeUrl("etsy", { ETSY_RECHARGE_URL: "https://etsy.com.evil.example/checkout" }), null);
  assert.equal(
    subscriptionUrl("manual", { DIRECT_SUBSCRIPTION_URL: "https://buy.stripe.com/abc" }),
    "https://buy.stripe.com/abc",
  );
  assert.equal(
    subscriptionUrl("etsy", { DIRECT_SUBSCRIPTION_URL: "https://immoboost.lemonsqueezy.com/buy/subscription" }),
    null,
  );
  assert.equal(
    subscriptionUrl("etsy", {
      ETSY_DIRECT_UPGRADE_ENABLED: "true",
      DIRECT_SUBSCRIPTION_URL: "https://immoboost.lemonsqueezy.com/buy/subscription",
    }),
    "https://immoboost.lemonsqueezy.com/buy/subscription",
  );
});
