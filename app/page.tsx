"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { getCountryPack } from "../lib/countries";
import type { Kit, MarketingPack } from "../lib/kit";

type DataPassport = {
  requestId: string;
  countryPack: string;
  provider: string;
  model: string;
  sentToAI: { situation: boolean; image: boolean };
  storedByImmoBoost: boolean;
  usedForModelTraining: boolean;
  providerSafetyRetention: string;
  boostEstimate: number;
  boostsDebited: number;
  balanceAfter: number | null;
  availableAfter: number | null;
  commerceMode: "preview" | "enforced";
  billingStatus: "preview" | "settled" | "released" | "pending";
};

type AccessState = {
  loading: boolean;
  mode: "preview" | "enforced";
  authenticated: boolean;
  balance: number | null;
  available: number | null;
  canRecharge?: boolean;
  canSubscribe?: boolean;
};

type Screen = "home" | "loading" | "kit";
type SavedAction = { id: string; title: string; startAt: string };

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const suggestions = [
  "Mon vendeur refuse de baisser son prix",
  "J’ai une visite dans une heure",
  "Un acheteur fait une offre trop basse",
  "Mon annonce ne génère aucun contact",
  "Crée ma semaine de publications immobilières",
  "Prépare une publicité Facebook pour mon bien",
];

const loadingSteps = ["Compréhension de la situation", "Diagnostic", "Sélection des experts", "Composition du kit"];
const country = getCountryPack("BE");

function Icon({ name }: { name: "mic" | "photo" | "send" | "copy" | "check" | "refresh" }) {
  const paths = {
    mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" /></>,
    photo: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="m3 16 5-5 4 4 3-3 6 6M8.5 9h.01" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    refresh: <><path d="M20 7h-6V1" /><path d="M20 7a9 9 0 1 0 1 7" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function CopyButton({ value, label = "Copier" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_800);
  }

  return <button className="copyButton" onClick={copy}>{copied ? <Icon name="check" /> : <Icon name="copy" />}<span>{copied ? "Copié" : label}</span></button>;
}

function ContentTile({ label, title, value, className = "" }: { label: string; title: string; value: string; className?: string }) {
  if (!value.trim()) return null;
  return (
    <article className={`contentTile ${className}`.trim()}>
      <div><small>{label}</small><h3>{title}</h3></div>
      <p>{value}</p>
      <CopyButton value={value} />
    </article>
  );
}

function marketingPackAsText(pack: MarketingPack) {
  return [
    `ANGLE\n${pack.angle}`,
    `ANNONCE\n${pack.listing.headline}\n${pack.listing.body}`,
    `INSTAGRAM\n${pack.social.instagram}`,
    `FACEBOOK\n${pack.social.facebook}`,
    `LINKEDIN\n${pack.social.linkedin}`,
    `PUBLICITÉ\n${pack.advertising.headline}\n${pack.advertising.primaryText}\nCTA : ${pack.advertising.cta}\nAudience : ${pack.advertising.audience}`,
    `REEL\nAccroche : ${pack.reel.hook}\nPlans :\n${pack.reel.shotList.map((item, index) => `${index + 1}. ${item}`).join("\n")}\nVoix off : ${pack.reel.voiceover}\nLégende : ${pack.reel.caption}`,
    `BRIEF CANVA\n${pack.visual.canvaBrief}`,
    `PROMPT CHATGPT\n${pack.aiPrompts.chatgpt}`,
    `PROMPT IMAGE\n${pack.aiPrompts.imageGenerator || pack.visual.imagePrompt}`,
    `HASHTAGS\n${pack.hashtags.join(" ")}`,
  ].filter((section) => section.replace(/^[^\n]+\n/, "").trim()).join("\n\n");
}

function calendarDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function calendarText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function addToCalendar(action: Kit["nextAction"]) {
  const parsed = new Date(action.startAt);
  const start = Number.isFinite(parsed.getTime()) ? parsed : new Date(Date.now() + 60 * 60 * 1_000);
  const end = new Date(start.getTime() + 30 * 60 * 1_000);
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ImmoBoost AI//Action//FR",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@immoboost.ai`,
    `DTSTAMP:${calendarDate(new Date())}`,
    `DTSTART:${calendarDate(start)}`,
    `DTEND:${calendarDate(end)}`,
    `SUMMARY:${calendarText(action.title)}`,
    `DESCRIPTION:${calendarText(action.detail)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "action-immoboost.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

async function compressImage(file: File) {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) throw new Error("Format non pris en charge");
  if (file.size > 12 * 1024 * 1024) throw new Error("La photo dépasse 12 Mo");

  const source = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Photo illisible");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [situation, setSituation] = useState("");
  const [image, setImage] = useState<string>("");
  const [imageName, setImageName] = useState("");
  const [kit, setKit] = useState<Kit | null>(null);
  const [expert, setExpert] = useState("");
  const [dataPassport, setDataPassport] = useState<DataPassport | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [listening, setListening] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [access, setAccess] = useState<AccessState>({ loading: true, mode: "preview", authenticated: false, balance: null, available: null });
  const [showActivation, setShowActivation] = useState(false);
  const [activationSource, setActivationSource] = useState<"etsy" | "lemon">("etsy");
  const [activationEmail, setActivationEmail] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activating, setActivating] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [savedActions, setSavedActions] = useState<SavedAction[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (screen !== "loading") return;
    const timer = window.setInterval(() => setLoadingStep((step) => Math.min(step + 1, loadingSteps.length - 1)), 900);
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("immoboost_actions") ?? "[]") as unknown;
      if (Array.isArray(parsed)) {
        setSavedActions(parsed.filter((item): item is SavedAction => Boolean(
          item && typeof item === "object"
          && typeof (item as SavedAction).id === "string"
          && typeof (item as SavedAction).title === "string"
          && typeof (item as SavedAction).startAt === "string"
          && Number.isFinite(Date.parse((item as SavedAction).startAt))
        )).slice(0, 20));
      }
    } catch {
      window.localStorage.removeItem("immoboost_actions");
    }
  }, []);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams(window.location.search);
    if (query.get("recharge") === "unavailable") {
      setError("La recharge n’est pas encore disponible. Réessayez plus tard.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (query.get("subscription") === "unavailable") {
      setError("L’abonnement direct n’est pas encore disponible pour cet accès.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (query.get("access") === "required") {
      setShowActivation(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    const pilotToken = new URLSearchParams(window.location.hash.slice(1)).get("pilot");
    const sessionRequest = pilotToken
      ? fetch("/api/auth/pilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: pilotToken }),
        }).finally(() => window.history.replaceState({}, "", window.location.pathname))
      : fetch("/api/auth/session", { cache: "no-store" });
    void sessionRequest
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!active) return;
        setAccess({
          loading: false,
          mode: pilotToken || data.mode === "enforced" ? "enforced" : "preview",
          authenticated: response.ok && data.authenticated === true,
          balance: typeof data.balance === "number" ? data.balance : null,
          available: typeof data.available === "number" ? data.available : null,
          canRecharge: data.canRecharge === true,
          canSubscribe: data.canSubscribe === true,
        });
        if (pilotToken && response.ok) setNotice("Votre accès pilote est activé. Décrivez simplement votre première situation.");
        if (pilotToken && !response.ok) setError(data.error || "Ce lien pilote n’est plus valide.");
      })
      .catch(() => active && setAccess((current) => ({ ...current, loading: false })));
    return () => { active = false; };
  }, []);

  async function prepareKit(text = situation) {
    const cleanText = text.trim();
    if (!cleanText && !image) return;
    setSituation(cleanText);
    setError("");
    setNotice("");
    setLoadingStep(0);
    setScreen("loading");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanText, image: image || undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "ACCESS_REQUIRED") setShowActivation(true);
        if (data.code === "INSUFFICIENT_BOOSTS") setShowAccount(true);
        throw new Error(data.error || "Le kit n’a pas pu être préparé.");
      }
      setKit(data.kit);
      setExpert(data.expert?.name || "Expert ImmoBoost");
      setDataPassport(data.dataPassport || null);
      if (data.dataPassport?.requestId && data.kit?.nextAction?.title && data.kit?.nextAction?.startAt) {
        setSavedActions((current) => {
          if (current.some((action) => action.id === data.dataPassport.requestId)) return current;
          const next = [{ id: data.dataPassport.requestId, title: data.kit.nextAction.title, startAt: data.kit.nextAction.startAt }, ...current].slice(0, 20);
          window.localStorage.setItem("immoboost_actions", JSON.stringify(next));
          return next;
        });
      }
      if (typeof data.dataPassport?.balanceAfter === "number") {
        setAccess((current) => ({
          ...current,
          balance: data.dataPassport.balanceAfter,
          available: typeof data.dataPassport.availableAfter === "number" ? data.dataPassport.availableAfter : data.dataPassport.balanceAfter,
        }));
      }
      setScreen("kit");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
      setScreen("home");
    }
  }

  async function activateAccess() {
    setActivationError("");
    setActivating(true);
    try {
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: activationSource, email: activationEmail, orderReference }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "L’activation a échoué.");
      setAccess({
        loading: false,
        mode: "enforced",
        authenticated: true,
        balance: data.balance,
        available: data.available,
        canRecharge: data.canRecharge === true,
        canSubscribe: data.canSubscribe === true,
      });
      setShowActivation(false);
      setActivationEmail("");
      setOrderReference("");
      setError("");
    } catch (caught) {
      setActivationError(caught instanceof Error ? caught.message : "L’activation a échoué.");
    } finally {
      setActivating(false);
    }
  }

  async function logout() {
    setAccountBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setAccess({ loading: false, mode: "enforced", authenticated: false, balance: 0, available: 0 });
      setShowAccount(false);
    } finally {
      setAccountBusy(false);
    }
  }

  async function deleteAccount() {
    if (deleteConfirmation !== "SUPPRIMER") return;
    setAccountBusy(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      if (!response.ok) throw new Error("Suppression impossible pour le moment.");
      setAccess({ loading: false, mode: "enforced", authenticated: false, balance: 0, available: 0 });
      setShowAccount(false);
      reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Suppression impossible pour le moment.");
    } finally {
      setAccountBusy(false);
    }
  }

  function startListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("La dictée vocale n’est pas disponible dans ce navigateur. Vous pouvez utiliser le micro du clavier.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = country.voiceLocale;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => setSituation((current) => `${current} ${event.results[0][0].transcript}`.trim());
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError("Je n’ai pas pu entendre la dictée. Réessayez ou utilisez le clavier.");
    };
    recognitionRef.current = recognition;
    setError("");
    setListening(true);
    recognition.start();
  }

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setError("");
      setImage(await compressImage(file));
      setImageName(file.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La photo n’a pas pu être ajoutée.");
    }
    event.target.value = "";
  }

  function reset() {
    setScreen("home");
    setSituation("");
    setImage("");
    setImageName("");
    setKit(null);
    setDataPassport(null);
    setError("");
    setNotice("");
  }

  function completeSavedAction(id: string) {
    setSavedActions((current) => {
      const next = current.filter((action) => action.id !== id);
      window.localStorage.setItem("immoboost_actions", JSON.stringify(next));
      return next;
    });
  }

  return (
    <main className="appShell">
      <header className="topbar">
        <button className="brand" onClick={reset} aria-label="Accueil ImmoBoost"><span className="brandMark">IB</span><span>ImmoBoost <b>AI</b></span></button>
        <div className="accountBar">
          {access.mode === "preview" && !access.loading && <span className="previewBadge">PREVIEW</span>}
          {access.mode === "enforced" && access.authenticated && <button className="boostBalance" onClick={() => { setDeleteConfirmation(""); setShowAccount(true); }}><b>{access.available ?? 0}</b> Boosts</button>}
          {access.mode === "enforced" && !access.authenticated && !access.loading && <button className="activateButton" onClick={() => setShowActivation(true)}>Activer mon accès</button>}
          <span className="market">{country.label} · FR</span>
        </div>
      </header>

      {showActivation && (
        <div className="activationOverlay" role="dialog" aria-modal="true" aria-labelledby="activation-title">
          <section className="activationCard">
            <button className="activationClose" onClick={() => setShowActivation(false)} aria-label="Fermer">×</button>
            <span className="activationEyebrow">ACCÈS SÉCURISÉ</span>
            <h2 id="activation-title">Activez ImmoBoost.</h2>
            <p>Utilisez l’email et le numéro indiqués sur votre commande. Aucun mot de passe à retenir.</p>
            <div className="sourceTabs">
              <button className={activationSource === "etsy" ? "active" : ""} onClick={() => setActivationSource("etsy")}>Etsy</button>
              <button className={activationSource === "lemon" ? "active" : ""} onClick={() => setActivationSource("lemon")}>ImmoBoost</button>
            </div>
            <label>Email de la commande<input type="email" autoComplete="email" value={activationEmail} onChange={(event) => setActivationEmail(event.target.value)} placeholder="vous@agence.be" maxLength={254} /></label>
            <label>Numéro de commande<input value={orderReference} onChange={(event) => setOrderReference(event.target.value)} placeholder={activationSource === "etsy" ? "Ex. 1234567890" : "Référence de commande"} maxLength={128} /></label>
            {activationError && <div className="activationError" role="alert">{activationError}</div>}
            <button className="activationSubmit" onClick={() => void activateAccess()} disabled={activating || !activationEmail.trim() || !orderReference.trim()}>{activating ? "Vérification…" : "Ouvrir mon espace"}</button>
            <small>Votre email et votre référence sont transformés en empreintes irréversibles avant stockage.</small>
          </section>
        </div>
      )}

      {showAccount && access.authenticated && (
        <div className="activationOverlay" role="dialog" aria-modal="true" aria-labelledby="account-title">
          <section className="activationCard accountCard">
            <button className="activationClose" onClick={() => { setDeleteConfirmation(""); setShowAccount(false); }} aria-label="Fermer">×</button>
            <span className="activationEyebrow">MON ACCÈS</span>
            <h2 id="account-title">{access.available ?? 0} Boosts</h2>
            <p>Votre solde disponible. Une mission n’est débitée qu’après livraison complète du kit.</p>
            <div className="accountActions">
              {access.canSubscribe && <a className="primaryAccountAction" href="/api/commerce/subscribe">Passer à l’abonnement</a>}
              {access.canRecharge && <a className={access.canSubscribe ? "" : "primaryAccountAction"} href="/api/commerce/recharge">Ajouter des Boosts</a>}
              <a href="/api/account/export" download>Télécharger mes données</a>
              <button onClick={() => void logout()} disabled={accountBusy}>Fermer la session</button>
            </div>
            <div className="dangerZone">
              <strong>Supprimer définitivement mon accès</strong>
              <p>Les sessions, le portefeuille et les données du compte seront supprimés. Cette action est irréversible.</p>
              <input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder="Tapez SUPPRIMER" />
              <button onClick={() => void deleteAccount()} disabled={accountBusy || deleteConfirmation !== "SUPPRIMER"}>Supprimer mon compte</button>
            </div>
          </section>
        </div>
      )}

      {screen === "home" && (
        <section className="homeScreen">
          <div className="glow glowOne" /><div className="glow glowTwo" />
          <div className="homeInner">
            <div className="eyebrow"><span /> Assistant immobilier intelligent</div>
            <h1>Que se passe-t-il<br />aujourd’hui&nbsp;?</h1>
            <p className="homeLead">Décrivez la situation. ImmoBoost comprend, décide et prépare tout ce dont vous avez besoin.</p>

            <div className="missionInput">
              {image && <div className="imagePreview"><img src={image} alt="Photo jointe" /><span>{imageName}</span><button onClick={() => { setImage(""); setImageName(""); }} aria-label="Retirer la photo">×</button></div>}
              <textarea
                autoFocus
                value={situation}
                onChange={(event) => setSituation(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void prepareKit(); } }}
                placeholder="Ex. Mon vendeur refuse de baisser son prix…"
                maxLength={5_000}
              />
              <div className="inputActions">
                <div className="mediaActions">
                  <button className={listening ? "iconButton listening" : "iconButton"} onClick={startListening} aria-label="Dicter la situation"><Icon name="mic" /></button>
                  <button className="iconButton" onClick={() => inputRef.current?.click()} aria-label="Ajouter une photo"><Icon name="photo" /></button>
                  <input ref={inputRef} className="hiddenInput" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} />
                </div>
                <button className="submitButton" onClick={() => void prepareKit()} disabled={!situation.trim() && !image}><span>Préparer mon kit</span><Icon name="send" /></button>
              </div>
            </div>

            {error && <div className="errorMessage" role="alert">{error}</div>}
            {notice && <div className="successMessage" role="status">{notice}</div>}

            {savedActions.length > 0 && (
              <section className="todayActions" aria-label="Actions à faire">
                <div><span>AUJOURD’HUI</span><strong>Mes prochaines actions</strong></div>
                {savedActions.slice(0, 3).map((action) => (
                  <article key={action.id}>
                    <time>{new Intl.DateTimeFormat("fr-BE", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(action.startAt))}</time>
                    <p>{action.title}</p>
                    <button onClick={() => completeSavedAction(action.id)} aria-label={`Marquer ${action.title} comme terminé`}>✓</button>
                  </article>
                ))}
                <small>Conservé uniquement sur cet appareil. Rien n’est ajouté au serveur.</small>
              </section>
            )}

            <div className="suggestions" aria-label="Suggestions">
              {suggestions.map((suggestion) => <button key={suggestion} onClick={() => void prepareKit(suggestion)}>{suggestion}<span>↗</span></button>)}
            </div>
            <p className="privacyNote"><span>●</span> Vos demandes ne servent pas à entraîner le modèle. ImmoBoost ne les conserve pas après la réponse.</p>
          </div>
        </section>
      )}

      {screen === "loading" && (
        <section className="loadingScreen" aria-live="polite">
          <div className="brainPulse"><span>IB</span><i /><i /></div>
          <p className="loadingEyebrow">MISSION BRAIN</p>
          <h1>Je prépare votre solution.</h1>
          <div className="loadingTrack">
            {loadingSteps.map((step, index) => <div key={step} className={index < loadingStep ? "done" : index === loadingStep ? "active" : ""}><span>{index < loadingStep ? "✓" : index + 1}</span><p>{step}</p></div>)}
          </div>
        </section>
      )}

      {screen === "kit" && kit && (
        <section className="kitScreen">
          <div className="kitTopline">
            <button className="newMission" onClick={reset}><Icon name="refresh" /> Nouvelle situation</button>
            <span>Kit préparé par {expert}</span>
          </div>

          <header className="kitHero">
            <div className="statusPill"><span>✓</span> Situation comprise</div>
            <h1>{kit.title}</h1>
            <p>{kit.diagnostic}</p>
            <div className="objectiveLine"><span>Objectif</span><strong>{kit.objective}</strong><i>{kit.urgency}</i></div>
          </header>

          <div className="kitGrid">
            <article className="kitCard planCard">
              <div className="cardHeading"><span className="cardNumber">01</span><div><small>PLAN D’ACTION</small><h2>La marche à suivre</h2></div></div>
              <div className="planSteps">{kit.plan.map((step, index) => <div key={`${step.title}-${index}`}><span>{index + 1}</span><div><strong>{step.title}</strong><p>{step.detail}</p></div></div>)}</div>
            </article>

            <aside className="nextActionCard">
              <small>PROCHAINE ACTION</small>
              <span className="actionWhen">{kit.nextAction.when}</span>
              <h2>{kit.nextAction.title}</h2>
              <p>{kit.nextAction.detail}</p>
              <button className="calendarAction" onClick={() => addToCalendar(kit.nextAction)}>Ajouter à mon agenda</button>
            </aside>

            <article className="kitCard emailCard">
              <div className="cardHeading"><span className="cardNumber">02</span><div><small>EMAIL</small><h2>Prêt à envoyer</h2></div><CopyButton value={`Objet : ${kit.email.subject}\n\n${kit.email.body}`} /></div>
              <div className="messageBox"><strong>Objet : {kit.email.subject}</strong><p>{kit.email.body}</p></div>
            </article>

            <article className="kitCard smsCard">
              <div className="cardHeading"><span className="cardNumber">03</span><div><small>SMS / WHATSAPP</small><h2>Version courte</h2></div><CopyButton value={kit.sms} /></div>
              <div className="phoneBubble">{kit.sms}</div>
            </article>

            <article className="kitCard callCard">
              <div className="cardHeading"><span className="cardNumber">04</span><div><small>APPEL</small><h2>Votre script</h2></div><CopyButton value={[kit.callScript.opening, ...kit.callScript.questions, ...kit.callScript.objections, kit.callScript.closing].join("\n\n")} /></div>
              <div className="scriptBlock"><label>Ouverture</label><p>{kit.callScript.opening}</p></div>
              <div className="scriptColumns"><div><label>Questions</label><ul>{kit.callScript.questions.map((item) => <li key={item}>{item}</li>)}</ul></div><div><label>Réponses aux objections</label><ul>{kit.callScript.objections.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
              <div className="scriptBlock closing"><label>Conclusion</label><p>{kit.callScript.closing}</p></div>
            </article>

            {kit.marketingPack.enabled && (
              <article className="kitCard marketingCard">
                <div className="cardHeading marketingHeading"><span className="cardNumber">05</span><div><small>GROWTH PACK</small><h2>Votre campagne complète</h2></div><CopyButton value={marketingPackAsText(kit.marketingPack)} label="Copier tout" /></div>
                <div className="marketingAngle"><span>ANGLE CENTRAL</span><strong>{kit.marketingPack.angle}</strong></div>

                {(kit.marketingPack.listing.headline || kit.marketingPack.listing.body) && (
                  <section className="listingContent">
                    <div className="contentSectionTitle"><small>ANNONCE IMMOBILIÈRE</small><h3>{kit.marketingPack.listing.headline}</h3><CopyButton value={`${kit.marketingPack.listing.headline}\n\n${kit.marketingPack.listing.body}`} /></div>
                    <p>{kit.marketingPack.listing.body}</p>
                  </section>
                )}

                <div className="marketingGroupTitle"><span>PUBLICATIONS</span><p>Chaque réseau reçoit un texte adapté à son audience.</p></div>
                <div className="contentTiles socialTiles">
                  <ContentTile label="INSTAGRAM" title="Publication visuelle" value={`${kit.marketingPack.social.instagram}\n\n${kit.marketingPack.hashtags.join(" ")}`} />
                  <ContentTile label="FACEBOOK" title="Publication locale" value={kit.marketingPack.social.facebook} />
                  <ContentTile label="LINKEDIN" title="Publication expertise" value={kit.marketingPack.social.linkedin} />
                </div>

                <div className="marketingGroupTitle"><span>ACQUISITION</span><p>Une publicité et un Reel structurés pour générer l’action.</p></div>
                <div className="contentTiles acquisitionTiles">
                  <ContentTile label="PUBLICITÉ" title={kit.marketingPack.advertising.headline || "Campagne sponsorisée"} value={`${kit.marketingPack.advertising.primaryText}\n\nCTA : ${kit.marketingPack.advertising.cta}\nAudience : ${kit.marketingPack.advertising.audience}`} className="accentTile" />
                  <ContentTile label="SCRIPT REEL" title={kit.marketingPack.reel.hook || "Vidéo courte"} value={`${kit.marketingPack.reel.shotList.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\nVoix off : ${kit.marketingPack.reel.voiceover}\n\nLégende : ${kit.marketingPack.reel.caption}`} />
                </div>

                <div className="marketingGroupTitle"><span>STUDIO CRÉATIF</span><p>Les instructions prêtes pour Canva, ChatGPT ou votre générateur d’images.</p></div>
                <div className="contentTiles creativeTiles">
                  <ContentTile label="CANVA" title="Brief visuel" value={kit.marketingPack.visual.canvaBrief} />
                  <ContentTile label="CHATGPT / CLAUDE / GEMINI" title="Prompt expert" value={kit.marketingPack.aiPrompts.chatgpt} />
                  <ContentTile label="GÉNÉRATEUR D’IMAGES" title="Prompt visuel" value={kit.marketingPack.aiPrompts.imageGenerator || kit.marketingPack.visual.imagePrompt} />
                </div>
              </article>
            )}

            <article className="kitCard checklistCard">
              <div className="cardHeading"><span className="cardNumber">{kit.marketingPack.enabled ? "06" : "05"}</span><div><small>CHECKLIST</small><h2>Avant d’agir</h2></div></div>
              <ul className="checkList">{kit.checklist.map((item) => <li key={item}><span><Icon name="check" /></span>{item}</li>)}</ul>
            </article>

            <article className="kitCard documentsCard">
              <div className="cardHeading"><span className="cardNumber">{kit.marketingPack.enabled ? "07" : "06"}</span><div><small>DOCUMENTS</small><h2>À réunir</h2></div></div>
              {kit.documents.length ? <div className="documentList">{kit.documents.map((item) => <div key={item}><span>DOC</span><p>{item}</p></div>)}</div> : <p className="emptyState">Aucun document nécessaire pour cette action.</p>}
            </article>
          </div>

          {(kit.warning || kit.sources.length > 0) && <footer className="verificationBox">{kit.warning && <p><strong>À vérifier</strong>{kit.warning}</p>}{kit.sources.length > 0 && <div><strong>Sources officielles</strong>{kit.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div>}</footer>}

          {dataPassport && (
            <aside className="dataPassport" aria-label="Passeport de données de la mission">
              <div className="passportHeading"><span>PROTECTION DES DONNÉES</span><strong>Passeport de cette mission</strong></div>
              <dl>
                <div><dt>Envoyé au moteur</dt><dd>{[dataPassport.sentToAI.situation && "situation", dataPassport.sentToAI.image && "photo"].filter(Boolean).join(" + ")}</dd></div>
                <div><dt>Conservé par ImmoBoost</dt><dd>{dataPassport.storedByImmoBoost ? "Oui" : "Non"}</dd></div>
                <div><dt>Entraînement du modèle</dt><dd>{dataPassport.usedForModelTraining ? "Oui" : "Non"}</dd></div>
                <div><dt>Coût de la mission</dt><dd>{dataPassport.commerceMode === "preview" ? "Preview · 0 Boost" : `${dataPassport.boostsDebited} Boost${dataPassport.boostsDebited > 1 ? "s" : ""}`}</dd></div>
                {typeof dataPassport.availableAfter === "number" && <div><dt>Solde disponible</dt><dd>{dataPassport.availableAfter} Boosts</dd></div>}
              </dl>
              <p>{dataPassport.providerSafetyRetention}</p>
              <small>{dataPassport.provider} · {dataPassport.countryPack} · Référence {dataPassport.requestId.slice(0, 8)}</small>
            </aside>
          )}
        </section>
      )}
    </main>
  );
}
