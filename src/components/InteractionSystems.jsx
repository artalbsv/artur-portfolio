import React, { useEffect, useRef, useState } from 'react';

const canUseFinePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function KineticHeroTitle() {
  const title = useRef(null);

  useEffect(() => {
    const element = title.current;
    if (!element || !canUseFinePointer() || prefersReducedMotion()) return undefined;

    const letters = [...element.querySelectorAll('[data-elastic-letter]')];
    const proof = element.querySelector('[data-hero-depth="proof"]');
    const promise = element.querySelector('[data-hero-depth="promise"]');
    let centers = [];
    let frame = 0;

    const measure = () => {
      centers = letters.map((letter) => {
        const rect = letter.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
    };

    const reset = () => {
      cancelAnimationFrame(frame);
      letters.forEach((letter) => { letter.style.transform = ''; });
      if (proof) proof.style.transform = '';
      if (promise) promise.style.transform = '';
    };

    const onMove = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        letters.forEach((letter, index) => {
          const center = centers[index];
          if (!center) return;
          const x = center.x - event.clientX;
          const y = center.y - event.clientY;
          const distance = Math.max(1, Math.hypot(x, y));
          const force = Math.max(0, 1 - distance / 240);
          const dx = (x / distance) * force * 18;
          const dy = (y / distance) * force * 11;
          letter.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${(-dx * .16).toFixed(2)}deg) scaleY(${(1 + force * .045).toFixed(3)})`;
        });
        const rect = element.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width - .5) * 2;
        const ny = ((event.clientY - rect.top) / rect.height - .5) * 2;
        if (proof) proof.style.transform = `translate3d(${(nx * -5).toFixed(2)}px, ${(ny * -3).toFixed(2)}px, 0)`;
        if (promise) promise.style.transform = `translate3d(${(nx * 7).toFixed(2)}px, ${(ny * 4).toFixed(2)}px, 0)`;
      });
    };

    const onEnter = () => measure();
    element.addEventListener('pointerenter', onEnter);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', reset);
    window.addEventListener('resize', measure, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener('pointerenter', onEnter);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', reset);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <h1 className="hero-type" id="hero-heading" aria-label="Proof before promise." ref={title}>
      <span className="hero-type__line hero-type__line--proof" aria-hidden="true"><span className="hero-type__word" data-hero-depth="proof">Proof</span></span>
      <span className="hero-type__line hero-type__line--before" aria-hidden="true">
        {'before'.split('').map((letter, index) => <em data-elastic-letter key={`${letter}-${index}`}>{letter}</em>)}
      </span>
      <span className="hero-type__line hero-type__line--promise" aria-hidden="true"><span className="hero-type__word" data-hero-depth="promise">promise.</span></span>
    </h1>
  );
}

export function WorkManifesto() {
  const lines = ['From constraint', 'to working', 'product.'];

  return (
    <div className="work-manifesto">
      <h2 id="work-heading">{lines.map((line) => <span key={line}>{line}</span>)}</h2>
      <div className="work-manifesto__axis" aria-hidden="true"><span>constraint</span><i /><span>interface</span><i /><span>product</span></div>
    </div>
  );
}

export function ProofCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d', { alpha: true });
    const reduced = prefersReducedMotion();
    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let last = 0;
    const pointer = { x: .55, y: .48, active: false };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time = 0) => {
      context.clearRect(0, 0, width, height);
      const light = document.documentElement.dataset.theme === 'light';
      const primary = light ? '16,17,18' : '244,243,239';
      context.lineWidth = 1;
      for (let row = 0; row < 13; row += 1) {
        context.beginPath();
        for (let x = -18; x <= width + 18; x += 7) {
          const nx = x / width;
          const base = (row + .8) * height / 14;
          const pointerDistance = Math.max(.08, Math.abs(nx - pointer.x));
          const influence = pointer.active ? Math.exp(-pointerDistance * 6) * (pointer.y - .5) * 48 : 0;
          const wave = Math.sin(nx * 8.2 + row * .62 + time * .00045) * (6 + row * .18);
          const y = base + wave + influence;
          if (x === -18) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.strokeStyle = `rgba(${primary},${.06 + row * .006})`;
        context.stroke();
      }

      const cx = width * (pointer.active ? pointer.x : .66);
      const cy = height * (pointer.active ? pointer.y : .43);
      context.strokeStyle = `rgba(${primary},.48)`;
      context.beginPath();
      context.arc(cx, cy, Math.min(width, height) * .12, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = light ? '#101112' : '#f4f3ef';
      context.beginPath();
      context.arc(cx, cy, 3.2, 0, Math.PI * 2);
      context.fill();
    };

    const render = (time) => {
      if (visible && !document.hidden && time - last > 32) {
        draw(time);
        last = time;
      }
      raf = requestAnimationFrame(render);
    };

    const onMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
      pointer.active = true;
      if (reduced) draw(0);
    };
    const onLeave = () => { pointer.active = false; if (reduced) draw(0); };
    const observer = new ResizeObserver(() => { resize(); draw(0); });
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: '200px' });
    observer.observe(canvas);
    visibilityObserver.observe(canvas);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    resize();
    if (reduced) draw(0); else raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas className="proof-live-canvas" ref={canvasRef} aria-hidden="true" />;
}

const AMBIENT_CHAPTERS = {
  hero: ['00', 'Working proof'],
  work: ['01', 'Project stage'],
  capabilities: ['02', 'Capability system'],
  lab: ['03', 'Live systems'],
  contact: ['04', 'Open channel']
};

export function AmbientSystem() {
  const field = useRef(null);
  const [chapter, setChapter] = useState('hero');

  useEffect(() => {
    const element = field.current;
    const chapterSelectors = [
      ['.hero', 'hero'], ['.world-stage', 'work'], ['.capability-system', 'capabilities'],
      ['.lab-act', 'lab'], ['.contact-section', 'contact']
    ];
    const sections = chapterSelectors.map(([selector, name]) => ({ target: document.querySelector(selector), name })).filter(({ target }) => target);
    if (!element || !sections.length) return undefined;
    let frame = 0;
    let currentVelocity = 0;
    let targetVelocity = 0;
    let previousScroll = window.scrollY;
    let visible = !document.hidden;

    const settle = () => {
      currentVelocity += (targetVelocity - currentVelocity) * .13;
      targetVelocity *= .86;
      element.style.setProperty('--ambient-velocity', `${currentVelocity.toFixed(2)}px`);
      element.style.setProperty('--ambient-shear', `${(currentVelocity * .025).toFixed(3)}deg`);
      if (visible && (Math.abs(currentVelocity) > .04 || Math.abs(targetVelocity) > .04)) frame = requestAnimationFrame(settle);
      else frame = 0;
    };
    const onScroll = () => {
      const next = window.scrollY;
      targetVelocity = Math.max(-18, Math.min(18, next - previousScroll));
      previousScroll = next;
      element.style.setProperty('--ambient-progress', `${Math.min(1, next / Math.max(1, document.documentElement.scrollHeight - innerHeight))}`);
      if (!frame && visible) frame = requestAnimationFrame(settle);
    };
    const onVisibility = () => {
      visible = !document.hidden;
      if (!visible) { cancelAnimationFrame(frame); frame = 0; }
      else onScroll();
    };
    const observer = new IntersectionObserver((entries) => {
      const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const match = sections.find(({ target }) => target === active?.target);
      if (match) setChapter(match.name);
    }, { rootMargin: '-34% 0px -52%', threshold: [0, .05, .25, .55] });

    sections.forEach(({ target }) => observer.observe(target));
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    onScroll();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const current = AMBIENT_CHAPTERS[chapter] || AMBIENT_CHAPTERS.hero;
  return <div className="ambient-system" ref={field} data-chapter={chapter} aria-hidden="true">
    <svg className="ambient-system__field" viewBox="0 0 1440 900" preserveAspectRatio="none"><path d="M-90 690C220 460 390 770 676 472S1098 120 1530 336" /><path d="M-60 754C248 602 502 796 752 540S1160 248 1500 460" /></svg>
    <span className="ambient-system__node"><i /></span>
    <span className="ambient-system__coordinate">{current[0]} / {current[1]}</span>
    <span className="ambient-system__progress"><i /></span>
  </div>;
}

export function DisciplineEnvironment({ discipline }) {
  if (discipline === 'Product') {
    return <div className="discipline-environment discipline-environment--product" key={discipline} aria-hidden="true"><svg viewBox="0 0 620 360"><path d="M0 72H620M0 144H620M0 216H620M0 288H620M103 0V360M206 0V360M309 0V360M412 0V360M515 0V360" /><rect x="206" y="72" width="206" height="144" /><circle cx="412" cy="216" r="7" /></svg><span>Flow mapped to decisions.</span></div>;
  }
  if (discipline === 'Implementation') {
    return <div className="discipline-environment discipline-environment--implementation" key={discipline} aria-hidden="true"><code><i>01</i><span>interface → component</span></code><code><i>02</i><span>constraint → condition</span></code><code><i>03</i><span>decision → shipped state</span></code><svg viewBox="0 0 620 120"><path d="M8 92C110 18 188 104 286 48S470 18 612 72" /></svg></div>;
  }
  if (discipline === 'Visual & Motion') {
    return <div className="discipline-environment discipline-environment--visual" key={discipline} aria-hidden="true"><figure><img src="/assets/images/design-work-02.webp" alt="" loading="lazy" /></figure><figure><img src="/assets/images/ai-video-02-poster.webp" alt="" loading="lazy" /></figure><span>Frame / rhythm / attention</span></div>;
  }
  return <div className="discipline-environment discipline-environment--ai" key={discipline} aria-hidden="true"><span>question</span><span>prototype</span><span>critique</span><span>iterate</span><svg viewBox="0 0 620 360"><path d="M90 86L276 64L424 154L530 76M90 86L172 270L424 154L530 284M172 270L530 284M276 64L172 270" /><circle cx="90" cy="86" r="5" /><circle cx="276" cy="64" r="5" /><circle cx="424" cy="154" r="5" /><circle cx="530" cy="76" r="5" /><circle cx="172" cy="270" r="5" /><circle cx="530" cy="284" r="5" /></svg></div>;
}

export function ScrambleEmail() {
  const email = 'arturmethod@gmail.com';
  const [label, setLabel] = useState(email);
  const [copied, setCopied] = useState(false);
  const frame = useRef(0);
  const copyTimer = useRef(0);

  const settle = () => {
    cancelAnimationFrame(frame.current);
    setLabel(email);
  };

  const scramble = () => {
    if (copied) return;
    if (prefersReducedMotion()) return;
    cancelAnimationFrame(frame.current);
    const glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789@._';
    const start = performance.now();
    const tick = (time) => {
      const progress = Math.min(1, (time - start) / 360);
      const resolved = Math.floor(progress * email.length);
      setLabel(email.split('').map((char, index) => index < resolved || char === '@' || char === '.' ? char : glyphs[Math.floor(Math.random() * glyphs.length)]).join(''));
      if (progress < 1) frame.current = requestAnimationFrame(tick); else setLabel(email);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const copyEmail = async () => {
    settle();
    let didCopy = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(email);
      didCopy = true;
    } catch {
      const fallback = document.createElement('textarea');
      fallback.value = email;
      fallback.setAttribute('readonly', '');
      fallback.style.position = 'fixed';
      fallback.style.opacity = '0';
      document.body.appendChild(fallback);
      fallback.select();
      didCopy = document.execCommand('copy');
      fallback.remove();
    }
    if (!didCopy) return;
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
    window.clearTimeout(copyTimer.current);
  }, []);
  return <button className="contact-email" type="button" aria-label={copied ? 'Email copied to clipboard' : 'Copy Artur Albuquerque email address'} onClick={copyEmail} onPointerEnter={scramble} onFocus={settle} onPointerLeave={settle}><span>{copied ? 'Email copied' : 'Start a conversation'}</span><strong aria-hidden="true">{copied ? 'Copied to clipboard.' : label}</strong><i aria-hidden="true">{copied ? '✓' : '↗'}</i><output className="sr-only" aria-live="polite">{copied ? 'Email copied to clipboard.' : ''}</output></button>;
}

export function PageTransitionLayer({ transition, arrival }) {
  const sharedStyle = transition?.rect ? {
    '--shared-x': `${transition.rect.x}px`, '--shared-y': `${transition.rect.y}px`,
    '--shared-width': `${transition.rect.width}px`, '--shared-height': `${transition.rect.height}px`
  } : undefined;
  return (
    <><div className="page-transition-layer" data-active={Boolean(transition)} data-kind={transition?.kind || 'default'} data-shared={Boolean(transition?.image)} aria-hidden="true">
      {transition?.image && <span className="page-transition-layer__shared" style={sharedStyle}><img src={transition.image} alt="" /></span>}
      <span className="page-transition-layer__plane" />
      <span className="page-transition-layer__plane" />
      <strong>{transition?.label || 'Working proof'}</strong>
      <small>Opening chapter</small>
    </div>{arrival?.image && <div className="page-arrival-layer" data-kind={arrival.kind || 'default'} aria-hidden="true"><img src={arrival.image} alt="" /><span>{arrival.label}</span></div>}</>
  );
}
