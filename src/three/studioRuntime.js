import {
  CanvasTexture,
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer
} from 'three';

const makePanelTexture = (title, label, accent = '#f2f0eb') => {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  context.fillStyle = '#030303';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(242,240,235,.14)';
  context.lineWidth = 1;
  for (let x = 0; x <= 768; x += 96) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 1024); context.stroke();
  }
  context.fillStyle = accent;
  context.font = '600 76px Arial';
  context.fillText(title, 54, 160);
  context.font = '500 22px monospace';
  context.fillStyle = 'rgba(242,240,235,.65)';
  context.fillText(label.toUpperCase(), 58, 214);
  context.fillStyle = 'rgba(242,240,235,.08)';
  context.fillRect(58, 310, 652, 420);
  context.strokeStyle = accent;
  context.beginPath();
  context.moveTo(58, 820);
  context.bezierCurveTo(260, 700, 430, 930, 710, 770);
  context.stroke();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

const makeBackTexture = (title, index) => {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  context.fillStyle = '#020202';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(242,240,235,.12)';
  context.lineWidth = 1;
  for (let y = 0; y <= 1024; y += 128) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(768, y); context.stroke();
  }
  context.fillStyle = 'rgba(242,240,235,.88)';
  context.font = '500 22px monospace';
  context.fillText(`WORKING PROOF / ${index}`, 54, 82);
  context.font = '400 112px Georgia';
  context.fillText(title, 54, 520);
  context.strokeStyle = 'rgba(242,240,235,.46)';
  context.beginPath();
  context.moveTo(54, 790);
  context.bezierCurveTo(220, 660, 450, 920, 714, 750);
  context.stroke();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

const makeDoublePanel = (width, height, frontTexture, backTexture) => {
  const geometry = new BoxGeometry(width, height, 0.055);
  const edgeMaterial = new MeshBasicMaterial({ color: 0x070707 });
  const frontMaterial = new MeshBasicMaterial({ map: frontTexture });
  const backMaterial = new MeshBasicMaterial({ map: backTexture });
  const group = new Mesh(geometry, [edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, frontMaterial, backMaterial]);
  return { group, geometry, materials: [edgeMaterial, frontMaterial, backMaterial] };
};

export const mountStudioScene = (host) => {
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.2, 8.2);
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.outputColorSpace = SRGBColorSpace;
  host.append(renderer.domElement);

  const group = new Group();
  scene.add(group);
  const textureA = makePanelTexture('PRODUCT', 'interface / system');
  const textureB = makePanelTexture('MOTION', 'image / rhythm', '#c6c4bf');
  const textureBackA = makeBackTexture('Make', '01');
  const textureBackB = makeBackTexture('Build', '02');
  const panelPair = makeDoublePanel(2.55, 3.4, textureA, textureBackA);
  const secondPair = makeDoublePanel(2.2, 2.93, textureB, textureBackB);
  const panel = panelPair.group;
  panel.position.set(-0.85, 0, 0.1);
  panel.rotation.set(-0.08, -0.18, -0.08);
  group.add(panel);
  const secondPanel = secondPair.group;
  secondPanel.position.set(1.2, -0.2, -0.35);
  secondPanel.rotation.set(0.09, 0.25, 0.09);
  group.add(secondPanel);
  const ring = new Mesh(new TorusGeometry(1.4, 0.032, 10, 100), new MeshBasicMaterial({ color: 0xf2f0eb, transparent: true, opacity: 0.48 }));
  ring.rotation.set(1.15, 0.45, 0.2);
  group.add(ring);
  const signal = new Mesh(new SphereGeometry(0.11, 20, 20), new MeshBasicMaterial({ color: 0xf2f0eb }));
  signal.position.set(1.55, 1.15, 0.65);
  group.add(signal);

  let raf = 0;
  let inView = true;
  let active = !document.hidden;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const velocity = { x: 0, y: 0 };
  const target = { x: -0.06, y: 0.08 };

  const resize = () => {
    const rect = host.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const onDown = (event) => { dragging = true; lastX = event.clientX; lastY = event.clientY; signal.material.color.setHex(0xe51f32); host.setPointerCapture?.(event.pointerId); host.classList.add('is-dragging'); };
  const onMove = (event) => {
    if (!dragging) return;
    velocity.y = (event.clientX - lastX) * 0.006;
    velocity.x = (event.clientY - lastY) * 0.006;
    target.y += velocity.y; target.x += velocity.x; lastX = event.clientX; lastY = event.clientY;
  };
  const onUp = () => { dragging = false; signal.material.color.setHex(0xf2f0eb); host.classList.remove('is-dragging'); };
  host.addEventListener('pointerdown', onDown); host.addEventListener('pointermove', onMove); host.addEventListener('pointerup', onUp); host.addEventListener('pointercancel', onUp);

  const render = (time) => {
    if (active) {
      if (!dragging) { target.y += velocity.y; target.x += velocity.x; velocity.x *= 0.94; velocity.y *= 0.94; }
      group.rotation.x += (target.x - group.rotation.x) * 0.08;
      group.rotation.y += (target.y - group.rotation.y) * 0.08;
      ring.rotation.z = time * 0.00008;
      signal.position.y = 1.15 + Math.sin(time * 0.001) * 0.08;
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(render);
  };
  raf = requestAnimationFrame(render);
  const visibility = () => { active = inView && !document.hidden; };
  document.addEventListener('visibilitychange', visibility);
  const sectionObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    active = inView && !document.hidden;
  }, { rootMargin: '120px 0px' });
  sectionObserver.observe(host);

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', visibility);
    sectionObserver.disconnect();
    observer.disconnect();
    host.removeEventListener('pointerdown', onDown); host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerup', onUp); host.removeEventListener('pointercancel', onUp);
    [panelPair.geometry, secondPair.geometry, ring.geometry, signal.geometry].forEach((item) => item.dispose());
    [...panelPair.materials, ...secondPair.materials, ring.material, signal.material].forEach((item) => item.dispose());
    [textureA, textureB, textureBackA, textureBackB].forEach((item) => item.dispose());
    renderer.dispose(); renderer.domElement.remove();
  };
};
