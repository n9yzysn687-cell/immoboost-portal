export type CountryPack = {
  id: "BE";
  label: string;
  locale: string;
  voiceLocale: string;
  currency: "EUR";
  version: string;
  regions: string[];
  officialDomains: string[];
  missionInstructions: string;
  legalNotice: string;
};

const belgium: CountryPack = {
  id: "BE",
  label: "Belgique",
  locale: "fr-BE",
  voiceLocale: "fr-BE",
  currency: "EUR",
  version: "BE-2026.07.1",
  regions: ["Bruxelles-Capitale", "Wallonie", "Flandre"],
  officialDomains: [
    "belgium.be",
    "economie.fgov.be",
    "finances.belgium.be",
    "ipi.be",
    "notaire.be",
    "wallonie.be",
    "vlaanderen.be",
    "be.brussels",
    "environnement.brussels",
  ],
  missionInstructions: "Adapte la réponse au marché immobilier belge et identifie la région lorsqu’elle change la réponse.",
  legalNotice: "Les informations réglementaires sont générales et doivent être validées pour le dossier concerné.",
};

export function getCountryPack(id = "BE") {
  if (id !== "BE") throw new Error(`Country pack unavailable: ${id}`);
  return belgium;
}

function isAllowedDomain(hostname: string, allowedDomains: string[]) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return allowedDomains.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

export function isOfficialSource(url: string, country = belgium) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && isAllowedDomain(parsed.hostname, country.officialDomains);
  } catch {
    return false;
  }
}
