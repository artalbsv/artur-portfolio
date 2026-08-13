# Artur Albuquerque — Portfolio

An editorial, performance-conscious one-page portfolio for Artur Silveira de Albuquerque, Product & Visual Designer in Porto Alegre, Brazil. The site uses semantic HTML, a two-theme CSS system, vanilla JavaScript, and GSAP with ScrollTrigger for its primary motion language.

There is no package manager, build process, framework, remote font, or generated application bundle. The repository deploys directly as a static Netlify site.

## Project structure

```text
.
├── index.html                         Content, metadata, structured data and media manifest hooks
├── style.css                          Dark/light themes, editorial layouts and responsive styling
├── script.js                          Theme, navigation, viewer, disclosures and GSAP motion
├── netlify.toml                       Publish path, CSP, security and cache headers
├── README.md                          Maintenance and publishing guide
└── assets/
    ├── images/                        Project, gallery and video-poster images
    ├── videos/                        User-initiated MP4 motion work
    ├── vendor/                        Pinned GSAP core and ScrollTrigger runtime
    └── resume/
        └── Artur_Silveira_Resume.pdf
```

The portfolio includes optimized copies of the supplied project screenshots, design work, videos and poster frames. Original source files remain outside the repository and are never modified by the site.

## Run locally

No installation is required. From the project root, run a static server:

```bash
python -m http.server 8080
```

Open `http://localhost:8080/`. A local server is preferable to opening `index.html` directly because it reproduces CSP and media behavior more accurately.

## Deploy on Netlify

1. Import the GitHub repository into Netlify.
2. Leave the build command empty.
3. Use the repository root (`.`) as the publish directory.
4. Deploy.

`netlify.toml` already sets the publish directory, security headers and static-asset caching. Before launch, replace the canonical URL comment in `index.html` with the production URL.

## GSAP loading strategy

GSAP 3.13 core and ScrollTrigger are pinned in `assets/vendor/` and loaded as two deferred, same-origin scripts. They are the unchanged official minified distribution files. Self-hosting avoids a runtime CDN dependency, works with the strict same-origin CSP, and lets Netlify apply the repository’s long-lived asset cache policy. The local script loads after both files and registers ScrollTrigger once.

To upgrade GSAP, replace both official distribution files together, update this version note, and rerun all motion and reduced-motion checks. If the animation runtime ever fails to load, content remains visible and all core interactions still work with immediate state changes. The page does not rely on GSAP for layout or access to information.

The animation system in `script.js` is organized into:

- one scoped `gsap.context()` for page motion;
- one `gsap.matchMedia()` split for desktop and mobile distances;
- a short non-blocking page curtain, layered hero entrance and geometric line drawing;
- a transform-only spatial SVG field with independent pointer-reactive layers, paused outside the hero;
- a 36-cell proximity matrix that reacts only on fine-pointer desktops and remains static or hidden on smaller devices;
- one short, viewport-triggered character scramble system and two off-screen-paused, width-anchored text morphs;
- semantic word reveals with temporary clip paths that never crop the final typography;
- a one-shot per-letter variable-weight wave with reserved character widths, so the interactive phrase never jitters, reflows or continuously tracks the pointer;
- clean color contrast on editorial emphasis without decorative title underlines;
- an eight-scene navigation spine that follows the active section without taking over normal scrolling;
- a fixed, pointer-reactive SVG line field and restrained monochrome/red side waves behind the full page;
- a full-page 2D kinetic field that changes its typography and geometry with each section, renders at a capped 30 fps and low device-pixel ratio, and uses red only as an interaction signal;
- an on-demand Creative Lab with seven advanced studies: a particle flow field, a Lorenz strange attractor, a high-resolution Gray–Scott simulation, a fully orbitable raymarched shader sculpture, kinetic typography, a route-particle network and a CSS 3D spatial ribbon, plus modal focus management and reduced-motion behavior;
- an accessible coverflow gallery with drag, swipe, arrow-key and previous/next navigation, plus category-specific loops;
- distinct shutters, masks, media scaling and parallax sequences for each project;
- animated process states, timeline drawing, toolkit, credentials and contact sequences;
- pointer-following border glow on selected information panels, with a static fallback on touch devices;
- enhanced case-study and full-ratio media-viewer transitions;
- restrained desktop-only depth, pointer spotlight and magnetic feedback for primary controls;
- the native system pointer with no animated cursor proxy or trailing label, keeping direct manipulation immediate even while 3D surfaces and backgrounds remain responsive;
- a line-style section spine, scroll-expanded before/after stage, specular control highlights and one-shot press feedback;
- a scroll-driven kinetic type belt, vector process constellation, discipline word morph and layered contact wave field;
- a protected experience timeline whose markers occupy a dedicated rail and whose content reveals vertically without crossing it;
- cleanup through `revert()` and listener removal when motion preferences change or the page is left.

The expanded motion language still uses only the self-hosted GSAP runtime already in the repository. React, WebGL and additional animation runtimes are intentionally unnecessary for these effects, keeping the portfolio directly deployable as static files.

The coverflow, reactive-line field, morphing text, dynamic weight, gradient-wave treatment, scroll-expanded comparison and border glow are lightweight, original implementations inspired by the interaction categories in the supplied Originkit and ReactBits references. Their component libraries are not bundled or called at runtime. This keeps the authored behavior consistent with the portfolio, avoids framework duplication and preserves the static Netlify architecture.

The gallery intentionally does not autoplay. The centered piece is the only item that opens directly; selecting a side piece rotates it into focus first. On touch devices, a horizontal drag rotates the selection while vertical movement remains normal page scrolling. Filter controls collapse the loop to Design, AI motion or Reels without removing the underlying accessible media metadata.

Navigation state, theme changes, disclosures and media-viewer behavior remain independent of ScrollTrigger.

The Rodociclo case study includes a native range-input comparison control. It can be dragged, operated with the keyboard, or reset to an even split with a double click. The comparison exposes live percentage text to assistive technology, while separate viewer controls open each complete screenshot at its original proportions. This functionality does not depend on GSAP.

## Reduced motion and older devices

The page respects `prefers-reduced-motion`. When reduction is requested:

- GSAP page motion and parallax are not initialized;
- decorative CSS loops are disabled;
- disclosures and the media viewer change state immediately;
- smooth scrolling is disabled;
- content remains in its final readable position.

Mobile layouts use shorter entrances, simplified shutters and no parallax or pointer depth. The full-page canvas field is disabled below 821 px, on coarse pointers and when reduced motion is requested. Pointer response runs only on hover-capable fine pointers. Decorative motion pauses while the browser tab is hidden, and `will-change` is applied only during relevant pointer interactions.

All content is visible without JavaScript. The mobile navigation expands in the document flow and both case studies remain open when JavaScript is unavailable.

## Theme system

Dark and light themes are defined at the beginning of `style.css` using custom properties. Change the palette there:

```css
:root { /* dark theme */ }
html[data-theme="light"] { /* light theme */ }
```

The accessible navigation toggle saves the selection under `artur-portfolio-theme` in `localStorage`. On a first visit, the page respects `prefers-color-scheme`. The browser `theme-color` metadata is updated whenever the theme changes.

When changing colors, verify text, muted text, controls, focus indicators and borders in both themes. The interface uses an Apple/Nike-inspired near-monochrome system: red is the only expressive accent, while neutral steel gray supports secondary details. Colors inside Artur's real artwork are preserved.

## Media source and output mapping

The read-only source library used for this release is:

```text
C:\Users\User\Desktop\Portfolio
```

The integration copies and optimizes media into `assets/`; it does not rename, delete, overwrite or modify anything in the Desktop source folders.

| Source file | Repository output |
| --- | --- |
| `Rodociclo\HomepageAntigaRDC.png` | `assets/images/rodociclo-before.webp` |
| `Rodociclo\HomepageNovaRDC.png` | `assets/images/rodociclo-after.webp` |
| `Rodociclo\RDCMobile.jpeg` | `assets/images/rodociclo-mobile.webp` |
| `Bike Tech Moinhos\HomepageAntigaBTM.png` | `assets/images/biketech-before.webp` |
| `Bike Tech Moinhos\HomepageNovaBTM.png` | `assets/images/biketech-after.webp` |
| `Bike Tech Moinhos\BTMobile.jpeg` | `assets/images/biketech-mobile.webp` |
| `Designs\DZ1.png` | `assets/images/design-work-01.webp` |
| `Designs\DZ2.png` | `assets/images/design-work-02.webp` |
| `Designs\DZ3.png` | `assets/images/design-work-03.webp` |
| `Designs\DZ4.png` | `assets/images/design-work-04.webp` |
| `Designs\DZ5.png` | `assets/images/design-work-05.webp` |
| `Vídeos\AI1.mp4` | `assets/videos/ai-video-01.mp4` + `assets/images/ai-video-01-poster.webp` |
| `Vídeos\AI2.mp4` | `assets/videos/ai-video-02.mp4` + `assets/images/ai-video-02-poster.webp` |
| `Vídeos\AI3.mp4` | `assets/videos/ai-video-03.mp4` + `assets/images/ai-video-03-poster.webp` |
| `Vídeos\Reel1.mp4` | `assets/videos/reel-01.mp4` + `assets/images/reel-01-poster.webp` |
| `Vídeos\Reel2.mp4` | `assets/videos/reel-02.mp4` + `assets/images/reel-02-poster.webp` |
| `Vídeos\Reel3.mp4` | `assets/videos/reel-03.mp4` + `assets/images/reel-03-poster.webp` |

AI1, AI2 and AI3 are visibly identified as AI-generated work. Their gallery items and viewer detail use the supplied disclosure: “Created entirely from scratch using AI tools, from concept and generation to final editing.” Reel1, Reel2 and Reel3 are presented only as edited reels, without invented campaign details.

## Media optimization and full-ratio viewer

The 11 source images were exported as WebP at their full native pixel dimensions, with no crop or aspect-ratio change. Current files range from roughly 50–151 KB. For later replacements, retain sRGB, keep the longest edge near 1600–2000 px when the source supports it, and visually inspect interface text after exporting around WebP quality 78–86.

All six videos remain vertical H.264 MP4 files with AAC audio and fast-start metadata. AI1, AI2, AI3 and Reel2 were scaled proportionally to 720 px wide and visually compressed; Reel1 and Reel3 were already 720p and were remuxed without video or audio recompression. Posters are representative WebP frames with the same vertical ratio.

Editorial tiles may crop a preview with `object-fit: cover`, but the accessible viewer always renders media with automatic width and height, bounded by `max-width`, `max-height` and `object-fit: contain`. The viewer therefore shows the complete uncropped image or video without stretching. Videos are attached only after the viewer opens, use native controls, `playsinline` and `preload="metadata"`, and never autoplay.

## Replace media later

1. Preserve the output filename listed in the manifest, or update the corresponding `data-media-src` and `data-media-poster` values in `index.html`.
2. Optimize the replacement without changing its proportions.
3. Update `data-media-width`, `data-media-height`, `data-media-alt`, title and category values.
4. Keep `data-media-ready="true"` only when both the referenced file and, for video, its poster exist.
5. For AI-originated work, retain an accurate `data-media-note`; remove it for conventional edited work.
6. Verify tile loading, the full-ratio viewer, focus return, Escape behavior and mobile overflow before publishing.

For art-directed responsive sources, a `<picture>` element may replace the generated inline image. Preserve the trigger’s accessible name and viewer data attributes.

## Full asset manifest

### Navigation portrait

```text
assets/images/artur-profile.webp
```

### Project screenshots

```text
assets/images/rodociclo-before.webp
assets/images/rodociclo-after.webp
assets/images/rodociclo-mobile.webp
assets/images/biketech-before.webp
assets/images/biketech-after.webp
assets/images/biketech-mobile.webp
```

### Creative gallery images

```text
assets/images/design-work-01.webp
assets/images/design-work-02.webp
assets/images/design-work-03.webp
assets/images/design-work-04.webp
assets/images/design-work-05.webp
```

### Motion work and posters

```text
assets/videos/ai-video-01.mp4
assets/videos/ai-video-02.mp4
assets/videos/ai-video-03.mp4
assets/videos/reel-01.mp4
assets/videos/reel-02.mp4
assets/videos/reel-03.mp4
assets/images/ai-video-01-poster.webp
assets/images/ai-video-02-poster.webp
assets/images/ai-video-03-poster.webp
assets/images/reel-01-poster.webp
assets/images/reel-02-poster.webp
assets/images/reel-03-poster.webp
```

### Résumé

```text
assets/resume/Artur_Silveira_Resume.pdf
```

## Update the résumé

Replace the PDF at the existing path and keep its filename, or update every résumé link in `index.html`. The included starter uses only the supplied facts. Before publishing an application-specific version, confirm the final wording and keep selectable text. A practical target is comfortably below 2 MB.

## Update project and profile text

Visitor-facing content is in `index.html`. The two case studies use `data-case-study` disclosure blocks and must retain their eight-part sequence. Keep claims evidence-based and keep “Social Media Manager” limited to Rodociclo Bikeshop and Bike Tech Moinhos.

The media viewer takes its title, category, source path and alternative text from each tile’s data attributes. This lets the gallery remain consistent without duplicating content in JavaScript.

## Content requiring Artur’s confirmation

Before the final public launch, Artur should confirm:

- final public-facing titles and context for DZ1–DZ5, plus final captions and alternative text;
- case-study specifics, particularly research methods, feedback evidence and rollout details;
- the Rodociclo outcome wording and the current R$30,000–R$50,000 range;
- role titles and employment dates for all three experience entries;
- education providers, program names and completion dates;
- English level, email, location and global-availability statement;
- the “Currently exploring Figma and advanced product design workflows” note;
- the final résumé;
- the production domain for canonical and share metadata.

Editorial HTML comments inside both case studies mark the narrative areas that need confirmation. They are not visible to visitors.
