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
    flow: {
      category: 'Canvas / Vector field',
      title: 'Flow Field',
      description: 'A particle system continuously redraws itself from a mathematical direction field and local pointer forces.',
      instruction: 'Move to bend the field · Press to regenerate',
      tech: 'Canvas 2D · Flow field · Particle integration',
      build: buildFlowExperiment
    },
    attractor: {
      category: 'Generative systems / Chaos',
      title: 'Strange Attractor',
      description: 'Multiple trajectories solve the Lorenz system in real time and project its chaotic structure into a navigable drawing.',
      instruction: 'Move to rotate the system · Press to reseed',
      tech: 'Canvas 2D · Lorenz equations · 3D projection',
      build: buildAttractorExperiment
    },
    reaction: {
      category: 'Simulation / Emergent pattern',
      title: 'Reaction Diffusion',
      description: 'A compact Gray–Scott simulation grows organic structures from the points you introduce into the field.',
      instruction: 'Drag across the field to seed a reaction',
      tech: 'Canvas 2D · Gray–Scott model · Typed arrays',
      build: buildReactionExperiment
    },
    webgl: {
      category: 'WebGL / Shader study',
      title: 'Shader Sculpture',
      description: 'A real-time raymarched sculpture rendered by a custom GLSL fragment shader with direct 360-degree orbit control.',
      instruction: 'Drag to orbit in 360 degrees · Wheel or pinch to zoom',
      tech: 'WebGL · GLSL · Raymarching',
      build: buildWebGLExperiment
    },
    type: {
      category: 'Kinetic typography / Signal field',
      title: 'Type Signal',
      description: 'A responsive typographic system separates a single word into depth, rhythm and interference layers.',
      instruction: 'Move across the field and change the signal',
      tech: 'Canvas 2D · CSS transforms · Generative typography',
      build: buildTypeExperiment
    },
    network: {
      category: 'Data field / Connected particles',
      title: 'Route Network',
      description: 'A live route map turns a connected particle field into a navigable information landscape.',
      instruction: 'Move through the nodes to bend the network',
      tech: 'Canvas 2D · Particle field · Spatial routing',
      build: buildNetworkExperiment
    },
    air: {
      category: 'Spatial interface / CSS 3D',
      title: 'Spatial Ribbon',
      description: 'A layered structural ribbon translates pointer position into dimensional rotation and architectural depth.',
      instruction: 'Move or drag to rotate the structure',
      tech: 'CSS 3D · Pointer input · Spatial choreography',
      build: buildAirExperiment
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

  function buildFlowExperiment(container) {
    const demo = document.createElement('div');
    demo.className = 'lab-demo demo-flow';
    demo.innerHTML = `
      <canvas aria-label="Interactive particle flow field"></canvas>
      <span class="lab-demo-label">VECTOR FIELD / 01</span>
      <span class="demo-flow-status" data-flow-status>FIELD / 0000</span>
      <span class="demo-flow-note">MOVE / BEND<br>PRESS / REGENERATE</span>`;
    container.append(demo);

    const canvas = $('canvas', demo);
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
    const status = $('[data-flow-status]', demo);
    if (!context) return () => {};

    let width = 1;
    let height = 1;
    let ratio = 1;
    let particles = [];
    let frame = 0;
    let previousTime = 0;
    let fieldSeed = Math.random() * 40;
    const pointer = { x: -1000, y: -1000, active: false };

    const resetParticle = (particle, randomAge = true) => {
      particle.x = Math.random() * width;
      particle.y = Math.random() * height;
      particle.previousX = particle.x;
      particle.previousY = particle.y;
      particle.age = randomAge ? Math.random() * particle.life : 0;
    };

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
      const compact = width < 700 || (navigator.hardwareConcurrency || 4) <= 4;
      const particleCount = compact ? 300 : 820;
      particles = Array.from({ length: particleCount }, (_, index) => {
        const particle = { x: 0, y: 0, previousX: 0, previousY: 0, age: 0, life: 120 + Math.random() * 240, speed: 0.7 + Math.random() * 1.25, tone: index % 19 === 0 };
        resetParticle(particle);
        return particle;
      });
      context.fillStyle = '#050505';
      context.fillRect(0, 0, width, height);
      if (status) status.textContent = `FIELD / ${String(particleCount).padStart(4, '0')}`;
    };

    const draw = (time = 0) => {
      context.fillStyle = 'rgba(5,5,5,.085)';
      context.fillRect(0, 0, width, height);
      const seconds = time * 0.00018;
      for (const particle of particles) {
        particle.previousX = particle.x;
        particle.previousY = particle.y;
        const nx = particle.x / Math.max(width, 1);
        const ny = particle.y / Math.max(height, 1);
        let angle = Math.sin(nx * 8.2 + fieldSeed + Math.cos(ny * 4.5)) * 1.45
          + Math.cos(ny * 7.1 - fieldSeed * 0.72 + Math.sin(nx * 5.3)) * 1.1
          + seconds;
        const deltaX = particle.x - pointer.x;
        const deltaY = particle.y - pointer.y;
        const distance = Math.hypot(deltaX, deltaY);
        if (pointer.active && distance < 150) {
          const influence = (1 - distance / 150) * 2.1;
          angle += Math.atan2(deltaY, deltaX) * influence + Math.PI * 0.52;
        }
        particle.x += Math.cos(angle) * particle.speed;
        particle.y += Math.sin(angle) * particle.speed;
        particle.age += 1;
        if (particle.x < -8 || particle.x > width + 8 || particle.y < -8 || particle.y > height + 8 || particle.age > particle.life) {
          resetParticle(particle, false);
          continue;
        }
        context.beginPath();
        context.moveTo(particle.previousX, particle.previousY);
        context.lineTo(particle.x, particle.y);
        context.strokeStyle = particle.tone && pointer.active ? 'rgba(227,38,54,.72)' : 'rgba(245,245,247,.29)';
        context.lineWidth = particle.tone ? 0.9 : 0.55;
        context.stroke();
      }
    };

    const render = (time) => {
      if (!document.hidden && time - previousTime > 22) {
        previousTime = time;
        draw(time);
      }
      frame = requestAnimationFrame(render);
    };
    const setPointer = (event) => {
      const rect = demo.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
      if (reducedMotion.matches) draw(performance.now());
    };
    const regenerate = (event) => {
      setPointer(event);
      fieldSeed = Math.random() * 40;
      particles.forEach((particle) => resetParticle(particle));
      context.fillStyle = '#050505';
      context.fillRect(0, 0, width, height);
      draw(performance.now());
    };
    const clearPointer = () => { pointer.active = false; };
    const resizeObserver = new ResizeObserver(rebuild);
    resizeObserver.observe(demo);
    const removeMove = listen(demo, 'pointermove', setPointer, { passive: true });
    const removeDown = listen(demo, 'pointerdown', regenerate);
    const removeLeave = listen(demo, 'pointerleave', clearPointer, { passive: true });
    rebuild();
    draw(performance.now());
    if (!reducedMotion.matches) frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      removeMove();
      removeDown();
      removeLeave();
    };
  }

  function buildAttractorExperiment(container) {
    const demo = document.createElement('div');
    demo.className = 'lab-demo demo-attractor';
    demo.innerHTML = `
      <canvas aria-label="Interactive Lorenz strange attractor"></canvas>
      <span class="lab-demo-label">LORENZ SYSTEM / 02</span>
      <span class="demo-attractor-equation">σ = 10<br>ρ = 28<br>β = 8/3</span>
      <span class="demo-attractor-note">CHAOS / DETERMINISTIC<br>FORM / UNREPEATED</span>`;
    container.append(demo);
    const canvas = $('canvas', demo);
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!context) return () => {};

    let width = 1;
    let height = 1;
    let ratio = 1;
    let frame = 0;
    let previousTime = 0;
    let paths = [];
    let interacting = false;
    const view = { yaw: -0.34, pitch: -0.08, targetYaw: -0.34, targetPitch: -0.08 };

    const integrate = (point, dt = 0.005) => {
      const dx = 10 * (point.y - point.x);
      const dy = point.x * (28 - point.z) - point.y;
      const dz = point.x * point.y - (8 / 3) * point.z;
      point.x += dx * dt;
      point.y += dy * dt;
      point.z += dz * dt;
    };
    const reseed = () => {
      const pathCount = width < 700 ? 3 : 5;
      const pointCount = width < 700 ? 900 : 1450;
      paths = Array.from({ length: pathCount }, (_, pathIndex) => {
        const point = {
          x: 0.1 + Math.random() * 0.08 + pathIndex * 0.016,
          y: Math.random() * 0.04,
          z: Math.random() * 0.04
        };
        for (let index = 0; index < 1100 + pathIndex * 45; index += 1) integrate(point);
        const path = [];
        for (let index = 0; index < pointCount; index += 1) {
          integrate(point);
          integrate(point);
          path.push({ x: point.x, y: point.y, z: point.z });
        }
        return path;
      });
    };
    const resize = () => {
      const rect = demo.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      reseed();
    };
    const project = (x, y, z) => {
      const cy = Math.cos(view.yaw);
      const sy = Math.sin(view.yaw);
      const cp = Math.cos(view.pitch);
      const sp = Math.sin(view.pitch);
      const rotatedX = x * cy - y * sy;
      const depth = x * sy + y * cy;
      const rotatedY = (z - 25) * cp - depth * sp;
      const scale = Math.min(width, height) * 0.0172;
      return { x: width * 0.5 + rotatedX * scale, y: height * 0.5 - rotatedY * scale };
    };
    const draw = () => {
      context.fillStyle = '#050505';
      context.fillRect(0, 0, width, height);
      view.yaw += (view.targetYaw - view.yaw) * 0.055;
      view.pitch += (view.targetPitch - view.pitch) * 0.055;
      paths.forEach((path, index) => {
        context.beginPath();
        path.forEach((source, pointIndex) => {
          const point = project(source.x, source.y, source.z);
          if (pointIndex === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        });
        const isSignalPath = index === paths.length - 1 && interacting;
        context.strokeStyle = isSignalPath ? 'rgba(227,38,54,.62)' : `rgba(245,245,247,${0.12 + index * 0.055})`;
        context.lineWidth = isSignalPath ? 0.95 : 0.52 + index * 0.07;
        context.stroke();
      });
    };
    const render = (time) => {
      if (!document.hidden && time - previousTime > 20) {
        previousTime = time;
        if (!interacting) view.targetYaw += 0.0012;
        draw();
      }
      frame = requestAnimationFrame(render);
    };
    const handlePointer = (event) => {
      const rect = demo.getBoundingClientRect();
      view.targetYaw = ((event.clientX - rect.left) / rect.width - 0.5) * 1.3;
      view.targetPitch = ((event.clientY - rect.top) / rect.height - 0.5) * -0.72;
      interacting = true;
      if (reducedMotion.matches) {
        view.yaw = view.targetYaw;
        view.pitch = view.targetPitch;
        for (let index = 0; index < 60; index += 1) draw();
      }
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(demo);
    const removeMove = listen(demo, 'pointermove', handlePointer, { passive: true });
    const removeDown = listen(demo, 'pointerdown', () => { reseed(); draw(); });
    const removeLeave = listen(demo, 'pointerleave', () => {
      interacting = false;
      view.targetPitch = -0.08;
    }, { passive: true });
    resize();
    draw();
    if (!reducedMotion.matches) frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      removeMove();
      removeDown();
      removeLeave();
    };
  }

  function buildReactionExperiment(container) {
    const demo = document.createElement('div');
    demo.className = 'lab-demo demo-reaction';
    demo.innerHTML = `
      <canvas aria-label="Interactive Gray–Scott reaction diffusion simulation"></canvas>
      <span class="lab-demo-label">GRAY–SCOTT / 03</span>
      <span class="demo-reaction-note">TOUCH / SEED MATTER</span>
      <span class="demo-reaction-controls" role="group" aria-label="Reaction presets">
        <button type="button" data-reaction-preset="coral" aria-pressed="true">Coral</button>
        <button type="button" data-reaction-preset="mitosis" aria-pressed="false">Mitosis</button>
        <button type="button" data-reaction-preset="reset" aria-pressed="false">Reset</button>
      </span>`;
    container.append(demo);
    const canvas = $('canvas', demo);
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) {
      demo.classList.add('is-fallback');
      demo.insertAdjacentHTML('beforeend', '<p class="lab-webgl-fallback">This simulation needs WebGL 2. The static preview remains available on this device.</p>');
      return () => {};
    }
    if (!gl.getExtension('EXT_color_buffer_float')) {
      demo.classList.add('is-fallback');
      demo.insertAdjacentHTML('beforeend', '<p class="lab-webgl-fallback">High-precision GPU simulation is unavailable on this device. The static preview remains visible.</p>');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return () => {};
    }

    const vertexSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const simulationSource = `#version 300 es
      precision highp float;
      uniform sampler2D u_state;
      uniform vec2 u_texel;
      uniform vec2 u_seed;
      uniform float u_seedRadius;
      uniform vec2 u_params;
      in vec2 v_uv;
      out vec4 outColor;

      vec2 sampleState(vec2 offset) { return texture(u_state, v_uv + offset * u_texel).rg; }

      void main() {
        vec2 state = sampleState(vec2(0.0));
        vec2 lap = -state;
        lap += sampleState(vec2(-1.0, 0.0)) * 0.2;
        lap += sampleState(vec2( 1.0, 0.0)) * 0.2;
        lap += sampleState(vec2(0.0, -1.0)) * 0.2;
        lap += sampleState(vec2(0.0,  1.0)) * 0.2;
        lap += sampleState(vec2(-1.0, -1.0)) * 0.05;
        lap += sampleState(vec2( 1.0, -1.0)) * 0.05;
        lap += sampleState(vec2(-1.0,  1.0)) * 0.05;
        lap += sampleState(vec2( 1.0,  1.0)) * 0.05;

        float a = state.r;
        float b = state.g;
        float reaction = a * b * b;
        float nextA = a + lap.r - reaction + u_params.x * (1.0 - a);
        float nextB = b + 0.5 * lap.g + reaction - (u_params.y + u_params.x) * b;

        if (u_seed.x >= 0.0) {
          vec2 delta = v_uv - u_seed;
          delta.x *= u_texel.y / u_texel.x;
          float seed = 1.0 - smoothstep(u_seedRadius * 0.72, u_seedRadius, length(delta));
          nextA = mix(nextA, 0.0, seed);
          nextB = mix(nextB, 1.0, seed);
        }
        outColor = vec4(clamp(nextA, 0.0, 1.0), clamp(nextB, 0.0, 1.0), 0.0, 1.0);
      }
    `;
    const displaySource = `#version 300 es
      precision highp float;
      uniform sampler2D u_state;
      uniform vec2 u_texel;
      in vec2 v_uv;
      out vec4 outColor;

      void main() {
        vec2 state = texture(u_state, v_uv).rg;
        float bL = texture(u_state, v_uv - vec2(u_texel.x, 0.0)).g;
        float bR = texture(u_state, v_uv + vec2(u_texel.x, 0.0)).g;
        float bD = texture(u_state, v_uv - vec2(0.0, u_texel.y)).g;
        float bU = texture(u_state, v_uv + vec2(0.0, u_texel.y)).g;
        float edge = clamp(length(vec2(bR - bL, bU - bD)) * 4.2, 0.0, 1.0);
        float matter = smoothstep(0.08, 0.68, state.g);
        float interior = smoothstep(0.05, 0.72, state.r - state.g);
        vec3 paper = vec3(0.91, 0.915, 0.93);
        vec3 graphite = vec3(0.018, 0.015, 0.018);
        vec3 ink = mix(vec3(0.12, 0.015, 0.022), graphite, matter);
        vec3 color = mix(ink, paper, interior);
        color = mix(color, vec3(0.98), edge * 0.32);
        float vignette = 1.0 - smoothstep(0.45, 0.95, length(v_uv - 0.5));
        color *= 0.9 + vignette * 0.1;
        outColor = vec4(color, 1.0);
      }
    `;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message || 'Reaction shader compilation failed');
      }
      return shader;
    };
    const createProgram = (fragmentSource) => {
      const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const message = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(message || 'Reaction program linking failed');
      }
      return program;
    };

    let simulationProgram;
    let displayProgram;
    try {
      simulationProgram = createProgram(simulationSource);
      displayProgram = createProgram(displaySource);
    } catch (error) {
      demo.classList.add('is-fallback');
      demo.insertAdjacentHTML('beforeend', '<p class="lab-webgl-fallback">The live simulation could not start. A static fallback is shown instead.</p>');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return () => {};
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const bindPosition = (program) => {
      const position = gl.getAttribLocation(program, 'a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    };

    const simState = {
      textures: [], framebuffers: [], read: 0, width: 1, height: 1,
      seedX: -1, seedY: -1, seedActive: false, frame: 0, previousTime: 0
    };
    let feed = 0.0545;
    let kill = 0.062;
    let drawing = false;

    const deleteTargets = () => {
      simState.textures.forEach((texture) => gl.deleteTexture(texture));
      simState.framebuffers.forEach((framebuffer) => gl.deleteFramebuffer(framebuffer));
      simState.textures = [];
      simState.framebuffers = [];
    };
    const initialPixels = (width, height) => {
      const pixels = new Float32Array(width * height * 4);
      for (let index = 0; index < width * height; index += 1) {
        pixels[index * 4] = 1;
        pixels[index * 4 + 3] = 1;
      }
      const seed = (cx, cy, radius) => {
        for (let y = -radius; y <= radius; y += 1) for (let x = -radius; x <= radius; x += 1) {
          if (x * x + y * y > radius * radius) continue;
          const px = (cx + x + width) % width;
          const py = (cy + y + height) % height;
          const offset = (py * width + px) * 4;
          pixels[offset] = 0;
          pixels[offset + 1] = 1;
        }
      };
      const base = Math.max(3, Math.round(Math.min(width, height) / 85));
      for (let index = 0; index < 34; index += 1) {
        const angle = index * 2.39996;
        const radius = Math.min(width, height) * (0.055 + index * 0.0088);
        seed(
          Math.floor(width * 0.5 + Math.cos(angle) * radius),
          Math.floor(height * 0.5 + Math.sin(angle) * radius * 0.68),
          base + index % 3
        );
      }
      return pixels;
    };
    const createTarget = (pixels) => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, simState.width, simState.height, 0, gl.RGBA, gl.FLOAT, pixels);
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return { texture, framebuffer };
    };
    const reset = () => {
      const pixels = initialPixels(simState.width, simState.height);
      simState.textures.forEach((texture) => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, simState.width, simState.height, gl.RGBA, gl.FLOAT, pixels);
      });
      simState.read = 0;
      simState.seedActive = false;
    };
    const resize = () => {
      const rect = demo.getBoundingClientRect();
      const displayWidth = Math.max(1, Math.round(rect.width));
      const displayHeight = Math.max(1, Math.round(rect.height));
      const ratio = Math.min(window.devicePixelRatio || 1, displayWidth < 700 ? 1.5 : 1.8);
      canvas.width = Math.round(displayWidth * ratio);
      canvas.height = Math.round(displayHeight * ratio);
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      const constrainedDevice = (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 4;
      const nextWidth = displayWidth < 520 ? 384 : constrainedDevice ? 512 : 640;
      const nextHeight = Math.max(256, Math.round(nextWidth * displayHeight / displayWidth));
      if (nextWidth === simState.width && nextHeight === simState.height && simState.textures.length) return;
      deleteTargets();
      simState.width = nextWidth;
      simState.height = nextHeight;
      const pixels = initialPixels(nextWidth, nextHeight);
      for (let index = 0; index < 2; index += 1) {
        const target = createTarget(pixels);
        simState.textures.push(target.texture);
        simState.framebuffers.push(target.framebuffer);
      }
      reset();
    };

    const simulate = () => {
      const write = 1 - simState.read;
      gl.bindFramebuffer(gl.FRAMEBUFFER, simState.framebuffers[write]);
      gl.viewport(0, 0, simState.width, simState.height);
      gl.useProgram(simulationProgram);
      bindPosition(simulationProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, simState.textures[simState.read]);
      gl.uniform1i(gl.getUniformLocation(simulationProgram, 'u_state'), 0);
      gl.uniform2f(gl.getUniformLocation(simulationProgram, 'u_texel'), 1 / simState.width, 1 / simState.height);
      gl.uniform2f(gl.getUniformLocation(simulationProgram, 'u_seed'), simState.seedActive ? simState.seedX : -1, simState.seedY);
      gl.uniform1f(gl.getUniformLocation(simulationProgram, 'u_seedRadius'), Math.max(0.008, 9 / simState.height));
      gl.uniform2f(gl.getUniformLocation(simulationProgram, 'u_params'), feed, kill);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      simState.read = write;
    };
    const paint = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(displayProgram);
      bindPosition(displayProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, simState.textures[simState.read]);
      gl.uniform1i(gl.getUniformLocation(displayProgram, 'u_state'), 0);
      gl.uniform2f(gl.getUniformLocation(displayProgram, 'u_texel'), 1 / simState.width, 1 / simState.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const render = (time) => {
      if (!document.hidden && time - simState.previousTime > 30) {
        simState.previousTime = time;
        const iterations = reducedMotion.matches ? 1 : simState.width > 560 ? 8 : 6;
        for (let index = 0; index < iterations; index += 1) simulate();
        paint();
      }
      simState.frame = requestAnimationFrame(render);
    };
    const addSeedFromPointer = (event) => {
      if (!drawing && event.type === 'pointermove') return;
      const rect = canvas.getBoundingClientRect();
      simState.seedX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      simState.seedY = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      simState.seedActive = true;
      if (reducedMotion.matches) {
        for (let index = 0; index < 8; index += 1) simulate();
        paint();
      }
    };
    const presetButtons = $$('[data-reaction-preset]', demo);
    const presetRemovers = presetButtons.map((button) => listen(button, 'click', () => {
      const preset = button.dataset.reactionPreset;
      if (preset === 'coral') { feed = 0.0545; kill = 0.062; }
      if (preset === 'mitosis') { feed = 0.0367; kill = 0.0649; }
      reset();
      presetButtons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
      for (let index = 0; index < 36; index += 1) simulate();
      paint();
    }));
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(demo);
    const removeDown = listen(canvas, 'pointerdown', (event) => { drawing = true; canvas.setPointerCapture?.(event.pointerId); addSeedFromPointer(event); });
    const removeMove = listen(canvas, 'pointermove', addSeedFromPointer, { passive: true });
    const removeUp = listen(canvas, 'pointerup', (event) => { drawing = false; simState.seedActive = false; if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId); });
    const removeCancel = listen(canvas, 'pointercancel', () => { drawing = false; simState.seedActive = false; });
    resize();
    for (let index = 0; index < 42; index += 1) simulate();
    paint();
    if (!reducedMotion.matches) simState.frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(simState.frame);
      resizeObserver.disconnect();
      removeDown();
      removeMove();
      removeUp();
      removeCancel();
      presetRemovers.forEach((remove) => remove());
      deleteTargets();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(simulationProgram);
      gl.deleteProgram(displayProgram);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }

  function buildNetworkExperiment(container) {
    const demo = document.createElement('div');
    demo.className = 'lab-demo demo-network';
    demo.innerHTML = `
      <canvas aria-hidden="true"></canvas>
      <span class="lab-demo-label">GLOBAL ROUTE FIELD / 06</span>
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
        context.strokeStyle = index % 3 === 0 ? 'rgba(227,38,54,.58)' : 'rgba(255,255,255,.13)';
        context.lineWidth = index % 3 === 0 ? 1.2 : 0.7;
        context.stroke();
        const progress = reducedMotion.matches ? 0.56 : (seconds * (0.12 + index * 0.006) + index * 0.16) % 1;
        const pulse = quadraticPoint(start, control, end, progress);
        context.beginPath();
        context.arc(pulse.x, pulse.y, index % 2 === 0 ? 4.2 : 2.7, 0, Math.PI * 2);
        context.fillStyle = index % 2 === 0 ? '#e32636' : '#f5f5f7';
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
      <span class="lab-demo-label">SPATIAL FACADE / 07</span>
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
      <span class="lab-demo-label">REAL-TIME SHADER / 04</span>
      <span class="demo-webgl-copy"><strong>FORM</strong><span>RAYMARCHED / DIRECT ORBIT</span></span>
      <span class="demo-webgl-hint">DRAG / ORBIT 360°<br>WHEEL / ZOOM</span>
      <span class="demo-webgl-palette" role="group" aria-label="Sculpture palette">
        <button type="button" style="--palette:#f5f5f7" aria-label="Use soft white palette" aria-pressed="true" data-palette="0"></button>
        <button type="button" style="--palette:#8e8e93" aria-label="Use graphite palette" aria-pressed="false" data-palette="1"></button>
        <button type="button" style="--palette:#e32636" aria-label="Use signal red palette" aria-pressed="false" data-palette="2"></button>
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
      uniform vec2 u_rotation;
      uniform float u_zoom;
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
        p.yz *= rot(u_rotation.y);
        p.xz *= rot(u_rotation.x);
        vec3 twist = p;
        twist.xz *= rot(twist.y * 0.78 + u_time * 0.035);
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
        vec3 ro = vec3(0.0, 0.0, u_zoom);
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
    const rotationLocation = gl.getUniformLocation(program, 'u_rotation');
    const zoomLocation = gl.getUniformLocation(program, 'u_zoom');
    const accentLocation = gl.getUniformLocation(program, 'u_accent');
    const palettes = [[0.96,0.96,0.98], [0.36,0.36,0.39], [0.89,0.149,0.212]];
    const pointer = { x: 0.52, y: 0.48, targetX: 0.52, targetY: 0.48 };
    const orbit = { yaw: -0.32, pitch: 0.18, targetYaw: -0.32, targetPitch: 0.18, zoom: 3.65, targetZoom: 3.65, dragging: false, id: null, x: 0, y: 0 };
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
      orbit.yaw += (orbit.targetYaw - orbit.yaw) * 0.14;
      orbit.pitch += (orbit.targetPitch - orbit.pitch) * 0.14;
      orbit.zoom += (orbit.targetZoom - orbit.zoom) * 0.12;
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, width, height);
      gl.uniform2f(mouseLocation, pointer.x, pointer.y);
      gl.uniform1f(timeLocation, reducedMotion.matches ? 2.4 : (time - start) / 1000);
      gl.uniform2f(rotationLocation, orbit.yaw, orbit.pitch);
      gl.uniform1f(zoomLocation, orbit.zoom);
      gl.uniform3fv(accentLocation, palettes[paletteIndex]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const render = (time) => {
      if (!document.hidden) draw(time);
      frame = requestAnimationFrame(render);
    };
    const updatePointerPosition = (event) => {
      const rect = demo.getBoundingClientRect();
      pointer.targetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      pointer.targetY = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      if (reducedMotion.matches) draw(performance.now());
    };
    const handleDown = (event) => {
      orbit.dragging = true;
      orbit.id = event.pointerId;
      orbit.x = event.clientX;
      orbit.y = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
      demo.classList.add('is-orbiting');
      updatePointerPosition(event);
    };
    const handlePointer = (event) => {
      updatePointerPosition(event);
      if (!orbit.dragging || event.pointerId !== orbit.id) return;
      const deltaX = event.clientX - orbit.x;
      const deltaY = event.clientY - orbit.y;
      orbit.x = event.clientX;
      orbit.y = event.clientY;
      orbit.targetYaw += deltaX * 0.011;
      orbit.targetPitch = Math.max(-1.48, Math.min(1.48, orbit.targetPitch + deltaY * 0.011));
      if (reducedMotion.matches) {
        orbit.yaw = orbit.targetYaw;
        orbit.pitch = orbit.targetPitch;
        draw(performance.now());
      }
    };
    const handleUp = (event) => {
      if (event.pointerId !== orbit.id) return;
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      orbit.dragging = false;
      orbit.id = null;
      demo.classList.remove('is-orbiting');
    };
    const handleWheel = (event) => {
      event.preventDefault();
      orbit.targetZoom = Math.max(2.75, Math.min(5.25, orbit.targetZoom + event.deltaY * 0.0028));
      if (reducedMotion.matches) { orbit.zoom = orbit.targetZoom; draw(performance.now()); }
    };
    let pinchDistance = 0;
    const handleTouchStart = (event) => {
      if (event.touches.length !== 2) return;
      const [first, second] = event.touches;
      pinchDistance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
    };
    const handleTouchMove = (event) => {
      if (event.touches.length !== 2 || !pinchDistance) return;
      event.preventDefault();
      const [first, second] = event.touches;
      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      orbit.targetZoom = Math.max(2.75, Math.min(5.25, orbit.targetZoom + (pinchDistance - distance) * 0.009));
      pinchDistance = distance;
    };
    const handleTouchEnd = () => { pinchDistance = 0; };
    const resetOrbit = () => {
      orbit.targetYaw = -0.32;
      orbit.targetPitch = 0.18;
      orbit.targetZoom = 3.65;
      if (reducedMotion.matches) {
        orbit.yaw = orbit.targetYaw;
        orbit.pitch = orbit.targetPitch;
        orbit.zoom = orbit.targetZoom;
        draw(performance.now());
      }
    };
    const paletteButtons = $$('[data-palette]', demo);
    const paletteRemovers = paletteButtons.map((button) => listen(button, 'click', () => {
      paletteIndex = Number(button.dataset.palette) || 0;
      paletteButtons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
      draw(performance.now());
    }));
    const removeDown = listen(canvas, 'pointerdown', handleDown);
    const removeMove = listen(canvas, 'pointermove', handlePointer, { passive: true });
    const removeUp = listen(canvas, 'pointerup', handleUp);
    const removeCancel = listen(canvas, 'pointercancel', handleUp);
    const removeWheel = listen(canvas, 'wheel', handleWheel, { passive: false });
    const removeTouchStart = listen(canvas, 'touchstart', handleTouchStart, { passive: true });
    const removeTouchMove = listen(canvas, 'touchmove', handleTouchMove, { passive: false });
    const removeTouchEnd = listen(canvas, 'touchend', handleTouchEnd, { passive: true });
    const removeDoubleClick = listen(canvas, 'dblclick', resetOrbit);
    draw(performance.now());
    if (!reducedMotion.matches) frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      removeDown();
      removeMove();
      removeUp();
      removeCancel();
      removeWheel();
      removeTouchStart();
      removeTouchMove();
      removeTouchEnd();
      removeDoubleClick();
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
      <span class="lab-demo-label">GENERATIVE TYPE FIELD / 05</span>
      <span class="demo-type-scan" aria-hidden="true"></span>
      <span class="demo-type-word" aria-hidden="true"><i>SIGNAL</i><i>SIGNAL</i><i>SIGNAL</i></span>
      <span class="demo-type-index">POINTER / SPLITS THE SIGNAL</span>
      <span class="demo-type-palette" role="group" aria-label="Typography signal color">
        <button type="button" style="--palette:#e32636" aria-label="Use red signal" aria-pressed="true" data-type-color="#e32636"></button>
        <button type="button" style="--palette:#f5f5f7" aria-label="Use white signal" aria-pressed="false" data-type-color="#f5f5f7"></button>
        <button type="button" style="--palette:#8e8e93" aria-label="Use graphite signal" aria-pressed="false" data-type-color="#8e8e93"></button>
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

  const previewStage = $('[data-lab-preview-stage]');
  const previewIndex = $('[data-lab-preview-index]');
  const previewLabel = $('[data-lab-preview-label]');
  const previewMeta = {
    flow: ['01', 'PARTICLE FLOW / LIVE INPUT'],
    attractor: ['02', 'CHAOS SYSTEM / 3D PROJECTION'],
    reaction: ['03', 'REACTION DIFFUSION / TOUCH SEED'],
    webgl: ['04', 'RAYMARCHED FORM / 360° ORBIT'],
    type: ['05', 'KINETIC TYPE / SIGNAL FIELD'],
    network: ['06', 'ROUTE NETWORK / PARTICLE DATA'],
    air: ['07', 'SPATIAL RIBBON / CSS 3D']
  };
  const previewNames = {
    flow: 'Flow Field',
    attractor: 'Strange Attractor',
    reaction: 'Reaction Diffusion',
    webgl: 'Shader Sculpture',
    type: 'Type Signal',
    network: 'Route Network',
    air: 'Spatial Ribbon'
  };
  const activatePreview = (key) => {
    if (!previewStage || !previewMeta[key]) return;
    previewStage.dataset.labPreviewActive = key;
    previewStage.dataset.labOpen = key;
    previewStage.setAttribute('aria-label', `Open the ${previewNames[key]} experiment`);
    if (previewIndex) previewIndex.textContent = previewMeta[key][0];
    if (previewLabel) previewLabel.textContent = previewMeta[key][1];
    $$('[data-lab-preview]').forEach((button) => button.classList.toggle('is-preview-active', button.dataset.labPreview === key));
  };
  $$('[data-lab-preview]').forEach((button) => {
    const activate = () => activatePreview(button.dataset.labPreview);
    button.addEventListener('pointerenter', activate, { passive: true });
    button.addEventListener('focus', activate);
  });
  activatePreview('flow');

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
