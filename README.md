# Artur Silveira — Portfolio

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
        └── Artur_Silveira_Resume_Automattic.pdf
```

The media areas currently use CSS-rendered fallback frames. They display the expected path but do not request absent files, so the initial portfolio has no media-related 404s.

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
- one hero entrance timeline and one small decorative timeline;
- grouped ScrollTriggers for editorial sections;
- distinct mask and directional sequences for each project;
- a single timeline drawing sequence;
- three restrained desktop-only parallax effects;
- cleanup through `revert()` when motion preferences change or the page is left.

Navigation state, theme changes, disclosures and media-viewer behavior remain independent of ScrollTrigger.

## Reduced motion and older devices

The page respects `prefers-reduced-motion`. When reduction is requested:

- GSAP page motion and parallax are not initialized;
- decorative CSS loops are disabled;
- disclosures and the media viewer change state immediately;
- smooth scrolling is disabled;
- content remains in its final readable position.

Mobile layouts use shorter entrances and omit parallax. Pointer response runs only on hover-capable fine pointers. Decorative motion pauses while the browser tab is hidden.

All content is visible without JavaScript. The mobile navigation expands in the document flow and both case studies remain open when JavaScript is unavailable.

## Theme system

Dark and light themes are defined at the beginning of `style.css` using custom properties. Change the palette there:

```css
:root { /* dark theme */ }
html[data-theme="light"] { /* light theme */ }
```

The accessible navigation toggle saves the selection under `artur-portfolio-theme` in `localStorage`. On a first visit, the page respects `prefers-color-scheme`. The browser `theme-color` metadata is updated whenever the theme changes.

When changing colors, verify text, muted text, controls, focus indicators and borders in both themes. Keep red as the primary action color and purple as a secondary accent.

## Add or replace project screenshots

Project frames are already connected to the accessible media viewer through `data-*` attributes. To activate an image:

1. Add the WebP or AVIF file at the exact manifest path.
2. Find the matching element in `index.html` by its `data-media-src` value.
3. Change `data-media-ready="false"` to `data-media-ready="true"`.

JavaScript then adds a lazy-loaded image to the existing editorial frame and opens the same file in the viewer. The frame dimensions are fixed, preventing layout shifts. Keep the supplied descriptive `data-media-alt` text accurate; edit it if the final screenshot content differs.

For art-directed sources, replace the generated inline image with a `<picture>` element using AVIF and WebP sources. Preserve the trigger’s accessible name and viewer data attributes.

Recommended exports:

- Main desktop screenshots: 1800 × 1125 px, approximately 8:5.
- Supporting desktop or detail screenshots: 1400–1800 px on the longest edge.
- Mobile screenshots: 900 × 1800 px, approximately 1:2.
- Creative gallery images: 1200–1800 px on the longest edge, preserving the intended crop.
- Maximum image width: usually 1600–2000 px.
- Target size: generally below 250 KB; allow slightly more only when interface detail requires it.

Export in sRGB. WebP quality around 72–82 is a good starting point. AVIF may be smaller, but inspect fine type and high-contrast edges before publishing.

## Add or replace videos

Video tiles use `data-media-kind="video"`. To activate one:

1. Add the MP4 and its poster image at the paths listed below.
2. Change the tile’s `data-media-ready` value to `true`.
3. Confirm its title, category and accessible description.

The gallery loads only the poster image. The MP4 source is assigned when a visitor opens the viewer. Videos use native controls, `playsinline` and `preload="metadata"`; playback never begins automatically.

Recommended video encoding:

- MP4 container, H.264 video and AAC audio.
- 720p or 1080p at the source frame rate, usually 24 or 30 fps.
- CRF 24–28 or an equivalent visually inspected setting.
- AAC at roughly 96–128 kbps when audio is necessary.
- Fast-start enabled so the MP4 metadata is at the beginning.
- Preferably below 8–12 MB per clip.

Poster recommendations:

- Export a WebP poster matching the video’s display ratio.
- Use at least 1280 px on the longest edge.
- Keep it below approximately 180 KB.
- Choose a representative frame without embedded play controls; the interface supplies its own play affordance.

## Full asset manifest

### Project screenshots

```text
assets/images/rodociclo-before.webp
assets/images/rodociclo-after.webp
assets/images/rodociclo-mobile.webp
assets/images/rodociclo-detail.webp
assets/images/biketech-before.webp
assets/images/biketech-after.webp
assets/images/biketech-mobile.webp
assets/images/biketech-detail.webp
```

### Creative gallery images

```text
assets/images/visual-work-01.webp
assets/images/visual-work-02.webp
assets/images/visual-work-03.webp
assets/images/visual-work-04.webp
assets/images/visual-work-05.webp
assets/images/visual-work-06.webp
```

### Motion work and posters

```text
assets/videos/motion-work-01.mp4
assets/videos/motion-work-02.mp4
assets/videos/motion-work-03.mp4
assets/images/motion-work-01-poster.webp
assets/images/motion-work-02-poster.webp
assets/images/motion-work-03-poster.webp
```

### Résumé

```text
assets/resume/Artur_Silveira_Resume_Automattic.pdf
```

## Update the résumé

Replace the PDF at the existing path and keep its filename, or update every résumé link in `index.html`. The included starter uses only the supplied facts. Before publishing an application-specific version, confirm the final wording and keep selectable text. A practical target is comfortably below 2 MB.

## Update project and profile text

Visitor-facing content is in `index.html`. The two case studies use `data-case-study` disclosure blocks and must retain their eight-part sequence. Keep claims evidence-based and keep “Social Media Manager” limited to Rodociclo Bikeshop and Bike Tech Moinhos.

The media viewer takes its title, category, source path and alternative text from each tile’s data attributes. This lets the gallery remain consistent without duplicating content in JavaScript.

## Content requiring Artur’s confirmation

Before the final public launch, Artur should confirm:

- final screenshots, gallery work, video edits, poster frames, captions and alt text;
- case-study specifics, particularly research methods, feedback evidence and rollout details;
- the Rodociclo outcome wording and the current R$30,000–R$50,000 range;
- role titles and employment dates for all three experience entries;
- education providers, program names and completion dates;
- English level, email, location and global-availability statement;
- the “Currently exploring Figma and advanced product design workflows” note;
- the final résumé;
- the production domain for canonical and share metadata.

Editorial HTML comments inside both case studies mark the narrative areas that need confirmation. They are not visible to visitors.
