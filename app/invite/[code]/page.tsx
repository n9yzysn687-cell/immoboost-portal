import { getDemoAccount } from "../../../lib/demo-accounts";

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const account = getDemoAccount(code);

  return (
    <main className="agentDailyShell">
      <section className="kitSection">
        <div className="kitHeader">
          <span className="eyebrow">Invitation privée</span>
          <h2>{account.name}</h2>
          <p>Compte démo Agent Daily activé pour {account.role}. Le portefeuille est signé côté serveur et démarre avec 250 crédits.</p>
        </div>
        <div className="opsSection">
          <article><span>🪙</span><h3>Crédits</h3><p>{account.wallet.credits} crédits disponibles.</p></article>
          <article><span>🔐</span><h3>Signature</h3><p>{account.wallet.signature.slice(0, 18)}…</p></article>
          <article><span>🧾</span><h3>Code</h3><p>{account.wallet.inviteCode}</p></article>
          <article><span>✅</span><h3>Débit</h3><p>Débit uniquement après mission réussie.</p></article>
        </div>
      </section>
    </main>
  );
}
