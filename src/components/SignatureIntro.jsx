import React, { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';

const CRITICAL_MEDIA = [
  '/assets/images/artur-profile.webp',
  '/assets/images/rodociclo-after.webp',
  '/assets/images/rodociclo-mobile.webp',
  '/assets/images/biketech-after.webp',
  '/assets/images/biketech-mobile.webp',
  '/assets/images/design-work-01.webp'
];

const decodeImage = (src) => new Promise((resolve) => {
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    if (image.decode) image.decode().catch(() => {}).finally(resolve);
    else resolve();
  };
  image.onerror = resolve;
  image.src = src;
});

export default function SignatureIntro({ onComplete }) {
  const root = useRef(null);
  const [hidden, setHidden] = useState(false);

  useGSAP(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('intro-running');
    if (reduce) {
      document.documentElement.classList.remove('intro-running');
      setHidden(true);
      onComplete?.();
      return;
    }

    const paths = gsap.utils.toArray('[data-write-path]', root.current);
    paths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });

    let cancelled = false;
    let timeline;
    const prepare = async () => {
      const fontReady = document.fonts
        ? Promise.all([
          document.fonts.load('400 48px Allura'),
          document.fonts.load('400 48px "Instrument Serif"'),
          document.fonts.load('italic 48px "Instrument Serif"')
        ]).catch(() => {})
        : Promise.resolve();
      await Promise.all([fontReady, ...CRITICAL_MEDIA.map(decodeImage)]);
      if (cancelled || !root.current) return;

      timeline = gsap.timeline({
        onComplete: () => {
          if (cancelled) return;
          document.documentElement.classList.remove('intro-running');
          setHidden(true);
          onComplete?.();
        }
      });
      timeline
        .to(paths, { strokeDashoffset: 0, duration: 1.65, stagger: 0.18, ease: 'power1.inOut' }, 0.18)
        .fromTo('[data-signature-name]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, ease: 'none' }, 1.82)
        .to('[data-signature-guide]', { autoAlpha: 0, duration: 0.22 }, 1.9)
        .to('[data-signature-name]', { filter: 'drop-shadow(0 0 12px rgba(242,240,235,.18))', duration: 0.3 }, 1.9)
        .to('[data-intro-caption]', { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.06 }, 1.76)
        .to('[data-intro-line]', { scaleX: 1, duration: 0.68, ease: 'expo.inOut' }, 1.82)
        .to(root.current, { yPercent: -102, duration: 0.9, ease: 'power4.inOut' }, 2.65);
    };
    prepare();

    return () => {
      cancelled = true;
      timeline?.kill();
      document.documentElement.classList.remove('intro-running');
    };
  }, { scope: root });

  if (hidden) return null;

  return (
    <div className="signature-intro" ref={root} aria-hidden="true">
      <div className="signature-intro__inner">
        <svg className="signature-mark" viewBox="0 0 1200 320" role="presentation">
          <defs>
            <mask id="signature-writing-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="320">
              <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" data-signature-guide>
                <path data-write-path d="M54 212C110 165 152 137 215 143C286 150 347 196 423 181C467 172 500 151 533 131" />
                <path data-write-path d="M471 184C532 161 596 144 653 155C710 166 747 204 810 191" />
                <path data-write-path d="M773 191C833 163 898 143 963 153C1027 164 1076 203 1146 186" />
              </g>
            </mask>
          </defs>
          <text x="600" y="224" textAnchor="middle" className="signature-name" mask="url(#signature-writing-mask)">Artur Albuquerque</text>
          <text x="600" y="224" textAnchor="middle" className="signature-name" data-signature-name>Artur Albuquerque</text>
        </svg>
        <div className="signature-intro__meta">
          <span data-intro-caption>Product & Visual Designer</span>
          <i data-intro-line />
          <span data-intro-caption>Porto Alegre / Global</span>
        </div>
      </div>
    </div>
  );
}
