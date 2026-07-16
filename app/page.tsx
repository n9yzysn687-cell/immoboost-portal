"use client";

import { useEffect, useMemo, useState } from "react";
import { buildExpertPrompt, categoryLabels, searchWorkflows, workflows, type Workflow, type WorkflowCategory } from "../lib/workflows";

type Provider = { id: string; name: string; icon: string; url: string; note: string };
type CategoryFilter = WorkflowCategory | "all";
type View = "missions" | "dossiers" | "workflow";
type Dossier = { id: string; name: string; location: string; type: string; stage: string; createdAt: string; missions: string[] };

const providers: Provider[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "◉", url: "https://chatgpt.com/", note: "Le plus simple pour démarrer" },
  { id: "gemini", name: "Gemini", icon: "✦", url: "https://gemini.google.com/app", note: "Alternative Google" },
  { id: "claude", name: "Claude", icon: "◇", url: "https://claude.ai/new", note: "Excellent pour la rédaction" },
];

const categoryIcons: Record<WorkflowCategory, string> = { mandat: "🎯", vente: "🏠", acheteur: "🤝", business: "📈", dossier: "📂" };
const stages = ["Prospect", "Estimation", "Mandat", "Photos", "Annonce", "Visites", "Offre", "Compromis", "Acte"];

export default function Home() {
  const [view, setView] = useState<View>("missions");
  const [active, setActive] = useState<Workflow | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [newDossier, setNewDossier] = useState({ name: "", location: "", type: "Appartement" });
  const [selectedDossierId, setSelectedDossierId] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("immoboost-dossiers");
    if (stored) setDossiers(JSON.parse(stored));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("immoboost-dossiers", JSON.stringify(dossiers));
  }, [dossiers]);

  const prompt = useMemo(() => (active ? buildExpertPrompt(active, values) : ""), [active, values]);
  const missingRequired = active?.fields.some((field) => field.required && !values[field.id]?.trim()) ?? true;
  const filtered = useMemo(() => searchWorkflows(query, category), [query, category]);
  const featured = workflows.filter((workflow) => workflow.featured);
  const suggested = query.trim() ? filtered[0] : null;

  function openWorkflow(workflow: Workflow, dossierId = "") {
    setActive(workflow);
    setValues({});
    setGenerated(false);
    setCopied(false);
    setSelectedDossierId(dossierId);
    setView("workflow");
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
    if (selectedDossierId && active) {
      setDossiers((current) => current.map((dossier) => dossier.id === selectedDossierId && !dossier.missions.includes(active.id) ? { ...dossier, missions: [...dossier.missions, active.id] } : dossier));
    }
    window.open(provider.url, "_blank", "noopener,noreferrer");
  }

  function goHome() {
    setView("missions");
    setActive(null);
    setGenerated(false);
  }

  function createDossier() {
    if (!newDossier.name.trim()) return;
    const dossier: Dossier = {
      id: crypto.randomUUID(), name: newDossier.name.trim(), location: newDossier.location.trim(), type: newDossier.type,
      stage: "Prospect", createdAt: new Date().toLocaleDateString("fr-BE"), missions: [],
    };
    setDossiers((current) => [dossier, ...current]);
    setNewDossier({ name: "", location: "", type: "Appartement" });
  }

  function updateStage(id: string, stage: string) {
    setDossiers((current) => current.map((dossier) => dossier.id === id ? { ...dossier, stage } : dossier));
  }

  return (
    <main className="appShell">
      <header className="topbar">
        <button className="logo" onClick={goHome}>IB</button>
        <div className="brand"><strong>ImmoBoost™ Belgique</strong><span>Le cockpit quotidien de l’agent immobilier.</span></div>
        <nav className="topNav"><button className={view === "missions" ? "active" : ""} onClick={goHome}>Missions</button><button className={view === "dossiers" ? "active" : ""} onClick={() => setView("dossiers")}>Mes dossiers</button></nav>
        <span className="market">🇧🇪 Belgique · FR</span>
      </header>

      {view === "missions" && (
        <>
          <section className="hero landingHero">
            <span className="eyebrow">MISSION ENGINE 2.0</span>
            <h1>Dites ce qui se passe. ImmoBoost ouvre la bonne mission.</h1>
            <p>Une situation, quelques réponses, un kit senior prêt à exécuter. Aucun menu labyrinthique.</p>
            <div className="missionSearch"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex. vendeur refuse l’exclusivité, offre trop basse, créer un Reel…" />{query && <button onClick={() => setQuery("")}>Effacer</button>}</div>
            {suggested && <button className="smartSuggestion" onClick={() => openWorkflow(suggested)}><span>{suggested.icon}</span><div><small>MISSION RECOMMANDÉE</small><strong>{suggested.title}</strong><p>{suggested.promise}</p></div><b>Ouvrir →</b></button>}
          </section>

          <section className="workspace dashboardWorkspace">
            {!query && category === "all" && <div className="featuredBlock"><div className="sectionHeading"><span>MISSIONS EXPRESS</span><h2>Les besoins les plus fréquents</h2></div><div className="featuredGrid">{featured.map((workflow) => <button className="featuredCard" key={workflow.id} onClick={() => openWorkflow(workflow)}><span>{workflow.icon}</span><div><strong>{workflow.title}</strong><small>{workflow.promise}</small></div><b>→</b></button>)}</div></div>}
            <div className="categoryTabs"><button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>Tout</button>{(Object.keys(categoryLabels) as WorkflowCategory[]).map((key) => <button className={category === key ? "active" : ""} key={key} onClick={() => setCategory(key)}>{categoryIcons[key]} {categoryLabels[key].title}</button>)}</div>
            <div className="catalogHeader"><div><span>CATALOGUE IMMOBOOST</span><h2>{query ? `Résultats pour « ${query} »` : category === "all" ? "Toutes les missions" : categoryLabels[category].title}</h2></div><strong>{filtered.length} mission{filtered.length > 1 ? "s" : ""}</strong></div>
            <div className="workflowGrid">{filtered.map((workflow) => <button className="workflowCard" key={workflow.id} onClick={() => openWorkflow(workflow)}><span className="workflowIcon">{workflow.icon}</span><div><strong>{workflow.title}</strong><small>{workflow.promise}</small><em>{categoryLabels[workflow.category].title}</em></div><b>Commencer →</b></button>)}</div>
          </section>
        </>
      )}

      {view === "dossiers" && (
        <section className="workspace dossierWorkspace">
          <div className="dossierHero"><div><span className="eyebrow">MES DOSSIERS</span><h1>Chaque bien garde son contexte.</h1><p>Annonce, photos, visites, offres et missions restent regroupées au même endroit sur cet appareil.</p></div><div className="dossierStats"><strong>{dossiers.length}</strong><span>dossier{dossiers.length !== 1 ? "s" : ""}</span></div></div>
          <div className="dossierLayout">
            <div className="newDossierCard"><h2>Créer un dossier</h2><input placeholder="Nom du bien ou adresse courte" value={newDossier.name} onChange={(e) => setNewDossier({ ...newDossier, name: e.target.value })}/><input placeholder="Commune ou quartier" value={newDossier.location} onChange={(e) => setNewDossier({ ...newDossier, location: e.target.value })}/><select value={newDossier.type} onChange={(e) => setNewDossier({ ...newDossier, type: e.target.value })}><option>Appartement</option><option>Maison</option><option>Terrain</option><option>Immeuble</option><option>Commerce</option></select><button onClick={createDossier} disabled={!newDossier.name.trim()}>Créer le dossier</button></div>
            <div className="dossierList">{dossiers.length === 0 && <div className="emptyState"><span>📂</span><strong>Aucun dossier pour le moment.</strong><p>Créez votre premier bien et lancez ses missions depuis le même espace.</p></div>}{dossiers.map((dossier) => <article className="dossierCard" key={dossier.id}><div className="dossierHead"><div><small>{dossier.type.toUpperCase()}</small><h2>{dossier.name}</h2><p>{dossier.location || "Localisation non précisée"} · créé le {dossier.createdAt}</p></div><span>{dossier.stage}</span></div><div className="timeline">{stages.map((stage) => <button key={stage} className={stages.indexOf(stage) <= stages.indexOf(dossier.stage) ? "done" : ""} onClick={() => updateStage(dossier.id, stage)}><i></i><small>{stage}</small></button>)}</div><div className="dossierMissions"><strong>Missions du dossier</strong><div>{["annonce", "photos", "visite", "offre", "diffusion"].map((id) => { const workflow = workflows.find((item) => item.id === id); if (!workflow) return null; return <button key={id} className={dossier.missions.includes(id) ? "completed" : ""} onClick={() => openWorkflow(workflow, dossier.id)}><span>{workflow.icon}</span>{workflow.title}{dossier.missions.includes(id) && <b>✓</b>}</button>; })}</div></div></article>)}</div>
          </div>
        </section>
      )}

      {view === "workflow" && active && (
        <section className="workflowScreen">
          <button className="backLink" onClick={() => selectedDossierId ? setView("dossiers") : goHome()}>← {selectedDossierId ? "Retour au dossier" : "Toutes les missions"}</button>
          <div className="workflowHero"><span className="workflowHeroIcon">{active.icon}</span><div><small>{categoryLabels[active.category].title.toUpperCase()}</small><h1>{active.title}</h1><p>{active.promise}</p></div></div>
          {!generated ? <div className="builderLayout"><div className="formCard"><div className="stepHeader"><span>01</span><div><strong>Donnez le contexte</strong><small>Uniquement les informations utiles. ImmoBoost construit le reste.</small></div></div><div className="fieldGrid">{active.fields.map((field) => <label key={field.id}><span>{field.label}{field.required ? " *" : ""}</span>{field.type === "textarea" && <textarea value={values[field.id] ?? ""} onChange={(e) => setValues({ ...values, [field.id]: e.target.value })} placeholder={field.placeholder}/>} {field.type === "text" && <input value={values[field.id] ?? ""} onChange={(e) => setValues({ ...values, [field.id]: e.target.value })} placeholder={field.placeholder}/>} {field.type === "select" && <select value={values[field.id] ?? ""} onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}><option value="">Choisir…</option>{field.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>}</label>)}</div><button className="primaryCta" disabled={missingRequired} onClick={() => setGenerated(true)}>Préparer mon kit expert →</button></div><aside className="outputPreview"><small>VOTRE KIT CONTIENDRA</small>{active.output.map((item) => <div key={item}><span>✓</span><strong>{item}</strong></div>)}</aside></div> : <div className="resultLayout"><div className="promptCard"><div className="stepHeader"><span>02</span><div><strong>Votre kit expert est prêt</strong><small>Mission, contexte, livrables et contrôles qualité sont réunis.</small></div></div><div className="promptPreview">{prompt}</div><div className="promptActions"><button onClick={copyPrompt}>{copied ? "Copié ✓" : "Copier le brief"}</button><button className="secondary" onClick={() => setGenerated(false)}>Modifier</button></div></div><aside className="providerPanel"><small>03 · EXÉCUTER LA MISSION</small><h2>Ouvrez votre IA</h2><p>Le brief est copié automatiquement. Collez-le dans la conversation.</p>{providers.map((provider) => <button key={provider.id} onClick={() => launch(provider)}><span>{provider.icon}</span><div><strong>{provider.name}</strong><small>{provider.note}</small></div><b>Ouvrir ↗</b></button>)}<div className="zeroCost"><strong>Coût IA pour ImmoBoost : 0 €</strong><span>L’utilisateur emploie son propre accès.</span></div></aside></div>}
        </section>
      )}

      <footer className="footerNote"><strong>ImmoBoost Belgique uniquement.</strong><span>Les dossiers sont enregistrés localement sur cet appareil. Aucune donnée sensible ne doit être saisie.</span></footer>
    </main>
  );
}
