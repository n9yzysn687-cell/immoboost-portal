import { createHmac } from "crypto";
import { specialistAgents } from "./agents";
import { workflows, type Workflow } from "./workflows";

export type MarketCode = "BE" | "FR" | "LU" | "CH" | "CA" | "MC" | "MA" | "TN" | "SN" | "CI" | "CM" | "CD" | "DZ";
export type EngineTier = "economy" | "quality";

export const markets: Record<MarketCode, { name: string; terms: string[]; caution: string }> = {
  BE: { name: "Belgique", terms: ["PEB", "compromis", "préavis", "urbanisme régional"], caution: "Les règles varient entre Bruxelles, Wallonie et Flandre." },
  FR: { name: "France", terms: ["DPE", "promesse", "mandat", "notaire"], caution: "Vérifier les règles nationales et locales applicables." },
  LU: { name: "Luxembourg", terms: ["passeport énergétique", "compromis", "cadastre"], caution: "Faire confirmer les délais et obligations par un professionnel local." },
  CH: { name: "Suisse", terms: ["cédule", "registre foncier", "canton"], caution: "Les usages et obligations varient selon le canton." },
  CA: { name: "Canada", terms: ["courtier", "inspection", "promesse d’achat"], caution: "Adapter à la province et aux règles de l’OACIQ/organisme local si applicable." },
  MC: { name: "Monaco", terms: ["résidence", "notaire", "surface habitable"], caution: "Marché très spécifique : validation professionnelle indispensable." },
  MA: { name: "Maroc", terms: ["titre foncier", "conservation foncière", "compromis"], caution: "Vérifier le statut foncier et les autorisations locales." },
  TN: { name: "Tunisie", terms: ["titre bleu", "cadastre", "promesse de vente"], caution: "Contrôler les restrictions et autorisations selon l’acheteur." },
  SN: { name: "Sénégal", terms: ["titre foncier", "bail emphytéotique", "délibération"], caution: "La nature du titre doit être confirmée avant toute recommandation." },
  CI: { name: "Côte d’Ivoire", terms: ["ACD", "titre foncier", "lotissement"], caution: "Confirmer l’ACD, le titre et la chaîne de propriété." },
  CM: { name: "Cameroun", terms: ["titre foncier", "certificat de propriété", "morcellement"], caution: "Valider l’authenticité des titres auprès des autorités compétentes." },
  CD: { name: "RD Congo", terms: ["certificat d’enregistrement", "concession", "cadastre"], caution: "Faire vérifier les titres et autorisations localement." },
  DZ: { name: "Algérie", terms: ["livret foncier", "acte notarié", "cadastre"], caution: "Vérifier le régime du bien et les règles notariales applicables." },
};

const expertMap: Record<string, string[]> = {
  vendeur: ["seller", "valuation", "communication"],
  mandat: ["seller", "valuation", "communication"],
  estimation: ["valuation", "seller", "documents"],
  annonce: ["marketing", "communication"],
  photo: ["marketing", "documents"],
  visite: ["visit", "communication", "documents"],
  offre: ["offer", "communication", "documents"],
  negociation: ["offer", "seller", "communication"],
  réglementation: ["regulation", "documents"],
  reglementation: ["regulation", "documents"],
  peb: ["regulation", "documents"],
  bail: ["regulation", "documents", "communication"],
  prospect: ["communication", "seller"],
  social: ["marketing", "communication"],
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function selectExperts(situation: string) {
  const text = normalize(situation);
  const ids = new Set<string>();
  Object.entries(expertMap).forEach(([keyword, agentIds]) => {
    if (text.includes(normalize(keyword))) agentIds.forEach((id) => ids.add(id));
  });
  if (ids.size === 0) ids.add("communication");
  return [...ids].slice(0, 3).map((id) => specialistAgents.find((agent) => agent.id === id)).filter(Boolean) as typeof specialistAgents;
}

export function chooseEngine(situation: string, workflow?: Workflow | null): EngineTier {
  const text = normalize(`${situation} ${workflow?.title ?? ""}`);
  return /(photo|image|negociation|offre|contre offre|reglement|peb|urbanisme|bail|fiscal|loi|legal)/.test(text) ? "quality" : "economy";
}

export function estimateUsage(situation: string, engine: EngineTier) {
  const inputTokens = Math.max(220, Math.ceil(situation.length / 3.8) + 620);
  const outputTokens = engine === "quality" ? 2200 : 1400;
  const estimatedCost = Number(((inputTokens * (engine === "quality" ? 0.002 : 0.0004) + outputTokens * (engine === "quality" ? 0.008 : 0.0016)) / 1000).toFixed(4));
  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, estimatedCost };
}

export function buildMissionKit(situation: string, market: MarketCode, workflow?: Workflow | null) {
  const marketProfile = markets[market];
  const experts = selectExperts(situation);
  const engine = chooseEngine(situation, workflow);
  const usage = estimateUsage(situation, engine);
  const objective = workflow?.promise ?? "Clarifier la situation et transformer la demande en action métier exploitable.";

  return {
    brand: "Agent Daily",
    market,
    marketProfile,
    experts,
    engine,
    usage,
    diagnostic: `Situation détectée : ${situation || "mission à préciser"}. Marché ${marketProfile.name}, terminologie à privilégier : ${marketProfile.terms.join(", ")}.`,
    objective,
    plan: ["Qualifier les faits disponibles", "Identifier les risques métier ou réglementaires", "Préparer les messages copiables", "Définir la prochaine action mesurable"],
    email: "Objet : Suite à notre échange\n\nBonjour,\n\nJe reviens vers vous avec une proposition claire et structurée. Voici les points importants, les éléments à vérifier et la prochaine étape que je vous propose.\n\nBien à vous,",
    sms: "Bonjour, je vous propose de faire le point sur votre situation et de valider ensemble la prochaine étape. Êtes-vous disponible aujourd’hui ?",
    callScript: ["Bonjour, je vous appelle pour clarifier la situation et vous proposer une suite simple.", "Ce que j’ai compris : …", "La meilleure prochaine étape serait …", "Est-ce que cela vous convient si nous fixons … ?"],
    checklist: ["Contexte du bien et objectif client", "Données chiffrées fournies sans invention", "Documents disponibles", "Points à confirmer localement", "Message de suivi prêt à envoyer"],
    documents: ["Mandat ou accord écrit si nécessaire", "Documents techniques disponibles", "Pièces urbanistiques ou énergétiques selon marché", "Historique des échanges utiles"],
    nextAction: "Lancer la mission avec les experts activés, puis débiter les crédits uniquement si le kit est généré avec succès.",
    growthPack: ["Post LinkedIn local", "Story courte avec appel à l’action", "Email de relance prospect", "Angle Canva pour carrousel", "Message Google Business sobre"],
    dataPolicy: "store:false — aucune conversation ne doit être conservée par le fournisseur IA ; seules les métriques nécessaires au portefeuille de crédits sont traitées côté serveur.",
    caution: marketProfile.caution,
  };
}

export function signCreditWallet(inviteCode: string, credits = 250) {
  const issuedAt = new Date().toISOString();
  const payload = { inviteCode, credits, issuedAt, product: "Agent Daily" };
  const secret = process.env.CREDIT_SIGNING_SECRET || "agent-daily-local-demo-secret";
  const signature = createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
  return { ...payload, signature };
}
