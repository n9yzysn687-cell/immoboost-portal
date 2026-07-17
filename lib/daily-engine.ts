import { createHmac } from "crypto";
import { specialistAgents } from "./agents";
import { workflows, type Workflow } from "./workflows";
import { getReferenceContext } from "./reference-vault";

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
  const referenceContext = getReferenceContext(market, situation);
  const experts = selectExperts(situation);
  const engine = chooseEngine(situation, workflow);
  const text = normalize(`${situation} ${workflow?.title ?? ""}`);
  const isListing = /(annonce|lancer un bien|nouveau bien|immoweb|diffusion|publication)/.test(text);
  const isFollowup = /(relanc|indecis|ne repond|silence|attente)/.test(text);
  const isCompetingAgency = /(autres? agence|plusieurs? agence|consult.*agence|compar.*agence)/.test(text);
  const isLowOffer = /(offre.*basse|offre.*trop basse|contre.?offre)/.test(text);
  const isPriceObjection = /(refus.*prix|baisse.*prix|diminuer.*prix|estimation contest|prix trop|prix eleve|honoraire)/.test(text);
  const isNegotiation = isCompetingAgency || isLowOffer || isPriceObjection || /(negoci|objection|mandat)/.test(text);
  const isVisit = /(visite|rendez vous|estimation)/.test(text);
  const isMorning = /(matin|repondeur|emails|messages|priorit)/.test(text);

  const objective = isListing
    ? "Lancer ce bien sans perdre de temps"
    : isFollowup
      ? "Obtenir une réponse claire aujourd’hui"
      : isCompetingAgency
        ? "Rester le choix évident sans mettre le vendeur sous pression"
        : isLowOffer
          ? "Transformer l’offre basse en base de négociation"
          : isPriceObjection
            ? "Revenir à une décision fondée sur les preuves du marché"
            : isNegotiation
              ? "Lever l’objection et obtenir une prochaine décision"
      : isVisit
        ? "Arriver prêt et obtenir la prochaine décision"
        : isMorning
          ? "Vider l’urgence et reprendre le contrôle"
          : workflow?.title ?? "Régler cette situation maintenant";

  const plan = isListing
    ? ["Valider les informations du bien", "Choisir l’angle principal", "Publier l’annonce et le post", "Programmer la première relance"]
    : isFollowup
      ? ["Rappeler le contexte en une phrase", "Poser une question simple", "Proposer deux créneaux", "Planifier une relance finale"]
      : isCompetingAgency
        ? ["Valider les critères de choix du vendeur", "Faire préciser ce qu’il compare", "Prouver la différence par le plan d’action", "Fixer un moment de décision"]
        : isLowOffer
          ? ["Séparer le montant des conditions", "Valider le seuil acceptable du vendeur", "Préparer une contre-offre argumentée", "Fixer une durée de validité claire"]
          : isPriceObjection
            ? ["Reprendre les faits comparables", "Mesurer le coût réel de l’attente", "Proposer une stratégie datée", "Fixer le prochain point de décision"]
            : isNegotiation
              ? ["Nommer l’objection réelle", "Vérifier ce qui bloque la décision", "Répondre avec une preuve", "Obtenir une prochaine étape datée"]
      : isVisit
        ? ["Confirmer l’objectif du rendez-vous", "Préparer trois arguments utiles", "Anticiper le vrai blocage", "Obtenir une date ou une décision"]
        : isMorning
          ? ["Traiter les demandes chaudes", "Répondre aux messages courts", "Relancer les dossiers en attente", "Bloquer les trois actions du jour"]
          : ["Confirmer les faits utiles", "Sécuriser les points sensibles", "Envoyer le bon message", "Fixer la prochaine action"];

  const email = isFollowup
    ? "Objet : On avance ?\n\nBonjour,\n\nJe reviens vers vous au sujet de notre échange. Souhaitez-vous avancer, reporter ou arrêter ici ? Une réponse courte me suffit et me permettra de vous accompagner correctement.\n\nJe suis disponible aujourd’hui si vous voulez en parler.\n\nBien à vous,"
    : isCompetingAgency
      ? "Objet : Votre choix d’agence\n\nBonjour,\n\nJe comprends que vous souhaitiez comparer avant de décider. Pour vous aider à choisir sur des éléments concrets, je vous propose de comparer notre stratégie de prix, le plan de lancement, le suivi des candidats et la méthode de compte rendu.\n\nJe peux vous présenter ces quatre points en quinze minutes, puis vous laisser décider sereinement. Quel moment vous conviendrait ?\n\nBien à vous,"
      : isLowOffer
        ? "Objet : Suite à l’offre reçue\n\nBonjour,\n\nL’offre reçue ne correspond pas au niveau attendu, mais elle ouvre une négociation. Je vous propose de distinguer le prix, les conditions et le délai, puis de formuler une contre-proposition cohérente avec votre objectif.\n\nJe vous appelle aujourd’hui pour valider le seuil et la réponse.\n\nBien à vous,"
        : isPriceObjection
          ? "Objet : Refaire le point sur la stratégie de prix\n\nBonjour,\n\nJe comprends votre position. Pour décider sans impression personnelle, je vous propose de reprendre les biens réellement comparables, les réactions reçues et le coût d’une attente supplémentaire.\n\nNous pourrons ensuite choisir ensemble de maintenir le prix avec une échéance précise ou de l’ajuster avec un nouvel angle de communication.\n\nBien à vous,"
    : isListing
      ? "Objet : Votre bien est prêt à être lancé\n\nBonjour,\n\nJ’ai préparé la mise en vente et les éléments de communication. Avant publication, je vous propose une dernière validation des informations essentielles et des visuels.\n\nPouvez-vous me confirmer votre accord aujourd’hui ?\n\nBien à vous,"
      : "Objet : La prochaine étape\n\nBonjour,\n\nÀ la suite de notre échange, je vous propose une étape simple : valider ensemble les points essentiels, puis avancer avec une décision claire.\n\nQuand pouvons-nous en parler ?\n\nBien à vous,";

  const sms = isFollowup
    ? "Bonjour, je reviens vers vous pour savoir comment avancer : on poursuit, on reporte ou on s’arrête ici ? Une réponse courte me suffit."
    : isCompetingAgency
      ? "Bonjour, je comprends que vous compariez plusieurs agences. Je vous propose 15 minutes pour comparer les stratégies sur des critères concrets, puis vous décidez sereinement. Quel créneau vous convient ?"
      : isLowOffer
        ? "Bonjour, l’offre est basse mais peut ouvrir une négociation. Je vous appelle pour valider votre seuil et préparer une contre-proposition claire. Êtes-vous disponible aujourd’hui ?"
        : isPriceObjection
          ? "Bonjour, je vous propose de revoir le prix à partir des retours réels et des biens comparables, puis de fixer une stratégie datée. Quand pouvons-nous faire ce point ?"
    : isListing
      ? "Bonjour, la mise en vente est prête. Il me manque votre validation finale pour lancer la diffusion. Puis-je publier aujourd’hui ?"
      : "Bonjour, j’ai préparé une suite simple pour avancer. Êtes-vous disponible aujourd’hui pour la valider ensemble ?";

  const nextAction = isListing
    ? "Faire valider les informations et lancer la première publication aujourd’hui."
    : isFollowup
      ? "Envoyer le message maintenant, puis programmer une dernière relance dans 48 heures."
      : isCompetingAgency
        ? "Envoyer le message comparatif maintenant et proposer un échange de quinze minutes avec quatre critères de décision."
        : isLowOffer
          ? "Appeler le vendeur pour fixer son seuil, puis envoyer une contre-proposition écrite et datée."
          : isPriceObjection
            ? "Préparer trois comparables et les retours reçus, puis fixer un rendez-vous de décision sur le prix."
            : isNegotiation
              ? "Nommer l’objection réelle et obtenir une prochaine étape avec une date précise."
      : isVisit
        ? "Confirmer le rendez-vous et garder une seule décision à obtenir en fin d’échange."
        : isMorning
          ? "Commencer par le contact le plus chaud, puis traiter les deux relances bloquées."
          : "Contacter le client aujourd’hui avec le message préparé et fixer une date précise.";

  const diagnosticCore = isListing
    ? "La mise en ligne peut avancer, mais les informations obligatoires et la promesse commerciale doivent être verrouillées avant diffusion."
    : isFollowup
      ? "L’attente entretient l’indécision. Une relance ouverte donnerait au client une nouvelle occasion de reporter."
      : isCompetingAgency
        ? "Le vendeur ne rejette pas l’accompagnement : il cherche à réduire son risque avant de choisir. Critiquer les autres agences renforcerait son besoin de comparaison."
        : isLowOffer
          ? "Le montant est insuffisant pour le vendeur, mais les conditions et la marge de l’acquéreur ne sont pas encore clarifiées. Un refus immédiat fermerait la négociation trop tôt."
          : isPriceObjection
            ? "Le désaccord porte sur la perception de valeur. Répéter l’estimation ne suffira pas : la décision doit reposer sur des comparables, des retours réels et une échéance."
            : isNegotiation
              ? "L’objection visible masque une condition de décision qui doit être isolée avant de répondre."
      : isVisit
        ? "Le rendez-vous doit viser une décision précise. Trop d’arguments disperseraient l’échange et affaibliraient la conclusion."
        : isMorning
          ? "Tout ne mérite pas le même niveau d’urgence. Les contacts chauds et les dossiers avec échéance doivent passer avant l’administratif."
          : "La situation demande une décision simple, un message cohérent et une date de suivi explicite.";

  const recommendation = isListing
    ? "Valider les faits essentiels une seule fois, puis lancer simultanément l’annonce et la première communication."
    : isFollowup
      ? "Demander une décision à trois options : avancer, reporter à une date précise ou clôturer."
      : isCompetingAgency
        ? "Faire comparer les stratégies plutôt que les promesses, puis proposer un court rendez-vous de décision sans pression."
        : isLowOffer
          ? "Conserver l’acquéreur dans l’échange et construire une contre-offre sur le prix, les conditions et le délai."
          : isPriceObjection
            ? "Présenter une stratégie de prix datée avec un point de contrôle, plutôt qu’exiger une baisse immédiate."
            : isNegotiation
              ? "Traiter une seule objection avec une preuve concrète, puis demander une décision datée."
      : isVisit
        ? "Conduire le rendez-vous vers une seule décision et traiter uniquement l’objection qui la bloque."
        : isMorning
          ? "Traiter d’abord le contact le plus chaud, puis les deux dossiers dont l’échéance est aujourd’hui."
          : "Envoyer une proposition claire aujourd’hui et fixer immédiatement le moment de reprise de contact.";

  const followUp = isListing
    ? { when: "24 h après la publication", objective: "Vérifier les premiers signaux et corriger l’accroche si nécessaire.", prepared: "Point vendeur et contrôle des demandes déjà préparés." }
    : isFollowup
      ? { when: "Dans 48 heures sans réponse", objective: "Obtenir une décision finale sans multiplier les messages.", prepared: "Relance courte et script d’appel déjà préparés." }
      : isCompetingAgency
        ? { when: "Le lendemain de l’échange comparatif", objective: "Faire confirmer le choix d’agence ou la date de décision.", prepared: "Résumé des engagements et message de décision prêts." }
        : isLowOffer
          ? { when: "Avant l’expiration de la contre-offre", objective: "Obtenir l’accord, un dernier ajustement ou une clôture claire.", prepared: "Message acquéreur et point vendeur déjà préparés." }
          : isPriceObjection
            ? { when: "À l’échéance convenue sur le prix", objective: "Mesurer les signaux du marché et décider de maintenir ou d’ajuster.", prepared: "Compte rendu chiffré et message vendeur prêts." }
            : isNegotiation
              ? { when: "Dans 24 à 48 heures", objective: "Vérifier si l’objection est levée et obtenir la décision suivante.", prepared: "Relance et réponse secondaire déjà préparées." }
      : isVisit
        ? { when: "Le lendemain du rendez-vous", objective: "Confirmer par écrit la décision et la prochaine échéance.", prepared: "Email récapitulatif et réponse à l’objection prêts." }
        : isMorning
          ? { when: "À 16 h 30", objective: "Contrôler les réponses et replacer les dossiers non résolus.", prepared: "Deuxième vague de relances déjà structurée." }
          : { when: "À la date convenue avec le client", objective: "Reprendre le dossier avec un objectif unique et mesurable.", prepared: "Message de suivi et prochaine action prêts." };

  const socialPost = isListing
    ? `NOUVEAU · ${marketProfile.name}\n\n${situation}\n\nUn bien à découvrir, présenté avec les informations essentielles et sans promesse exagérée.\n\nÉcrivez-moi pour recevoir le dossier complet ou organiser une visite.`
    : `Aujourd’hui sur le terrain : ${situation}\n\nDerrière chaque projet immobilier, il y a surtout une décision à rendre plus simple. Mon rôle : clarifier, préparer et faire avancer.\n\nVous avez un projet dans ${marketProfile.name} ? Parlons-en.`;

  const visualBrief = isListing
    ? "Visuel principal : la photo la plus lumineuse du bien. Titre court en haut, localisation discrète, un seul appel à l’action. Aucun collage chargé."
    : "Portrait ou photo terrain naturelle, fond sobre, une phrase forte et lisible. Format vertical pour story, recadrage carré pour le fil.";

  return {
    brand: "ImmoBoost",
    market,
    marketProfile,
    experts,
    engine,
    diagnostic: `${diagnosticCore}${referenceContext.boundary ? ` ${referenceContext.boundary}` : ""}`,
    recommendation,
    objective,
    plan,
    email,
    sms,
    callScript: ["Rappeler le contexte en une phrase", "Valider le vrai blocage", "Présenter une seule solution", "Obtenir une date ou une décision"],
    checklist: ["Contexte du bien et objectif client", "Données chiffrées fournies sans invention", "Documents disponibles", "Points à confirmer localement", "Message de suivi prêt à envoyer"],
    documents: ["Mandat ou accord écrit si nécessaire", "Documents techniques disponibles", "Pièces urbanistiques ou énergétiques selon marché", "Historique des échanges utiles"],
    nextAction,
    followUp,
    socialPost,
    visualBrief,
    growthPack: ["Post LinkedIn local", "Story courte avec appel à l’action", "Email de relance prospect", "Angle Canva pour carrousel", "Message Google Business sobre"],
    dataPolicy: "Le contenu des missions n’est pas conservé par le fournisseur IA. Seuls le solde et l’usage indispensable au service sont enregistrés.",
    caution: referenceContext.boundary ?? marketProfile.caution,
    confidence: referenceContext.confidence,
    references: referenceContext.references,
  };
}

export function signCreditWallet(inviteCode: string, boosts = 250) {
  const issuedAt = new Date().toISOString();
  const payload = { inviteCode, boosts, issuedAt, product: "ImmoBoost" };
  const secret = process.env.CREDIT_SIGNING_SECRET || "immoboost-local-demo-secret";
  const signature = createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
  return { ...payload, signature };
}
