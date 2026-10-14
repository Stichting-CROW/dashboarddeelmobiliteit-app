# Transition Guidelines

This document defines the default motion rules for UI transitions in this app.
Use these values as the first choice to keep interaction feedback consistent.

## Principles

- Keep transitions short and purposeful.
- Animate only properties that improve clarity.
- Prefer easing that feels smooth without overshoot.
- Respect reduced-motion preferences for non-essential animation.

## Default Tokens

Use these defaults unless a component has a clear reason to differ.

- Duration (quick): `160ms`
- Duration (default): `220ms`
- Duration (emphasis): `260ms`
- Easing (default): `ease`
- Easing (emphasis): `cubic-bezier(0.22, 1, 0.36, 1)`

## Recommended Property Sets

### Hover and subtle feedback

- `background-color`, `border-color`, `color`, `opacity`
- Typical timing: `160ms ease`

### Layout emphasis (cards/panels)

- `width`, `padding`, `border-radius`
- Typical timing: `260ms cubic-bezier(0.22, 1, 0.36, 1)`
- Do not use `transition: all`; list explicit properties.

### Entry/exit visibility

- `opacity` (+ optional `transform` for small motion)
- Typical timing: `220ms ease`

## Accessibility

When adding new transitions, include reduced-motion fallback:

```css
@media (prefers-reduced-motion: reduce) {
  .my-component {
    transition: none;
  }
}
```

## Current Usage

- Active card expansion on provider performance page uses the layout emphasis preset:
  - `width`, `padding-right`, right border radii
  - `260ms cubic-bezier(0.22, 1, 0.36, 1)`
