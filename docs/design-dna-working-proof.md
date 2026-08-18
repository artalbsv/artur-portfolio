# Working Proof — Design DNA and reference matrix

This document is the creative-direction contract for the remaster. Every major viewport must implement at least one mechanic listed below. Content remains Artur's real work; the references define composition and behavior, not branding or copied assets.

## Audit of the current Working Proof draft

| Area | Current problem | Why it reads as generic or unfinished | Required correction |
| --- | --- | --- | --- |
| Navigation | Floating rounded island dominates the canvas | Familiar SaaS/Framer pattern and weak editorial integration | Quiet masthead using name, index, Porto Alegre time and minimal menu; no large pill container |
| Hero | Split headline/3D composition behaves like a premium landing-page hero | Predictable copy + CTA + visual structure; 3D panels disappear from the back | Treat typography as the viewport architecture; place a sculptural, double-sided proof object through it; actions become editorial text links |
| 3D studio object | One-sided planes turn invisible after 180° rotation | Broken interaction contract | Double-sided textured materials, subtle backs, bounded inertial rotation, contrast-safe edges |
| Selected work | Two projects reuse the same component composition | Repetition reveals the template | Rodociclo becomes a cinematic desktop/mobile transformation; Bike Tech becomes a horizontal catalogue ribbon with different hierarchy |
| Project media | Images float without a physical or editorial frame | No sense of product context or scale | Browser chrome, device frame, proportional phone scale, edge treatment and project-specific stage |
| Outcome | Oversized paragraph breaks awkwardly and overwhelms the viewport | Scale without editorial control | Metric as isolated serif numerals/statement with readable supporting copy and fixed optical line lengths |
| Visual gallery | Track is wider than the viewport but not scrollable on desktop and has no controls | Looks interactive but is inaccessible; creates empty area | Native horizontal scroll, wheel translation while hovered, previous/next controls, progress and keyboard navigation; full-ratio viewer remains |
| Profile / skills | Left half becomes unused while tab content stays in a narrow right column | Negative space has no focal function | One magazine-style portrait/manifesto spread plus compact credits index across the baseline |
| Method | Three selector columns plus a result panel resemble a configurator | Product-demo/SaaS grammar | Convert into a quiet four-act editorial method whose text and proof image transform during scroll/selection |
| Lab gateway | List is functional but visually separate from the rest of the art direction | Feels appended | One full-bleed experiment window with a live preview and a precise index leading to the dedicated Lab route |
| Contact | Huge outlined sentence + two links | Generic portfolio ending and weak final memory | Typographic closing ritual: signature, giant selectable email, Porto Alegre clock, availability/status and restrained interaction |

## Reference → mechanic → application

| Reference | Identifiable mechanic | Application |
| --- | --- | --- |
| Refero / Resend style | Pure-black canvas, graphite 1px hairlines, restrained 6/16px radii, almost no shadow, serif/sans/mono contrast, black sculptural 3D object | Global tokens, masthead, hero, media frames, route transitions, project metadata |
| Nothin' | Near-empty loading ritual, single mark with disproportionate presence, black silence | Signature intro and first 800ms of the home |
| Junni | Strong changes in section rhythm, typographic repetition, work as movement rather than card grid | Transition from hero to work; lab gateway and footer rhythm |
| Dennis Snellenberg | Oversized project typography, preview-led index, contextual `VIEW` interaction | Work index and case-study navigation |
| Anthony Fu | Concise personal voice, content density only where useful, authored small details | Profile copy, credits, navigation labels and removal of redundant prose |
| p5aholic experiments | Each interaction behaves as a contained live instrument | Dedicated Lab route and on-demand lifecycle |
| OriginKit Spin Image | Pointer/direct-manipulation media with depth and inertia | Hero proof sculpture and select project media, with no cursor follower |
| OriginKit Coverflow Gallery | Center-weighted media navigation with depth and obvious lateral movement | Visual & Motion gallery, adapted to native accessible scroll |
| OriginKit Reactive Lines | Quiet lines that react only inside a bounded context | Hairline field around the hero sculpture, disabled on touch/reduced motion |
| OriginKit Text Morph / dynamic weight | Text state changes without layout jitter | One controlled hero/status word transition using fixed metrics; never continuous font-weight tremor |
| ReactBits Scroll Expand / Morph Slider | Media changes scale/state during intentional scroll or selection | Rodociclo transformation and before/after case interaction |
| ReactBits Border Glow | Interaction-only edge signal | Focus/active border on selected proof and media viewer, monochrome by default |
| Still Making Stuff / Game | Playful state transition and direct manipulation embedded in authored typography | Lab gateway and microcopy; not a site-wide game layer |
| Apple / Nike | Product confidence, extreme scale contrast, disciplined palette and decisive crop | Media stages, concise copy, final contact statement |

## Design system

- Canvas: `#000000`; elevated void: `#070707`; graphite: `#17191b`; hairline: `#292d30`.
- Primary text: `#f4f3ef`; secondary: `#a1a4a5`; tertiary: `#686b70`.
- Interaction signal: restrained crimson `#df1f2d`, invisible until active/focused/dragged. No permanent purple/red pairing.
- Display serif: a self-hosted open editorial serif or robust Georgia fallback, used for no more than three high-impact statements.
- Structural sans: system grotesk with moderate weight and tight optical tracking.
- Technical mono: system mono for indices, roles, time and implementation details.
- Grid: 12 columns, fluid outer gutter, contained max around 1560px; alignment can break the grid only for media or display typography.
- Borders: 1px; radii: 6px controls, 16px media/dialog surfaces. No decorative card shadows.
- Rhythm: variable rooms, not repeated section padding. Hero 100svh; dense project index; cinematic project stage; quiet profile; high-impact close.

## Design style

- Mood: silent, precise, cinematic, authored, technically confident.
- Visual metaphor: a working proof archive that becomes an instrument when touched.
- Balance: asymmetric, with negative space assigned a job—framing, anticipation or interaction—not left as accidental emptiness.
- Imagery: real work only, presented as product artifacts with browser/device context; crop only in previews, full ratio on demand.
- Interaction feel: quiet at rest, immediate and unexpected on input. No bounce, repeated fade-up system or cursor-chasing ornament.

## Visual effects and performance contract

- Primary technology: GSAP/ScrollTrigger for short narrative transitions; Three.js only for the hero artifact; Canvas/WebGL Lab on demand.
- 3D: double-sided materials, capped DPR, no postprocessing requirement, `ResizeObserver`, visibility pause, full cleanup.
- Scroll: one short sticky project transformation on wide screens; no long pinning or scroll hijack.
- Text: line masks and one state morph. Stable glyph metrics, no dynamic-weight jitter.
- Media: transform/clip reveals, 3D perspective only on hover-capable devices, native scroll and keyboard controls.
- Fallback: reduced motion shows final states; low-end/touch removes parallax, continuous idle motion and pointer-reactive lines.
- Accessibility: native links/buttons, visible focus, no fake controls, dialog focus trap, full-ratio media viewer, 44px touch targets.

## Anti-template gate

Before a viewport is accepted:

1. Name the reference mechanic visible in it.
2. Confirm the negative space has a compositional role.
3. Confirm every apparently interactive element performs an action.
4. Confirm mobile is recomposed, not merely stacked.
5. Remove any component that could be dropped unchanged into a generic SaaS landing page.
