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
  const text = normalize(`${situation} ${workflow?.title ?? ""}`);
  const isListing = /(annonce|lancer un bien|nouveau bien|immoweb|diffusion|publication)/.test(text);
  const isFollowup = /(relanc|indecis|ne repond|silence|attente)/.test(text);
  const isVisit = /(visite|rendez vous|vendeur|objection|mandat)/.test(text);
  const isMorning = /(matin|repondeur|emails|messages|priorit)/.test(text);

  const objective = isListing
    ? "Lancer ce bien sans perdre de temps"
    : isFollowup
      ? "Obtenir une réponse claire aujourd’hui"
      : isVisit
        ? "Arriver prêt et obtenir la prochaine décision"
        : isMorning
          ? "Vider l’urgence et reprendre le contrôle"
          : workflow?.title ?? "Régler cette situation maintenant";

  const plan = isListing
    ? ["Valider les informations du bien", "Choisir l’angle principal", "Publier l’annonce et le post", "Programmer la première relance"]
    : isFollowup
      ? ["Rappeler le contexte en une phrase", "Poser une question simple", "Proposer deux créneaux", "Planifier une relance finale"]
      : isVisit
        ? ["Confirmer l’objectif du rendez-vous", "Préparer trois arguments utiles", "Anticiper le vrai blocage", "Obtenir une date ou une décision"]
        : isMorning
          ? ["Traiter les demandes chaudes", "Répondre aux messages courts", "Relancer les dossiers en attente", "Bloquer les trois actions du jour"]
          : ["Confirmer les faits utiles", "Sécuriser les points sensibles", "Envoyer le bon message", "Fixer la prochaine action"];

  const email = isFollowup
    ? "Objet : On avance ?\n\nBonjour,\n\nJe reviens vers vous au sujet de notre échange. Souhaitez-vous avancer, reporter ou arrêter ici ? Une réponse courte me suffit et me permettra de vous accompagner correctement.\n\nJe suis disponible aujourd’hui si vous voulez en parler.\n\nBien à vous,"
    : isListing
      ? "Objet : Votre bien est prêt à être lancé\n\nBonjour,\n\nJ’ai préparé la mise en vente et les éléments de communication. Avant publication, je vous propose une dernière validation des informations essentielles et des visuels.\n\nPouvez-vous me confirmer votre accord aujourd’hui ?\n\nBien à vous,"
      : "Objet : La prochaine étape\n\nBonjour,\n\nÀ la suite de notre échange, je vous propose une étape simple : valider ensemble les points essentiels, puis avancer avec une décision claire.\n\nQuand pouvons-nous en parler ?\n\nBien à vous,";

  const sms = isFollowup
    ? "Bonjour, je reviens vers vous pour savoir comment avancer : on poursuit, on reporte ou on s’arrête ici ? Une réponse courte me suffit."
    : isListing
      ? "Bonjour, la mise en vente est prête. Il me manque votre validation finale pour lancer la diffusion. Puis-je publier aujourd’hui ?"
      : "Bonjour, j’ai préparé une suite simple pour avancer. Êtes-vous disponible aujourd’hui pour la valider ensemble ?";

  const nextAction = isListing
    ? "Faire valider les informations et lancer la première publication aujourd’hui."
    : isFollowup
      ? "Envoyer le message maintenant, puis programmer une dernière relance dans 48 heures."
      : isVisit
        ? "Confirmer le rendez-vous et garder une seule décision à obtenir en fin d’échange."
        : isMorning
          ? "Commencer par le contact le plus chaud, puis traiter les deux relances bloquées."
          : "Contacter le client aujourd’hui avec le message préparé et fixer une date précise.";

  const socialPost = isListing
    ? `NOUVEAU · ${marketProfile.name}\n\n${situation}\n\nUn bien à découvrir, présenté avec les informations essentielles et sans promesse exagérée.\n\nÉcrivez-moi pour recevoir le dossier complet ou organiser une visite.`
    : `Aujourd’hui sur le terrain : ${situation}\n\nDerrière chaque projet immobilier, il y a surtout une décision à rendre plus simple. Mon rôle : clarifier, préparer et faire avancer.\n\nVous avez un projet dans ${marketProfile.name} ? Parlons-en.`;

  const visualBrief = isListing
    ? "Visuel principal : la photo la plus lumineuse du bien. Titre court en haut, localisation discrète, un seul appel à l’action. Aucun collage chargé."
    : "Portrait ou photo terrain naturelle, fond sobre, une phrase forte et lisible. Format vertical pour story, recadrage carré pour le fil.";

  return {
    brand: "Agent Daily",
    market,
    marketProfile,
    experts,
    engine,
    diagnostic: `${marketProfile.name} · ${situation || "Mission à préciser"}. À sécuriser : ${marketProfile.terms.slice(0, 2).join(" et ")}.`,
    objective,
    plan,
    email,
    sms,
    callScript: ["Rappeler le contexte en une phrase", "Valider le vrai blocage", "Présenter une seule solution", "Obtenir une date ou une décision"],
    checklist: ["Contexte du bien et objectif client", "Données chiffrées fournies sans invention", "Documents disponibles", "Points à confirmer localement", "Message de suivi prêt à envoyer"],
    documents: ["Mandat ou accord écrit si nécessaire", "Documents techniques disponibles", "Pièces urbanistiques ou énergétiques selon marché", "Historique des échanges utiles"],
    nextAction,
    socialPost,
    visualBrief,
    growthPack: ["Post LinkedIn local", "Story courte avec appel à l’action", "Email de relance prospect", "Angle Canva pour carrousel", "Message Google Business sobre"],
    dataPolicy: "Le contenu des missions n’est pas conservé par le fournisseur IA. Seuls le solde et l’usage indispensable au service sont enregistrés.",
    caution: marketProfile.caution,
  };
}

export function signCreditWallet(inviteCode: string, boosts = 250) {
  const issuedAt = new Date().toISOString();
  const payload = { inviteCode, boosts, issuedAt, product: "Agent Daily" };
  const secret = process.env.CREDIT_SIGNING_SECRET || "agent-daily-local-demo-secret";
  const signature = createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
  return { ...payload, signature };
}
