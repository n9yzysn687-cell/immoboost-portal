import type { Metadata } from "next";
import Link from "next/link";
import { seoSituations } from "../../lib/seo-situations";
import { getSiteUrl } from "../../lib/site";
import styles from "./seo.module.css";

export const metadata: Metadata = {
  title: "Guides terrain pour agents immobiliers",
  description: "Des réponses opérationnelles aux situations quotidiennes des agents immobiliers : vendeurs, acquéreurs, mandats, relances et négociation.",
  alternates: { canonical: "/situations" },
  openGraph: {
    title: "Situations terrain · ImmoBoost",
    description: "Une décision, une action et un suivi pour chaque situation immobilière.",
    url: "/situations",
    locale: "fr_BE",
    type: "website",
  },
};

export default function SituationsPage() {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Guides terrain pour agents immobiliers",
    url: `${siteUrl}/situations`,
    inLanguage: "fr-BE",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: seoSituations.map((situation, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: situation.title,
        url: `${siteUrl}/situations/${situation.slug}`,
      })),
    },
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/"><span className={styles.mark} />ImmoBoost</Link>
          <nav className={styles.nav}><Link href="/methode">Notre méthode</Link><Link className={styles.primary} href="/#nouvelle-situation">Traiter ma situation</Link></nav>
        </header>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Belgique francophone · Guides terrain</span>
          <h1>Une situation.<br/>La prochaine action.</h1>
          <p>Pas de théorie générale. Chaque guide part d’un problème vécu par un agent et livre une décision, un message et un suivi.</p>
          <div className={styles.facts}><span>10 situations prioritaires</span><span>Sources officielles lorsque nécessaire</span><span>Mise à jour · 17 juillet 2026</span></div>
        </section>
        <section className={styles.grid} aria-label="Situations immobilières">
          {seoSituations.map((situation) => (
            <Link className={styles.card} href={`/situations/${situation.slug}`} key={situation.slug}>
              <small>{situation.category} · {situation.fieldId}</small>
              <h2>{situation.title}</h2>
              <p>{situation.description}</p>
              <b>Voir l’action recommandée →</b>
            </Link>
          ))}
        </section>
        <footer className={styles.footer}><span>ImmoBoost · Copilote opérationnel immobilier</span><nav><Link href="/methode">Méthode et sources</Link><Link href="/">Cockpit</Link></nav></footer>
      </div>
    </main>
  );
}
