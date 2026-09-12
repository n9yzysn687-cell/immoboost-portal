import { getDemoAccount } from "../../../lib/demo-accounts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accès privé",
  robots: { index: false, follow: false },
};

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const account = getDemoAccount(code);

  return (
    <main className="dailyShell inviteShell">
      <section className="inviteCard">
        <a className="brand" href="/" aria-label="ImmoBoost accueil">
          <span className="brandMark"><i /><i /><i /></span>
          <strong>ImmoBoost</strong>
        </a>
        <span className="liveStatus"><i /> Accès privé activé</span>
        <h1>Bienvenue dans<br/>{account.name}.</h1>
        <p>{account.role} · votre espace de test est prêt.</p>
        <div className="inviteBalance"><strong>{account.wallet.boosts}</strong><span>Boosts disponibles</span></div>
        <div className="inviteRule"><span>1</span><p><strong>Une mission réussie</strong> utilise un Boost. Aucun débit si la mission échoue.</p></div>
        <a className="inviteButton" href="/">Ouvrir le cockpit <span>→</span></a>
      </section>
    </main>
  );
}
