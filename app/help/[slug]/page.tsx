import Link from "next/link";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import ResourceShell from '@/components/ResourceShell';
import { categories, helpArticles } from '@/lib/help';
import { product } from '@/lib/product';
export function generateStaticParams() { return helpArticles.map(({slug}) => ({slug})); }
export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> { const {slug} = await params; const article = helpArticles.find(a => a.slug === slug); return {title: `${article?.title ?? 'Guide not found'} — Velyro Help`, description: article?.summary}; }
export default async function ArticlePage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const article = helpArticles.find(a => a.slug === slug);
  if (!article) notFound();
  return <ResourceShell current="help"><article className="help-guide"><Link className="resource-back" href="/help"><ArrowLeft size={16}/>All help topics</Link><span className="eyebrow">{categories.find(c => c.id === article.category)?.title}</span><h1>{article.title}</h1><p className="guide-summary">{article.summary}</p><ol className="guide-steps">{article.steps.map((step, i) => <li key={step}><span>{String(i+1).padStart(2,'0')}</span><p>{step}</p></li>)}</ol><Link className="button primary" href={article.link}>{article.linkLabel}<ArrowRight size={16}/></Link><aside className="guide-contact"><Mail size={20}/><div><h2>Need more help?</h2><p><Link href={`mailto:${product.supportEmail}`}>Contact Velyro support</Link> with the exact error and the steps you’ve tried.</p></div></aside><h2 className="guide-related-title">Related guides</h2>{helpArticles.filter(a => a.category === article.category && a.slug !== slug).map(a => <Link className="help-article-link" href={`/help/${a.slug}`} key={a.slug}><div><h3>{a.title}</h3><p>{a.summary}</p></div><ArrowRight size={18}/></Link>)}</article></ResourceShell>;
}
