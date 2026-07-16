"use client";

import { useEffect, useMemo, useState } from "react";
import { buildExpertPrompt, searchWorkflows, workflows, type Workflow } from "../lib/workflows";

type Provider = { name: string; icon: string; url: string };
type Screen = "home" | "diagnosis" | "workflow" | "dossiers";
type Dossier = { id: string; name: string; location: string; stage: string };

const providers: Provider[] = [
  { name: "ChatGPT", icon: "◉", url: "https://chatgpt.com/" },
  { name: "Gemini", icon: "✦", url: "https://gemini.google.com/app" },
  { name: "Claude", icon: "◇", url: "https://claude.ai/new" },
];

const quickStarts = [
  "Mon vendeur refuse l’exclusivité",
  "Je dois créer une annonce",
  "J’ai une visite dans une heure",
  "Mon acheteur fait une offre trop basse",
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [situation, setSituation] = useState("");
  const [active, setActive] = useState<Workflow | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("immoboost-simple-dossiers");
    if (saved) setDossiers(JSON.parse(saved));
  }, []);

  const recommendation = useMemo(() => situation.trim() ? searchWorkflows(situation, "all")[0] ?? workflows[0] : null, [situation]);
  const prompt = useMemo(() => active ? buildExpertPrompt(active, { situation, ...values }) : "", [active, situation, values]);
  const missingRequired = active?.fields.some((field) => field.required && !values[field.id]?.trim()) ?? true;

  function diagnose(text = situation) {
    if (!text.trim()) return;
    setSituation(text);
    setScreen("diagnosis");
  }

  function startWorkflow(workflow: Workflow) {
    setActive(workflow);
    setValues({});
    setGenerated(false);
    setScreen("workflow");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function launch(provider: Provider) {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.open(provider.url, "_blank", "noopener,noreferrer");
    setTimeout(() => setCopied(false), 1600);
  }

  function reset() {
    setScreen("home");
    setSituation("");
    setActive(null);
    setGenerated(false);
  }

  return (
    <main className="copilotShell">
      <header className="minimalTopbar">
        <button className="wordmark" onClick={reset}><span>IB</span><strong>ImmoBoost</strong></button>
        <div className="topActions">
          <button onClick={() => setScreen("dossiers")}>Mes dossiers</button>
          <span>Belgique · FR</span>
        </div>
      </header>

      {screen === "home" && (
        <section className="calmHome">
          <div className="ambientOrb orbOne" />
          <div className="ambientOrb orbTwo" />
          <div className="homeContent">
            <span className="softLabel">VOTRE COPILOTE IMMOBILIER</span>
            <h1>Que se passe-t-il aujourd’hui&nbsp;?</h1>
            <p>Expliquez simplement la situation. ImmoBoost trouve la bonne marche à suivre.</p>
            <div className="situationBox">
              <textarea value={situation} onChange={(e) => setSituation(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); diagnose(); } }} placeholder="Ex. Mon vendeur trouve mes honoraires trop élevés…" />
              <button onClick={() => diagnose()} disabled={!situation.trim()}>Continuer <span>→</span></button>
            </div>
            <div className="quickStarts">
              {quickStarts.map((item) => <button key={item} onClick={() => diagnose(item)}>{item}</button>)}
            </div>
            <div className="quietPromise"><span>✦</span><p>Une demande. Une recommandation claire. Les supports prêts juste après.</p></div>
          </div>
        </section>
      )}

      {screen === "diagnosis" && recommendation && (
        <section className="diagnosisScreen">
          <button className="ghostBack" onClick={reset}>← Revenir</button>
          <div className="diagnosisIntro">
            <div className="pulseCore"><span>✦</span></div>
            <small>SITUATION COMPRISE</small>
            <h1>{situation}</h1>
            <p>Je vous recommande de commencer par l’action qui débloquera le plus vite la situation.</p>
          </div>
          <div className="recommendationStage">
            <article className="primaryRecommendation">
              <span className="recommendationIcon">{recommendation.icon}</span>
              <div><small>COMMENCEZ PAR CECI</small><h2>{recommendation.title}</h2><p>{recommendation.promise}</p></div>
              <button onClick={() => startWorkflow(recommendation)}>Préparer pour moi <span>→</span></button>
            </article>
            <div className="nextSteps">
              <article><span>1</span><div><strong>Répondez à quelques questions</strong><p>Uniquement ce qui change réellement la réponse.</p></div></article>
              <article><span>2</span><div><strong>Recevez votre kit complet</strong><p>Plan, message, script, checklist ou contenu selon le besoin.</p></div></article>
              <article><span>3</span><div><strong>Exécutez avec votre IA</strong><p>ChatGPT, Gemini ou Claude, sans coût API pour ImmoBoost.</p></div></article>
            </div>
          </div>
        </section>
      )}

      {screen === "workflow" && active && (
        <section className="focusScreen">
          <button className="ghostBack" onClick={() => setScreen("diagnosis")}>← Revenir à la recommandation</button>
          <div className="focusHeader"><span>{active.icon}</span><div><small>PRÉPARATION GUIDÉE</small><h1>{active.title}</h1><p>{active.promise}</p></div></div>
          {!generated ? (
            <div className="singleTaskCard">
              <div className="stepLine"><span>01</span><div><strong>Donnez uniquement le contexte utile</strong><p>ImmoBoost s’occupe de la structure, du ton et des garde-fous.</p></div></div>
              <div className="airyFields">
                {active.fields.map((field) => <label key={field.id}><span>{field.label}{field.required ? " *" : ""}</span>{field.type === "textarea" ? <textarea value={values[field.id] ?? ""} onChange={(e) => setValues({ ...values, [field.id]: e.target.value })} placeholder={field.placeholder} /> : field.type === "text" ? <input value={values[field.id] ?? ""} onChange={(e) => setValues({ ...values, [field.id]: e.target.value })} placeholder={field.placeholder} /> : <select value={values[field.id] ?? ""} onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}><option value="">Choisir…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}</label>)}
              </div>
              <button className="prepareButton" disabled={missingRequired} onClick={() => setGenerated(true)}>Préparer mon kit <span>→</span></button>
            </div>
          ) : (
            <div className="readyLayout">
              <div className="readyCard">
                <div className="stepLine"><span>02</span><div><strong>Votre kit est prêt</strong><p>Le brief expert ci-dessous réunit déjà la méthode et les contrôles qualité.</p></div></div>
                <pre>{prompt}</pre>
                <button className="subtleButton" onClick={() => navigator.clipboard.writeText(prompt)}>{copied ? "Copié ✓" : "Copier le kit"}</button>
              </div>
              <aside className="providerDock"><small>CONTINUER AVEC</small>{providers.map((provider) => <button key={provider.name} onClick={() => launch(provider)}><span>{provider.icon}</span><strong>{provider.name}</strong><b>↗</b></button>)}<p>Le kit est copié automatiquement avant l’ouverture.</p></aside>
            </div>
          )}
        </section>
      )}

      {screen === "dossiers" && (
        <section className="simpleDossiers">
          <button className="ghostBack" onClick={reset}>← Accueil</button>
          <div className="dossiersTitle"><small>MES DOSSIERS</small><h1>Vos biens, sans bruit autour.</h1><p>Une vue simple pour garder le fil.</p></div>
          <div className="dossiersGrid">
            {dossiers.length === 0 ? <div className="emptyDossier"><span>⌂</span><h2>Aucun dossier pour le moment</h2><p>Les prochains sprints ajouteront ici la mémoire complète du bien.</p></div> : dossiers.map((d) => <article key={d.id}><small>{d.stage}</small><h2>{d.name}</h2><p>{d.location}</p></article>)}
          </div>
        </section>
      )}
    </main>
  );
}
