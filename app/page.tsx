"use client";

import { useEffect, useMemo, useState } from "react";
import { resources, type Resource } from "../lib/catalog";
import { resolveSituations, type ResolveResult } from "../lib/resolve";
import { routeQuestion, specialistAgents, type SpecialistAgent } from "../lib/agents";

type View = "home" | "resource" | "detail" | "coach" | "search" | "favorites" | "agents" | "agent";
type Section = "checklist" | "questions" | "documents" | "attention";

const sectionMeta: Record<Section, { title: string; icon: string; trust: string }> = {
  checklist: { title: "À préparer", icon: "✓", trust: "Prêt à utiliser" },
  questions: { title: "Questions", icon: "?", trust: "À personnaliser" },
  documents: { title: "Supports utiles", icon: "▣", trust: "À adapter" },
  attention: { title: "À vérifier", icon: "!", trust: "Selon le dossier" },
};

const quickSearches = ["commission", "exclusivité", "prix trop haut", "offre basse", "visite", "PEB"];

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [activeId, setActiveId] = useState(resources[0].id);
  const [section, setSection] = useState<Section>("checklist");
  const [coachIndex, setCoachIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [checked, setChecked] = useState<Record<string, number[]>>({});
  const [copied, setCopied] = useState("");
  const [agentQuestion, setAgentQuestion] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<SpecialistAgent>(specialistAgents[0]);
  const [routed, setRouted] = useState(false);

  const active = resources.find((item) => item.id === activeId) ?? resources[0];
  const results = useMemo(() => resolveSituations(query), [query]);
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

  function openResolveResult(result: ResolveResult) {
    setActiveId(result.resource.id);
    if (result.kind === "situation" && result.promptIndex !== undefined) {
      setCoachIndex(result.promptIndex);
      setView("coach");
      return;
    }
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

  function startQuickSearch(value: string) {
    setQuery(value);
    setView("search");
  }

  function openAgent(agent: SpecialistAgent) {
    setSelectedAgent(agent);
    setAgentQuestion("");
    setRouted(false);
    setView("agent");
  }

  function routeToAgent() {
    if (!agentQuestion.trim()) return;
    const agent = routeQuestion(agentQuestion);
    setSelectedAgent(agent);
    setRouted(true);
  }

  function resolveWithAgent() {
    const matches = resolveSituations(agentQuestion);
    if (matches.length > 0) openResolveResult(matches[0]);
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
            <h1>Que devez-vous<br />résoudre ?</h1>
            <p>Posez votre question. ImmoBoost choisit automatiquement l’agent spécialisé et ouvre la bonne solution.</p>
          </div>

          <button className="agentHero" onClick={() => setView("agents")}>
            <span>✦</span><div><strong>Demander à un agent spécialisé</strong><small>Vendeur, estimation, offre, documents, réglementation…</small></div><b>→</b>
          </button>

          <button className="resolveHero" onClick={() => setView("search")}>
            ⚡ <span><strong>Résoudre une situation</strong><small>Commission, offre, PEB, visite…</small></span><b>→</b>
          </button>

          <div className="quickRow">
            {quickSearches.map((item) => <button key={item} onClick={() => startQuickSearch(item)}>{item}</button>)}
          </div>

          <div className="situationGrid">
            {resources.map((resource) => (
              <button className="situationCard" key={resource.id} onClick={() => openResource(resource)}>
                <span className="icon">{resource.icon}</span>
                <span className="cardText"><strong>{resource.title}</strong><small>{resource.summary}</small></span>
                <span className="time">{resource.duration}</span>
              </button>
            ))}
          </div>

          <div className="promise"><strong>Une question, le bon spécialiste.</strong><span>Les sujets réglementaires sont marqués « source officielle requise ».</span></div>
        </section>
      )}

      {view === "agents" && (
        <section className="screen">
          <button className="back" onClick={() => setView("home")}>← Accueil</button>
          <div className="detailHeader"><span className="trust">AI Router Belgique</span><h1>Votre équipe d’agents.</h1><p>Choisissez un domaine, ou posez directement votre question pour être orienté automatiquement.</p></div>
          <div className="routerBox">
            <textarea value={agentQuestion} onChange={(event) => setAgentQuestion(event.target.value)} placeholder="Ex. Mon vendeur refuse l’exclusivité…" />
            <button className="primary" onClick={routeToAgent}>Trouver le bon agent</button>
          </div>
          {routed && (
            <button className="routedAgent" onClick={() => setView("agent")}>
              <span>{selectedAgent.icon}</span><div><small>AGENT SÉLECTIONNÉ</small><strong>{selectedAgent.name}</strong><p>{selectedAgent.scope}</p></div><b>Continuer →</b>
            </button>
          )}
          <div className="agentGrid">
            {specialistAgents.map((agent) => (
              <button className="agentCard" key={agent.id} onClick={() => openAgent(agent)}>
                <span>{agent.icon}</span><div><strong>{agent.name}</strong><small>{agent.scope}</small></div><em>{agent.trust === "official" ? "Sources" : agent.trust === "mixed" ? "Mixte" : "Métier"}</em>
              </button>
            ))}
          </div>
        </section>
      )}

      {view === "agent" && (
        <section className="screen agentScreen">
          <button className="back" onClick={() => setView("agents")}>← Tous les agents</button>
          <div className="agentIdentity"><span>{selectedAgent.icon}</span><div><small>AGENT SPÉCIALISÉ</small><h1>{selectedAgent.name}</h1><p>{selectedAgent.scope}</p></div></div>
          <div className="trustStrip">
            <strong>{selectedAgent.trust === "official" ? "🔵 Source officielle requise" : selectedAgent.trust === "mixed" ? "🟡 Métier + vérification" : "🟢 Bonne pratique métier"}</strong>
            <span>{selectedAgent.trust === "official" ? "Aucune réponse réglementaire ne sera présentée comme certaine sans référence officielle." : "Réponses courtes, concrètes et orientées action."}</span>
          </div>
          <div className="questionBox">
            <label htmlFor="agent-question">Votre question</label>
            <textarea id="agent-question" value={agentQuestion} onChange={(event) => setAgentQuestion(event.target.value)} placeholder={selectedAgent.examples[0]} />
            <button className="primary full" onClick={() => { setSelectedAgent(routeQuestion(agentQuestion)); setRouted(true); }}>Orienter ma question</button>
          </div>
          {routed && (
            <div className="routeResult">
              <span>↗</span><div><small>ROUTAGE AUTOMATIQUE</small><strong>{selectedAgent.name}</strong><p>Votre question est confiée à cet agent. ImmoBoost utilise ensuite les solutions validées et, si nécessaire, le moteur de vérification officiel.</p></div>
            </div>
          )}
          <div className="exampleGrid">
            {selectedAgent.examples.map((example) => <button key={example} onClick={() => setAgentQuestion(example)}>{example}</button>)}
          </div>
          <button className="primary full" disabled={!agentQuestion.trim()} onClick={resolveWithAgent}>Obtenir la solution disponible</button>
          <div className="privacyNote"><strong>Confidentialité</strong><span>Ne saisissez aucun nom complet, numéro national, document d’identité, donnée bancaire ou information client non indispensable.</span></div>
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
            {(Object.keys(sectionMeta) as Section[]).map((key) => <button className={`solutionCard ${key === "attention" ? "warning" : ""}`} key={key} onClick={() => showSection(key)}><span>{sectionMeta[key].icon}</span><strong>{sectionMeta[key].title}</strong><small>{active[key].length} éléments</small><b>Continuer →</b></button>)}
          </div>
          <button className="coachCard" onClick={() => setView("coach")}><span>💬</span><div><strong>Coach {active.title}</strong><small>{active.coach.prompts.length} situations fréquentes, réponses et messages prêts.</small></div><b>Ouvrir →</b></button>
          <button className="primary full" onClick={() => showSection("checklist")}>Commencer par l’essentiel</button>
        </section>
      )}

      {view === "detail" && (
        <section className="screen detailScreen">
          <button className="back" onClick={() => setView("resource")}>← {active.title}</button>
          <div className="detailHeader"><span className="trust">{sectionMeta[section].trust}</span><h1>{sectionMeta[section].title}</h1><p>Lecture courte. Une action par ligne.</p></div>
          <div className="itemList">{items.map((item, index) => { const isChecklist = section === "checklist"; const isChecked = checked[active.id]?.includes(index); return <button key={item} className={`item ${isChecked ? "checked" : ""}`} onClick={() => isChecklist && toggleCheck(index)}><span className="number">{isChecklist ? (isChecked ? "✓" : "○") : String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></button>; })}</div>
          {section === "checklist" && <div className="progress"><div style={{ width: `${progress}%` }} /><span>{progress}% prêt</span></div>}
          <div className="privacyNote"><strong>Zone sûre</strong><span>Travaillez avec un contexte générique. Les noms, pièces d’identité, données bancaires et documents clients restent dans vos outils sécurisés.</span></div>
          <button className="primary full" onClick={() => setView("resource")}>Continuer</button>
        </section>
      )}

      {view === "coach" && (
        <section className="screen coachScreen">
          <button className="back" onClick={() => setView("resource")}>← {active.title}</button>
          <div className="detailHeader"><span className="trust">Coach spécialisé</span><h1>Quel point bloque ?</h1><p>Choisissez. La réponse, le SMS et l’email sont prêts.</p></div>
          <div className="coachSuggestions">{active.coach.prompts.map((prompt, index) => <button key={prompt.title} className={`coachSuggestion ${coachIndex === index ? "selected" : ""}`} onClick={() => setCoachIndex(index)}><strong>{prompt.title}</strong><span>Résoudre →</span></button>)}</div>
          <article className="coachAnswer"><span className="label">QUE DIRE</span><h2>{active.coach.prompts[coachIndex].title}</h2><p>{active.coach.prompts[coachIndex].answer}</p><div className="messageGrid"><div><strong>📱 SMS</strong><p>{active.coach.prompts[coachIndex].sms}</p><button onClick={() => copyText("sms", active.coach.prompts[coachIndex].sms)}>{copied === "sms" ? "Copié ✓" : "Copier"}</button></div><div><strong>📧 Email</strong><p>{active.coach.prompts[coachIndex].email}</p><button onClick={() => copyText("email", active.coach.prompts[coachIndex].email)}>{copied === "email" ? "Copié ✓" : "Copier"}</button></div></div><div className="confidence"><strong>🟡 À adapter</strong><span>ImmoBoost prépare. L’agent valide. Les questions juridiques, fiscales ou régionales particulières doivent être vérifiées auprès du professionnel compétent.</span></div></article>
        </section>
      )}

      {view === "search" && (
        <section className="screen searchScreen">
          <button className="back" onClick={() => setView("home")}>← Accueil</button>
          <div className="detailHeader"><span className="trust">Resolve Engine</span><h1>Que se passe-t-il ?</h1><p>Tapez un mot métier. Une préparation ou une réponse précise s’ouvre directement.</p></div>
          <input className="searchInput" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Commission, offre, PEB, visite…" />
          <div className="quickRow searchQuick">{quickSearches.map((item) => <button key={item} onClick={() => setQuery(item)}>{item}</button>)}</div>
          <div className="searchResults">{results.map((result) => <button key={result.id} onClick={() => openResolveResult(result)}><span>{result.kind === "situation" ? "⚡" : result.resource.icon}</span><div><strong>{result.title}</strong><small>{result.kind === "situation" ? `Coach ${result.resource.title}` : result.description}</small></div><em>{result.kind === "situation" ? "Solution" : "Préparation"}</em><b>→</b></button>)}{results.length === 0 && <div className="empty"><strong>Aucun résultat exact.</strong><span>Essayez : vendeur, prix, annonce, visite, offre ou email.</span></div>}</div>
        </section>
      )}

      {view === "favorites" && (
        <section className="screen"><div className="detailHeader"><span className="trust">Vos raccourcis</span><h1>Favoris</h1><p>Les préparations que vous ouvrez le plus souvent.</p></div><div className="situationGrid">{favoriteResources.map((resource) => <button className="situationCard" key={resource.id} onClick={() => openResource(resource)}><span className="icon">{resource.icon}</span><span className="cardText"><strong>{resource.title}</strong><small>{resource.summary}</small></span><span className="time">{resource.duration}</span></button>)}</div>{favoriteResources.length === 0 && <div className="empty"><strong>Aucun favori.</strong><span>Appuyez sur ☆ dans une préparation pour l’épingler ici.</span></div>}</section>
      )}

      <nav className="mobileNav">
        <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>⌂<small>Accueil</small></button>
        <button className={view === "agents" || view === "agent" ? "active" : ""} onClick={() => setView("agents")}>✦<small>Agents</small></button>
        <button className={view === "search" ? "active resolve" : "resolve"} onClick={() => setView("search")}>⚡<small>Résoudre</small></button>
        <button className={view === "favorites" ? "active" : ""} onClick={() => setView("favorites")}>☆<small>Favoris</small></button>
      </nav>
    </main>
  );
}
