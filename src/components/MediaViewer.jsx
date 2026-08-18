import React, { useEffect, useRef } from 'react';

export default function MediaViewer({ item, items = [], onClose, onChange }) {
  const panel = useRef(null);
  const closeButton = useRef(null);

  useEffect(() => {
    if (!item) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight' && items.length > 1) onChange?.(1);
      if (event.key === 'ArrowLeft' && items.length > 1) onChange?.(-1);
      if (event.key === 'Tab') {
        const focusable = panel.current?.querySelectorAll('button,[href],video[controls]');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, [item, items.length, onChange, onClose]);

  if (!item) return null;
  const position = Math.max(0, items.indexOf(item));
  const width = Number(item.width) || 16;
  const height = Number(item.height) || 9;
  const ratio = width / height;
  const orientation = ratio < 0.8 ? 'portrait' : ratio > 2 ? 'ultrawide' : ratio > 1.2 ? 'landscape' : 'square';

  return (
    <div className="media-viewer" role="dialog" aria-modal="true" aria-labelledby="media-viewer-title">
      <button className="media-viewer__backdrop" type="button" aria-label="Close media viewer" onClick={onClose} />
      <div className="media-viewer__panel" ref={panel} data-orientation={orientation} data-identity={item.identity || undefined} data-tone={item.tone || undefined} style={{ '--media-ratio': ratio }}>
        <header>
          <div><span>{item.category}</span><h2 id="media-viewer-title">{item.title}</h2></div>
          <div className="media-viewer__controls">
            {items.length > 1 && <>
              <button type="button" onClick={() => onChange(-1)} aria-label="Previous media">←</button>
              <output>{String(position + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</output>
              <button type="button" onClick={() => onChange(1)} aria-label="Next media">→</button>
            </>}
            <button className="media-viewer__close" ref={closeButton} type="button" onClick={onClose} aria-label="Close media viewer">×</button>
          </div>
        </header>
        <div className="media-viewer__stage">
          {item.type === 'video' ? (
            <video key={item.src} src={item.src} poster={item.poster} controls playsInline preload="metadata" aria-label={item.alt} />
          ) : (
            <img src={item.src} alt={item.alt} width={item.width} height={item.height} />
          )}
        </div>
        <footer>
          <p>{item.ai ? 'Created entirely from scratch using AI tools, from concept and generation to final editing.' : item.alt}</p>
          <code>{item.src.replace('/assets/', 'assets/')}</code>
        </footer>
      </div>
    </div>
  );
}
