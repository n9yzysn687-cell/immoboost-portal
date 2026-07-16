export type CommerceMode = "preview" | "enforced";

export function commerceMode(env: Record<string, string | undefined> = process.env) : CommerceMode {
  if (env.VERCEL_ENV === "production") return "enforced";
  if (env.COMMERCE_MODE === "enforced") return "enforced";
  if (env.VERCEL_ENV === "preview") return "preview";
  if ((env.NODE_ENV === "development" || env.NODE_ENV === "test") && env.COMMERCE_MODE !== "enforced") return "preview";
  return "enforced";
}
