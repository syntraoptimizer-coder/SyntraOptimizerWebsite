"use client";
import Link from "next/link";
import { useState } from 'react';
import { Search, X, Download, UserRound, Wrench, CreditCard, ArrowUpRight, ArrowRight, BookOpen, Mail } from 'lucide-react';
import { categories, helpArticles } from '@/lib/help';
import { product } from '@/lib/product';
const icons = { download: Download, user: UserRound, wrench: Wrench, card: CreditCard };
export default function HelpCenter() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = helpArticles.filter(a => (category === 'all' || a.category === category) && terms.every(term => `${a.title} ${a.summary} ${a.steps.join(' ')}`.toLowerCase().includes(term)));
  const filtering = terms.length > 0 || category !== 'all';
  return <><section className="resource-hero"><span className="eyebrow"><BookOpen size={14}/> VELYRO HELP CENTER</span><h1>How can we <span>help?</span></h1><p>Get started. Find an answer. Get back to what matters.</p><div className="help-search"><Search size={21}/><input aria-label="Search help articles" placeholder="Search guides, accounts, downloads…" value={query} onChange={e => setQuery(e.target.value)} type="search"/>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={18}/></button>}</div><div className="help-shortcuts"><span>Popular:</span><Link href="/help/install-velyro">Installation</Link><Link href="/help/linked-pc">Linked PC</Link><Link href="/help/performance">Performance issues</Link></div></section>
    <div className="resource-content"><div className="resource-section-heading"><div><span className="eyebrow">FIND YOUR ANSWER</span><h2>Browse by topic</h2></div>{filtering && <button className="resource-text-button" onClick={() => {setCategory('all');setQuery('');}}>Clear filters <X size={15}/></button>}</div>
    <div className="help-categories">{categories.map(c => { const Icon = icons[c.icon]; return <button key={c.id} className="help-category" aria-pressed={category === c.id} onClick={() => setCategory(category === c.id ? 'all' : c.id)}><span className="resource-icon"><Icon size={22}/></span><h3>{c.title}</h3><p>{c.description}</p><span className="category-count">{helpArticles.filter(a => a.category === c.id).length} guides <ArrowUpRight size={17}/></span></button>;})}</div>
    <section className="help-results" aria-labelledby="guides-heading"><div className="resource-section-heading"><h2 id="guides-heading">{filtering ? 'Matching guides' : 'Guides & answers'}</h2><span role="status" aria-live="polite">{results.length} {results.length === 1 ? 'guide' : 'guides'}</span></div><div className="help-article-grid">{results.map(a => <Link key={a.slug} className="help-article-link" href={`/help/${a.slug}`}><BookOpen size={18}/><div><h3>{a.title}</h3><p>{a.summary}</p></div><ArrowRight size={18}/></Link>)}</div>{results.length === 0 && <div className="help-empty"><Search size={26}/><h3>No guides found</h3><p>Try “download”, “account” or “performance”, or browse all topics.</p><button className="button secondary" onClick={() => {setQuery('');setCategory('all');}}>Show all guides</button></div>}</section>
    <section className="help-contact"><div><span className="eyebrow">WE’RE HERE TO HELP</span><h2>Still need a hand?</h2><p>Tell us what happened, the error message and what you’ve tried.<br/>Never include passwords or verification codes.</p></div><Link className="button primary" href={`mailto:${product.supportEmail}`}><Mail size={17}/>Contact support<ArrowUpRight size={16}/></Link></section></div></>;
}
