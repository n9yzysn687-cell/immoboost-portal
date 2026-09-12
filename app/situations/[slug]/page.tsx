import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { editorialDate, getSiteUrl } from "../../../lib/site";
import { getSeoSituation, seoSituations } from "../../../lib/seo-situations";
import styles from "../seo.module.css";

export function generateStaticParams() {
  return seoSituations.map((situation) => ({ slug: situation.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const situation = getSeoSituation(slug);
  if (!situation) return {};
  return {
    title: situation.searchTitle,
    description: situation.description,
    alternates: { canonical: `/situations/${situation.slug}` },
    openGraph: { title: situation.searchTitle, description: situation.description, url: `/situations/${situation.slug}`, locale: "fr_BE", type: "article" },
  };
}

export default async function SituationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const situation = getSeoSituation(slug);
  if (!situation) notFound();
  const siteUrl = getSiteUrl();
  const related = seoSituations.filter((entry) => entry.slug !== situation.slug).slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: situation.searchTitle,
        description: situation.description,
        datePublished: editorialDate,
        dateModified: editorialDate,
        inLanguage: "fr-BE",
        mainEntityOfPage: `${siteUrl}/situations/${situation.slug}`,
        author: { "@type": "Organization", name: "ImmoBoost", url: siteUrl },
        publisher: { "@type": "Organization", name: "ImmoBoost", url: siteUrl },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ImmoBoost", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Situations", item: `${siteUrl}/situations` },
          { "@type": "ListItem", position: 3, name: situation.title, item: `${siteUrl}/situations/${situation.slug}` },
        ],
      },
    ],
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/"><span className={styles.mark} />ImmoBoost</Link>
          <nav className={styles.nav}><Link href="/situations">Tous les guides</Link><Link className={styles.primary} href="/#nouvelle-situation">Traiter mon cas</Link></nav>
        </header>
        <nav className={styles.breadcrumb} aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span>›</span><Link href="/situations">Situations</Link><span>›</span><span>{situation.category}</span></nav>
        <article>
          <header className={styles.articleHero}>
            <span className={styles.eyebrow}>{situation.category} · Situation {situation.fieldId}</span>
            <h1>{situation.title}</h1>
            <p className={styles.answer}>{situation.question}</p>
            <div className={styles.articleMeta}><span>Actionnable en moins de 5 minutes</span><span>Belgique francophone</span><span>Vérifié le 17 juillet 2026</span></div>
          </header>
          <div className={styles.content}>
            <div className={styles.article}>
              <section className={styles.block}><small>Diagnostic</small><h2>Ce que la situation signifie</h2><p>{situation.diagnosis}</p></section>
              <section className={`${styles.block} ${styles.blockAccent}`}><small>Action recommandée</small><h2>{situation.recommendation}</h2><p><strong>À faire maintenant :</strong> {situation.immediateAction}</p></section>
              <section className={styles.block}><small>Plan d’exécution</small><h2>Comment le faire</h2><ol className={styles.steps}>{situation.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>
              <section className={styles.block}><small>Message prêt à adapter</small><h2>Le texte à envoyer</h2><div className={styles.message}>{situation.message}</div></section>
              <section className={styles.block}><small>À éviter</small><h2>Les erreurs qui bloquent la suite</h2><ul className={styles.mistakes}>{situation.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></section>
            </div>
            <aside className={styles.aside}>
              <section className={`${styles.asideCard} ${styles.cta}`}><small>Votre situation est différente ?</small><strong>ImmoBoost prépare la prochaine action.</strong><p>Ajoutez le contexte réel du dossier et obtenez le message, le plan et le suivi.</p><Link href="/#nouvelle-situation">Ouvrir le cockpit <span>→</span></Link></section>
              <section className={styles.asideCard}><small>Prochaine étape</small><strong>{situation.followUp.when}</strong><p>{situation.followUp.objective}</p></section>
              <section className={styles.asideCard}><small>Méthode</small><strong>Banque terrain {situation.fieldId}</strong><p>Contenu opérationnel. Les points réglementaires doivent toujours être vérifiés pour la région et le dossier concernés.</p>{situation.source ? <a className={styles.source} href={situation.source.url} target="_blank" rel="noreferrer"><b>{situation.source.title}</b><br/>{situation.source.authority} · vérifié le {situation.source.checkedAt}</a> : null}</section>
            </aside>
          </div>
        </article>
        <section className={styles.related}><h2>Autres situations terrain</h2><div className={styles.relatedGrid}>{related.map((entry) => <Link href={`/situations/${entry.slug}`} key={entry.slug}>{entry.title}<span>Voir la prochaine action →</span></Link>)}</div></section>
        <footer className={styles.footer}><span>ImmoBoost · Copilote opérationnel immobilier</span><nav><Link href="/methode">Méthode et sources</Link><Link href="/situations">Tous les guides</Link></nav></footer>
      </div>
    </main>
  );
}
