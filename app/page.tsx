"use client";

import { useState } from "react";
import { dailyActions, type DailyAction } from "../lib/daily-actions";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Source = { title: string; url: string };
type Agent = { id: string; name: string; icon: string; official: boolean };

const starters = [
  "Rédige un email après une visite sans retour",
  "Crée une annonce pour un appartement lumineux à Bruxelles",
  "Mon vendeur trouve mes honoraires trop élevés",
  "Vérifie si le PEB doit apparaître dans une annonce en Wallonie",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function ask(value = question) {
    const clean = value.trim();
    if (!clean || loading) return;

    const previous = messages;
    setMessages([...previous, { role: "user", content: clean }]);
    setQuestion("");
    setError("");
    setSources([]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: clean, history: previous }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d'obtenir une réponse.");

      setAgent(data.agent);
      setSources(data.sources ?? []);
      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function startAction(action: DailyAction) {
    setQuestion(action.prompt);
    window.setTimeout(() => document.getElementById("main-question")?.focus(), 0);
  }

  async function copyAnswer() {
    const answer = [...messages].reverse().find((message) => message.role === "assistant")?.content;
    if (!answer) return;
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function resetChat() {
    setQuestion("");
    setMessages([]);
    setAgent(null);
    setSources([]);
    setError("");
  }

  const hasConversation = messages.length > 0;

  return (
    <main className="appShell">
      <header className="topbar">
        <button className="logo" onClick={resetChat}>IB</button>
        <div className="brand"><strong>ImmoBoost™ Belgique</strong><span>Votre équipe IA immobilière.</span></div>
        <span className="market">🇧🇪 Belgique · FR</span>
      </header>

      <section className={`hero ${hasConversation ? "compactHero" : ""}`}>
        <span className="eyebrow">UNE QUESTION, LE BON AGENT</span>
        <h1>{hasConversation ? "Continuez la conversation." : "Qu’est-ce que vous devez faire maintenant ?"}</h1>
        {!hasConversation && <p>Écrivez comme vous parleriez à un collègue. ImmoBoost choisit automatiquement le bon spécialiste et produit une réponse exploitable.</p>}

        {hasConversation && (
          <div className="chatThread" aria-live="polite">
            {messages.map((message, index) => (
              <div className={`chatMessage ${message.role}`} key={`${message.role}-${index}`}>
                <small>{message.role === "user" ? "VOUS" : agent ? `${agent.icon} ${agent.name.toUpperCase()}` : "IMMOBOOST"}</small>
                <p>{message.content}</p>
              </div>
            ))}
            {loading && <div className="chatMessage assistant loadingBubble"><small>IMMOBOOST</small><p>Le bon agent prépare votre réponse…</p></div>}
          </div>
        )}

        {agent && <div className={`activeAgent ${agent.official ? "official" : ""}`}><span>{agent.icon}</span><div><small>AGENT ACTIF</small><strong>{agent.name}</strong><p>{agent.official ? "Recherche officielle belge activée pour cette question." : "Réponse métier spécialisée et orientée action."}</p></div></div>}

        <div className="askBox">
          <textarea
            id="main-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                ask();
              }
            }}
            placeholder="Ex. Rédige un email pour relancer un vendeur après l’estimation…"
          />
          <button disabled={!question.trim() || loading} onClick={() => ask()}>{loading ? "En cours…" : "Envoyer →"}</button>
        </div>

        {!hasConversation && <div className="starterRow">{starters.map((starter) => <button key={starter} onClick={() => ask(starter)}>{starter}</button>)}</div>}

        {error && <div className="apiError"><strong>Action nécessaire</strong><p>{error}</p></div>}

        {messages.some((message) => message.role === "assistant") && (
          <div className="answerToolbar">
            <button onClick={copyAnswer}>{copied ? "Copié ✓" : "Copier la dernière réponse"}</button>
            <button className="secondary" onClick={resetChat}>Nouvelle conversation</button>
          </div>
        )}

        {sources.length > 0 && (
          <div className="sourcePanel">
            <strong>Sources consultées</strong>
            {sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}
          </div>
        )}
      </section>

      {!hasConversation && (
        <section className="workspace">
          <div className="sectionTitle"><span>AU QUOTIDIEN</span><h2>Que voulez-vous produire ?</h2><p>Chaque bouton prépare une demande concrète. Vous pouvez la modifier avant de l’envoyer.</p></div>
          <div className="actionGrid">
            {dailyActions.map((action) => (
              <button className="actionCard" key={action.id} onClick={() => startAction(action)}>
                <span className="actionIcon">{action.icon}</span><div><strong>{action.title}</strong><small>{action.description}</small></div><b>→</b>
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className="footerNote"><strong>ImmoBoost ne mélange pas les pays.</strong><span>Cette version charge uniquement les agents, contenus et sources de la Belgique.</span></footer>
    </main>
  );
}
