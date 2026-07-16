import { getCloudflareContext } from "@opennextjs/cloudflare";
import { D1BindingClient, d1ConfigFromEnv, D1RestClient, type D1DatabaseLike } from "./d1";
import { CommerceRepository } from "./repository";
export { commerceMode } from "./mode";

type ImmoBoostCloudflareEnv = CloudflareEnv & {
  AUTH_PEPPER?: string;
  IMMOBOOST_DB?: D1DatabaseLike;
};

function cloudflareEnv() {
  try {
    return getCloudflareContext().env as ImmoBoostCloudflareEnv;
  } catch {
    return null;
  }
}

export function commerceRepositoryFromEnv(env = process.env) {
  const workerEnv = cloudflareEnv();
  const pepper = workerEnv?.AUTH_PEPPER?.trim() || env.AUTH_PEPPER?.trim() || "";
  if (pepper.length < 32) return null;

  if (workerEnv?.IMMOBOOST_DB) {
    return new CommerceRepository(new D1BindingClient(workerEnv.IMMOBOOST_DB), pepper);
  }

  const config = d1ConfigFromEnv(env);
  if (!config) return null;
  return new CommerceRepository(new D1RestClient(config), pepper);
}

export function requireCommerceRepository(env = process.env) {
  const repository = commerceRepositoryFromEnv(env);
  if (!repository) throw new Error("COMMERCE_NOT_CONFIGURED");
  return repository;
}
