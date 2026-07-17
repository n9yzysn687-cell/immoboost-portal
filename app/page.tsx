"use client";

import { useMemo, useRef, useState } from "react";
import { ImmersiveField, type ImmersivePhase } from "./components/ImmersiveField";
import { markets, type MarketCode, type buildMissionKit } from "../lib/daily-engine";

type InputMode = "texte" | "micro" | "photo";
type MissionKit = ReturnType<typeof buildMissionKit>;
type RoomView = "act" | "contact" | "promote" | "secure";

type DailySignal = {
  id: string;
  index: number;
  dossier: string;
  label: string;
  result: string;
  prompt: string;
  accent: string;
};

const dailySignals: DailySignal[] = [
  {
    id: "follow",
    index: 0,
    dossier: "Dossier Leroy",
    label: "Relancer le vendeur",
    result: "Il consulte deux autres agences",
    prompt: "Après notre rendez-vous, Monsieur Leroy veut attendre avant de signer le mandat car il consulte deux autres agences. Prépare la meilleure suite et la relance.",
    accent: "10:30",
  },
  {
    id: "launch",
    index: 1,
    dossier: "Bien · Uccle",
    label: "Finaliser la mise en ligne",
    result: "PEB et charges à contrôler",
    prompt: "Je dois lancer aujourd’hui un appartement à Uccle. L’annonce, les publications et les points PEB et charges doivent être prêts et vérifiés.",
    accent: "12:00",
  },
  {
    id: "prepare",
    index: 2,
    dossier: "Offre Martin",
    label: "Répondre à l’acquéreur",
    result: "Offre valable jusqu’à 17 h",
    prompt: "Une offre jugée trop basse doit recevoir une réponse avant 17 h. Prépare la stratégie, les arguments et les messages pour le vendeur et l’acquéreur.",
    accent: "17:00",
  },
];

const nextAppointment: DailySignal = {
  id: "appointment",
  index: 3,
  dossier: "Sophie Martin",
  label: "Estimation vendeur",
  result: "Préparation prête",
  prompt: "Je prépare un rendez-vous d’estimation avec Sophie Martin à 14 h. Je veux obtenir le mandat et anticiper les objections sur le prix et les honoraires.",
  accent: "14:00",
};

const roomViews: { id: RoomView; label: string; verb: string }[] = [
  { id: "act", label: "Faire", verb: "Maintenant" },
  { id: "contact", label: "Contacter", verb: "Envoyer" },
  { id: "promote", label: "Diffuser", verb: "Publier" },
  { id: "secure", label: "Sécuriser", verb: "Vérifier" },
];

function Icon({ name }: { name: "pen" | "mic" | "photo" | "arrow" | "copy" | "share" | "download" | "calendar" | "close" | "mail" | "message" | "phone" | "check" }) {
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
    mail: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></>,
    message: <><path d="M20 15a4 4 0 0 1-4 4H8l-5 2 1.5-4A8 8 0 1 1 20 15Z"/></>,
    phone: <><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-4-2-2 2c-3.4-1.2-5.8-3.6-7-7l2-2Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function compactText(kit: MissionKit) {
  return [kit.diagnostic, "", "À faire", ...kit.plan.map((item, index) => `${index + 1}. ${item}`), "", "Email", kit.email, "", "SMS / WhatsApp", kit.sms, "", "Prochaine action", kit.nextAction].join("\n");
}

export default function Home() {
  const [situation, setSituation] = useState("");
  const [market] = useState<MarketCode>("BE");
  const [mode, setMode] = useState<InputMode>("texte");
  const [phase, setPhase] = useState<ImmersivePhase>("idle");
  const [selectedSignal, setSelectedSignal] = useState<DailySignal | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [kit, setKit] = useState<MissionKit | null>(null);
  const [activeView, setActiveView] = useState<RoomView>("act");
  const [photoName, setPhotoName] = useState("");
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const focus = selectedSignal?.index ?? -1;
  const stageLabel = useMemo(() => {
    if (phase === "processing") return "Composition en cours";
    if (phase === "ready") return "Mission livrée";
    if (selectedSignal) return selectedSignal.label;
    return "Journée ouverte";
  }, [phase, selectedSignal]);

  function openSignal(signal: DailySignal | null) {
    setSelectedSignal(signal);
    setCaptureOpen(true);
    setSituation(signal?.prompt ?? "");
    setKit(null);
    setPhase("idle");
    setStatus("");
    window.setTimeout(() => textarea.current?.focus(), 520);
  }

  function closeCapture() {
    setCaptureOpen(false);
    setSelectedSignal(null);
    setSituation("");
    setPhotoName("");
    setStatus("");
  }

  async function launchMission() {
    const cleanSituation = situation.trim();
    if (!cleanSituation || phase === "processing") return;
    setPhase("processing");
    setKit(null);
    setStatus("");
    setChecked([]);
    setOutcomeOpen(false);
    setActiveView("act");
    navigator.vibrate?.(18);

    try {
      const [response] = await Promise.all([
        fetch("/api/mission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situation: cleanSituation, market }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 1650)),
      ]);
      const payload = await response.json();
      if (!response.ok || !payload.kit) throw new Error(payload.error || "Mission non finalisée");
      setKit(payload.kit as MissionKit);
      setPhase("ready");
      navigator.vibrate?.([18, 35, 26]);
    } catch (error) {
      setPhase("idle");
      setStatus(error instanceof Error ? error.message : "Mission non finalisée. Aucun Boost utilisé.");
    }
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
    if (navigator.share) await navigator.share({ title: "Mission ImmoBoost", text });
    else await copyText(text, "Mission copiée");
  }

  function downloadMission() {
    if (!kit) return;
    const url = URL.createObjectURL(new Blob([compactText(kit)], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mission-immoboost-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Mission téléchargée");
  }

  function addToCalendar() {
    if (!kit) return;
    const start = new Date(Date.now() + 30 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, "SUMMARY:Prochaine action · ImmoBoost", `DESCRIPTION:${kit.nextAction.replace(/\n/g, " ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "prochaine-action-immoboost.ics";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Action ajoutée à l’agenda");
  }

  function openEmail() {
    if (!kit) return;
    const [subjectLine, ...body] = kit.email.split("\n");
    window.location.href = `mailto:?subject=${encodeURIComponent(subjectLine.replace(/^Objet\s*:\s*/i, ""))}&body=${encodeURIComponent(body.join("\n").trim())}`;
  }

  function openSms() {
    if (!kit) return;
    window.location.href = `sms:?&body=${encodeURIComponent(kit.sms)}`;
  }

  function openWhatsApp() {
    if (!kit) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(kit.sms)}`, "_blank", "noopener,noreferrer");
  }

  function toggleCheck(item: string) {
    setChecked((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]);
  }

  function resetMission() {
    setPhase("idle");
    setKit(null);
    setSelectedSignal(null);
    setCaptureOpen(false);
    setSituation("");
    setPhotoName("");
    setChecked([]);
    setOutcomeOpen(false);
  }

  function recordOutcome(outcome: "done" | "waiting" | "later") {
    if (!kit) return;
    const memory = { situation, market, outcome, lastAction: kit.nextAction, followUp: kit.followUp, savedAt: new Date().toISOString() };
    localStorage.setItem("immoboost-operational-memory", JSON.stringify(memory));
    setOutcomeOpen(false);
    setStatus(outcome === "done" ? "Résultat enregistré · prochaine étape préparée" : outcome === "waiting" ? "Relance préparée au bon moment" : "Dossier remis dans les priorités");
  }

  return (
    <main className={`experience phase-${phase} ${captureOpen ? "capture-open" : ""}`}>
      <ImmersiveField phase={phase} focus={focus} />
      <div className="filmGrain" aria-hidden="true" />
      <div className="lightSweep" aria-hidden="true" />

      <header className="topbar">
        <button className="brand" onClick={resetMission} aria-label="Revenir à l’accueil">
          <span className="brandMark"><i /><i /><i /></span>
          <strong>ImmoBoost</strong>
        </button>
        <div className="topbarTools">
          <span className="launchMarket">BE · FR</span>
          <a className="boostPill" href="/invite/daily-vendeur" aria-label="Solde : 250 Boosts"><span>250</span><small>Boosts</small></a>
        </div>
      </header>

      <section className="world" aria-label="Cockpit quotidien">
        <div className="worldCopy">
          <span className="stageLabel"><i /> {stageLabel}</span>
          <h1>{phase === "ready" ? "Mission prête." : phase === "processing" ? "On s’en charge." : selectedSignal ? selectedSignal.label : <>3 choses comptent<br />aujourd’hui.</>}</h1>
          <p>{phase === "ready" ? "Il ne reste qu’à agir." : phase === "processing" ? "Contexte, faits, stratégie, ton." : selectedSignal ? "Ajoutez seulement ce qui compte." : "Briefing démo · Belgique francophone"}</p>
        </div>

        {phase === "idle" ? (
          <div className="orbitScene" aria-hidden={captureOpen}>
            <div className="orbitHalo haloA" />
            <div className="orbitHalo haloB" />
            <div className="dailyCore" aria-hidden="true"><span>IB</span><i /><b /></div>
            <div className="signalNodes">
              {dailySignals.map((signal) => (
                <button key={signal.id} className={`signalNode node-${signal.index}`} onClick={() => openSignal(signal)} tabIndex={captureOpen ? -1 : 0}>
                  <small>{signal.accent}</small>
                  <strong>{signal.dossier}</strong>
                  <span>{signal.label}</span>
                  <em>{signal.result}</em>
                  <i>↗</i>
                </button>
              ))}
              <button className="signalNode appointmentNode node-3" onClick={() => openSignal(nextAppointment)} tabIndex={captureOpen ? -1 : 0}>
                <small>{nextAppointment.accent}</small>
                <strong>{nextAppointment.dossier}</strong>
                <span>{nextAppointment.label}</span>
                <em>{nextAppointment.result}</em>
                <i>↗</i>
              </button>
            </div>
            <button className="otherSignal" onClick={() => openSignal(null)} tabIndex={captureOpen ? -1 : 0}><span>+</span> Nouvelle situation</button>
          </div>
        ) : null}

        {phase === "idle" ? (
          <div className={`capturePortal ${captureOpen ? "isOpen" : ""}`} aria-hidden={!captureOpen}>
            {captureOpen ? (
              <div className="captureCard">
                <div className="captureHead">
                  <div><small>{selectedSignal ? selectedSignal.accent : "LIBRE"}</small><strong>{selectedSignal?.result ?? "Décrivez la situation"}</strong></div>
                  <button onClick={closeCapture} aria-label="Fermer"><Icon name="close" /></button>
                </div>
                <textarea
                  ref={textarea}
                  value={situation}
                  onChange={(event) => setSituation(event.target.value)}
                  onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") launchMission(); }}
                  placeholder="Dites ce qui se passe, comme à un collègue…"
                  aria-label="Décrivez votre situation"
                />
                {photoName ? <div className="attachment"><Icon name="photo"/><span>{photoName}</span><button onClick={() => setPhotoName("")} aria-label="Retirer la photo"><Icon name="close"/></button></div> : null}
                <input ref={photoInput} className="fileInput" type="file" accept="image/*" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setPhotoName(file.name);
                    if (!situation) setSituation("Voici la photo d’un bien. Prépare sa mise en valeur, son annonce et sa diffusion.");
                  }
                }}/>
                <div className="captureActions">
                  <div className="modeButtons" aria-label="Mode de saisie">
                    <button className={mode === "texte" ? "active" : ""} onClick={() => chooseMode("texte")} aria-label="Écrire"><Icon name="pen"/></button>
                    <button className={mode === "micro" ? "active listening" : ""} onClick={() => chooseMode("micro")} aria-label={listening ? "Écoute en cours" : "Dicter"}><Icon name="mic"/></button>
                    <button className={mode === "photo" ? "active" : ""} onClick={() => chooseMode("photo")} aria-label="Ajouter une photo"><Icon name="photo"/></button>
                  </div>
                  <button className="launchButton" onClick={launchMission} disabled={!situation.trim()}><span>Préparer</span><Icon name="arrow"/></button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {phase === "processing" ? (
          <div className="transitView" role="status" aria-live="polite">
            <div className="transitTunnel"><span /><span /><span /><b>IB</b></div>
            <div className="transitTrack"><i className="active"/><i/><i/></div>
            <p>Comprendre <b>·</b> Préparer <b>·</b> Livrer</p>
            <small>Aucun Boost utilisé avant la livraison</small>
          </div>
        ) : null}

        {phase === "ready" && kit ? (
          <div className="missionRoom">
            <div className="roomTopline">
              <span><i /> Belgique francophone</span>
              <div className="roomTools">
                <button onClick={shareMission} aria-label="Partager"><Icon name="share"/></button>
                <button onClick={downloadMission} aria-label="Télécharger"><Icon name="download"/></button>
                <button onClick={resetMission} aria-label="Fermer"><Icon name="close"/></button>
              </div>
            </div>

            <div className="roomHeading">
              <div><small>Résultat</small><h2>{kit.objective}</h2></div>
              <div className="boostReceipt"><strong>1</strong><span>Boost<br/>utilisé</span></div>
            </div>

            <nav className="roomNav" aria-label="Actions de la mission">
              {roomViews.map((view, index) => (
                <button key={view.id} className={activeView === view.id ? "active" : ""} onClick={() => setActiveView(view.id)}>
                  <i>{String(index + 1).padStart(2, "0")}</i><span>{view.label}</span><small>{view.verb}</small>
                </button>
              ))}
            </nav>

            <div className={`actionDeck view-${activeView}`}>
              {activeView === "act" ? (
                <section className="roomPanel actPanel">
                  <div className="decisionSummary">
                    <div><small>Diagnostic</small><p>{kit.diagnostic}</p></div>
                    <div><small>Recommandation</small><p>{kit.recommendation}</p></div>
                  </div>
                  <div className="nextAction">
                    <small>À faire maintenant</small><p>{kit.nextAction}</p>
                    <div className="nextButtons"><button onClick={addToCalendar}><Icon name="calendar"/> Agenda</button><button onClick={() => setOutcomeOpen(true)}><Icon name="check"/> Action réalisée</button></div>
                    {outcomeOpen ? <div className="outcomeTray"><span>Que s’est-il passé ?</span><div><button onClick={() => recordOutcome("done")}>Réponse reçue</button><button onClick={() => recordOutcome("waiting")}>Pas de réponse</button><button onClick={() => recordOutcome("later")}>À reporter</button></div></div> : null}
                  </div>
                  <div className="simplePlan"><small>Ensuite</small><ol>{kit.plan.slice(0, 4).map((item) => <li key={item}><span /><p>{item}</p></li>)}</ol></div>
                  <div className="followUpCard"><small>Prochaine étape</small><strong>{kit.followUp.when}</strong><p>{kit.followUp.objective}</p><span>{kit.followUp.prepared}</span></div>
                </section>
              ) : null}

              {activeView === "contact" ? (
                <section className="roomPanel contactPanel">
                  <article>
                    <div className="panelLabel"><span><Icon name="mail"/> Email</span><button onClick={() => copyText(kit.email)}><Icon name="copy"/> Copier</button></div>
                    <p>{kit.email}</p>
                    <button className="directAction" onClick={openEmail}>Ouvrir dans Mail <Icon name="arrow"/></button>
                  </article>
                  <article>
                    <div className="panelLabel"><span><Icon name="message"/> Message</span><button onClick={() => copyText(kit.sms)}><Icon name="copy"/> Copier</button></div>
                    <p>{kit.sms}</p>
                    <div className="messageActions"><button onClick={openSms}>SMS</button><button onClick={openWhatsApp}>WhatsApp</button></div>
                  </article>
                  <article className="callCard">
                    <div className="panelLabel"><span><Icon name="phone"/> Appel</span></div>
                    <ol>{kit.callScript.map((line) => <li key={line}>{line}</li>)}</ol>
                  </article>
                </section>
              ) : null}

              {activeView === "promote" ? (
                <section className="roomPanel promotePanel">
                  <article className="socialCard"><small>Publication prête</small><p>{kit.socialPost}</p><button onClick={() => copyText(kit.socialPost)}><Icon name="copy"/> Copier la publication</button></article>
                  <article className="visualCard"><div className="visualGlyph"><span/><span/><span/></div><div><small>Visuel à créer</small><p>{kit.visualBrief}</p></div></article>
                </section>
              ) : null}

              {activeView === "secure" ? (
                <section className="roomPanel securePanel">
                  <article><small>Vérifier</small><ul className="checkList">{kit.checklist.slice(0, 5).map((item) => <li key={item}><button className={checked.includes(item) ? "done" : ""} onClick={() => toggleCheck(item)}><i><Icon name="check"/></i><span>{item}</span></button></li>)}</ul></article>
                  <article>
                    <small>Documents utiles</small>
                    <ul className="documentList">{kit.documents.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>
                    {kit.references.length ? <div className="sourceShelf"><span>Sources officielles · vérifiées</span>{kit.references.map((reference) => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer"><b>{reference.title}</b><small>{reference.authority} · {reference.checkedAt}</small></a>)}</div> : null}
                    <p className="caution">{kit.caution}</p>
                  </article>
                </section>
              ) : null}
            </div>

            <div className="roomFooter">
              <span>Situation non enregistrée dans cette démo</span>
              <button onClick={() => { localStorage.setItem("immoboost-last-mission", JSON.stringify({ situation, market, kit })); setStatus("Mission gardée sur cet appareil"); }}>Garder sur cet appareil</button>
            </div>
          </div>
        ) : null}
      </section>

      <footer className="trustLine"><span>1 mission livrée = 1 Boost</span><i /><span>Échec = 0 Boost</span></footer>
      {status ? <div className="toast" role="status">{status}</div> : null}
    </main>
  );
}
