"use client";

import { useEffect, useMemo, useState } from "react";
import { findResources, resources, type Resource } from "../lib/catalog";

type View = "home" | "resource" | "detail" | "coach" | "search" | "favorites";
type Section = "checklist" | "questions" | "documents" | "attention";

const sectionMeta: Record<Section, { title: string; icon: string; trust: string }> = {
  checklist: { title: "À préparer", icon: "✓", trust: "Prêt à utiliser" },
  questions: { title: "Questions", icon: "?", trust: "À personnaliser" },
  documents: { title: "Supports utiles", icon: "▣", trust: "À adapter" },
  attention: { title: "À vérifier", icon: "!", trust: "Selon le dossier" },
};

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [activeId, setActiveId] = useState(resources[0].id);
  const [section, setSection] = useState<Section>("checklist");
  const [coachIndex, setCoachIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [checked, setChecked] = useState<Record<string, number[]>>({});
  const [copied, setCopied] = useState("");

  const active = resources.find((item) => item.id === activeId) ?? resources[0];
  const results = useMemo(() => findResources(query), [query]);
  const favoriteResources = resources.filter((item) => favorites.includes(item.id));
  const items = active[section];
  const completed = checked[active.id]?.length ?? 0;
  const progress = Math.round((completed / active.checklist.length) * 100);

  useEffect(() => {
    const saved = localStorage.getItem("immoboost-favorites");
    const savedChecks = localStorage.getItem("immoboost-checks");
    if (saved) setFavorites(JSON.parse(saved));
    if (savedChecks) setChecked(JSON.parse(savedChecks));
  }, []);

  function openResource(resource: Resource) {
    setActiveId(resource.id);
    setCoachIndex(0);
    setView("resource");
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem("immoboost-favorites", JSON.stringify(next));
      return next;
    });
  }

  function toggleCheck(index: number) {
    setChecked((current) => {
      const values = current[active.id] ?? [];
      const nextValues = values.includes(index) ? values.filter((item) => item !== index) : [...values, index];
      const next = { ...current, [active.id]: nextValues };
      localStorage.setItem("immoboost-checks", JSON.stringify(next));
      return next;
    });
  }

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1400);
  }

  function showSection(next: Section) {
    setSection(next);
    setView("detail");
  }

  return (
    <main className="app">
      <header className="topbar">
        <button className="logo" onClick={() => setView("home")} aria-label="Accueil">IB</button>
        <div className="brand"><strong>ImmoBoost™</strong><span>Le prochain bon geste.</span></div>
        <div className="market">🇧🇪 Belgique · FR</div>
      </header>

      {view === "home" && (
        <section className="screen">
          <div className="intro">
            <span className="kicker">IMMOBILIER · BELGIQUE FRANCOPHONE</span>
            <h1>Que devez-vous<br />préparer ?</h1>
            <p>Choisissez la situation. La méthode, les messages et les vérifications sont déjà prêts.</p>
          </div>

          <button className="resolveHero" onClick={() => setView("search")}>⚡ <span><strong>Résoudre une situation</strong><small>Deux mots suffisent : commission, offre, PEB, visite…</small></span><b>→</b></button>

          <div className="situationGrid">
            {resources.map((resource) => (
              <button className="situationCard" key={resource.id} onClick={() => openResource(resource)}>
                <span className="icon">{resource.icon}</span>
                <span className="cardText"><strong>{resource.title}</strong><small>{resource.summary}</small></span>
                <span className="time">{resource.duration}</span>
              </button>
            ))}
          </div>

          <div className="promise"><strong>Une solution en moins de 3 clics.</strong><span>Aucune donnée personnelle n’est nécessaire pour utiliser les préparations.</span></div>
        </section>
      )}

      {view === "resource" && (
        <section className="screen preparation">
          <button className="back" onClick={() => setView("home")}>← Accueil</button>
          <div className="preparationHero">
            <div className="heroLine"><span className="kicker">{active.icon} {active.title.toUpperCase()} · {active.duration}</span><button className="star" onClick={() => toggleFavorite(active.id)}>{favorites.includes(active.id) ? "★" : "☆"}</button></div>
            <h1>Tout est déjà structuré.</h1>
            <p>{active.summary} Ouvrez seulement le bloc dont vous avez besoin.</p>
            <div className="statusRow"><span className="ready">● Prêt</span><span>Confidentialité par défaut</span><span>{progress}% préparé</span></div>
          </div>

          <div className="solutionGrid">
            {(Object.keys(sectionMeta) as Section[]).map((key) => (
              <button className={`solutionCard ${key === "attention" ? "warning" : ""}`} key={key} onClick={() => showSection(key)}>
                <span>{sectionMeta[key].icon}</span><strong>{sectionMeta[key].title}</strong><small>{active[key].length} éléments</small><b>Continuer →</b>
              </button>
            ))}
          </div>

          <button className="coachCard" onClick={() => setView("coach")}><span>💬</span><div><strong>Coach {active.title}</strong><small>{active.coach.prompts.length} situations fréquentes, réponses et messages prêts.</small></div><b>Ouvrir →</b></button>
          <button className="primary full" onClick={() => showSection("checklist")}>Commencer par l’essentiel</button>
        </section>
      )}

      {view === "detail" && (
        <section className="screen detailScreen">
          <button className="back" onClick={() => setView("resource")}>← {active.title}</button>
          <div className="detailHeader"><span className="trust">{sectionMeta[section].trust}</span><h1>{sectionMeta[section].title}</h1><p>Lecture courte. Une action par ligne.</p></div>
          <div className="itemList">
            {items.map((item, index) => {
              const isChecklist = section === "checklist";
              const isChecked = checked[active.id]?.includes(index);
              return <button key={item} className={`item ${isChecked ? "checked" : ""}`} onClick={() => isChecklist && toggleCheck(index)}><span className="number">{isChecklist ? (isChecked ? "✓" : "○") : String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></button>;
            })}
          </div>
          {section === "checklist" && <div className="progress"><div style={{ width: `${progress}%` }} /><span>{progress}% prêt</span></div>}
          <div className="privacyNote"><strong>Zone sûre</strong><span>Travaillez avec un contexte générique. Les noms, pièces d’identité, données bancaires et documents clients restent dans vos outils sécurisés.</span></div>
          <button className="primary full" onClick={() => setView("resource")}>Continuer</button>
        </section>
      )}

      {view === "coach" && (
        <section className="screen coachScreen">
          <button className="back" onClick={() => setView("resource")}>← {active.title}</button>
          <div className="detailHeader"><span className="trust">Coach spécialisé</span><h1>Quel point bloque ?</h1><p>Choisissez. La réponse, le SMS et l’email sont prêts.</p></div>
          <div className="coachSuggestions">
            {active.coach.prompts.map((prompt, index) => <button key={prompt.title} className={`coachSuggestion ${coachIndex === index ? "selected" : ""}`} onClick={() => setCoachIndex(index)}><strong>{prompt.title}</strong><span>Résoudre →</span></button>)}
          </div>
          <article className="coachAnswer">
            <span className="label">QUE DIRE</span><h2>{active.coach.prompts[coachIndex].title}</h2><p>{active.coach.prompts[coachIndex].answer}</p>
            <div className="messageGrid">
              <div><strong>📱 SMS</strong><p>{active.coach.prompts[coachIndex].sms}</p><button onClick={() => copyText("sms", active.coach.prompts[coachIndex].sms)}>{copied === "sms" ? "Copié ✓" : "Copier"}</button></div>
              <div><strong>📧 Email</strong><p>{active.coach.prompts[coachIndex].email}</p><button onClick={() => copyText("email", active.coach.prompts[coachIndex].email)}>{copied === "email" ? "Copié ✓" : "Copier"}</button></div>
            </div>
            <div className="confidence"><strong>🟡 À adapter</strong><span>ImmoBoost prépare. L’agent valide. Les questions juridiques, fiscales ou régionales particulières doivent être vérifiées auprès du professionnel compétent.</span></div>
          </article>
        </section>
      )}

      {view === "search" && (
        <section className="screen searchScreen">
          <button className="back" onClick={() => setView("home")}>← Accueil</button>
          <div className="detailHeader"><span className="trust">Recherche instantanée</span><h1>Que se passe-t-il ?</h1><p>Tapez un mot métier. Pas une longue question.</p></div>
          <input className="searchInput" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Commission, offre, PEB, visite…" />
          <div className="searchResults">
            {results.map((resource) => <button key={resource.id} onClick={() => openResource(resource)}><span>{resource.icon}</span><div><strong>{resource.title}</strong><small>{resource.summary}</small></div><b>→</b></button>)}
            {results.length === 0 && <div className="empty"><strong>Aucun résultat exact.</strong><span>Essayez : vendeur, prix, annonce, visite, offre ou email.</span></div>}
          </div>
        </section>
      )}

      {view === "favorites" && (
        <section className="screen">
          <div className="detailHeader"><span className="trust">Vos raccourcis</span><h1>Favoris</h1><p>Les préparations que vous ouvrez le plus souvent.</p></div>
          <div className="situationGrid">
            {favoriteResources.map((resource) => <button className="situationCard" key={resource.id} onClick={() => openResource(resource)}><span className="icon">{resource.icon}</span><span className="cardText"><strong>{resource.title}</strong><small>{resource.summary}</small></span><span className="time">{resource.duration}</span></button>)}
          </div>
          {favoriteResources.length === 0 && <div className="empty"><strong>Aucun favori.</strong><span>Appuyez sur ☆ dans une préparation pour l’épingler ici.</span></div>}
        </section>
      )}

      <nav className="mobileNav">
        <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>⌂<small>Accueil</small></button>
        <button className={view === "search" ? "active" : ""} onClick={() => setView("search")}>⌕<small>Trouver</small></button>
        <button className={view === "resource" || view === "detail" || view === "coach" ? "active resolve" : "resolve"} onClick={() => setView("search")}>⚡<small>Résoudre</small></button>
        <button className={view === "favorites" ? "active" : ""} onClick={() => setView("favorites")}>☆<small>Favoris</small></button>
      </nav>
    </main>
  );
}
