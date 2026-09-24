"use client";
import { useEffect, useState } from "react";
import Sections from "./sections";
import Account from "./account";
import { product } from "@/lib/product";
import { ArrowRight, ChevronDown, ChevronRight, Cpu, Gauge, HardDrive, Zap, ShieldCheck, RotateCcw, Gamepad2, Monitor, Sun, Moon, Menu, X, Check, Play, MemoryStick, Laptop, SlidersHorizontal, Layers, ArrowUpRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DarkVeil from "@/components/DarkVeil";
import GradualBlur from "@/components/GradualBlur";
import { useLenis, scrollToTarget } from "@/components/SmoothScroll";
import { useTheme } from "@/lib/theme";
function Brand(){return <a href="#top" className="brand" aria-label="Velyro Optimizer home"><img src="/assets/syntra-logo.png" width="32" height="32" alt=""/><span>Velyro<span className="brand-sub"> Optimizer</span></span></a>}
function Tag({children}:{children:React.ReactNode}){return <span className="eyebrow">{children}<ChevronRight size={14}/></span>}
function AppPreview(){
 const [phase,setPhase]=useState('idle');const [progress,setProgress]=useState(0);const [mode,setMode]=useState('Balanced');
 useEffect(()=>{if(phase!=='scanning')return;const t=setInterval(()=>setProgress(p=>Math.min(100,p+5)),85);return()=>clearInterval(t)},[phase]);
 useEffect(()=>{if(progress===100)setPhase('complete')},[progress]);
 return <div className="app-window" id="demo"><aside className="app-sidebar"><div className="window-dots"><i/><i/><i/><span><Layers size={14}/></span></div><div className="app-brand"><img src="/assets/syntra-logo.png" alt=""/>Velyro Optimizer<ChevronDown size={12}/></div><small>WORKSPACE</small>{[[Gauge,'Overview'],[Zap,'Optimization'],[Gamepad2,'Game mode'],[HardDrive,'Cleanup'],[RotateCcw,'Restore points']].map(([Icon,label],i)=>{const I=Icon as typeof Gauge;return <div key={String(label)} className={'side-item '+(!i?'selected':'')}><I/>{String(label)}</div>})}<small>YOUR DEVICE</small><div className="device-label"><Monitor/><span>My Windows PC<small>Windows 11 · 64-bit</small></span></div><div className="sidebar-bottom"><ShieldCheck/> You're in control</div></aside><div className="app-main"><div className="app-toolbar"><span><ChevronRight size={14}/> Workspace <span>/</span> Overview</span><span className="demo-badge">Interactive demo</span></div><div className="app-content"><div className="app-heading"><div><span className="muted">A little care. A lot more performance.</span><h3>Your PC, at its best.</h3></div><span className="system-state"><span/>System online</span></div><div className="scan-card"><div className="scan-emblem"><img src="/assets/syntra-logo.png" alt=""/></div><div className="scan-copy"><h4>{phase==='complete'?'Your scan is complete.':phase==='scanning'?'Getting to know your PC…':'Let’s make room for more.'}</h4><p>{phase==='complete'?'3 areas to review. Your next step is up to you.':'Find what’s slowing you down. Take back control.'}</p></div><button className="button primary compact" disabled={phase==='scanning'} onClick={()=>{setProgress(0);setPhase('scanning')}}>{phase==='scanning'?`Scanning ${progress}%`:phase==='complete'?'Scan again':'Run a scan'}<Zap size={15}/></button>{phase==='scanning'&&<div className="scan-progress" style={{width:`${progress}%`}}/>}</div><div className="metrics">{[{icon:Cpu,name:'CPU usage',value:'24',unit:'%'},{icon:MemoryStick,name:'Memory usage',value:'6.4',unit:' GB'},{icon:HardDrive,name:'Storage available',value:'248',unit:' GB'}].map((m,k)=><div className="metric" key={m.name}><span><m.icon size={15}/>{m.name}</span><strong>{m.value}<small>{m.unit}</small></strong><div className="sparkline" aria-hidden="true">{[15,35,24,45,28,50,25,65,40,25,35,20].map((h,i)=><i key={i} style={{height:`${h+k*4}%`}}/>)}</div></div>)}</div><div className="app-bottom"><div><h4>Performance profile</h4><p>Make your PC work the way you do.</p><Tabs value={mode} onValueChange={setMode}><TabsList className="profile-tabs">{['Balanced','Gaming','Focus'].map((m,i)=><TabsTrigger key={m} value={m}>{i===0?<SlidersHorizontal size={14}/>:i===1?<Gamepad2 size={14}/>:<Laptop size={14}/>} {m}</TabsTrigger>)}</TabsList></Tabs><span className="profile-caption">{mode==='Gaming'?'Prioritize the game. Keep background activity in check.':mode==='Focus'?'Fewer distractions. More resources for your work.':'A comfortable balance for everyday use.'}</span></div><div className="quick-check"><h4>{phase==='complete'?'Scan results':'Your next steps'}</h4>{['Review startup apps','Clear temporary files','Choose your profile'].map((s,i)=><div key={s}><span><span className="check-icon">{phase==='complete'?<Check size={12}/>:i+1}</span>{s}</span><ChevronRight size={13}/></div>)}</div></div><div className="demo-note">Demo data · This preview does not scan or modify your computer.</div></div></div></div>
}
import { getAvatarUrl } from '@/lib/avatar';
import { getSupabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Home(){
 const [light,setLight]=useTheme();const [menu,setMenu]=useState(false);const [download,setDownload]=useState(false);const [account,setAccount]=useState(false);const [scrolled,setScrolled]=useState(false);
 const lenis=useLenis();
 const [user,setUser]=useState<User|null>(null);const [plan,setPlan]=useState<'Free'|'Premium'>('Free');

 useEffect(()=>{
   const sb=getSupabase();
   if(!sb)return;
   async function updatePlan(u: User | null) {
     if (!u) {
       setPlan('Free');
       return;
     }
     try {
       const { data: lData, error } = await sb!
         .from('licenses')
         .select('plan')
         .eq('user_id', u.id)
         .maybeSingle();
       if (!error && lData?.plan === 'premium') {
         setPlan('Premium');
         return;
       }
       if (u.app_metadata?.plan === 'premium') {
         setPlan('Premium');
         return;
       }
       setPlan('Free');
     } catch {
       setPlan('Free');
     }
   }

   sb.auth.getUser().then(({data})=>{
     setUser(data.user);
     void updatePlan(data.user);
   });
   const {data:sub}=sb.auth.onAuthStateChange((_e,s)=>{
     const u=s?.user??null;
     setUser(u);
     void updatePlan(u);
   });
   return ()=>sub.subscription.unsubscribe();
 },[]);

 useEffect(()=>{const onScroll=()=>{const y=window.scrollY;setScrolled(prev=>y>28?true:y<10?false:prev)};onScroll();window.addEventListener('scroll',onScroll,{passive:true});return()=>window.removeEventListener('scroll',onScroll)},[]);
 useEffect(()=>{const els=document.querySelectorAll<HTMLElement>('.reveal');if(!els.length)return;const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');io.unobserve(e.target)}})},{threshold:.15,rootMargin:'0px 0px -8% 0px'});els.forEach(el=>io.observe(el));return()=>io.disconnect()},[]);

 const userAvatar = getAvatarUrl(user);
 const userInitial = (user?.user_metadata?.full_name || user?.email || 'S').trim().charAt(0).toUpperCase();
 const userName = String(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account');

 return <><a className="skip-link" href="#main">Skip to content</a><div id="top" className="site-shell"><header className={scrolled?'navigation scrolled':'navigation'}><Brand/><nav aria-label="Main navigation" className={menu?'nav-links open':'nav-links'}>{[['Features','features'],['Safety','safety'],['For you','profiles'],['Pricing','pricing']].map(([label,id])=><a key={id} href={`#${id}`} onClick={()=>setMenu(false)}>{label}{['Features','For you'].includes(label)&&<ChevronDown size={12}/>}</a>)}</nav><div className="nav-actions">{user?<a href="/account" className="nav-user-chip" aria-label="Open account details"><span className="nav-user-avatar">{userAvatar?<img src={userAvatar} alt="" referrerPolicy="no-referrer"/>:userInitial}</span><span className="nav-user-name">{userName}</span><span className={`nav-plan-pill ${plan==='Premium'?'premium':'free'}`}>{plan==='Premium'?'✦ Premium':'Free'}</span></a>:<a href="/login" className="nav-demo">Sign in</a>}<a href="/download" className="button primary compact">Get Velyro<ArrowUpRight size={14}/></a><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>{menu?<X/>:<Menu/>}</button></div></header><GradualBlur position="bottom" target="page" height="5rem" strength={2.5} divCount={6} curve="ease-out" exponential opacity={1} zIndex={-70}/><main id="main"><section className="hero"><div className="hero-veil" aria-hidden="true"><DarkVeil hueShift={30} noiseIntensity={0.025} scanlineIntensity={0} speed={0.3} warpAmount={0.15} resolutionScale={0.75} lightMode={light}/></div><div className="hero-copy"><a href="#features" className="announcement">Meet your PC’s new potential <ChevronRight size={13}/></a><h1>Less friction. More performance.<br/><span>Your PC, unleashed.</span></h1><p>A cleaner system. A smoother experience. Take control of your<br className="desktop-break"/> Windows PC with Velyro Optimizer.</p><div className="hero-actions"><a href="/download" className="button primary">Get Velyro Optimizer <ArrowRight size={17}/></a><a className="button secondary" href="#demo"><Play size={14}/>See how it works</a></div><span className="hero-note"><Monitor size={13}/> Built for Windows <span>·</span> Your settings. Your choice.</span></div><AppPreview/></section><Sections onDownload={()=>{window.location.assign('/download')}} onAccount={()=>{window.location.href = user ? '/account' : '/login'}}/></main><footer><Brand/><div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:13}}><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refund">Refunds</a><a href="/cookies">Cookies</a></div><span>© {new Date().getFullYear()} Velyro Optimizer</span><a href="#top">Back to top ↑</a></footer></div><button className="theme-toggle" onClick={()=>setLight(!light)} aria-label={light?'Switch to dark theme':'Switch to light theme'}>{light?<Moon size={19}/>:<Sun size={19}/>}</button><Account open={account} onOpenChange={setAccount} onUpgrade={()=>scrollToTarget(lenis,'pricing')}/><Dialog open={download} onOpenChange={setDownload}><DialogContent className="download-dialog"><img src="/assets/syntra-logo.png" width="56" height="56" alt="Velyro logo"/><DialogTitle className="dialog-title">Download Velyro Optimizer</DialogTitle><DialogDescription>Sign in to access your official Windows installer and sync your settings.</DialogDescription><a className="button primary" href="/download" onClick={()=>setDownload(false)}>Go to download page<ArrowRight size={16}/></a><span className="muted">Windows 10 / 11 · 64-bit · Official Release v1.0.0</span></DialogContent></Dialog></>
}

