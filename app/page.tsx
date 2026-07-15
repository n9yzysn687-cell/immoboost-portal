"use client";

import { useMemo, useState } from "react";

type View = "home" | "seller" | "detail";
type Detail = "checklist" | "questions" | "documents" | "attention";

const situations = [
  ["🤝", "Rendez-vous vendeur", "Questions, documents et points d’attention", "2 min"],
  ["🏡", "Estimation", "Structurez votre analyse avant le rendez-vous", "3 min"],
  ["📢", "Mise en vente", "Annonce, plan photo et diffusion", "2 min"],
  ["💬", "Réponse client", "Email, WhatsApp ou SMS prêt à adapter", "30 sec"],
  ["📄", "Trouver un modèle", "Retrouvez immédiatement le bon support", "15 sec"],
  ["⚖️", "Question métier", "Une orientation claire avec niveau de vigilance", "1 min"],
];

const content: Record<Detail, { title: string; intro: string; items: string[]; trust: string }> = {
  checklist: {
    title: "Avant de partir",
    intro: "L’essentiel pour arriver préparé, sans stocker de données client.",
    items: [
      "Vérifier le PEB et les informations publiques disponibles",
      "Préparer quelques comparables récents à contrôler",
      "Clarifier vos honoraires et votre méthode de travail",
      "Prévoir les documents de présentation utiles",
      "Préparer les questions sur le projet et le calendrier",
      "Vérifier l’adresse, le trajet et l’heure du rendez-vous",
    ],
    trust: "Prêt à utiliser",
  },
  questions: {
    title: "Questions essentielles",
    intro: "Des questions courtes pour comprendre le projet avant de proposer une solution.",
    items: [
      "Pourquoi envisagez-vous de vendre aujourd’hui ?",
      "Quel serait votre calendrier idéal ?",
      "Qu’est-ce qui compte le plus pour vous dans cet accompagnement ?",
      "Avez-vous déjà reçu une estimation ou rencontré une agence ?",
      "Quels travaux ou améliorations ont été réalisés ?",
      "Existe-t-il un point particulier que je dois connaître avant l’analyse ?",
    ],
    trust: "À personnaliser",
  },
  documents: {
    title: "Documents utiles",
    intro: "Uniquement les catégories à prévoir. Les documents sensibles restent dans vos outils habituels.",
    items: [
      "Présentation de votre méthode d’accompagnement",
      "Explication claire des honoraires",
      "Liste indicative des documents nécessaires à la vente",
      "Support de prise de notes anonymisé",
      "Modèle de suivi après rendez-vous",
    ],
    trust: "À personnaliser",
  },
  attention: {
    title: "Points d’attention",
    intro: "Les sujets qui demandent souvent une explication claire ou une vérification externe.",
    items: [
      "Ne pas présenter une estimation comme une garantie de prix",
      "Distinguer faits vérifiés, hypothèses et recommandations",
      "Éviter d’introduire des noms, emails ou numéros personnels inutiles",
      "Faire vérifier les questions juridiques, fiscales ou urbanistiques sensibles",
      "Ne pas promettre un délai de vente sans contexte de marché suffisant",
    ],
    trust: "À vérifier selon le dossier",
  },
};

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [detail, setDetail] = useState<Detail>("checklist");
  const [checked, setChecked] = useState<number[]>([]);

  const progress = useMemo(() => Math.round((checked.length / content.checklist.items.length) * 100), [checked]);

  function openDetail(next: Detail) {
    setDetail(next);
    setView("detail");
  }

  return (
    <main className="app">
      <header className="topbar">
        <button className="logo" onClick={() => setView("home")} aria-label="Accueil ImmoBoost">IB</button>
        <div className="brand"><strong>ImmoBoost™</strong><span>Préparer. Utiliser. Avancer.</span></div>
        <div className="privacy">● Mode confidentiel</div>
      </header>

      {view === "home" && (
        <section className="screen">
          <div className="intro">
            <span className="kicker">VOTRE ESPACE DE PRÉPARATION</span>
            <h1>Bonjour.<br />Quelle est votre situation ?</h1>
            <p>Choisissez un moment du métier. ImmoBoost présente directement une préparation utile, sans vous demander de construire un prompt.</p>
          </div>

          <div className="situationGrid">
            {situations.map(([icon, title, description, time], index) => (
              <button
                className={`situationCard ${index === 0 ? "featured" : ""}`}
                key={title}
                onClick={() => index === 0 ? setView("seller") : undefined}
                aria-disabled={index !== 0}
              >
                <span className="icon">{icon}</span>
                <span className="cardText"><strong>{title}</strong><small>{description}</small></span>
                <span className="time">{time}</span>
                {index !== 0 && <span className="soon">Bientôt</span>}
              </button>
            ))}
          </div>

          <div className="resumeCard">
            <div><span className="label">PREMIÈRE PRÉPARATION DISPONIBLE</span><strong>Rendez-vous vendeur</strong><small>Une solution prête avant même d’ajouter du contexte.</small></div>
            <button className="primary" onClick={() => setView("seller")}>Préparer maintenant</button>
          </div>
        </section>
      )}

      {view === "seller" && (
        <section className="screen preparation">
          <button className="back" onClick={() => setView("home")}>← Retour</button>
          <div className="preparationHero">
            <span className="kicker">RENDEZ-VOUS VENDEUR · ENVIRON 2 MINUTES</span>
            <h1>Votre préparation est déjà structurée.</h1>
            <p>Commencez par l’essentiel. Vous pourrez personnaliser uniquement ce qui en a besoin.</p>
            <div className="statusRow"><span className="ready">● Prêt à utiliser</span><span>Sans donnée personnelle obligatoire</span></div>
          </div>

          <div className="solutionGrid">
            <button className="solutionCard" onClick={() => openDetail("checklist")}><span>📋</span><strong>Ce qu’il faut préparer</strong><small>6 points essentiels</small><b>Ouvrir →</b></button>
            <button className="solutionCard" onClick={() => openDetail("questions")}><span>💬</span><strong>Questions importantes</strong><small>6 questions prêtes</small><b>Ouvrir →</b></button>
            <button className="solutionCard" onClick={() => openDetail("documents")}><span>📄</span><strong>Documents utiles</strong><small>5 catégories</small><b>Ouvrir →</b></button>
            <button className="solutionCard warning" onClick={() => openDetail("attention")}><span>⚠️</span><strong>Points d’attention</strong><small>5 vérifications</small><b>Ouvrir →</b></button>
          </div>

          <div className="nextCard">
            <div><span className="label">ET MAINTENANT ?</span><strong>Commencez par la préparation express.</strong><small>Les six points indispensables, lisibles en moins d’une minute.</small></div>
            <button className="primary" onClick={() => openDetail("checklist")}>Voir l’essentiel</button>
          </div>
        </section>
      )}

      {view === "detail" && (
        <section className="screen detailScreen">
          <button className="back" onClick={() => setView("seller")}>← Rendez-vous vendeur</button>
          <div className="detailHeader">
            <span className="trust">{content[detail].trust}</span>
            <h1>{content[detail].title}</h1>
            <p>{content[detail].intro}</p>
          </div>

          <div className="itemList">
            {content[detail].items.map((item, index) => {
              const isChecklist = detail === "checklist";
              const isChecked = checked.includes(index);
              return (
                <button
                  key={item}
                  className={`item ${isChecked ? "checked" : ""}`}
                  onClick={() => isChecklist && setChecked(current => current.includes(index) ? current.filter(value => value !== index) : [...current, index])}
                >
                  <span className="number">{isChecklist ? (isChecked ? "✓" : "○") : String(index + 1).padStart(2, "0")}</span>
                  <strong>{item}</strong>
                </button>
              );
            })}
          </div>

          {detail === "checklist" && <div className="progress"><div style={{ width: `${progress}%` }} /><span>{progress}% prêt</span></div>}

          <div className="privacyNote"><strong>Confidentialité par défaut</strong><span>Utilisez des descriptions génériques. Ne saisissez pas de numéro national, document d’identité, donnée bancaire ou information personnelle non indispensable.</span></div>

          <button className="primary full" onClick={() => setView("seller")}>Continuer la préparation</button>
        </section>
      )}

      <nav className="mobileNav">
        <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>⌂<small>Accueil</small></button>
        <button className={view !== "home" ? "active" : ""} onClick={() => setView("seller")}>◫<small>Préparation</small></button>
        <button disabled>⌕<small>Trouver</small></button>
        <button disabled>◉<small>Profil</small></button>
      </nav>
    </main>
  );
}
