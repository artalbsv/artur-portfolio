# Interaction Capability Map

## Skill audit result

The global skill set was inspected before implementation. Equivalent Three.js, GSAP and Motion Design material was not duplicated.

| Capability | Primary skill | Decision |
| --- | --- | --- |
| Creative interaction architecture | Genjutsu / Cast | Installed globally; used to audit and transform the existing interface |
| Motion principles | Motion Design Skill | Existing local skill matches the LottieFiles source; retained once |
| Long-form orchestration | GSAP Timeline + ScrollTrigger | Existing skills retained |
| Shared spatial transitions | GSAP Flip patterns | Covered by existing GSAP plus Genjutsu plugin guidance |
| Layout state and gesture principles | Genjutsu Framer Motion guide | Capability retained without adding a redundant runtime |
| Spatial/WebGL systems | Existing Three.js skill family | Ten existing skills cover fundamentals through shaders/post-processing |
| Procedural visual code | Three.js / Canvas | Existing runtimes and Lab used selectively |
| Smooth scroll and velocity | GSAP + native scroll | Lenis is optional; native scroll remains the default to avoid hijacking |
| Design grammar and hierarchy | Design DNA + Frontend Design + Awwwards | Existing skills retained |

## Runtime ownership

The site does not add a library merely because a skill exists.

- React owns semantic state and accessible controls.
- GSAP owns multi-step choreography and scroll-linked interpolation.
- CSS owns themes, hover/focus states and low-cost ambient loops.
- Three.js owns only spatial scenes that require a camera and depth.
- Canvas owns small procedural signals where WebGL would add unnecessary weight.

## Interaction matrix

| Experience | Input | Response | Accessible equivalent |
| --- | --- | --- | --- |
| Hero object | Pointer drag / touch drag | Rotate existing spatial object | Static object in reduced motion |
| Project Stage | Native scroll | Advance spatial state | Direct state buttons |
| Project Stage | Click / Enter | Select project state or open route | Semantic buttons and links |
| Project Stage | Arrow keys | Previous / next state | Focusable controller |
| Project Stage | Swipe | Previous / next state | Same visible state controls |
| Project media | Click | Open adaptive viewer | Focus return and Escape close |
| Capability System | Hover intent / focus / click | Change environment and proof | Tabs with `aria-selected` |
| Lab gateway | Drag / pointer | Alter preview | Link to full Lab and static fallback |
| Contact | Hover / focus | Typographic micro-response | Standard mail and download links |

## Property ownership rule

No DOM node is allowed to have scroll, hover, entrance and 3D systems competing for the same `transform`.

- `*-scroll`: scroll choreography only.
- `*-layout`: state geometry and shared transitions.
- `*-perspective`: pointer/touch tilt only.
- `*-media`: intrinsic image/video sizing only.
- `*-chrome`: borders, labels and controls only.

This rule prevents the device drift and transform conflicts seen in earlier versions.

## Performance budget

- One global ambient tick at most; it pauses when the tab is hidden.
- Three.js renders on demand when possible and caps device pixel ratio.
- Scroll state changes only at thresholds; React is not updated every frame.
- Media remains lazy and preserves intrinsic dimensions.
- `will-change` is applied only during active transitions.
- Mobile removes depth parallax and expensive pointer responses.
