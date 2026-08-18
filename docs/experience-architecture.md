# Working Proof — Experience Architecture

## Audit baseline

The current homepage measures approximately 20.2 physical viewports at 1280 × 720. Its content is strong, but its delivery model is still a linear stack: hero, index, long project chapters, gallery, profile, method, lab gateway and footer. The result asks the visitor to consume the portfolio as an article.

The next version treats the homepage as a compact visual application. Detailed project routes and the full Lab remain available, but the main experience becomes a five-act state system.

## Interaction thesis

> A quiet technical editorial interface whose persistent coordinate/media stage transforms real proof through five acts. Input reveals capability and state; typography remains restrained, and red appears only as evidence of an active decision.

## Reference mechanics

| Reference | Mechanic retained | Application |
| --- | --- | --- |
| Refero / Resend | Black-on-black hierarchy, hairlines, monumental moments used sparingly | Global design grammar and type hierarchy |
| Nothin’ | Persistent visual layer that changes meaning between chapters | Ambient coordinate field |
| Junni | A continuous stage behind changing DOM compositions | Cross-act continuity |
| p5aholic | Fixed collection interface with live previews and stateful selection | Project Stage and Lab access |
| Still Making Stuff | Viewport-scale application, direct manipulation, overlays and keyboard state | Stage controls and Lab mode |
| Dennis Snellenberg | List-to-media response and spatial project transitions | Project index and route handoff |

## The five acts

### Act 01 — Identity

- Physical length: approximately 1 viewport.
- Dominant focus: the statement and one directly manipulable spatial object.
- Purpose: establish Artur, Porto Alegre and the design/code/motion position without explaining the whole portfolio.
- Continuity: the hero coordinate line becomes the frame used by the Project Stage.

### Act 02 — Project Stage

- Physical length: approximately 2.25–2.5 viewports.
- One sticky viewport represents four states: Rodociclo, Bike Tech Moinhos, Visual & Motion, and Experiments.
- Normal page scroll advances the stage; buttons, arrow keys and touch gestures can select a state directly.
- No wheel hijacking. The scroll remains native and escapable.
- Desktop media becomes a device, the device fragments into a media strip, and the strip resolves into a procedural Lab signal.
- Each state has one dominant visual and concise contextual metadata. Full content remains on existing project/Lab routes.

### Act 03 — Capability System

- Physical length: approximately 1 viewport.
- Four states: Design, Code, Motion and AI.
- The same interface changes its grid, visual behavior and contextual proof instead of showing a skill wall.
- Experience, education and languages appear as compact metadata attached to relevant states.

### Act 04 — Enter the Lab

- Physical length: approximately 0.8–1 viewport.
- One live spatial/procedural preview, one clear entry action and a compact index of the seven existing systems.
- The full `/lab/` route remains the deeper interactive mode.

### Act 05 — Contact

- Physical length: approximately 1 viewport.
- A strong final typographic composition with email and résumé.
- The persistent field collapses into the contact rule, visually closing the system.

## Target length

The homepage target is 5.8–6.5 physical viewports on desktop, compared with the current 20.2. Mobile may be slightly longer because controls and metadata need comfortable touch spacing, but it must remain a five-act experience rather than an expanded article.

## Content model

- Homepage: proof, transitions, discovery and concise context.
- Project routes: full before/after, mobile media, responsibilities and case notes.
- Media viewer: full-ratio image/video inspection.
- Lab route: all seven interactive systems.
- No real content is deleted; long-form detail moves to the place where the visitor explicitly requests it.

## Usability contract

- Native vertical scrolling is always available.
- Every state has visible controls and a text equivalent.
- Arrow keys work when the stage or capability controller is focused.
- Touch uses tap and horizontal swipe; nothing relies on hover.
- Focus is never trapped outside a true modal/viewer.
- Reduced motion shows the same states without spatial interpolation or persistent loops.
