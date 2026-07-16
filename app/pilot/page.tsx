"use client";

import { useState } from "react";

export default function PilotAdmin() {
  const [secret, setSecret] = useState("");
  const [email, setEmail] = useState("");
  const [boosts, setBoosts] = useState(10);
  const [accessDays, setAccessDays] = useState(14);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function createLink() {
    setBusy(true);
    setError("");
    setLink("");
    try {
      const response = await fetch("/api/admin/pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, email, boosts, accessDays }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Clé incorrecte ou service indisponible.");
      setLink(data.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Lien indisponible.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
  }

  async function revokeLink() {
    const token = new URLSearchParams(new URL(link).hash.slice(1)).get("pilot") ?? "";
    const response = await fetch("/api/admin/pilot", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, token }),
    });
    if (response.ok) setLink("");
    else setError("La révocation a échoué.");
  }

  return (
    <main className="pilotPage">
      <section className="pilotCard">
        <span>PILOTE PRIVÉ</span>
        <h1>Créer un accès test</h1>
        <p>Le lien est personnel, utilisable une seule fois et expire après 7 jours s’il n’est pas activé.</p>
        <label>Clé administrateur<input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} /></label>
        <label>Email professionnel du testeur<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="agent@agence.be" /></label>
        <div className="pilotFields">
          <label>Boosts<input type="number" min="3" max="50" value={boosts} onChange={(event) => setBoosts(Number(event.target.value))} /></label>
          <label>Jours d’accès<input type="number" min="1" max="30" value={accessDays} onChange={(event) => setAccessDays(Number(event.target.value))} /></label>
        </div>
        <button onClick={() => void createLink()} disabled={busy || secret.length < 32 || !email.includes("@")}>{busy ? "Création…" : "Créer le lien"}</button>
        {error && <div className="activationError">{error}</div>}
        {link && <><div className="pilotResult"><input readOnly value={link} /><button onClick={() => void copyLink()}>Copier</button></div><button className="pilotRevoke" onClick={() => void revokeLink()}>Révoquer ce lien</button></>}
      </section>
    </main>
  );
}
