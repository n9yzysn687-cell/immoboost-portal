"use client";

import { useMemo, useRef, useState } from "react";
import { dailyActions } from "../lib/daily-actions";
import { buildMissionKit, markets, type MarketCode } from "../lib/daily-engine";
import { searchWorkflows, workflows } from "../lib/workflows";

type InputMode = "texte" | "micro" | "photo";

const marketCodes = Object.keys(markets) as MarketCode[];
const missionPrompts = [
  "Mon vendeur refuse de revoir son prix",
  "Je dois relancer mes acheteurs indécis",
  "Prépare l’annonce et les réseaux de ce bien",
];

function ModeIcon({ mode }: { mode: InputMode }) {
  if (mode === "micro") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>;
  }
  if (mode === "photo") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="3"/><path d="m7 16 3-3 3 3 2-2 3 3M8 5l1.2-2h5.6L16 5"/><circle cx="16.5" cy="9.5" r="1.5"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.2-1 10.9-10.9a2.1 2.1 0 0 0-3-3L5.2 16Z"/><path d="m14.7 6.5 3 3M4 20h16"/></svg>;
}

function ActionIcon({ id }: { id: string }) {
  const paths: Record<string, React.ReactNode> = {
    email: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></>,
    prospect: <><path d="M7 3h3l1.2 5-2.3 1.5a15 15 0 0 0 5.6 5.6l1.5-2.3 5 1.2v3a4 4 0 0 1-4 4A14 14 0 0 1 3 7a4 4 0 0 1 4-4Z"/></>,
    listing: <><path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    photos: <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m4 17 5-5 4 4 2-2 5 4"/></>,
    seller: <><path d="M7 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 11a3 3 0 1 0 0-6"/><path d="M2 21v-2a5 5 0 0 1 10 0v2M14 21v-1a4 4 0 0 1 8 0v1"/></>,
    visit: <><path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-6h6v6M8 10h.01M16 10h.01"/></>,
    offer: <><path d="M4 7h16v12H4zM8 7V5h8v2"/><path d="M8 13h8M12 10v6"/></>,
    verify: <><path d="M12 3 5 6v5c0 4.6 2.9 8.2 7 10 4.1-1.8 7-5.4 7-10V6Z"/><path d="m9 12 2 2 4-5"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[id] ?? paths.email}</svg>;
}

export default function Home() {
  const [situation, setSituation] = useState("");
  const [market, setMarket] = useState<MarketCode>("BE");
  const [mode, setMode] = useState<InputMode>("texte");
  const [missionReady, setMissionReady] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [listening, setListening] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  const workflow = useMemo(() => (situation.trim() ? searchWorkflows(situation, "all")[0] ?? workflows[0] : workflows[0]), [situation]);
  const kit = useMemo(() => buildMissionKit(situation, market, workflow), [situation, market, workflow]);

  function launchMission(text = situation) {
    if (!text.trim()) return;
    setSituation(text);
    setMissionReady(true);
    window.setTimeout(() => document.querySelector("#kit")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function chooseMode(nextMode: InputMode) {
    setMode(nextMode);
    if (nextMode === "photo") photoInput.current?.click();
    if (nextMode !== "micro") return;

    const speechWindow = window as typeof window & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setMode("texte");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript ?? "");
      if (transcript) setSituation((current) => `${current} ${transcript}`.trim());
    };
    recognition.start();
  }

  return (
    <main className="dailyShell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Agent Daily accueil">
          <span className="brandMark"><i /><i /><i /></span>
          <strong>Agent Daily</strong>
        </a>
        <div className="topbarTools">
          <label className="marketPicker">
            <span className="srOnly">Marché</span>
            <select value={market} onChange={(event) => setMarket(event.target.value as MarketCode)}>
              {marketCodes.map((code) => <option key={code} value={code}>{code} · {markets[code].name}</option>)}
            </select>
          </label>
          <a className="boostPill" href="/invite/daily-vendeur"><span>250</span> Boosts</a>
        </div>
      </header>

      <section id="top" className="cockpit">
        <div className="ambientLight ambientOne" aria-hidden="true" />
        <div className="ambientLight ambientTwo" aria-hidden="true" />
        <div className="coreScene" aria-hidden="true">
          <div className="coreHalo haloOuter" />
          <div className="coreHalo haloInner" />
          <div className="coreOrb"><span>AD</span></div>
          <div className="coreTag tagOne">Comprendre</div>
          <div className="coreTag tagTwo">Préparer</div>
          <div className="coreTag tagThree">Agir</div>
        </div>

        <div className="cockpitIntro">
          <span className="liveStatus"><i /> Assistant opérationnel</span>
          <h1>Que se passe-t-il aujourd’hui&nbsp;?</h1>
          <p>Décrivez la situation. Agent Daily prépare la suite.</p>
        </div>

        <div className="missionDock" id="brain">
          <textarea
            value={situation}
            onChange={(event) => setSituation(event.target.value)}
            placeholder="Ex. Mon vendeur refuse de baisser son prix…"
            aria-label="Décrivez votre situation"
          />
          {photoName ? <div className="attachment"><ModeIcon mode="photo" /><span>{photoName}</span><button onClick={() => setPhotoName("")} aria-label="Retirer la photo">×</button></div> : null}
          <input
            ref={photoInput}
            className="fileInput"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setPhotoName(file.name);
                if (!situation) setSituation("Analyse cette photo immobilière et prépare les actions utiles.");
              }
            }}
          />
          <div className="dockControls">
            <div className="modeButtons" aria-label="Mode de saisie">
              {(["texte", "micro", "photo"] as InputMode[]).map((item) => (
                <button
                  key={item}
                  className={mode === item ? "active" : ""}
                  onClick={() => chooseMode(item)}
                  aria-label={item === "texte" ? "Écrire" : item === "micro" ? "Dicter" : "Ajouter une photo"}
                  title={item === "texte" ? "Écrire" : item === "micro" ? "Dicter" : "Ajouter une photo"}
                >
                  <ModeIcon mode={item} />
                  <span>{item === "texte" ? "Écrire" : item === "micro" ? (listening ? "Écoute…" : "Dicter") : "Photo"}</span>
                </button>
              ))}
            </div>
            <button className="launchButton" onClick={() => launchMission()} disabled={!situation.trim()}>
              Préparer ma mission
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>

        <div className="suggestionRail" aria-label="Situations fréquentes">
          {missionPrompts.map((prompt) => <button key={prompt} onClick={() => launchMission(prompt)}>{prompt}<span>→</span></button>)}
        </div>
      </section>

      <section className="actionDeck" aria-label="Actions du jour">
        <div className="sectionHeading"><span>Aujourd’hui</span><h2>Commencer en un geste.</h2></div>
        <div className="actionGrid">
          {dailyActions.map((action) => (
            <button key={action.id} onClick={() => {
              setSituation(action.prompt);
              setMissionReady(false);
              document.querySelector("#brain")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}>
              <span className="actionIcon"><ActionIcon id={action.id} /></span>
              <strong>{action.title}</strong>
              <small>{action.description.split(".")[0]}</small>
              <i>→</i>
            </button>
          ))}
        </div>
      </section>

      {missionReady ? (
        <section id="kit" className="missionResult">
          <div className="resultHeader">
            <div><span className="resultStatus"><i /> Mission prête</span><h2>{workflow.title}</h2><p>{kit.objective}</p></div>
            <div className="boostReceipt"><strong>1</strong><span>Boost après<br/>livraison réussie</span></div>
          </div>

          <div className="expertStrip">
            <span>Experts activés</span>
            {kit.experts.map((expert) => <div key={expert.id}><b>{expert.icon}</b>{expert.name.replace("Agent", "Expert")}</div>)}
          </div>

          <div className="kitGrid">
            <article className="diagnosticCard"><small>Diagnostic</small><p>{kit.diagnostic}</p></article>
            <article><small>Plan d’action</small><ol>{kit.plan.map((item) => <li key={item}>{item}</li>)}</ol></article>
            <article><small>Email prêt</small><p>{kit.email}</p></article>
            <article><small>SMS / WhatsApp</small><p>{kit.sms}</p></article>
            <article><small>Script d’appel</small><ol>{kit.callScript.map((item) => <li key={item}>{item}</li>)}</ol></article>
            <article><small>Checklist</small><ul>{kit.checklist.map((item) => <li key={item}>{item}</li>)}</ul></article>
            <article><small>Documents</small><ul>{kit.documents.map((item) => <li key={item}>{item}</li>)}</ul></article>
            <article className="nextCard"><small>Prochaine action</small><p>{kit.nextAction}</p><button>Ajouter à aujourd’hui <span>→</span></button></article>
            <article className="growthCard"><small>Pack visibilité</small><ul>{kit.growthPack.map((item) => <li key={item}>{item}</li>)}</ul></article>
          </div>
        </section>
      ) : null}

      <footer className="privacyBar">
        <span className="privacyIcon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.9 8.2 7 10 4.1-1.8 7-5.4 7-10V6Z"/><path d="m9 12 2 2 4-5"/></svg></span>
        <div><strong>Vos données restent sous contrôle.</strong><p>Le contenu des missions n’est pas conservé par le fournisseur IA. Seuls le solde et l’usage nécessaire au service sont enregistrés.</p></div>
      </footer>
    </main>
  );
}
