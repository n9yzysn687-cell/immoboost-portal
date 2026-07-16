export type FieldOption = { label: string; value: string };
export type WorkflowField = {
  id: string;
  label: string;
  placeholder?: string;
  type: "text" | "textarea" | "select";
  options?: FieldOption[];
  required?: boolean;
};

export type WorkflowCategory = "mandat" | "vente" | "acheteur" | "business" | "dossier";

export type Workflow = {
  id: string;
  title: string;
  icon: string;
  promise: string;
  category: WorkflowCategory;
  keywords: string[];
  featured?: boolean;
  fields: WorkflowField[];
  expertRole: string;
  output: string[];
  guardrails?: string;
};

const options = (values: string[]) => values.map((value) => ({ label: value, value }));

export const categoryLabels: Record<WorkflowCategory, { title: string; subtitle: string }> = {
  mandat: { title: "Gagner des mandats", subtitle: "Vendeur, estimation, exclusivité et rendez-vous." },
  vente: { title: "Mettre un bien en valeur", subtitle: "Annonce, photos, diffusion et contenu." },
  acheteur: { title: "Gérer les acheteurs", subtitle: "Visite, qualification, offre et suivi." },
  business: { title: "Développer l’activité", subtitle: "Prospection, communication et réseaux sociaux." },
  dossier: { title: "Sécuriser les dossiers", subtitle: "Documents, contrôles et réglementation belge." },
};

export const workflows: Workflow[] = [
  {
    id: "mandat",
    title: "Obtenir un mandat",
    icon: "🎯",
    promise: "Préparer un rendez-vous vendeur et traiter les objections sans improviser.",
    category: "mandat",
    keywords: ["mandat", "vendeur", "exclusivité", "honoraires", "rendez-vous"],
    featured: true,
    expertRole: "coach commercial immobilier senior spécialisé dans les vendeurs belges",
    fields: [
      { id: "bien", label: "Type de bien", type: "select", required: true, options: options(["Maison", "Appartement", "Terrain", "Immeuble", "Commerce"]) },
      { id: "situation", label: "Situation du vendeur", type: "select", required: true, options: options(["Premier rendez-vous", "Hésite entre plusieurs agences", "Refuse l’exclusivité", "Honoraires jugés trop élevés", "Prix souhaité trop haut", "Ne répond plus"]) },
      { id: "contexte", label: "Contexte utile", type: "textarea", placeholder: "Ville, prix envisagé, concurrence, relation avec le vendeur…" },
      { id: "ton", label: "Style souhaité", type: "select", options: options(["Professionnel et rassurant", "Direct et structuré", "Premium", "Chaleureux"]) },
    ],
    output: ["Plan du rendez-vous", "Questions à poser", "Réponses aux objections", "Phrases exactes", "SMS de suivi", "Prochaine action"],
  },
  {
    id: "estimation",
    title: "Préparer une estimation",
    icon: "📊",
    promise: "Structurer l’analyse et présenter une fourchette crédible sans inventer de valeur.",
    category: "mandat",
    keywords: ["estimation", "prix", "valeur", "comparables", "fourchette"],
    expertRole: "conseiller immobilier belge senior spécialisé dans la présentation d’estimations",
    fields: [
      { id: "bien", label: "Bien à estimer", type: "textarea", required: true, placeholder: "Type, commune, surface, état, chambres, terrain…" },
      { id: "comparables", label: "Comparables disponibles", type: "textarea", placeholder: "Prix affichés ou vendus, dates, différences importantes…" },
      { id: "attente", label: "Attente du vendeur", type: "text", placeholder: "Ex. 525 000 €" },
      { id: "objectif", label: "Objectif", type: "select", options: options(["Préparer le rendez-vous", "Expliquer une fourchette", "Argumenter une baisse", "Comparer deux stratégies de prix"]) },
    ],
    output: ["Structure d’analyse", "Facteurs de valeur", "Fourchette à expliquer", "Argumentaire vendeur", "Risques d’un mauvais positionnement", "Questions manquantes"],
    guardrails: "Ne donne aucune valeur certaine sans données de marché suffisantes et ne présente jamais une estimation comme une expertise officielle.",
  },
  {
    id: "annonce",
    title: "Créer une annonce",
    icon: "📝",
    promise: "Transformer les informations brutes du bien en annonce claire, crédible et vendeuse.",
    category: "vente",
    keywords: ["annonce", "immoweb", "description", "titre", "publication"],
    featured: true,
    expertRole: "copywriter immobilier belge senior spécialisé Immoweb et marketing de biens",
    fields: [
      { id: "bien", label: "Type de bien", type: "select", required: true, options: options(["Maison", "Appartement", "Penthouse", "Terrain", "Immeuble de rapport", "Commerce"]) },
      { id: "localisation", label: "Ville ou quartier", type: "text", required: true, placeholder: "Ex. Woluwe-Saint-Pierre" },
      { id: "caracteristiques", label: "Caractéristiques", type: "textarea", required: true, placeholder: "Surface, chambres, jardin, terrasse, parking, état, PEB…" },
      { id: "atouts", label: "Points forts", type: "textarea", placeholder: "Lumière, calme, vue, proximité transports, rénovation…" },
      { id: "cible", label: "Acheteur cible", type: "select", options: options(["Famille", "Jeune couple", "Investisseur", "Premier achat", "Clientèle premium", "À déterminer"]) },
    ],
    output: ["3 titres", "Description Immoweb", "Points forts", "Version réseaux sociaux", "Appel à l’action", "Informations à vérifier"],
    guardrails: "N’invente aucune caractéristique, surface, performance énergétique ou proximité non fournie.",
  },
  {
    id: "photos",
    title: "Préparer les photos",
    icon: "📸",
    promise: "Obtenir l’ordre de publication, les prises manquantes et des conseils concrets.",
    category: "vente",
    keywords: ["photo", "photos", "ordre", "image", "luminosité"],
    featured: true,
    expertRole: "directeur artistique immobilier spécialisé dans la présentation de biens aux acheteurs",
    fields: [
      { id: "bien", label: "Type de bien", type: "text", required: true, placeholder: "Ex. maison 4 façades" },
      { id: "pieces", label: "Photos disponibles", type: "textarea", required: true, placeholder: "Décris-les ou colle la liste : façade, séjour, cuisine, jardin…" },
      { id: "faiblesses", label: "Points faibles connus", type: "textarea", placeholder: "Pièce sombre, travaux, vue, encombrement…" },
      { id: "canal", label: "Canal principal", type: "select", options: options(["Immoweb", "Instagram", "Facebook", "LinkedIn", "Brochure"]) },
    ],
    output: ["Photo d’accroche", "Ordre recommandé", "Photos à retirer", "Photos manquantes", "Conseils de reprise", "Légendes courtes"],
    guardrails: "Ne prétends pas avoir vu une image qui n’a pas été fournie. Analyse uniquement la description disponible.",
  },
  {
    id: "diffusion",
    title: "Créer le kit de diffusion",
    icon: "📣",
    promise: "Décliner un bien sur Immoweb, Facebook, Instagram, LinkedIn et Google Business.",
    category: "vente",
    keywords: ["diffusion", "facebook", "instagram", "linkedin", "google business", "canva"],
    expertRole: "responsable marketing immobilier belge spécialisé dans la diffusion multicanale",
    fields: [
      { id: "bien", label: "Résumé du bien", type: "textarea", required: true, placeholder: "Type, localisation, prix, atouts, cible…" },
      { id: "objectif", label: "Objectif principal", type: "select", required: true, options: options(["Générer des visites", "Créer de la visibilité", "Attirer des vendeurs", "Lancer une campagne locale"]) },
      { id: "identite", label: "Style de l’agence", type: "select", options: options(["Premium", "Local et humain", "Moderne", "Sobre et institutionnel"]) },
      { id: "supports", label: "Supports souhaités", type: "textarea", placeholder: "Ex. post, story, carrousel Canva, script Reel, flyer…" },
    ],
    output: ["Plan de diffusion", "Textes par canal", "Structure visuelle Canva", "Script Reel", "Appels à l’action", "Calendrier de publication"],
  },
  {
    id: "prospect",
    title: "Répondre à un prospect",
    icon: "💬",
    promise: "Répondre vite et orienter chaque échange vers une prochaine action claire.",
    category: "business",
    keywords: ["prospect", "répondre", "whatsapp", "email", "sms", "message"],
    featured: true,
    expertRole: "agent immobilier senior spécialisé en conversion de prospects",
    fields: [
      { id: "canal", label: "Canal", type: "select", required: true, options: options(["Email", "SMS", "WhatsApp", "Instagram", "Facebook", "Téléphone"]) },
      { id: "message", label: "Message reçu", type: "textarea", required: true, placeholder: "Colle le message du prospect sans données sensibles." },
      { id: "objectif", label: "Objectif", type: "select", required: true, options: options(["Obtenir un appel", "Fixer une visite", "Qualifier le besoin", "Demander des documents", "Relancer", "Refuser poliment"]) },
      { id: "ton", label: "Ton", type: "select", options: options(["Professionnel", "Chaleureux", "Premium", "Direct"]) },
    ],
    output: ["Réponse prête à envoyer", "Version courte", "Question de qualification", "Prochaine action", "Relance si silence"],
  },
  {
    id: "appel",
    title: "Préparer un appel",
    icon: "📞",
    promise: "Arriver au téléphone avec un objectif, un script et les réponses aux objections.",
    category: "business",
    keywords: ["appel", "téléphone", "script", "objection", "relance"],
    expertRole: "coach téléphonique immobilier senior spécialisé dans les conversations commerciales",
    fields: [
      { id: "interlocuteur", label: "Interlocuteur", type: "select", required: true, options: options(["Vendeur", "Acheteur", "Prospect", "Notaire", "Syndic", "Courtier"]) },
      { id: "objectif", label: "Objectif de l’appel", type: "select", required: true, options: options(["Fixer un rendez-vous", "Relancer", "Obtenir une décision", "Présenter une offre", "Demander un document", "Annoncer une information difficile"]) },
      { id: "contexte", label: "Contexte", type: "textarea", required: true, placeholder: "Ce qui s’est déjà passé, objections, ton de la relation…" },
      { id: "difficulte", label: "Difficulté attendue", type: "select", options: options(["Simple", "Interlocuteur hésitant", "Interlocuteur difficile", "Sujet sensible"]) },
    ],
    output: ["Ouverture de l’appel", "Questions clés", "Script principal", "Réponses aux objections", "Phrase de clôture", "Message si absence"],
  },
  {
    id: "visite",
    title: "Préparer une visite",
    icon: "🤝",
    promise: "Arriver avec les bons arguments, questions et réponses aux objections.",
    category: "acheteur",
    keywords: ["visite", "acheteur", "objection", "bien", "rendez-vous"],
    expertRole: "coach immobilier senior spécialisé dans les visites et la qualification acheteur",
    fields: [
      { id: "bien", label: "Bien visité", type: "textarea", required: true, placeholder: "Type, prix, atouts, points faibles…" },
      { id: "profil", label: "Profil des visiteurs", type: "textarea", placeholder: "Famille, investisseur, premier achat, besoins connus…" },
      { id: "risques", label: "Objections probables", type: "textarea", placeholder: "Prix, travaux, localisation, PEB, superficie…" },
      { id: "objectif", label: "Objectif de la visite", type: "select", options: options(["Obtenir un retour précis", "Déclencher une seconde visite", "Préparer une offre", "Qualifier le financement"]) },
    ],
    output: ["Plan de visite", "Arguments clés", "Questions à poser", "Réponses aux objections", "Signaux d’achat", "Message après visite"],
  },
  {
    id: "offre",
    title: "Gérer une offre",
    icon: "💰",
    promise: "Préparer la communication et la négociation sans conseil juridique improvisé.",
    category: "acheteur",
    keywords: ["offre", "contre-offre", "négociation", "prix", "acheteur"],
    expertRole: "négociateur immobilier belge senior",
    fields: [
      { id: "prix", label: "Prix demandé et prix proposé", type: "text", required: true, placeholder: "Ex. demandé 495 000 €, offert 455 000 €" },
      { id: "conditions", label: "Conditions connues", type: "textarea", placeholder: "Financement, délai, travaux, mobilier, occupation…" },
      { id: "vendeur", label: "Position du vendeur", type: "textarea", placeholder: "Prix minimum, urgence, autres offres…" },
      { id: "objectif", label: "Objectif", type: "select", options: options(["Présenter l’offre", "Préparer une contre-offre", "Répondre à l’acheteur", "Relancer les parties"]) },
    ],
    output: ["Analyse factuelle", "Stratégie de communication", "Script d’appel", "Email vendeur", "Message acheteur", "Points à faire valider"],
    guardrails: "Sépare clairement la stratégie commerciale des clauses et effets juridiques à faire valider par le professionnel compétent.",
  },
  {
    id: "social",
    title: "Créer du contenu social",
    icon: "📱",
    promise: "Créer des posts et scripts qui renforcent la visibilité locale et génèrent des contacts.",
    category: "business",
    keywords: ["post", "instagram", "facebook", "linkedin", "reel", "story", "canva"],
    expertRole: "stratège social media immobilier belge spécialisé en contenu local et génération de mandats",
    fields: [
      { id: "sujet", label: "Sujet", type: "select", required: true, options: options(["Nouveau bien", "Bien vendu", "Compromis signé", "Conseil vendeur", "Coulisses du métier", "Estimation offerte", "Témoignage client"]) },
      { id: "contexte", label: "Informations à utiliser", type: "textarea", required: true, placeholder: "Bien, quartier, histoire, résultat, conseil…" },
      { id: "canal", label: "Format", type: "select", required: true, options: options(["Post Instagram", "Carrousel Canva", "Story", "Script Reel", "Facebook", "LinkedIn"]) },
      { id: "objectif", label: "Objectif commercial", type: "select", options: options(["Obtenir des estimations", "Créer de la confiance", "Attirer des acheteurs", "Montrer l’expertise locale", "Générer des messages privés"]) },
    ],
    output: ["Accroche", "Publication complète", "Structure visuelle", "Appel à l’action", "Hashtags sobres", "Variante plus humaine"],
  },
  {
    id: "documents",
    title: "Préparer les documents",
    icon: "📂",
    promise: "Construire une checklist claire des pièces à demander et des points à vérifier.",
    category: "dossier",
    keywords: ["documents", "dossier", "compromis", "syndic", "checklist"],
    expertRole: "coordinateur de dossiers immobiliers belges extrêmement rigoureux",
    fields: [
      { id: "operation", label: "Opération", type: "select", required: true, options: options(["Mise en vente", "Appartement en copropriété", "Maison", "Terrain", "Location", "Préparation compromis"]) },
      { id: "region", label: "Région", type: "select", required: true, options: options(["Bruxelles-Capitale", "Wallonie", "Flandre", "À déterminer"]) },
      { id: "contexte", label: "Contexte du dossier", type: "textarea", placeholder: "Bien occupé, travaux, copropriété, succession, situation particulière…" },
      { id: "deja", label: "Documents déjà disponibles", type: "textarea", placeholder: "Liste rapide des pièces reçues." },
    ],
    output: ["Checklist organisée", "Documents prioritaires", "Qui contacter", "Points bloquants", "Questions à poser", "Éléments à vérifier officiellement"],
    guardrails: "Ne présente pas une checklist générale comme juridiquement exhaustive. Signale les variations régionales et les situations nécessitant un notaire ou un professionnel compétent.",
  },
  {
    id: "regle",
    title: "Vérifier une règle belge",
    icon: "⚖️",
    promise: "Préparer une demande sourcée avec région et contexte obligatoires.",
    category: "dossier",
    keywords: ["peb", "urbanisme", "bail", "préavis", "indexation", "règle", "loi"],
    featured: true,
    expertRole: "assistant de recherche réglementaire immobilière belge extrêmement prudent",
    fields: [
      { id: "region", label: "Région", type: "select", required: true, options: options(["Bruxelles-Capitale", "Wallonie", "Flandre", "À déterminer"]) },
      { id: "sujet", label: "Sujet", type: "select", required: true, options: options(["PEB", "Urbanisme", "Bail", "Préavis", "Indexation", "Copropriété", "Documents de vente", "Fiscalité"]) },
      { id: "question", label: "Question exacte", type: "textarea", required: true, placeholder: "Décris le cas sans nom ni donnée personnelle." },
      { id: "date", label: "Date ou période concernée", type: "text", placeholder: "Ex. vente prévue en septembre 2026" },
    ],
    output: ["Réponse courte", "Ce qui est certain", "Ce qui dépend du dossier", "Sources officielles cliquables", "Date de vérification", "Professionnel à consulter si nécessaire"],
    guardrails: "N’invente aucun texte, article, délai ou obligation. Recherche des sources officielles belges actuelles et cite-les. Si elles ne permettent pas de conclure, dis-le clairement.",
  },
];

export function searchWorkflows(query: string, category: WorkflowCategory | "all" = "all") {
  const normalized = query.toLowerCase().trim();
  return workflows.filter((workflow) => {
    const categoryMatch = category === "all" || workflow.category === category;
    if (!normalized) return categoryMatch;
    const haystack = [workflow.title, workflow.promise, ...workflow.keywords].join(" ").toLowerCase();
    return categoryMatch && haystack.includes(normalized);
  });
}

export function buildExpertPrompt(workflow: Workflow, values: Record<string, string>) {
  const context = workflow.fields
    .map((field) => `- ${field.label}: ${values[field.id]?.trim() || "Non précisé"}`)
    .join("\n");

  return `Tu es un ${workflow.expertRole}.\n\nMISSION\n${workflow.promise}\n\nCONTEXTE FOURNI\n${context}\n\nLIVRABLE ATTENDU\n${workflow.output.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\nRÈGLES DE QUALITÉ\n- Réponds en français clair, concret et directement exploitable.\n- Ne remplis jamais les informations manquantes par invention.\n- Pose au maximum 3 questions courtes uniquement si elles sont indispensables.\n- Adapte la réponse au marché immobilier belge.\n- Sépare les faits, les recommandations et les éléments à vérifier.\n- Pour les contenus marketing, propose une structure visuelle simple réalisable dans Canva.\n${workflow.guardrails ? `- ${workflow.guardrails}\n` : ""}- Termine par la prochaine action recommandée.`;
}
