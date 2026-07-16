import type { SpecialistAgent } from "./agents";
export type DailyAction={id:string;title:string;icon:string;description:string;prompt:string;agentId:SpecialistAgent["id"]};
export const dailyActions:DailyAction[]=[
{id:"email",title:"Rédiger un email",icon:"✉️",description:"Relance, suivi vendeur, réponse acheteur ou après-visite.",prompt:"Rédige un email professionnel pour ",agentId:"communication"},
{id:"prospect",title:"Répondre à un prospect",icon:"📞",description:"Transformer un premier contact en prochaine action claire.",prompt:"Aide-moi à répondre à ce prospect : ",agentId:"communication"},
{id:"listing",title:"Créer une annonce",icon:"🏠",description:"Titre, texte Immoweb, points forts et appel à l’action.",prompt:"Prépare une annonce immobilière à partir de ces informations : ",agentId:"marketing"},
{id:"photos",title:"Améliorer mes photos",icon:"📸",description:"Choisir l’ordre, repérer les photos faibles et parler aux acheteurs.",prompt:"Analyse cette série de photos et propose l’ordre idéal pour l’annonce. ",agentId:"marketing"},
{id:"seller",title:"Préparer un vendeur",icon:"🤝",description:"Mandat, honoraires, exclusivité et objections.",prompt:"Prépare-moi pour cette situation vendeur : ",agentId:"seller"},
{id:"visit",title:"Préparer une visite",icon:"👥",description:"Arguments, questions et suivi après visite.",prompt:"Prépare cette visite immobilière : ",agentId:"visit"},
{id:"offer",title:"Gérer une offre",icon:"💰",description:"Présenter, négocier et préparer la suite sans improviser.",prompt:"Aide-moi à gérer cette offre : ",agentId:"offer"},
{id:"verify",title:"Vérifier une règle belge",icon:"⚖️",description:"PEB, urbanisme, bail ou documents avec sources officielles.",prompt:"Vérifie cette question pour la Belgique et cite les sources : ",agentId:"regulation"}
];