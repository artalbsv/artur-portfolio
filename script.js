(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = window.matchMedia('(max-width: 820px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const themeKey = 'artur-portfolio-theme';

  let motionContext = null;
  let motionMedia = null;
  let heroLoop = null;
  let pointerCleanup = null;
  let scrollFrame = 0;
  let maximumScroll = 1;
  let gsapRegistered = false;

  const gsapAvailable = () => Boolean(window.gsap && window.ScrollTrigger);
  const canAnimate = () => gsapAvailable() && !reducedMotion.matches;

  const safeStorage = {
    get() {
      try { return localStorage.getItem(themeKey); } catch (error) { return null; }
    },
    set(value) {
      try { localStorage.setItem(themeKey, value); } catch (error) { /* Preference remains session-only. */ }
    }
  };

  function initializeTheme() {
    const toggle = $('[data-theme-toggle]');
    const themeColor = $('#theme-color');
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)');

    const applyTheme = (theme, persist = false) => {
      const nextTheme = theme === 'light' ? 'light' : 'dark';
      root.dataset.theme = nextTheme;
      if (persist) safeStorage.set(nextTheme);
      if (themeColor) themeColor.content = nextTheme === 'light' ? '#F2EFE9' : '#050505';
      if (toggle) {
        const isDark = nextTheme === 'dark';
        toggle.setAttribute('aria-checked', String(isDark));
        toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
      }
    };

    applyTheme(root.dataset.theme || (systemTheme.matches ? 'light' : 'dark'));

    toggle?.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });

    const handleSystemTheme = (event) => {
      if (!safeStorage.get()) applyTheme(event.matches ? 'light' : 'dark');
    };

    if ('addEventListener' in systemTheme) systemTheme.addEventListener('change', handleSystemTheme);
    else if ('addListener' in systemTheme) systemTheme.addListener(handleSystemTheme);
  }

  function initializeNavigation() {
    const header = $('[data-header]');
    const menu = $('[data-menu]');
    const toggle = $('[data-menu-toggle]');
    if (!header || !menu || !toggle) return;

    const setMenuState = (open, returnFocus = false) => {
      window.gsap?.killTweensOf(menu);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');

      if (open) {
        menu.classList.add('is-open');
        if (canAnimate() && mobileLayout.matches) {
          window.gsap.fromTo(menu, { autoAlpha: 0, y: -12 }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.38,
            ease: 'power3.out',
            clearProps: 'opacity,visibility,transform'
          });
        }
      } else if (canAnimate() && mobileLayout.matches && menu.classList.contains('is-open')) {
        window.gsap.to(menu, {
          autoAlpha: 0,
          y: -8,
          duration: 0.24,
          ease: 'power2.inOut',
          onComplete: () => {
            menu.classList.remove('is-open');
            window.gsap.set(menu, { clearProps: 'opacity,visibility,transform' });
          }
        });
      } else {
        menu.classList.remove('is-open');
      }

      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => {
      setMenuState(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenuState(false);
    });

    document.addEventListener('click', (event) => {
      if (menu.classList.contains('is-open') && !event.target.closest('.nav-shell')) setMenuState(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) setMenuState(false, true);
    });

    const handleLayoutChange = (event) => {
      if (!event.matches) setMenuState(false);
    };

    if ('addEventListener' in mobileLayout) mobileLayout.addEventListener('change', handleLayoutChange);
    else if ('addListener' in mobileLayout) mobileLayout.addListener(handleLayoutChange);

    const sections = $$('[data-section][id]');
    const navLinks = $$('[data-nav-link]');
    const navigationGroup = new Map([
      ['work', 'work'],
      ['visual-work', 'work'],
      ['about', 'about'],
      ['experience', 'experience'],
      ['credentials', 'experience'],
      ['contact', 'contact']
    ]);

    if ('IntersectionObserver' in window) {
      const visible = new Map();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
        let visibleSection = '';
        let activeRatio = 0;
        visible.forEach((ratio, id) => {
          if (ratio > activeRatio) {
            activeRatio = ratio;
            visibleSection = id;
          }
        });
        const activeId = navigationGroup.get(visibleSection) || '';
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${activeId}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }, { rootMargin: '-28% 0px -58% 0px', threshold: [0.01, 0.2, 0.6] });
      sections.forEach((section) => observer.observe(section));
    }

    const updateScrollMetrics = () => {
      maximumScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };

    const paintScrollState = () => {
      const progress = Math.min(1, Math.max(0, window.scrollY / maximumScroll));
      $('[data-page-progress]')?.style.setProperty('transform', `scaleY(${progress})`);
      header.classList.toggle('is-scrolled', window.scrollY > 36);
      scrollFrame = 0;
    };

    const requestScrollPaint = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(paintScrollState);
    };

    updateScrollMetrics();
    paintScrollState();
    window.addEventListener('scroll', requestScrollPaint, { passive: true });
    window.addEventListener('resize', () => {
      updateScrollMetrics();
      requestScrollPaint();
    }, { passive: true });
    window.addEventListener('load', updateScrollMetrics, { once: true });

    window.portfolioRefreshScroll = () => {
      updateScrollMetrics();
      requestScrollPaint();
      window.ScrollTrigger?.refresh();
    };
  }

  function initializeCaseStudies() {
    $$('[data-case-study]').forEach((disclosure) => {
      const toggle = $('[data-case-toggle]', disclosure);
      const panel = $('[data-case-panel]', disclosure);
      if (!toggle || !panel) return;

      panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true');

      const finalizeClosed = () => {
        panel.hidden = true;
        panel.setAttribute('aria-hidden', 'true');
        panel.style.removeProperty('height');
        panel.style.removeProperty('overflow');
        panel.style.removeProperty('opacity');
        panel.style.removeProperty('visibility');
        window.portfolioRefreshScroll?.();
      };

      const openPanel = () => {
        toggle.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        panel.setAttribute('aria-hidden', 'false');

        if (canAnimate()) {
          window.gsap.killTweensOf(panel);
          window.gsap.fromTo(panel, { height: 0, autoAlpha: 0, overflow: 'hidden' }, {
            height: 'auto',
            autoAlpha: 1,
            duration: 0.62,
            ease: 'power3.out',
            onComplete: () => {
              window.gsap.set(panel, { clearProps: 'height,overflow,opacity,visibility' });
              window.portfolioRefreshScroll?.();
            }
          });
        } else {
          window.portfolioRefreshScroll?.();
        }
      };

      const closePanel = () => {
        toggle.setAttribute('aria-expanded', 'false');
        if (canAnimate()) {
          window.gsap.killTweensOf(panel);
          window.gsap.fromTo(panel, { height: panel.scrollHeight, autoAlpha: 1, overflow: 'hidden' }, {
            height: 0,
            autoAlpha: 0,
            duration: 0.42,
            ease: 'power2.inOut',
            onComplete: finalizeClosed
          });
        } else {
          finalizeClosed();
        }
      };

      toggle.addEventListener('click', () => {
        if (toggle.getAttribute('aria-expanded') === 'true') closePanel();
        else openPanel();
      });
    });
  }

  function initializeInlineMedia() {
    $$('[data-viewer-item][data-media-ready="true"]').forEach((trigger) => {
      const isVideo = trigger.dataset.mediaKind === 'video';
      const source = isVideo ? trigger.dataset.mediaPoster : trigger.dataset.mediaSrc;
      if (!source) return;

      const image = document.createElement('img');
      image.className = 'media-content';
      image.src = source;
      image.alt = trigger.hasAttribute('aria-label') ? '' : (trigger.dataset.mediaAlt || '');
      image.loading = 'lazy';
      image.decoding = 'async';
      const mediaWidth = Number.parseInt(trigger.dataset.mediaWidth || '', 10);
      const mediaHeight = Number.parseInt(trigger.dataset.mediaHeight || '', 10);
      if (mediaWidth > 0 && mediaHeight > 0) {
        image.width = mediaWidth;
        image.height = mediaHeight;
      }
      image.addEventListener('load', () => trigger.classList.add('has-inline-media'), { once: true });
      trigger.append(image);
    });
  }

  function initializeMediaViewer() {
    const viewer = $('[data-media-viewer]');
    const stage = $('[data-viewer-stage]');
    if (!viewer || !stage) return;

    const title = $('[data-viewer-title]');
    const category = $('[data-viewer-category]');
    const description = $('[data-viewer-description]');
    const note = $('[data-viewer-note]');
    const path = $('[data-viewer-path]');
    const closeButton = $('.viewer-close', viewer);
    const inertSurfaces = [$('header.site-header'), $('main'), $('footer.site-footer')].filter(Boolean);
    let returnFocus = null;

    const focusableElements = () => $$('button:not([disabled]), a[href], video[controls], [tabindex]:not([tabindex="-1"])', viewer)
      .filter((element) => !element.hidden && element.offsetParent !== null);

    const clearStage = () => {
      const video = $('video', stage);
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      stage.replaceChildren();
    };

    const buildPlaceholder = (sourceTitle, sourcePath, kind) => {
      const placeholder = document.createElement('div');
      placeholder.className = 'viewer-placeholder';
      const copy = document.createElement('div');
      const label = document.createElement('span');
      const heading = document.createElement('strong');
      const note = document.createElement('p');
      label.textContent = `${kind} frame reserved`;
      heading.textContent = sourceTitle;
      note.textContent = `Add the final file at ${sourcePath}. This fallback does not request a missing asset.`;
      copy.append(label, heading, note);
      placeholder.append(copy);
      return placeholder;
    };

    const openViewer = (trigger) => {
      const mediaKind = trigger.dataset.mediaKind || 'image';
      const mediaReady = trigger.dataset.mediaReady === 'true';
      const mediaTitle = trigger.dataset.mediaTitle || 'Selected media';
      const mediaCategory = trigger.dataset.mediaCategory || 'Creative work';
      const mediaPath = trigger.dataset.mediaSrc || '';
      const mediaAlt = trigger.dataset.mediaAlt || mediaTitle;
      const mediaNote = trigger.dataset.mediaNote || '';
      const mediaWidth = Number.parseInt(trigger.dataset.mediaWidth || '', 10);
      const mediaHeight = Number.parseInt(trigger.dataset.mediaHeight || '', 10);

      returnFocus = trigger;
      clearStage();
      if (title) title.textContent = mediaTitle;
      if (category) category.textContent = mediaCategory;
      if (path) path.textContent = mediaPath;
      if (note) {
        note.textContent = mediaNote;
        note.hidden = !mediaNote;
      }

      if (mediaReady && mediaKind === 'video') {
        const video = document.createElement('video');
        video.controls = true;
        video.preload = 'metadata';
        video.playsInline = true;
        video.src = mediaPath;
        if (trigger.dataset.mediaPoster) video.poster = trigger.dataset.mediaPoster;
        if (mediaWidth > 0 && mediaHeight > 0) {
          video.width = mediaWidth;
          video.height = mediaHeight;
        }
        video.setAttribute('aria-label', mediaAlt);
        stage.append(video);
        if (description) description.textContent = 'Video preview. Playback starts only when you press play.';
      } else if (mediaReady) {
        const image = document.createElement('img');
        image.src = mediaPath;
        image.alt = mediaAlt;
        image.loading = 'eager';
        image.decoding = 'async';
        if (mediaWidth > 0 && mediaHeight > 0) {
          image.width = mediaWidth;
          image.height = mediaHeight;
        }
        stage.append(image);
        if (description) description.textContent = mediaAlt;
      } else {
        stage.append(buildPlaceholder(mediaTitle, mediaPath, mediaKind));
        if (description) description.textContent = 'A polished placeholder is shown until Artur adds the final media.';
      }

      viewer.hidden = false;
      document.body.classList.add('media-open');
      inertSurfaces.forEach((surface) => { surface.inert = true; });

      if (canAnimate()) {
        window.gsap.fromTo($('.viewer-panel', viewer), { autoAlpha: 0, y: 26, scale: 0.985 }, {
          autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: 'power3.out'
        });
      }
      requestAnimationFrame(() => closeButton?.focus());
    };

    const closeViewer = () => {
      if (viewer.hidden) return;
      const finish = () => {
        viewer.hidden = true;
        document.body.classList.remove('media-open');
        inertSurfaces.forEach((surface) => { surface.inert = false; });
        clearStage();
        returnFocus?.focus();
        returnFocus = null;
      };

      if (canAnimate()) {
        window.gsap.to($('.viewer-panel', viewer), {
          autoAlpha: 0, y: 16, scale: 0.99, duration: 0.24, ease: 'power2.inOut', onComplete: finish
        });
      } else {
        finish();
      }
    };

    $$('[data-viewer-item]').forEach((trigger) => trigger.addEventListener('click', () => openViewer(trigger)));
    $$('[data-viewer-close]', viewer).forEach((control) => control.addEventListener('click', closeViewer));

    viewer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeViewer();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = focusableElements();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function initializePointerResponse() {
    pointerCleanup?.();
    pointerCleanup = null;
    if (!canAnimate() || !finePointer.matches || mobileLayout.matches) return;

    const hero = $('[data-hero]');
    const object = $('[data-pointer-object]');
    if (!hero || !object) return;

    let bounds = null;
    const moveX = window.gsap.quickTo(object, 'x', { duration: 0.8, ease: 'power3.out' });
    const moveY = window.gsap.quickTo(object, 'y', { duration: 0.8, ease: 'power3.out' });
    const rotate = window.gsap.quickTo(object, 'rotation', { duration: 1, ease: 'power3.out' });

    const cacheBounds = () => { bounds = hero.getBoundingClientRect(); };
    const handleMove = (event) => {
      if (!bounds) cacheBounds();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5);
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5);
      moveX(x * 24);
      moveY(y * 18);
      rotate(x * 2.6);
    };
    const reset = () => { moveX(0); moveY(0); rotate(0); };

    hero.addEventListener('pointerenter', cacheBounds, { passive: true });
    hero.addEventListener('pointermove', handleMove, { passive: true });
    hero.addEventListener('pointerleave', reset, { passive: true });
    window.addEventListener('resize', cacheBounds, { passive: true });

    pointerCleanup = () => {
      hero.removeEventListener('pointerenter', cacheBounds);
      hero.removeEventListener('pointermove', handleMove);
      hero.removeEventListener('pointerleave', reset);
      window.removeEventListener('resize', cacheBounds);
      window.gsap?.set(object, { clearProps: 'x,y,rotation' });
    };
  }

  function initializeMotion() {
    if (!canAnimate() || motionContext) return;
    const { gsap, ScrollTrigger } = window;

    if (!gsapRegistered) {
      gsap.registerPlugin(ScrollTrigger);
      gsapRegistered = true;
    }

    root.dataset.motionRuntime = 'gsap-scrolltrigger';
    root.classList.add('motion-ready');

    motionContext = gsap.context(() => {
      const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTimeline
        .from('.eyebrow', { autoAlpha: 0, y: 24, duration: 0.65 })
        .from('.hero-line > span', { yPercent: 108, duration: 1.05, stagger: 0.08 }, '-=0.42')
        .from('.hero-lead', { autoAlpha: 0, y: 34, duration: 0.8 }, '-=0.65')
        .from('.hero-actions > *', { autoAlpha: 0, y: 26, duration: 0.68, stagger: 0.1 }, '-=0.54')
        .from('.hero-origin', { autoAlpha: 0, x: -34, duration: 0.62 }, '-=0.42')
        .from('.discipline-list li', { autoAlpha: 0, x: 38, duration: 0.62, stagger: 0.07 }, '-=0.72')
        .from('.hero-object', { autoAlpha: 0, scale: 0.88, rotation: -7, duration: 1.1 }, '-=0.8')
        .from('.hand-note', { autoAlpha: 0, y: 16, duration: 0.7 }, '-=0.42');

      heroLoop = gsap.timeline({ repeat: -1, yoyo: true, paused: document.hidden })
        .to('.geometry-dot', { x: -24, y: -16, duration: 3.8, ease: 'power2.inOut' })
        .to('.geometry-accent', { opacity: 0.45, duration: 2.8, ease: 'power2.inOut' }, 0);

      motionMedia = gsap.matchMedia();
      motionMedia.add({ desktop: '(min-width: 821px)', mobile: '(max-width: 820px)' }, (context) => {
        const desktop = context.conditions.desktop;
        const distance = desktop ? 72 : 34;

        $$('[data-motion-group]').forEach((group, index) => {
          if (group.classList.contains('rodociclo-stage') || group.classList.contains('biketech-gallery') || group.classList.contains('creative-grid') || group.hasAttribute('data-timeline')) return;
          const items = [...group.children].filter((child) => !child.matches('.heading-rule'));
          if (!items.length) return;
          const horizontal = index % 3 === 0 ? -distance : index % 3 === 1 ? distance : 0;
          gsap.from(items, {
            autoAlpha: 0,
            x: horizontal,
            y: horizontal ? 0 : distance * 0.65,
            duration: desktop ? 0.9 : 0.66,
            stagger: desktop ? 0.09 : 0.055,
            ease: 'power3.out',
            scrollTrigger: { trigger: group, start: 'top 88%', once: true }
          });
        });

        $$('.heading-rule').forEach((rule) => {
          gsap.from(rule, {
            scaleX: 0,
            duration: 1,
            ease: 'power2.inOut',
            scrollTrigger: { trigger: rule.parentElement, start: 'top 88%', once: true }
          });
        });

        $$('[data-section-number]').forEach((number) => {
          gsap.from(number, {
            autoAlpha: 0,
            x: desktop ? -55 : -24,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: { trigger: number, start: 'top 92%', once: true }
          });
        });

        gsap.from('.rodociclo-stage .project-screen-desktop', {
          clipPath: 'inset(0 100% 0 0 round 22px)',
          scale: 0.975,
          duration: 1.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.rodociclo-stage', start: 'top 82%', once: true }
        });
        gsap.from('.rodociclo-stage .project-screen-mobile', {
          autoAlpha: 0,
          y: desktop ? 110 : 54,
          rotation: 3,
          duration: 0.95,
          delay: 0.18,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.rodociclo-stage', start: 'top 80%', once: true }
        });

        gsap.from('.biketech-gallery .btm-frame', {
          autoAlpha: 0,
          clipPath: 'inset(12% 12% 12% 12% round 18px)',
          x: (index) => (index % 2 ? distance : -distance),
          duration: 0.95,
          stagger: 0.13,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.biketech-gallery', start: 'top 84%', once: true }
        });

        gsap.from('.creative-grid .creative-tile', {
          autoAlpha: 0,
          y: desktop ? 70 : 30,
          clipPath: 'inset(0 0 100% 0 round 8px)',
          duration: desktop ? 0.9 : 0.62,
          stagger: desktop ? 0.11 : 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.creative-grid', start: 'top 86%', once: true }
        });

        gsap.from('[data-timeline-line]', {
          scaleY: 0,
          duration: 1.15,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: '[data-timeline]', start: 'top 82%', once: true }
        });
        gsap.from('[data-timeline] article', {
          autoAlpha: 0,
          x: desktop ? -50 : -24,
          duration: 0.74,
          stagger: 0.14,
          ease: 'power3.out',
          scrollTrigger: { trigger: '[data-timeline]', start: 'top 82%', once: true }
        });

        if (desktop) {
          gsap.to('.project-screen-mobile', {
            yPercent: -10,
            ease: 'none',
            scrollTrigger: { trigger: '.rodociclo-stage', start: 'top bottom', end: 'bottom top', scrub: 0.55 }
          });
          gsap.to('.btm-before', {
            yPercent: -7,
            ease: 'none',
            scrollTrigger: { trigger: '.biketech-gallery', start: 'top bottom', end: 'bottom top', scrub: 0.6 }
          });
          gsap.to('.hero-object', {
            y: 44,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
          });
        }
      });
    }, document.body);

    initializePointerResponse();
  }

  function destroyMotion() {
    pointerCleanup?.();
    pointerCleanup = null;
    heroLoop?.kill();
    heroLoop = null;
    motionMedia?.revert();
    motionMedia = null;
    motionContext?.revert();
    motionContext = null;
    root.classList.remove('motion-ready');
  }

  function initializeVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      root.classList.toggle('is-tab-hidden', document.hidden);
      if (document.hidden) heroLoop?.pause();
      else heroLoop?.resume();
    });

    const handleMotionPreference = () => {
      destroyMotion();
      if (!reducedMotion.matches) initializeMotion();
    };
    if ('addEventListener' in reducedMotion) reducedMotion.addEventListener('change', handleMotionPreference);
    else if ('addListener' in reducedMotion) reducedMotion.addListener(handleMotionPreference);

    window.addEventListener('pagehide', destroyMotion, { once: true });
  }

  initializeTheme();
  initializeNavigation();
  initializeCaseStudies();
  initializeInlineMedia();
  initializeMediaViewer();
  initializeMotion();
  initializeVisibilityHandling();

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
