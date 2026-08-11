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
  let fieldCleanup = null;
  let signatureCleanup = null;
  let sitewideCleanup = null;
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

  function prepareDynamicWeightText() {
    $$('[data-dynamic-weight]').forEach((element) => {
      if (element.dataset.weightSplit === 'true') return;
      const accessibleLabel = element.textContent.replace(/\s+/g, ' ').trim();
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach((node) => {
        const fragment = document.createDocumentFragment();
        [...node.nodeValue].forEach((character) => {
          if (/\s/.test(character)) {
            fragment.append(document.createTextNode(character));
            return;
          }
          const letter = document.createElement('span');
          letter.className = 'weight-char';
          letter.setAttribute('aria-hidden', 'true');
          letter.textContent = character;
          fragment.append(letter);
        });
        node.replaceWith(fragment);
      });

      element.setAttribute('aria-label', accessibleLabel);
      element.dataset.weightSplit = 'true';
    });
  }

  function createTextMorphController(element, hold = 2600) {
    if (!element) return () => {};
    const words = element.dataset.morphWords?.split('|').map((word) => word.trim()).filter(Boolean) || [];
    if (words.length < 2) return () => {};

    if (element.dataset.morphPrepared !== 'true') {
      const size = document.createElement('span');
      const front = document.createElement('span');
      const back = document.createElement('span');
      size.className = 'morph-size';
      size.setAttribute('aria-hidden', 'true');
      words.forEach((word) => {
        const candidate = document.createElement('i');
        candidate.textContent = word;
        size.append(candidate);
      });
      front.className = 'morph-layer is-current';
      back.className = 'morph-layer';
      front.setAttribute('aria-hidden', 'true');
      back.setAttribute('aria-hidden', 'true');
      front.textContent = words[0];
      back.textContent = words[1];
      element.replaceChildren(size, front, back);
      element.setAttribute('aria-label', words.join(' / '));
      element.dataset.morphPrepared = 'true';
    }

    const layers = $$('.morph-layer', element);
    if (layers.length !== 2) return () => {};
    let activeLayer = 0;
    let wordIndex = 0;
    let timer = 0;
    let visible = false;
    let observer = null;
    let timeline = null;

    const resetLayers = () => {
      timeline?.kill();
      timeline = null;
      wordIndex = 0;
      activeLayer = 0;
      layers[0].textContent = words[0];
      layers[1].textContent = words[1];
      layers[0].classList.add('is-current');
      layers[1].classList.remove('is-current');
      if (window.gsap) {
        window.gsap.set(layers[0], { autoAlpha: 1, scale: 1, filter: 'blur(0px)', clearProps: 'transform,filter' });
        window.gsap.set(layers[1], { autoAlpha: 0, scale: 0.88, filter: 'blur(7px)' });
      } else {
        layers[0].style.opacity = '1';
        layers[1].style.opacity = '0';
      }
    };

    const stop = () => {
      window.clearTimeout(timer);
      timer = 0;
      timeline?.kill();
      timeline = null;
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = 0;
      if (!visible || document.hidden || reducedMotion.matches) return;
      timer = window.setTimeout(() => {
        const outgoing = layers[activeLayer];
        const incomingIndex = activeLayer === 0 ? 1 : 0;
        const incoming = layers[incomingIndex];
        wordIndex = (wordIndex + 1) % words.length;
        incoming.textContent = words[wordIndex];

        if (!canAnimate()) {
          outgoing.classList.remove('is-current');
          incoming.classList.add('is-current');
          outgoing.style.opacity = '0';
          incoming.style.opacity = '1';
          activeLayer = incomingIndex;
          schedule();
          return;
        }

        window.gsap.killTweensOf(layers);
        window.gsap.set(incoming, { autoAlpha: 0, scale: 0.84, filter: 'blur(9px)' });
        timeline = window.gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          onComplete: () => {
            outgoing.classList.remove('is-current');
            incoming.classList.add('is-current');
            window.gsap.set(outgoing, { autoAlpha: 0, scale: 1, filter: 'blur(0px)' });
            window.gsap.set(incoming, { clearProps: 'transform,filter' });
            activeLayer = incomingIndex;
            timeline = null;
            schedule();
          }
        });
        timeline
          .to(outgoing, { autoAlpha: 0, scale: 1.12, filter: 'blur(7px)', duration: 0.42 }, 0)
          .to(incoming, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.58, ease: 'power3.out' }, 0.12);
      }, hold);
    };

    resetLayers();
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) schedule();
        else stop();
      }, { threshold: 0.2 });
      observer.observe(element);
    } else {
      visible = true;
      schedule();
    }

    const handleVisibility = () => {
      if (document.hidden) stop();
      else schedule();
    };
    const handleMotionPreference = () => {
      if (reducedMotion.matches) {
        stop();
        resetLayers();
      } else schedule();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    if ('addEventListener' in reducedMotion) reducedMotion.addEventListener('change', handleMotionPreference);

    return () => {
      stop();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      if ('removeEventListener' in reducedMotion) reducedMotion.removeEventListener('change', handleMotionPreference);
      resetLayers();
    };
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
    spine.setAttribute('aria-label', 'Portfolio scenes');
    spine.innerHTML = [
      ['top', 'Intro'],
      ['work', 'Work'],
      ['visual-work', 'Visual'],
      ['about', 'Method'],
      ['experience', 'Experience'],
      ['credentials', 'Education'],
      ['contact', 'Contact']
    ].map(([id, label], index) => `<li data-spine-section="${id}"${index === 0 ? ' class="is-active"' : ''}><a href="#${id}" aria-label="Go to ${label}"><i aria-hidden="true"></i><span>${label}</span></a></li>`).join('');
    document.body.append(spine);

    const ambientField = document.createElement('div');
    ambientField.className = 'ambient-field';
    ambientField.setAttribute('aria-hidden', 'true');
    ambientField.innerHTML = `
      <svg class="ambient-lines" viewBox="0 0 1440 900" preserveAspectRatio="none" role="presentation">
        <g data-ambient-lines>
          ${Array.from({ length: 14 }, (_, index) => {
            const y = 245 + index * 27;
            const depth = 92 + index * 4;
            return `<path d="M-120 ${y} C 260 ${y - depth}, 520 ${y + depth}, 790 ${y + 18} S 1280 ${y - depth}, 1560 ${y + 8}"></path>`;
          }).join('')}
        </g>
      </svg>
      <span class="ambient-side-waves" data-ambient-waves>${'<i></i>'.repeat(6)}</span>`;
    document.body.prepend(ambientField);

    const kineticField = document.createElement('canvas');
    kineticField.className = 'kinetic-field-canvas';
    kineticField.setAttribute('aria-hidden', 'true');
    kineticField.setAttribute('data-kinetic-field', '');
    document.body.prepend(kineticField);

    const sceneEcho = document.createElement('div');
    sceneEcho.className = 'kinetic-scene-echo';
    sceneEcho.setAttribute('aria-hidden', 'true');
    sceneEcho.setAttribute('data-kinetic-echo', '');
    sceneEcho.innerHTML = '<span data-kinetic-echo-index>01 / 08</span><strong data-kinetic-echo-word>BUILD</strong><i>ARTUR / MOTION SYSTEM</i>';
    document.body.append(sceneEcho);

    const sceneSurge = document.createElement('div');
    sceneSurge.className = 'kinetic-scene-surge';
    sceneSurge.setAttribute('aria-hidden', 'true');
    sceneSurge.setAttribute('data-kinetic-surge', '');
    sceneSurge.innerHTML = '<i></i><strong data-kinetic-surge-word>BUILD</strong><span>SCENE / 01</span>';
    document.body.append(sceneSurge);

    $$('[data-section]:not(.hero)').forEach((section) => {
      const rail = document.createElement('span');
      rail.className = 'motion-section-rail';
      rail.setAttribute('aria-hidden', 'true');
      rail.innerHTML = '<i></i>';
      section.prepend(rail);
    });

    const hero = $('[data-hero]');
    if (hero) {
      const studio = $('.hero-studio', hero);
      if (studio) {
        const matrix = document.createElement('span');
        matrix.className = 'kinetic-matrix';
        matrix.setAttribute('aria-hidden', 'true');
        matrix.setAttribute('data-kinetic-matrix', '');
        matrix.innerHTML = '<i></i>'.repeat(36);
        studio.prepend(matrix);
      }

      const cue = document.createElement('span');
      cue.className = 'motion-scroll-cue';
      cue.setAttribute('aria-hidden', 'true');
      cue.innerHTML = '<i></i><span>Scroll to explore / 01—08</span>';
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

    $$('.outcome-statement, .toolset-stage, .credentials-signal').forEach((panel) => {
      const glow = document.createElement('b');
      glow.className = 'information-glow';
      glow.setAttribute('aria-hidden', 'true');
      panel.append(glow);
    });

    document.body.dataset.motionDecorated = 'true';
  }

  function initializeKineticField() {
    const canvas = $('[data-kinetic-field]');
    const echo = $('[data-kinetic-echo]');
    const echoIndex = $('[data-kinetic-echo-index]');
    const echoWord = $('[data-kinetic-echo-word]');
    const surge = $('[data-kinetic-surge]');
    const surgeWord = $('[data-kinetic-surge-word]');
    const surgeIndex = surge?.querySelector('span');
    const context = canvas?.getContext?.('2d', { alpha: true, desynchronized: true });
    if (!canvas || !context) return () => {};

    const scenes = {
      top: { index: '01 / 08', short: '01', word: 'BUILD', amplitude: 1, frequency: 1 },
      work: { index: '02 / 08', short: '02', word: 'COMMERCE', amplitude: 1.34, frequency: 0.82 },
      'visual-work': { index: '03 / 08', short: '03', word: 'MOTION', amplitude: 1.62, frequency: 1.24 },
      about: { index: '04 / 08', short: '04', word: 'METHOD', amplitude: 0.86, frequency: 1.48 },
      experience: { index: '05 / 08', short: '05', word: 'SYSTEMS', amplitude: 1.12, frequency: 0.68 },
      credentials: { index: '06 / 08', short: '06', word: 'LEARN', amplitude: 0.74, frequency: 1.68 },
      lab: { index: '07 / 08', short: '07', word: 'EXPERIMENT', amplitude: 1.76, frequency: 1.34 },
      contact: { index: '08 / 08', short: '08', word: 'TOGETHER', amplitude: 1.42, frequency: 0.96 }
    };

    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let frame = 0;
    let resizeFrame = 0;
    let pointerIdleTimer = 0;
    let previousTime = 0;
    let phase = 0;
    let scrollTarget = 0;
    let scrollValue = 0;
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let energy = 0.18;
    let active = false;
    let sceneKey = root.dataset.scene && scenes[root.dataset.scene] ? root.dataset.scene : 'top';
    let scene = scenes[sceneKey];
    let previousSceneKey = sceneKey;
    let palette = { red: '#E32636', line: 'rgba(245,245,247,.22)', text: '#F5F5F7', dark: true };
    let pulses = [];
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false, velocity: 0 };
    const listeners = [];

    const listen = (element, type, handler, options) => {
      if (!element) return;
      element.addEventListener(type, handler, options);
      listeners.push(() => element.removeEventListener(type, handler, options));
    };

    const canRun = () => !reducedMotion.matches && !mobileLayout.matches && finePointer.matches;

    const updatePalette = () => {
      const styles = getComputedStyle(root);
      palette = {
        red: styles.getPropertyValue('--red-bright').trim() || '#E32636',
        line: styles.getPropertyValue('--line-strong').trim() || 'rgba(245,245,247,.22)',
        text: styles.getPropertyValue('--text').trim() || '#F5F5F7',
        dark: root.dataset.theme !== 'light'
      };
    };

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      pointer.x ||= width * 0.72;
      pointer.y ||= height * 0.46;
      pointer.targetX ||= pointer.x;
      pointer.targetY ||= pointer.y;
      updatePalette();
    };

    const drawSceneWord = () => {
      const fontSize = Math.min(230, Math.max(92, width * 0.155));
      const x = width * 0.5 - scrollValue * 90;
      const y = height * 0.82 + Math.sin(phase * 0.42) * 16;
      context.save();
      context.globalAlpha = palette.dark ? 0.06 : 0.045;
      context.strokeStyle = energy > 0.68 ? palette.red : palette.text;
      context.lineWidth = 1.15;
      context.font = `760 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      context.textAlign = 'left';
      context.textBaseline = 'alphabetic';
      context.strokeText(scene.word, x, y);
      context.globalAlpha *= 0.42;
      context.strokeText(scene.word, x + 28, y + 32);
      context.restore();
    };

    const drawField = () => {
      const lines = width > 1180 ? 21 : 16;
      const radius = Math.min(width, height) * (0.25 + energy * 0.08);
      const baseAmplitude = (18 + Math.min(44, width * 0.025)) * scene.amplitude * (1 + energy * 0.18);
      const step = width > 1500 ? 48 : 42;

      context.save();
      context.globalCompositeOperation = palette.dark ? 'lighter' : 'source-over';
      for (let line = 0; line < lines; line += 1) {
        const ratio = (line + 1) / (lines + 1);
        const baseY = ratio * height;
        context.beginPath();

        for (let x = -step; x <= width + step; x += step) {
          const waveOne = Math.sin(x * 0.0062 * scene.frequency + phase * 0.72 + line * 0.39);
          const waveTwo = Math.sin(x * 0.0027 - phase * 0.43 + line * 0.72);
          let y = baseY + waveOne * baseAmplitude + waveTwo * baseAmplitude * 0.42;
          y += Math.sin(ratio * Math.PI + scrollValue * Math.PI * 2) * 34 * (ratio - 0.5);

          const deltaX = x - pointer.x;
          const deltaY = y - pointer.y;
          const distance = Math.hypot(deltaX, deltaY);
          const proximity = pointer.active && distance < radius ? 1 - distance / radius : 0;
          const pull = proximity * proximity * (0.2 + energy * 0.16);
          const warpedX = x - deltaX * pull * 0.17;
          y -= deltaY * pull;
          y += Math.sin(distance * 0.038 - phase * 3.1) * proximity * (8 + energy * 16);

          if (x === -step) context.moveTo(warpedX, y);
          else context.lineTo(warpedX, y);
        }

        const accent = line === ((Number(scene.short) * 3) % lines);
        const signalActive = pointer.active || energy > 0.52;
        context.globalAlpha = accent ? (signalActive ? 0.24 + energy * 0.06 : 0.18) : (palette.dark ? 0.15 : 0.1);
        context.strokeStyle = accent && signalActive ? palette.red : palette.line;
        context.lineWidth = accent ? 1.02 : 0.72;
        context.stroke();
      }
      context.restore();
    };

    const drawPulses = () => {
      pulses = pulses.filter((pulse) => pulse.life < 1);
      pulses.forEach((pulse) => {
        pulse.life += 0.035;
        const eased = 1 - Math.pow(1 - pulse.life, 3);
        context.beginPath();
        context.globalAlpha = (1 - pulse.life) * 0.55;
        context.strokeStyle = pulse.accent ? palette.red : palette.text;
        context.lineWidth = 1;
        context.arc(pulse.x, pulse.y, 12 + eased * 170, 0, Math.PI * 2);
        context.stroke();
      });
      context.globalAlpha = 1;
    };

    const render = (time) => {
      frame = requestAnimationFrame(render);
      if (!active || document.hidden || time - previousTime < 33) return;
      previousTime = time;
      phase += 0.018 + energy * 0.006;
      scrollValue += (scrollTarget - scrollValue) * 0.055;
      pointer.x += (pointer.targetX - pointer.x) * 0.095;
      pointer.y += (pointer.targetY - pointer.y) * 0.095;
      pointer.velocity *= 0.9;
      energy += ((pointer.active ? 0.52 : 0.18) - energy) * 0.04;

      context.clearRect(0, 0, width, height);
      drawSceneWord();
      drawField();
      drawPulses();
    };

    const animateScene = (nextKey) => {
      const nextScene = scenes[nextKey] || scenes.top;
      sceneKey = scenes[nextKey] ? nextKey : 'top';
      scene = nextScene;
      if (echoIndex) echoIndex.textContent = scene.index;
      if (echoWord) echoWord.textContent = scene.word;
      if (surgeWord) surgeWord.textContent = scene.word;
      if (surgeIndex) surgeIndex.textContent = `SCENE / ${scene.short}`;
      pulses.push({ x: width * 0.72, y: height * 0.5, life: 0, accent: true });
      energy = Math.max(energy, 0.92);

      if (!canAnimate() || !echo || !surge || previousSceneKey === sceneKey) {
        previousSceneKey = sceneKey;
        return;
      }
      previousSceneKey = sceneKey;
      window.gsap.killTweensOf([echo, echoWord, surge, surgeWord, surge.querySelector('i')]);
      window.gsap.fromTo(echoWord, { autoAlpha: 0, x: 34, skewX: -8 }, {
        autoAlpha: 1, x: 0, skewX: 0, duration: 0.72, ease: 'power3.out', clearProps: 'opacity,visibility,transform'
      });
      window.gsap.timeline()
        .set(surge, { autoAlpha: 1 })
        .fromTo(surgeWord, { xPercent: 42, skewX: -12, scaleX: 0.82 }, { xPercent: -8, skewX: 0, scaleX: 1, duration: 0.82, ease: 'power3.out' }, 0)
        .fromTo(surge.querySelector('i'), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.inOut' }, 0.06)
        .to(surge, { autoAlpha: 0, duration: 0.36, ease: 'power2.out' }, 0.52);
    };

    const updateActivity = () => {
      active = canRun();
      canvas.hidden = !active;
      echo.hidden = !active;
      surge.hidden = !active;
      root.classList.toggle('kinetic-field-ready', active);
      if (active && !frame) frame = requestAnimationFrame(render);
      if (!active) context.clearRect(0, 0, width, height);
    };

    const handlePointerMove = (event) => {
      const deltaX = event.clientX - pointer.targetX;
      const deltaY = event.clientY - pointer.targetY;
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      pointer.velocity = Math.min(1.4, Math.hypot(deltaX, deltaY) / 75);
      pointer.active = true;
      energy = Math.max(energy, 0.42 + pointer.velocity * 0.35);
      window.clearTimeout(pointerIdleTimer);
      pointerIdleTimer = window.setTimeout(() => {
        pointer.active = false;
      }, 520);
    };
    const handlePointerLeave = () => {
      window.clearTimeout(pointerIdleTimer);
      pointer.active = false;
      pointer.targetX = width * 0.72;
      pointer.targetY = height * 0.48;
    };
    const handleScroll = () => {
      const now = performance.now();
      const nextScrollY = window.scrollY;
      const distance = Math.abs(nextScrollY - lastScrollY);
      const elapsed = Math.max(16, now - lastScrollTime);
      const velocity = Math.min(1, distance / elapsed);
      const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollTarget = Math.min(1, Math.max(0, nextScrollY / maximum));
      energy = Math.max(energy, 0.22 + Math.min(0.76, distance / 180 + velocity * 0.28));
      lastScrollY = nextScrollY;
      lastScrollTime = now;
    };
    const handleResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resize();
        updateActivity();
      });
    };
    const handleAttributeChange = () => {
      updatePalette();
      const nextKey = root.dataset.scene && scenes[root.dataset.scene] ? root.dataset.scene : 'top';
      if (nextKey !== sceneKey) animateScene(nextKey);
    };
    const handleVisibility = () => {
      if (!document.hidden && active && !frame) frame = requestAnimationFrame(render);
    };

    const observer = new MutationObserver(handleAttributeChange);
    observer.observe(root, { attributes: true, attributeFilter: ['data-scene', 'data-theme'] });

    listen(document, 'pointermove', handlePointerMove, { passive: true });
    listen(document.documentElement, 'pointerleave', handlePointerLeave, { passive: true });
    listen(window, 'scroll', handleScroll, { passive: true });
    listen(window, 'resize', handleResize, { passive: true });
    listen(document, 'visibilitychange', handleVisibility);
    if ('addEventListener' in reducedMotion) listen(reducedMotion, 'change', updateActivity);
    if ('addEventListener' in mobileLayout) listen(mobileLayout, 'change', updateActivity);
    if ('addEventListener' in finePointer) listen(finePointer, 'change', updateActivity);

    resize();
    handleScroll();
    animateScene(sceneKey);
    updateActivity();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      window.clearTimeout(pointerIdleTimer);
      frame = 0;
      observer.disconnect();
      listeners.splice(0).forEach((remove) => remove());
      context.clearRect(0, 0, width, height);
      root.classList.remove('kinetic-field-ready');
      window.gsap?.killTweensOf([echo, echoWord, surge, surgeWord, surge?.querySelector('i')].filter(Boolean));
    };
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
        if (visibleSection) root.dataset.scene = visibleSection;
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
    const toolset = $('.toolset');
    if (!toolset) return;
    const detailsItems = $$('details', toolset);
    const stageWord = $('[data-toolset-word]', toolset);
    const stageIndex = $('[data-toolset-index]', toolset);
    let activeIndex = -1;

    const disciplineName = (details) => $('summary', details)?.childNodes
      ? [...$('summary', details).childNodes].find((node) => node.nodeType === Node.TEXT_NODE)?.textContent.trim() || 'Discipline'
      : 'Discipline';

    const activate = (details, index) => {
      if (!details || index === activeIndex) return;
      activeIndex = index;
      detailsItems.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === index));
      const nextWord = disciplineName(details).toUpperCase();
      if (stageIndex) stageIndex.textContent = `DISCIPLINE / ${String(index + 1).padStart(2, '0')}`;

      if (!stageWord) return;
      if (canAnimate()) {
        window.gsap.killTweensOf(stageWord);
        window.gsap.to(stageWord, {
          autoAlpha: 0,
          yPercent: -52,
          skewX: -5,
          duration: 0.22,
          ease: 'power2.in',
          onComplete: () => {
            stageWord.textContent = nextWord;
            window.gsap.fromTo(stageWord, { autoAlpha: 0, yPercent: 60, skewX: 6 }, {
              autoAlpha: 1,
              yPercent: 0,
              skewX: 0,
              duration: 0.48,
              ease: 'power3.out',
              clearProps: 'opacity,visibility,transform'
            });
          }
        });
      } else stageWord.textContent = nextWord;
    };

    detailsItems.forEach((details, index) => {
      details.addEventListener('pointerenter', () => activate(details, index), { passive: true });
      details.addEventListener('focusin', () => activate(details, index));
      details.addEventListener('toggle', () => {
        if (!details.open) return;
        activate(details, index);
        if (!canAnimate()) return;
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

    toolset.addEventListener('toolset:activate', (event) => {
      const nextIndex = Number(event.detail?.index);
      if (!Number.isInteger(nextIndex) || !detailsItems[nextIndex]) return;
      activate(detailsItems[nextIndex], nextIndex);
    });

    activate(detailsItems.find((details) => details.open) || detailsItems[0], Math.max(0, detailsItems.findIndex((details) => details.open)));
  }

  function initializeSignatureInteractions() {
    signatureCleanup?.();
    const cleanupTasks = [];
    const surface = $('[data-studio-surface]');
    const selectors = surface ? $$('[data-studio-select]', surface) : [];
    const stateWord = surface ? $('[data-studio-word]', surface) : null;
    const stateIndex = surface ? $('[data-studio-index]', surface) : null;
    const stateCopy = surface ? $('[data-studio-copy]', surface) : null;
    const stateCode = surface ? $('[data-studio-code]', surface) : null;
    const pointerObject = surface ? $('[data-pointer-object]', surface) : null;
    const matrixCells = surface ? $$('.kinetic-matrix i', surface) : [];

    const modes = {
      design: { index: 'MODE / 01', word: 'DESIGN', copy: 'Visual systems with a reason.', code: 'INTERACTIVE / DESIGN' },
      code: { index: 'MODE / 02', word: 'CODE', copy: 'Prototypes built to survive production.', code: 'INTERACTIVE / CODE' },
      motion: { index: 'MODE / 03', word: 'MOTION', copy: 'Movement that explains and guides.', code: 'INTERACTIVE / MOTION' },
      commerce: { index: 'MODE / 04', word: 'COMMERCE', copy: 'Flows connected to customer decisions.', code: 'INTERACTIVE / COMMERCE' }
    };

    let currentMode = surface?.dataset.studioActive || 'design';
    const writeMode = (mode) => {
      const content = modes[mode] || modes.design;
      if (stateWord) stateWord.textContent = content.word;
      if (stateIndex) stateIndex.textContent = content.index;
      if (stateCopy) stateCopy.textContent = content.copy;
      if (stateCode) stateCode.textContent = content.code;
    };

    const activateMode = (mode, animate = true) => {
      if (!surface || !modes[mode]) return;
      const changed = mode !== currentMode;
      currentMode = mode;
      surface.dataset.studioActive = mode;
      selectors.forEach((selector) => selector.setAttribute('aria-pressed', String(selector.dataset.studioSelect === mode)));

      if (!changed || !animate || !canAnimate()) {
        writeMode(mode);
        return;
      }

      const { gsap } = window;
      gsap.killTweensOf([stateWord, stateIndex, stateCopy, stateCode, pointerObject, ...matrixCells].filter(Boolean));
      gsap.to([stateWord, stateCopy].filter(Boolean), {
        autoAlpha: 0,
        yPercent: -34,
        skewX: -5,
        duration: 0.2,
        stagger: 0.03,
        ease: 'power2.in',
        onComplete: () => {
          writeMode(mode);
          gsap.fromTo([stateWord, stateCopy].filter(Boolean), { autoAlpha: 0, yPercent: 45, skewX: 6 }, {
            autoAlpha: 1,
            yPercent: 0,
            skewX: 0,
            duration: 0.48,
            stagger: 0.04,
            ease: 'power3.out',
            clearProps: 'opacity,visibility,transform'
          });
        }
      });
      if (stateIndex) gsap.fromTo(stateIndex, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.42, ease: 'power3.out', clearProps: 'opacity,visibility,transform' });
      if (stateCode) gsap.fromTo(stateCode, { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.42, ease: 'power3.out', clearProps: 'opacity,visibility,transform' });
      if (pointerObject) gsap.fromTo(pointerObject, { scale: 0.94, rotationX: mode === 'motion' ? 5 : -3 }, {
        scale: 1,
        rotationX: 0,
        duration: 0.68,
        ease: 'back.out(1.35)'
      });
      if (matrixCells.length) {
        gsap.fromTo(matrixCells, { scale: 0.88, rotationY: mode === 'code' ? -9 : 7, autoAlpha: 0.16 }, {
          scale: 1,
          rotationY: 0,
          autoAlpha: 0.32,
          duration: 0.58,
          stagger: { each: 0.012, grid: [6, 6], from: mode === 'commerce' ? 'edges' : 'center' },
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility'
        });
      }
    };

    selectors.forEach((selector, index) => {
      const mode = selector.dataset.studioSelect;
      const handlePointer = () => {
        if (finePointer.matches && !reducedMotion.matches) activateMode(mode);
      };
      const handleFocus = () => activateMode(mode);
      const handleClick = () => activateMode(mode);
      const handleKey = (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const backwards = ['ArrowLeft', 'ArrowUp'].includes(event.key);
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? selectors.length - 1 : (index + (backwards ? -1 : 1) + selectors.length) % selectors.length;
        selectors[nextIndex].focus();
        activateMode(selectors[nextIndex].dataset.studioSelect);
      };
      selector.addEventListener('pointerenter', handlePointer, { passive: true });
      selector.addEventListener('focus', handleFocus);
      selector.addEventListener('click', handleClick);
      selector.addEventListener('keydown', handleKey);
      cleanupTasks.push(() => {
        selector.removeEventListener('pointerenter', handlePointer);
        selector.removeEventListener('focus', handleFocus);
        selector.removeEventListener('click', handleClick);
        selector.removeEventListener('keydown', handleKey);
      });
    });

    if (surface) {
      const handleSurfacePress = (event) => {
        if (!finePointer.matches || reducedMotion.matches || event.button !== 0 || event.target.closest('button, a, input')) return;
        const bounds = surface.getBoundingClientRect();
        const impact = document.createElement('span');
        impact.className = 'studio-impact';
        impact.setAttribute('aria-hidden', 'true');
        impact.style.left = `${event.clientX - bounds.left}px`;
        impact.style.top = `${event.clientY - bounds.top}px`;
        impact.addEventListener('animationend', () => impact.remove(), { once: true });
        surface.append(impact);
        if (canAnimate() && pointerObject) {
          window.gsap.fromTo(pointerObject, { scale: 0.96 }, {
            scale: 1.035,
            duration: 0.18,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut',
            onComplete: () => window.gsap.set(pointerObject, { scale: 1 })
          });
        }
      };
      surface.addEventListener('pointerdown', handleSurfacePress);
      cleanupTasks.push(() => surface.removeEventListener('pointerdown', handleSurfacePress));
    }

    writeMode(currentMode);

    signatureCleanup = () => {
      cleanupTasks.forEach((cleanup) => cleanup());
      $$('.studio-impact').forEach((impact) => impact.remove());
    };
  }

  function initializeSitewideInteractions() {
    sitewideCleanup?.();
    const cleanupTasks = [];
    const listen = (element, type, handler, options) => {
      if (!element) return;
      element.addEventListener(type, handler, options);
      cleanupTasks.push(() => element.removeEventListener(type, handler, options));
    };
    const revealText = (element, text, direction = 1) => {
      if (!element || element.textContent === text) return;
      element.textContent = text;
      if (!canAnimate()) return;
      window.gsap.fromTo(element, { autoAlpha: 0, x: 12 * direction, skewX: 4 * direction }, {
        autoAlpha: 1,
        x: 0,
        skewX: 0,
        duration: 0.44,
        ease: 'power3.out',
        overwrite: true,
        clearProps: 'opacity,visibility,transform'
      });
    };
    const bindRovingKeys = (items, index, event, activate) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return false;
      event.preventDefault();
      const backwards = ['ArrowLeft', 'ArrowUp'].includes(event.key);
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (backwards ? -1 : 1) + items.length) % items.length;
      items[nextIndex].focus();
      activate(nextIndex);
      return true;
    };

    const ambientLines = $('[data-ambient-lines]');
    const ambientWaves = $('[data-ambient-waves]');
    if (ambientLines && ambientWaves && canAnimate() && finePointer.matches && !mobileLayout.matches) {
      const lineX = window.gsap.quickTo(ambientLines, 'x', { duration: 0.95, ease: 'power3.out' });
      const lineY = window.gsap.quickTo(ambientLines, 'y', { duration: 0.95, ease: 'power3.out' });
      const lineScaleY = window.gsap.quickTo(ambientLines, 'scaleY', { duration: 1.05, ease: 'power3.out' });
      const waveX = window.gsap.quickTo(ambientWaves, 'x', { duration: 1.2, ease: 'power3.out' });
      const waveY = window.gsap.quickTo(ambientWaves, 'y', { duration: 1.2, ease: 'power3.out' });
      const handleAmbientMove = (event) => {
        const x = event.clientX / Math.max(1, window.innerWidth) - 0.5;
        const y = event.clientY / Math.max(1, window.innerHeight) - 0.5;
        lineX(x * -34);
        lineY(y * 28);
        lineScaleY(1 + y * 0.13);
        waveX(x * -46);
        waveY(y * 34);
      };
      listen(document, 'pointermove', handleAmbientMove, { passive: true });
      cleanupTasks.push(() => {
        window.gsap.killTweensOf([ambientLines, ambientWaves]);
        window.gsap.set([ambientLines, ambientWaves], { clearProps: 'x,y,scaleY' });
      });
    }

    cleanupTasks.push(createTextMorphController($('[data-section-morph]'), 2200));

    const bikeGallery = $('[data-biketech-gallery]');
    const bikeButtons = $$('[data-biketech-focus]', $('[data-biketech-controls]') || document);
    const bikeReadout = $('[data-biketech-readout]');
    const bikeModes = {
      before: '01 / BEFORE — EARLIER STOREFRONT',
      after: '02 / AFTER — PREMIUM CATALOGUE',
      mobile: '03 / MOBILE — PRODUCT DISCOVERY'
    };
    const activateBike = (mode) => {
      if (!bikeGallery || !bikeModes[mode]) return;
      bikeGallery.dataset.biketechActive = mode;
      bikeButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.biketechFocus === mode)));
      revealText(bikeReadout, bikeModes[mode], mode === 'before' ? -1 : 1);
    };
    bikeButtons.forEach((button, index) => {
      const activate = () => activateBike(button.dataset.biketechFocus);
      const handlePointer = () => { if (finePointer.matches && !reducedMotion.matches) activate(); };
      const handleKey = (event) => bindRovingKeys(bikeButtons, index, event, (nextIndex) => activateBike(bikeButtons[nextIndex].dataset.biketechFocus));
      listen(button, 'pointerenter', handlePointer, { passive: true });
      listen(button, 'focus', activate);
      listen(button, 'click', activate);
      listen(button, 'keydown', handleKey);
    });
    activateBike(bikeGallery?.dataset.biketechActive || 'after');

    const galleryButtons = $$('[data-gallery-focus]', $('[data-gallery-console]') || document);
    const galleryTiles = $$('[data-gallery-kind]', $('[data-gallery-grid]') || document);
    const galleryGrid = $('[data-gallery-grid]');
    const galleryReadout = $('[data-gallery-readout]');
    const coverPosition = $('[data-coverflow-position]');
    const coverPrevious = $('[data-coverflow-previous]');
    const coverNext = $('[data-coverflow-next]');
    const galleryModes = {
      all: 'VIEW / ALL — 11 SELECTED PIECES',
      design: 'VIEW / DESIGN — 05 SELECTED PIECES',
      ai: 'VIEW / AI MOTION — 03 SELECTED PIECES',
      reel: 'VIEW / REELS — 03 SELECTED PIECES'
    };
    let galleryMode = 'all';
    let coverIndex = 0;
    let filteredTiles = galleryTiles;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragPointer = null;
    let dragShift = 0;
    let suppressCoverClick = false;

    const renderCoverflow = () => {
      if (!galleryGrid || !filteredTiles.length) return;
      coverIndex = (coverIndex + filteredTiles.length) % filteredTiles.length;
      const stageWidth = galleryGrid.clientWidth || window.innerWidth;
      const step = mobileLayout.matches ? Math.min(178, stageWidth * 0.46) : Math.min(310, Math.max(178, stageWidth * 0.235));

      galleryTiles.forEach((tile) => {
        const position = filteredTiles.indexOf(tile);
        const trigger = $('[data-viewer-item]', tile);
        if (position < 0) {
          tile.classList.add('cover-hidden');
          tile.classList.remove('cover-current', 'cover-near', 'cover-far');
          tile.inert = true;
          if (trigger) trigger.tabIndex = -1;
          return;
        }

        let offset = position - coverIndex;
        if (offset > filteredTiles.length / 2) offset -= filteredTiles.length;
        if (offset < -filteredTiles.length / 2) offset += filteredTiles.length;
        const distance = Math.abs(offset);
        const visible = distance <= 2;
        tile.classList.toggle('cover-hidden', !visible);
        tile.classList.toggle('cover-current', offset === 0);
        tile.classList.toggle('cover-near', distance === 1);
        tile.classList.toggle('cover-far', distance === 2);
        tile.inert = !visible;
        tile.style.setProperty('--cover-x', `${Math.round(offset * step)}px`);
        tile.style.setProperty('--cover-y', `${Math.round(distance * (mobileLayout.matches ? 15 : 24))}px`);
        tile.style.setProperty('--cover-z', `${Math.round(distance * -170)}px`);
        tile.style.setProperty('--cover-rotate', `${offset * (mobileLayout.matches ? -11 : -19)}deg`);
        tile.style.setProperty('--cover-rotate-z', `${offset * (mobileLayout.matches ? 1 : 1.8)}deg`);
        tile.style.setProperty('--cover-scale', String(Math.max(0.68, 1 - distance * (mobileLayout.matches ? 0.14 : 0.12))));
        tile.style.setProperty('--cover-opacity', String(distance === 0 ? 1 : distance === 1 ? 0.62 : 0.24));
        tile.style.setProperty('--cover-z-index', String(20 - distance));
        if (trigger) {
          trigger.tabIndex = offset === 0 ? 0 : -1;
        }
      });

      const activeTile = filteredTiles[coverIndex];
      const activeTrigger = activeTile ? $('[data-viewer-item]', activeTile) : null;
      if (coverPosition) coverPosition.textContent = `${String(coverIndex + 1).padStart(2, '0')} / ${String(filteredTiles.length).padStart(2, '0')}`;
      if (activeTrigger) revealText(galleryReadout, `${String(coverIndex + 1).padStart(2, '0')} / ${activeTrigger.dataset.mediaTitle.toUpperCase()} — ${activeTrigger.dataset.mediaCategory.toUpperCase()}`);
      if (coverPrevious) coverPrevious.disabled = filteredTiles.length < 2;
      if (coverNext) coverNext.disabled = filteredTiles.length < 2;
    };

    const moveCoverflow = (direction) => {
      if (!filteredTiles.length) return;
      coverIndex = (coverIndex + direction + filteredTiles.length) % filteredTiles.length;
      renderCoverflow();
    };

    const activateGallery = (mode) => {
      if (!galleryModes[mode]) return;
      galleryMode = mode;
      filteredTiles = mode === 'all' ? galleryTiles : galleryTiles.filter((tile) => tile.dataset.galleryKind === mode);
      coverIndex = 0;
      galleryButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.galleryFocus === mode)));
      galleryTiles.forEach((tile) => tile.classList.remove('is-muted', 'is-focused'));
      renderCoverflow();
    };
    galleryButtons.forEach((button, index) => {
      const activate = () => activateGallery(button.dataset.galleryFocus);
      const handleKey = (event) => bindRovingKeys(galleryButtons, index, event, (nextIndex) => activateGallery(galleryButtons[nextIndex].dataset.galleryFocus));
      listen(button, 'click', activate);
      listen(button, 'focus', activate);
      listen(button, 'keydown', handleKey);
    });
    galleryTiles.forEach((tile) => {
      const trigger = $('[data-viewer-item]', tile);
      if (!trigger) return;
      const mediaWidth = Number(trigger.dataset.mediaWidth || 1);
      const mediaHeight = Number(trigger.dataset.mediaHeight || 1);
      tile.style.setProperty('--media-ratio', `${mediaWidth} / ${mediaHeight}`);
    });
    listen(coverPrevious, 'click', () => moveCoverflow(-1));
    listen(coverNext, 'click', () => moveCoverflow(1));
    listen(galleryGrid, 'keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveCoverflow(-1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); moveCoverflow(1); }
      else if (event.key === 'Home') { event.preventDefault(); coverIndex = 0; renderCoverflow(); }
      else if (event.key === 'End') { event.preventDefault(); coverIndex = filteredTiles.length - 1; renderCoverflow(); }
    });
    listen(galleryGrid, 'click', (event) => {
      const tile = event.target.closest('[data-gallery-kind]');
      if (!tile || tile.classList.contains('cover-current')) {
        if (suppressCoverClick) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      const nextIndex = filteredTiles.indexOf(tile);
      if (nextIndex < 0) return;
      event.preventDefault();
      event.stopPropagation();
      coverIndex = nextIndex;
      renderCoverflow();
    }, true);
    listen(galleryGrid, 'pointerdown', (event) => {
      if (event.button !== 0) return;
      dragPointer = event.pointerId;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragShift = 0;
      galleryGrid.classList.add('is-dragging');
      galleryGrid.setPointerCapture?.(event.pointerId);
    });
    listen(galleryGrid, 'pointermove', (event) => {
      if (dragPointer !== event.pointerId) return;
      dragShift = event.clientX - dragStartX;
      if (Math.abs(dragShift) > 4) galleryGrid.style.setProperty('--drag-shift', `${Math.max(-90, Math.min(90, dragShift * 0.34))}px`);
    }, { passive: true });
    const finishCoverDrag = (event) => {
      if (dragPointer === null || (event.pointerId != null && event.pointerId !== dragPointer)) return;
      const deltaX = event.clientX == null ? dragShift : event.clientX - dragStartX;
      const deltaY = event.clientY == null ? 0 : event.clientY - dragStartY;
      galleryGrid.releasePointerCapture?.(dragPointer);
      dragPointer = null;
      galleryGrid.classList.remove('is-dragging');
      galleryGrid.style.setProperty('--drag-shift', '0px');
      if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY)) {
        suppressCoverClick = true;
        moveCoverflow(deltaX < 0 ? 1 : -1);
        setTimeout(() => { suppressCoverClick = false; }, 0);
      }
    };
    listen(galleryGrid, 'pointerup', finishCoverDrag);
    listen(galleryGrid, 'pointercancel', finishCoverDrag);
    let coverResizeFrame = 0;
    const handleCoverResize = () => {
      cancelAnimationFrame(coverResizeFrame);
      coverResizeFrame = requestAnimationFrame(renderCoverflow);
    };
    listen(window, 'resize', handleCoverResize, { passive: true });
    cleanupTasks.push(() => cancelAnimationFrame(coverResizeFrame));
    activateGallery('all');

    const methodConstellation = $('[data-method-constellation]');
    const methodItems = $$('.method-list li');
    const methodWord = $('[data-method-word]');
    const methodIndex = $('[data-method-index]');
    const activateMethod = (index) => {
      const item = methodItems[index];
      if (!item || !methodConstellation) return;
      methodConstellation.dataset.methodActive = String(index);
      methodItems.forEach((step, stepIndex) => {
        step.classList.toggle('is-current', stepIndex === index);
        step.setAttribute('aria-pressed', String(stepIndex === index));
      });
      if (methodIndex) methodIndex.textContent = `METHOD / ${String(index + 1).padStart(2, '0')}`;
      revealText(methodWord, $('h3', item)?.textContent.toUpperCase() || 'METHOD', index % 2 ? 1 : -1);
    };
    methodItems.forEach((item, index) => {
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-pressed', 'false');
      const activate = () => activateMethod(index);
      const handlePointer = () => { if (finePointer.matches && !reducedMotion.matches) activate(); };
      const handleKey = (event) => {
        if (bindRovingKeys(methodItems, index, event, activateMethod)) return;
        if (!['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        activate();
      };
      listen(item, 'pointerenter', handlePointer, { passive: true });
      listen(item, 'focus', activate);
      listen(item, 'click', activate);
      listen(item, 'keydown', handleKey);
    });
    activateMethod(0);

    const toolset = $('.toolset');
    const experienceItems = $$('[data-experience-step]');
    const experienceWord = $('[data-experience-word]');
    const experienceIndex = $('[data-experience-index]');
    const activateExperience = (index) => {
      const item = experienceItems[index];
      if (!item) return;
      experienceItems.forEach((entry, entryIndex) => {
        entry.classList.toggle('is-current', entryIndex === index);
        entry.setAttribute('aria-pressed', String(entryIndex === index));
      });
      if (experienceIndex) experienceIndex.textContent = `ROLE / ${String(index + 1).padStart(2, '0')}`;
      revealText(experienceWord, item.dataset.experienceWord || 'ROLE', index % 2 ? 1 : -1);
      toolset?.dispatchEvent(new CustomEvent('toolset:activate', { detail: { index: Number(item.dataset.experienceTool || 0) } }));
    };
    experienceItems.forEach((item, index) => {
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-pressed', 'false');
      const activate = () => activateExperience(index);
      const handlePointer = () => { if (finePointer.matches && !reducedMotion.matches) activate(); };
      const handleKey = (event) => {
        if (bindRovingKeys(experienceItems, index, event, activateExperience)) return;
        if (!['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        activate();
      };
      listen(item, 'pointerenter', handlePointer, { passive: true });
      listen(item, 'focus', activate);
      listen(item, 'click', activate);
      listen(item, 'keydown', handleKey);
    });
    activateExperience(0);

    const credentialItems = $$('.education-list article[data-credential-word], .language-list article[data-credential-word]');
    const credentialWord = $('[data-credential-word]', $('.credentials-signal') || document);
    const credentialIndex = $('[data-credential-index]');
    const credentialCopy = $('[data-credential-copy]', $('.credentials-signal') || document);
    const activateCredential = (index) => {
      const item = credentialItems[index];
      if (!item) return;
      credentialItems.forEach((entry, entryIndex) => {
        entry.classList.toggle('is-current', entryIndex === index);
        entry.setAttribute('aria-pressed', String(entryIndex === index));
      });
      if (credentialIndex) credentialIndex.textContent = `SELECT / ${String(index + 1).padStart(2, '0')}`;
      revealText(credentialWord, item.dataset.credentialWord, index % 2 ? 1 : -1);
      revealText(credentialCopy, item.dataset.credentialCopy || 'Selected credential', index % 2 ? -1 : 1);
    };
    credentialItems.forEach((item, index) => {
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-pressed', 'false');
      const activate = () => activateCredential(index);
      const handlePointer = () => { if (finePointer.matches && !reducedMotion.matches) activate(); };
      const handleKey = (event) => {
        if (bindRovingKeys(credentialItems, index, event, activateCredential)) return;
        if (!['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        activate();
      };
      listen(item, 'pointerenter', handlePointer, { passive: true });
      listen(item, 'focus', activate);
      listen(item, 'click', activate);
      listen(item, 'keydown', handleKey);
    });
    activateCredential(0);

    $$('.outcome-statement, .toolset-stage, .credentials-signal').forEach((panel) => {
      let panelBounds = null;
      const activateGlow = () => {
        panelBounds = panel.getBoundingClientRect();
        panel.classList.add('is-glow-active');
      };
      const moveGlow = (event) => {
        if (!panelBounds) activateGlow();
        panel.style.setProperty('--glow-x', `${Math.round(event.clientX - panelBounds.left)}px`);
        panel.style.setProperty('--glow-y', `${Math.round(event.clientY - panelBounds.top)}px`);
      };
      const deactivateGlow = () => {
        panelBounds = null;
        panel.classList.remove('is-glow-active');
      };
      listen(panel, 'pointerenter', activateGlow, { passive: true });
      listen(panel, 'pointermove', moveGlow, { passive: true });
      listen(panel, 'pointerleave', deactivateGlow, { passive: true });
      listen(panel, 'focusin', activateGlow);
      listen(panel, 'focusout', deactivateGlow);
      cleanupTasks.push(() => {
        panel.classList.remove('is-glow-active');
        panel.style.removeProperty('--glow-x');
        panel.style.removeProperty('--glow-y');
      });
    });

    const contact = $('.contact');
    const contactWaves = $('[data-contact-waves]');
    if (contact && contactWaves && canAnimate() && !mobileLayout.matches) {
      let contactBounds = null;
      const moveX = window.gsap.quickTo(contactWaves, 'x', { duration: 0.8, ease: 'power3.out' });
      const moveY = window.gsap.quickTo(contactWaves, 'y', { duration: 0.8, ease: 'power3.out' });
      const cacheBounds = () => { contactBounds = contact.getBoundingClientRect(); };
      const handleMove = (event) => {
        if (!contactBounds) cacheBounds();
        const x = (event.clientX - contactBounds.left) / Math.max(1, contactBounds.width) - 0.5;
        const y = (event.clientY - contactBounds.top) / Math.max(1, contactBounds.height) - 0.5;
        moveX(x * 42);
        moveY(y * 28);
      };
      const reset = () => { contactBounds = null; moveX(0); moveY(0); };
      listen(contact, 'pointerenter', cacheBounds, { passive: true });
      listen(contact, 'pointermove', handleMove, { passive: true });
      listen(contact, 'pointerleave', reset, { passive: true });
      listen(window, 'resize', cacheBounds, { passive: true });
      cleanupTasks.push(() => {
        window.gsap.killTweensOf(contactWaves);
        window.gsap.set(contactWaves, { clearProps: 'x,y' });
      });
    }
    if (contact && !reducedMotion.matches) {
      const handleContactPress = (event) => {
        if (event.button !== 0 || event.target.closest('a, button')) return;
        const bounds = contact.getBoundingClientRect();
        const impact = document.createElement('span');
        impact.className = 'contact-impact';
        impact.setAttribute('aria-hidden', 'true');
        impact.style.left = `${event.clientX - bounds.left}px`;
        impact.style.top = `${event.clientY - bounds.top}px`;
        impact.addEventListener('animationend', () => impact.remove(), { once: true });
        contact.append(impact);
        if (canAnimate()) {
          window.gsap.fromTo($$('i', contactWaves), { scale: 0.95 }, {
            scale: 1,
            duration: 0.7,
            stagger: 0.045,
            ease: 'elastic.out(1, 0.55)',
            clearProps: 'scale'
          });
        }
      };
      listen(contact, 'pointerdown', handleContactPress);
    }

    sitewideCleanup = () => {
      cleanupTasks.forEach((cleanup) => cleanup());
      $$('.contact-impact').forEach((impact) => impact.remove());
    };
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

    const handleReducedMotion = () => {
      if (reducedMotion.matches) {
        scrambleTargets.forEach((element) => { element.textContent = element.dataset.scrambleText; });
      }
    };
    if ('addEventListener' in reducedMotion) reducedMotion.addEventListener('change', handleReducedMotion);
    cleanupTasks.push(createTextMorphController($('[data-text-morph]'), 2500));

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
    const geometry = $('.hero-geometry', object);
    const grid = $('[data-field-layer="grid"]', object);
    const orbitA = $('[data-field-layer="orbit-a"]', object);
    const orbitB = $('[data-field-layer="orbit-b"]', object);
    const particles = $('[data-field-layer="particles"]', object);
    const moveX = geometry ? window.gsap.quickTo(geometry, 'x', { duration: 0.8, ease: 'power3.out' }) : null;
    const moveY = geometry ? window.gsap.quickTo(geometry, 'y', { duration: 0.8, ease: 'power3.out' }) : null;
    const rotate = geometry ? window.gsap.quickTo(geometry, 'rotation', { duration: 1, ease: 'power3.out' }) : null;
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
      moveX?.(x * 18);
      moveY?.(y * 14);
      rotate?.(x * 2.2);
      gridX?.(x * -18);
      gridY?.(y * -18);
      orbitARotate?.(x * 12 + y * 4);
      orbitBRotate?.(x * -9 + y * -5);
      particlesX?.(x * 34);
      particlesY?.(y * 30);
    };
    const reset = () => {
      moveX?.(0);
      moveY?.(0);
      rotate?.(0);
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
      window.gsap?.set(geometry, { clearProps: 'x,y,rotation' });
      window.gsap?.set([grid, orbitA, orbitB, particles].filter(Boolean), { clearProps: 'x,y,rotation' });
    };
  }

  function initializeInteractiveMotion() {
    interactionCleanup?.();
    interactionCleanup = null;
    if (!canAnimate() || !finePointer.matches || mobileLayout.matches) return;

    const { gsap } = window;
    const cleanupTasks = [];

    const matrix = $('[data-kinetic-matrix]');
    const matrixHost = matrix?.closest('.hero-studio');
    if (matrix && matrixHost) {
      const cells = $$('i', matrix);
      let cellCenters = [];
      let matrixFrame = 0;
      let pointerX = 0;
      let pointerY = 0;

      const cacheCellCenters = () => {
        cellCenters = cells.map((cell) => {
          const bounds = cell.getBoundingClientRect();
          return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
        });
      };

      const renderMatrix = () => {
        cells.forEach((cell, index) => {
          const center = cellCenters[index];
          if (!center) return;
          const dx = pointerX - center.x;
          const dy = pointerY - center.y;
          const influence = Math.max(0, 1 - Math.hypot(dx, dy) / 220);
          const lift = influence * -12;
          const rotation = Math.max(-5, Math.min(5, dx * 0.025)) * influence;
          cell.style.transform = `translate3d(0, ${lift}px, ${influence * 30}px) scale(${1 + influence * 0.085}) rotateY(${rotation}deg)`;
          cell.style.opacity = String(0.26 + influence * 0.68);
          cell.style.borderColor = influence > 0.56 ? 'var(--red)' : '';
        });
        matrixFrame = 0;
      };

      const handleMatrixMove = (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!matrixFrame) matrixFrame = requestAnimationFrame(renderMatrix);
      };

      const resetMatrix = () => {
        cancelAnimationFrame(matrixFrame);
        matrixFrame = 0;
        cells.forEach((cell) => {
          cell.style.removeProperty('transform');
          cell.style.removeProperty('opacity');
          cell.style.removeProperty('border-color');
        });
      };

      matrixHost.addEventListener('pointerenter', cacheCellCenters, { passive: true });
      matrixHost.addEventListener('pointermove', handleMatrixMove, { passive: true });
      matrixHost.addEventListener('pointerleave', resetMatrix, { passive: true });
      window.addEventListener('resize', cacheCellCenters, { passive: true });
      cleanupTasks.push(() => {
        matrixHost.removeEventListener('pointerenter', cacheCellCenters);
        matrixHost.removeEventListener('pointermove', handleMatrixMove);
        matrixHost.removeEventListener('pointerleave', resetMatrix);
        window.removeEventListener('resize', cacheCellCenters);
        resetMatrix();
      });
    }

    const dynamicWeight = $('[data-dynamic-weight]');
    const weightCharacters = dynamicWeight ? $$('.weight-char', dynamicWeight) : [];
    if (dynamicWeight && weightCharacters.length) {
      const baseWeight = 540;
      const peakWeight = 760;
      let resizeFrame = 0;

      const writeWeight = (character, value) => {
        const rounded = Math.round(value);
        character.style.setProperty('--dynamic-weight', String(rounded));
        character.style.fontWeight = String(rounded);
        character.style.fontVariationSettings = `"wght" ${rounded}`;
      };

      const reserveWeightGeometry = () => {
        weightCharacters.forEach((character) => {
          character.style.removeProperty('--weight-slot');
          writeWeight(character, peakWeight);
        });
        const slots = weightCharacters.map((character) => Math.ceil(character.getBoundingClientRect().width * 100) / 100);
        weightCharacters.forEach((character, index) => {
          writeWeight(character, baseWeight);
          character.style.setProperty('--weight-slot', `${slots[index]}px`);
        });
      };

      const playWeightWave = () => {
        gsap.killTweensOf(weightCharacters);
        weightCharacters.forEach((character) => writeWeight(character, baseWeight));
        gsap.to(weightCharacters, {
          fontWeight: peakWeight,
          fontVariationSettings: `"wght" ${peakWeight}`,
          duration: 0.34,
          stagger: { each: 0.035, from: 'start', yoyo: true, repeat: 1 },
          ease: 'power2.inOut',
          onComplete: () => {
            weightCharacters.forEach((character) => writeWeight(character, baseWeight));
          }
        });
      };

      const handleWeightResize = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(reserveWeightGeometry);
      };

      reserveWeightGeometry();
      dynamicWeight.addEventListener('pointerenter', playWeightWave, { passive: true });
      window.addEventListener('resize', handleWeightResize, { passive: true });
      cleanupTasks.push(() => {
        cancelAnimationFrame(resizeFrame);
        dynamicWeight.removeEventListener('pointerenter', playWeightWave);
        window.removeEventListener('resize', handleWeightResize);
        gsap.killTweensOf(weightCharacters);
        weightCharacters.forEach((character) => {
          character.style.removeProperty('--dynamic-weight');
          character.style.removeProperty('--weight-slot');
          character.style.removeProperty('font-weight');
          character.style.removeProperty('font-variation-settings');
        });
      });
    }

    const surfaces = $$('.project-screen, .creative-tile > button');

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
        .from('.kinetic-matrix i', { autoAlpha: 0, scale: 0.76, rotationX: 12, duration: 0.7, stagger: { each: 0.012, grid: [6, 6], from: 'center' } }, 1.02)
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

        [
          ['.project-switchboard a', '.project-switchboard', desktop ? 46 : 20],
          ['.biketech-focusbar > *', '.biketech-focusbar', desktop ? -34 : -16],
          ['.creative-console > *', '.creative-console', desktop ? 38 : 18],
          ['.experience-readout > *', '.experience-readout', desktop ? -38 : -18],
          ['.credentials-signal > *', '.credentials-signal', desktop ? 34 : 16],
          ['.contact-instruction', '.contact-layout', desktop ? 26 : 12]
        ].forEach(([targets, trigger, offset], groupIndex) => {
          if (!$(trigger)) return;
          gsap.from(targets, {
            autoAlpha: 0,
            x: groupIndex % 2 ? -offset : offset,
            clipPath: groupIndex % 2 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
            duration: desktop ? 0.76 : 0.54,
            stagger: desktop ? 0.08 : 0.05,
            ease: 'power3.out',
            scrollTrigger: { trigger, start: 'top 88%', once: true }
          });
        });

        gsap.fromTo('[data-kinetic-belt-track]', {
          xPercent: desktop ? -6 : -2
        }, {
          xPercent: desktop ? -38 : -22,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-kinetic-belt]',
            start: 'top bottom',
            end: 'bottom top',
            scrub: desktop ? 0.55 : 0.28
          }
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
          clearProps: 'opacity,visibility,transform,clip-path',
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

        gsap.from('.creative-grid', {
          autoAlpha: 0,
          y: desktop ? 70 : 30,
          rotationX: desktop ? 7 : 0,
          transformOrigin: '50% 100%',
          clipPath: 'inset(0 0 100% 0 round 8px)',
          duration: desktop ? 0.9 : 0.62,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform,clip-path',
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
          duration: 1.3,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: '[data-timeline]', start: 'top 82%', once: true }
        });
        gsap.from('[data-timeline] article', {
          autoAlpha: 0,
          y: desktop ? 42 : 26,
          clipPath: 'inset(0 0 100% 0)',
          duration: desktop ? 0.86 : 0.62,
          stagger: desktop ? 0.16 : 0.11,
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

        gsap.from('[data-method-path]', {
          strokeDasharray: 1,
          strokeDashoffset: 1,
          duration: 1.3,
          stagger: 0.16,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: '[data-method-constellation]', start: 'top 86%', once: true }
        });

        gsap.from('[data-method-dot]', {
          autoAlpha: 0,
          scale: 0,
          transformOrigin: 'center',
          duration: 0.52,
          stagger: 0.1,
          delay: 0.3,
          ease: 'back.out(1.8)',
          scrollTrigger: { trigger: '[data-method-constellation]', start: 'top 86%', once: true }
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

        gsap.from('.toolset-stage', {
          autoAlpha: 0,
          scale: desktop ? 0.94 : 0.98,
          clipPath: 'inset(0 100% 0 0)',
          duration: 0.88,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.toolset', start: 'top 86%', once: true }
        });

        gsap.from('.toolset-stage span', {
          yPercent: 74,
          skewX: 7,
          duration: 0.82,
          delay: 0.18,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.toolset', start: 'top 86%', once: true }
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

        gsap.from('.contact-wave-field i', {
          autoAlpha: 0,
          scale: 0.72,
          rotation: (index) => index % 2 ? -18 : 18,
          transformOrigin: 'center',
          duration: desktop ? 1.1 : 0.72,
          stagger: 0.09,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.contact', start: 'top 84%', once: true }
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

          gsap.to('.contact-wave-field', {
            rotation: 8,
            scale: 1.08,
            ease: 'none',
            scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: 0.6 }
          });

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
          $$('.method-list li').forEach((item) => item.classList.remove('is-current'));
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
      signatureCleanup?.();
      signatureCleanup = null;
      sitewideCleanup?.();
      sitewideCleanup = null;
      destroyMotion();
      initializeSignatureInteractions();
      initializeSitewideInteractions();
      if (!reducedMotion.matches) initializeMotion();
    };
    if ('addEventListener' in reducedMotion) reducedMotion.addEventListener('change', handleMotionPreference);
    else if ('addListener' in reducedMotion) reducedMotion.addListener(handleMotionPreference);

    window.addEventListener('pagehide', () => {
      fieldCleanup?.();
      fieldCleanup = null;
      kineticCleanup?.();
      kineticCleanup = null;
      signatureCleanup?.();
      signatureCleanup = null;
      sitewideCleanup?.();
      sitewideCleanup = null;
      destroyMotion();
    }, { once: true });
  }

  prepareTextReveals();
  prepareHeroWords();
  prepareDynamicWeightText();
  prepareMotionDecorations();
  initializeTheme();
  initializeProfileAvatar();
  initializeNavigation();
  initializeCaseStudies();
  initializeToolsetInteractions();
  initializeSignatureInteractions();
  initializeSitewideInteractions();
  fieldCleanup = initializeKineticField();
  initializeComparisons();
  initializeKineticDetails();
  initializeInlineMedia();
  initializeMediaViewer();
  initializeMotion();
  initializeVisibilityHandling();

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
