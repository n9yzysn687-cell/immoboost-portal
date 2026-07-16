import { NextResponse } from "next/server";
import { routeQuestion } from "../../../lib/agents";

export const runtime = "nodejs";

const MAX_QUESTION_LENGTH = 5_000;
const MAX_IMAGE_LENGTH = 8_000_000;
const SUPPORTED_IMAGE = /^data:image\/(jpeg|png|webp);base64,/;

const kitSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "diagnostic",
    "objective",
    "urgency",
    "plan",
    "email",
    "sms",
    "callScript",
    "checklist",
    "documents",
    "nextAction",
    "warning",
    "sources",
  ],
  properties: {
    title: { type: "string" },
    diagnostic: { type: "string" },
    objective: { type: "string" },
    urgency: { type: "string", enum: ["maintenant", "aujourd'hui", "cette semaine"] },
    plan: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
        },
      },
    },
    email: {
      type: "object",
      additionalProperties: false,
      required: ["subject", "body"],
      properties: {
        subject: { type: "string" },
        body: { type: "string" },
      },
    },
    sms: { type: "string" },
    callScript: {
      type: "object",
      additionalProperties: false,
      required: ["opening", "questions", "objections", "closing"],
      properties: {
        opening: { type: "string" },
        questions: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
        objections: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
        closing: { type: "string" },
      },
    },
    checklist: { type: "array", minItems: 3, maxItems: 8, items: { type: "string" } },
    documents: { type: "array", maxItems: 6, items: { type: "string" } },
    nextAction: {
      type: "object",
      additionalProperties: false,
      required: ["title", "detail", "when"],
      properties: {
        title: { type: "string" },
        detail: { type: "string" },
        when: { type: "string" },
      },
    },
    warning: { type: "string" },
    sources: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "url"],
        properties: {
          title: { type: "string" },
          url: { type: "string" },
        },
      },
    },
  },
} as const;

function extractOutputText(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const response = data as { output_text?: unknown; output?: unknown };
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return "";

  const chunks: string[] = [];
  for (const item of response.output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content && typeof content === "object" && "text" in content && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function isRegulatoryRequest(question: string) {
  return /\b(peb|urbanisme|permis|bail|préavis|preavis|indexation|copropriété|copropriete|fiscal|loi|légal|legal|réglementation|reglementation|compromis|notaire)\b/i.test(question);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: unknown; image?: unknown };
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const image = typeof body.image === "string" ? body.image : "";

    if (!question && !image) {
      return NextResponse.json({ error: "Décrivez la situation ou ajoutez une photo." }, { status: 400 });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: "La demande est trop longue. Limite : 5 000 caractères." }, { status: 413 });
    }
    if (image && (image.length > MAX_IMAGE_LENGTH || !SUPPORTED_IMAGE.test(image))) {
      return NextResponse.json({ error: "Photo non prise en charge. Utilisez un JPG, PNG ou WebP de moins de 5 Mo." }, { status: 415 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Le moteur ImmoBoost n'est pas encore activé sur cet environnement.", code: "MISSING_API_KEY" },
        { status: 503 },
      );
    }

    const expert = routeQuestion(question || "Analyse cette photo immobilière");
    const needsOfficialSources = isRegulatoryRequest(question);
    const content: Array<Record<string, string>> = [
      {
        type: "input_text",
        text: `Situation de l'agent : ${question || "La situation est décrite uniquement par la photo jointe."}`,
      },
    ];
    if (image) content.push({ type: "input_image", image_url: image, detail: "high" });

    const payload: Record<string, unknown> = {
      model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: 3_200,
      instructions: `Tu es le Mission Brain d'ImmoBoost AI™, assistant opérationnel pour agents immobiliers en Belgique.

Expert principal sélectionné : ${expert.name}. Domaine : ${expert.scope}.

Ta mission : comprendre la situation, identifier l'objectif réel, puis livrer immédiatement un kit complet et personnalisé. L'utilisateur ne doit chercher aucun template et ne doit pas reformuler sa demande.

Règles de production :
- Réponds en français belge naturel, professionnel, humain et directement utilisable.
- Adapte chaque élément aux faits fournis. N'invente jamais de nom, adresse, prix, surface, caractéristique, loi ou délai.
- Quand une donnée manque, utilise une formulation neutre ou indique précisément quoi confirmer dans la checklist. Ne pose pas de question avant de livrer le kit.
- Les emails, SMS et scripts doivent être prêts à l'emploi sans champs entre crochets inutiles.
- Le plan doit être bref, priorisé et exécutable.
- Les documents sont les pièces à réunir ou produire, jamais des documents prétendument joints.
- La prochaine action doit être unique, concrète et datée par rapport à maintenant.
- Pour tout sujet juridique, réglementaire, PEB, urbanisme, fiscal ou régional : distingue information générale et validation professionnelle, utilise uniquement des sources officielles belges actuelles et place leurs URL dans sources.
- Si aucune vérification réglementaire n'est nécessaire, sources doit être un tableau vide.
- warning doit être vide sauf si une information doit être vérifiée, si un risque existe ou si un professionnel compétent doit valider un point.
- Si une photo est jointe, analyse uniquement ce qui est réellement visible et signale toute incertitude.`,
      input: [{ role: "user", content }],
      text: {
        format: {
          type: "json_schema",
          name: "immoboost_kit",
          strict: true,
          schema: kitSchema,
        },
      },
    };

    if (needsOfficialSources) payload.tools = [{ type: "web_search" }];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    });

    const data: unknown = await response.json();
    if (!response.ok) {
      console.error("OpenAI Responses error", response.status, data);
      return NextResponse.json({ error: "Le moteur ImmoBoost n'a pas pu préparer le kit. Réessayez dans un instant." }, { status: 502 });
    }

    const outputText = extractOutputText(data);
    if (!outputText) {
      return NextResponse.json({ error: "Le moteur n'a pas produit de kit exploitable." }, { status: 502 });
    }

    let kit: unknown;
    try {
      kit = JSON.parse(outputText);
    } catch {
      return NextResponse.json({ error: "Le kit reçu est incomplet. Réessayez." }, { status: 502 });
    }

    return NextResponse.json({ kit, expert: { id: expert.id, name: expert.name } });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "La préparation prend trop de temps. Réessayez." }, { status: 504 });
    }
    console.error("ImmoBoost API error", error);
    return NextResponse.json({ error: "Une erreur inattendue est survenue." }, { status: 500 });
  }
}
