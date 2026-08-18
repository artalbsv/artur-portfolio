import React from 'react';
import { experiments } from '../content.js';

export default function LabSection() {
  return (
    <>
      <section className="creative-lab working-lab" id="lab" aria-labelledby="lab-heading" data-section="lab">
        <div className="shell">
          <header className="lab-heading">
            <p className="chapter-mark">Playground</p>
            <div><p className="lab-kicker">CODE / MOTION / SYSTEMS</p><h2 id="lab-heading">The workbench<br /><em>stays open.</em></h2></div>
            <div className="lab-intro"><p>Seven live systems. No prerecorded tricks. Every scene begins only when you open it.</p><p className="lab-click-note"><span aria-hidden="true">↗</span> Open an experiment</p></div>
          </header>

          <div className="lab-console" aria-label="Interactive creative coding experiments" data-lab-grid>
            <div className="lab-menu">
              {experiments.map(([key, title, category], index) => (
                <button key={key} type="button" data-lab-open={key} data-lab-preview={key} aria-label={`Open the ${title} experiment`}>
                  <span>{String(index + 1).padStart(2, '0')} / {category.split(' / ')[0]}</span><strong>{title}</strong><small>{category}</small><i aria-hidden="true">↗</i>
                </button>
              ))}
            </div>
            <button className="lab-live-preview" type="button" data-lab-open="flow" data-lab-preview-stage data-lab-preview-active="flow" aria-label="Open the Flow Field experiment">
              <span className="lab-preview-grid" />
              <svg className="lab-preview-flow" viewBox="0 0 640 640" role="presentation"><path d="M44 390C133 172 248 503 345 251S518 176 603 334" /><path d="M22 462C143 271 245 574 382 319S545 259 621 402" /><path d="M70 296C168 93 291 417 389 187S550 122 590 260" /></svg>
              <svg className="lab-preview-attractor" viewBox="0 0 640 640" role="presentation"><path d="M323 317C155 135 78 401 269 483C471 570 591 273 404 143C264 47 128 225 323 317C493 397 489 113 323 317Z" /><path d="M327 321C206 173 109 367 277 454C440 538 551 291 398 169C281 76 169 236 327 321Z" /></svg>
              <span className="lab-preview-reaction" /><span className="lab-preview-shader"><i /></span>
              <span className="lab-preview-type" aria-hidden="true"><i>SIGNAL</i><i>SIGNAL</i><i>SIGNAL</i></span>
              <svg className="lab-preview-network" viewBox="0 0 640 640" role="presentation"><path d="M74 358Q180 137 315 318T568 254" /><path d="M86 444Q241 292 352 437T576 360" /><path d="M128 224Q292 391 490 172" /><circle cx="74" cy="358" r="7" /><circle cx="315" cy="318" r="10" /><circle cx="568" cy="254" r="6" /></svg>
              <span className="lab-preview-air" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</span>
              <span className="lab-preview-meta"><b data-lab-preview-index>01</b><i data-lab-preview-label>PARTICLE FLOW / LIVE INPUT</i></span>
            </button>
          </div>
          <p className="lab-footnote"><span>ON DEMAND</span> Scenes pause when closed, hidden or reduced motion is requested.</p>
        </div>
      </section>

      <div className="lab-viewer" role="dialog" aria-modal="true" aria-labelledby="lab-viewer-title" aria-describedby="lab-viewer-description" hidden data-lab-viewer>
        <div className="lab-viewer-backdrop" data-lab-close aria-hidden="true" />
        <div className="lab-viewer-panel">
          <header><div><span data-lab-category>Interactive study</span><h2 id="lab-viewer-title" data-lab-title>Creative coding experiment</h2></div><button className="lab-viewer-close" type="button" aria-label="Close interactive experiment" data-lab-close><span aria-hidden="true">×</span></button></header>
          <div className="lab-viewer-stage" data-lab-stage />
          <footer><p id="lab-viewer-description" data-lab-description>Select an experiment to begin.</p><p className="lab-viewer-instruction" data-lab-instruction>Move your pointer inside the scene.</p><code data-lab-tech>Canvas / CSS / WebGL</code></footer>
        </div>
      </div>
    </>
  );
}
