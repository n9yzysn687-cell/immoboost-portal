export type CommerceSource = "etsy" | "lemon" | "manual";

export type ProductGrant = {
  sku: string;
  boosts: number;
  grantsAccess: boolean;
  durationDays: number | null;
};

export class ProductCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductCatalogError";
  }
}

function validateGrant(value: unknown): ProductGrant {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProductCatalogError("Invalid product mapping");
  const grant = value as Record<string, unknown>;
  const sku = typeof grant.sku === "string" ? grant.sku.trim() : "";
  const boosts = Number(grant.boosts);
  const durationDays = grant.durationDays == null ? null : Number(grant.durationDays);
  if (!/^[a-z0-9_-]{2,64}$/i.test(sku) || !Number.isSafeInteger(boosts) || boosts < 1 || boosts > 100_000) {
    throw new ProductCatalogError("Invalid product mapping");
  }
  if (durationDays !== null && (!Number.isSafeInteger(durationDays) || durationDays < 1 || durationDays > 3_650)) {
    throw new ProductCatalogError("Invalid product duration");
  }
  return { sku, boosts, grantsAccess: grant.grantsAccess !== false, durationDays };
}

export function parseProductCatalog(raw: string | undefined) {
  if (!raw?.trim()) return new Map<string, ProductGrant>();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ProductCatalogError("Product mapping is not valid JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new ProductCatalogError("Invalid product mapping");
  return new Map(Object.entries(parsed as Record<string, unknown>).map(([externalId, grant]) => {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(externalId)) throw new ProductCatalogError("Invalid external product ID");
    return [externalId, validateGrant(grant)];
  }));
}

export function grantForQuantity(grant: ProductGrant, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000) {
    throw new ProductCatalogError("Invalid product quantity");
  }
  const boosts = grant.boosts * quantity;
  if (!Number.isSafeInteger(boosts) || boosts > 100_000) {
    throw new ProductCatalogError("Product grant exceeds the safety limit");
  }
  return { ...grant, boosts };
}
