import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AgentId = "communication" | "prospection" | "annonce" | "photos" | "vendeur" | "visite" | "offre" | "reglementation";

const agents: Record<AgentId, { name: string; icon: string; instructions: string; official?: boolean }> = {
  communication: {
    name: "Agent Communication",
    icon: "✉️",
    instructions: "Rédige des emails, SMS et messages WhatsApp professionnels, humains et directement copiables. Demande uniquement les informations indispensables. Propose une version courte par défaut.",
  },
  prospection: {
    name: "Agent Prospection",
    icon: "🎯",
    instructions: "Aide un agent immobilier belge à contacter, qualifier et relancer des prospects. Produis scripts d'appel, messages et plans de suivi concrets, sans promesse trompeuse.",
  },
  annonce: {
    name: "Agent Annonce",
    icon: "🏠",
    instructions: "Transforme les caractéristiques d'un bien en annonce immobilière claire et attractive. N'invente aucune caractéristique. Donne un titre, un texte principal, les points forts et une version courte pour réseaux sociaux.",
  },
  photos: {
    name: "Agent Photos",
    icon: "📸",
    instructions: "Conseille sur l'ordre, la sélection et l'amélioration de photos immobilières. Sans images jointes, donne une checklist précise et demande les photos nécessaires. Ne prétends jamais avoir vu une image absente.",
  },
  vendeur: {
    name: "Agent Vendeur",
    icon: "🤝",
    instructions: "Aide à préparer un rendez-vous vendeur, répondre aux objections, expliquer le mandat, l'exclusivité et les honoraires. Reste éthique, non agressif et orienté confiance.",
  },
  visite: {
    name: "Agent Visite",
    icon: "🔑",
    instructions: "Prépare les visites, questions, arguments, suivi après visite et réponses aux hésitations. Donne une action immédiate, puis un message de suivi copiable.",
  },
  offre: {
    name: "Agent Offre & Négociation",
    icon: "💶",
    instructions: "Aide à communiquer une offre, préparer une contre-proposition et organiser la négociation. Ne donne pas d'avis juridique définitif et signale les clauses ou délais à vérifier.",
  },
  reglementation: {
    name: "Agent Réglementation Belgique",
    icon: "⚖️",
    official: true,
    instructions: "Adapte la réponse au marché indiqué. Pour une règle locale, demande le pays/région si absent. Pour toute règle, obligation, délai, PEB, urbanisme, bail, fiscalité ou document légal, recherche des sources officielles belges actuelles. Cite les sources utilisées. Si les sources ne suffisent pas, dis exactement ce qui reste à confirmer. Ne mélange jamais les règles françaises, suisses ou luxembourgeoises.",
  },
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function routeAgent(question: string): AgentId {
  const q = normalize(question);
  if (/(peb|urbanisme|permis|bail|preavis|indexation|fiscal|loi|legal|reglement|compromis|notaire)/.test(q)) return "reglementation";
  if (/(photo|image|visuel|luminosite|ordre des photos)/.test(q)) return "photos";
  if (/(annonce|immoweb|description du bien|titre de vente|publication)/.test(q)) return "annonce";
  if (/(prospect|prospection|appel a froid|porte a porte|lead|relance prospect)/.test(q)) return "prospection";
  if (/(vendeur|mandat|exclusivite|honoraires|commission|estimation)/.test(q)) return "vendeur";
  if (/(visite|acheteur hesite|apres visite|rendez-vous acheteur)/.test(q)) return "visite";
  if (/(offre|contre-offre|negociation|prix propose|condition suspensive)/.test(q)) return "offre";
  return "communication";
}

function extractText(data: any): string {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const chunks: string[] = [];
  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function extractSources(data: any) {
  const seen = new Set<string>();
  const sources: { title: string; url: string }[] = [];
  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      for (const annotation of content.annotations ?? []) {
        const url = annotation.url ?? annotation.url_citation?.url;
        const title = annotation.title ?? annotation.url_citation?.title ?? "Source officielle";
        if (url && !seen.has(url)) {
          seen.add(url);
          sources.push({ title, url });
        }
      }
    }
  }
  return sources.slice(0, 6);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = String(body?.question ?? "").trim();
    const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];

    if (!question) return NextResponse.json({ error: "Écrivez une demande." }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "La clé OpenAI n'est pas configurée côté serveur.", code: "MISSING_API_KEY" }, { status: 503 });
    }

    const agentId = routeAgent(question);
    const agent = agents[agentId];
    const input = [
      ...history.map((message: any) => ({ role: message.role === "assistant" ? "assistant" : "user", content: String(message.content ?? "") })),
      { role: "user", content: question },
    ];

    const payload: any = {
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions: `Tu es ${agent.name}, membre d'Agent Daily. ${agent.instructions}\n\nRègles communes : réponds en français, de manière courte et immédiatement exploitable. Commence par la réponse utile, puis propose les éléments copiables. N'invente jamais de faits, prix, caractéristiques, lois ou sources. Ne demande pas de données personnelles inutiles.`,
      input,
      max_output_tokens: 1200,
      store: false,
    };

    if (agent.official) payload.tools = [{ type: "web_search" }];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI error", data);
      return NextResponse.json({ error: "Le moteur IA n'a pas pu répondre. Aucun crédit ne doit être débité." }, { status: 502 });
    }

    return NextResponse.json({
      answer: extractText(data) || "Je n'ai pas obtenu de réponse exploitable.",
      agent: { id: agentId, name: agent.name, icon: agent.icon, official: Boolean(agent.official) },
      sources: extractSources(data),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Une erreur inattendue est survenue." }, { status: 500 });
  }
}
