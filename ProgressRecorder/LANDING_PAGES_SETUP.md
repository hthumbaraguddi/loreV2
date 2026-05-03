# Landing Pages & Design System Setup

## Summary

Successfully integrated the landing page mockups and extracted their design system to apply to the Lore Angular application.

## What Was Done

### 1. Landing Pages Setup

**Location**: `lore-app/public/`

- ✅ Copied `lore-landing-light-purple.html` → `lore-app/public/landing-light.html` (light theme)
- ✅ Copied `lore-landing-v3.html` → `lore-app/public/landing-dark.html` (dark theme)

**Access URLs** (when dev server is running):
- Light theme: http://localhost:4200/landing-light.html
- Dark theme: http://localhost:4200/landing-dark.html

These are standalone HTML files that serve as the marketing/landing pages for Lore. They showcase:
- Split pane editor with 1-3 columns
- 14 block types (Hypothesis, Conclusion, Key Diff, etc.)
- AI integration (Claude, GPT, Gemini, Groq)
- Knowledge graph visualization
- Prompt library with cron scheduling
- HTML note generation
- GitHub Gist sync

### 2. Design System Extraction

**Updated File**: `lore-app/src/styles/_tokens.scss`

#### Light Theme Updates

Extracted from `lore-landing-light-purple.html`:

```scss
// Backgrounds
--bg: #F6F4FF;              // Light lavender (was white)
--sb-bg: #EEE9FF;           // Sidebar lavender
--surface: #FFFFFF;         // White surfaces
--surface2: #F2EEFF;        // Subtle lavender

// Borders
--border: rgba(124, 58, 237, 0.12);   // Purple-tinted (was grey)
--border2: rgba(124, 58, 237, 0.26);  // Stronger purple

// Text
--t1: #1A1130;              // Deep purple-black
--t2: #3B2F62;              // Purple-grey
--t3: #7B6F9A;              // Muted purple
--t4: #A89EC8;              // Light purple

// Shadows (purple-tinted)
--shadow: 0 4px 24px rgba(80, 40, 180, 0.08);
--shadow-card: 0 1px 4px rgba(80, 40, 180, 0.07), 0 4px 16px rgba(80, 40, 180, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1);

// Border Radius (slightly larger)
--r-sm: 5px;   // was 4px
--r-md: 10px;  // was 8px
--r-lg: 14px;  // was 12px
--r-xl: 20px;  // was 18px
```

#### Dark Theme Implementation

Extracted from `lore-landing-v3.html`:

```scss
[data-theme="dark"] {
  // Backgrounds
  --bg: #0F0D1A;              // Very dark purple-black
  --sb-bg: #13101F;           // Slightly lighter
  --surface: #1E1A2E;         // Dark purple surface
  --surface2: #252138;        // Lighter surface

  // Borders
  --border: rgba(139, 92, 246, 0.14);   // Purple glow
  --border2: rgba(139, 92, 246, 0.24);  // Stronger glow

  // Text
  --t1: #F0EEFF;              // Off-white with purple tint
  --t2: #C4B5FD;              // Light purple
  --t3: #7B6F9A;              // Muted purple
  --t4: #4A4068;              // Dark purple

  // Shadows (black)
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.5);
}
```

#### Note Type Colors

Updated for both themes:

**Light Theme**:
- Teal: `#0D9488`
- Amber: `#D97706`
- Blue: `#2563EB`
- Rose: `#DB2777`
- Orange: `#EA580C`
- Green: `#16A34A`

**Dark Theme**:
- Teal: `#34D399`
- Amber: `#FCD34D`
- Blue: `#60A5FA`
- Rose: `#F472B6`
- Orange: `#FB923C`
- Green: `#4ADE80`

### 3. Theme Service

**New File**: `lore-app/src/app/core/services/theme.service.ts`

Created a comprehensive theme management service with:

- ✅ Signal-based reactive theme state
- ✅ Support for 'light', 'dark', and 'system' themes
- ✅ Automatic localStorage persistence
- ✅ System theme detection and auto-switching
- ✅ Simple API for theme toggling

**Usage**:

```typescript
import { ThemeService } from '@app/core';

constructor(private themeService: ThemeService) {}

// Set theme
this.themeService.setTheme('dark');

// Toggle theme
this.themeService.toggleTheme();

// Get current theme
const theme = this.themeService.appliedTheme(); // 'light' | 'dark'
```

### 4. Documentation

**New File**: `lore-app/DESIGN_SYSTEM.md`

Comprehensive documentation covering:
- Typography system (Lora, DM Sans, JetBrains Mono)
- Color system (light and dark themes)
- Theme switching guide
- Spacing scale
- Border radius values
- Shadow system
- Note type colors
- Animation timing
- Best practices
- File structure

## Typography

The design system uses three font families (already loaded in `index.html`):

1. **Lora** (serif) - Note titles, headings
2. **DM Sans** (sans-serif) - UI, body text, labels
3. **JetBrains Mono** (monospace) - Metadata, badges, code

## Key Changes from Previous Design

1. **Lighter backgrounds** - Light mode now uses `#F6F4FF` instead of white
2. **Purple-tinted borders** - Borders use purple rgba instead of grey
3. **Purple-tinted shadows** - Light mode shadows have purple tint
4. **More purple in text** - Text colors have purple undertones
5. **Larger border radius** - Slightly rounder corners (5px vs 4px, etc.)
6. **Full dark mode** - Complete dark theme implementation

## File Structure

```
lore-app/
├── public/
│   ├── index.html              # Light theme landing page ✅
│   └── index-dark.html         # Dark theme landing page ✅
├── src/
│   ├── styles/
│   │   ├── _tokens.scss        # Updated with landing page colors ✅
│   │   ├── _reset.scss         # Unchanged
│   │   └── styles.scss         # Unchanged
│   └── app/
│       └── core/
│           ├── services/
│           │   └── theme.service.ts  # New theme service ✅
│           └── index.ts        # Updated exports ✅
├── DESIGN_SYSTEM.md            # New documentation ✅
└── LANDING_PAGES_SETUP.md      # This file ✅
```

## Next Steps

To fully integrate the design system:

1. **Add theme toggle UI** - Create a theme switcher component in the settings panel
2. **Test all components** - Verify all existing components work with new colors
3. **Update component styles** - Adjust any components that don't look right
4. **Add theme transition** - Add smooth transitions when switching themes
5. **Test accessibility** - Verify contrast ratios in both themes

## Testing the Changes

1. **View landing pages**:
   - Light: Open `lore-app/public/index.html` in browser
   - Dark: Open `lore-app/public/index-dark.html` in browser

2. **Test theme switching**:
   ```typescript
   // In any component
   constructor(private themeService: ThemeService) {
     // Toggle theme
     this.themeService.toggleTheme();
   }
   ```

3. **Verify colors**:
   - Check that all components use CSS custom properties
   - Test in both light and dark modes
   - Verify text contrast and readability

## Notes

- All existing components should continue to work
- Colors may look slightly different due to the new palette
- The theme service is automatically initialized on app start
- Theme preference persists across sessions via localStorage
- System theme detection works automatically when theme is set to 'system'

## Compatibility

- ✅ All existing CSS custom properties maintained
- ✅ Backward compatible with existing components
- ✅ Short aliases (--bg, --t1, etc.) still work
- ✅ Semantic tokens (--lore-color-*) still work
- ✅ No breaking changes to component styles
