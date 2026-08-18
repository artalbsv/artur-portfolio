import React, { useEffect, useRef } from 'react';

export default function StudioScene() {
  const mount = useRef(null);

  useEffect(() => {
    const host = mount.current;
    if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.WebGLRenderingContext) return;
    let disposed = false;
    let cleanup = () => {};
    import('../three/studioRuntime.js').then(({ mountStudioScene }) => {
      if (!disposed) cleanup = mountStudioScene(host);
    }).catch(() => host.classList.add('studio-scene--fallback'));
    return () => { disposed = true; cleanup(); };
  }, []);

  return <div className="studio-scene" ref={mount} aria-label="Interactive studio surface. Drag to rotate the composition." role="img"><span>Drag the working surface</span></div>;
}
