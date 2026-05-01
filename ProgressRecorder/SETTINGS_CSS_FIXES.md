# Settings Panel CSS Fixes

## Overview
Fixed the Settings panel CSS to match the mock design (lore-app-v5.html). The Settings panel now has a proper two-column layout with a navigation sidebar and content area, matching the specification from the agent playbook.

## Design Requirements (from Agent Playbook)

The Settings panel should have:
- **Six tabs**: AI Providers, Profile, AI Behaviour, Sync & Export, Templates, and Appearance
- **Two-column layout**: Left navigation sidebar (180px) + Right content area
- **Slide-over animation**: Panel slides in from the right
- **Settings persistence**: All settings saved to localStorage via SettingsService

## Changes Made

### 1. Two-Column Layout Structure
- Added `.settings-wrap` - Main container with flex layout
- Added `.settings-nav` - Left sidebar (180px width) with navigation items
- Added `.settings-content` - Right content area with scrollable content
- Added `.s-panel` - Individual settings panels that can be shown/hidden

### 2. Navigation Sidebar Styling
- `.snav-item` - Navigation items with hover and active states
  - Active state: purple accent color with left border
  - Hover state: light purple background
- `.snav-divider` - Horizontal dividers between nav sections

### 3. Content Area Styling
- `.s-sec` - Section containers with proper spacing (28px margin-bottom)
- `.s-title` - Section titles using Lora serif font (16px, 600 weight)
- `.s-desc` - Section descriptions (12px, muted color)
- `.s-card` - White cards with border, shadow, and rounded corners (12px radius)

### 4. Form Elements (Mock-style)
- `.form-row` - Horizontal form layout with 12px gap
- `.form-group` - Individual form field containers
- `.form-label` - Form labels (11.5px, medium weight)
- `.form-input` - Text inputs with focus states (8px border-radius)
- `.form-textarea` - Textarea inputs (min-height: 70px)
- `.form-select` - Select dropdowns with custom arrow icon

### 5. Profile Section
- `.profile-avatar-row` - Avatar and actions layout (16px gap)
- `.profile-avatar` - Large circular avatar (64px) with gradient background
- `.profile-avatar-actions` - Button container for avatar actions

### 6. Toggle Switches
- `.toggle-row` - Toggle switch rows with labels (10px padding)
- `.toggle-info` - Label and description container
- `.toggle-name` - Toggle label (12.5px, medium weight)
- `.toggle-desc` - Toggle description (11px, muted)
- `.sw` - Custom toggle switch (32x18px) with smooth animation
  - `.sw.on` - Active state with purple background
  - Animated knob that slides left to right

### 7. API Provider Section
- `.api-row` - API provider rows with logo, info, and input (9px gap)
- `.api-logo` - Provider logo container (28px square, 7px border-radius)
- `.api-info` - Provider name and status
- `.api-name` - Provider name (12px, medium weight)
- `.api-status` - Status text (10px, monospace)
- `.api-input` - API key input field (monospace font, light purple background)
- `.api-btn` - Action buttons with hover states (8px border-radius)
  - `.api-btn.on` - Success state with green background

### 8. Model Selection
- `.model-grid` - 2-column grid for model cards (7px gap)
- `.model-card` - Individual model selection cards (8px border-radius)
  - Hover state: purple border and light background
  - Selected state: purple border and background
- `.model-dot` - Radio-style selection indicator (12px circle)
  - Selected: filled with purple
- `.model-name` - Model name (12px, medium weight)
- `.model-desc` - Model description (10px, muted)

### 9. Select Chips
- `.select-chips` - Chip container with flex wrap (6px gap)
- `.sel-chip` - Individual selectable chips (20px border-radius)
  - Default: white background with border
  - Hover: purple border and text
  - Active: purple background with white text

## Design System Alignment

All styling now uses the CSS variables from the mock:
- `--border` - Border colors (rgba(109,40,217,0.09))
- `--tp` - Primary text color (#1C1829)
- `--ts` - Secondary text color (#4A445F)
- `--tt` - Tertiary text color (#9490AA)
- `--acc` - Accent color (#7C3AED / purple)
- `--accl` - Light accent background (rgba(109,40,217,0.05))
- `--inp` - Input background
- `--bg` - Page background (#FAFAF9)
- `--p300`, `--p400`, `--p600`, `--p700` - Purple color scale

## Layout Structure

```
.sp-view
├── .sp-topbar (Header with back button and title - 46px height)
└── .settings-wrap (Two-column layout)
    ├── .settings-nav (Left sidebar - 180px width)
    │   ├── .snav-item (Navigation items)
    │   │   ├── AI Providers
    │   │   ├── Profile
    │   │   ├── (divider)
    │   │   ├── AI Behaviour
    │   │   ├── Sync & Export
    │   │   ├── Templates
    │   │   ├── (divider)
    │   │   └── Appearance
    │   └── .snav-divider (Dividers)
    └── .settings-content (Right content area - flex: 1)
        └── .s-panel (Individual panels)
            ├── .s-sec (Sections)
            │   ├── .s-title (Section title)
            │   ├── .s-desc (Section description)
            │   └── .s-card (Content cards)
            └── ...
```

## Backward Compatibility

All legacy class names (prefixed with `sp-`) have been preserved to maintain compatibility with existing HTML templates. New mock-style classes have been added alongside them.

## Typography

- **Headings**: Lora serif font (16px for section titles)
- **Body text**: DM Sans (12-13px for most content)
- **Monospace**: JetBrains Mono (for API keys, status text)

## Spacing & Sizing

- **Section spacing**: 28px margin-bottom
- **Card padding**: 18px
- **Form gaps**: 12px between fields
- **Border radius**: 8-12px for cards and inputs
- **Navigation width**: 180px fixed
- **Topbar height**: 46px fixed

## Next Steps

To fully implement the mock design, the HTML template should be updated to:
1. Use the new two-column layout structure with `.settings-wrap`
2. Organize settings into separate panels (AI Providers, Profile, Appearance, etc.)
3. Add navigation items to switch between panels using `.snav-item`
4. Use the new form styling classes (`.form-row`, `.form-group`, etc.) where appropriate
5. Implement the six tabs as specified in the agent playbook
6. Add slide-over animation for the panel entrance/exit

## Files Modified

- `ZZZOLD/lore-app/src/app/components/settings-panel/settings-panel.component.scss`

## Related Documentation

- Mock design: `mocks/lore-app-v5.html` (lines 204-350)
- Agent playbook: `lore-docs/05-agent-playbook.md` (Agent Prompt J: Settings Panel)
