export type SpecialistAgent = {
  id: string;
  name: string;
  icon: string;
  scope: string;
  keywords: string[];
  examples: string[];
  trust: "metier" | "official" | "mixed";
};

export const specialistAgents: SpecialistAgent[] = [
  {
    id: "seller",
    name: "Agent Vendeur",
    icon: "🤝",
    scope: "Mandat, exclusivité, honoraires, objections et suivi vendeur.",
    keywords: ["vendeur", "mandat", "exclusivite", "exclusivité", "honoraires", "commission", "estimation trop haute", "reflechir", "réfléchir"],
    examples: ["Le vendeur refuse l’exclusivité", "Il trouve mes honoraires trop élevés", "Il veut réfléchir après le rendez-vous"],
    trust: "metier",
  },
  {
    id: "valuation",
    name: "Agent Estimation",
    icon: "🏡",
    scope: "Méthode, comparables, présentation du prix et positionnement.",
    keywords: ["estimation", "prix", "comparables", "valeur", "surface", "surestime", "surévalue"],
    examples: ["Une autre agence annonce plus", "Comment présenter une fourchette ?", "Le vendeur surestime son bien"],
    trust: "metier",
  },
  {
    id: "marketing",
    name: "Agent Mise en vente",
    icon: "📢",
    scope: "Annonce, photos, diffusion, visibilité et présentation du bien.",
    keywords: ["annonce", "photo", "photos", "immoweb", "publication", "marketing", "reseaux", "réseaux", "contact"],
    examples: ["Mon annonce ne génère pas de contacts", "Quelle photo mettre en premier ?", "Comment améliorer le texte ?"],
    trust: "metier",
  },
  {
    id: "visit",
    name: "Agent Visite",
    icon: "👥",
    scope: "Préparation, questions acheteur, objections et suivi après visite.",
    keywords: ["visite", "acheteur", "hesite", "hésite", "annule", "annulation", "negocie", "négocie"],
    examples: ["L’acheteur hésite", "La visite est annulée", "Il veut négocier fortement"],
    trust: "metier",
  },
  {
    id: "offer",
    name: "Agent Offre & négociation",
    icon: "💰",
    scope: "Offre, contre-offre, communication et prochaines étapes.",
    keywords: ["offre", "contre-offre", "contre offre", "negociation", "négociation", "condition suspensive", "financement"],
    examples: ["L’offre est trop basse", "Comment préparer une contre-offre ?", "L’acheteur renégocie"],
    trust: "mixed",
  },
  {
    id: "documents",
    name: "Agent Documents",
    icon: "📄",
    scope: "Documents, compromis, mandat, copropriété et points à vérifier.",
    keywords: ["document", "documents", "compromis", "copropriete", "copropriété", "syndic", "acte", "attestation"],
    examples: ["Quel document manque ?", "Que vérifier avant le compromis ?", "Quels documents demander au syndic ?"],
    trust: "mixed",
  },
  {
    id: "regulation",
    name: "Agent Réglementation Belgique",
    icon: "⚖️",
    scope: "PEB, urbanisme, bail et règles belges avec sources officielles requises.",
    keywords: ["peb", "urbanisme", "permis", "bail", "indexation", "preavis", "préavis", "fiscal", "fiscalite", "fiscalité", "loi", "legal", "légal", "reglementation", "réglementation"],
    examples: ["Le PEB est-il obligatoire ?", "Quel préavis appliquer ?", "Cette véranda doit-elle être régularisée ?"],
    trust: "official",
  },
  {
    id: "communication",
    name: "Agent Communication",
    icon: "💬",
    scope: "SMS, WhatsApp, email, relance et reformulation professionnelle.",
    keywords: ["sms", "email", "mail", "whatsapp", "message", "relance", "repondre", "répondre"],
    examples: ["Rédige un SMS de relance", "Réponds à un vendeur hésitant", "Prépare un email après visite"],
    trust: "metier",
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function routeQuestion(question: string) {
  const normalized = normalize(question);
  let best = specialistAgents[0];
  let bestScore = -1;

  specialistAgents.forEach((agent) => {
    const score = agent.keywords.reduce((total, keyword) => {
      const normalizedKeyword = normalize(keyword);
      return total + (normalized.includes(normalizedKeyword) ? Math.max(2, normalizedKeyword.split(" ").length) : 0);
    }, 0);
    if (score > bestScore) {
      best = agent;
      bestScore = score;
    }
  });

  if (bestScore <= 0) return specialistAgents.find((agent) => agent.id === "communication") ?? specialistAgents[0];
  return best;
}
