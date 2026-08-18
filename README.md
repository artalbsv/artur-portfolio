# Artur Albuquerque — Working Proof

An interactive portfolio for Artur Albuquerque, Product & Visual Designer in Porto Alegre, Brazil. The experience gives recruiters an immediate view of real work while preserving deeper project notes, full-ratio media and an on-demand creative coding laboratory.

## Experience concept

The site is built around **Working Proof**: real commerce implementations, real visual work and live interactive systems. A cursive `Artur Albuquerque` signature is written on entry, then gives way to a quiet editorial interface and a directly manipulable studio surface.

The visual system is near-monochrome. Red is reserved for active states and interaction signals. The remaster uses editorial serif/sans/mono contrast, near-black-on-black surfaces, hairline structure and asymmetric media proportions. There is no cursor follower, scroll hijacking, artificial smooth scrolling or long blocking loader.

The homepage is a compact five-act world rather than a long case-study stack:

- `/` — identity, a four-state Project Stage, the Capability System, Lab portal and contact
- `/work/rodociclo/` — full Rodociclo transformation and project notes
- `/work/bike-tech-moinhos/` — full Bike Tech transformation and project notes
- `/lab/` — seven live creative-coding systems

## Structure

```text
.
├── index.html                     Metadata and React entry point
├── src/
│   ├── App.jsx                    Page architecture, theme, work and interaction state
│   ├── content.js                 Project and media content
│   ├── styles.css                 Foundational tokens and component behavior
│   ├── remaster.css               Editorial Design DNA and responsive art direction
│   ├── motion-overhaul.css        Existing interaction and route-transition layer
│   ├── world.css                  Five-act stage, capability and Lab composition
│   └── components/
│       ├── SignatureIntro.jsx     SVG-mask cursive writing ritual
│       ├── InteractionSystems.jsx Section-specific live previews and interactions
│       ├── ExperienceWorld.jsx    Project Stage, Capability System and Lab act
│       ├── StudioScene.jsx        Lazy Three.js working surface
│       ├── MediaViewer.jsx        Full-ratio image/video viewer
│       └── LabSection.jsx         Seven on-demand experiments
├── docs/                          Experience, interaction, shared-element and motion maps
├── lab.js / lab.css               Existing creative coding runtime and styles
├── assets/                        Real media, résumé and self-hosted font
├── scripts/copy-static.mjs        Copies static assets to the production output
├── package.json                   Vite, React, GSAP and Three.js
└── netlify.toml                   Build, routing, cache and security headers
```

## Local use

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. A production-equivalent check is:

```bash
npm run build
npm run preview
```

On this Windows workspace, `--configLoader runner` avoids an unrelated malformed `Documents/package.json` created by another application outside the repository.

## Netlify

`netlify.toml` runs `npm run build` and publishes `dist`. A catch-all rewrite keeps direct URLs compatible with the static React entry. Assets receive immutable cache headers and the site uses a same-origin content security policy.

## Motion architecture

- The full model is documented in `docs/experience-architecture.md`, `docs/interaction-capability-map.md`, `docs/shared-elements-map.md` and `docs/motion-physics.md`.
- The homepage uses five acts and approximately six physical desktop viewports. Detailed project evidence stays on the dedicated routes.
- The Project Stage is a finite sticky environment. Native scroll, direct selection, arrow keys and touch swipe move through Rodociclo, Bike Tech, Visual & Motion and Experiments without wheel hijacking.
- Persistent media planes change geometry between states. Desktop proof becomes a mobile device, fragments into the real media archive and resolves into a procedural Lab signal.
- The Capability System replaces separate profile, experience, education, language and skill sections with four contextual modes: Design, Code, Motion and AI.
- GSAP owns event choreography and ScrollTrigger thresholds; CSS owns state geometry and micro-feedback; Three.js is reserved for the directly manipulated hero surface.
- Project routes keep spatial transition planes; the closing email briefly scrambles on interaction while the ambient coordinate field collapses toward contact.
- The signature uses a self-hosted cursive face plus an SVG writing mask. The complete name replaces the guide at the end, so it is always crisp and readable.
- Three.js is imported only by the studio surface. Its panels are double-sided, rotate freely by direct drag, cap device pixel ratio, use no post-processing and pause while the tab is hidden.
- Real visual work is part of the Project Stage and opens with one click in the full-ratio viewer.
- The seven Lab experiments live on a dedicated route, load only when the Lab approaches the viewport and start only after a visitor opens one.
- Canvas/WebGL scenes clean up their animation frames, observers, materials and event listeners.
- Reduced motion removes the signature ritual, parallax and decorative loops while preserving all content and controls.

## Real media

The read-only source library used for the existing optimized assets is:

```text
C:\Users\User\Desktop\Portfolio
```

| Source | Output |
| --- | --- |
| `Rodociclo\HomepageAntigaRDC.png` | `assets/images/rodociclo-before.webp` |
| `Rodociclo\HomepageNovaRDC.png` | `assets/images/rodociclo-after.webp` |
| `Rodociclo\RDCMobile.jpeg` | `assets/images/rodociclo-mobile.webp` |
| `Bike Tech Moinhos\HomepageAntigaBTM.png` | `assets/images/biketech-before.webp` |
| `Bike Tech Moinhos\HomepageNovaBTM.png` | `assets/images/biketech-after.webp` |
| `Bike Tech Moinhos\BTMobile.jpeg` | `assets/images/biketech-mobile.webp` |
| `Designs\DZ1.png` … `DZ5.png` | `assets/images/design-work-01.webp` … `05.webp` |
| `Designs\nitropaylogo.png` | `assets/images/nitropay-logo.webp` |
| `Designs\nitrocutlogo.png` | `assets/images/nitrocut-logo.webp` |
| `Vídeos\AI1.mp4` … `AI3.mp4` | `assets/videos/ai-video-01.mp4` … `03.mp4` plus posters |
| `Vídeos\Reel1.mp4` … `Reel3.mp4` | `assets/videos/reel-01.mp4` … `03.mp4` plus posters |

NitroPay and NitroCut are presented as identity/logo-design work with contain-based artwork treatment and no invented brand mockups. AI1–AI3 are visibly identified as created entirely from scratch using AI tools, from concept and generation to final editing. Reels are described only as edited work; no campaign claims are invented.

## Replace media

Keep the filenames or update the corresponding entries in `src/content.js`. Preserve original proportions and update width, height and alternative text. Recommended images are WebP/AVIF, 1600–2000 px on the longest useful edge and normally below 250 KB. Recommended videos are H.264 MP4 with AAC audio, 720p or 1080p, `faststart`, a WebP poster and preferably below 8–12 MB.

Gallery previews can crop with `object-fit: cover`; the accessible viewer always uses contain-based sizing and displays the complete image or video without stretching. Videos use native controls, `playsinline`, `preload="metadata"` and never autoplay.

## Résumé and theme

Replace `assets/resume/Artur_Silveira_Resume.pdf` without changing the filename, or update the contact link in `src/App.jsx`. Foundation colors are defined in `src/styles.css`; the editorial palette lives at the top of `src/remaster.css`. Dark and light preferences are stored under `artur-theme-v2`, and the browser theme color changes with the selected theme.

## Content requiring Artur’s confirmation

- Exact public titles and context for the five design pieces.
- Detailed research, feedback and rollout evidence for both commerce projects.
- Current Rodociclo sales context and wording.
- Bike Tech quantitative outcomes, if and when verified.
- Final experience titles, dates, education details, English level and availability wording.
- Final résumé and production canonical URL.

No unverified quantitative claim should be added to `src/content.js`.
