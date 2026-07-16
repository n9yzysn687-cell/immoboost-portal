export type FieldOption = { label: string; value: string };
export type WorkflowField = {
  id: string;
  label: string;
  placeholder?: string;
  type: "text" | "textarea" | "select";
  options?: FieldOption[];
  required?: boolean;
};

export type Workflow = {
  id: string;
  title: string;
  icon: string;
  promise: string;
  category: "mandat" | "vente" | "acheteur" | "business" | "dossier";
  fields: WorkflowField[];
  expertRole: string;
  output: string[];
  guardrails?: string;
};

export const workflows: Workflow[] = [
  {
    id: "mandat",
    title: "Obtenir un mandat",
    icon: "🎯",
    promise: "Préparer un rendez-vous vendeur et traiter les objections sans improviser.",
    category: "mandat",
    expertRole: "coach commercial immobilier senior spécialisé dans les vendeurs belges",
    fields: [
      { id: "bien", label: "Type de bien", type: "select", required: true, options: ["Maison", "Appartement", "Terrain", "Immeuble", "Commerce"].map(v => ({ label: v, value: v })) },
      { id: "situation", label: "Situation du vendeur", type: "select", required: true, options: ["Premier rendez-vous", "Hésite entre plusieurs agences", "Refuse l’exclusivité", "Honoraires jugés trop élevés", "Prix souhaité trop haut", "Ne répond plus"].map(v => ({ label: v, value: v })) },
      { id: "contexte", label: "Contexte utile", type: "textarea", placeholder: "Ville, prix envisagé, concurrence, relation avec le vendeur…" },
      { id: "ton", label: "Style souhaité", type: "select", options: ["Professionnel et rassurant", "Direct et structuré", "Premium", "Chaleureux"].map(v => ({ label: v, value: v })) },
    ],
    output: ["Plan du rendez-vous", "Questions à poser", "Réponses aux objections", "Phrases exactes", "SMS de suivi", "Prochaine action"],
  },
  {
    id: "annonce",
    title: "Créer une annonce",
    icon: "📝",
    promise: "Transformer les informations brutes du bien en annonce claire, crédible et vendeuse.",
    category: "vente",
    expertRole: "copywriter immobilier belge senior spécialisé Immoweb et marketing de biens",
    fields: [
      { id: "bien", label: "Type de bien", type: "select", required: true, options: ["Maison", "Appartement", "Penthouse", "Terrain", "Immeuble de rapport", "Commerce"].map(v => ({ label: v, value: v })) },
      { id: "localisation", label: "Ville ou quartier", type: "text", required: true, placeholder: "Ex. Woluwe-Saint-Pierre" },
      { id: "caracteristiques", label: "Caractéristiques", type: "textarea", required: true, placeholder: "Surface, chambres, jardin, terrasse, parking, état, PEB…" },
      { id: "atouts", label: "Points forts", type: "textarea", placeholder: "Lumière, calme, vue, proximité transports, rénovation…" },
      { id: "cible", label: "Acheteur cible", type: "select", options: ["Famille", "Jeune couple", "Investisseur", "Premier achat", "Clientèle premium", "À déterminer"].map(v => ({ label: v, value: v })) },
    ],
    output: ["3 titres", "Description Immoweb", "Points forts", "Version réseaux sociaux", "Appel à l’action", "Informations à vérifier"],
    guardrails: "N’invente aucune caractéristique, surface, performance énergétique ou proximité non fournie.",
  },
  {
    id: "photos",
    title: "Préparer les photos",
    icon: "📸",
    promise: "Obtenir l’ordre de publication, une liste de prises manquantes et des conseils concrets.",
    category: "vente",
    expertRole: "directeur artistique immobilier spécialisé dans la présentation de biens aux acheteurs",
    fields: [
      { id: "bien", label: "Type de bien", type: "text", required: true, placeholder: "Ex. maison 4 façades" },
      { id: "pieces", label: "Photos disponibles", type: "textarea", required: true, placeholder: "Décris-les ou colle la liste : façade, séjour, cuisine, jardin…" },
      { id: "faiblesses", label: "Points faibles connus", type: "textarea", placeholder: "Pièce sombre, travaux, vue, encombrement…" },
      { id: "canal", label: "Canal principal", type: "select", options: ["Immoweb", "Instagram", "Facebook", "LinkedIn", "Brochure"].map(v => ({ label: v, value: v })) },
    ],
    output: ["Photo d’accroche", "Ordre recommandé", "Photos à retirer", "Photos manquantes", "Conseils de reprise", "Légendes courtes"],
    guardrails: "Ne prétends pas avoir vu une image qui n’a pas été fournie. Analyse uniquement la description disponible.",
  },
  {
    id: "prospect",
    title: "Répondre à un prospect",
    icon: "💬",
    promise: "Répondre vite et orienter chaque échange vers une prochaine action claire.",
    category: "business",
    expertRole: "agent immobilier senior spécialisé en conversion de prospects",
    fields: [
      { id: "canal", label: "Canal", type: "select", required: true, options: ["Email", "SMS", "WhatsApp", "Instagram", "Facebook", "Téléphone"].map(v => ({ label: v, value: v })) },
      { id: "message", label: "Message reçu", type: "textarea", required: true, placeholder: "Colle le message du prospect sans données sensibles." },
      { id: "objectif", label: "Objectif", type: "select", required: true, options: ["Obtenir un appel", "Fixer une visite", "Qualifier le besoin", "Demander des documents", "Relancer", "Refuser poliment"].map(v => ({ label: v, value: v })) },
      { id: "ton", label: "Ton", type: "select", options: ["Professionnel", "Chaleureux", "Premium", "Direct"].map(v => ({ label: v, value: v })) },
    ],
    output: ["Réponse prête à envoyer", "Version courte", "Question de qualification", "Prochaine action", "Relance si silence"],
  },
  {
    id: "visite",
    title: "Préparer une visite",
    icon: "🤝",
    promise: "Arriver avec les bons arguments, questions et réponses aux objections.",
    category: "acheteur",
    expertRole: "coach immobilier senior spécialisé dans les visites et la qualification acheteur",
    fields: [
      { id: "bien", label: "Bien visité", type: "textarea", required: true, placeholder: "Type, prix, atouts, points faibles…" },
      { id: "profil", label: "Profil des visiteurs", type: "textarea", placeholder: "Famille, investisseur, premier achat, besoins connus…" },
      { id: "risques", label: "Objections probables", type: "textarea", placeholder: "Prix, travaux, localisation, PEB, superficie…" },
      { id: "objectif", label: "Objectif de la visite", type: "select", options: ["Obtenir un retour précis", "Déclencher une seconde visite", "Préparer une offre", "Qualifier le financement"].map(v => ({ label: v, value: v })) },
    ],
    output: ["Plan de visite", "Arguments clés", "Questions à poser", "Réponses aux objections", "Signaux d’achat", "Message après visite"],
  },
  {
    id: "offre",
    title: "Gérer une offre",
    icon: "💰",
    promise: "Préparer la communication et la négociation sans donner de conseil juridique improvisé.",
    category: "acheteur",
    expertRole: "négociateur immobilier belge senior",
    fields: [
      { id: "prix", label: "Prix demandé et prix proposé", type: "text", required: true, placeholder: "Ex. demandé 495 000 €, offert 455 000 €" },
      { id: "conditions", label: "Conditions connues", type: "textarea", placeholder: "Financement, délai, travaux, mobilier, occupation…" },
      { id: "vendeur", label: "Position du vendeur", type: "textarea", placeholder: "Prix minimum, urgence, autres offres…" },
      { id: "objectif", label: "Objectif", type: "select", options: ["Présenter l’offre", "Préparer une contre-offre", "Répondre à l’acheteur", "Relancer les parties"].map(v => ({ label: v, value: v })) },
    ],
    output: ["Analyse factuelle", "Stratégie de communication", "Script d’appel", "Email vendeur", "Message acheteur", "Points à faire valider"],
    guardrails: "Sépare clairement la stratégie commerciale des clauses et effets juridiques à faire valider par le professionnel compétent.",
  },
  {
    id: "social",
    title: "Créer un post vendeur",
    icon: "📱",
    promise: "Créer un contenu qui attire des prospects sans ressembler à une publicité fade.",
    category: "business",
    expertRole: "stratège social media immobilier belge spécialisé en contenu local et génération de mandats",
    fields: [
      { id: "sujet", label: "Sujet", type: "select", required: true, options: ["Nouveau bien", "Bien vendu", "Compromis signé", "Conseil vendeur", "Coulisses du métier", "Estimation offerte", "Témoignage client"].map(v => ({ label: v, value: v })) },
      { id: "contexte", label: "Informations à utiliser", type: "textarea", required: true, placeholder: "Bien, quartier, histoire, résultat, conseil…" },
      { id: "canal", label: "Format", type: "select", required: true, options: ["Post Instagram", "Carrousel", "Story", "Script Reel", "Facebook", "LinkedIn"].map(v => ({ label: v, value: v })) },
      { id: "objectif", label: "Objectif commercial", type: "select", options: ["Obtenir des estimations", "Créer de la confiance", "Attirer des acheteurs", "Montrer l’expertise locale", "Générer des messages privés"].map(v => ({ label: v, value: v })) },
    ],
    output: ["Accroche", "Publication complète", "Structure visuelle", "Appel à l’action", "Hashtags sobres", "Variante plus humaine"],
  },
  {
    id: "regle",
    title: "Vérifier une règle belge",
    icon: "⚖️",
    promise: "Préparer une demande de vérification sourcée, avec région et contexte obligatoires.",
    category: "dossier",
    expertRole: "assistant de recherche réglementaire immobilière belge extrêmement prudent",
    fields: [
      { id: "region", label: "Région", type: "select", required: true, options: ["Bruxelles-Capitale", "Wallonie", "Flandre", "À déterminer"].map(v => ({ label: v, value: v })) },
      { id: "sujet", label: "Sujet", type: "select", required: true, options: ["PEB", "Urbanisme", "Bail", "Préavis", "Indexation", "Copropriété", "Documents de vente", "Fiscalité"].map(v => ({ label: v, value: v })) },
      { id: "question", label: "Question exacte", type: "textarea", required: true, placeholder: "Décris le cas sans nom ni donnée personnelle." },
      { id: "date", label: "Date ou période concernée", type: "text", placeholder: "Ex. vente prévue en septembre 2026" },
    ],
    output: ["Réponse courte", "Ce qui est certain", "Ce qui dépend du dossier", "Sources officielles cliquables", "Date de vérification", "Professionnel à consulter si nécessaire"],
    guardrails: "N’invente aucun texte, article, délai ou obligation. Recherche des sources officielles belges actuelles et cite-les. Si elles ne permettent pas de conclure, dis-le clairement.",
  },
];

export function buildExpertPrompt(workflow: Workflow, values: Record<string, string>) {
  const context = workflow.fields
    .map((field) => `- ${field.label}: ${values[field.id]?.trim() || "Non précisé"}`)
    .join("\n");

  return `Tu es un ${workflow.expertRole}.\n\nMISSION\n${workflow.promise}\n\nCONTEXTE FOURNI\n${context}\n\nLIVRABLE ATTENDU\n${workflow.output.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\nRÈGLES DE QUALITÉ\n- Réponds en français clair, concret et directement exploitable.\n- Ne remplis jamais les informations manquantes par invention.\n- Pose au maximum 3 questions courtes uniquement si elles sont indispensables.\n- Adapte la réponse au marché immobilier belge.\n- Sépare les faits, les recommandations et les éléments à vérifier.\n${workflow.guardrails ? `- ${workflow.guardrails}\n` : ""}- Termine par la prochaine action recommandée.`;
}
