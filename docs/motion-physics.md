# Motion Physics

## Physical character

The site should feel precise, weighted and calm: quick recognition, measured travel and a clean stop. It must not bounce, wobble or announce every state change.

## Core tokens

| Token | Value | Use |
| --- | --- | --- |
| `settle` | `power3.out` | Entrances and direct state selection |
| `transform` | `power2.inOut` | Shared geometry and masks |
| `exit` | `power2.in` | Short, subordinate exits |
| `micro` | 160–240 ms | Hover, focus and control feedback |
| `state` | 620–880 ms | Project/capability state changes |
| `event` | 900–1250 ms | Route and act transitions |
| `stagger` | 40–70 ms | Small metadata groups only |

No bounce easing is part of the core language.

## Motion intensity graph

| Act | Resting intensity | Event peak |
| --- | ---: | ---: |
| Identity | 2 | 7 |
| Project Stage | 3 | 8 |
| Capability System | 2 | 5 |
| Lab | 3 | 7 |
| Contact | 1 | 6 |

The page never drops to visual zero, but ambient movement remains below the content hierarchy.

## Three layers

### Ambient

- A single coordinate field breathes by a few pixels and reacts lightly to chapter state.
- Hairlines can respond to scroll velocity through scale or opacity, never layout dimensions.
- The layer pauses while the document is hidden.

### Responsive

- Pointer proximity changes depth only on hover-capable devices.
- Buttons use short counter-motion between label and arrow.
- Stage selection is interruptible; new input retargets the current transition rather than queueing it.

### Event

- Project state transformations receive the longest durations.
- Route transitions share a media origin.
- Contact collapse is the final high-intensity event.

## Scroll behavior

- Scroll remains native.
- The Project Stage uses a sticky viewport inside a finite section, not an endless pin.
- Scroll progress selects one of four clear states.
- Velocity may influence tiny line skew/offset, never content readability.

## Accessibility and interruption

- All hover responses also respond to focus.
- State animations can be interrupted without jumping through queued timelines.
- `prefers-reduced-motion` removes scrubbing, parallax, breathing and spatial route transitions.
- Essential state changes use immediate composition updates with short opacity changes at most.
## Transform ownership

Nested wrappers are mandatory when multiple motion dimensions are needed. Scroll, perspective, layout and media scale never write to the same transform property on the same element.
