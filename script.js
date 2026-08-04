(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const smallScreen = window.matchMedia('(max-width: 760px)');

  const body = document.body;
  const header = document.querySelector('[data-header]');
  const hero = document.querySelector('[data-hero]');
  const heroDecor = document.querySelector('[data-hero-decor]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const year = document.querySelector('[data-year]');

  requestAnimationFrame(() => body.classList.add('is-loaded'));

  if (year) year.textContent = new Date().getFullYear();

  // Mobile navigation remains fully visible when JavaScript is unavailable.
  const closeMenu = (returnFocus = false) => {
    if (!menu || !menuToggle) return;
    menu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
    if (returnFocus) menuToggle.focus();
  };

  if (menu && menuToggle) {
    menuToggle.addEventListener('click', () => {
      const willOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
      menu.classList.toggle('is-open', willOpen);
      menuToggle.setAttribute('aria-expanded', String(willOpen));
      menuToggle.setAttribute('aria-label', willOpen ? 'Close navigation menu' : 'Open navigation menu');
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(true);
    });

    document.addEventListener('click', (event) => {
      if (!menu.classList.contains('is-open')) return;
      if (!event.target.closest('.nav-shell')) closeMenu();
    });

    const handleBreakpointChange = (event) => {
      if (!event.matches) closeMenu();
    };

    if ('addEventListener' in smallScreen) {
      smallScreen.addEventListener('change', handleBreakpointChange);
    } else if ('addListener' in smallScreen) {
      // Compatibility fallback for older Safari versions.
      smallScreen.addListener(handleBreakpointChange);
    }
  }

  // The navigation adopts its elevated treatment as the hero begins to leave.
  if (hero && header && 'IntersectionObserver' in window) {
    const headerObserver = new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-scrolled', entry.intersectionRatio < 0.82);
    }, { threshold: [0, 0.82, 1] });
    headerObserver.observe(hero);
  } else if (header) {
    header.classList.add('is-scrolled');
  }

  // Content is visible by default; these classes only enhance the entrance.
  const revealItems = document.querySelectorAll('.reveal, .reveal-media');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Draw the experience line only once when the timeline becomes visible.
  const timeline = document.querySelector('[data-timeline]');
  if (timeline && 'IntersectionObserver' in window) {
    const timelineObserver = new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      timeline.classList.add('is-visible');
      observer.unobserve(timeline);
    }, { threshold: 0.18 });
    timelineObserver.observe(timeline);
  } else if (timeline) {
    timeline.classList.add('is-visible');
  }

  // Animate the provided commercial figures once. Reduced motion shows final values.
  const counters = [...document.querySelectorAll('[data-count]')];
  const setCounterFinal = (counter) => {
    counter.textContent = counter.dataset.count;
  };

  const runCounter = (counter) => {
    if (counter.dataset.counted === 'true') return;
    counter.dataset.counted = 'true';
    const target = Number(counter.dataset.count);
    const duration = 1050;
    const started = performance.now();

    const update = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  if (counters.length && 'IntersectionObserver' in window && !reducedMotion.matches) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('[data-count]').forEach(runCounter);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.45 });

    const metricGroup = document.querySelector('.metric-sequence');
    if (metricGroup) counterObserver.observe(metricGroup);
  } else {
    counters.forEach(setCounterFinal);
  }

  // Keep case-study labels synchronized with the native accessible disclosure.
  document.querySelectorAll('[data-case-study]').forEach((details) => {
    const label = details.querySelector('summary span');
    details.addEventListener('toggle', () => {
      if (label) label.textContent = details.open ? 'Close case study' : 'Open case study';
    });
  });

  // Hero ambience is pointer-driven and only enabled for desktop fine pointers.
  if (hero && heroDecor && finePointer.matches && !reducedMotion.matches && !smallScreen.matches) {
    let pointerFrame = 0;
    let pointerX = 72;
    let pointerY = 40;

    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width) * 100;
      pointerY = ((event.clientY - rect.top) / rect.height) * 100;
      if (pointerFrame) return;

      pointerFrame = requestAnimationFrame(() => {
        heroDecor.style.setProperty('--pointer-x', `${pointerX.toFixed(2)}%`);
        heroDecor.style.setProperty('--pointer-y', `${pointerY.toFixed(2)}%`);
        pointerFrame = 0;
      });
    }, { passive: true });
  }

  // Decorative parallax is transform-only and stops calculating outside the hero.
  const parallaxItems = heroDecor ? [...heroDecor.querySelectorAll('[data-depth]')] : [];
  let heroVisible = true;
  let scrollFrame = 0;

  const updateParallax = () => {
    if (!heroVisible || reducedMotion.matches || smallScreen.matches) {
      scrollFrame = 0;
      return;
    }

    const offset = Math.min(window.scrollY, window.innerHeight);
    parallaxItems.forEach((item) => {
      const depth = Number(item.dataset.depth || 0);
      item.style.transform = `translate3d(0, ${Math.round(offset * depth)}px, 0)`;
    });
    scrollFrame = 0;
  };

  if (hero && heroDecor && 'IntersectionObserver' in window) {
    const decorObserver = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      heroDecor.classList.toggle('is-paused', !heroVisible);
    }, { threshold: 0.01 });
    decorObserver.observe(hero);
  }

  if (parallaxItems.length) {
    window.addEventListener('scroll', () => {
      if (!heroVisible || scrollFrame) return;
      scrollFrame = requestAnimationFrame(updateParallax);
    }, { passive: true });
  }
})();
