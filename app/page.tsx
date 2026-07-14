"use client";

import { useMemo, useState } from "react";

const COPILOT_URL = "https://chatgpt.com/g/g-6a5540cd8d24819190e9a0d0ff3dabf2-immoboost-copilottm";

const missions = [
  "Construire son pipeline vendeur",
  "Transformer un contact en rendez-vous",
  "Préparer un rendez-vous vendeur",
  "Réaliser une estimation professionnelle",
  "Obtenir le mandat",
  "Préparer la mise en vente",
  "Commercialiser le bien",
  "Gérer les acheteurs et les visites",
  "Négocier une offre",
  "Sécuriser la vente",
  "Transformer le client en ambassadeur",
  "Développer son activité",
];

export default function Home() {
  const [active, setActive] = useState("dashboard");
  const [done, setDone] = useState<number[]>([]);
  const completion = useMemo(() => Math.round((done.length / missions.length) * 100), [done]);

  const toggleMission = (index: number) => {
    setDone((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span>IB</span><div><strong>ImmoBoost™</strong><small>Workspace immobilier</small></div></div>
        {[
          ["dashboard", "Aujourd’hui"],
          ["missions", "Missions"],
          ["copilot", "Copilot"],
          ["resources", "Ressources"],
        ].map(([id, label]) => (
          <button key={id} className={active === id ? "nav active" : "nav"} onClick={() => setActive(id)}>{label}</button>
        ))}
      </aside>

      <main>
        {active === "dashboard" && (
          <>
            <section className="hero">
              <span className="eyebrow">IMMOBOOST WORKSPACE</span>
              <h1>Qu’est-ce qu’on traite en priorité ?</h1>
              <p>Un espace simple pour structurer les dossiers, accélérer les décisions et ouvrir le bon outil au bon moment.</p>
              <div className="actions">
                <a className="primary" href={COPILOT_URL} target="_blank" rel="noreferrer">Ouvrir le Copilot</a>
                <button className="secondary" onClick={() => setActive("missions")}>Voir les Missions</button>
              </div>
            </section>
            <section className="grid">
              <article className="card"><small>Missions</small><strong>12</strong></article>
              <article className="card"><small>Progression</small><strong>{completion}%</strong></article>
              <article className="card"><small>Copilot</small><strong className="online">Actif</strong></article>
              <article className="card wide"><h2>Raccourcis</h2><p>Préparer un appel, écrire un message, créer une annonce ou traiter une objection.</p><a className="primary" href={COPILOT_URL} target="_blank" rel="noreferrer">Lancer une action</a></article>
            </section>
          </>
        )}

        {active === "missions" && (
          <section>
            <div className="heading"><div><span className="eyebrow dark">PARCOURS MÉTIER</span><h1>Les 12 Missions</h1></div><strong>{completion}% terminé</strong></div>
            <div className="missionGrid">
              {missions.map((mission, index) => (
                <article className="mission" key={mission}>
                  <small>MISSION {String(index + 1).padStart(2, "0")}</small>
                  <h2>{mission}</h2>
                  <button onClick={() => toggleMission(index)}>{done.includes(index) ? "Terminée ✓" : "Marquer terminée"}</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {active === "copilot" && (
          <section className="card focus"><span className="eyebrow dark">COPILOT OFFICIEL</span><h1>Travaille dans une conversation par dossier.</h1><p>Utilise un fil distinct pour chaque vendeur, acheteur ou bien afin de conserver un contexte propre.</p><a className="primary" href={COPILOT_URL} target="_blank" rel="noreferrer">Ouvrir ImmoBoost Copilot</a></section>
        )}

        {active === "resources" && (
          <section className="card focus"><span className="eyebrow dark">RESSOURCES</span><h1>La bibliothèque client arrive ici.</h1><p>Guides, checklists, scripts, modèles et mises à jour seront ajoutés au fil des prochains sprints.</p></section>
        )}
      </main>
    </div>
  );
}
