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
  let heroVisible = true;
  let pointerCleanup = null;
  let interactionCleanup = null;
  let kineticCleanup = null;
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
      if (themeColor) themeColor.content = nextTheme === 'light' ? '#F5F5F7' : '#050505';
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
        const brush = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        brush.setAttribute('class', 'motion-brush');
        brush.setAttribute('aria-hidden', 'true');
        brush.setAttribute('viewBox', '0 0 120 20');
        brush.setAttribute('preserveAspectRatio', 'none');
        brush.innerHTML = '<path pathLength="1" d="M2 14C19 3 42 17 62 9S98 5 118 12"></path><path pathLength="1" d="M24 18C43 11 61 17 88 12"></path>';
        emphasis.append(brush);
      });

      heading.setAttribute('aria-label', accessibleLabel);
      heading.dataset.motionSplit = 'true';
    });
  }

  function prepareHeroWords() {
    $$('.hero-line > span').forEach((line) => {
      if (line.dataset.heroSplit === 'true') return;
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT, {
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
          word.className = 'hero-word';
          word.textContent = part;
          fragment.append(word);
        });
        node.replaceWith(fragment);
      });

      line.dataset.heroSplit = 'true';
    });
  }

  function prepareMotionDecorations() {
    if (document.body.dataset.motionDecorated === 'true') return;

    const intro = document.createElement('div');
    intro.className = 'motion-intro';
    intro.setAttribute('aria-hidden', 'true');
    intro.innerHTML = '<i></i><i></i><i></i><span class="motion-intro-mark">AS / PORTFOLIO</span>';
    document.body.prepend(intro);

    const spine = document.createElement('ol');
    spine.className = 'motion-spine';
    spine.setAttribute('aria-hidden', 'true');
    spine.innerHTML = [
      ['top', 'Intro'],
      ['work', 'Work'],
      ['visual-work', 'Visual'],
      ['about', 'Method'],
      ['experience', 'Experience'],
      ['credentials', 'Education'],
      ['contact', 'Contact']
    ].map(([id, label], index) => `<li data-spine-section="${id}"${index === 0 ? ' class="is-active"' : ''}><i></i><span>${label}</span></li>`).join('');
    document.body.append(spine);

    $$('[data-section]:not(.hero)').forEach((section) => {
      const rail = document.createElement('span');
      rail.className = 'motion-section-rail';
      rail.setAttribute('aria-hidden', 'true');
      rail.innerHTML = '<i></i>';
      section.prepend(rail);
    });

    const hero = $('[data-hero]');
    if (hero) {
      const cue = document.createElement('span');
      cue.className = 'motion-scroll-cue';
      cue.setAttribute('aria-hidden', 'true');
      cue.innerHTML = '<i></i><span>Scroll to explore / 01—07</span>';
      hero.append(cue);
    }

    $$('.hero-geometry circle, .hero-geometry ellipse, .hero-geometry path').forEach((shape) => {
      shape.setAttribute('pathLength', '1');
    });

    $$('[data-viewer-item]:not([data-viewer-only])').forEach((trigger) => {
      const shutter = document.createElement('span');
      shutter.className = 'motion-shutter';
      shutter.setAttribute('aria-hidden', 'true');
      shutter.innerHTML = '<i></i><i></i><i></i>';
      trigger.append(shutter);

      const orbit = document.createElement('span');
      orbit.className = 'media-orbit';
      orbit.setAttribute('aria-hidden', 'true');
      trigger.append(orbit);
    });

    document.body.dataset.motionDecorated = 'true';
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
        $$('[data-spine-section]').forEach((item) => {
          item.classList.toggle('is-active', item.dataset.spineSection === visibleSection);
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
          window.gsap.from($$('.case-sequence li', panel), {
            autoAlpha: 0,
            x: (index) => index % 2 ? 28 : -28,
            duration: 0.54,
            stagger: 0.055,
            delay: 0.16,
            ease: 'power3.out'
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

  function initializeToolsetInteractions() {
    $$('.toolset details').forEach((details) => {
      details.addEventListener('toggle', () => {
        if (!details.open || !canAnimate()) return;
        const items = $$('li', details);
        window.gsap.from(items, {
          autoAlpha: 0,
          x: -16,
          duration: 0.4,
          stagger: 0.045,
          ease: 'power3.out',
          overwrite: true
        });
      });
    });
  }

  function initializeComparisons() {
    $$('[data-comparison]').forEach((comparison) => {
      const stage = $('.morph-comparison-stage', comparison);
      const input = $('[data-comparison-input]', comparison);
      const status = $('[data-comparison-status]', comparison);
      if (!stage || !input) return;

      const update = () => {
        const before = Math.min(100, Math.max(0, Number(input.value)));
        const after = 100 - before;
        stage.style.setProperty('--compare', `${before}%`);
        input.setAttribute('aria-valuetext', `${before} percent original and ${after} percent redesigned`);
        if (status) status.textContent = `${before} / ${after}`;
      };

      input.addEventListener('input', update, { passive: true });
      input.addEventListener('dblclick', () => {
        input.value = '50';
        update();
      });
      update();
    });
  }

  function initializeKineticDetails() {
    kineticCleanup?.();
    const cleanupTasks = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789—/·';

    const scramble = (element) => {
      if (reducedMotion.matches) return;
      const original = element.dataset.scrambleText || element.textContent.trim();
      if (!original) return;
      element.dataset.scrambleText = original;
      element.setAttribute('aria-label', original);

      cancelAnimationFrame(Number(element.dataset.scrambleFrame || 0));
      const started = performance.now();
      const duration = Math.min(920, 430 + original.length * 11);
      const characters = [...original];

      const render = (now) => {
        const progress = Math.min(1, (now - started) / duration);
        const revealed = Math.floor(progress * characters.length);
        element.textContent = characters.map((character, index) => {
          if (/\s/.test(character) || index < revealed) return character;
          return alphabet[Math.floor(Math.random() * alphabet.length)];
        }).join('');

        if (progress < 1) {
          element.dataset.scrambleFrame = String(requestAnimationFrame(render));
        } else {
          element.textContent = original;
          delete element.dataset.scrambleFrame;
        }
      };

      element.dataset.scrambleFrame = String(requestAnimationFrame(render));
    };

    const scrambleTargets = $$('[data-scramble]');
    const scrambleObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            scramble(entry.target);
            observer.unobserve(entry.target);
          });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.25 })
      : null;

    scrambleTargets.forEach((element) => {
      element.dataset.scrambleText = element.textContent.trim();
      const handleEnter = () => scramble(element);
      element.addEventListener('pointerenter', handleEnter, { passive: true });
      if (scrambleObserver) scrambleObserver.observe(element);
      cleanupTasks.push(() => {
        element.removeEventListener('pointerenter', handleEnter);
        cancelAnimationFrame(Number(element.dataset.scrambleFrame || 0));
        element.textContent = element.dataset.scrambleText;
      });
    });

    const morph = $('[data-text-morph]');
    let morphTimer = 0;
    let morphIndex = 0;
    let morphVisible = false;
    const morphWords = morph?.dataset.morphWords?.split('|').map((word) => word.trim()).filter(Boolean) || [];

    const stopMorph = () => {
      window.clearTimeout(morphTimer);
      morphTimer = 0;
      window.gsap?.killTweensOf(morph);
    };

    const scheduleMorph = () => {
      stopMorph();
      if (!morph || morphWords.length < 2 || reducedMotion.matches || !morphVisible || document.hidden) return;
      morphTimer = window.setTimeout(() => {
        const swap = () => {
          morphIndex = (morphIndex + 1) % morphWords.length;
          morph.textContent = morphWords[morphIndex];
          if (canAnimate()) {
            window.gsap.fromTo(morph, { autoAlpha: 0, y: 10, clipPath: 'inset(100% 0 0 0)' }, {
              autoAlpha: 1,
              y: 0,
              clipPath: 'inset(0% 0 0 0)',
              duration: 0.48,
              ease: 'power3.out',
              clearProps: 'opacity,visibility,transform,clip-path',
              onComplete: scheduleMorph
            });
          } else scheduleMorph();
        };

        if (canAnimate()) {
          window.gsap.to(morph, {
            autoAlpha: 0,
            y: -9,
            clipPath: 'inset(0 0 100% 0)',
            duration: 0.28,
            ease: 'power2.inOut',
            onComplete: swap
          });
        } else swap();
      }, 2600);
    };

    let morphObserver = null;
    if (morph && morphWords.length > 1) {
      if ('IntersectionObserver' in window) {
        morphObserver = new IntersectionObserver(([entry]) => {
          morphVisible = Boolean(entry?.isIntersecting);
          if (morphVisible) scheduleMorph();
          else stopMorph();
        }, { threshold: 0.2 });
        morphObserver.observe(morph);
      } else {
        morphVisible = true;
        scheduleMorph();
      }
    }

    const handleVisibility = () => {
      if (document.hidden) stopMorph();
      else scheduleMorph();
    };
    const handleReducedMotion = () => {
      if (reducedMotion.matches) {
        stopMorph();
        if (morph && morphWords.length) morph.textContent = morphWords[0];
        scrambleTargets.forEach((element) => { element.textContent = element.dataset.scrambleText; });
      } else scheduleMorph();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    if ('addEventListener' in reducedMotion) reducedMotion.addEventListener('change', handleReducedMotion);

    const handlePress = (event) => {
      if (!finePointer.matches || reducedMotion.matches || event.button !== 0) return;
      const target = event.target.closest('.button, .nav-resume, .compare-viewer-button, .media-trigger, .creative-tile > button');
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      const pulse = document.createElement('span');
      pulse.className = 'press-pulse';
      pulse.setAttribute('aria-hidden', 'true');
      pulse.style.left = `${event.clientX - bounds.left}px`;
      pulse.style.top = `${event.clientY - bounds.top}px`;
      pulse.addEventListener('animationend', () => pulse.remove(), { once: true });
      target.append(pulse);
    };
    document.addEventListener('pointerdown', handlePress);

    kineticCleanup = () => {
      scrambleObserver?.disconnect();
      morphObserver?.disconnect();
      stopMorph();
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('pointerdown', handlePress);
      if ('removeEventListener' in reducedMotion) reducedMotion.removeEventListener('change', handleReducedMotion);
      cleanupTasks.forEach((cleanup) => cleanup());
      $$('.press-pulse').forEach((pulse) => pulse.remove());
    };
  }

  function initializeInlineMedia() {
    $$('[data-viewer-item][data-media-ready="true"]:not([data-viewer-only])').forEach((trigger) => {
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
        const viewerTimeline = window.gsap.timeline();
        viewerTimeline
          .fromTo($('.viewer-backdrop', viewer), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.28, ease: 'power2.out' }, 0)
          .fromTo($('.viewer-panel', viewer), { autoAlpha: 0, y: 34, scale: 0.965, rotationX: 3 }, {
            autoAlpha: 1, y: 0, scale: 1, rotationX: 0, duration: 0.48, ease: 'power3.out'
          }, 0.04)
          .from($$('.viewer-panel > header > *', viewer), { autoAlpha: 0, y: -12, duration: 0.36, stagger: 0.06, ease: 'power3.out' }, 0.18)
          .from($('.viewer-stage > *', viewer), { autoAlpha: 0, scale: 0.96, clipPath: 'inset(8% 8% 8% 8%)', duration: 0.52, ease: 'power3.out' }, 0.16)
          .call(() => closeButton?.focus({ preventScroll: true }), null, 0.58);
      } else {
        closeButton?.focus({ preventScroll: true });
      }
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
      if (event.key === 'Escape') return;
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

    document.addEventListener('keydown', (event) => {
      if (viewer.hidden || !['Escape', 'Esc'].includes(event.key)) return;
      event.preventDefault();
      closeViewer();
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
    const grid = $('[data-field-layer="grid"]', object);
    const orbitA = $('[data-field-layer="orbit-a"]', object);
    const orbitB = $('[data-field-layer="orbit-b"]', object);
    const particles = $('[data-field-layer="particles"]', object);
    const moveX = window.gsap.quickTo(object, 'x', { duration: 0.8, ease: 'power3.out' });
    const moveY = window.gsap.quickTo(object, 'y', { duration: 0.8, ease: 'power3.out' });
    const rotate = window.gsap.quickTo(object, 'rotation', { duration: 1, ease: 'power3.out' });
    const gridX = grid ? window.gsap.quickTo(grid, 'x', { duration: 1.1, ease: 'power3.out' }) : null;
    const gridY = grid ? window.gsap.quickTo(grid, 'y', { duration: 1.1, ease: 'power3.out' }) : null;
    const orbitARotate = orbitA ? window.gsap.quickTo(orbitA, 'rotation', { duration: 1.25, ease: 'power3.out' }) : null;
    const orbitBRotate = orbitB ? window.gsap.quickTo(orbitB, 'rotation', { duration: 1.4, ease: 'power3.out' }) : null;
    const particlesX = particles ? window.gsap.quickTo(particles, 'x', { duration: 0.72, ease: 'power3.out' }) : null;
    const particlesY = particles ? window.gsap.quickTo(particles, 'y', { duration: 0.72, ease: 'power3.out' }) : null;

    const cacheBounds = () => { bounds = hero.getBoundingClientRect(); };
    const handleMove = (event) => {
      if (!bounds) cacheBounds();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5);
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5);
      moveX(x * 24);
      moveY(y * 18);
      rotate(x * 2.6);
      gridX?.(x * -18);
      gridY?.(y * -18);
      orbitARotate?.(x * 12 + y * 4);
      orbitBRotate?.(x * -9 + y * -5);
      particlesX?.(x * 34);
      particlesY?.(y * 30);
    };
    const reset = () => {
      moveX(0);
      moveY(0);
      rotate(0);
      gridX?.(0);
      gridY?.(0);
      orbitARotate?.(0);
      orbitBRotate?.(0);
      particlesX?.(0);
      particlesY?.(0);
    };

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
      window.gsap?.set([grid, orbitA, orbitB, particles].filter(Boolean), { clearProps: 'x,y,rotation' });
    };
  }

  function initializeInteractiveMotion() {
    interactionCleanup?.();
    interactionCleanup = null;
    if (!canAnimate() || !finePointer.matches || mobileLayout.matches) return;

    const { gsap } = window;
    const cleanupTasks = [];
    const surfaces = $$('.project-screen, .btm-frame, .creative-tile > button');

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

    $$('.button, .nav-resume, .project-visit, .case-toggle, .compare-viewer-button').forEach((control) => {
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
        .fromTo('.motion-intro-mark', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.36 }, 0)
        .to('.motion-intro-mark', { autoAlpha: 0, y: -10, duration: 0.28 }, 0.42)
        .to('.motion-intro > i', { scaleY: 0, duration: 0.78, stagger: 0.07, ease: 'power3.inOut' }, 0.5)
        .set('.motion-intro', { autoAlpha: 0 }, 1.36)
        .fromTo('.nav-shell', { autoAlpha: 0, y: -22, scale: 0.985 }, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.78,
          clearProps: 'transform,opacity,visibility'
        }, 0.64)
        .from('.hero-rules i', { scaleY: 0, transformOrigin: 'top', duration: 1.1, stagger: 0.08 }, 0.68)
        .from('.hero-section-number', { autoAlpha: 0, x: -28, rotation: -4, duration: 0.58 }, 0.76)
        .from('.eyebrow', { autoAlpha: 0, y: 24, scaleX: 1.04, transformOrigin: 'left center', duration: 0.72 }, 0.82)
        .from('.hero-line', { clipPath: 'inset(0 0 100% 0)', duration: 0.96, stagger: 0.08 }, 0.86)
        .from('.hero-word', { autoAlpha: 0, yPercent: 96, rotationZ: 2.5, duration: 0.92, stagger: 0.045 }, 0.9)
        .from('.hero-lead', { autoAlpha: 0, y: 34, clipPath: 'inset(0 0 100% 0)', duration: 0.8 }, 1.24)
        .from('.hero-actions > *', { autoAlpha: 0, y: 26, scale: 0.96, duration: 0.68, stagger: 0.1 }, 1.42)
        .from('.hero-origin', { autoAlpha: 0, x: -34, duration: 0.62 }, 1.54)
        .from('.hero-mode > *', { autoAlpha: 0, x: 22, duration: 0.56, stagger: 0.07 }, 1.02)
        .from('.studio-note', { autoAlpha: 0, y: 20, duration: 0.62 }, 1.02)
        .from('.discipline-list li', { autoAlpha: 0, x: 38, clipPath: 'inset(0 0 0 100%)', duration: 0.62, stagger: 0.07 }, 1.12)
        .from('.hero-object', { autoAlpha: 0, scale: 0.82, rotation: -10, duration: 1.15 }, 1.08)
        .from('.hero-geometry circle, .hero-geometry ellipse, .hero-geometry path', { strokeDasharray: 1, strokeDashoffset: 1, duration: 1.4, stagger: 0.1, ease: 'power2.inOut' }, 1.18)
        .from('.object-code, .object-readout', { autoAlpha: 0, x: 18, duration: 0.54, stagger: 0.08 }, 1.68)
        .from('.hand-note', { autoAlpha: 0, y: 16, rotation: -3, duration: 0.7 }, 1.72)
        .from('.hero-side-label', { autoAlpha: 0, y: 24, duration: 0.58 }, 1.78)
        .from('.motion-scroll-cue', { autoAlpha: 0, x: -24, duration: 0.62 }, 1.88);

      heroLoop = gsap.timeline({ repeat: -1, yoyo: true, paused: document.hidden })
        .to('.geometry-dot', { x: (index) => index % 2 ? 18 : -22, y: (index) => index % 2 ? -13 : 16, duration: 4.4, stagger: 0.12, ease: 'sine.inOut' }, 0)
        .to('.geometry-accent', { opacity: 0.38, duration: 3.2, ease: 'sine.inOut' }, 0)
        .to('.geometry-orbit-a ellipse', { rotation: (index) => index % 2 ? -6 : 7, transformOrigin: '210px 210px', duration: 9, stagger: 0.18, ease: 'sine.inOut' }, 0)
        .to('.geometry-orbit-b ellipse', { rotation: (index) => index % 2 ? 5 : -8, transformOrigin: '210px 210px', duration: 10.5, stagger: 0.2, ease: 'sine.inOut' }, 0)
        .to('.geometry-core', { scale: 1.06, transformOrigin: '210px 210px', duration: 4.8, ease: 'sine.inOut' }, 0);

      ScrollTrigger.create({
        trigger: '.hero',
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => { heroVisible = true; if (!document.hidden) heroLoop?.resume(); },
        onEnterBack: () => { heroVisible = true; if (!document.hidden) heroLoop?.resume(); },
        onLeave: () => { heroVisible = false; heroLoop?.pause(); },
        onLeaveBack: () => { heroVisible = false; heroLoop?.pause(); }
      });

      motionMedia = gsap.matchMedia();
      motionMedia.add({ desktop: '(min-width: 821px)', mobile: '(max-width: 820px)' }, (context) => {
        const desktop = context.conditions.desktop;
        const distance = desktop ? 72 : 34;

        $$('[data-split-reveal]').forEach((heading, headingIndex) => {
          const words = $$('.motion-word > span', heading);
          if (!words.length) return;
          gsap.from(words, {
            autoAlpha: 0,
            yPercent: desktop ? 88 : 54,
            rotationX: desktop ? (headingIndex % 2 ? 18 : -18) : 0,
            rotationZ: desktop ? (headingIndex % 2 ? 1.2 : -1.2) : 0,
            clipPath: 'inset(100% 0 0 0)',
            duration: desktop ? 1.02 : 0.68,
            stagger: desktop ? 0.045 : 0.028,
            ease: 'power3.out',
            scrollTrigger: { trigger: heading, start: 'top 90%', once: true }
          });

          const brushPaths = $$('.motion-brush path', heading);
          if (brushPaths.length) {
            gsap.from(brushPaths, {
              strokeDasharray: 1,
              strokeDashoffset: 1,
              duration: 0.9,
              stagger: 0.1,
              delay: 0.26,
              ease: 'power2.inOut',
              scrollTrigger: { trigger: heading, start: 'top 90%', once: true }
            });
          }
        });

        $$('[data-motion-group]').forEach((group, index) => {
          if (group.classList.contains('rodociclo-stage') || group.classList.contains('biketech-gallery') || group.classList.contains('creative-grid') || group.classList.contains('morph-comparison') || group.classList.contains('education-list') || group.classList.contains('language-list') || group.classList.contains('method') || group.classList.contains('toolset') || group.classList.contains('contact-layout') || group.hasAttribute('data-timeline')) return;
          const items = [...group.children].filter((child) => !child.matches('.heading-rule, [data-split-reveal], [data-section-number], .about-annotation, .project-index-large'));
          if (!items.length) return;
          const horizontal = index % 4 === 0 ? -distance : index % 4 === 1 ? distance : 0;
          const vertical = horizontal ? 0 : distance * (index % 2 ? 0.45 : 0.7);
          gsap.from(items, {
            autoAlpha: 0,
            x: horizontal,
            y: vertical,
            rotationZ: desktop ? (index % 2 ? 0.8 : -0.8) : 0,
            scale: desktop && index % 5 === 0 ? 0.975 : 1,
            clipPath: index % 3 === 0 ? 'inset(0 0 100% 0)' : index % 3 === 1 ? 'inset(0 100% 0 0)' : 'inset(8% 0 0 0)',
            duration: desktop ? 0.9 : 0.66,
            stagger: desktop ? 0.09 : 0.055,
            ease: 'power3.out',
            scrollTrigger: { trigger: group, start: 'top 88%', once: true }
          });
        });

        $$('.motion-section-rail i').forEach((rail) => {
          gsap.from(rail, {
            scaleX: 0,
            duration: 1.25,
            ease: 'power2.inOut',
            scrollTrigger: { trigger: rail.closest('[data-section]'), start: 'top 92%', once: true }
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
            rotationZ: desktop ? -5 : 0,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: { trigger: number, start: 'top 92%', once: true }
          });
        });

        gsap.from('.project-kicker span', {
          autoAlpha: 0,
          x: desktop ? -94 : -32,
          scale: desktop ? 1.28 : 1,
          rotationZ: desktop ? -7 : 0,
          duration: desktop ? 1 : 0.65,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.project-rodociclo', start: 'top 80%', once: true }
        });

        gsap.from('.project-index-large', {
          autoAlpha: 0,
          x: desktop ? -110 : -36,
          scale: desktop ? 1.32 : 1,
          rotationZ: desktop ? -8 : 0,
          duration: desktop ? 1.05 : 0.68,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.project-biketech', start: 'top 80%', once: true }
        });

        $$('.project-facts').forEach((facts) => {
          gsap.from([...facts.children], {
            autoAlpha: 0,
            x: desktop ? 52 : 22,
            clipPath: 'inset(0 0 0 100%)',
            duration: 0.72,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: facts, start: 'top 86%', once: true }
          });
        });

        gsap.from('.stage-annotation', {
          autoAlpha: 0,
          x: desktop ? 34 : 12,
          y: -18,
          rotation: -7,
          duration: 0.82,
          delay: 0.4,
          ease: 'back.out(1.45)',
          scrollTrigger: { trigger: '.rodociclo-stage', start: 'top 82%', once: true }
        });

        gsap.from('.outcome-statement strong', {
          autoAlpha: 0,
          x: desktop ? -62 : -22,
          skewX: desktop ? -5 : 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.outcome-statement', start: 'top 84%', once: true }
        });

        gsap.from('.outcome-statement strong i', {
          autoAlpha: 0,
          scale: 0,
          rotation: -160,
          duration: 0.72,
          delay: 0.28,
          ease: 'back.out(1.8)',
          scrollTrigger: { trigger: '.outcome-statement', start: 'top 84%', once: true }
        });

        $$('.project-scope').forEach((scope) => {
          gsap.from($$('li', scope), {
            autoAlpha: 0,
            x: desktop ? 32 : 18,
            duration: desktop ? 0.58 : 0.44,
            stagger: desktop ? 0.055 : 0.032,
            ease: 'power3.out',
            scrollTrigger: { trigger: scope, start: 'top 84%', once: true }
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

        gsap.to('.rodociclo-stage .motion-shutter i', {
          scaleX: 0,
          transformOrigin: (index) => index % 2 ? 'right center' : 'left center',
          duration: desktop ? 0.82 : 0.55,
          stagger: 0.075,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: '.rodociclo-stage', start: 'top 82%', once: true }
        });

        gsap.from('.rodociclo-stage .media-content', {
          scale: desktop ? 1.09 : 1.04,
          duration: 1.3,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.rodociclo-stage', start: 'top 82%', once: true }
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

        gsap.to('.biketech-gallery .motion-shutter i', {
          scaleY: 0,
          transformOrigin: (index) => index % 2 ? 'center top' : 'center bottom',
          duration: desktop ? 0.76 : 0.5,
          stagger: 0.06,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: '.biketech-gallery', start: 'top 84%', once: true }
        });

        gsap.from('.biketech-gallery .media-content', {
          scale: desktop ? 1.1 : 1.04,
          rotation: desktop ? (index) => index % 2 ? 1.2 : -1.2 : 0,
          duration: 1.18,
          stagger: 0.11,
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

        gsap.to('.creative-grid .motion-shutter i', {
          scaleY: 0,
          transformOrigin: (index) => index % 2 ? 'center top' : 'center bottom',
          duration: desktop ? 0.64 : 0.42,
          stagger: desktop ? 0.025 : 0.012,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: '.creative-grid', start: 'top 86%', once: true }
        });

        gsap.from('.creative-grid .media-content', {
          scale: desktop ? 1.12 : 1.04,
          rotation: desktop ? (index) => index % 2 ? 1.5 : -1.5 : 0,
          duration: desktop ? 1.05 : 0.68,
          stagger: desktop ? 0.07 : 0.035,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.creative-grid', start: 'top 86%', once: true }
        });

        gsap.from('.creative-grid figcaption > *', {
          autoAlpha: 0,
          y: 16,
          duration: 0.52,
          stagger: 0.035,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.creative-grid', start: 'top 84%', once: true }
        });

        gsap.from('.morph-comparison-header > *', {
          autoAlpha: 0,
          x: (index) => desktop ? (index ? distance : -distance) : 0,
          y: desktop ? 0 : 20,
          duration: desktop ? 0.82 : 0.58,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.morph-comparison', start: 'top 88%', once: true }
        });

        gsap.from('.morph-comparison figcaption > *', {
          autoAlpha: 0,
          y: 18,
          duration: 0.56,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.morph-comparison', start: 'top 66%', once: true }
        });

        if (desktop) {
          gsap.fromTo('.morph-comparison-stage', {
            scale: 0.88,
            clipPath: 'inset(8% 6% 8% 6% round 34px 14px 34px 14px)'
          }, {
            scale: 1,
            clipPath: 'inset(0% 0% 0% 0% round 30px 8px 30px 8px)',
            ease: 'none',
            scrollTrigger: {
              trigger: '.morph-comparison',
              start: 'top 94%',
              end: 'top 44%',
              scrub: 0.5
            }
          });
        } else {
          gsap.from('.morph-comparison-stage', {
            autoAlpha: 0,
            scale: 0.96,
            clipPath: 'inset(6% 5% 6% 5% round 22px)',
            duration: 0.72,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.morph-comparison', start: 'top 88%', once: true }
          });
        }

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

        gsap.from('.method-label', {
          autoAlpha: 0,
          x: desktop ? 44 : 20,
          duration: 0.62,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.method', start: 'top 82%', once: true }
        });

        gsap.from('.method-list li', {
          autoAlpha: 0,
          x: desktop ? 58 : 22,
          clipPath: 'inset(0 0 0 100%)',
          duration: desktop ? 0.74 : 0.54,
          stagger: 0.11,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.method-list', start: 'top 82%', once: true }
        });

        const methodItems = $$('.method-list li');
        const setCurrentMethod = (current) => {
          methodItems.forEach((item) => item.classList.toggle('is-current', item === current));
        };
        methodItems.forEach((item) => {
          ScrollTrigger.create({
            trigger: item,
            start: 'top 58%',
            end: 'bottom 48%',
            onEnter: () => setCurrentMethod(item),
            onEnterBack: () => setCurrentMethod(item)
          });
        });

        gsap.from('.about-annotation', {
          autoAlpha: 0,
          x: desktop ? -48 : -20,
          clipPath: 'inset(0 100% 0 0)',
          duration: 0.82,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.about-annotation', start: 'top 86%', once: true }
        });

        gsap.from('.toolset details', {
          autoAlpha: 0,
          x: desktop ? 48 : 22,
          clipPath: 'inset(0 0 0 100%)',
          duration: desktop ? 0.72 : 0.52,
          stagger: 0.09,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.toolset', start: 'top 82%', once: true }
        });

        gsap.from('.toolset summary span, .toolset summary i', {
          autoAlpha: 0,
          scale: 0,
          rotation: desktop ? -90 : 0,
          duration: 0.52,
          stagger: 0.055,
          ease: 'back.out(1.7)',
          scrollTrigger: { trigger: '.toolset', start: 'top 82%', once: true }
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

        gsap.from('.credentials article > span', {
          autoAlpha: 0,
          scale: 0.4,
          rotation: desktop ? -80 : 0,
          duration: 0.58,
          stagger: 0.12,
          ease: 'back.out(1.7)',
          scrollTrigger: { trigger: '.credentials-layout', start: 'top 78%', once: true }
        });

        gsap.from('.contact-side', {
          autoAlpha: 0,
          y: desktop ? 70 : 20,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.contact-layout', start: 'top 80%', once: true }
        });

        gsap.from('.contact-details > *, .contact-actions > *', {
          autoAlpha: 0,
          y: 30,
          scale: desktop ? 0.96 : 1,
          duration: 0.72,
          stagger: 0.09,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.contact-layout', start: 'top 72%', once: true }
        });

        gsap.from('.contact-signature path', {
          strokeDashoffset: 520,
          duration: 1.4,
          stagger: 0.12,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: '.contact-layout', start: 'top 70%', once: true }
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

          gsap.to('.project-rodociclo .project-heading h3', {
            xPercent: -4,
            ease: 'none',
            scrollTrigger: { trigger: '.project-rodociclo', start: 'top bottom', end: 'bottom top', scrub: 0.65 }
          });

          gsap.fromTo('.project-biketech .biketech-title-block h3', { xPercent: -2 }, {
            xPercent: 4,
            ease: 'none',
            scrollTrigger: { trigger: '.project-biketech', start: 'top bottom', end: 'bottom top', scrub: 0.65 }
          });

          gsap.to('.creative-heading h2', {
            xPercent: 3,
            ease: 'none',
            scrollTrigger: { trigger: '.creative-work', start: 'top bottom', end: 'bottom top', scrub: 0.7 }
          });

          gsap.fromTo('.about-statement h2', { xPercent: 2 }, {
            xPercent: -3,
            ease: 'none',
            scrollTrigger: { trigger: '.about-process', start: 'top bottom', end: 'bottom top', scrub: 0.7 }
          });

          gsap.to('.stage-annotation', {
            yPercent: -36,
            ease: 'none',
            scrollTrigger: { trigger: '.rodociclo-stage', start: 'top bottom', end: 'bottom top', scrub: 0.55 }
          });

          gsap.fromTo('.contact-layout h2', { xPercent: 2.5 }, {
            xPercent: -2.5,
            ease: 'none',
            scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: 0.65 }
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
          methodItems.forEach((item) => item.classList.remove('is-current'));
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
      else if (heroVisible) heroLoop?.resume();
    });

    const handleMotionPreference = () => {
      destroyMotion();
      if (!reducedMotion.matches) initializeMotion();
    };
    if ('addEventListener' in reducedMotion) reducedMotion.addEventListener('change', handleMotionPreference);
    else if ('addListener' in reducedMotion) reducedMotion.addListener(handleMotionPreference);

    window.addEventListener('pagehide', () => {
      kineticCleanup?.();
      kineticCleanup = null;
      destroyMotion();
    }, { once: true });
  }

  prepareTextReveals();
  prepareHeroWords();
  prepareMotionDecorations();
  initializeTheme();
  initializeProfileAvatar();
  initializeNavigation();
  initializeCaseStudies();
  initializeToolsetInteractions();
  initializeComparisons();
  initializeKineticDetails();
  initializeInlineMedia();
  initializeMediaViewer();
  initializeMotion();
  initializeVisibilityHandling();

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
