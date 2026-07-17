export type ReferenceEntry = {
  title: string;
  authority: string;
  url: string;
  topics: string[];
  checkedAt: string;
};

const references: Record<string, ReferenceEntry[]> = {
  BE: [
    {
      title: "Certificat PEB · Wallonie",
      authority: "Service public de Wallonie",
      url: "https://energie.wallonie.be/home/performance-energetique-des-batiments/batiments-residentiels/achat-vente-location/obligations/certificat-peb--quoi--quand--comment.html",
      topics: ["peb", "energie", "annonce", "vente", "location"],
      checkedAt: "2026-07-17",
    },
    {
      title: "Certificat PEB · Bruxelles",
      authority: "Bruxelles Environnement",
      url: "https://environnement.brussels/citoyen/services-et-demandes/conseils-et-accompagnement/plusieurs-experts-peuvent-vous-aider-analyser-votre-batiment",
      topics: ["peb", "energie", "annonce", "vente", "location", "bruxelles"],
      checkedAt: "2026-07-17",
    },
    {
      title: "EPC bij overdracht of verhuur · Vlaanderen",
      authority: "Vlaanderen",
      url: "https://www.vlaanderen.be/bouwen-wonen-en-energie/energieprestatiecertificaat-epc-bij-overdracht-of-verhuur-van-een-wooneenheid",
      topics: ["epc", "peb", "energie", "annonce", "vente", "location", "flandre"],
      checkedAt: "2026-07-17",
    },
    {
      title: "Actualités et frais immobiliers",
      authority: "Notaire.be",
      url: "https://www.notaire.be/actualites/immobilier-5-nouveautes-partir-du-1er-janvier-2025",
      topics: ["notaire", "frais", "achat", "compromis", "droits", "enregistrement"],
      checkedAt: "2026-07-17",
    },
  ],
  FR: [
    {
      title: "Diagnostic de performance énergétique (DPE)",
      authority: "Service-Public.fr",
      url: "https://www.service-public.fr/particuliers/actualites/A14608",
      topics: ["dpe", "energie", "annonce", "vente", "location", "diagnostic"],
      checkedAt: "2026-07-17",
    },
    {
      title: "Carnet d’information du logement",
      authority: "Service-Public.fr",
      url: "https://www.service-public.fr/particuliers/vosdroits/F36759",
      topics: ["document", "vente", "logement", "travaux", "diagnostic"],
      checkedAt: "2026-07-17",
    },
  ],
  LU: [
    {
      title: "Certificat de performance énergétique",
      authority: "Guichet.lu",
      url: "https://guichet.public.lu/fr/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html",
      topics: ["energie", "certificat", "vente", "location", "passeport"],
      checkedAt: "2026-07-17",
    },
  ],
  CA: [
    {
      title: "Certificat de localisation · Québec",
      authority: "Gouvernement du Québec",
      url: "https://www.quebec.ca/habitation-territoire/achat-vente/certificat-localisation",
      topics: ["certificat", "localisation", "vente", "achat", "cadastre"],
      checkedAt: "2026-07-17",
    },
  ],
  MA: [
    {
      title: "Suivi des titres fonciers · Mohafadati",
      authority: "ANCFCC",
      url: "https://www.ancfcc.gov.ma/espacenotaire",
      topics: ["titre", "foncier", "cadastre", "vente", "notaire"],
      checkedAt: "2026-07-17",
    },
  ],
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const regulatedPattern = /(peb|epc|dpe|energie|charge|notaire|frais|droit|loi|legal|reglement|urbanisme|cadastre|titre|foncier|bail|compromis|diagnostic|certificat|fiscal|taxe)/;

export function getReferenceContext(market: string, situation: string) {
  const entries = references[market] ?? [];
  const text = normalize(situation);
  const regulated = regulatedPattern.test(text);
  const ranked = entries
    .map((entry) => ({
      entry,
      score: entry.topics.reduce((score, topic) => score + (text.includes(normalize(topic)) ? 2 : 0), regulated ? 0 : 1),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => entry);

  return {
    regulated,
    references: ranked.slice(0, regulated ? 3 : 1),
    confidence: regulated && ranked.length === 0 ? "restricted" as const : ranked.length ? "source-backed" as const : "operational" as const,
    boundary: regulated && ranked.length === 0
      ? "Le référentiel officiel de ce marché n’est pas encore validé pour ce point. ImmoBoost prépare la communication et l’action, mais ne produit aucune affirmation réglementaire."
      : null,
  };
}
