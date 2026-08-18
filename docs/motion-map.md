# Working Proof — interaction and motion map

This file is the motion-direction contract for the portfolio. The interface is quiet at rest; input reveals a different behaviour in each chapter. Motion is progressive enhancement: every section remains readable and functional when motion is reduced or JavaScript is unavailable.

| Chapter | Primary mechanic | What it communicates | Reference lineage | Reduced/touch behaviour |
| --- | --- | --- | --- | --- |
| Signature intro | SVG handwriting path | Artur made the system and signs the work | Nothin' opening restraint | Skipped |
| Hero | Local elastic letter field on `before` plus direct-manipulation 3D proof object | Design decisions are responsive and implementation is tangible | Refero/Resend sculptural object, OriginKit dynamic type/spin image | Stable typographic lockup; Three.js removed |
| Selected proof | List-controlled live preview with real project media, visual mosaic and procedural canvas | Every line in the index has working evidence | Dennis Snellenberg project previews, p5aholic live instruments | Tappable static preview below the list |
| Work manifesto | One authoritative serif layer drifts along the persistent constraint axis | Constraint is translated into a working interface without duplicated glyph layers | Refero restraint, Junni continuity | Stable serif statement |
| Rodociclo chapter | Opposing-axis title assembly resolves directly into the full product artefact | Reconstruction: separate parts become one system | Junni asymmetric movement, Dennis chapter typography | Final title composition appears immediately |
| Rodociclo story | Sticky, scroll-bound real before/after wipe | The outcome is grounded in a visible transformation | ReactBits scroll expand/morph slider | Accessible static 50/50 comparison |
| Rodociclo phone | Proportional device viewport matching the native `788 × 1600` screenshot | Mobile work is shown without stretching or transform conflict | Apple product presentation | Full native screenshot; full image remains available in viewer |
| Bike Tech chapter | Sans-to-serif optical expansion and vertical reveal | A catalogue becomes more premium without repeating Rodociclo | Refero type contrast, Junni rhythm change | Final title composition appears immediately |
| Bike Tech story | Desktop artefact resolves into a proportional mobile viewport as the outcome copy progresses | “Across desktop and mobile” is demonstrated instead of stated | ReactBits morph slider/scroll expand | Static mobile state is shown |
| Visual & Motion | Native coverflow with varied proportions and full-ratio click viewer | The breadth of visual work is navigable, not a wall of thumbnails | OriginKit coverflow gallery | Native horizontal scroll and one-tap viewer |
| Experience | Context media washes across the list on hover/focus | Each role produces visible work | Dennis contextual previews | Selection is explicit on tap/focus |
| Working disciplines | Each discipline changes the section environment: grid, code path, layered imagery or network | The skillset is demonstrated through behaviour | p5aholic contained experiments, Junni service-state changes | Selected state switches instantly |
| Method | Selectable four-act path with a drawn route | Process is a sequence of decisions | Refero technical microtype, Junni staged system | Static path and direct selection |
| Lab | Seven on-demand procedural systems | Creative coding has depth beyond decorative particles | p5aholic experiments, Google Experiments | Lower DPR and non-looping reduced-motion states |
| Contact | Scroll-assembled interface fragments and intentional email text scramble | The site resolves from system into one human action | Nothin' closing silence, Junni typographic repetition | Static final composition and email |
| Route continuity | Selected real media expands across the viewport and releases into the route intro | Opening or leaving a project remains spatially connected to its source | Dennis project transitions, Awwwards page continuity | Immediate navigation |

## Performance contract

- Pointer work is local to the active section and scheduled through `requestAnimationFrame` or GSAP quick transforms.
- Continuous rendering is limited to visible WebGL/Canvas instruments plus one shared scroll-settling RAF for the global field; all pause when hidden or outside the viewport.
- ScrollTrigger timelines animate transform, opacity and short-lived clip paths. No scroll hijacking is introduced.
- The real mobile screenshots are `788 × 1600`; the screen viewport uses the same ratio and `object-fit: contain`, with independent wrappers for structure and any future perspective treatment.
- Desktop-only mechanics are removed below the interaction breakpoint. Touch keeps explicit buttons and native scrolling.
- `prefers-reduced-motion` exposes final content states, removes parallax and continuous motion, and preserves every link, viewer and project action.
