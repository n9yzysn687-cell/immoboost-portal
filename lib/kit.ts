import { CountryPack, isOfficialSource } from "./countries";

export type MarketingPack = {
  enabled: boolean;
  angle: string;
  listing: { headline: string; body: string };
  social: { instagram: string; facebook: string; linkedin: string };
  advertising: { headline: string; primaryText: string; cta: string; audience: string };
  reel: { hook: string; shotList: string[]; voiceover: string; caption: string };
  visual: { canvaBrief: string; imagePrompt: string };
  aiPrompts: { chatgpt: string; imageGenerator: string };
  hashtags: string[];
};

export type Kit = {
  title: string;
  diagnostic: string;
  objective: string;
  urgency: "maintenant" | "aujourd'hui" | "cette semaine";
  plan: Array<{ title: string; detail: string }>;
  email: { subject: string; body: string };
  sms: string;
  callScript: { opening: string; questions: string[]; objections: string[]; closing: string };
  checklist: string[];
  documents: string[];
  marketingPack: MarketingPack;
  nextAction: { title: string; detail: string; when: string };
  warning: string;
  sources: Array<{ title: string; url: string }>;
};

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function textRecord(value: unknown, keys: string[]) {
  return record(value) && keys.every((key) => typeof value[key] === "string");
}

function isMarketingPack(value: unknown): value is MarketingPack {
  if (!record(value) || typeof value.enabled !== "boolean" || typeof value.angle !== "string") return false;
  if (!textRecord(value.listing, ["headline", "body"])) return false;
  if (!textRecord(value.social, ["instagram", "facebook", "linkedin"])) return false;
  if (!textRecord(value.advertising, ["headline", "primaryText", "cta", "audience"])) return false;
  if (!record(value.reel) || !textRecord(value.reel, ["hook", "voiceover", "caption"]) || !strings(value.reel.shotList)) return false;
  if (!textRecord(value.visual, ["canvaBrief", "imagePrompt"])) return false;
  if (!textRecord(value.aiPrompts, ["chatgpt", "imageGenerator"])) return false;
  return strings(value.hashtags);
}

export function isKit(value: unknown): value is Kit {
  if (!record(value)) return false;
  if (!["title", "diagnostic", "objective", "sms", "warning"].every((key) => typeof value[key] === "string")) return false;
  if (!["maintenant", "aujourd'hui", "cette semaine"].includes(String(value.urgency))) return false;
  if (!Array.isArray(value.plan) || !value.plan.every((item) => textRecord(item, ["title", "detail"]))) return false;
  if (!textRecord(value.email, ["subject", "body"])) return false;
  if (!record(value.callScript) || !textRecord(value.callScript, ["opening", "closing"]) || !strings(value.callScript.questions) || !strings(value.callScript.objections)) return false;
  if (!strings(value.checklist) || !strings(value.documents)) return false;
  if (!isMarketingPack(value.marketingPack)) return false;
  if (!textRecord(value.nextAction, ["title", "detail", "when"])) return false;
  return Array.isArray(value.sources) && value.sources.every((source) => textRecord(source, ["title", "url"]));
}

export function secureKitSources(kit: Kit, country: CountryPack, regulatoryRequest: boolean): Kit {
  const accepted = regulatoryRequest
    ? kit.sources
      .filter((source) => isOfficialSource(source.url, country))
      .slice(0, 5)
      .map((source) => ({ title: source.title.trim().slice(0, 180), url: source.url }))
    : [];

  const rejectedCount = regulatoryRequest ? kit.sources.length - accepted.length : 0;
  let warning = kit.warning.trim();
  if (regulatoryRequest && accepted.length === 0) {
    warning = [warning, "Aucune source officielle autorisée n’a pu être validée. Ne prenez pas de décision réglementaire sur cette seule réponse."]
      .filter(Boolean)
      .join(" ");
  } else if (rejectedCount > 0) {
    warning = [warning, "Certaines sources non officielles ont été retirées automatiquement."]
      .filter(Boolean)
      .join(" ");
  }

  return { ...kit, warning, sources: accepted };
}
