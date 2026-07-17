"use client";

import { useMemo, useState } from "react";
import { dailyActions } from "../lib/daily-actions";
import { buildMissionKit, markets, type MarketCode } from "../lib/daily-engine";
import { searchWorkflows, workflows } from "../lib/workflows";

type InputMode = "texte" | "micro" | "photo";

const marketCodes = Object.keys(markets) as MarketCode[];
const missionPrompts = [
  "Mon vendeur refuse l’exclusivité et compare mes honoraires",
  "Je dois répondre à une offre trop basse avant ce soir",
  "Je veux transformer ce bien en annonce + posts sociaux",
];

export default function Home() {
  const [situation, setSituation] = useState("");
  const [market, setMarket] = useState<MarketCode>("BE");
  const [mode, setMode] = useState<InputMode>("texte");
  const [missionReady, setMissionReady] = useState(false);

  const workflow = useMemo(() => (situation.trim() ? searchWorkflows(situation, "all")[0] ?? workflows[0] : workflows[0]), [situation]);
  const kit = useMemo(() => buildMissionKit(situation, market, workflow), [situation, market, workflow]);

  function launchMission(text = situation) {
    if (!text.trim()) return;
    setSituation(text);
    setMissionReady(true);
  }

  return (
    <main className="agentDailyShell">
      <header className="dailyTopbar">
        <a className="dailyBrand" href="#top" aria-label="Agent Daily accueil"><span>AD</span><strong>Agent Daily</strong></a>
        <nav>
          <a href="#brain">Mission Brain</a>
          <a href="#kit">Kit complet</a>
          <a href="/invite/daily-vendeur">Démo 250 crédits</a>
        </nav>
      </header>

      <section id="top" className="cockpitHero">
        <div className="scene3d" aria-hidden="true">
          <div className="brainOrb"><span>Mission Brain</span></div>
          <div className="orbit orbitOne" />
          <div className="orbit orbitTwo" />
          <div className="floatingPanel panelOne">Texte</div>
          <div className="floatingPanel panelTwo">Micro</div>
          <div className="floatingPanel panelThree">Photo</div>
        </div>

        <div className="heroCopy">
          <span className="eyebrow">Agent Daily v0.8 · Copilote métier immobilier</span>
          <h1>Un cockpit premium pour transformer chaque situation en mission prête à exécuter.</h1>
          <p>Pas un CRM. Pas un chatbot classique. Agent Daily active les bons experts, prépare le kit complet et protège les crédits jusqu’à la réussite de la mission.</p>
          <div className="trustRow"><span>store:false</span><span>Crédits signés serveur</span><span>BE · FR · LU · CH · CA · Afrique francophone</span></div>
        </div>

        <div className="missionConsole" id="brain">
          <div className="consoleHeader">
            <strong>Mission Brain</strong>
            <select value={market} onChange={(event) => setMarket(event.target.value as MarketCode)} aria-label="Marché">
              {marketCodes.map((code) => <option key={code} value={code}>{code} · {markets[code].name}</option>)}
            </select>
          </div>
          <div className="inputModes" role="tablist" aria-label="Mode de mission">
            {(["texte", "micro", "photo"] as InputMode[]).map((item) => <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item === "texte" ? "✍️ Texte" : item === "micro" ? "🎙️ Micro" : "📸 Photo"}</button>)}
          </div>
          <textarea value={situation} onChange={(event) => setSituation(event.target.value)} placeholder="Décrivez la situation : vendeur, acheteur, offre, photo, règle locale, document…" />
          <button className="launchButton" onClick={() => launchMission()} disabled={!situation.trim()}>Générer le kit mission <span>→</span></button>
          <div className="promptChips">
            {missionPrompts.map((prompt) => <button key={prompt} onClick={() => launchMission(prompt)}>{prompt}</button>)}
          </div>
        </div>
      </section>

      <section className="dailyActionsSection" aria-label="Actions quotidiennes Agent Daily">
        <div><span className="eyebrow">Actions du jour</span><h2>Raccourcis métier sans friction.</h2></div>
        <div className="dailyActionsGrid">
          {dailyActions.map((action) => <button key={action.id} onClick={() => launchMission(action.prompt)}><span>{action.icon}</span><strong>{action.title}</strong><small>{action.description}</small></button>)}
        </div>
      </section>

      <section className="expertsDeck">
        <div className="sectionTitle"><span className="eyebrow">Activation automatique</span><h2>1 à 3 experts spécialisés par situation.</h2><p>Agent Daily route la mission selon le contexte et ajoute un niveau de prudence réglementaire par marché.</p></div>
        <div className="expertCards">
          {kit.experts.map((expert) => <article key={expert.id}><span>{expert.icon}</span><h3>{expert.name.replace("Agent", "Expert")}</h3><p>{expert.scope}</p><small>{expert.trust === "official" ? "Sources officielles requises" : expert.trust === "mixed" ? "Métier + vérifications" : "Méthode métier"}</small></article>)}
        </div>
      </section>

      <section id="kit" className="kitSection">
        <div className="kitHeader"><span className="eyebrow">Kit mission complet</span><h2>{missionReady ? workflow.title : "Prêt dès que la mission est lancée"}</h2><p>{kit.diagnostic}</p></div>
        <div className="kitGrid">
          <article><small>Diagnostic</small><p>{kit.diagnostic}</p></article>
          <article><small>Objectif</small><p>{kit.objective}</p></article>
          <article><small>Plan</small><ul>{kit.plan.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><small>Email</small><p>{kit.email}</p></article>
          <article><small>SMS / WhatsApp</small><p>{kit.sms}</p></article>
          <article><small>Script d’appel</small><ul>{kit.callScript.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><small>Checklist</small><ul>{kit.checklist.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><small>Documents</small><ul>{kit.documents.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article><small>Prochaine action</small><p>{kit.nextAction}</p></article>
          <article className="growthPack"><small>Growth Pack marketing</small><ul>{kit.growthPack.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>
      </section>

      <section className="opsSection">
        <article><span>⚙️</span><h3>Moteur IA</h3><p>{kit.engine === "quality" ? "Moteur qualité activé pour photo, négociation ou réglementation." : "Moteur économique activé pour une tâche simple."}</p></article>
        <article><span>🪙</span><h3>Jetons & coût</h3><p>{kit.usage.totalTokens} jetons estimés · coût API ~{kit.usage.estimatedCost.toFixed(4)} €.</p></article>
        <article><span>🔐</span><h3>Données</h3><p>{kit.dataPolicy}</p></article>
        <article><span>🌍</span><h3>Marché</h3><p>{kit.marketProfile.name} · {kit.caution}</p></article>
      </section>
    </main>
  );
}
