"use client";

import { useMemo, useState } from "react";
import {
  buildExpertPrompt,
  categoryLabels,
  searchWorkflows,
  workflows,
  type Workflow,
  type WorkflowCategory,
} from "../lib/workflows";

type Provider = { id: string; name: string; icon: string; url: string; note: string };
type CategoryFilter = WorkflowCategory | "all";

const providers: Provider[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "◉", url: "https://chatgpt.com/", note: "Le plus simple pour démarrer" },
  { id: "gemini", name: "Gemini", icon: "✦", url: "https://gemini.google.com/app", note: "Alternative Google" },
  { id: "claude", name: "Claude", icon: "◇", url: "https://claude.ai/new", note: "Excellent pour la rédaction" },
];

const categoryIcons: Record<WorkflowCategory, string> = {
  mandat: "🎯",
  vente: "🏠",
  acheteur: "🤝",
  business: "📈",
  dossier: "📂",
};

export default function Home() {
  const [active, setActive] = useState<Workflow | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const prompt = useMemo(() => (active ? buildExpertPrompt(active, values) : ""), [active, values]);
  const missingRequired = active?.fields.some((field) => field.required && !values[field.id]?.trim()) ?? true;
  const filtered = useMemo(() => searchWorkflows(query, category), [query, category]);
  const featured = workflows.filter((workflow) => workflow.featured);

  function openWorkflow(workflow: Workflow) {
    setActive(workflow);
    setValues({});
    setGenerated(false);
    setCopied(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyPrompt() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function launch(provider: Provider) {
    await copyPrompt();
    window.open(provider.url, "_blank", "noopener,noreferrer");
  }

  function reset() {
    setActive(null);
    setValues({});
    setGenerated(false);
    setCopied(false);
  }

  return (
    <main className="appShell">
      <header className="topbar">
        <button className="logo" onClick={reset}>IB</button>
        <div className="brand"><strong>ImmoBoost™ Belgique</strong><span>Tout ce qu’un agent doit accomplir, au même endroit.</span></div>
        <span className="market">🇧🇪 Belgique · FR</span>
      </header>

      {!active && (
        <>
          <section className="hero landingHero">
            <span className="eyebrow">VOTRE COPILOTE MÉTIER</span>
            <h1>Que devez-vous accomplir maintenant&nbsp;?</h1>
            <p>Pas de bibliothèque confuse. Choisissez une mission, répondez à quelques questions et repartez avec un brief senior prêt à exécuter dans votre IA.</p>

            <div className="missionSearch">
              <span>⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex. vendeur refuse l’exclusivité, créer un Reel, préparer une offre…"
              />
              {query && <button onClick={() => setQuery("")}>Effacer</button>}
            </div>
          </section>

          <section className="workspace dashboardWorkspace">
            {!query && category === "all" && (
              <div className="featuredBlock">
                <div className="sectionHeading"><span>MISSIONS EXPRESS</span><h2>Les besoins les plus fréquents</h2></div>
                <div className="featuredGrid">
                  {featured.map((workflow) => (
                    <button className="featuredCard" key={workflow.id} onClick={() => openWorkflow(workflow)}>
                      <span>{workflow.icon}</span><div><strong>{workflow.title}</strong><small>{workflow.promise}</small></div><b>→</b>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="categoryTabs" aria-label="Catégories de missions">
              <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>Tout</button>
              {(Object.keys(categoryLabels) as WorkflowCategory[]).map((key) => (
                <button className={category === key ? "active" : ""} key={key} onClick={() => setCategory(key)}>
                  {categoryIcons[key]} {categoryLabels[key].title}
                </button>
              ))}
            </div>

            <div className="catalogHeader">
              <div><span>CATALOGUE IMMOBOOST</span><h2>{query ? `Résultats pour « ${query} »` : category === "all" ? "Toutes les missions" : categoryLabels[category].title}</h2></div>
              <strong>{filtered.length} mission{filtered.length > 1 ? "s" : ""}</strong>
            </div>

            <div className="workflowGrid">
              {filtered.map((workflow) => (
                <button className="workflowCard" key={workflow.id} onClick={() => openWorkflow(workflow)}>
                  <span className="workflowIcon">{workflow.icon}</span>
                  <div><strong>{workflow.title}</strong><small>{workflow.promise}</small><em>{categoryLabels[workflow.category].title}</em></div>
                  <b>Commencer →</b>
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="emptyState">
                <span>⌕</span><strong>Aucune mission exacte.</strong><p>Essayez « annonce », « photos », « vendeur », « Canva », « offre » ou « PEB ».</p>
              </div>
            )}

            <div className="allInOnePromise">
              <div><span>✦</span><strong>Une seule plateforme, des dizaines de métiers quotidiens couverts.</strong></div>
              <p>Annonces, prospection, Canva, réseaux sociaux, appels, visites, offres, documents et réglementation belge.</p>
            </div>
          </section>
        </>
      )}

      {active && (
        <section className="workflowScreen">
          <button className="backLink" onClick={reset}>← Toutes les missions</button>
          <div className="workflowHero">
            <span className="workflowHeroIcon">{active.icon}</span>
            <div><small>{categoryLabels[active.category].title.toUpperCase()}</small><h1>{active.title}</h1><p>{active.promise}</p></div>
          </div>

          {!generated && (
            <div className="builderLayout">
              <div className="formCard">
                <div className="stepHeader"><span>01</span><div><strong>Donnez le contexte</strong><small>Uniquement les informations utiles. ImmoBoost construit le reste.</small></div></div>
                <div className="fieldGrid">
                  {active.fields.map((field) => (
                    <label key={field.id}>
                      <span>{field.label}{field.required ? " *" : ""}</span>
                      {field.type === "textarea" && <textarea value={values[field.id] ?? ""} onChange={(event) => setValues({ ...values, [field.id]: event.target.value })} placeholder={field.placeholder} />}
                      {field.type === "text" && <input value={values[field.id] ?? ""} onChange={(event) => setValues({ ...values, [field.id]: event.target.value })} placeholder={field.placeholder} />}
                      {field.type === "select" && <select value={values[field.id] ?? ""} onChange={(event) => setValues({ ...values, [field.id]: event.target.value })}><option value="">Choisir…</option>{field.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>}
                    </label>
                  ))}
                </div>
                <button className="primaryCta" disabled={missingRequired} onClick={() => setGenerated(true)}>Préparer mon kit expert →</button>
              </div>

              <aside className="outputPreview">
                <small>VOTRE KIT CONTIENDRA</small>
                {active.output.map((item) => <div key={item}><span>✓</span><strong>{item}</strong></div>)}
                <div className="seniorNote"><strong>Le travail senior est invisible.</strong><span>Rôle, méthode, garde-fous et format de sortie sont déjà intégrés dans le brief.</span></div>
              </aside>
            </div>
          )}

          {generated && (
            <div className="resultLayout">
              <div className="promptCard">
                <div className="stepHeader"><span>02</span><div><strong>Votre kit expert est prêt</strong><small>Le brief contient la mission, le contexte, les livrables et les contrôles qualité.</small></div></div>
                <div className="promptPreview">{prompt}</div>
                <div className="promptActions">
                  <button onClick={copyPrompt}>{copied ? "Copié ✓" : "Copier le brief"}</button>
                  <button className="secondary" onClick={() => setGenerated(false)}>Modifier</button>
                </div>
              </div>

              <aside className="providerPanel">
                <small>03 · EXÉCUTER LA MISSION</small>
                <h2>Ouvrez votre IA</h2>
                <p>Le brief est copié automatiquement. Collez-le dans la conversation qui s’ouvre.</p>
                {providers.map((provider) => (
                  <button key={provider.id} onClick={() => launch(provider)}>
                    <span>{provider.icon}</span><div><strong>{provider.name}</strong><small>{provider.note}</small></div><b>Ouvrir ↗</b>
                  </button>
                ))}
                <div className="zeroCost"><strong>Coût IA pour ImmoBoost : 0 €</strong><span>L’utilisateur emploie son propre accès à la plateforme choisie.</span></div>
              </aside>
            </div>
          )}
        </section>
      )}

      <footer className="footerNote"><strong>ImmoBoost Belgique uniquement.</strong><span>Les workflows, formulations et garde-fous sont conçus pour le marché belge. Les données personnelles sensibles ne doivent pas être saisies.</span></footer>
    </main>
  );
}
