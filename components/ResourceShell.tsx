"use client";
import Link from "next/link";
import { useState } from 'react';
import { ArrowUpRight, Menu, X, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
export default function ResourceShell({ children, current }: { children: React.ReactNode; current: 'help' | 'updates' }) {
  const [menu, setMenu] = useState(false);
  const [light, setLight] = useTheme();
  return <><Link className="skip-link" href="#main">Skip to content</Link><div className="site-shell resource-shell" id="top">
    <header className="navigation"><Link href="/" className="brand" aria-label="Velyro Optimizer home"><img src="/assets/syntra-logo.png" width="32" height="32" alt=""/><span>Velyro<span className="brand-sub"> Optimizer</span></span></Link>
      <nav id="resource-navigation" aria-label="Main navigation" className={menu ? 'nav-links open' : 'nav-links'}><Link href="/#features">Features</Link><Link href="/#pricing">Pricing</Link><Link href="/updates" aria-current={current === 'updates' ? 'page' : undefined}>Updates</Link><Link href="/help" aria-current={current === 'help' ? 'page' : undefined}>Help center</Link></nav>
      <div className="nav-actions"><Link className="nav-demo" href="/account">My account</Link><Link className="button primary compact" href="/download">Get Velyro<ArrowUpRight size={14}/></Link><button className="menu-toggle" aria-label="Toggle navigation" aria-controls="resource-navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button></div>
    </header><main id="main" className="resource-main">{children}</main><footer><Link className="brand" href="/">Velyro Optimizer</Link><div className="resource-footer-links"><Link href="/help">Help center</Link><Link href="/updates">Updates</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div><span>© {new Date().getFullYear()} Velyro Optimizer</span></footer>
  </div><button className="theme-toggle" onClick={() => setLight(!light)} aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}>{light ? <Moon size={19}/> : <Sun size={19}/>}</button></>;
}
