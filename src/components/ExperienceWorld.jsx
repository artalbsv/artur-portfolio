import React, { useCallback, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DisciplineEnvironment, ProofCanvas } from './InteractionSystems.jsx';
import { mediaItems, projects } from '../content.js';

const PROJECT_STATES = [
  {
    id: 'rodociclo',
    number: '01',
    discipline: 'Commerce / Implementation',
    title: 'Rodociclo Bikeshop',
    statement: 'An established storefront rebuilt as one responsive commerce system.',
    meta: ['May 2025 — Present', 'Tray / Twig / JavaScript'],
    href: '/work/rodociclo/',
    transition: 'rodociclo'
  },
  {
    id: 'bike',
    number: '02',
    discipline: 'Product / Responsive design',
    title: 'Bike Tech Moinhos',
    statement: 'A premium catalogue reorganized around discovery, clarity and continuity.',
    meta: ['June 2025 — Present', 'Desktop / Mobile / Commerce'],
    href: '/work/bike-tech-moinhos/',
    transition: 'bike'
  },
  {
    id: 'visual',
    number: '03',
    discipline: 'Visual / Motion / AI',
    title: 'Selected visual work',
    statement: 'A directed selection of identity, campaign, product and moving-image work.',
    meta: ['13 selected pieces', 'Identity / Image / Motion'],
    href: '#stage-visual-media'
  },
  {
    id: 'lab',
    number: '04',
    discipline: 'Creative code / Direct input',
    title: 'Interactive systems',
    statement: 'Seven live studies where code becomes material, behavior and interface.',
    meta: ['7 live systems', 'Canvas / WebGL / Type'],
    href: '/lab/',
    transition: 'lab'
  }
];

const CURATED_VISUAL_MEDIA = [
  mediaItems[0],
  mediaItems[11],
  mediaItems[1],
  mediaItems[2],
  mediaItems[12],
  mediaItems[5],
  mediaItems[4],
  mediaItems[3],
  mediaItems[6],
  mediaItems[7],
  mediaItems[8],
  mediaItems[9],
  mediaItems[10]
];

const projectItems = (project) => [
  { type: 'image', title: `${project.client} — redesigned homepage`, category: 'After / Desktop commerce', src: project.image, alt: `${project.client} homepage after the redesign`, width: project.imageSize[0], height: project.imageSize[1] },
  { type: 'image', title: `${project.client} — previous homepage`, category: 'Before / Desktop commerce', src: project.before, alt: `${project.client} homepage before the redesign`, width: project.beforeSize[0], height: project.beforeSize[1] },
  { type: 'image', title: `${project.client} — mobile interface`, category: 'Mobile commerce', src: project.mobile, alt: `${project.client} mobile e-commerce interface`, width: project.mobileSize[0], height: project.mobileSize[1] }
];

function StagePicture({ src, alt, width, height, active }) {
  return <img src={src} alt={active ? alt : ''} width={width} height={height} loading="eager" decoding="async" data-active={active || undefined} />;
}

function VisualCollection({ active, selected, setSelected, openMedia }) {
  const root = useRef(null);
  const pointer = useRef(null);
  const dragged = useRef(false);
  const wheelLocked = useRef(false);
  const count = CURATED_VISUAL_MEDIA.length;

  const move = useCallback((direction) => {
    setSelected((current) => (current + direction + count) % count);
  }, [count, setSelected]);

  const relativeSlot = (index) => {
    let offset = index - selected;
    if (offset > count / 2) offset -= count;
    if (offset < -count / 2) offset += count;
    return Math.abs(offset) <= 2 ? String(offset) : 'hidden';
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.stopPropagation();
    const captureTarget = event.target.closest?.('button');
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, captureTarget };
    dragged.current = false;
    captureTarget?.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 9) dragged.current = true;
  };

  const handlePointerUp = (event) => {
    event.stopPropagation();
    const start = pointer.current;
    pointer.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
    start.captureTarget?.releasePointerCapture?.(event.pointerId);
  };

  const handleWheel = (event) => {
    if (!active || Math.abs(event.deltaX) < 14 || Math.abs(event.deltaX) <= Math.abs(event.deltaY) || wheelLocked.current) return;
    event.preventDefault();
    wheelLocked.current = true;
    move(event.deltaX > 0 ? 1 : -1);
    window.setTimeout(() => { wheelLocked.current = false; }, 280);
  };

  const handleKey = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    event.stopPropagation();
    move(event.key === 'ArrowRight' ? 1 : -1);
  };

  return (
    <div
      className="visual-collection"
      id="stage-visual-media"
      ref={root}
      aria-hidden={!active}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { pointer.current = null; }}
      onWheel={handleWheel}
      onKeyDown={handleKey}
    >
      <div className="visual-collection__rail">
        {CURATED_VISUAL_MEDIA.map((item, index) => {
          const slot = relativeSlot(index);
          const isCurrent = index === selected;
          return (
            <button
              className="visual-collection__piece"
              key={item.src}
              type="button"
              data-slot={slot}
              data-identity={item.identity || undefined}
              data-tone={item.tone || undefined}
              disabled={!active}
              tabIndex={active && isCurrent ? 0 : -1}
              onClick={() => {
                if (dragged.current) { dragged.current = false; return; }
                openMedia(item, CURATED_VISUAL_MEDIA);
              }}
              aria-label={'Open ' + item.title}
            >
              <figure>
                <img
                  src={item.poster || item.src}
                  alt={isCurrent ? item.alt : ''}
                  width={item.width}
                  height={item.height}
                  loading={slot === 'hidden' ? 'lazy' : 'eager'}
                  decoding="async"
                />
                <figcaption>
                  <small>{item.category}</small>
                  <strong>{item.title}</strong>
                  {item.type === 'video' && <i aria-hidden="true">Play</i>}
                </figcaption>
              </figure>
            </button>
          );
        })}
      </div>
      <div className="visual-collection__controls">
        <button type="button" disabled={!active} tabIndex={active ? 0 : -1} onClick={() => move(-1)} aria-label="Previous selected visual work">←</button>
        <output aria-live="polite">{String(selected + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</output>
        <button type="button" disabled={!active} tabIndex={active ? 0 : -1} onClick={() => move(1)} aria-label="Next selected visual work">→</button>
      </div>
      <p className="visual-collection__hint">Drag / horizontal wheel / arrows</p>
    </div>
  );
}

export function ProjectStage({ openMedia }) {
  const section = useRef(null);
  const viewport = useRef(null);
  const activeRef = useRef(0);
  const motionDirection = useRef(1);
  const transitionSource = useRef('scroll');
  const pointerStart = useRef(null);
  const [active, setActive] = useState(0);
  const [visualSelected, setVisualSelected] = useState(0);
  const state = PROJECT_STATES[active];
  const selectedVisual = CURATED_VISUAL_MEDIA[visualSelected];

  const selectStage = useCallback((index, source = 'scroll') => {
    const next = Math.max(0, Math.min(PROJECT_STATES.length - 1, index));
    if (next === activeRef.current) return;
    motionDirection.current = next > activeRef.current ? 1 : -1;
    transitionSource.current = source;
    activeRef.current = next;
    setActive(next);
  }, []);

  const goTo = useCallback((index, moveScroll = true, source = 'direct') => {
    const next = Math.max(0, Math.min(PROJECT_STATES.length - 1, index));
    selectStage(next, source);
    if (!moveScroll || !section.current) return;
    const top = section.current.getBoundingClientRect().top + window.scrollY;
    const travel = Math.max(1, section.current.offsetHeight - window.innerHeight);
    const progress = (next + .5) / PROJECT_STATES.length;
    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    document.scrollingElement.scrollTop = top + travel * progress;
    window.requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = previousBehavior;
    });
  }, [selectStage]);

  useGSAP(() => {
    const trigger = ScrollTrigger.create({
      trigger: section.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: ({ progress }) => {
        const next = Math.min(PROJECT_STATES.length - 1, Math.floor(progress * PROJECT_STATES.length));
        selectStage(next, 'scroll');
      }
    });
    return () => trigger.kill();
  }, { scope: section, dependencies: [selectStage] });

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (transitionSource.current === 'keyboard') return;
    const direction = motionDirection.current;
    gsap.fromTo(
      '.world-stage__copy-inner > *',
      { x: direction * 9 },
      { x: 0, duration: .34, stagger: .018, ease: 'power3.out', overwrite: true, clearProps: 'transform' }
    );
    gsap.fromTo(
      '.world-stage__active-meta > *',
      { x: direction * 7 },
      { x: 0, duration: .28, stagger: .016, ease: 'power3.out', overwrite: true, clearProps: 'transform' }
    );
  }, { scope: viewport, dependencies: [active] });

  const inspectPrimary = (surface = 'desktop') => {
    if (active < 2) {
      const items = projectItems(projects[active]);
      openMedia(items[0], items);
      return;
    }
    if (active === 2) openMedia(selectedVisual, CURATED_VISUAL_MEDIA);
  };

  const handleKey = (event) => {
    const indexControl = event.target.closest('.world-stage__index button');
    if (event.target.closest('a, button') && !indexControl) return;
    let next = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = activeRef.current - 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = activeRef.current + 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = PROJECT_STATES.length - 1;
    if (next === null) return;
    event.preventDefault();
    const bounded = Math.max(0, Math.min(PROJECT_STATES.length - 1, next));
    goTo(bounded, true, 'keyboard');
    if (indexControl) viewport.current?.querySelectorAll('.world-stage__index button')[bounded]?.focus();
  };

  const handlePointerDown = (event) => {
    if (event.pointerType !== 'touch') return;
    pointerStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };
  const handlePointerUp = (event) => {
    if (event.pointerType !== 'touch') return;
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 54 && Math.abs(dx) > Math.abs(dy)) goTo(activeRef.current + (dx < 0 ? 1 : -1), true, 'touch');
  };

  return (
    <section className="world-stage" id="work" data-section="work" data-stage-state={state.id} ref={section} aria-labelledby="world-stage-heading">
      <div className="world-stage__viewport shell" ref={viewport} tabIndex="0" onKeyDown={handleKey} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        <header className="world-stage__header">
          <p className="chapter-mark">02 / Selected proof</p>
          <p>Scroll, select or use arrow keys</p>
          <output aria-live="polite">{state.number} / 04</output>
        </header>

        <nav className="world-stage__index" aria-label="Selected work states">
          {PROJECT_STATES.map((item, index) => <button key={item.id} type="button" data-active={active === index} aria-pressed={active === index} onClick={() => goTo(index, true, 'direct')}><span>{item.number}</span><strong>{item.title}</strong><small>{item.discipline}</small></button>)}
        </nav>

        <div className="world-stage__media" aria-label={`${state.title} visual preview`}>
          <div className="world-stage__media-layout">
            <div className="stage-plane stage-plane--browser">
              <span className="stage-plane__chrome"><i /><b>{active === 1 ? 'biketechmoinhos.com.br' : active === 2 ? 'selected-direction.artur' : 'rodociclo.com.br'}</b><i /></span>
              <button type="button" onClick={() => inspectPrimary('desktop')} disabled={active === 3} aria-label={active < 2 ? `Open ${state.title} media` : 'Open selected visual media'}>
                <StagePicture src={projects[0].image} alt="Rodociclo homepage after the redesign" width={projects[0].imageSize[0]} height={projects[0].imageSize[1]} active={active === 0} />
                <StagePicture src={projects[1].image} alt="Bike Tech Moinhos homepage after the redesign" width={projects[1].imageSize[0]} height={projects[1].imageSize[1]} active={active === 1} />
                <StagePicture src={mediaItems[0].src} alt={mediaItems[0].alt} width={mediaItems[0].width} height={mediaItems[0].height} active={active === 2} />
              </button>
            </div>

            <div className="stage-plane stage-plane--device">
              <span className="stage-plane__speaker" />
              <button type="button" onClick={() => inspectPrimary('device')} disabled={active === 3} aria-label={active < 2 ? `Open ${state.title} mobile media` : `Open ${selectedVisual.title}`}>
                <StagePicture src={projects[0].mobile} alt="Rodociclo mobile e-commerce interface" width={projects[0].mobileSize[0]} height={projects[0].mobileSize[1]} active={active === 0} />
                <StagePicture src={projects[1].mobile} alt="Bike Tech Moinhos mobile e-commerce interface" width={projects[1].mobileSize[0]} height={projects[1].mobileSize[1]} active={active === 1} />
                <StagePicture src={mediaItems[1].poster} alt="AI-generated video preview" width={mediaItems[1].width} height={mediaItems[1].height} active={active === 2} />
              </button>
              <span className="stage-plane__home" />
            </div>

            <VisualCollection active={active === 2} selected={visualSelected} setSelected={setVisualSelected} openMedia={openMedia} />

            <div className="stage-signal" aria-hidden={active !== 3}><ProofCanvas /><span><i /> Direct input</span></div>
          </div>
        </div>

        <div className="world-stage__copy">
          <div className="world-stage__copy-inner">
            <span>{state.discipline}</span>
            <h2 id="world-stage-heading">{state.title}</h2>
            <p>{state.statement}</p>
          </div>
          <div className="world-stage__active-meta">
            {state.meta.map((item) => <small key={item}>{item}</small>)}
            {active === 2 ? <button type="button" onClick={() => openMedia(selectedVisual, CURATED_VISUAL_MEDIA)}>Open selected work full ratio <span aria-hidden="true">↗</span></button> : <a href={state.href} data-page-transition={state.transition || undefined} data-transition-label={state.title}>{active === 3 ? 'Enter the Lab' : 'Open case study'} <span aria-hidden="true">↗</span></a>}
          </div>
        </div>

        <div className="world-stage__progress" aria-hidden="true"><i style={{ transform: `scaleX(${(active + 1) / PROJECT_STATES.length})` }} /></div>
        <noscript><p><a href="/work/rodociclo/">Rodociclo Bikeshop</a> · <a href="/work/bike-tech-moinhos/">Bike Tech Moinhos</a> · <a href="/lab/">Interactive Lab</a></p></noscript>
      </div>
    </section>
  );
}

const CAPABILITIES = {
  Design: {
    kicker: 'Systems that clarify decisions',
    statement: 'Visual instinct shaped by product constraints.',
    tools: ['Product Design', 'UI Design', 'E-commerce Design', 'Responsive Web Design'],
    evidence: [['Rodociclo', 'Product / Web / Visual · 2025—Now'], ['Bike Tech Moinhos', 'Product / Web / Visual · 2025—Now']],
    environment: 'Product'
  },
  Code: {
    kicker: 'Decisions carried into implementation',
    statement: 'The interface does not stop at the handoff.',
    tools: ['HTML / CSS', 'JavaScript', 'Twig / Tray', 'Python / Git'],
    evidence: [['SENAC Distrito Criativo', 'Programming · Completed 2025'], ['SENAC Tech', 'Python Certification · 2023']],
    environment: 'Implementation'
  },
  Motion: {
    kicker: 'Attention directed through time',
    statement: 'Movement explains hierarchy, state and intent.',
    tools: ['After Effects', 'CapCut', 'GSAP', 'Three.js'],
    evidence: [['Wave Marketing', 'Visual Designer · Video Editor · 2025—Now'], ['Selected media', 'Motion / editing / short-form content']],
    environment: 'Visual & Motion'
  },
  AI: {
    kicker: 'Faster exploration, critical direction',
    statement: 'AI expands the workflow; judgment still authors it.',
    tools: ['ChatGPT', 'Claude', 'OpenAI Codex', 'AI-assisted development'],
    evidence: [['AI video studies', 'Concept / generation / final editing'], ['Working language', 'PT — Native · EN — C2']],
    environment: 'AI workflows'
  }
};

export function CapabilitySystem() {
  const root = useRef(null);
  const [active, setActive] = useState('Design');
  const capability = CAPABILITIES[active];
  const keys = Object.keys(CAPABILITIES);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out', overwrite: 'auto' } });
    timeline.fromTo('.capability-system__statement > *', { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .62, stagger: .055 })
      .fromTo('.capability-system__tools li', { x: 18, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .42, stagger: .05 }, .12)
      .fromTo('.capability-system__evidence article', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .58, stagger: .07 }, .12);
  }, { scope: root, dependencies: [active] });

  const handleKey = (event) => {
    const current = keys.indexOf(active);
    let next = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + keys.length) % keys.length;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % keys.length;
    if (next === null) return;
    event.preventDefault();
    setActive(keys[next]);
    event.currentTarget.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  return (
    <section className="capability-system" id="capabilities" data-section="capabilities" data-capability={active.toLowerCase()} ref={root} aria-labelledby="capability-heading">
      <div className="shell capability-system__layout">
        <header><p className="chapter-mark">03 / Capability system</p><p>Choose a working mode. The environment carries the explanation.</p></header>
        <div className="capability-system__tabs" role="tablist" aria-label="Working capabilities" onKeyDown={handleKey}>{keys.map((key) => <button type="button" role="tab" aria-selected={active === key} tabIndex={active === key ? 0 : -1} key={key} onClick={() => setActive(key)} onFocus={() => setActive(key)}><span>{String(keys.indexOf(key) + 1).padStart(2, '0')}</span>{key}</button>)}</div>
        <div className="capability-system__environment"><DisciplineEnvironment discipline={capability.environment} /></div>
        <div className="capability-system__statement" key={`statement-${active}`}><small>{capability.kicker}</small><h2 id="capability-heading">{capability.statement}</h2></div>
        <ul className="capability-system__tools" key={`tools-${active}`}>{capability.tools.map((tool, index) => <li key={tool}><span>{String(index + 1).padStart(2, '0')}</span>{tool}</li>)}</ul>
        <div className="capability-system__evidence" key={`evidence-${active}`}>{capability.evidence.map(([title, detail]) => <article key={title}><strong>{title}</strong><p>{detail}</p></article>)}</div>
        <figure className="capability-system__portrait"><img src="/assets/images/artur-profile.webp" alt="Portrait of Artur Albuquerque" width="640" height="640" loading="lazy" /><figcaption>Artur Albuquerque / Porto Alegre</figcaption></figure>
      </div>
    </section>
  );
}

export function LabAct() {
  const studies = ['Flow Field', 'Strange Attractor', 'Reaction Diffusion', 'Shader Sculpture', 'Type Signal', 'Route Network', 'Spatial Ribbon'];
  return <section className="lab-act" id="lab" data-section="lab" aria-labelledby="lab-act-heading"><div className="shell lab-act__layout"><header><p className="chapter-mark">04 / Enter the Lab</p><h2 id="lab-act-heading">Code becomes<br /><em>behavior.</em></h2><p>Seven live systems for simulation, typography, spatial interaction and procedural image-making.</p><a href="/lab/" data-page-transition="lab" data-transition-label="Interactive Lab">Enter the full Lab <span aria-hidden="true">↗</span></a></header><a className="lab-act__instrument" href="/lab/" aria-label="Enter the interactive Lab"><ProofCanvas /><span><i /> Live input</span><b>Move / alter / inspect</b></a><ol>{studies.map((study, index) => <li key={study}><span>{String(index + 1).padStart(2, '0')}</span>{study}</li>)}</ol></div></section>;
}
