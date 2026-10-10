"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v));

export default function Home(){
 const [loaded,setLoaded]=useState(false),[progress,setProgress]=useState(0),[paused,setPaused]=useState(false);
 const [email,setEmail]=useState("");
 const [formState,setFormState]=useState<"idle"|"sending"|"success"|"error">("idle"),[error,setError]=useState("");
 const film=useRef<HTMLVideoElement>(null),reveal=useRef<HTMLVideoElement>(null),story=useRef<HTMLElement>(null),header=useRef<HTMLElement>(null),gallery=useRef<HTMLDivElement>(null);
 const inFlight=useRef(false),pausedRef=useRef(false);

 useEffect(()=>{
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-ready");
  const start=performance.now();let raf:number;
  const tick=(now:number)=>{const p=clamp((now-start)/(reduced?160:2150));setProgress(Math.floor(p*100));if(p<1)raf=requestAnimationFrame(tick);else setLoaded(true);};
  raf=requestAnimationFrame(tick);
  const hardLimit=setTimeout(()=>{setLoaded(true);setProgress(100);},2500);
  if(!reduced)reveal.current?.play().catch(()=>{});
  return()=>{cancelAnimationFrame(raf);clearTimeout(hardLimit);};
 },[]);

 useEffect(()=>{
  if(!loaded)return;
  const section=story.current,video=film.current;if(!section||!video)return;
  const reduceQuery=matchMedia("(prefers-reduced-motion: reduce)"),mobileQuery=matchMedia("(max-width: 767px), (pointer: coarse)");
  let frame=0,desired=0,visible=true,lastSeeking=false;
  const play=()=>{if(!pausedRef.current&&!reduceQuery.matches&&visible)video.play().catch(()=>{});};
  const update=()=>{
   frame=0;const rect=section.getBoundingClientRect(),p=clamp(-rect.top/Math.max(1,section.offsetHeight-innerHeight)),simple=reduceQuery.matches||innerWidth<768;
   section.style.setProperty("--hero-opacity",String(simple?1:clamp(1-p*5)));
   section.style.setProperty("--hero-y",`${simple?0:-p*90}px`);
   section.style.setProperty("--story-shade",String(simple?0:clamp((p-.12)*2.2,0,.7)));
   section.querySelectorAll<HTMLElement>(".fragment").forEach((node,i)=>{const rp=simple?1:clamp((p-.21-i*.13)*6);node.style.opacity=String(rp);node.style.transform=`translateY(${(1-rp)*38}px)`;node.style.filter=`blur(${(1-rp)*5}px)`;});
   const place=document.getElementById("el-lugar"),footer=document.getElementById("cierre");
   header.current?.classList.toggle("on-paper",(place?.getBoundingClientRect().top??Infinity)<(header.current?.offsetHeight??90)+16&&(footer?.getBoundingClientRect().top??Infinity)>(header.current?.offsetHeight??90)+16);
   if(reduceQuery.matches||pausedRef.current||!visible){video.pause();return;}
   if(mobileQuery.matches){if(video.paused)play();return;}
   if(p<.008){lastSeeking=false;if(video.paused)play();}
   else{video.pause();lastSeeking=true;if(Number.isFinite(video.duration))desired=p*Math.max(0,video.duration-.15);if(!video.seeking&&Math.abs(video.currentTime-desired)>.07)video.currentTime=desired;}
  };
  const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const onSeeked=()=>{if(lastSeeking&&!video.seeking&&!pausedRef.current&&Math.abs(video.currentTime-desired)>.1)video.currentTime=desired;};
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;onScroll();},{threshold:0});io.observe(section);
  const onVisibility=()=>{if(document.hidden)video.pause();else onScroll();};
  addEventListener("scroll",onScroll,{passive:true});addEventListener("resize",onScroll);reduceQuery.addEventListener("change",onScroll);mobileQuery.addEventListener("change",onScroll);document.addEventListener("visibilitychange",onVisibility);video.addEventListener("seeked",onSeeked);video.addEventListener("loadedmetadata",onScroll);update();
  const reveals=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");reveals.unobserve(entry.target);} }),{threshold:.08});document.querySelectorAll(".reveal-in").forEach(el=>reveals.observe(el));
  return()=>{cancelAnimationFrame(frame);io.disconnect();reveals.disconnect();removeEventListener("scroll",onScroll);removeEventListener("resize",onScroll);reduceQuery.removeEventListener("change",onScroll);mobileQuery.removeEventListener("change",onScroll);document.removeEventListener("visibilitychange",onVisibility);video.removeEventListener("seeked",onSeeked);video.removeEventListener("loadedmetadata",onScroll);};
 },[loaded]);

 useEffect(()=>{
  if(!loaded)return;let dispose:(()=>void)|undefined,gone=false;
  const media=matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)");
  const setup=async()=>{dispose?.();dispose=undefined;if(media.matches)return;const {default:Lenis}=await import("lenis");if(gone||media.matches)return;const lenis=new Lenis({duration:1.05,smoothWheel:true,anchors:true,autoRaf:true});dispose=()=>lenis.destroy();};
  setup().catch(()=>{});media.addEventListener("change",setup);return()=>{gone=true;dispose?.();media.removeEventListener("change",setup);};
 },[loaded]);

 const subscribe=useCallback(async(address:string,company="")=>{
  if(inFlight.current)return{status:"busy"};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)||address.length>254)throw new Error("Escribe un correo electrónico válido.");
  inFlight.current=true;setFormState("sending");setError("");
  try{const response=await fetch("/api/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:address,company,consent:true}),signal:AbortSignal.timeout(15000)});const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error||"No pudimos guardar tu correo. Inténtalo de nuevo.");setEmail(address);setFormState("success");return{status:"subscribed",message:"Listo. Te avisaremos antes que a nadie."};}
  catch(e){const message=e instanceof Error&&e.name!=="TimeoutError"?e.message:"La conexión tardó más de lo esperado. Inténtalo de nuevo.";setError(message);setFormState("error");throw new Error(message);}
  finally{inFlight.current=false;}
 },[]);
 useEffect(()=>{
  const context=(document as unknown as {modelContext?:{registerTool:(tool:unknown,options:unknown)=>void}}).modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try{context.registerTool({name:"subscribe_opening_updates",title:"Recibir noticias de apertura",description:"Subscribe an email address to Contemplación opening updates, only with the visitor's explicit consent.",inputSchema:{type:"object",properties:{email:{type:"string",format:"email"},consent:{type:"boolean",const:true}},required:["email","consent"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input:unknown)=>{const data=input as {email?:unknown,consent?:unknown};if(typeof data?.email!=="string"||data.consent!==true)throw new Error("Se requiere correo y consentimiento.");const result=await subscribe(data.email.trim());document.getElementById("la-espera")?.scrollIntoView();return result;}},{signal:lifecycle.signal});}catch{}
  return()=>lifecycle.abort();
 },[subscribe]);
 const toggleMotion=()=>{pausedRef.current=!pausedRef.current;setPaused(pausedRef.current);if(pausedRef.current)film.current?.pause();else dispatchEvent(new Event("scroll"));};

 return(<>
  <a className="skip-link" href="#la-espera">Ir al formulario de apertura</a>
  <div className={`preloader ${loaded?"is-done":""}`} aria-hidden="true"><div className="preloader-top">UN MOMENTO PARA DETENERSE</div><video ref={reveal} className="preloader-film" muted playsInline preload="auto" poster="/media/shell.png"><source src="/media/logo-reveal.mp4" type="video/mp4"/></video><div className="preloader-count">{String(progress).padStart(2,"0")}<span>/ 100</span></div><div className="preloader-bottom"><span>CONTEMPLACIÓN</span><Progress value={progress} className="loader-track"/><span>CARGANDO</span></div></div>
  <header ref={header} className="site-header"><a className="nav-brand" href="#inicio" aria-label="Contemplación, inicio"><img className="nav-shell" src="/media/shell.png" alt=""/><img className="nav-wordmark" src="/media/wordmark.svg" alt="Contemplación"/></a><nav aria-label="Navegación principal"><a className="nav-place" href="#el-lugar">El lugar</a><a className="nav-notify" href="#la-espera">Quiero saber más</a></nav></header>
  <main>
   <section id="inicio" ref={story} className={`story ${loaded?"has-arrived":""}`} aria-label="Un retiro entre montaña y selva"><div className="story-pin"><video ref={film} className="hero-film" muted playsInline loop preload="metadata" poster="/media/hero-poster.jpg" aria-hidden="true"><source src="/media/place-film.mp4" type="video/mp4"/></video><div className="film-veil"/><div className="story-shade"/><div className="hero-content"><img className="hero-seal" src="/media/shell.png" alt=""/><p className="eyebrow">UN LUGAR EN CONSTRUCCIÓN</p><h1><span className="sr-only">Contemplación</span><img src="/media/wordmark.svg" alt=""/></h1><p className="hero-subtitle">Un retiro entre montaña y selva,<br className="mobile-break"/> naciendo despacio.</p><a href="#la-espera" className="hero-mobile-cta">Avísame cuando abran</a></div><div className="assembly" aria-label="Hay lugares que no se construyen rápido. Se construyen en silencio."><p aria-hidden="true"><span className="fragment">Hay lugares</span><span className="fragment">que no se construyen rápido.</span><span className="fragment">Se construyen</span><span className="fragment quiet">en silencio.</span></p></div><div className="hero-bottom"><div className="hero-note"><span className="tiny-index">01 — EL COMIENZO</span><span>La naturaleza lleva su propio tiempo.</span></div><a href="#el-lugar" className="explore"><span>EXPLORAR</span><i aria-hidden="true"/></a><button className="motion-control" onClick={toggleMotion} aria-label={paused?"Reanudar el video y su movimiento":"Pausar el video y su movimiento"}><span className={paused?"play-symbol":"pause-symbol"} aria-hidden="true"/>{paused?"Reanudar":"Pausar"}</button></div></div></section>
   <section className="mobile-assembly" aria-label="Nuestra forma de construir"><p>Hay lugares que no se construyen rápido.<br/>Se construyen <em>en silencio.</em></p></section>
   <section id="el-lugar" className="place-section"><div className="place-intro reveal-in"><div className="section-label"><span>01 /</span> EL LUGAR</div><div><h2>Entre niebla,<br/>madera y <em>luz.</em></h2><p>Entre niebla, madera y luz de atardecer, estamos preparando un espacio para detenerse.</p></div><span className="margin-note">HECHO A MANO.<br/>A SU TIEMPO.</span></div><div ref={gallery} className="place-gallery" aria-label="Imágenes del lugar">
    <figure className="place-image image-mountain reveal-in"><div className="photo-wrap"><img src="/media/mountain.jpg" alt="Montañas y vegetación tropical vistas desde el terreno de Contemplación" loading="lazy" width="720" height="1280"/></div><figcaption><span>01 — LA MONTAÑA</span><span>El horizonte, sin prisa.</span></figcaption></figure>
    <figure className="place-image image-light reveal-in"><div className="photo-wrap"><img src="/media/light.jpg" alt="Luz dorada entrando entre las plantas y una hamaca del lugar" loading="lazy" width="720" height="1280"/></div><figcaption><span>02 — LA LUZ</span><span>Una pausa que se siente.</span></figcaption></figure>
    <figure className="place-image image-garden reveal-in"><div className="photo-wrap"><img src="/media/garden.jpg" alt="Árboles, plantas y jardines en crecimiento en el terreno" loading="lazy" width="720" height="1280"/></div><figcaption><span>03 — LO QUE CRECE</span><span>Todo empieza por la tierra.</span></figcaption></figure>
   </div><div className="gallery-mobile-controls"><button onClick={()=>gallery.current?.scrollBy({left:-innerWidth*.82,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})} aria-label="Ver imagen anterior">Anterior</button><span>UN RECORRIDO POR EL LUGAR</span><button onClick={()=>gallery.current?.scrollBy({left:innerWidth*.82,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})} aria-label="Ver siguiente imagen">Siguiente</button></div><div className="place-ending reveal-in"><span className="fine-line"/><p>Un lugar para volver<br/><em>a lo esencial.</em></p><img src="/media/shell.png" alt="" loading="lazy"/></div></section>
   <section id="la-espera" className="waiting-section"><div className="section-label"><span>02 /</span> LA ESPERA</div><img className="waiting-wordmark reveal-in" src="/media/wordmark.svg" alt="Contemplación" loading="lazy"/><div className="waiting-content reveal-in"><p className="eyebrow">CADA COSA, A SU TIEMPO</p><h2>Todavía no abrimos.</h2><p className="waiting-copy">Estamos construyendo Contemplación con la misma calma que queremos ofrecerte. Déjanos tu correo y sé de los primeros en saber cuándo abrimos las puertas.</p><form className="notify-form" onSubmit={async e=>{e.preventDefault();const data=new FormData(e.currentTarget);try{await subscribe(email.trim(),String(data.get("company")||""));}catch{}}}><div className="honeypot" aria-hidden="true"><label htmlFor="company">Empresa</label><input id="company" name="company" autoComplete="off" tabIndex={-1}/></div>{formState!=="success"?<><label htmlFor="email">Tu correo electrónico</label><div className="email-row"><Input id="email" name="email" type="email" placeholder="tu@correo.com" autoComplete="email" required maxLength={254} value={email} onChange={e=>{setEmail(e.target.value);if(formState==="error"){setError("");setFormState("idle");}}} aria-describedby="email-note form-message" aria-invalid={formState==="error"}/><Button type="submit" disabled={formState==="sending"}>{formState==="sending"?"Guardando tu lugar…":"Avísame cuando abran"}</Button></div><p id="email-note" className="form-note">Al suscribirte, aceptas recibir novedades de nuestra apertura.</p></>:null}<div id="form-message" aria-live="polite" aria-atomic="true" className={`form-message ${formState==="success"?"success":""}`}>{formState==="success"?<><span className="success-mark" aria-hidden="true">✓</span><h3>Ya eres parte del comienzo.</h3><p>Listo. Te avisaremos antes que a nadie.</p></>:error}</div></form></div><span className="waiting-footnote">LA CALMA TAMBIÉN SE CONSTRUYE.</span></section>
  </main>
  <footer id="cierre" className="site-footer"><a href="#inicio" className="footer-logo" aria-label="Contemplación, volver al inicio"><img className="footer-shell" src="/media/shell.png" alt="" loading="lazy"/><img className="footer-wordmark" src="/media/wordmark.svg" alt="Contemplación" loading="lazy"/></a><p>Montaña. Selva. Quietud.</p><div className="footer-bottom"><span>Contemplación · © 2026</span><span>Un retiro que nace despacio.</span><a href="#inicio">Volver al comienzo</a></div></footer>
 </>);
}
