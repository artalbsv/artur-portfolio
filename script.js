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
  let interactionCleanup = null;
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

  function initializeProfileAvatar() {
    const image = $('[data-profile-image]');
    const avatar = image?.closest('[data-profile-avatar]');
    if (!image || !avatar) return;

    const showFallback = () => {
      image.hidden = true;
      avatar.classList.add('is-fallback');
    };

    const showPortrait = () => {
      image.hidden = false;
      avatar.classList.remove('is-fallback');
    };

    image.addEventListener('load', showPortrait, { once: true });
    image.addEventListener('error', showFallback, { once: true });

    if (image.complete) {
      if (image.naturalWidth > 0) showPortrait();
      else showFallback();
    }
  }

  function prepareTextReveals() {
    $$('[data-split-reveal]').forEach((heading) => {
      if (heading.dataset.motionSplit === 'true') return;

      const accessibleLabel = heading.textContent.replace(/\s+/g, ' ').trim();
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      });
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach((node) => {
        const fragment = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.append(document.createTextNode(part));
            return;
          }

          const word = document.createElement('span');
          const wordInner = document.createElement('span');
          word.className = 'motion-word';
          word.setAttribute('aria-hidden', 'true');
          wordInner.textContent = part;
          word.append(wordInner);
          fragment.append(word);
        });
        node.replaceWith(fragment);
      });

      $$('em', heading).forEach((emphasis) => {
        const brush = document.createElement('span');
        brush.className = 'motion-brush';
        brush.setAttribute('aria-hidden', 'true');
        emphasis.append(brush);
      });

      heading.setAttribute('aria-label', accessibleLabel);
      heading.dataset.motionSplit = 'true';
    });
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

  function initializeInteractiveMotion() {
    interactionCleanup?.();
    interactionCleanup = null;
    if (!canAnimate() || !finePointer.matches || mobileLayout.matches) return;

    const { gsap } = window;
    const cleanupTasks = [];
    const surfaces = $$('.project-screen, .btm-frame, .comparison, .creative-tile > button');

    surfaces.forEach((surface) => {
      surface.classList.add('motion-surface');
      gsap.set(surface, { transformPerspective: 900 });

      let bounds = null;
      const rotateX = gsap.quickTo(surface, 'rotationX', { duration: 0.48, ease: 'power3.out' });
      const rotateY = gsap.quickTo(surface, 'rotationY', { duration: 0.48, ease: 'power3.out' });

      const cacheBounds = () => { bounds = surface.getBoundingClientRect(); };
      const handleMove = (event) => {
        if (!bounds) cacheBounds();
        const localX = (event.clientX - bounds.left) / bounds.width;
        const localY = (event.clientY - bounds.top) / bounds.height;
        surface.style.setProperty('--spot-x', `${Math.round(localX * 100)}%`);
        surface.style.setProperty('--spot-y', `${Math.round(localY * 100)}%`);
        rotateX((0.5 - localY) * 4.2);
        rotateY((localX - 0.5) * 5.2);
      };
      const reset = () => {
        bounds = null;
        rotateX(0);
        rotateY(0);
        surface.style.setProperty('--spot-x', '50%');
        surface.style.setProperty('--spot-y', '50%');
      };

      surface.addEventListener('pointerenter', cacheBounds, { passive: true });
      surface.addEventListener('pointermove', handleMove, { passive: true });
      surface.addEventListener('pointerleave', reset, { passive: true });

      cleanupTasks.push(() => {
        surface.removeEventListener('pointerenter', cacheBounds);
        surface.removeEventListener('pointermove', handleMove);
        surface.removeEventListener('pointerleave', reset);
        surface.classList.remove('motion-surface');
        surface.style.removeProperty('--spot-x');
        surface.style.removeProperty('--spot-y');
        gsap.killTweensOf(surface);
        gsap.set(surface, { clearProps: 'transform' });
      });
    });

    $$('.button, .nav-resume, .project-visit, .case-toggle').forEach((control) => {
      let bounds = null;
      const moveX = gsap.quickTo(control, 'x', { duration: 0.34, ease: 'power3.out' });
      const moveY = gsap.quickTo(control, 'y', { duration: 0.34, ease: 'power3.out' });

      const cacheBounds = () => { bounds = control.getBoundingClientRect(); };
      const handleMove = (event) => {
        if (!bounds) cacheBounds();
        moveX((event.clientX - bounds.left - bounds.width / 2) * 0.12);
        moveY((event.clientY - bounds.top - bounds.height / 2) * 0.12);
      };
      const reset = () => {
        bounds = null;
        gsap.to(control, {
          x: 0,
          y: 0,
          duration: 0.46,
          ease: 'elastic.out(1, 0.55)',
          overwrite: true,
          onComplete: () => gsap.set(control, { clearProps: 'transform' })
        });
      };

      control.addEventListener('pointerenter', cacheBounds, { passive: true });
      control.addEventListener('pointermove', handleMove, { passive: true });
      control.addEventListener('pointerleave', reset, { passive: true });

      cleanupTasks.push(() => {
        control.removeEventListener('pointerenter', cacheBounds);
        control.removeEventListener('pointermove', handleMove);
        control.removeEventListener('pointerleave', reset);
        gsap.killTweensOf(control);
        gsap.set(control, { clearProps: 'transform' });
      });
    });

    interactionCleanup = () => cleanupTasks.forEach((cleanup) => cleanup());
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
        .from('.nav-shell', { autoAlpha: 0, y: -22, scale: 0.985, duration: 0.78 }, 0)
        .from('.hero-rules i', { scaleY: 0, transformOrigin: 'top', duration: 1.1, stagger: 0.08 }, 0.05)
        .from('.hero-section-number', { autoAlpha: 0, x: -28, duration: 0.58 }, 0.12)
        .from('.eyebrow', { autoAlpha: 0, y: 24, duration: 0.65 }, 0.2)
        .from('.hero-line > span', { yPercent: 108, duration: 1.05, stagger: 0.08 }, '-=0.42')
        .from('.hero-lead', { autoAlpha: 0, y: 34, duration: 0.8 }, '-=0.65')
        .from('.hero-actions > *', { autoAlpha: 0, y: 26, duration: 0.68, stagger: 0.1 }, '-=0.54')
        .from('.hero-origin', { autoAlpha: 0, x: -34, duration: 0.62 }, '-=0.42')
        .from('.studio-note', { autoAlpha: 0, y: 20, duration: 0.62 }, '-=0.68')
        .from('.discipline-list li', { autoAlpha: 0, x: 38, duration: 0.62, stagger: 0.07 }, '-=0.72')
        .from('.hero-object', { autoAlpha: 0, scale: 0.88, rotation: -7, duration: 1.1 }, '-=0.8')
        .from('.object-code', { autoAlpha: 0, x: 18, duration: 0.54 }, '-=0.68')
        .from('.hand-note', { autoAlpha: 0, y: 16, duration: 0.7 }, '-=0.42')
        .from('.hero-side-label', { autoAlpha: 0, y: 24, duration: 0.58 }, '-=0.5');

      heroLoop = gsap.timeline({ repeat: -1, yoyo: true, paused: document.hidden })
        .to('.geometry-dot', { x: -24, y: -16, duration: 3.8, ease: 'power2.inOut' })
        .to('.geometry-accent', { opacity: 0.45, duration: 2.8, ease: 'power2.inOut' }, 0)
        .to('.hero-geometry ellipse', { rotation: 7, transformOrigin: '50% 50%', duration: 8, ease: 'sine.inOut' }, 0);

      motionMedia = gsap.matchMedia();
      motionMedia.add({ desktop: '(min-width: 821px)', mobile: '(max-width: 820px)' }, (context) => {
        const desktop = context.conditions.desktop;
        const distance = desktop ? 72 : 34;

        $$('[data-split-reveal]').forEach((heading, headingIndex) => {
          const words = $$('.motion-word > span', heading);
          if (!words.length) return;
          gsap.from(words, {
            yPercent: 112,
            rotationX: desktop ? (headingIndex % 2 ? 14 : -14) : 0,
            duration: desktop ? 0.94 : 0.66,
            stagger: desktop ? 0.045 : 0.028,
            ease: 'power3.out',
            scrollTrigger: { trigger: heading, start: 'top 90%', once: true }
          });

          const brush = $('.motion-brush', heading);
          if (brush) {
            gsap.from(brush, {
              scaleX: 0,
              duration: 0.82,
              delay: 0.18,
              ease: 'power2.inOut',
              scrollTrigger: { trigger: heading, start: 'top 90%', once: true }
            });
          }
        });

        $$('[data-motion-group]').forEach((group, index) => {
          if (group.classList.contains('rodociclo-stage') || group.classList.contains('biketech-gallery') || group.classList.contains('creative-grid') || group.classList.contains('education-list') || group.classList.contains('language-list') || group.hasAttribute('data-timeline')) return;
          const items = [...group.children].filter((child) => !child.matches('.heading-rule, [data-split-reveal]'));
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
          rotationY: desktop ? -4 : 0,
          transformOrigin: 'left center',
          duration: 1.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.rodociclo-stage', start: 'top 82%', once: true }
        });
        gsap.from('.rodociclo-stage .project-screen-mobile', {
          autoAlpha: 0,
          y: desktop ? 110 : 54,
          rotation: 3,
          rotationX: desktop ? 0 : 3,
          transformOrigin: 'center bottom',
          duration: 0.95,
          delay: 0.18,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.rodociclo-stage', start: 'top 80%', once: true }
        });

        gsap.from('.biketech-gallery .btm-frame', {
          autoAlpha: 0,
          clipPath: 'inset(12% 12% 12% 12% round 18px)',
          x: (index) => (index % 2 ? distance : -distance),
          rotationY: desktop ? (index) => (index % 2 ? -3 : 3) : 0,
          transformOrigin: (index) => (index % 2 ? 'left center' : 'right center'),
          duration: 0.95,
          stagger: 0.13,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.biketech-gallery', start: 'top 84%', once: true }
        });

        gsap.from('.creative-grid .creative-tile', {
          autoAlpha: 0,
          y: desktop ? 70 : 30,
          rotationX: desktop ? 7 : 0,
          transformOrigin: '50% 100%',
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

        gsap.from('.timeline-node', {
          autoAlpha: 0,
          scale: 0,
          rotation: desktop ? -90 : 0,
          duration: desktop ? 0.72 : 0.48,
          stagger: 0.12,
          ease: 'back.out(1.8)',
          scrollTrigger: { trigger: '[data-timeline]', start: 'top 82%', once: true }
        });

        gsap.from('.method-list i', {
          autoAlpha: 0,
          scale: 0.72,
          rotation: desktop ? -34 : 0,
          duration: 0.58,
          stagger: 0.11,
          ease: 'back.out(1.55)',
          scrollTrigger: { trigger: '.method-list', start: 'top 80%', once: true }
        });

        gsap.from('.credentials article', {
          autoAlpha: 0,
          x: (index) => (desktop ? (index % 2 ? 58 : -58) : 0),
          y: desktop ? 0 : 24,
          duration: desktop ? 0.82 : 0.58,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.credentials-layout', start: 'top 78%', once: true }
        });

        gsap.from('.project-side-note', {
          autoAlpha: 0,
          y: desktop ? 48 : 18,
          duration: 0.72,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.project-rodociclo', start: 'top 76%', once: true }
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

          const galleryDriftUp = gsap.utils.toArray('.tile-tall, .tile-small, .tile-reel-three');
          const galleryDriftDown = gsap.utils.toArray('.tile-large, .tile-reel-two');

          if (galleryDriftUp.length) {
            gsap.to(galleryDriftUp, {
              yPercent: -3.5,
              ease: 'none',
              scrollTrigger: { trigger: '.creative-grid', start: 'top bottom', end: 'bottom top', scrub: 0.45 }
            });
          }

          if (galleryDriftDown.length) {
            gsap.fromTo(galleryDriftDown, { yPercent: -1.5 }, {
              yPercent: 2.5,
              ease: 'none',
              scrollTrigger: { trigger: '.creative-grid', start: 'top bottom', end: 'bottom top', scrub: 0.45 }
            });
          }
        }

        if (desktop) {
          initializePointerResponse();
          initializeInteractiveMotion();
        }
        else {
          pointerCleanup?.();
          pointerCleanup = null;
          interactionCleanup?.();
          interactionCleanup = null;
        }

        return () => {
          pointerCleanup?.();
          pointerCleanup = null;
          interactionCleanup?.();
          interactionCleanup = null;
        };
      });
    }, document.body);
  }

  function destroyMotion() {
    interactionCleanup?.();
    interactionCleanup = null;
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

  prepareTextReveals();
  initializeTheme();
  initializeProfileAvatar();
  initializeNavigation();
  initializeCaseStudies();
  initializeInlineMedia();
  initializeMediaViewer();
  initializeMotion();
  initializeVisibilityHandling();

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
