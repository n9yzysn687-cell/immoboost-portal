"use client";

import { useMemo, useRef, useState } from "react";
import { ImmersiveField, type ImmersivePhase } from "./components/ImmersiveField";
import { markets, type MarketCode, type buildMissionKit } from "../lib/daily-engine";

type InputMode = "texte" | "micro" | "photo";
type MissionKit = ReturnType<typeof buildMissionKit>;
type ResultView = "now" | "send" | "publish" | "check";

const marketCodes = Object.keys(markets) as MarketCode[];
const missionGestures = [
  { id: "follow", number: "01", title: "Relancer", detail: "Un client attend", prompt: "Je dois relancer un client indécis et obtenir une réponse claire aujourd’hui." },
  { id: "launch", number: "02", title: "Lancer un bien", detail: "Annonce + diffusion", prompt: "Je dois lancer un nouveau bien : prépare l’annonce, la publication et les prochaines actions." },
  { id: "prepare", number: "03", title: "Préparer", detail: "Visite ou vendeur", prompt: "Je dois préparer un rendez-vous immobilier important et anticiper les objections." },
  { id: "morning", number: "04", title: "Traiter le matin", detail: "Priorités + réponses", prompt: "Aide-moi à traiter mon début de journée : messages, emails, rappels et relances prioritaires." },
];

const resultTabs: { id: ResultView; label: string; short: string }[] = [
  { id: "now", label: "À faire maintenant", short: "Maintenant" },
  { id: "send", label: "Prêt à envoyer", short: "Envoyer" },
  { id: "publish", label: "Prêt à publier", short: "Publier" },
  { id: "check", label: "À ne pas oublier", short: "Vérifier" },
];

function Icon({ name }: { name: "pen" | "mic" | "photo" | "arrow" | "copy" | "share" | "download" | "calendar" | "close" }) {
  const paths = {
    pen: <><path d="m4 20 4.2-1 10.9-10.9a2.1 2.1 0 0 0-3-3L5.2 16Z"/><path d="m14.7 6.5 3 3M4 20h16"/></>,
    mic: <><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></>,
    photo: <><rect x="3" y="5" width="18" height="15" rx="3"/><path d="m7 16 3-3 3 3 2-2 3 3M8 5l1.2-2h5.6L16 5"/><circle cx="16.5" cy="9.5" r="1.5"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    share: <><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M8 14h3"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function compactText(kit: MissionKit) {
  return [kit.diagnostic, "", "À faire", ...kit.plan.map((item, index) => `${index + 1}. ${item}`), "", "Email", kit.email, "", "SMS / WhatsApp", kit.sms, "", "Prochaine action", kit.nextAction].join("\n");
}

export default function Home() {
  const [situation, setSituation] = useState("");
  const [market, setMarket] = useState<MarketCode>("BE");
  const [mode, setMode] = useState<InputMode>("texte");
  const [phase, setPhase] = useState<ImmersivePhase>("idle");
  const [kit, setKit] = useState<MissionKit | null>(null);
  const [activeView, setActiveView] = useState<ResultView>("now");
  const [photoName, setPhotoName] = useState("");
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const progressLabel = useMemo(() => phase === "processing" ? "La mission se compose" : phase === "ready" ? "Mission prête" : "Cockpit disponible", [phase]);

  async function launchMission(text = situation) {
    const cleanSituation = text.trim();
    if (!cleanSituation || phase === "processing") return;
    setSituation(cleanSituation);
    setPhase("processing");
    setKit(null);
    setStatus("");
    setActiveView("now");
    navigator.vibrate?.(18);

    try {
      const [response] = await Promise.all([
        fetch("/api/mission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situation: cleanSituation, market }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 1450)),
      ]);
      const payload = await response.json();
      if (!response.ok || !payload.kit) throw new Error(payload.error || "Mission non finalisée");
      setKit(payload.kit as MissionKit);
      setPhase("ready");
      navigator.vibrate?.([18, 35, 26]);
    } catch (error) {
      setPhase("idle");
      setStatus(error instanceof Error ? error.message : "Mission non finalisée, aucun Boost débité.");
    }
  }

  function selectGesture(prompt: string) {
    setSituation(prompt);
    setKit(null);
    setPhase("idle");
    window.setTimeout(() => textarea.current?.focus(), 80);
  }

  function chooseMode(nextMode: InputMode) {
    setMode(nextMode);
    if (nextMode === "photo") photoInput.current?.click();
    if (nextMode !== "micro") return;
    const speechWindow = window as typeof window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setMode("texte");
      setStatus("La dictée n’est pas disponible sur ce navigateur.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setStatus("La dictée n’a pas démarré."); };
    recognition.onresult = (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript ?? "");
      if (transcript) setSituation((current) => `${current} ${transcript}`.trim());
    };
    recognition.start();
  }

  async function copyText(text: string, confirmation = "Copié") {
    await navigator.clipboard.writeText(text);
    setStatus(confirmation);
    window.setTimeout(() => setStatus(""), 1800);
  }

  async function shareMission() {
    if (!kit) return;
    const text = compactText(kit);
    if (navigator.share) await navigator.share({ title: "Mission Agent Daily", text });
    else await copyText(text, "Mission copiée");
  }

  function downloadMission() {
    if (!kit) return;
    const url = URL.createObjectURL(new Blob([compactText(kit)], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mission-agent-daily-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Mission téléchargée");
  }

  function addToCalendar() {
    if (!kit) return;
    const start = new Date(Date.now() + 30 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, "SUMMARY:Prochaine action · Agent Daily", `DESCRIPTION:${kit.nextAction.replace(/\n/g, " ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "prochaine-action-agent-daily.ics";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Ajout à l’agenda préparé");
  }

  return (
    <main className={`experience phase-${phase}`}>
      <ImmersiveField phase={phase} />
      <div className="noise" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="#cockpit" aria-label="Agent Daily accueil">
          <span className="brandMark"><i /><i /><i /></span>
          <strong>Agent Daily</strong>
        </a>
        <div className="topbarTools">
          <label className="marketPicker">
            <span className="srOnly">Marché</span>
            <b aria-hidden="true">{market}</b>
            <select value={market} onChange={(event) => setMarket(event.target.value as MarketCode)}>
              {marketCodes.map((code) => <option key={code} value={code}>{code} · {markets[code].name}</option>)}
            </select>
          </label>
          <a className="boostPill" href="/invite/daily-vendeur"><span>250</span><small>Boosts</small></a>
        </div>
      </header>

      <section id="cockpit" className="cockpitStage">
        <div className="depthRing ringOne" aria-hidden="true" />
        <div className="depthRing ringTwo" aria-hidden="true" />

        <div className="commandView" aria-hidden={phase !== "idle"}>
          <div className="cockpitIntro">
            <span className="liveStatus"><i /> {progressLabel}</span>
            <h1>Que faut&#8209;il<br />régler&nbsp;?</h1>
            <p>Une situation suffit.</p>
          </div>

          <div className="missionDock">
            <textarea
              ref={textarea}
              value={situation}
              onChange={(event) => setSituation(event.target.value)}
              onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") launchMission(); }}
              placeholder="Ex. Mon vendeur refuse de revoir son prix…"
              aria-label="Décrivez votre situation"
            />
            {photoName ? <div className="attachment"><Icon name="photo"/><span>{photoName}</span><button onClick={() => setPhotoName("")} aria-label="Retirer la photo"><Icon name="close"/></button></div> : null}
            <input ref={photoInput} className="fileInput" type="file" accept="image/*" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setPhotoName(file.name);
                if (!situation) setSituation("Voici la photo d’un bien. Aide-moi à préparer sa mise en valeur et sa diffusion.");
              }
            }}/>
            <div className="dockControls">
              <div className="modeButtons" aria-label="Mode de saisie">
                <button className={mode === "texte" ? "active" : ""} onClick={() => chooseMode("texte")} aria-label="Écrire"><Icon name="pen"/></button>
                <button className={mode === "micro" ? "active listening" : ""} onClick={() => chooseMode("micro")} aria-label={listening ? "Écoute en cours" : "Dicter"}><Icon name="mic"/></button>
                <button className={mode === "photo" ? "active" : ""} onClick={() => chooseMode("photo")} aria-label="Ajouter une photo"><Icon name="photo"/></button>
              </div>
              <button className="launchButton" onClick={() => launchMission()} disabled={!situation.trim()}>
                <span>Préparer</span><Icon name="arrow"/>
              </button>
            </div>
          </div>

          <div className="gestureRail" aria-label="Situations fréquentes">
            {missionGestures.map((gesture) => (
              <button key={gesture.id} onClick={() => selectGesture(gesture.prompt)}>
                <small>{gesture.number}</small><strong>{gesture.title}</strong><span>{gesture.detail}</span><i>↗</i>
              </button>
            ))}
          </div>
        </div>

        {phase === "processing" ? (
          <div className="transitView" role="status" aria-live="polite">
            <div className="transitCore"><span /><span /><span /><b>AD</b></div>
            <h2>La mission prend forme.</h2>
            <div className="transitSteps"><span>Comprendre</span><span>Choisir</span><span>Composer</span></div>
            <p>Aucun Boost débité avant la livraison.</p>
          </div>
        ) : null}

        {phase === "ready" && kit ? (
          <div className="capsuleView" id="mission-capsule">
            <div className="capsuleTopline">
              <span className="missionReady"><i /> Mission prête</span>
              <div className="capsuleTools">
                <button onClick={shareMission} aria-label="Partager"><Icon name="share"/></button>
                <button onClick={downloadMission} aria-label="Télécharger"><Icon name="download"/></button>
                <button onClick={() => { setPhase("idle"); setKit(null); }} aria-label="Fermer"><Icon name="close"/></button>
              </div>
            </div>

            <div className="capsuleHeading">
              <div><small>{markets[market].name}</small><h2>{kit.objective}</h2></div>
              <div className="boostReceipt"><strong>1</strong><span>Boost<br/>à la livraison</span></div>
            </div>

            <nav className="capsuleNav" aria-label="Contenu de la mission">
              {resultTabs.map((tab) => <button key={tab.id} className={activeView === tab.id ? "active" : ""} onClick={() => setActiveView(tab.id)}><span>{tab.label}</span><small>{tab.short}</small></button>)}
            </nav>

            <div className="capsuleContent">
              {activeView === "now" ? (
                <div className="resultPanel nowPanel">
                  <div className="priority"><small>Prochaine action</small><p>{kit.nextAction}</p><button onClick={addToCalendar}><Icon name="calendar"/> Ajouter à l’agenda</button></div>
                  <div className="compactPlan"><small>Plan simple</small><ol>{kit.plan.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ol></div>
                </div>
              ) : null}
              {activeView === "send" ? (
                <div className="resultPanel sendPanel">
                  <article><div><small>Email</small><button onClick={() => copyText(kit.email)}><Icon name="copy"/> Copier</button></div><p>{kit.email}</p></article>
                  <article><div><small>SMS / WhatsApp</small><button onClick={() => copyText(kit.sms)}><Icon name="copy"/> Copier</button></div><p>{kit.sms}</p></article>
                </div>
              ) : null}
              {activeView === "publish" ? (
                <div className="resultPanel publishPanel">
                  <article><small>Publication prête</small><p>{kit.socialPost}</p><button onClick={() => copyText(kit.socialPost)}><Icon name="copy"/> Copier le post</button></article>
                  <article className="visualBrief"><small>Direction visuelle</small><p>{kit.visualBrief}</p></article>
                </div>
              ) : null}
              {activeView === "check" ? (
                <div className="resultPanel checkPanel">
                  <article><small>Checklist</small><ul>{kit.checklist.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul></article>
                  <article><small>Documents</small><ul>{kit.documents.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul><p className="caution">{kit.caution}</p></article>
                </div>
              ) : null}
            </div>

            <div className="capsuleFooter">
              <div className="experts"><span>Experts activés</span>{kit.experts.map((expert, index) => <i key={expert.id} title={expert.name}>{index + 1}</i>)}</div>
              <button className="continueButton" onClick={() => { localStorage.setItem("agent-daily-last-mission", JSON.stringify({ situation, market, kit })); setStatus("Mission gardée pour plus tard"); }}>Continuer plus tard</button>
            </div>
          </div>
        ) : null}
      </section>

      <footer className="trustLine"><span>Privé par défaut</span><i /> <span>1 mission livrée = 1 Boost</span><i /> <span>Échec = 0 Boost</span></footer>
      {status ? <div className="toast" role="status">{status}</div> : null}
    </main>
  );
}
