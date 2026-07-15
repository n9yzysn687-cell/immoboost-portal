export type Resource = {
  id: string;
  title: string;
  icon: string;
  summary: string;
  duration: string;
  country: "BE";
  profession: "real-estate";
  tags: string[];
  checklist: string[];
  questions: string[];
  documents: string[];
  attention: string[];
  coach: {
    prompts: { title: string; answer: string; sms: string; email: string }[];
  };
};

export const resources: Resource[] = [
  {
    id: "seller-meeting",
    title: "Rendez-vous vendeur",
    icon: "🤝",
    summary: "Questions, documents, objections et suivi.",
    duration: "2 min",
    country: "BE",
    profession: "real-estate",
    tags: ["vendeur", "mandat", "honoraires", "exclusivité", "rendez-vous"],
    checklist: [
      "Vérifier l’adresse, l’heure et le trajet",
      "Préparer quelques comparables récents",
      "Clarifier vos honoraires et votre méthode",
      "Prévoir les supports de présentation utiles",
      "Préparer les questions sur le projet et le délai",
      "Vérifier les informations publiques disponibles"
    ],
    questions: [
      "Pourquoi envisagez-vous de vendre aujourd’hui ?",
      "Quel serait votre calendrier idéal ?",
      "Qu’attendez-vous de votre futur agent ?",
      "Avez-vous déjà reçu une estimation ?",
      "Quels travaux ont été réalisés ?",
      "Quel point dois-je absolument connaître ?"
    ],
    documents: [
      "Présentation de votre méthode",
      "Explication des honoraires",
      "Liste indicative des documents de vente",
      "Support de prise de notes anonymisé",
      "Modèle de suivi après rendez-vous"
    ],
    attention: [
      "Ne jamais présenter une estimation comme une garantie",
      "Distinguer faits vérifiés et hypothèses",
      "Éviter toute donnée personnelle inutile",
      "Faire vérifier les sujets juridiques ou fiscaux sensibles",
      "Ne pas promettre un délai de vente"
    ],
    coach: { prompts: [
      { title: "Le vendeur refuse l’exclusivité", answer: "Identifiez d’abord sa crainte, puis présentez vos engagements concrets et l’avantage d’un interlocuteur unique.", sms: "Merci pour notre échange. L’exclusivité n’est pas une contrainte : elle me permet d’engager pleinement les actions convenues et de vous offrir un suivi clair.", email: "Objet : Votre accompagnement\n\nMerci pour notre échange. Je comprends votre prudence. Mon approche repose sur des engagements précis, un interlocuteur unique et un suivi transparent. Je reste disponible pour reprendre chaque point avec vous." },
      { title: "Les honoraires sont trop élevés", answer: "Ne défendez pas un pourcentage. Expliquez la valeur : préparation, visibilité, qualification, négociation et sécurisation.", sms: "Je comprends votre remarque. Mes honoraires couvrent un accompagnement complet, de la préparation jusqu’à la sécurisation de la vente. Je peux vous détailler chaque engagement.", email: "Objet : Détail de mon accompagnement\n\nMes honoraires couvrent la préparation, le positionnement, la diffusion, la qualification des candidats, la négociation et le suivi du dossier. Je vous propose de parcourir ces engagements ensemble." },
      { title: "Il estime son bien plus haut", answer: "Reconnaissez son attachement, puis revenez à la méthode, aux comparables et au risque d’un prix trop élevé.", sms: "Votre attente est compréhensible. Mon objectif est de défendre le meilleur prix réaliste, sur la base du marché et des caractéristiques du bien.", email: "Objet : Positionnement du bien\n\nJe comprends votre attente. Mon analyse vise à distinguer valeur affective et valeur de marché afin de choisir un positionnement qui protège votre intérêt et évite une commercialisation trop longue." },
      { title: "Il veut réfléchir", answer: "Ne poussez pas. Résumez les points convenus et proposez une prochaine étape simple et datée.", sms: "Merci pour votre accueil. Prenez le temps nécessaire. Je vous propose un bref point dans quelques jours pour répondre à vos dernières questions.", email: "Objet : Suite à notre rendez-vous\n\nMerci pour votre accueil. Je vous joins un résumé des points évoqués. Prenez le temps de l’examiner et je vous propose un bref échange pour répondre à vos dernières questions." }
    ] }
  },
  {
    id: "valuation",
    title: "Estimation",
    icon: "🏡",
    summary: "Relevé, analyse, comparables et présentation du prix.",
    duration: "3 min",
    country: "BE",
    profession: "real-estate",
    tags: ["estimation", "prix", "comparables", "surface", "marché"],
    checklist: ["Type et état du bien", "Surface habitable et terrain", "Équipements et travaux", "Environnement et nuisances", "PEB et RC disponibles", "Comparables récents vérifiés"],
    questions: ["Quels travaux ont été réalisés ?", "Quel délai de vente est envisagé ?", "Existe-t-il des servitudes ?", "Le bien est-il occupé ?", "Quels sont ses points forts ?", "Quels défauts dois-je connaître ?"],
    documents: ["Fiche de relevé", "Tableau de comparables", "Compte-rendu d’estimation", "Liste des vérifications Belgique"],
    attention: ["Ne pas annoncer un prix avant l’analyse", "Ne pas surévaluer pour obtenir le mandat", "Expliquer la méthode", "Vérifier les règles régionales", "Distinguer estimation et prix garanti"],
    coach: { prompts: [
      { title: "Annoncer un prix inférieur aux attentes", answer: "Commencez par la méthode et les preuves, puis présentez une fourchette argumentée.", sms: "Mon analyse aboutit à une fourchette réaliste fondée sur les comparables et les caractéristiques du bien. Je vous l’explique point par point.", email: "Objet : Votre estimation\n\nL’estimation repose sur les caractéristiques du bien, son environnement et des comparables pertinents. Je vous propose une fourchette argumentée plutôt qu’un chiffre isolé." },
      { title: "Une autre agence annonce plus", answer: "Demandez sur quelles données elle s’appuie. Comparez les méthodes, pas seulement les chiffres.", sms: "Je comprends. L’important est de comparer les méthodes et les biens de référence utilisés, pas uniquement le chiffre annoncé.", email: "Objet : Comparaison des estimations\n\nUne différence d’estimation mérite d’être expliquée. Comparons les références, les ajustements et la stratégie de mise en vente afin de choisir une base solide." }
    ] }
  },
  {
    id: "listing",
    title: "Mise en vente",
    icon: "📢",
    summary: "Photos, annonce, diffusion et contrôle avant publication.",
    duration: "2 min",
    country: "BE",
    profession: "real-estate",
    tags: ["annonce", "photos", "publication", "immoweb", "marketing"],
    checklist: ["Prix validé", "Surface et caractéristiques vérifiées", "Photos complètes", "PEB disponible si requis", "Mentions régionales vérifiées", "Annonce relue"],
    questions: ["Quel est le principal atout ?", "Quel public cible ?", "Quelle disponibilité ?", "Quels équipements distinguent le bien ?", "Quelles informations doivent être vérifiées ?"],
    documents: ["Plan photo", "Structure d’annonce", "Checklist de publication", "Textes réseaux sociaux"],
    attention: ["Éviter les informations contradictoires", "Ne pas masquer un défaut important", "Vérifier les mentions obligatoires", "Ne pas publier de données personnelles", "Faire valider le prix"],
    coach: { prompts: [
      { title: "L’annonce ne génère pas de contacts", answer: "Vérifiez d’abord la photo principale, le prix, le titre et la cohérence des informations.", sms: "Je vous propose de revoir ensemble la présentation et le positionnement du bien afin d’améliorer sa visibilité.", email: "Objet : Optimisation de la commercialisation\n\nLes premiers retours invitent à vérifier la photo principale, le titre, le prix et la clarté de l’annonce. Je vous propose un ajustement ciblé." },
      { title: "Les photos sont faibles", answer: "Priorisez lumière, ordre des pièces, verticales droites et une première image forte.", sms: "Pour valoriser le bien, je recommande une nouvelle série de photos plus lumineuses et mieux structurées.", email: "Objet : Amélioration des visuels\n\nLes visuels jouent un rôle décisif. Une nouvelle série mieux éclairée et organisée renforcera nettement l’impact de l’annonce." }
    ] }
  },
  {
    id: "client-reply",
    title: "Réponse client",
    icon: "💬",
    summary: "Réponses prêtes pour email, WhatsApp et SMS.",
    duration: "30 sec",
    country: "BE",
    profession: "real-estate",
    tags: ["email", "sms", "whatsapp", "client", "relance"],
    checklist: ["Choisir le canal", "Clarifier l’objectif", "Rester factuel", "Éviter les données inutiles", "Proposer une prochaine étape"],
    questions: ["À qui répondez-vous ?", "Quel résultat souhaitez-vous ?", "Quel ton convient ?", "Quelle échéance ?"],
    documents: ["Relance vendeur", "Suivi après visite", "Demande de documents", "Confirmation de rendez-vous"],
    attention: ["Ne pas promettre sans validation", "Éviter le jargon", "Conserver une trace dans l’outil habituel", "Rester prudent sur les sujets juridiques"],
    coach: { prompts: [
      { title: "Relancer sans paraître insistant", answer: "Rappelez le contexte, apportez une information utile et proposez une action simple.", sms: "Bonjour, je reviens vers vous suite à notre échange. Avez-vous eu l’occasion d’avancer ? Je reste disponible pour un bref point.", email: "Objet : Petit suivi\n\nJe reviens vers vous suite à notre échange. Je reste disponible pour répondre à vos questions et vous propose un bref point lorsque cela vous convient." },
      { title: "Demander un document manquant", answer: "Expliquez pourquoi il est utile, puis demandez-le clairement sans dramatiser.", sms: "Pour poursuivre correctement le dossier, pourriez-vous me transmettre le document manquant dès que possible ? Merci.", email: "Objet : Document utile au dossier\n\nAfin de poursuivre le dossier dans de bonnes conditions, pourriez-vous me transmettre le document concerné ? Je reste disponible en cas de question." }
    ] }
  },
  {
    id: "visit",
    title: "Visite acheteur",
    icon: "👥",
    summary: "Préparation, questions, objections et suivi après visite.",
    duration: "2 min",
    country: "BE",
    profession: "real-estate",
    tags: ["visite", "acheteur", "objection", "suivi"],
    checklist: ["Confirmer le rendez-vous", "Aérer et éclairer", "Préparer les informations clés", "Vérifier l’accès", "Prévoir un suivi après visite"],
    questions: ["Quel est votre projet ?", "Quel délai ?", "Votre financement est-il préparé ?", "Quels critères sont indispensables ?", "Quel est votre ressenti ?"],
    documents: ["Fiche visite", "Informations du bien", "Message de suivi", "Checklist retour vendeur"],
    attention: ["Ne pas inventer une information", "Ne pas minimiser un défaut", "Éviter les données personnelles", "Faire confirmer les points techniques"],
    coach: { prompts: [
      { title: "L’acheteur hésite", answer: "Demandez ce qui bloque précisément, puis répondez au point réel plutôt qu’à une objection supposée.", sms: "Merci pour votre visite. Quel est le principal point qui vous fait encore hésiter ? Je peux vérifier les informations utiles.", email: "Objet : Suite à votre visite\n\nMerci pour votre visite. Pour vous aider à avancer, pourriez-vous m’indiquer le point principal qui mérite encore une clarification ?" },
      { title: "Il veut négocier fortement", answer: "Clarifiez ses arguments, son financement et son calendrier avant de transmettre une offre structurée.", sms: "Je peux transmettre votre position au vendeur. Pour la présenter correctement, merci de confirmer le montant, le financement et les éventuelles conditions.", email: "Objet : Votre position\n\nAfin de présenter votre proposition clairement, merci de confirmer le montant, le calendrier, le financement et les éventuelles conditions." }
    ] }
  },
  {
    id: "offer",
    title: "Offre & négociation",
    icon: "💰",
    summary: "Préparer la communication et les prochaines étapes.",
    duration: "2 min",
    country: "BE",
    profession: "real-estate",
    tags: ["offre", "négociation", "contre-offre", "acheteur", "vendeur"],
    checklist: ["Montant confirmé", "Identité gérée dans l’outil sécurisé", "Financement clarifié", "Conditions identifiées", "Délais vérifiés", "Transmission tracée"],
    questions: ["Le financement est-il préparé ?", "Quelles conditions sont demandées ?", "Quel délai de validité ?", "Le vendeur souhaite-t-il contre-proposer ?"],
    documents: ["Checklist offre", "Message vendeur", "Message acheteur", "Points à vérifier avec le notaire"],
    attention: ["Ne pas donner d’avis juridique personnalisé", "Faire vérifier les clauses", "Ne pas garantir l’acceptation", "Tracer les échanges dans l’outil approprié"],
    coach: { prompts: [
      { title: "L’offre est jugée trop basse", answer: "Présentez les faits, les conditions et la solidité du candidat. Laissez le vendeur décider sans pression.", sms: "Une offre a été reçue. Elle est inférieure au prix demandé, mais je vous propose de l’examiner avec ses conditions et le profil de financement.", email: "Objet : Offre reçue\n\nUne offre a été reçue. Je vous propose de l’examiner au regard du montant, des conditions, du financement et du calendrier avant toute décision." },
      { title: "Préparer une contre-offre", answer: "Clarifiez le montant, la durée de validité et les conditions, puis faites vérifier le cadre applicable.", sms: "Le vendeur souhaite vous soumettre une contre-proposition. Je vous en présente les éléments de manière claire afin que vous puissiez l’examiner.", email: "Objet : Contre-proposition\n\nLe vendeur souhaite formuler une contre-proposition. Je vous transmets les éléments essentiels et vous invite à les faire vérifier si nécessaire avant décision." }
    ] }
  }
];

export function findResources(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return resources;
  return resources.filter((resource) =>
    [resource.title, resource.summary, ...resource.tags].join(" ").toLowerCase().includes(normalized)
  );
}
