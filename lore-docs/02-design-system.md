# Lore — Design System Specification
Version: 1.0
Status: Engineering & Design Handoff
Last Updated: 2025-Q2

---

> **Naming Convention (read first)**
> All CSS custom properties follow the pattern: `--lore-[category]-[variant]-[modifier]`
> - `category` — semantic domain: `color`, `space`, `radius`, `shadow`, `font`, `anim`
> - `variant` — role within category: `bg`, `surface`, `border`, `text`, `accent`, `state`, `feedback`
> - `modifier` — optional qualifier: `subtle`, `strong`, `muted`, `inverse`, `hover`, `active`, `focus`, `disabled`
> Example: `--lore-color-text-muted`, `--lore-color-state-hover`, `--lore-shadow-focus-ring`
> Primitive tokens (raw values) use `--lore-primitive-[hue]-[stop]`.

---

## 1. Design Principles

### 1.1 Calm Intelligence
Lore communicates authority through restraint. Every visual decision — spacing, type size, colour weight — defaults to the quieter option unless there is a specific reason to be louder.
- **Do:** Use `--lore-color-accent` as a single focal point per view (active nav item, CTA button, focus ring).
- **Don't:** Apply accent colour to borders, backgrounds, and icons simultaneously within the same component.

### 1.2 Typographic Hierarchy First
Spatial relationships between text elements carry more information than decorative chrome. Borders, backgrounds, and shadows are supporting cast — never lead actors.
- **Do:** Establish section identity through type scale (`heading-2` → `body-md`) before reaching for dividers or card containers.
- **Don't:** Wrap every content group in a card panel just to create visual separation when spacing alone suffices.

### 1.3 Token Fidelity
No raw values in component code. Every colour, spacing unit, radius, and shadow must resolve to a design token. This ensures theme swaps (light → dark) require zero component-level changes.
- **Do:** Write `background: var(--lore-color-surface-default)` in component styles.
- **Don't:** Write `background: #F0EEF9` or `background: white` in component styles.

### 1.4 Accessible by Default
Keyboard operability and WCAG AA contrast are not optional enhancements — they are baked into every component specification. The focus ring token `--lore-shadow-focus-ring` must be applied to every interactive element without exception.
- **Do:** Render the `:focus-visible` focus ring on all interactive elements using `--lore-shadow-focus-ring`.
- **Don't:** Suppress outlines globally via `outline: none` or `outline: 0` without a custom focus indicator replacement.

### 1.5 Density Awareness
Lore is a knowledge tool used for long sessions. Comfortable line heights, generous vertical rhythm, and adequate touch targets reduce fatigue. Minimum interactive target size is 40×40px; minimum body text size is 15px rendered.
- **Do:** Use `--lore-space-20` (20px) as the minimum inner padding for interactive list items.
- **Don't:** Compress note rows to 28–32px height to fit more content; let the user control density via a future preference setting.

### 1.6 Progressive Disclosure
Complexity is hidden until needed. Block action toolbars, metadata chips, and AI prompt inputs appear on hover or explicit interaction — not by default. Animate reveals using the `--lore-anim-duration-fast` token (150ms) so feedback is instant but not jarring.
- **Do:** Show the block action toolbar (`block-actions`) only on block hover or focus-within.
- **Don't:** Permanently render all editing controls at rest state — it creates visual noise across a note with 20+ blocks.

---

## 2. Colour Tokens

### 2.1 Primitive Palette

All primitives are raw hex values. They are **never used directly in component code** — only referenced by semantic tokens. Stops follow a 50–950 scale (50 = lightest tint, 950 = darkest shade).

#### Purple (Brand)

| Token | Hex | HSL Approximation |
|---|---|---|
| `--lore-primitive-purple-50` | `#F5F3FF` | 250° 100% 97% |
| `--lore-primitive-purple-100` | `#EDE9FE` | 250° 95% 96% |
| `--lore-primitive-purple-150` | `#EAE7F7` | 249° 52% 93% |
| `--lore-primitive-purple-200` | `#DDD6FE` | 254° 94% 92% |
| `--lore-primitive-purple-300` | `#C4B5FD` | 258° 95% 85% |
| `--lore-primitive-purple-400` | `#A78BFA` | 263° 93% 76% |
| `--lore-primitive-purple-500` | `#8B5CF6` | 263° 87% 66% |
| `--lore-primitive-purple-600` | `#7C3AED` | 263° 82% 57% |
| `--lore-primitive-purple-700` | `#6D28D9` | 263° 70% 50% |
| `--lore-primitive-purple-800` | `#5B21B6` | 263° 69% 42% |
| `--lore-primitive-purple-900` | `#4C1D95` | 263° 69% 35% |
| `--lore-primitive-purple-950` | `#2E1065` | 263° 67% 23% |

#### Grey (Neutral)

| Token | Hex |
|---|---|
| `--lore-primitive-grey-0` | `#FFFFFF` |
| `--lore-primitive-grey-50` | `#F9F9FB` |
| `--lore-primitive-grey-100` | `#F0EEF9` |
| `--lore-primitive-grey-150` | `#E8E6F2` |
| `--lore-primitive-grey-200` | `#E2E0EC` |
| `--lore-primitive-grey-300` | `#C8C5D8` |
| `--lore-primitive-grey-400` | `#A09CB8` |
| `--lore-primitive-grey-500` | `#7A758F` |
| `--lore-primitive-grey-600` | `#5C5870` |
| `--lore-primitive-grey-700` | `#3D3A50` |
| `--lore-primitive-grey-800` | `#2A2640` |
| `--lore-primitive-grey-900` | `#1A1625` |
| `--lore-primitive-grey-950` | `#0F0C1A` |

#### Red (Error / Warning-strong)

| Token | Hex |
|---|---|
| `--lore-primitive-red-50` | `#FFF5F5` |
| `--lore-primitive-red-100` | `#FFE3E3` |
| `--lore-primitive-red-200` | `#FFC9C9` |
| `--lore-primitive-red-300` | `#FFA8A8` |
| `--lore-primitive-red-400` | `#FF8787` |
| `--lore-primitive-red-500` | `#FF6B6B` |
| `--lore-primitive-red-600` | `#FA5252` |
| `--lore-primitive-red-700` | `#E03131` |
| `--lore-primitive-red-800` | `#C92A2A` |
| `--lore-primitive-red-900` | `#A61E1E` |
| `--lore-primitive-red-950` | `#6E0E0E` |

#### Green (Success)

| Token | Hex |
|---|---|
| `--lore-primitive-green-50` | `#F0FDF4` |
| `--lore-primitive-green-100` | `#DCFCE7` |
| `--lore-primitive-green-200` | `#BBF7D0` |
| `--lore-primitive-green-300` | `#86EFAC` |
| `--lore-primitive-green-400` | `#4ADE80` |
| `--lore-primitive-green-500` | `#22C55E` |
| `--lore-primitive-green-600` | `#16A34A` |
| `--lore-primitive-green-700` | `#15803D` |
| `--lore-primitive-green-800` | `#166534` |
| `--lore-primitive-green-900` | `#14532D` |
| `--lore-primitive-green-950` | `#052E16` |

#### Yellow (Warning)

| Token | Hex |
|---|---|
| `--lore-primitive-yellow-50` | `#FFFBEB` |
| `--lore-primitive-yellow-100` | `#FEF3C7` |
| `--lore-primitive-yellow-200` | `#FDE68A` |
| `--lore-primitive-yellow-300` | `#FCD34D` |
| `--lore-primitive-yellow-400` | `#FBBF24` |
| `--lore-primitive-yellow-500` | `#F59E0B` |
| `--lore-primitive-yellow-600` | `#D97706` |
| `--lore-primitive-yellow-700` | `#B45309` |
| `--lore-primitive-yellow-800` | `#92400E` |
| `--lore-primitive-yellow-900` | `#78350F` |
| `--lore-primitive-yellow-950` | `#451A03` |

#### Blue (Info)

| Token | Hex |
|---|---|
| `--lore-primitive-blue-50` | `#EFF6FF` |
| `--lore-primitive-blue-100` | `#DBEAFE` |
| `--lore-primitive-blue-200` | `#BFDBFE` |
| `--lore-primitive-blue-300` | `#93C5FD` |
| `--lore-primitive-blue-400` | `#60A5FA` |
| `--lore-primitive-blue-500` | `#3B82F6` |
| `--lore-primitive-blue-600` | `#2563EB` |
| `--lore-primitive-blue-700` | `#1D4ED8` |
| `--lore-primitive-blue-800` | `#1E40AF` |
| `--lore-primitive-blue-900` | `#1E3A8A` |
| `--lore-primitive-blue-950` | `#172554` |

---

### 2.2 Semantic Tokens — Light Mode

Applied to `:root` or `[data-theme="light"]`.

#### Backgrounds

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-bg-canvas` | `var(--lore-primitive-grey-0)` → `#FFFFFF` | Main editor/note canvas |
| `--lore-color-bg-sidebar` | `var(--lore-primitive-grey-100)` → `#F0EEF9` | Sidebar / secondary panel |
| `--lore-color-bg-nav` | `var(--lore-primitive-purple-150)` → `#EAE7F7` | Left navigation rail |
| `--lore-color-bg-overlay` | `rgba(26,22,37,0.48)` | Modal backdrop scrim |
| `--lore-color-bg-tooltip` | `var(--lore-primitive-grey-800)` → `#2A2640` | Tooltip container |

#### Surfaces

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-surface-default` | `var(--lore-primitive-grey-0)` → `#FFFFFF` | Card, panel, popover background |
| `--lore-color-surface-subtle` | `var(--lore-primitive-grey-50)` → `#F9F9FB` | Inset section, code block background |
| `--lore-color-surface-recessed` | `var(--lore-primitive-grey-100)` → `#F0EEF9` | Input background, tag background |
| `--lore-color-surface-inverse` | `var(--lore-primitive-grey-900)` → `#1A1625` | Inverse chip, dark tooltip |

#### Borders

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-border-default` | `rgba(109,40,217,0.09)` | Default component border |
| `--lore-color-border-subtle` | `rgba(109,40,217,0.05)` | Divider lines, table rows |
| `--lore-color-border-strong` | `rgba(109,40,217,0.20)` | Focused input, active selection |
| `--lore-color-border-accent` | `var(--lore-primitive-purple-600)` → `#7C3AED` | Accent border (left-bar on block types) |

#### Text

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-text-default` | `var(--lore-primitive-grey-900)` → `#1A1625` | Body text, default labels — 16.3:1 on canvas ✓ |
| `--lore-color-text-muted` | `var(--lore-primitive-grey-600)` → `#5C5870` | Secondary labels, placeholders — 5.9:1 ✓ |
| `--lore-color-text-faint` | `var(--lore-primitive-grey-500)` → `#7A758F` | Timestamps, metadata — 4.6:1 ✓ AA |
| `--lore-color-text-inverse` | `var(--lore-primitive-grey-0)` → `#FFFFFF` | Text on dark surfaces |
| `--lore-color-text-accent` | `var(--lore-primitive-purple-700)` → `#6D28D9` | Links, active labels — 7.1:1 on canvas ✓ |
| `--lore-color-text-on-accent` | `#FFFFFF` | Text on `--lore-color-accent-default` bg |

#### Icons

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-icon-default` | `var(--lore-primitive-grey-600)` → `#5C5870` | Default UI icons |
| `--lore-color-icon-muted` | `var(--lore-primitive-grey-400)` → `#A09CB8` | Decorative, non-interactive icons |
| `--lore-color-icon-accent` | `var(--lore-primitive-purple-600)` → `#7C3AED` | Active nav icon, accent action |
| `--lore-color-icon-on-dark` | `#FFFFFF` | Icon on dark/inverse surface |

#### Accent

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-accent-default` | `var(--lore-primitive-purple-600)` → `#7C3AED` | Primary button, active state fill |
| `--lore-color-accent-hover` | `var(--lore-primitive-purple-700)` → `#6D28D9` | Primary button hover |
| `--lore-color-accent-active` | `var(--lore-primitive-purple-800)` → `#5B21B6` | Primary button pressed |
| `--lore-color-accent-subtle` | `var(--lore-primitive-purple-100)` → `#EDE9FE` | Accent-tinted surface (tag, badge) |
| `--lore-color-accent-muted` | `var(--lore-primitive-purple-300)` → `#C4B5FD` | Soft accent (pill background) |

#### State Overlays

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-state-hover` | `rgba(109,40,217,0.06)` | Hover overlay on interactive items |
| `--lore-color-state-active` | `rgba(109,40,217,0.12)` | Pressed/active overlay |
| `--lore-color-state-selected` | `rgba(109,40,217,0.10)` | Selected list row background |
| `--lore-color-state-focus-ring` | `rgba(124,58,237,0.35)` | Spread value for focus ring shadow |
| `--lore-color-state-disabled-fill` | `var(--lore-primitive-grey-150)` → `#E8E6F2` | Disabled control background |
| `--lore-color-state-disabled-text` | `var(--lore-primitive-grey-400)` → `#A09CB8` | Disabled label text |

#### Feedback

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-feedback-error-bg` | `var(--lore-primitive-red-50)` → `#FFF5F5` | Error block / toast background |
| `--lore-color-feedback-error-border` | `var(--lore-primitive-red-300)` → `#FFA8A8` | Error block border |
| `--lore-color-feedback-error-text` | `var(--lore-primitive-red-800)` → `#C92A2A` | Error message text — 5.1:1 ✓ |
| `--lore-color-feedback-error-icon` | `var(--lore-primitive-red-700)` → `#E03131` | Error icon fill |
| `--lore-color-feedback-warning-bg` | `var(--lore-primitive-yellow-50)` → `#FFFBEB` | Warning block background |
| `--lore-color-feedback-warning-border` | `var(--lore-primitive-yellow-300)` → `#FCD34D` | Warning block border |
| `--lore-color-feedback-warning-text` | `var(--lore-primitive-yellow-800)` → `#92400E` | Warning message text — 6.8:1 ✓ |
| `--lore-color-feedback-warning-icon` | `var(--lore-primitive-yellow-700)` → `#B45309` | Warning icon fill |
| `--lore-color-feedback-success-bg` | `var(--lore-primitive-green-50)` → `#F0FDF4` | Success toast background |
| `--lore-color-feedback-success-border` | `var(--lore-primitive-green-300)` → `#86EFAC` | Success block border |
| `--lore-color-feedback-success-text` | `var(--lore-primitive-green-800)` → `#166534` | Success message text — 7.2:1 ✓ |
| `--lore-color-feedback-success-icon` | `var(--lore-primitive-green-700)` → `#15803D` | Success icon fill |
| `--lore-color-feedback-info-bg` | `var(--lore-primitive-blue-50)` → `#EFF6FF` | Info block background |
| `--lore-color-feedback-info-border` | `var(--lore-primitive-blue-300)` → `#93C5FD` | Info block border |
| `--lore-color-feedback-info-text` | `var(--lore-primitive-blue-800)` → `#1E40AF` | Info message text — 6.3:1 ✓ |
| `--lore-color-feedback-info-icon` | `var(--lore-primitive-blue-700)` → `#1D4ED8` | Info icon fill |

---

### 2.3 Semantic Tokens — Dark Mode

Applied via `[data-theme="dark"]` attribute on `<html>` or root container. Only the tokens that **change** are listed. Any token absent from this table retains its light-mode primitive (typically the overlay rgba values and focus-ring colour, which are intentionally theme-invariant).

#### Backgrounds (Dark)

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-bg-canvas` | `var(--lore-primitive-grey-900)` → `#1A1625` | Main editor canvas (dark) |
| `--lore-color-bg-sidebar` | `var(--lore-primitive-grey-800)` → `#2A2640` | Sidebar (dark) |
| `--lore-color-bg-nav` | `var(--lore-primitive-grey-950)` → `#0F0C1A` | Nav rail (dark) |
| `--lore-color-bg-overlay` | `rgba(10,7,18,0.64)` | Modal scrim (darker for dark mode) |
| `--lore-color-bg-tooltip` | `var(--lore-primitive-grey-700)` → `#3D3A50` | Tooltip (dark) |

#### Surfaces (Dark)

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-surface-default` | `var(--lore-primitive-grey-800)` → `#2A2640` | Card, panel, popover |
| `--lore-color-surface-subtle` | `var(--lore-primitive-grey-900)` → `#1A1625` | Inset section, code background |
| `--lore-color-surface-recessed` | `var(--lore-primitive-grey-950)` → `#0F0C1A` | Input background, tag bg |
| `--lore-color-surface-inverse` | `var(--lore-primitive-grey-50)` → `#F9F9FB` | Inverse chip (flips to light) |

#### Borders (Dark)

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-border-default` | `rgba(196,181,253,0.10)` | Default border (purple-tinted on dark) |
| `--lore-color-border-subtle` | `rgba(196,181,253,0.06)` | Subtle divider |
| `--lore-color-border-strong` | `rgba(196,181,253,0.24)` | Strong / focus border |
| `--lore-color-border-accent` | `var(--lore-primitive-purple-300)` → `#C4B5FD` | Accent border (lighter on dark) |

#### Text (Dark)

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-text-default` | `var(--lore-primitive-grey-50)` → `#F9F9FB` | Body text — 16.1:1 on dark canvas ✓ |
| `--lore-color-text-muted` | `var(--lore-primitive-grey-300)` → `#C8C5D8` | Secondary labels — 7.5:1 ✓ |
| `--lore-color-text-faint` | `var(--lore-primitive-grey-400)` → `#A09CB8` | Timestamps, metadata — 4.7:1 ✓ AA |
| `--lore-color-text-accent` | `var(--lore-primitive-purple-300)` → `#C4B5FD` | Links on dark — 8.0:1 ✓ |

#### Icons (Dark)

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-icon-default` | `var(--lore-primitive-grey-300)` → `#C8C5D8` | Default icon |
| `--lore-color-icon-muted` | `var(--lore-primitive-grey-500)` → `#7A758F` | Decorative icon |
| `--lore-color-icon-accent` | `var(--lore-primitive-purple-300)` → `#C4B5FD` | Active icon |

#### Accent (Dark)

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-accent-default` | `var(--lore-primitive-purple-300)` → `#C4B5FD` | Primary interactive colour on dark — used as tint, not solid fill for buttons; button text becomes `--lore-color-text-default` |
| `--lore-color-accent-hover` | `var(--lore-primitive-purple-400)` → `#A78BFA` | Accent hover (dark) |
| `--lore-color-accent-active` | `var(--lore-primitive-purple-500)` → `#8B5CF6` | Accent pressed (dark) |
| `--lore-color-accent-subtle` | `rgba(196,181,253,0.12)` | Accent tint surface (dark) |
| `--lore-color-accent-muted` | `rgba(196,181,253,0.22)` | Accent pill bg (dark) |

#### State Overlays (Dark)

| CSS Custom Property | Resolved Value | Usage |
|---|---|---|
| `--lore-color-state-hover` | `rgba(196,181,253,0.08)` | Hover overlay (dark) |
| `--lore-color-state-active` | `rgba(196,181,253,0.16)` | Active overlay (dark) |
| `--lore-color-state-selected` | `rgba(196,181,253,0.12)` | Selected row (dark) |
| `--lore-color-state-disabled-fill` | `var(--lore-primitive-grey-800)` → `#2A2640` | Disabled bg (dark) |
| `--lore-color-state-disabled-text` | `var(--lore-primitive-grey-600)` → `#5C5870` | Disabled text (dark) |

#### Feedback (Dark) — only surfaces and borders change; text colours maintain their own contrast on dark bg

| CSS Custom Property | Resolved Value |
|---|---|
| `--lore-color-feedback-error-bg` | `rgba(201,42,42,0.12)` |
| `--lore-color-feedback-error-border` | `rgba(201,42,42,0.30)` |
| `--lore-color-feedback-error-text` | `var(--lore-primitive-red-300)` → `#FFA8A8` |
| `--lore-color-feedback-error-icon` | `var(--lore-primitive-red-400)` → `#FF8787` |
| `--lore-color-feedback-warning-bg` | `rgba(180,83,9,0.12)` |
| `--lore-color-feedback-warning-border` | `rgba(180,83,9,0.30)` |
| `--lore-color-feedback-warning-text` | `var(--lore-primitive-yellow-300)` → `#FCD34D` |
| `--lore-color-feedback-warning-icon` | `var(--lore-primitive-yellow-400)` → `#FBBF24` |
| `--lore-color-feedback-success-bg` | `rgba(21,128,61,0.12)` |
| `--lore-color-feedback-success-border` | `rgba(21,128,61,0.30)` |
| `--lore-color-feedback-success-text` | `var(--lore-primitive-green-300)` → `#86EFAC` |
| `--lore-color-feedback-success-icon` | `var(--lore-primitive-green-400)` → `#4ADE80` |
| `--lore-color-feedback-info-bg` | `rgba(37,99,235,0.12)` |
| `--lore-color-feedback-info-border` | `rgba(37,99,235,0.30)` |
| `--lore-color-feedback-info-text` | `var(--lore-primitive-blue-300)` → `#93C5FD` |
| `--lore-color-feedback-info-icon` | `var(--lore-primitive-blue-400)` → `#60A5FA` |

---

### 2.4 Dark Mode Implementation Guide

#### Step 1 — Attribute Toggle
Dark mode is activated by setting `data-theme="dark"` on the `<html>` element (not `<body>`). This ensures CSS custom property cascading reaches all elements including `<dialog>` and portal-mounted overlays.

```javascript
// Toggle handler (TypeScript)
function setTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('lore-theme', theme);
}

// On app init, restore preference
const saved = localStorage.getItem('lore-theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme((saved as 'light' | 'dark') ?? (systemDark ? 'dark' : 'light'));
```

#### Step 2 — CSS Structure
```css
/* _tokens.css */

:root,
[data-theme="light"] {
  /* All light semantic tokens */
  --lore-color-bg-canvas: #FFFFFF;
  --lore-color-text-default: #1A1625;
  /* ... all others */
}

[data-theme="dark"] {
  /* Only tokens that differ in dark mode */
  --lore-color-bg-canvas: #1A1625;
  --lore-color-text-default: #F9F9FB;
  /* ... overrides only */
}
```

No separate stylesheet. No JS class toggling on individual components.

#### Step 3 — Tokens That Do NOT Change in Dark Mode
The following tokens are intentionally theme-invariant and must not be overridden in `[data-theme="dark"]`:
- `--lore-color-state-focus-ring` → Always `rgba(124,58,237,0.35)` — contrast is preserved on both canvas colours
- `--lore-color-text-on-accent` → Always `#FFFFFF` — only appears on `--lore-color-accent-default` bg, which is always darkened in dark mode anyway (purple-300 used as tint, not fill)
- `--lore-color-bg-overlay` → Changes, see table above
- All `--lore-primitive-*` values → Never used directly, so never overridden

#### Step 4 — Canvas Types and Their Dark Mode Values
Lore supports four canvas/editor contexts. Each maps to a specific background token:

| Canvas Type | Light Token | Dark Token | Dark Resolved Value |
|---|---|---|---|
| Main note editor | `--lore-color-bg-canvas` | same token, dark override | `#1A1625` |
| Sidebar / panels | `--lore-color-bg-sidebar` | same token, dark override | `#2A2640` |
| Card / block surface | `--lore-color-surface-default` | same token, dark override | `#2A2640` |
| Code block | `--lore-color-surface-subtle` | same token, dark override | `#1A1625` (fully recessed) |

#### Step 5 — Images and SVGs
- **Raster images** (user uploads, embedded images): Apply no filter. Images intentionally retain their source appearance. Provide a subtle border `var(--lore-color-border-default)` to separate from the dark canvas.
- **Inline SVG icons** that use `currentColor`: Automatically inherit `--lore-color-icon-default`, no additional handling needed.
- **External SVG `<img>` tags** (e.g., block type icons): Add `data-theme-invert="true"` attribute and a CSS rule:
  ```css
  [data-theme="dark"] img[data-theme-invert="true"] {
    filter: invert(1) hue-rotate(180deg);
  }
  ```
  This is only for decorative UI icons served as raster SVG — not for content images.
- **Lottie / animated SVG**: Export two variants (`-light`, `-dark`) and swap `src` via a JavaScript observer on the `data-theme` attribute change.

#### Step 6 — Transition Between Themes
Apply the transition **only on the root**, scoped to colour-related properties to avoid unintended layout repaints:
```css
:root {
  transition:
    background-color var(--lore-anim-duration-theme) var(--lore-anim-ease-standard),
    color var(--lore-anim-duration-theme) var(--lore-anim-ease-standard);
}
/* Disable transition during forced page-load restoration to prevent flash */
:root.no-transition * {
  transition: none !important;
}
```
`--lore-anim-duration-theme` = `300ms` (see Section 9).

---

## 3. Typography Scale

All fonts are loaded from Google Fonts via a single preconnect + preload strategy. Never self-host unless specifically required by the deployment environment.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Font family tokens:**
```css
--lore-font-serif: 'Lora', Georgia, 'Times New Roman', serif;
--lore-font-sans: 'DM Sans', system-ui, -apple-system, sans-serif;
--lore-font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

**Base:** `1rem = 16px` (do not override `html { font-size }` — use rem throughout).

| Token | Family | Weight | Size (rem) | Size (px) | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|---|---|
| `--lore-type-display-xl` | serif | 700 | 3.0rem | 48px | 1.15 | −0.03em | Hero titles, empty state large text |
| `--lore-type-display-lg` | serif | 700 | 2.25rem | 36px | 1.2 | −0.025em | Note title (expanded view) |
| `--lore-type-heading-1` | serif | 600 | 1.875rem | 30px | 1.25 | −0.02em | H1 within note body |
| `--lore-type-heading-2` | serif | 600 | 1.5rem | 24px | 1.3 | −0.015em | H2 within note body |
| `--lore-type-heading-3` | serif | 500 | 1.25rem | 20px | 1.35 | −0.01em | H3, block section header |
| `--lore-type-heading-4` | sans | 600 | 1.0625rem | 17px | 1.4 | 0em | H4, sidebar section labels |
| `--lore-type-body-lg` | serif | 400 | 1.0625rem | 17px | 1.7 | 0em | Primary note body text |
| `--lore-type-body-md` | sans | 400 | 0.9375rem | 15px | 1.6 | 0em | UI descriptions, block subtitles |
| `--lore-type-body-sm` | sans | 400 | 0.8125rem | 13px | 1.55 | 0.005em | Secondary UI text, helper text |
| `--lore-type-caption` | sans | 400 | 0.75rem | 12px | 1.5 | 0.01em | Captions under images, footnotes |
| `--lore-type-code` | mono | 400 | 0.875rem | 14px | 1.65 | 0em | Code blocks, inline code |
| `--lore-type-code-sm` | mono | 400 | 0.75rem | 12px | 1.6 | 0em | Metadata chips, timestamps |
| `--lore-type-label` | sans | 500 | 0.875rem | 14px | 1.0 | 0.01em | Button labels, form labels, nav labels |
| `--lore-type-label-sm` | sans | 500 | 0.75rem | 12px | 1.0 | 0.02em | Badge text, tag text |
| `--lore-type-overline` | sans | 600 | 0.6875rem | 11px | 1.0 | 0.08em | Section overlines (all caps), block type labels |

**Italic variants** — only `Lora` provides an italic optical axis used in:
- `--lore-type-body-lg-italic`: same metrics as `body-lg`, `font-style: italic`
- `--lore-type-heading-1-italic`: same metrics as `heading-1`, `font-style: italic`
Used in Quote blocks and pull-quote contexts.

---

## 4. Spacing Scale

The spacing scale is **4px-based**. All spacing tokens are multiples of 4. Use `rem` in component code for scale-responsiveness.

| Token | px | rem | Common Usage |
|---|---|---|---|
| `--lore-space-4` | 4px | 0.25rem | Icon-to-label gap, tight chip padding, focus ring offset |
| `--lore-space-8` | 8px | 0.5rem | Input vertical padding, icon button padding, tag padding |
| `--lore-space-12` | 12px | 0.75rem | Button horizontal padding (compact), form field gap |
| `--lore-space-16` | 16px | 1.0rem | Card padding (compact), sidebar item padding, section gap |
| `--lore-space-20` | 20px | 1.25rem | List item padding, block inner padding, input padding |
| `--lore-space-24` | 24px | 1.5rem | Card padding (standard), modal padding (sides), between-block gap |
| `--lore-space-32` | 32px | 2.0rem | Panel section separator, large card padding, between-section gap |
| `--lore-space-40` | 40px | 2.5rem | Modal padding (top), between-group gap in sidebar |
| `--lore-space-48` | 48px | 3.0rem | Page-level top padding, hero section gap |
| `--lore-space-64` | 64px | 4.0rem | Empty state vertical spacing, large section gap |
| `--lore-space-80` | 80px | 5.0rem | Page hero top margin |
| `--lore-space-96` | 96px | 6.0rem | Maximum section breathing room, landing-style whitespace |

**Inline spacing convention:** Use `--lore-space-4` and `--lore-space-8` for horizontal rhythm within a row (icon+label, badge+label). Never use odd values like 6px, 10px, 14px.

---

## 5. Border Radius Scale

| Token | Value | Usage Examples |
|---|---|---|
| `--lore-radius-2` | 2px | Thin rule, narrow progress bar track |
| `--lore-radius-4` | 4px | Chips, tags, inline code badge, tooltip arrow |
| `--lore-radius-8` | 8px | Buttons, text inputs, select dropdowns, search bar, context menu |
| `--lore-radius-12` | 12px | Cards, block panels, info boxes, sidebar sections, popovers |
| `--lore-radius-18` | 18px | Modals, full-panel overlays, command palette |
| `--lore-radius-full` | 9999px | Icon buttons (circle), avatar, toggle track |

---

## 6. Shadow Tokens

All shadows use `box-shadow` shorthand. Multiple shadows on one token are comma-separated.

| Token | CSS Value | Usage |
|---|---|---|
| `--lore-shadow-sm` | `0 1px 2px rgba(26,22,37,0.06), 0 0 1px rgba(26,22,37,0.04)` | Subtle card lift, floating chip |
| `--lore-shadow-md` | `0 4px 12px rgba(26,22,37,0.08), 0 1px 3px rgba(26,22,37,0.06)` | Popovers, tooltips, dropdown menus |
| `--lore-shadow-lg` | `0 12px 32px rgba(26,22,37,0.12), 0 4px 12px rgba(26,22,37,0.08)` | Modals, command palette, image lightbox |
| `--lore-shadow-overlay` | `0 24px 64px rgba(26,22,37,0.20), 0 8px 24px rgba(26,22,37,0.12)` | Full-screen overlays, onboarding sheets |
| `--lore-shadow-focus-ring` | `0 0 0 2px var(--lore-color-bg-canvas), 0 0 0 4px rgba(124,58,237,0.35)` | Keyboard focus indicator on all interactive elements |
| `--lore-shadow-focus-ring-error` | `0 0 0 2px var(--lore-color-bg-canvas), 0 0 0 4px rgba(201,42,42,0.40)` | Focus ring on invalid form inputs |
| `--lore-shadow-inset` | `inset 0 1px 3px rgba(26,22,37,0.08)` | Recessed inputs, code block inset |
| `--lore-shadow-block-drag` | `0 16px 40px rgba(109,40,217,0.16), 0 4px 12px rgba(109,40,217,0.10)` | Block being dragged (replaces shadow-md) |

**Dark mode shadow adjustment:** In `[data-theme="dark"]`, all `rgba(26,22,37,...)` values are replaced with `rgba(0,0,0,...)` at 1.5× opacity, because dark surfaces need deeper shadows for perceived elevation:
```css
[data-theme="dark"] {
  --lore-shadow-sm: 0 1px 2px rgba(0,0,0,0.20), 0 0 1px rgba(0,0,0,0.14);
  --lore-shadow-md: 0 4px 12px rgba(0,0,0,0.28), 0 1px 3px rgba(0,0,0,0.18);
  --lore-shadow-lg: 0 12px 32px rgba(0,0,0,0.36), 0 4px 12px rgba(0,0,0,0.22);
  --lore-shadow-overlay: 0 24px 64px rgba(0,0,0,0.56), 0 8px 24px rgba(0,0,0,0.32);
  --lore-shadow-block-drag: 0 16px 40px rgba(124,58,237,0.28), 0 4px 12px rgba(124,58,237,0.18);
}
```
Focus ring tokens remain unchanged in dark mode — the 2px canvas-coloured gap automatically adapts because it uses `--lore-color-bg-canvas`, which is already theme-remapped.

---

## 7. Component Anatomy — 14 Block Types

### Block Anatomy — Common Pattern
Every block type shares a structural shell. Block-specific anatomy is layered on top.

**Common shell parts:**
- `block-root` — outermost wrapper; carries `data-block-type`, `data-block-id`, `data-state`
- `block-drag-handle` — leftmost, 24px wide, revealed on hover
- `block-left-accent` — 3px left border strip, coloured per block type
- `block-body` — main content area; `flex: 1`
- `block-actions` — floating toolbar, revealed on hover/focus-within
- `block-resize-handle` — bottom edge, for applicable blocks (Table, Image, Code)

**Common token mapping:**

| Part | Token |
|---|---|
| `block-root` background | `--lore-color-bg-canvas` (transparent by default) |
| `block-root` hover background | `--lore-color-state-hover` |
| `block-root` border-radius | `--lore-radius-12` |
| `block-left-accent` width | 3px |
| `block-left-accent` border-radius | `--lore-radius-2` on left corners |
| `block-drag-handle` icon colour | `--lore-color-icon-muted` |
| `block-actions` background | `--lore-color-surface-default` |
| `block-actions` shadow | `--lore-shadow-md` |
| `block-actions` border-radius | `--lore-radius-8` |
| `block-actions` border | `1px solid var(--lore-color-border-default)` |
| `block-root` focus-within outline | `--lore-shadow-focus-ring` |

**States:**
- `default` — canvas-transparent bg, accent strip visible
- `hover` — `--lore-color-state-hover` bg, drag handle and `block-actions` fade in at `opacity: 1`
- `focused` — focus ring applied to `block-root`
- `editing` — `block-root` gets `--lore-color-border-strong` border, `box-shadow: --lore-shadow-sm`
- `collapsed` — `block-body` and all children hidden; only `block-header` (if present) remains
- `commenting` — 2px dashed border `--lore-color-accent-muted`, comment thread anchored to `block-root`
- `dragging` — `box-shadow: --lore-shadow-block-drag`, `opacity: 0.92`, `cursor: grabbing`

---

### 7.1 Hypothesis Block

**Purpose:** Frames an untested assertion. Signals "this is a working idea, not a conclusion."

**Visual Structure:**
```
[drag] [◇ icon] [HYPOTHESIS label] [block-menu ⋮]
        [block-title — serif, heading-3]
        [block-body — body-lg text]
        [block-meta: created date, confidence tag]
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `hypothesis-root` | `<div role="article">` | bg: transparent; border-left: 3px solid `--lore-color-feedback-warning-icon` |
| `hypothesis-header` | `<div>` | display: flex; gap: `--lore-space-8`; align-items: center |
| `hypothesis-icon` | `<svg>` 16px | color: `--lore-color-feedback-warning-icon` |
| `hypothesis-label` | `<span>` | `--lore-type-overline`; color: `--lore-color-feedback-warning-text`; text-transform: uppercase |
| `hypothesis-title` | `<h3>` or `<div contenteditable>` | `--lore-type-heading-3`; color: `--lore-color-text-default` |
| `hypothesis-body` | `<div contenteditable>` | `--lore-type-body-lg`; color: `--lore-color-text-default` |
| `hypothesis-meta` | `<div>` | display: flex; gap: `--lore-space-12`; padding-top: `--lore-space-12` |
| `hypothesis-date` | `<span>` | `--lore-type-code-sm`; color: `--lore-color-text-faint` |
| `hypothesis-confidence` | `<span>` chip | bg: `--lore-color-feedback-warning-bg`; border: `--lore-color-feedback-warning-border`; `--lore-type-label-sm`; radius: `--lore-radius-4` |
| `hypothesis-bg` | Wrapper | bg: `--lore-color-feedback-warning-bg`; padding: `--lore-space-16` `--lore-space-20`; radius: `--lore-radius-12` |

**Accent colour:** Yellow (`--lore-color-feedback-warning-icon`)

**Accessibility:**
- `role="article"` with `aria-label="Hypothesis: [title text]"`
- `hypothesis-title` is always an `<h3>` in semantic outline
- Confidence chip: `aria-label="Confidence: [value]"`
- Keyboard: `Enter` to edit title; `Tab` moves to body

---

### 7.2 Conclusion Block

**Purpose:** Marks a finalised, high-confidence assertion derived from evidence in the note.

**Visual Structure:**
```
[drag] [✓ icon] [CONCLUSION label] [block-menu ⋮]
        [block-title — serif, heading-3]
        [block-body — body-lg]
        [block-meta: evidence count chip]
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `conclusion-root` | `<div role="article">` | border-left: 3px solid `--lore-color-feedback-success-icon` |
| `conclusion-header` | `<div>` | flex, gap: `--lore-space-8` |
| `conclusion-icon` | `<svg>` 16px | color: `--lore-color-feedback-success-icon` |
| `conclusion-label` | `<span>` | `--lore-type-overline`; color: `--lore-color-feedback-success-text`; uppercase |
| `conclusion-title` | `<h3 contenteditable>` | `--lore-type-heading-3`; color: `--lore-color-text-default` |
| `conclusion-body` | `<div contenteditable>` | `--lore-type-body-lg`; color: `--lore-color-text-default` |
| `conclusion-evidence-chip` | `<span>` | bg: `--lore-color-feedback-success-bg`; border: `--lore-color-feedback-success-border`; `--lore-type-label-sm`; radius: `--lore-radius-4` |
| `conclusion-bg` | Wrapper | bg: `--lore-color-feedback-success-bg`; padding: `--lore-space-16` `--lore-space-20`; radius: `--lore-radius-12` |

**Accent colour:** Green (`--lore-color-feedback-success-icon`)

**Accessibility:**
- `role="article"` with `aria-label="Conclusion: [title text]"`
- Evidence chip: `aria-label="Based on [N] evidence items"`

---

### 7.3 Note / Insight Block

**Purpose:** General-purpose annotation. The default block type for free-form thought.

**Visual Structure:**
```
[drag] [💡 icon] [NOTE label — optional] [block-menu ⋮]
        [block-body — body-lg serif, full width]
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `note-root` | `<div role="note">` | border-left: 3px solid `--lore-color-accent-muted`; no bg tint (transparent on canvas) |
| `note-icon` | `<svg>` 16px (optional) | color: `--lore-color-icon-muted` |
| `note-label` | `<span>` (hidden by default, shown on hover) | `--lore-type-overline`; color: `--lore-color-text-faint` |
| `note-body` | `<div contenteditable>` | `--lore-type-body-lg`; color: `--lore-color-text-default` |

**Accent colour:** Purple muted (`--lore-color-accent-muted`)

**Variants:** `insight` variant adds the 💡 icon and a faint `--lore-color-accent-subtle` tint to the background.

**Accessibility:**
- `role="note"` (native ARIA landmark)
- No heading required

---

### 7.4 Warning Block

**Purpose:** Calls attention to a risk, caveat, or critical constraint.

**Visual Structure:**
```
[drag] [⚠ icon] [WARNING] [block-menu ⋮]
        [block-title — heading-3, optional]
        [block-body — body-md sans]
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `warning-root` | `<div role="alert" aria-live="polite">` | border-left: 3px solid `--lore-color-feedback-warning-border` |
| `warning-header` | `<div>` | flex, gap: `--lore-space-8`; align-items: center |
| `warning-icon` | `<svg>` 20px | color: `--lore-color-feedback-warning-icon` |
| `warning-label` | `<span>` | `--lore-type-overline`; color: `--lore-color-feedback-warning-text`; uppercase |
| `warning-title` | `<p>` or `<h3 contenteditable>` | `--lore-type-heading-3`; color: `--lore-color-feedback-warning-text` |
| `warning-body` | `<div contenteditable>` | `--lore-type-body-md`; color: `--lore-color-text-default` |
| `warning-bg` | Wrapper | bg: `--lore-color-feedback-warning-bg`; border: 1px solid `--lore-color-feedback-warning-border`; padding: `--lore-space-16` `--lore-space-20`; radius: `--lore-radius-12` |

**Accent colour:** Yellow

**Accessibility:**
- `role="alert"` + `aria-live="polite"` when block is programmatically inserted; manual blocks use `role="note"` instead
- Icon has `aria-hidden="true"` — the label provides semantic meaning

---

### 7.5 Quote Block

**Purpose:** Attribution-ready pull quote. Uses italic serif for elegance.

**Visual Structure:**
```
[drag] [" icon or large quotation mark] [block-menu ⋮]
        [quote-text — body-lg italic serif]
        [quote-attribution — body-sm sans, muted]
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `quote-root` | `<blockquote>` | border-left: 4px solid `--lore-color-border-accent`; padding-left: `--lore-space-24`; no bg |
| `quote-mark` | `<span>` decorative | font-size: 3rem; line-height: 1; color: `--lore-color-accent-muted`; aria-hidden="true" |
| `quote-text` | `<p contenteditable>` | `--lore-type-body-lg-italic`; color: `--lore-color-text-default` |
| `quote-attribution` | `<cite contenteditable>` | `--lore-type-body-sm`; color: `--lore-color-text-muted`; font-style: normal |
| `quote-attribution-separator` | `<span>` | content: "— "; color: `--lore-color-text-faint` |

**Accent colour:** Purple (`--lore-color-border-accent`)

**Accessibility:**
- Native `<blockquote>` element is used
- `<cite>` correctly wraps attribution
- Screen reader reads: "[quote text]. Quote from [attribution]."

---

### 7.6 Key Differences Block

**Purpose:** Side-by-side structured comparison of two concepts, entities, or options.

**Visual Structure:**
```
[drag] [⇄ icon] [KEY DIFFERENCES] [block-menu ⋮]
        [comparison-title — heading-3]
        ┌─────────────────┬─────────────────┐
        │ [col-a-label]   │ [col-b-label]   │
        │ [row items...]  │ [row items...]  │
        └─────────────────┴─────────────────┘
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `differences-root` | `<div>` | border: 1px solid `--lore-color-border-default`; radius: `--lore-radius-12` |
| `differences-header` | `<div>` | flex; padding: `--lore-space-16` `--lore-space-20`; border-bottom: 1px solid `--lore-color-border-subtle` |
| `differences-icon` | `<svg>` 16px | color: `--lore-color-icon-accent` |
| `differences-label` | `<span>` | `--lore-type-overline`; color: `--lore-color-text-faint`; uppercase |
| `differences-title` | `<h3 contenteditable>` | `--lore-type-heading-3`; color: `--lore-color-text-default` |
| `differences-grid` | `<div>` | display: grid; grid-template-columns: 1fr 1fr; |
| `differences-col` | `<div>` (×2) | padding: `--lore-space-20`; `&:first-child` border-right: 1px solid `--lore-color-border-subtle` |
| `differences-col-label` | `<div>` | `--lore-type-label`; color: `--lore-color-text-accent`; padding-bottom: `--lore-space-12` |
| `differences-col-item` | `<div>` | `--lore-type-body-md`; color: `--lore-color-text-default`; padding: `--lore-space-8` 0; border-bottom: 1px solid `--lore-color-border-subtle` |
| `differences-col-item-label` | `<span>` | color: `--lore-color-text-muted`; display: block; `--lore-type-body-sm` |
| `differences-col-item-value` | `<span contenteditable>` | `--lore-type-body-md`; color: `--lore-color-text-default` |
| `differences-add-row` | `<button>` | `--lore-type-label-sm`; color: `--lore-color-text-faint`; revealed on hover |

**Accessibility:**
- Implement as a CSS grid, not `<table>`, since rows are user-authored and not necessarily structurally parallel
- Column labels: `aria-label="Column A: [label text]"`
- Add row button: `aria-label="Add comparison row"`

---

### 7.7 Key Findings Block

**Purpose:** Numbered takeaway list for research summaries and reports.

**Visual Structure:**
```
[drag] [# icon] [KEY FINDINGS] [block-menu ⋮]
        [findings-title — heading-3]
        ① [finding-text — body-lg]
        ② [finding-text — body-lg]
        ...
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `findings-root` | `<div>` | border-left: 3px solid `--lore-color-feedback-info-border` |
| `findings-header` | `<div>` | flex; gap: `--lore-space-8`; margin-bottom: `--lore-space-16` |
| `findings-icon` | `<svg>` 16px | color: `--lore-color-feedback-info-icon` |
| `findings-label` | `<span>` | `--lore-type-overline`; color: `--lore-color-feedback-info-text`; uppercase |
| `findings-title` | `<h3 contenteditable>` | `--lore-type-heading-3`; color: `--lore-color-text-default` |
| `findings-list` | `<ol>` | list-style: none; margin: 0; padding: 0; counter-reset: findings-counter |
| `findings-item` | `<li>` | display: flex; gap: `--lore-space-16`; padding: `--lore-space-12` 0; border-bottom: 1px solid `--lore-color-border-subtle` |
| `findings-number` | `<span>` | counter-increment: findings-counter; content: counter(findings-counter); `--lore-type-code`; color: `--lore-color-accent-default`; min-width: 24px; font-weight: 500 |
| `findings-text` | `<div contenteditable>` | `--lore-type-body-lg`; color: `--lore-color-text-default`; flex: 1 |
| `findings-bg` | Wrapper | bg: `--lore-color-feedback-info-bg`; padding: `--lore-space-20`; radius: `--lore-radius-12` |

**Accessibility:**
- `<ol>` with `role="list"` ensures ordered reading
- `aria-label="Key Findings list"` on `<ol>`
- Each `<li>`: `aria-label="Finding [N]: [text]"`

---

### 7.8 Checklist Block

**Purpose:** Actionable task list with completion tracking.

**Visual Structure:**
```
[drag] [☑ icon] [CHECKLIST] [progress: 3/7] [block-menu ⋮]
        [checklist-title — heading-3]
        ☐ [item-text — body-md]
        ☑ [item-text — body-md, strikethrough]
        ...
        [+ Add item]
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `checklist-root` | `<div>` | No special bg; border-left: 3px solid `--lore-color-accent-muted` |
| `checklist-header` | `<div>` | flex; justify-content: space-between; margin-bottom: `--lore-space-12` |
| `checklist-label` | `<span>` | `--lore-type-overline`; color: `--lore-color-text-faint` |
| `checklist-progress` | `<span>` | `--lore-type-code-sm`; color: `--lore-color-text-muted`; bg: `--lore-color-surface-recessed`; padding: `--lore-space-4` `--lore-space-8`; radius: `--lore-radius-4` |
| `checklist-title` | `<h3 contenteditable>` | `--lore-type-heading-3`; color: `--lore-color-text-default` |
| `checklist-list` | `<ul>` | list-style: none; padding: 0 |
| `checklist-item` | `<li>` | display: flex; align-items: flex-start; gap: `--lore-space-12`; padding: `--lore-space-8` 0 |
| `checklist-checkbox` | `<input type="checkbox">` | Custom styled; size: 18px; border: 1.5px solid `--lore-color-border-strong`; radius: `--lore-radius-4`; checked bg: `--lore-color-accent-default` |
| `checklist-item-text` | `<div contenteditable>` | `--lore-type-body-md`; `&[data-checked="true"]` → `text-decoration: line-through`; color: `--lore-color-text-muted` |
| `checklist-add-btn` | `<button>` | `--lore-type-body-sm`; color: `--lore-color-text-faint`; gap: `--lore-space-8` with + icon |

**Accessibility:**
- `role="group"` with `aria-label="Checklist: [title]"` on `checklist-root`
- Each `input[type="checkbox"]`: `aria-label="[item text]"`; `aria-checked` reflects state
- Progress: `aria-label="[N] of [total] items complete"` on `checklist-progress`

---

### 7.9 Table Block

**Purpose:** Structured data table with editable cells, sortable columns, and add/remove row/column controls.

**Visual Structure:**
```
[drag] [⊞ icon] [TABLE] [block-menu ⋮]
        ┌──────────────────────────────────┐
        │ [col-header] │ [col-header] │... │  ← thead, sticky on scroll
        ├──────────────────────────────────┤
        │ [cell]       │ [cell]       │    │
        │ [cell]       │ [cell]       │    │
        └──────────────────────────────────┘
        [+ Add row] [+ Add column]
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `table-root` | `<div>` | border: 1px solid `--lore-color-border-default`; radius: `--lore-radius-12`; overflow: hidden |
| `table-scroll-wrapper` | `<div>` | overflow-x: auto |
| `table-el` | `<table>` | border-collapse: collapse; width: 100% |
| `table-head` | `<thead>` | bg: `--lore-color-surface-subtle` |
| `table-head-cell` | `<th>` | `--lore-type-label`; color: `--lore-color-text-muted`; padding: `--lore-space-12` `--lore-space-16`; border-bottom: 1px solid `--lore-color-border-default`; text-align: left |
| `table-head-sort-icon` | `<svg>` 12px | color: `--lore-color-icon-muted`; visible on hover of `table-head-cell` |
| `table-body` | `<tbody>` | — |
| `table-row` | `<tr>` | hover bg: `--lore-color-state-hover`; border-bottom: 1px solid `--lore-color-border-subtle` |
| `table-cell` | `<td>` | `--lore-type-body-md`; color: `--lore-color-text-default`; padding: `--lore-space-12` `--lore-space-16` |
| `table-cell-input` | `<div contenteditable>` inside `<td>` | No additional styling; inherits `table-cell` |
| `table-footer` | `<div>` | display: flex; gap: `--lore-space-12`; padding: `--lore-space-12` `--lore-space-16` |
| `table-add-row-btn` | `<button>` | `--lore-type-label-sm`; color: `--lore-color-text-faint` |
| `table-add-col-btn` | `<button>` | same as add-row |
| `table-resize-handle` | `<div>` | 4px wide; cursor: col-resize; bg: `--lore-color-border-default` on hover |

**Accessibility:**
- Native `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<td>` semantics required
- `table-root` gets `role="region"` and `aria-label="Table block"`
- Sort buttons: `aria-sort="ascending|descending|none"`

---

### 7.10 Code Block

**Purpose:** Syntax-highlighted code with language selector, line numbers, and copy action.

**Visual Structure:**
```
[drag] [</> icon] [CODE] [language chip] [copy button] [block-menu ⋮]
        ┌────────────────────────────────────────┐
        │  1  │ [highlighted code line]          │
        │  2  │ [highlighted code line]          │
        └────────────────────────────────────────┘
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `code-root` | `<div>` | border: 1px solid `--lore-color-border-default`; radius: `--lore-radius-12`; overflow: hidden |
| `code-toolbar` | `<div>` | bg: `--lore-color-surface-subtle`; padding: `--lore-space-8` `--lore-space-16`; display: flex; justify-content: space-between; border-bottom: 1px solid `--lore-color-border-subtle` |
| `code-lang-chip` | `<button>` | `--lore-type-label-sm`; bg: `--lore-color-accent-subtle`; color: `--lore-color-text-accent`; radius: `--lore-radius-4`; padding: `--lore-space-4` `--lore-space-8` |
| `code-copy-btn` | `<button>` | `--lore-type-label-sm`; color: `--lore-color-text-muted`; hover color: `--lore-color-text-accent` |
| `code-scroll` | `<div>` | overflow-x: auto; bg: `--lore-color-surface-subtle` |
| `code-pre` | `<pre>` | margin: 0; padding: `--lore-space-20` `--lore-space-24`; bg: `--lore-color-surface-subtle` |
| `code-line-numbers` | `<div>` | `--lore-type-code`; color: `--lore-color-text-faint`; text-align: right; user-select: none; padding-right: `--lore-space-16`; min-width: 2.5rem |
| `code-content` | `<code>` | `--lore-type-code`; color: `--lore-color-text-default`; font-size: 0.875rem |
| `code-inset` | Shadow | box-shadow: `--lore-shadow-inset` on `code-pre` |

**Syntax theme:** Lore uses a custom subset of the Atom One palette, remapped to CSS custom properties for theme-swapping:
- `--lore-code-keyword`: purple-600 / purple-300
- `--lore-code-string`: green-700 / green-400
- `--lore-code-comment`: grey-400 / grey-500
- `--lore-code-number`: blue-700 / blue-300
- `--lore-code-function`: yellow-700 / yellow-300

**Accessibility:**
- `<pre>` wraps `<code>` — correct HTML5 semantics
- `aria-label="Code block: [language]"` on `code-root`
- Copy button: `aria-label="Copy code"`, changes to `aria-label="Copied"` for 2s post-action

---

### 7.11 Image Block

**Purpose:** Inline media block with optional caption and alt text.

**Visual Structure:**
```
[drag] [image placeholder / rendered img] [block-menu ⋮]
        [caption — body-sm, below image]
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `image-root` | `<figure>` | margin: 0 |
| `image-wrapper` | `<div>` | border: 1px solid `--lore-color-border-default`; radius: `--lore-radius-12`; overflow: hidden; bg: `--lore-color-surface-subtle` (shown while loading) |
| `image-el` | `<img>` | max-width: 100%; display: block; border-radius: `--lore-radius-12` |
| `image-placeholder` | `<div>` (before upload) | bg: `--lore-color-surface-recessed`; min-height: 160px; display: flex; align-items: center; justify-content: center |
| `image-upload-icon` | `<svg>` 24px | color: `--lore-color-icon-muted` |
| `image-upload-label` | `<span>` | `--lore-type-body-sm`; color: `--lore-color-text-faint` |
| `image-caption` | `<figcaption contenteditable>` | `--lore-type-caption`; color: `--lore-color-text-muted`; padding-top: `--lore-space-8`; text-align: center |
| `image-resize-handle` | `<div>` | 8px × 8px; bg: `--lore-color-accent-default`; radius: `--lore-radius-full`; positioned at corners; drag-to-resize |
| `image-overlay-actions` | `<div>` | revealed on hover; top-right; bg: `--lore-color-surface-default`; shadow: `--lore-shadow-sm`; radius: `--lore-radius-8` |

**Variants:**
- `full-width` — image spans full canvas width
- `float-left` / `float-right` — image floats with text wrap (max-width: 50%)

**Accessibility:**
- `<img alt="">` — alt text required; prompt user to provide via `image-overlay-actions`
- `<figcaption>` provides visible caption
- `aria-label="Image block"` on `image-root` when alt is empty/decorative

---

### 7.12 Divider Block

**Purpose:** Visual separator between note sections. Minimal block with no body content.

**Visual Structure:**
```
[drag] [─────────────────────────────] [block-menu ⋮]
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `divider-root` | `<div role="separator">` | display: flex; align-items: center; padding: `--lore-space-8` 0 |
| `divider-line` | `<hr>` | flex: 1; border: none; border-top: 1px solid `--lore-color-border-subtle`; margin: 0 |

**Variants:**
- `default` — thin rule `--lore-color-border-subtle`
- `strong` — 2px rule `--lore-color-border-default`
- `decorative` — rule with centered icon (◆) in `--lore-color-text-faint`; use `<hr>` with `aria-hidden` and a decorative `<span>` between two partial hr elements

**Accessibility:**
- `role="separator"` with `aria-orientation="horizontal"` on `divider-root`
- No editable content; Tab skips to next block

---

### 7.13 Ask Claude Block

**Purpose:** Inline AI prompt input that sends the block's context + user query to Claude and streams a response into the block.

**Visual Structure:**
```
[drag] [✦ Claude icon] [ASK CLAUDE] [block-menu ⋮]
        [prompt-input — body-md placeholder]
        [send button]
        ─────────────
        [response-area — body-lg streaming text]
        [response-meta: model, tokens, copy, regenerate]
```

**Anatomy Parts:**

| Part | Element | Token(s) |
|---|---|---|
| `ask-claude-root` | `<div>` | border: 1px solid `--lore-color-accent-muted`; radius: `--lore-radius-12`; bg: `--lore-color-accent-subtle` |
| `ask-claude-header` | `<div>` | flex; gap: `--lore-space-8`; padding: `--lore-space-12` `--lore-space-16`; border-bottom: 1px solid `--lore-color-border-default` |
| `ask-claude-icon` | `<svg>` 16px | color: `--lore-color-accent-default` |
| `ask-claude-label` | `<span>` | `--lore-type-overline`; color: `--lore-color-accent-default`; uppercase |
| `ask-claude-input` | `<textarea>` or `<div contenteditable>` | `--lore-type-body-md`; color: `--lore-color-text-default`; bg: transparent; padding: `--lore-space-16` `--lore-space-20`; min-height: 60px; resize: none; border: none |
| `ask-claude-send-btn` | `<button>` | bg: `--lore-color-accent-default`; color: `--lore-color-text-on-accent`; radius: `--lore-radius-8`; padding: `--lore-space-8` `--lore-space-16`; `--lore-type-label` |
| `ask-claude-divider` | `<div>` | 1px solid `--lore-color-border-default`; margin: 0 `--lore-space-16` |
| `ask-claude-response` | `<div aria-live="polite">` | `--lore-type-body-lg`; color: `--lore-color-text-default`; padding: `--lore-space-16` `--lore-space-20` |
| `ask-claude-streaming-cursor` | `<span>` | 2px wide; bg: `--lore-color-accent-default`; animation: blink 800ms steps(1) infinite |
| `ask-claude-response-meta` | `<div>` | flex; gap: `--lore-space-12`; padding: `--lore-space-8` `--lore-space-16`; border-top: 1px solid `--lore-color-border-subtle` |
| `ask-claude-model-chip` | `<span>` | `--lore-type-code-sm`; color: `--lore-color-text-faint` |
| `ask-claude-copy-btn` | `<button>` | icon-only; 20px; color: `--lore-color-icon-default` |
| `ask-claude-regenerate-btn` | `<button>` | icon-only; 20px; color: `--lore-color-icon-default` |

**States:**
- `idle` — input ready, response area hidden
- `loading` — send button disabled, spinner replaces icon, streaming cursor animates
- `complete` — response visible, meta bar shown
- `error` — response area shows error text with `--lore-color-feedback-error-text`

**Accessibility:**
- `aria-live="polite"` on `ask-claude-response` for streaming announcements
- Send button: `aria-label="Send to Claude"`, `aria-disabled` during loading
- Response complete: `aria-label="Claude response complete"`

---

### 7.14 Ask GPT Block

**Purpose:** Identical to Ask Claude in structure and behaviour; differentiated by brand colour and label.

**Anatomy Parts:** All parts mirror `7.13 Ask Claude Block` exactly, with the following token substitutions:

| Part Changed | Token in Ask Claude | Token in Ask GPT |
|---|---|---|
| `ask-gpt-root` border | `--lore-color-accent-muted` | `--lore-color-feedback-success-border` (green, GPT brand) |
| `ask-gpt-root` bg | `--lore-color-accent-subtle` | `--lore-color-feedback-success-bg` |
| `ask-gpt-header` label colour | `--lore-color-accent-default` | `--lore-color-feedback-success-text` |
| `ask-gpt-icon` colour | `--lore-color-accent-default` | `--lore-color-feedback-success-icon` |
| `ask-gpt-send-btn` bg | `--lore-color-accent-default` | `--lore-color-feedback-success-icon` (green) |
| `ask-gpt-label` text | "ASK CLAUDE" | "ASK GPT" |

**Note on icon:** Use the OpenAI logo mark (SVG, `currentColor`-mapped to `ask-gpt-icon` colour). Confirm licensing before shipping — a generic sparkle icon is acceptable as a fallback.

**Accessibility:** Identical to Ask Claude. Update all `aria-label` strings to reference "GPT" instead of "Claude."

---

## 8. Icon Usage Rules

### Icon Library
Lore uses **Phosphor Icons** (MIT licensed, ~1000 icons, multiple weights). Use the `regular` weight (1.5px stroke) as the default. Use `bold` weight (2.5px stroke) only for emphasis or where the icon is the primary affordance (e.g., empty state).

CDN import (React):
```bash
npm install @phosphor-icons/react
```

SVG sprite approach (Angular):
```html
<script src="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/index.js"></script>
```

### Size Scale

| Size Token | px | Usage |
|---|---|---|
| `--lore-icon-size-sm` | 12px | Inline with `--lore-type-label-sm`; badge/tag decorations |
| `--lore-icon-size-md` | 16px | Default UI icon: nav, block labels, action toolbar |
| `--lore-icon-size-lg` | 20px | Emphasis icons: block type headers, warning, primary actions |
| `--lore-icon-size-xl` | 24px | Empty states, hero moments, image upload placeholder |

### Colour Rules
- Default icon colour: `var(--lore-color-icon-default)` — never hardcode hex
- Active/selected icon: `var(--lore-color-icon-accent)`
- Muted/decorative icon: `var(--lore-color-icon-muted)`
- Icon on filled button: `var(--lore-color-text-on-accent)` (white)
- All icons must use `currentColor` for fill/stroke — no hardcoded colour in SVG attributes

### Icon + Label vs Icon Only
- **Icon + label** (required): navigation items, primary CTA buttons, block type headers, empty states
- **Icon only** (acceptable when space-constrained): action toolbar items, icon buttons in compact rows — these **must** have `aria-label` or `title` attribute + tooltip on hover
- **Prohibited:** Icon-only in critical actions (delete, publish, share) with no label unless inside a clearly labelled context (e.g., delete icon within a row that already labels the item)

### Prohibited Usages
- Do not mix Phosphor icons with icons from other libraries (Heroicons, Lucide) in the same view
- Do not scale icons to non-standard sizes (e.g., 18px, 22px) — snap to the four size tokens
- Do not apply `--lore-color-accent-default` to icons that are not interactive or active-state
- Do not rotate or flip icons for creative effect without design approval

---

## 9. Animation & Transition Specifications

### Token Definitions

```css
:root {
  --lore-anim-duration-instant:  80ms;
  --lore-anim-duration-fast:    150ms;
  --lore-anim-duration-base:    220ms;
  --lore-anim-duration-slow:    350ms;
  --lore-anim-duration-theme:   300ms;
  --lore-anim-duration-overlay: 280ms;

  --lore-anim-ease-standard:    cubic-bezier(0.4, 0.0, 0.2, 1.0);   /* Material standard */
  --lore-anim-ease-decelerate:  cubic-bezier(0.0, 0.0, 0.2, 1.0);   /* Elements entering */
  --lore-anim-ease-accelerate:  cubic-bezier(0.4, 0.0, 1.0, 1.0);   /* Elements leaving */
  --lore-anim-ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1.0); /* Playful bounce, use sparingly */
  --lore-anim-ease-linear:      linear;
}
```

### Interaction Specification Table

| Interaction | Duration Token | Resolved Duration | Easing Token | CSS Properties | Notes |
|---|---|---|---|---|---|
| Hover state (bg colour) | `--lore-anim-duration-fast` | 150ms | `--lore-anim-ease-standard` | `background-color`, `color` | Applied to all `[role="listitem"]`, nav items, block hover |
| Focus ring appear | `--lore-anim-duration-instant` | 80ms | `--lore-anim-ease-standard` | `box-shadow` | Fast onset; must not delay feedback |
| Button press (active) | `--lore-anim-duration-instant` | 80ms | `--lore-anim-ease-standard` | `transform: scale(0.97)`, `background-color` | Subtle press affordance |
| Tooltip enter | `--lore-anim-duration-fast` | 150ms | `--lore-anim-ease-decelerate` | `opacity`, `transform: translateY(-4px)→(0)` | 300ms delay before animating |
| Tooltip exit | `--lore-anim-duration-fast` | 150ms | `--lore-anim-ease-accelerate` | `opacity`, `transform: translateY(0)→(-4px)` | No delay on exit |
| Block actions reveal | `--lore-anim-duration-fast` | 150ms | `--lore-anim-ease-decelerate` | `opacity`, `transform: translateY(4px)→(0)` | Triggered by `block-root:hover, block-root:focus-within` |
| Block actions hide | `--lore-anim-duration-fast` | 150ms | `--lore-anim-ease-accelerate` | `opacity`, `transform` | |
| Block drag lift | `--lore-anim-duration-base` | 220ms | `--lore-anim-ease-spring` | `box-shadow`, `transform: scale(1.01)` | Apply shadow-block-drag token |
| Block drag drop | `--lore-anim-duration-base` | 220ms | `--lore-anim-ease-decelerate` | `box-shadow`, `transform: scale(1.0)` | Return to shadow-sm |
| Block reorder (ghost) | `--lore-anim-duration-slow` | 350ms | `--lore-anim-ease-standard` | `transform: translateY()` | Other blocks translate to make room |
| Left sidebar open | `--lore-anim-duration-slow` | 350ms | `--lore-anim-ease-decelerate` | `width: 0→260px`, `opacity` | Canvas simultaneously shifts right |
| Left sidebar close | `--lore-anim-duration-base` | 220ms | `--lore-anim-ease-accelerate` | `width: 260px→0`, `opacity` | |
| Modal enter | `--lore-anim-duration-overlay` | 280ms | `--lore-anim-ease-decelerate` | `opacity: 0→1`, `transform: translateY(16px)→(0) scale(0.98)→(1)` | Scrim fades simultaneously |
| Modal exit | `--lore-anim-duration-base` | 220ms | `--lore-anim-ease-accelerate` | `opacity: 1→0`, `transform: scale(1)→(0.96)` | Exit faster than enter |
| Dark mode theme swap | `--lore-anim-duration-theme` | 300ms | `--lore-anim-ease-standard` | `background-color`, `color` on `:root` only | Do not animate `box-shadow` on theme swap — causes jitter |
| Streaming cursor blink | 800ms (fixed) | 800ms | `steps(1)` | `opacity: 1→0` | CSS keyframe, not transition |

### Search Overlay — Detailed Specification

The search overlay is the most complex transition in the system. It involves three layered animations that must be choreographed.

**Trigger:** `Cmd+K` / `Ctrl+K` or search button press.

**Entry sequence (total: ~300ms):**

1. **Scrim** (starts at T=0):
   - `opacity: 0 → 0.48` over `200ms`
   - Easing: `--lore-anim-ease-decelerate`
   - CSS property: `background-color`

2. **Overlay panel** (starts at T=0):
   - `opacity: 0 → 1` over `280ms`
   - `transform: translateY(-12px) → translateY(0)` over `280ms`
   - `scale: 0.97 → 1.0` over `280ms`
   - Easing: `--lore-anim-ease-decelerate`

3. **Search input focus** (at T=80ms, after overlay starts rendering):
   - Auto-focus `input` via `element.focus()` in a `requestAnimationFrame` callback
   - Focus ring appears instantly at `--lore-anim-duration-instant` (80ms)

4. **Result items stagger** (starts at T=120ms, after first keystroke):
   - Each result item: `opacity: 0 → 1`, `transform: translateX(-8px) → (0)`
   - Duration: `150ms` per item
   - Stagger delay: `30ms` between items (first 5 items only; remaining appear at `T+120ms` flat)

**Exit sequence (total: ~220ms):**

1. **All elements** (start simultaneously at T=0):
   - `opacity: 1 → 0` over `220ms`
   - `transform: translateY(0) → translateY(-8px)` over `220ms`
   - Easing: `--lore-anim-ease-accelerate`

2. **Focus return:**
   - `previousActiveElement.focus()` called at T=0 (before exit animation starts)
   - This ensures screen reader users don't lose context during the overlay exit

```css
/* Search overlay implementation pattern */
.search-overlay-scrim {
  transition:
    opacity var(--lore-anim-duration-overlay) var(--lore-anim-ease-decelerate);
}

.search-overlay-panel {
  transition:
    opacity var(--lore-anim-duration-overlay) var(--lore-anim-ease-decelerate),
    transform var(--lore-anim-duration-overlay) var(--lore-anim-ease-decelerate);
}

.search-overlay-panel[data-state="closed"] {
  opacity: 0;
  transform: translateY(-12px) scale(0.97);
  pointer-events: none;
}

.search-result-item {
  animation: resultSlideIn var(--lore-anim-duration-fast) var(--lore-anim-ease-decelerate) both;
  animation-delay: calc(var(--item-index) * 30ms + 120ms);
}

@keyframes resultSlideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

**Reduced motion:** Wrap all transitions and animations with:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
```

---

## 10. Do / Don't Examples

The following examples use specific token names. They cover the most common implementation mistakes observed during design system rollouts.

---

**1. Accent colour overuse**
- ✅ **Do:** Apply `--lore-color-accent-default` to the active nav item's icon and label only.
- ❌ **Don't:** Apply `--lore-color-accent-default` simultaneously to the nav item's background, icon, label, and left border — this creates 4 competing focal points.

---

**2. Hardcoded colour values**
- ✅ **Do:** `border: 1px solid var(--lore-color-border-default);`
- ❌ **Don't:** `border: 1px solid rgba(109,40,217,0.09);` — this breaks dark mode because the token remaps to `rgba(196,181,253,0.10)` in dark mode.

---

**3. Focus ring suppression**
- ✅ **Do:** Apply `box-shadow: var(--lore-shadow-focus-ring)` on all `button:focus-visible`, `a:focus-visible`, `[role="button"]:focus-visible`.
- ❌ **Don't:** Write `outline: none` without replacing it with `--lore-shadow-focus-ring`. Every interactive element must have a visible focus indicator.

---

**4. Typography token bypass**
- ✅ **Do:** `font: var(--lore-type-body-lg);` (composed shorthand) or apply the four constituent properties using the scale in Section 3.
- ❌ **Don't:** `font-size: 17px; line-height: 1.7; font-family: 'Lora', serif;` inline — this duplicates token values and breaks if the scale changes.

---

**5. Spacing off-scale**
- ✅ **Do:** `gap: var(--lore-space-12);` between form elements.
- ❌ **Don't:** `gap: 10px;` — 10px is off the 4px scale. The closest valid values are `--lore-space-8` (8px) or `--lore-space-12` (12px).

---

**6. Dark mode separate stylesheet**
- ✅ **Do:** Override only changed tokens inside `[data-theme="dark"] { ... }` in the same `_tokens.css` file.
- ❌ **Don't:** Create `tokens-dark.css` and conditionally load it — this causes flash of unstyled content and breaks SSR.

---

**7. Border radius misapplication**
- ✅ **Do:** Use `--lore-radius-12` on block panels, `--lore-radius-8` on buttons and inputs, `--lore-radius-4` on tags.
- ❌ **Don't:** Use `--lore-radius-18` (modal-scale radius) on inline chips or action buttons — it reads as oversized and inconsistent with the UI density.

---

**8. Feedback colour for brand decoration**
- ✅ **Do:** Reserve `--lore-color-feedback-error-*` tokens for error states and `--lore-color-feedback-success-*` for success states.
- ❌ **Don't:** Use `--lore-color-feedback-success-bg` as a general "green highlight" for non-semantic decoration. Feedback tokens carry semantic weight.

---

**9. Shadow stacking**
- ✅ **Do:** Use a single shadow token per element. A card gets `--lore-shadow-sm`. A dropdown gets `--lore-shadow-md`.
- ❌ **Don't:** Combine `--lore-shadow-sm` and `--lore-shadow-md` on the same element. The shadow tokens already include multiple CSS shadow layers for realism.

---

**10. Note text in DM Sans instead of Lora**
- ✅ **Do:** Use `--lore-font-serif` (Lora) for note body text (`--lore-type-body-lg`), headings, and block titles.
- ❌ **Don't:** Use `--lore-font-sans` (DM Sans) for body text in the note editor canvas. DM Sans is reserved for UI chrome, labels, and metadata.

---

**11. Disabled state colour hack**
- ✅ **Do:** Apply `color: var(--lore-color-state-disabled-text); background: var(--lore-color-state-disabled-fill); pointer-events: none;` for disabled elements.
- ❌ **Don't:** Set `opacity: 0.5` on the entire component to simulate disabled state — this fails contrast requirements when the base component is already near-minimum contrast, and breaks in some browser rendering engines.

---

**12. Icon size off-scale**
- ✅ **Do:** Use `var(--lore-icon-size-md)` (16px) for icons inside block-type labels, and `var(--lore-icon-size-lg)` (20px) for warning/emphasis block headers.
- ❌ **Don't:** Use `width: 18px; height: 18px` — 18px is not a defined icon size token. Snap to the nearest size: `--lore-icon-size-md` (16px) or `--lore-icon-size-lg` (20px).

---

*End of Lore Design System Specification v1.0*
