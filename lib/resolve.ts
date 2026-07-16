import { resources, type Resource } from "./catalog";

export type ResolveResult = {
  id: string;
  kind: "preparation" | "situation";
  resource: Resource;
  promptIndex?: number;
  title: string;
  description: string;
  keywords: string;
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const resolveIndex: ResolveResult[] = resources.flatMap((resource) => {
  const preparation: ResolveResult = {
    id: `preparation:${resource.id}`,
    kind: "preparation",
    resource,
    title: resource.title,
    description: resource.summary,
    keywords: normalize([resource.title, resource.summary, ...resource.tags].join(" ")),
  };

  const situations = resource.coach.prompts.map<ResolveResult>((prompt, promptIndex) => ({
    id: `situation:${resource.id}:${promptIndex}`,
    kind: "situation",
    resource,
    promptIndex,
    title: prompt.title,
    description: prompt.answer,
    keywords: normalize([
      resource.title,
      resource.summary,
      ...resource.tags,
      prompt.title,
      prompt.answer,
      prompt.sms,
      prompt.email,
    ].join(" ")),
  }));

  return [preparation, ...situations];
});

export function resolveSituations(query: string): ResolveResult[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return resolveIndex.slice(0, 12);

  return resolveIndex
    .map((result) => {
      const title = normalize(result.title);
      const score = terms.reduce((total, term) => {
        if (title === term) return total + 8;
        if (title.includes(term)) return total + 5;
        if (result.keywords.includes(term)) return total + 2;
        return total;
      }, 0);
      return { result, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ result }) => result)
    .slice(0, 12);
}
