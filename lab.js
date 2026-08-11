(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const viewer = $('[data-lab-viewer]');
  const stage = $('[data-lab-stage]');
  if (!viewer || !stage) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const title = $('[data-lab-title]', viewer);
  const category = $('[data-lab-category]', viewer);
  const description = $('[data-lab-description]', viewer);
  const instruction = $('[data-lab-instruction]', viewer);
  const tech = $('[data-lab-tech]', viewer);
  const closeButton = $('.lab-viewer-close', viewer);
  const inertSurfaces = [$('header.site-header'), $('main'), $('footer.site-footer'), $('[data-media-viewer]')].filter(Boolean);
  let returnFocus = null;
  let cleanupExperiment = () => {};

  const experiments = {
    network: {
      category: 'Canvas / Data field',
      title: 'Global Network',
      description: 'A live particle map that turns pointer movement into a local force field while route signals travel between cities.',
      instruction: 'Move the pointer across the map',
      tech: 'Canvas 2D · Particles · Pointer physics',
      build: buildNetworkExperiment
    },
    freight: {
      category: 'Motion / Interactive mechanics',
      title: 'Kinetic Freight',
      description: 'A compact logistics scene whose vehicle, container and progress system share one controllable motion timeline.',
      instruction: 'Drag the route control',
      tech: 'DOM · CSS transforms · requestAnimationFrame',
      build: buildFreightExperiment
    },
    air: {
      category: 'Spatial UI / Architecture',
      title: 'Architectural Air',
      description: 'A high-key spatial composition made from repeated facade fins, monumental type and pointer-directed perspective.',
      instruction: 'Move the pointer to rotate the structure',
      tech: 'CSS 3D · Pointer choreography · DOM',
      build: buildAirExperiment
    },
    depth: {
      category: 'Editorial / Parallax',
      title: 'Editorial Depth',
      description: 'Art direction and real portfolio media become a layered editorial composition with responsive depth.',
      instruction: 'Move or drag to shift the layers',
      tech: 'CSS perspective · Local media · Parallax',
      build: buildDepthExperiment
    },
    webgl: {
      category: 'WebGL / Shader study',
      title: 'WebGL Sculpture',
      description: 'A real-time raymarched sculpture rendered by a custom GLSL fragment shader with pointer and palette input.',
      instruction: 'Move the pointer and choose a palette',
      tech: 'WebGL · GLSL · Raymarching',
      build: buildWebGLExperiment
    },
    type: {
      category: 'Generative type / Signal lab',
      title: 'Type Signal Lab',
      description: 'A typography system splits, scans and recolors one word while a generative line field follows the pointer.',
      instruction: 'Move the pointer and switch the signal color',
      tech: 'Canvas 2D · Generative type · Palette state',
      build: buildTypeExperiment
    }
  };

  const listen = (target, type, handler, options) => {
    target?.addEventListener(type, handler, options);
    return () => target?.removeEventListener(type, handler, options);
  };

  const animateViewerIn = () => {
    if (!window.gsap || reducedMotion.matches) {
      closeButton?.focus({ preventScroll: true });
      return;
    }
    window.gsap.timeline()
      .fromTo($('.lab-viewer-backdrop', viewer), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.26, ease: 'power2.out' }, 0)
      .fromTo($('.lab-viewer-panel', viewer), { autoAlpha: 0, y: 30, scale: 0.97, rotationX: 3 }, {
        autoAlpha: 1, y: 0, scale: 1, rotationX: 0, duration: 0.5, ease: 'power3.out'
      }, 0.03)
      .fromTo($('.lab-demo', stage), { autoAlpha: 0, scale: 0.96, clipPath: 'inset(7% 7% 7% 7%)' }, {
        autoAlpha: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.62, ease: 'power3.out'
      }, 0.12)
      .call(() => closeButton?.focus({ preventScroll: true }), null, 0.56);
  };

  const clearStage = () => {
    cleanupExperiment();
    cleanupExperiment = () => {};
    stage.replaceChildren();
    delete stage.dataset.experiment;
  };

  const openExperiment = (trigger) => {
    const key = trigger.dataset.labOpen;
    const experiment = experiments[key];
    if (!experiment) return;

    returnFocus = trigger;
    clearStage();
    if (category) category.textContent = experiment.category;
    if (title) title.textContent = experiment.title;
    if (description) description.textContent = experiment.description;
    if (instruction) instruction.textContent = experiment.instruction;
    if (tech) tech.textContent = experiment.tech;
    stage.dataset.experiment = key;
    viewer.hidden = false;
    document.body.classList.add('lab-open');
    inertSurfaces.forEach((surface) => { surface.inert = true; });
    cleanupExperiment = experiment.build(stage) || (() => {});
    animateViewerIn();
  };

  const closeExperiment = () => {
    if (viewer.hidden) return;
    const finish = () => {
      viewer.hidden = true;
      document.body.classList.remove('lab-open');
      inertSurfaces.forEach((surface) => { surface.inert = false; });
      clearStage();
      returnFocus?.focus({ preventScroll: true });
      returnFocus = null;
    };

    if (window.gsap && !reducedMotion.matches) {
      window.gsap.to($('.lab-viewer-panel', viewer), {
        autoAlpha: 0, y: 18, scale: 0.99, duration: 0.24, ease: 'power2.inOut', onComplete: finish
      });
    } else {
      finish();
    }
  };

  const focusableElements = () => $$('button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])', viewer)
    .filter((element) => !element.hidden && element.offsetParent !== null);

  $$('[data-lab-open]').forEach((trigger) => trigger.addEventListener('click', () => openExperiment(trigger)));
  $$('[data-lab-close]', viewer).forEach((control) => control.addEventListener('click', closeExperiment));

  viewer.addEventListener('keydown', (event) => {
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
    closeExperiment();
  });

  function buildNetworkExperiment(container) {
    const demo = document.createElement('div');
    demo.className = 'lab-demo demo-network';
    demo.innerHTML = `
      <canvas aria-hidden="true"></canvas>
      <span class="lab-demo-label">GLOBAL ROUTE FIELD / 01</span>
      <span class="demo-network-status">LIVE / 073 NODES</span>
      <span class="demo-network-ui demo-network-ui-left">NEW YORK<br>LOS ANGELES<br>SAO PAULO<br>ROTTERDAM<br>HAMBURG<br>PORTO ALEGRE</span>
      <span class="demo-network-ui demo-network-ui-right">AIR FREIGHT<br>OCEAN FREIGHT<br>GROUND ROUTE<br>CUSTOMS<br>WAREHOUSING<br>PROJECT CARGO</span>`;
    container.append(demo);

    const canvas = $('canvas', demo);
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!context) return () => {};

    const regions = [
      [0.20, 0.31, 0.16, 0.10], [0.31, 0.39, 0.10, 0.08], [0.33, 0.62, 0.07, 0.19],
      [0.49, 0.31, 0.08, 0.06], [0.53, 0.51, 0.09, 0.17], [0.66, 0.34, 0.19, 0.10],
      [0.75, 0.46, 0.13, 0.08], [0.80, 0.67, 0.09, 0.07], [0.86, 0.58, 0.04, 0.04]
    ];
    const routePairs = [
      [[0.22, 0.34], [0.50, 0.31]], [[0.50, 0.31], [0.72, 0.38]], [[0.33, 0.62], [0.80, 0.67]],
      [[0.22, 0.34], [0.33, 0.62]], [[0.53, 0.51], [0.72, 0.38]], [[0.80, 0.67], [0.72, 0.38]]
    ];
    let width = 1;
    let height = 1;
    let ratio = 1;
    let points = [];
    let frame = 0;
    let previousTime = 0;
    const pointer = { x: -1000, y: -1000, active: false };

    const mapPoint = ([x, y]) => ({ x: width * (0.16 + x * 0.68), y: height * (0.16 + y * 0.68) });
    const insideLand = (x, y) => regions.some(([cx, cy, rx, ry]) => (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) <= 1);

    const rebuild = () => {
      const rect = demo.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      points = [];
      const columns = Math.max(58, Math.floor(width / 12));
      const rows = Math.max(34, Math.floor(height / 12));
      for (let row = 0; row <= rows; row += 1) {
        for (let column = 0; column <= columns; column += 1) {
          const x = column / columns;
          const y = row / rows;
          if (!insideLand(x, y)) continue;
          const seed = Math.sin((column + 1) * 12.9898 + (row + 1) * 78.233) * 43758.5453;
          const jitter = seed - Math.floor(seed);
          const mapped = mapPoint([x, y]);
          points.push({ x: mapped.x + (jitter - 0.5) * 4, y: mapped.y + (0.5 - jitter) * 3, phase: jitter * Math.PI * 2 });
        }
      }
    };

    const quadraticPoint = (start, control, end, t) => {
      const inverse = 1 - t;
      return {
        x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
        y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y
      };
    };

    const draw = (time = 0) => {
      context.fillStyle = '#020202';
      context.fillRect(0, 0, width, height);
      const seconds = time * 0.001;

      for (const point of points) {
        const deltaX = point.x - pointer.x;
        const deltaY = point.y - pointer.y;
        const distance = Math.hypot(deltaX, deltaY);
        const force = pointer.active && distance < 115 ? (1 - distance / 115) ** 2 : 0;
        const x = point.x + (distance ? deltaX / distance : 0) * force * 25;
        const y = point.y + (distance ? deltaY / distance : 0) * force * 25;
        context.globalAlpha = 0.16 + Math.sin(seconds * 0.8 + point.phase) * 0.035;
        context.fillStyle = '#d9d9df';
        context.fillRect(x, y, 1.35, 1.35);
      }

      context.globalAlpha = 1;
      routePairs.forEach((pair, index) => {
        const start = mapPoint(pair[0]);
        const end = mapPoint(pair[1]);
        const control = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - Math.abs(end.x - start.x) * 0.16 - 24 };
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.quadraticCurveTo(control.x, control.y, end.x, end.y);
        context.strokeStyle = index % 3 === 0 ? 'rgba(24,54,255,.58)' : 'rgba(255,255,255,.13)';
        context.lineWidth = index % 3 === 0 ? 1.2 : 0.7;
        context.stroke();
        const progress = reducedMotion.matches ? 0.56 : (seconds * (0.12 + index * 0.006) + index * 0.16) % 1;
        const pulse = quadraticPoint(start, control, end, progress);
        context.beginPath();
        context.arc(pulse.x, pulse.y, index % 2 === 0 ? 4.2 : 2.7, 0, Math.PI * 2);
        context.fillStyle = index % 2 === 0 ? '#1836ff' : '#ff5a16';
        context.shadowColor = context.fillStyle;
        context.shadowBlur = 14;
        context.fill();
        context.shadowBlur = 0;
      });
      context.globalAlpha = 1;
    };

    const render = (time) => {
      if (document.hidden) {
        frame = requestAnimationFrame(render);
        return;
      }
      if (time - previousTime >= 33) {
        previousTime = time;
        draw(time);
      }
      frame = requestAnimationFrame(render);
    };
    const handlePointer = (event) => {
      const rect = demo.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };
    const clearPointer = () => { pointer.active = false; };
    const resizeObserver = new ResizeObserver(rebuild);
    resizeObserver.observe(demo);
    const removeMove = listen(demo, 'pointermove', handlePointer, { passive: true });
    const removeLeave = listen(demo, 'pointerleave', clearPointer, { passive: true });
    rebuild();
    draw(performance.now());
    if (!reducedMotion.matches) frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      removeMove();
      removeLeave();
    };
  }

  function buildFreightExperiment(container) {
    const demo = document.createElement('div');
    demo.className = 'lab-demo demo-freight';
    demo.innerHTML = `
      <span class="demo-freight-grid" aria-hidden="true"></span>
      <span class="lab-demo-label">ROUTE MECHANICS / 02</span>
      <strong class="demo-freight-copy"><span>MOVE</span>THE OUTCOME.</strong>
      <span class="demo-freight-route" aria-hidden="true"></span>
      <span class="demo-freight-container" aria-hidden="true"></span>
      <span class="demo-freight-vehicle" aria-hidden="true"><i></i><i></i></span>
      <label class="demo-freight-control"><span>ORIGIN / 000</span><input type="range" min="0" max="100" value="18" aria-label="Move the freight along the route"><span>DESTINATION / 100</span></label>`;
    container.append(demo);
    const control = $('input', demo);
    let progress = 0.18;
    let direction = 1;
    let frame = 0;
    let previousTime = performance.now();
    let userControlled = false;

    const paint = () => {
      demo.style.setProperty('--freight-vehicle-left', `${(5 + progress * 62).toFixed(2)}%`);
      demo.style.setProperty('--freight-container-left', `${(20 + progress * 44).toFixed(2)}%`);
      demo.style.setProperty('--freight-container-bottom', `${(35 + progress * 18).toFixed(2)}%`);
      demo.style.setProperty('--freight-container-lift', `${(-progress * 60).toFixed(2)}px`);
      demo.style.setProperty('--freight-container-rotation', `${((progress - 0.5) * 4).toFixed(2)}deg`);
      control.value = String(Math.round(progress * 100));
    };
    const handleInput = () => {
      userControlled = true;
      progress = Number(control.value) / 100;
      paint();
    };
    const render = (time) => {
      if (!document.hidden && !userControlled) {
        const delta = Math.min(48, time - previousTime) / 1000;
        progress += delta * 0.105 * direction;
        if (progress >= 0.92) { progress = 0.92; direction = -1; }
        if (progress <= 0.08) { progress = 0.08; direction = 1; }
        paint();
      }
      previousTime = time;
      frame = requestAnimationFrame(render);
    };
    const removeInput = listen(control, 'input', handleInput);
    const removeChange = listen(control, 'change', () => {
      window.setTimeout(() => { userControlled = false; }, 1200);
    });
    paint();
    if (!reducedMotion.matches) frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      removeInput();
      removeChange();
    };
  }

  function buildAirExperiment(container) {
    const demo = document.createElement('div');
    demo.className = 'lab-demo demo-air';
    const fins = Array.from({ length: 28 }, (_, index) => `<i style="--fin-top:${(index * 3.25).toFixed(2)}%;--fin-width:${(36 + index * 2.15).toFixed(2)}%;--fin-depth:${index * 2}px;--fin-rotation:${(index * 5.2).toFixed(2)}deg"></i>`).join('');
    demo.innerHTML = `
      <span class="lab-demo-label">SPATIAL FACADE / 03</span>
      <span class="demo-air-heading">THE ARCHITECTURE<br>OF NEW INTERACTIONS</span>
      <span class="demo-air-letters" aria-hidden="true"><i>A</i><i>I</i><i>R</i></span>
      <span class="demo-air-ribbon" aria-hidden="true">${fins}</span>
      <span class="demo-air-note">POINTER / ROTATES THE STRUCTURE</span>`;
    container.append(demo);
    let frame = 0;
    const rotation = { x: -7, y: 5, targetX: -7, targetY: 5 };
    const paint = () => {
      demo.style.setProperty('--air-x', `${rotation.x.toFixed(2)}deg`);
      demo.style.setProperty('--air-y', `${rotation.y.toFixed(2)}deg`);
    };
    const handlePointer = (event) => {
      const rect = demo.getBoundingClientRect();
      rotation.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 34;
      rotation.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * -22;
      if (reducedMotion.matches) {
        rotation.x = rotation.targetX;
        rotation.y = rotation.targetY;
        paint();
      }
    };
    const render = () => {
      if (!document.hidden) {
        rotation.x += (rotation.targetX - rotation.x) * 0.075;
        rotation.y += (rotation.targetY - rotation.y) * 0.075;
        paint();
      }
      frame = requestAnimationFrame(render);
    };
    const removeMove = listen(demo, 'pointermove', handlePointer, { passive: true });
    paint();
    if (!reducedMotion.matches) frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      removeMove();
    };
  }

  function buildDepthExperiment(container) {
    const demo = document.createElement('div');
    demo.className = 'lab-demo demo-depth';
    demo.innerHTML = `
      <span class="lab-demo-label">EDITORIAL PARALLAX / 04</span>
      <strong class="demo-depth-title">DEPTH<br>IN MOTION</strong>
      <i class="demo-depth-card" aria-hidden="true"></i>
      <i class="demo-depth-card" aria-hidden="true"></i>
      <i class="demo-depth-card" aria-hidden="true"></i>
      <span class="demo-depth-meta">LOCAL MEDIA / THREE LAYERS / LIVE DEPTH</span>`;
    container.append(demo);
    const cards = $$('.demo-depth-card', demo);
    const rates = [-0.15, 0.24, -0.34];
    const depths = [28, 56, 84];
    const rotations = [-5, 7, -9];
    const paint = (x, y) => {
      cards.forEach((card, index) => {
        card.style.transform = `translate3d(${(x * rates[index]).toFixed(1)}px, ${(y * rates[index]).toFixed(1)}px, ${depths[index]}px) rotate(${rotations[index]}deg)`;
      });
    };
    const handlePointer = (event) => {
      const rect = demo.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 90;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 70;
      paint(x, y);
    };
    const reset = () => paint(0, 0);
    const removeMove = listen(demo, 'pointermove', handlePointer, { passive: true });
    const removeLeave = listen(demo, 'pointerleave', reset, { passive: true });
    reset();
    return () => {
      removeMove();
      removeLeave();
    };
  }

  function buildWebGLExperiment(container) {
    const demo = document.createElement('div');
    demo.className = 'lab-demo demo-webgl';
    demo.innerHTML = `
      <canvas aria-label="Interactive WebGL sculpture"></canvas>
      <span class="lab-demo-label">REAL-TIME SHADER / 05</span>
      <span class="demo-webgl-copy"><strong>FORM</strong><span>RAYMARCHED / POINTER REACTIVE</span></span>
      <span class="demo-webgl-palette" role="group" aria-label="Sculpture palette">
        <button type="button" style="--palette:#1836ff" aria-label="Use electric blue palette" aria-pressed="true" data-palette="0"></button>
        <button type="button" style="--palette:#e32636" aria-label="Use signal red palette" aria-pressed="false" data-palette="1"></button>
        <button type="button" style="--palette:#00d8a0" aria-label="Use mint palette" aria-pressed="false" data-palette="2"></button>
        <button type="button" style="--palette:#d5afbd" aria-label="Use rose palette" aria-pressed="false" data-palette="3"></button>
      </span>`;
    container.append(demo);
    const canvas = $('canvas', demo);
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' });
    if (!gl) {
      demo.classList.add('is-fallback');
      demo.insertAdjacentHTML('beforeend', '<p class="lab-webgl-fallback">WebGL is unavailable. The static poster remains the fallback for this device.</p>');
      return () => {};
    }

    const vertexSource = `
      attribute vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `;
    const fragmentSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;
      uniform vec3 u_accent;

      mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c,-s,s,c); }
      float sdBox(vec3 p, vec3 b) {
        vec3 q = abs(p) - b;
        return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
      }
      float sdTorus(vec3 p, vec2 t) {
        vec2 q = vec2(length(p.xz) - t.x, p.y);
        return length(q) - t.y;
      }
      float mapScene(vec3 p) {
        p.xy *= rot(0.28 * sin(u_time * 0.22) + (u_mouse.y - 0.5) * 0.45);
        p.xz *= rot(u_time * 0.13 + (u_mouse.x - 0.5) * 0.7);
        vec3 twist = p;
        twist.xz *= rot(twist.y * 0.78 + u_time * 0.11);
        float torus = sdTorus(twist, vec2(0.94, 0.23));
        vec3 boxP = p;
        boxP.xy *= rot(0.78);
        float box = sdBox(boxP, vec3(0.58, 0.58, 0.58)) - 0.055;
        return max(torus, -box);
      }
      vec3 normalAt(vec3 p) {
        vec2 e = vec2(0.0018, 0.0);
        return normalize(vec3(
          mapScene(p + e.xyy) - mapScene(p - e.xyy),
          mapScene(p + e.yxy) - mapScene(p - e.yxy),
          mapScene(p + e.yyx) - mapScene(p - e.yyx)
        ));
      }
      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        vec3 ro = vec3(0.0, 0.0, 3.65);
        vec3 rd = normalize(vec3(uv, -2.0));
        float distanceTravelled = 0.0;
        float hit = 0.0;
        vec3 p = ro;
        for (int i = 0; i < 82; i++) {
          p = ro + rd * distanceTravelled;
          float distanceScene = mapScene(p);
          if (distanceScene < 0.0015) { hit = 1.0; break; }
          if (distanceTravelled > 7.0) break;
          distanceTravelled += distanceScene * 0.72;
        }
        vec3 background = mix(vec3(0.015), vec3(0.055, 0.06, 0.075), 0.5 + 0.5 * uv.y);
        vec3 color = background;
        if (hit > 0.5) {
          vec3 normal = normalAt(p);
          vec3 light = normalize(vec3(-0.5, 0.8, 0.65));
          float diffuse = max(dot(normal, light), 0.0);
          float rim = pow(1.0 - max(dot(normal, -rd), 0.0), 2.5);
          float bands = 0.5 + 0.5 * sin((p.y + p.x * 0.25) * 19.0 - u_time * 0.8);
          color = vec3(0.12) + diffuse * vec3(0.78);
          color += u_accent * (rim * 1.35 + bands * 0.12);
          color *= 0.86 + 0.14 * normal.y;
        }
        float glow = 0.012 / max(0.012, abs(mapScene(ro + rd * min(distanceTravelled, 3.6))));
        color += u_accent * glow * 0.022;
        color = pow(color, vec3(0.9));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message || 'Shader compilation failed');
      }
      return shader;
    };

    let program;
    let vertexShader;
    let fragmentShader;
    try {
      vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
      fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Program linking failed');
    } catch (error) {
      demo.classList.add('is-fallback');
      if (program) gl.deleteProgram(program);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      demo.insertAdjacentHTML('beforeend', '<p class="lab-webgl-fallback">The live shader could not start. A static fallback is shown instead.</p>');
      return () => {};
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const accentLocation = gl.getUniformLocation(program, 'u_accent');
    const palettes = [[0.094,0.212,1.0], [0.89,0.149,0.212], [0.0,0.847,0.627], [0.835,0.686,0.741]];
    const pointer = { x: 0.52, y: 0.48, targetX: 0.52, targetY: 0.48 };
    let paletteIndex = 0;
    let width = 1;
    let height = 1;
    let frame = 0;
    let start = performance.now();

    const resize = () => {
      const rect = demo.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, Math.round(rect.width * ratio));
      height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    const draw = (time) => {
      resize();
      pointer.x += (pointer.targetX - pointer.x) * 0.075;
      pointer.y += (pointer.targetY - pointer.y) * 0.075;
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, width, height);
      gl.uniform2f(mouseLocation, pointer.x, pointer.y);
      gl.uniform1f(timeLocation, reducedMotion.matches ? 2.4 : (time - start) / 1000);
      gl.uniform3fv(accentLocation, palettes[paletteIndex]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const render = (time) => {
      if (!document.hidden) draw(time);
      frame = requestAnimationFrame(render);
    };
    const handlePointer = (event) => {
      const rect = demo.getBoundingClientRect();
      pointer.targetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      pointer.targetY = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      if (reducedMotion.matches) draw(performance.now());
    };
    const paletteButtons = $$('[data-palette]', demo);
    const paletteRemovers = paletteButtons.map((button) => listen(button, 'click', () => {
      paletteIndex = Number(button.dataset.palette) || 0;
      paletteButtons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
      draw(performance.now());
    }));
    const removeMove = listen(demo, 'pointermove', handlePointer, { passive: true });
    draw(performance.now());
    if (!reducedMotion.matches) frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      removeMove();
      paletteRemovers.forEach((remove) => remove());
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }

  function buildTypeExperiment(container) {
    const demo = document.createElement('div');
    demo.className = 'lab-demo demo-type';
    demo.innerHTML = `
      <canvas aria-hidden="true"></canvas>
      <span class="lab-demo-label">GENERATIVE TYPE FIELD / 06</span>
      <span class="demo-type-scan" aria-hidden="true"></span>
      <span class="demo-type-word" aria-hidden="true"><i>SIGNAL</i><i>SIGNAL</i><i>SIGNAL</i></span>
      <span class="demo-type-index">POINTER / SPLITS THE SIGNAL</span>
      <span class="demo-type-palette" role="group" aria-label="Typography signal color">
        <button type="button" style="--palette:#e32636" aria-label="Use red signal" aria-pressed="true" data-type-color="#e32636"></button>
        <button type="button" style="--palette:#1836ff" aria-label="Use blue signal" aria-pressed="false" data-type-color="#1836ff"></button>
        <button type="button" style="--palette:#00d8a0" aria-label="Use mint signal" aria-pressed="false" data-type-color="#00d8a0"></button>
        <button type="button" style="--palette:#d5afbd" aria-label="Use rose signal" aria-pressed="false" data-type-color="#d5afbd"></button>
      </span>`;
    container.append(demo);
    const canvas = $('canvas', demo);
    const context = canvas.getContext('2d', { alpha: true, desynchronized: true });
    const buttons = $$('[data-type-color]', demo);
    let accent = '#e32636';
    let width = 1;
    let height = 1;
    let ratio = 1;
    let frame = 0;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const paintTypeOffsets = () => {
      const normalizedX = (pointer.x / width) - 0.5;
      const normalizedY = (pointer.y / height) - 0.5;
      demo.style.setProperty('--type-outline-x', `${(normalizedX * -20).toFixed(2)}px`);
      demo.style.setProperty('--type-outline-y', `${(normalizedY * -14).toFixed(2)}px`);
      demo.style.setProperty('--type-solid-x', `${(normalizedX * 12).toFixed(2)}px`);
      demo.style.setProperty('--type-solid-y', `${(normalizedY * 18).toFixed(2)}px`);
      demo.style.setProperty('--type-accent-x', `${(normalizedX * 30).toFixed(2)}px`);
      demo.style.setProperty('--type-accent-y', `${(normalizedY * -24).toFixed(2)}px`);
      demo.style.setProperty('--type-scan-x', `${(normalizedX * width * 0.42).toFixed(2)}px`);
    };

    const resize = () => {
      const rect = demo.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      ratio = Math.min(window.devicePixelRatio || 1, 1.35);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = (time = 0) => {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = 'lighter';
      const rows = 19;
      for (let row = 0; row < rows; row += 1) {
        const baseY = (row + 1) / (rows + 1) * height;
        context.beginPath();
        for (let x = -20; x <= width + 20; x += 24) {
          const distance = Math.hypot(x - pointer.x, baseY - pointer.y);
          const force = Math.max(0, 1 - distance / Math.min(width, height) * 2.2);
          const wave = Math.sin(x * 0.012 + row * 0.54 + time * 0.0011) * (8 + force * 38);
          const y = baseY + wave + (baseY - pointer.y) * force * -0.16;
          if (x === -20) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.globalAlpha = row % 6 === 0 ? 0.36 : 0.11;
        context.strokeStyle = row % 6 === 0 ? accent : '#a0a0a8';
        context.lineWidth = row % 6 === 0 ? 1.2 : 0.7;
        context.stroke();
      }
      context.restore();
    };
    const render = (time) => {
      if (!document.hidden) {
        pointer.x += (pointer.targetX - pointer.x) * 0.08;
        pointer.y += (pointer.targetY - pointer.y) * 0.08;
        paintTypeOffsets();
        draw(time);
      }
      frame = requestAnimationFrame(render);
    };
    const handlePointer = (event) => {
      const rect = demo.getBoundingClientRect();
      pointer.targetX = event.clientX - rect.left;
      pointer.targetY = event.clientY - rect.top;
      if (reducedMotion.matches) {
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
        paintTypeOffsets();
        draw(performance.now());
      }
    };
    const buttonRemovers = buttons.map((button) => listen(button, 'click', () => {
      accent = button.dataset.typeColor || '#e32636';
      demo.style.setProperty('--type-accent', accent);
      buttons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
      draw(performance.now());
    }));
    const resizeObserver = new ResizeObserver(() => {
      resize();
      pointer.x ||= width * 0.5;
      pointer.y ||= height * 0.5;
      pointer.targetX ||= pointer.x;
      pointer.targetY ||= pointer.y;
      paintTypeOffsets();
      draw(performance.now());
    });
    resizeObserver.observe(demo);
    const removeMove = listen(demo, 'pointermove', handlePointer, { passive: true });
    resize();
    pointer.x = pointer.targetX = width * 0.5;
    pointer.y = pointer.targetY = height * 0.5;
    draw(performance.now());
    if (!reducedMotion.matches) frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      removeMove();
      buttonRemovers.forEach((remove) => remove());
    };
  }

  if (finePointer.matches && !reducedMotion.matches) {
    $$('[data-lab-open]').forEach((button) => {
      let frame = 0;
      const handlePointer = (event) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = button.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          button.style.setProperty('--lab-pointer-x', x.toFixed(3));
          button.style.setProperty('--lab-pointer-y', y.toFixed(3));
        });
      };
      button.addEventListener('pointermove', handlePointer, { passive: true });
    });
  }

  window.addEventListener('pagehide', () => {
    cleanupExperiment();
    cleanupExperiment = () => {};
  }, { once: true });
})();
