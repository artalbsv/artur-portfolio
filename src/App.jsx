import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SignatureIntro from './components/SignatureIntro.jsx';
import StudioScene from './components/StudioScene.jsx';
import MediaViewer from './components/MediaViewer.jsx';
import LabSection from './components/LabSection.jsx';
import { AmbientSystem, KineticHeroTitle, PageTransitionLayer, ScrambleEmail } from './components/InteractionSystems.jsx';
import { CapabilitySystem, LabAct, ProjectStage } from './components/ExperienceWorld.jsx';
import { projects } from './content.js';

let labRuntimePromise;
const loadLabRuntime = () => {
  if (!labRuntimePromise) labRuntimePromise = import('../lab.js?working-proof');
  return labRuntimePromise;
};

const projectMedia = projects.flatMap((project) => [
  { type: 'image', title: `${project.client} — redesigned homepage`, category: 'After / Desktop commerce', src: project.image, alt: `${project.client} homepage after the redesign`, width: project.imageSize[0], height: project.imageSize[1] },
  { type: 'image', title: `${project.client} — previous homepage`, category: 'Before / Desktop commerce', src: project.before, alt: `${project.client} homepage before the redesign`, width: project.beforeSize[0], height: project.beforeSize[1] },
  { type: 'image', title: `${project.client} — mobile interface`, category: 'Mobile commerce', src: project.mobile, alt: `${project.client} mobile e-commerce interface`, width: project.mobileSize[0], height: project.mobileSize[1] }
]);

function ThemeButton({ theme, setTheme }) {
  return <button className="theme-button" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} aria-pressed={theme === 'light'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><span aria-hidden="true" /><b>{theme === 'dark' ? 'Dark' : 'Light'}</b></button>;
}

function Navigation({ theme, setTheme }) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState('');
  const [active, setActive] = useState('top');
  useEffect(() => {
    const format = () => setTime(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()));
    format();
    const timer = setInterval(format, 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const sections = [...document.querySelectorAll('[data-section]')];
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.dataset.section); });
    }, { rootMargin: '-35% 0px -55%', threshold: 0 });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="identity" href="/#top" aria-label="Back to the top — Artur Albuquerque"><span className="identity__avatar"><img src="/assets/images/artur-profile.webp" alt="Portrait of Artur Albuquerque" width="40" height="40" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement.dataset.fallback = 'true'; }} /><i aria-hidden="true">AS</i></span><span><strong>Artur Albuquerque</strong><small>Product & Visual Designer</small></span></a>
        <p className="nav-coordinate"><span>POA</span><time dateTime={time}>{time || '--:--'}</time></p>
        <button className="menu-button" type="button" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}><span>{open ? 'Close' : 'Index'}</span><i aria-hidden="true" /></button>
        <div className="site-menu" id="site-menu" data-open={open}>
          <a href="/#work" data-active={active === 'work'} onClick={() => setOpen(false)}>Work</a>
          <a href="/#capabilities" data-active={active === 'capabilities'} onClick={() => setOpen(false)}>System</a>
          <a href="/#lab" data-active={active === 'lab'} onClick={() => setOpen(false)}>Lab</a>
          <a href="/#contact" data-active={active === 'contact'} onClick={() => setOpen(false)}>Contact</a>
          <ThemeButton theme={theme} setTheme={setTheme} />
        </div>
      </nav>
    </header>
  );
}

function ProjectStory({ project, index, projectItems, openMedia }) {
  if (index === 0) {
    return <div className="project-story project-story--comparison shell" data-project-story="comparison"><aside className="project-story__visual"><button type="button" onClick={() => openMedia(projectItems[1], projectItems)} aria-label="Open Rodociclo before and after comparison"><figure className="story-frame story-frame--before"><img src={project.before} width={project.beforeSize[0]} height={project.beforeSize[1]} loading="lazy" alt="Rodociclo homepage before the redesign" /><figcaption>01 / Before</figcaption></figure><figure className="story-frame story-frame--after"><img src={project.image} width={project.imageSize[0]} height={project.imageSize[1]} loading="lazy" alt="Rodociclo homepage after the redesign" /><figcaption>02 / After</figcaption></figure><span className="project-story__scan" aria-hidden="true" /></button><div className="project-story__progress" aria-hidden="true"><i /><span>Previous storefront</span><span>Working system</span></div></aside><div className="project-story__copy"><p className="project-case__summary">{project.summary}</p><div className="project-case__outcome"><small>Measured context</small><strong>{project.outcomeLead}</strong><p>{project.outcome}</p></div></div></div>;
  }

  return <div className="project-story project-story--catalogue shell" data-project-story="catalogue"><aside className="project-story__visual"><button className="catalogue-morph" type="button" onClick={() => openMedia(projectItems[0], projectItems)} aria-label="Open Bike Tech Moinhos responsive catalogue"><span className="catalogue-morph__desktop"><img src={project.image} width={project.imageSize[0]} height={project.imageSize[1]} loading="lazy" alt="Bike Tech Moinhos desktop catalogue" /></span><span className="catalogue-morph__mobile"><span className="catalogue-morph__mobile-frame"><img src={project.mobile} width={project.mobileSize[0]} height={project.mobileSize[1]} loading="lazy" alt="Bike Tech Moinhos mobile catalogue" /></span></span><i className="catalogue-morph__chrome" aria-hidden="true" /></button><div className="catalogue-morph__labels" aria-hidden="true"><span>Desktop / structure</span><span>Mobile / continuity</span></div></aside><div className="project-story__copy"><p className="project-case__summary">{project.summary}</p><div className="project-case__outcome"><small>Delivered system</small><strong>{project.outcomeLead}</strong><p>{project.outcome}</p></div></div></div>;
}

function BeforeAfterComparator({ project, comparison, setComparison }) {
  const viewport = useRef(null);
  const activePointer = useRef(null);

  const updateFromPointer = useCallback((event) => {
    const bounds = viewport.current?.getBoundingClientRect();
    if (!bounds) return;
    const next = Math.round(Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)) * 100);
    setComparison(next);
  }, [setComparison]);

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    activePointer.current = event.pointerId;
    updateFromPointer(event);
    viewport.current?.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (activePointer.current === event.pointerId) updateFromPointer(event);
  };

  const releasePointer = (event) => {
    if (activePointer.current === event.pointerId) activePointer.current = null;
  };

  const handleKeyDown = (event) => {
    const step = event.shiftKey ? 10 : 2;
    let next = comparison;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= step;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += step;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 100;
    else return;
    event.preventDefault();
    setComparison(Math.max(0, Math.min(100, next)));
  };

  return <div className="comparison__viewport" ref={viewport} style={{ '--comparison': `${comparison}%` }} role="slider" tabIndex="0" aria-label={`Drag across the image to compare ${project.client} before and after`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={comparison} aria-valuetext={`${comparison}% after redesign`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={releasePointer} onPointerCancel={releasePointer} onKeyDown={handleKeyDown}>
    <img src={project.image} alt={`${project.client} homepage after the redesign`} width={project.imageSize[0]} height={project.imageSize[1]} loading="lazy" />
    <div className="comparison__before"><img src={project.before} alt={`${project.client} homepage before the redesign`} width={project.beforeSize[0]} height={project.beforeSize[1]} loading="lazy" /></div>
    <span className="comparison__label comparison__label--before" aria-hidden="true">Before</span>
    <span className="comparison__label comparison__label--after" aria-hidden="true">After</span>
    <span className="comparison__divider" aria-hidden="true"><i /></span>
  </div>;
}

function ProjectCase({ project, index, openMedia, standalone = false }) {
  const [comparison, setComparison] = useState(50);
  const [open, setOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const projectItems = projectMedia.slice(index * 3, index * 3 + 3);
  return (
    <article className={`project-case project-case--${index % 2 ? 'reverse' : 'forward'}`} id={`project-${project.slug}`} data-project-case data-standalone={standalone || undefined}>
      <div className="project-case__mast shell">
        <p className="chapter-mark">{project.number} / Selected work</p>
        <div className="project-case__title"><span>{project.descriptor}</span><h3 aria-label={project.client}>{index === 0 ? <><b>Rodociclo</b><b>Bikeshop</b></> : <><b>Bike Tech</b><em>Moinhos</em></>}</h3></div>
        <div className="project-case__facts"><p>{project.role}</p><p>{project.period}</p></div>
      </div>
      <div className="project-case__media shell">
        <div className="project-browser"><span className="project-browser__bar"><i /><b>{project.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</b><i /></span><button className="project-desktop" type="button" onClick={() => openMedia(projectItems[0], projectItems)} aria-label={`Open ${project.client} redesigned homepage`}>
          <img src={project.image} alt={`${project.client} homepage after the redesign`} width={project.imageSize[0]} height={project.imageSize[1]} loading="lazy" />
          <span>Open full work ↗</span>
        </button></div>
        <div className="project-device"><span className="project-device__speaker" /><div className="project-device__perspective"><button className="project-mobile" type="button" onClick={() => openMedia(projectItems[2], projectItems)} aria-label={`Open ${project.client} mobile interface`}>
          <span className="project-mobile__screen"><img src={project.mobile} alt={`${project.client} mobile e-commerce interface`} width={project.mobileSize[0]} height={project.mobileSize[1]} loading="lazy" /></span>
        </button></div><span className="project-device__home" /></div>
        <p className="project-media-note"><span>{index === 0 ? 'Transformation / 2025' : 'Catalogue system / 2025'}</span><b>Desktop + mobile, one connected storefront.</b></p>
      </div>
      <ProjectStory project={project} index={index} projectItems={projectItems} openMedia={openMedia} />
      {standalone && <><button className="compare-toggle shell" type="button" aria-expanded={compareOpen} aria-controls={`${project.slug}-comparison`} onClick={() => setCompareOpen(!compareOpen)}><span>Before / after</span><strong>{compareOpen ? 'Close comparison' : 'Inspect the transformation'}</strong><i aria-hidden="true">{compareOpen ? '−' : '+'}</i></button>
      <div className="comparison shell" id={`${project.slug}-comparison`} data-open={compareOpen}>
        <div className="comparison__inner">
        <BeforeAfterComparator project={project} comparison={comparison} setComparison={setComparison} />
        </div>
      </div></>}
      <div className="project-case__actions shell">
        <a className="action-link" href={project.website} target="_blank" rel="noreferrer">Visit live website <span aria-hidden="true">↗</span></a>
        {standalone ? <button className="action-link" type="button" aria-expanded={open} aria-controls={`${project.slug}-details`} onClick={() => setOpen(!open)}>{open ? 'Close project notes' : 'Read project notes'} <span aria-hidden="true">{open ? '−' : '+'}</span></button> : <a className="action-link" href={`/work/${project.slug}/`} data-page-transition={index === 0 ? 'rodociclo' : 'bike'} data-transition-label={project.client}>View full case study <span aria-hidden="true">→</span></a>}
      </div>
      {standalone && <div className="case-notes" id={`${project.slug}-details`} data-open={open}><div className="shell"><ol>{project.chapters.map(([title, body], chapter) => <li key={title}><span>{String(chapter + 1).padStart(2, '0')}</span><div><h4>{title}</h4><p>{body}</p></div></li>)}</ol><div className="responsibilities"><h4>Working scope</h4><ul>{project.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul></div></div></div>}
    </article>
  );
}

function RouteFooter() {
  return <footer className="route-footer"><div className="shell"><strong>Artur Albuquerque</strong><a href="mailto:arturmethod@gmail.com">arturmethod@gmail.com ↗</a><a href="/">Home ↑</a></div></footer>;
}

function ProjectRoute({ project, index, openMedia }) {
  return <><main id="content" className="project-route"><section className="route-intro"><div className="shell"><a href="/#work" data-page-transition={index === 0 ? 'rodociclo' : 'bike'} data-transition-label="Selected work" data-transition-image={project.image}>← Selected work</a><p className="route-intro__descriptor">{project.descriptor}</p><h1>{project.client}</h1><span className="route-intro__meta">Case study / {project.period}</span></div></section><ProjectCase project={project} index={index} openMedia={openMedia} standalone /></main><RouteFooter /></>;
}

function LabRoute() {
  return <><main id="content" className="lab-route"><section className="route-intro route-intro--lab"><div className="shell"><a href="/">← Working Proof</a><p>Creative code / Live input</p><h1>Interactive Lab.</h1><span>Seven systems / On demand</span></div></section><LabSection /></main><RouteFooter /></>;
}

function NotFoundRoute() {
  return <><main id="content" className="not-found"><div className="shell"><p className="chapter-mark">404 / Off the grid</p><h1>This route is not part of the system.</h1><a className="primary-action" href="/">Return to Working Proof <span aria-hidden="true">→</span></a></div></main><RouteFooter /></>;
}

function HomePage({ openMedia }) {
  return <main id="content">
    <section className="hero" id="top" aria-labelledby="hero-heading" data-section="top">
      <div className="hero-grid shell">
        <div className="hero-copy">
          <p className="hero-kicker">Artur Albuquerque <i /> Product & Visual Designer</p>
          <KineticHeroTitle />
          <p className="hero-lead">I design commerce, motion and digital products—then carry the decisions into working implementation.</p>
          <div className="hero-actions"><a href="#work">Selected work <span aria-hidden="true">↘</span></a><a href="/lab/">Live experiments <span aria-hidden="true">↗</span></a></div>
        </div>
        <div className="hero-stage"><StudioScene /><div className="hero-stage__legend"><span>Working object / direct input</span><span>Drag 360°</span></div></div>
      </div>
      <p className="hero-foot shell"><span>Porto Alegre, Brazil</span><span>Available globally / 2026</span></p>
    </section>
    <ProjectStage openMedia={openMedia} />
    <CapabilitySystem />
    <LabAct />
    <section className="contact-section" id="contact" aria-labelledby="contact-heading" data-section="contact"><div className="contact-shards" aria-hidden="true"><i /><i /><i /><i /></div><div className="shell"><div className="contact-intro"><p className="chapter-mark">Open channel / global remote</p><p>Have a product, storefront or visual system that needs to become real?</p></div><h2 id="contact-heading"><span>Make it</span><em>matter.</em></h2><ScrambleEmail /><div className="contact-grid"><p>Porto Alegre, Brazil<br /><span>UTC−03:00</span></p><div><a href="/assets/resume/Artur_Silveira_Resume.pdf" download="Artur_Silveira_Resume.pdf">Résumé / PDF ↓</a><a href="/lab/" data-page-transition="lab" data-transition-label="Interactive Lab">Interactive Lab ↗</a></div></div><footer><strong>Artur Albuquerque</strong><span>Product & Visual Designer</span><span>Working proof / 2026</span><a href="#top">Top ↑</a></footer></div></section>
  </main>;
}

function App() {
  const root = useRef(null);
  const routePath = window.location.pathname.replace(/\/+$/, '') || '/';
  const isHome = routePath === '/';
  const isLab = routePath === '/lab';
  const projectIndex = projects.findIndex((project) => routePath === `/work/${project.slug}`);
  const [arrival, setArrival] = useState(() => {
    try {
      const stored = sessionStorage.getItem('working-proof-transition');
      sessionStorage.removeItem('working-proof-transition');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [introDone, setIntroDone] = useState(!isHome || Boolean(arrival));
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const [viewer, setViewer] = useState({ item: null, items: [] });
  const [transition, setTransition] = useState(null);

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    document.scrollingElement.scrollTop = 0;
    window.requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = previousBehavior;
    });
  }, []);

  useEffect(() => {
    const onClick = (event) => {
      const link = event.target.closest('a[data-page-transition]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      event.preventDefault();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { window.location.assign(href); return; }
      const previewImage = link.closest('.proof-index__instrument')?.querySelector('.proof-preview[data-open="true"] img');
      const projectImage = link.closest('[data-project-case]')?.querySelector('.project-desktop img');
      const source = previewImage || projectImage;
      const rect = source?.getBoundingClientRect();
      const payload = {
        kind: link.dataset.pageTransition,
        label: link.dataset.transitionLabel || link.textContent.trim(),
        image: source?.currentSrc || source?.src || link.dataset.transitionImage || null,
        rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null
      };
      try { sessionStorage.setItem('working-proof-transition', JSON.stringify({ kind: payload.kind, label: payload.label, image: payload.image })); } catch {}
      setTransition(payload);
      window.setTimeout(() => window.location.assign(href), 680);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!introDone) return;
    const lab = document.getElementById('lab');
    if (!lab) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadLabRuntime().catch(() => {});
        observer.disconnect();
      }
    }, { rootMargin: '500px 0px' });
    observer.observe(lab);
    return () => observer.disconnect();
  }, [introDone]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('artur-theme-v2', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#f2f0eb');
  }, [theme]);

  useEffect(() => {
    if (!arrival) return undefined;
    const timer = window.setTimeout(() => setArrival(null), 1050);
    return () => window.clearTimeout(timer);
  }, [arrival]);

  const openMedia = useCallback((item, items) => setViewer({ item, items }), []);
  const closeMedia = useCallback(() => setViewer({ item: null, items: [] }), []);
  const changeMedia = useCallback((direction) => setViewer((current) => {
    const index = current.items.indexOf(current.item);
    return { ...current, item: current.items[(index + direction + current.items.length) % current.items.length] };
  }), []);

  useGSAP(() => {
    if (!introDone) return;
    const media = gsap.matchMedia();
    media.add({ desktop: '(min-width: 800px)', reduce: '(prefers-reduced-motion: reduce)' }, ({ conditions }) => {
      const { desktop, reduce } = conditions;
      if (reduce) { gsap.set('[data-reveal], [data-project-case], .hero-stage, .hero h1 > *', { clearProps: 'all' }); return; }
      if (!isHome) {
        const opening = gsap.timeline({ defaults: { ease: 'power3.out' } });
        opening.from('.site-header', { y: -24, autoAlpha: 0, duration: 0.7 });
        opening.from('.route-intro .shell > *', { y: desktop ? 48 : 24, autoAlpha: 0, duration: 0.85, stagger: 0.075 }, 0.08);
      }
      if (!isHome) gsap.utils.toArray('[data-project-case]').forEach((project, index) => {
        const titleParts = project.querySelectorAll('.project-case__title h3 > *');
        if (index === 0) {
          gsap.from(titleParts, { xPercent: (part) => part ? 38 : -32, clipPath: (part) => part ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)', duration: 1.2, stagger: -.06, ease: 'power3.inOut', scrollTrigger: { trigger: project, start: 'top 76%', once: true } });
        } else {
          gsap.from(titleParts, { scaleX: index ? .62 : 1, yPercent: (part) => part ? 42 : -36, transformOrigin: 'left bottom', clipPath: 'inset(100% 0 0 0)', duration: 1.15, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: project, start: 'top 78%', once: true } });
        }
        gsap.from(project.querySelector('.project-desktop'), { clipPath: index % 2 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)', scale: 1.05, duration: 1.25, ease: 'power3.inOut', scrollTrigger: { trigger: project.querySelector('.project-case__media'), start: 'top 78%', once: true } });
      });
      if (isHome) {
        const continuityLine = document.querySelector('.ambient-system__field path:first-child');
        if (continuityLine) {
          const length = continuityLine.getTotalLength();
          gsap.set(continuityLine, { strokeDasharray: length, strokeDashoffset: length * .2 });
          gsap.to(continuityLine, { strokeDashoffset: -length * .78, ease: 'none', scrollTrigger: { trigger: '#content', start: 'top top', end: 'bottom bottom', scrub: .45 } });
        }
        gsap.fromTo('.contact-shards i', { xPercent: (index) => index % 2 ? 120 : -120, rotation: (index) => index % 2 ? 8 : -8 }, { xPercent: 0, rotation: 0, stagger: .08, ease: 'none', scrollTrigger: { trigger: '.contact-section', start: 'top bottom', end: 'top 20%', scrub: .8 } });
        gsap.from('.contact-section h2 > *', { xPercent: (index) => index ? 36 : -28, duration: 1.15, ease: 'power3.out', scrollTrigger: { trigger: '.contact-section h2', start: 'top 82%', once: true } });
      }
      if (desktop && isHome) gsap.to('.studio-scene', { yPercent: 13, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
    }, root);
    return () => media.revert();
  }, { scope: root, dependencies: [introDone, isHome] });

  let page = <NotFoundRoute />;
  if (isHome) page = <HomePage openMedia={openMedia} />;
  if (projectIndex >= 0) page = <ProjectRoute project={projects[projectIndex]} index={projectIndex} openMedia={openMedia} />;
  if (isLab) page = <LabRoute />;

  return <div ref={root}>
    {isHome && <SignatureIntro onComplete={() => setIntroDone(true)} />}
    {isHome && <AmbientSystem />}
    <Navigation theme={theme} setTheme={setTheme} />
    {page}
    <MediaViewer item={viewer.item} items={viewer.items} onClose={closeMedia} onChange={changeMedia} />
    <PageTransitionLayer transition={transition} arrival={arrival} />
  </div>;
}

export default App;
