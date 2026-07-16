"use client";

import { useMemo, useState } from "react";
import { buildExpertPrompt, workflows, type Workflow } from "../lib/workflows";

type Provider = { id: string; name: string; icon: string; url: string; note: string };

const providers: Provider[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "◉", url: "https://chatgpt.com/", note: "Le plus simple pour démarrer" },
  { id: "gemini", name: "Gemini", icon: "✦", url: "https://gemini.google.com/app", note: "Alternative Google" },
  { id: "claude", name: "Claude", icon: "◇", url: "https://claude.ai/new", note: "Très bon pour la rédaction" },
];

export default function Home() {
  const [active, setActive] = useState<Workflow | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(() => active ? buildExpertPrompt(active, values) : "", [active, values]);
  const missingRequired = active?.fields.some((field) => field.required && !values[field.id]?.trim()) ?? true;

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
        <div className="brand"><strong>ImmoBoost™ Belgique</strong><span>Le senior qui prépare votre IA.</span></div>
        <span className="market">🇧🇪 Belgique · FR</span>
      </header>

      {!active && (
        <>
          <section className="hero landingHero">
            <span className="eyebrow">AUCUN COÛT API POUR IMMOBOOST</span>
            <h1>Que voulez-vous accomplir aujourd’hui&nbsp;?</h1>
            <p>Choisissez une mission. ImmoBoost pose les bonnes questions, construit le meilleur brief, puis vous dirige vers l’IA que vous utilisez déjà.</p>
          </section>

          <section className="workspace">
            <div className="workflowGrid">
              {workflows.map((workflow) => (
                <button className="workflowCard" key={workflow.id} onClick={() => openWorkflow(workflow)}>
                  <span className="workflowIcon">{workflow.icon}</span>
                  <div><strong>{workflow.title}</strong><small>{workflow.promise}</small></div>
                  <b>Commencer →</b>
                </button>
              ))}
            </div>
            <div className="howItWorks">
              <span>1</span><div><strong>Vous répondez à quelques questions</strong><small>Seulement les informations utiles à la mission.</small></div>
              <span>2</span><div><strong>ImmoBoost construit le brief expert</strong><small>Le prompt complet reste prêt à copier.</small></div>
              <span>3</span><div><strong>Vous ouvrez votre IA</strong><small>ChatGPT, Gemini ou Claude. Le calcul est pris en charge par leur plateforme.</small></div>
            </div>
          </section>
        </>
      )}

      {active && (
        <section className="workflowScreen">
          <button className="backLink" onClick={reset}>← Toutes les missions</button>
          <div className="workflowHero">
            <span className="workflowHeroIcon">{active.icon}</span>
            <div><small>MISSION GUIDÉE</small><h1>{active.title}</h1><p>{active.promise}</p></div>
          </div>

          {!generated && (
            <div className="builderLayout">
              <div className="formCard">
                <div className="stepHeader"><span>01</span><div><strong>Donnez le contexte</strong><small>ImmoBoost transforme vos réponses en brief professionnel.</small></div></div>
                <div className="fieldGrid">
                  {active.fields.map((field) => (
                    <label key={field.id}>
                      <span>{field.label}{field.required ? " *" : ""}</span>
                      {field.type === "textarea" && <textarea value={values[field.id] ?? ""} onChange={(e) => setValues({ ...values, [field.id]: e.target.value })} placeholder={field.placeholder} />}
                      {field.type === "text" && <input value={values[field.id] ?? ""} onChange={(e) => setValues({ ...values, [field.id]: e.target.value })} placeholder={field.placeholder} />}
                      {field.type === "select" && <select value={values[field.id] ?? ""} onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}><option value="">Choisir…</option>{field.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>}
                    </label>
                  ))}
                </div>
                <button className="primaryCta" disabled={missingRequired} onClick={() => setGenerated(true)}>Préparer mon expert IA →</button>
              </div>

              <aside className="outputPreview">
                <small>LE RÉSULTAT DEMANDÉ À L’IA</small>
                {active.output.map((item) => <div key={item}><span>✓</span><strong>{item}</strong></div>)}
              </aside>
            </div>
          )}

          {generated && (
            <div className="resultLayout">
              <div className="promptCard">
                <div className="stepHeader"><span>02</span><div><strong>Votre brief expert est prêt</strong><small>Copiez-le ou ouvrez directement l’IA de votre choix.</small></div></div>
                <div className="promptPreview">{prompt}</div>
                <div className="promptActions">
                  <button onClick={copyPrompt}>{copied ? "Copié ✓" : "Copier le brief"}</button>
                  <button className="secondary" onClick={() => setGenerated(false)}>Modifier</button>
                </div>
              </div>

              <aside className="providerPanel">
                <small>03 · OUVRIR UNE IA</small>
                <h2>Choisissez votre moteur</h2>
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
