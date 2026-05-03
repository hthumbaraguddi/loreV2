# Lore Design System

This document describes the design system extracted from the landing pages and applied to the Lore application.

## Overview

The Lore design system is based on the landing page designs (`lore-landing-light-purple.html` and `lore-landing-v3.html`) and provides a cohesive visual language across both light and dark themes.

## Typography

The design system uses three font families:

- **Lora** (serif) - For note titles, headings, and emphasis
- **DM Sans** (sans-serif) - For UI elements, body text, and labels
- **JetBrains Mono** (monospace) - For metadata, badges, and code

### Font Loading

Fonts are loaded via Google Fonts in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Usage in CSS

```scss
// Serif for headings
font-family: var(--lore-font-serif);

// Sans-serif for body
font-family: var(--lore-font-sans);

// Monospace for code
font-family: var(--lore-font-mono);
```

## Color System

### Light Theme

The light theme uses a soft lavender background with purple accents:

- **Background**: `#F6F4FF` (light lavender)
- **Sidebar**: `#EEE9FF` (slightly darker lavender)
- **Surface**: `#FFFFFF` (white)
- **Primary Text**: `#1A1130` (deep purple-black)
- **Secondary Text**: `#3B2F62` (purple-grey)
- **Accent**: `#7C3AED` (vibrant purple)

### Dark Theme

The dark theme uses deep purple-blacks with bright purple accents:

- **Background**: `#0F0D1A` (very dark purple-black)
- **Sidebar**: `#13101F` (slightly lighter)
- **Surface**: `#1E1A2E` (dark purple surface)
- **Primary Text**: `#F0EEFF` (off-white with purple tint)
- **Secondary Text**: `#C4B5FD` (light purple)
- **Accent**: `#8B5CF6` (bright purple)

### Using Colors

All colors are available as CSS custom properties:

```scss
// Semantic tokens (recommended)
background: var(--lore-color-bg-canvas);
color: var(--lore-color-text-default);
border: 1px solid var(--lore-color-border-default);

// Short aliases (for quick prototyping)
background: var(--bg);
color: var(--t1);
border: 1px solid var(--border);
```

## Theme Switching

### Using the Theme Service

The `ThemeService` provides programmatic theme control:

```typescript
import { ThemeService } from '@app/core';

constructor(private themeService: ThemeService) {}

// Get current theme
const theme = this.themeService.getThemePreference(); // 'light' | 'dark' | 'system'

// Set theme
this.themeService.setTheme('dark');

// Toggle theme
this.themeService.toggleTheme();

// Get applied theme (resolves 'system' to actual theme)
const applied = this.themeService.appliedTheme(); // 'light' | 'dark'
```

### Theme Persistence

The theme preference is automatically saved to `localStorage` under the key `lore-theme`.

### System Theme Support

Setting the theme to `'system'` will automatically follow the user's OS preference and update when the system theme changes.

## Spacing

The design system uses an 8px base unit:

```scss
--lore-space-4: 0.25rem;   // 4px
--lore-space-8: 0.5rem;    // 8px
--lore-space-12: 0.75rem;  // 12px
--lore-space-16: 1rem;     // 16px
--lore-space-24: 1.5rem;   // 24px
--lore-space-32: 2rem;     // 32px
```

## Border Radius

Consistent border radius values:

```scss
--lore-radius-4: 4px;   // Small (buttons, inputs)
--lore-radius-8: 8px;   // Medium (cards)
--lore-radius-12: 12px; // Large (panels)
--lore-radius-18: 18px; // Extra large (modals)

// Landing page style (slightly larger)
--r-sm: 5px;
--r-md: 10px;
--r-lg: 14px;
--r-xl: 20px;
```

## Shadows

The design system provides multiple shadow levels:

```scss
// Light theme shadows (purple-tinted)
--lore-shadow-sm: 0 1px 2px rgba(80, 40, 180, 0.06);
--lore-shadow-md: 0 4px 24px rgba(80, 40, 180, 0.08);
--lore-shadow-lg: 0 12px 32px rgba(80, 40, 180, 0.12);
--lore-shadow-card: 0 1px 4px rgba(80, 40, 180, 0.07), 0 4px 16px rgba(80, 40, 180, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1);

// Dark theme shadows (black)
--lore-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
--lore-shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.5);
```

## Note Type Colors

Semantic colors for different note types:

```scss
// Light theme
--teal: #0D9488;
--amber: #D97706;
--blue: #2563EB;
--rose: #DB2777;
--orange: #EA580C;
--green: #16A34A;

// Dark theme
--teal: #34D399;
--amber: #FCD34D;
--blue: #60A5FA;
--rose: #F472B6;
--orange: #FB923C;
--green: #4ADE80;
```

## Animation

Consistent animation timing:

```scss
--lore-anim-duration-fast: 150ms;
--lore-anim-duration-base: 220ms;
--lore-anim-duration-slow: 300ms;
--lore-anim-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
```

## Landing Pages

The landing pages are located in `lore-app/public/`:

- `index.html` - Light theme landing page (default)
- `index-dark.html` - Dark theme landing page

These are standalone HTML files that showcase the Lore application features and design.

## Best Practices

1. **Use semantic tokens** instead of primitive colors when possible
2. **Respect the theme** - all colors should work in both light and dark modes
3. **Use CSS custom properties** for all design tokens
4. **Test in both themes** before committing changes
5. **Follow the spacing scale** - avoid arbitrary spacing values
6. **Use the provided shadows** - don't create custom shadows

## File Structure

```
lore-app/
├── src/
│   ├── styles/
│   │   ├── _tokens.scss      # Design tokens (colors, typography, spacing)
│   │   ├── _reset.scss        # CSS reset
│   │   └── styles.scss        # Global styles
│   └── app/
│       └── core/
│           └── services/
│               └── theme.service.ts  # Theme management
└── public/
    ├── index.html             # Light theme landing page
    └── index-dark.html        # Dark theme landing page
```

## Migration Notes

The design system has been updated to match the landing pages:

- Background colors are now lighter/softer in light mode
- Borders use purple tints instead of grey
- Shadows have purple tints in light mode
- Text colors have more purple tones
- Border radius values slightly increased to match landing page style

All existing components should continue to work, but may look slightly different with the new color palette.
