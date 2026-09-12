import type { Metadata } from "next";
import Link from "next/link";
import styles from "../situations/seo.module.css";

export const metadata: Metadata = {
  title: "Méthode, sources et fiabilité",
  description: "Comment ImmoBoost transforme une situation immobilière en action, vérifie les informations sensibles et limite les réponses incertaines.",
  alternates: { canonical: "/methode" },
};

export default function MethodPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/"><span className={styles.mark} />ImmoBoost</Link>
          <nav className={styles.nav}><Link href="/situations">Guides terrain</Link><Link className={styles.primary} href="/#nouvelle-situation">Tester le cockpit</Link></nav>
        </header>
        <nav className={styles.breadcrumb} aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span>›</span><span>Méthode</span></nav>
        <header className={styles.articleHero}>
          <span className={styles.eyebrow}>Transparence · Qualité · Belgique</span>
          <h1>Comment ImmoBoost vérifie avant d’aider.</h1>
          <p className={styles.answer}>Le produit est en phase pilote. Il ne prétend pas remplacer le jugement de l’agent, du notaire ou de l’autorité compétente.</p>
          <div className={styles.articleMeta}><span>50 situations terrain</span><span>Sources officielles</span><span>Dernière vérification · 17 juillet 2026</span></div>
        </header>
        <div className={styles.content}>
          <div className={styles.article}>
            <section className={styles.block}><small>Pourquoi</small><h2>Une décision utile plutôt qu’une réponse longue</h2><p>Chaque situation est ramenée à cinq éléments : diagnostic, recommandation principale, action immédiate, kit prêt à utiliser et prochaine étape. Les stratégies secondaires restent en retrait pour ne pas compliquer la décision.</p></section>
            <section className={styles.block}><small>Contrôle silencieux</small><h2>Sept vérifications avant la livraison</h2><ol className={styles.steps}><li>Contexte et informations réellement fournies.</li><li>Faits et affirmations vérifiables.</li><li>Cadre régional lorsque le sujet est réglementé.</li><li>Cohérence de la stratégie proposée.</li><li>Langue et terminologie immobilière.</li><li>Ton humain adapté au destinataire.</li><li>Utilité immédiate de l’action préparée.</li></ol></section>
            <section className={styles.block}><small>Limite volontaire</small><h2>Ne pas inventer pour paraître complet</h2><p>Lorsqu’une information sensible n’est pas couverte par une source officielle validée pour la région concernée, ImmoBoost peut préparer la communication et l’organisation du suivi, mais doit signaler la limite au lieu d’inventer une règle, un montant ou un délai.</p></section>
            <section className={styles.block}><small>Création du contenu</small><h2>Humain d’abord, automatisation assistée</h2><p>Les guides partent d’une banque de situations vécues ou rapportées par des agents immobiliers. L’automatisation sert à structurer le travail. Les pages réglementaires citent leurs sources et leur date de contrôle. Elles doivent être révisées lorsque la source évolue.</p></section>
          </div>
          <aside className={styles.aside}>
            <section className={`${styles.asideCard} ${styles.cta}`}><small>Voir le résultat</small><strong>Traitez une situation réelle.</strong><p>Décrivez ce qui vient de se passer. ImmoBoost prépare l’action et son suivi.</p><Link href="/#nouvelle-situation">Ouvrir ImmoBoost <span>→</span></Link></section>
            <section className={styles.asideCard}><small>Responsable du contenu</small><strong>Équipe produit ImmoBoost</strong><p>Projet pilote destiné aux agents indépendants et petites agences de Belgique francophone.</p></section>
          </aside>
        </div>
        <footer className={styles.footer}><span>ImmoBoost · Projet pilote</span><nav><Link href="/situations">Guides terrain</Link><Link href="/">Cockpit</Link></nav></footer>
      </div>
    </main>
  );
}
