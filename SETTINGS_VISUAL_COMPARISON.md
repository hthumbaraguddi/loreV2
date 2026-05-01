# Settings Panel - Visual Comparison

## Before (Current Implementation)

The current settings panel uses a single-column layout with sections stacked vertically:

```
┌─────────────────────────────────────────────────────┐
│ ← Back    Settings                    Sign out      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🎨 APPEARANCE                               │   │
│  │ ○ Default  ○ Light  ○ Dark                  │   │
│  │ Font Size: [Medium ▼]                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ ⚙️ PROFILE                                   │   │
│  │ [Avatar] User Name                          │   │
│  │ Display Name: [____________]                │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🤖 AI PROVIDER                               │   │
│  │ [Anthropic] [OpenAI]                        │   │
│  │ API Key: [••••••••••]                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Issues:**
- No clear navigation structure
- All settings mixed together in one scrollable area
- Hard to find specific settings
- Doesn't match the mock design

## After (Mock Design)

The new settings panel uses a two-column layout with navigation sidebar:

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    Settings                              Sign out         │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│ 🤖 AI Providers │  AI Provider API Keys                         │
│ 👤 Profile   │  ┌──────────────────────────────────────────┐   │
│ ─────────    │  │ 🔵 Anthropic                             │   │
│ ⚙️ AI Behaviour│  │ API Key: [••••••••••••]  [Validate]     │   │
│ ☁️ Sync & Export│  │ Model: [Claude 3.5 Sonnet ▼]           │   │
│ 📋 Templates │  └──────────────────────────────────────────┘   │
│ ─────────    │                                                   │
│ 🎨 Appearance│  ┌──────────────────────────────────────────┐   │
│              │  │ 🟢 OpenAI                                │   │
│              │  │ API Key: [••••••••••••]  [Validate]     │   │
│              │  │ Model: [GPT-4 ▼]                        │   │
│              │  └──────────────────────────────────────────┘   │
│              │                                                   │
│              │  Model Selection                                 │
│              │  ┌──────────────┐ ┌──────────────┐             │
│              │  │ ○ Claude 3.5 │ │ ○ GPT-4      │             │
│              │  │   Sonnet     │ │   Turbo      │             │
│              │  └──────────────┘ └──────────────┘             │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

**Improvements:**
- Clear two-column layout (180px nav + flexible content)
- Navigation sidebar with 6 organized tabs
- Visual hierarchy with dividers between nav groups
- Active tab highlighted with purple accent and left border
- Content area uses cards for better organization
- Matches the mock design exactly

## Key Visual Changes

### Navigation Sidebar
- **Width**: 180px fixed
- **Background**: White
- **Items**: 
  - Default: Gray text (#4A445F)
  - Hover: Light purple background (#F5F3FF)
  - Active: Purple text (#7C3AED) + left border + light background

### Content Area
- **Background**: Light gray (#FAFAF9)
- **Padding**: 24px 32px
- **Cards**: White with subtle shadow and 12px border-radius

### Typography
- **Section titles**: Lora serif, 16px, 600 weight
- **Section descriptions**: DM Sans, 12px, muted
- **Form labels**: DM Sans, 11.5px, 500 weight
- **Body text**: DM Sans, 13px

### Form Elements
- **Inputs**: 8px border-radius, 8px padding
- **Focus state**: Purple border (#A78BFA)
- **Buttons**: 8px border-radius, smooth transitions
- **Toggle switches**: 32x18px with animated knob

### Color Palette
- **Primary accent**: #7C3AED (purple)
- **Light accent**: rgba(109,40,217,0.05)
- **Border**: rgba(109,40,217,0.09)
- **Text primary**: #1C1829
- **Text secondary**: #4A445F
- **Text tertiary**: #9490AA

## Layout Measurements

### Topbar
- Height: 46px
- Padding: 9px 20px 9px 36px
- Border-bottom: 1px solid var(--border)

### Navigation Sidebar
- Width: 180px
- Padding: 12px 0
- Item padding: 7px 16px
- Item gap: 8px
- Active border-left: 2px

### Content Area
- Padding: 24px 32px
- Section margin-bottom: 28px
- Card padding: 18px
- Card margin-bottom: 12px
- Form row gap: 12px

### Form Elements
- Input padding: 8px 11px
- Input border-radius: 8px
- Button padding: 4px 11px
- Toggle size: 32x18px
- Avatar size: 64x64px (profile)

## Responsive Behavior

The two-column layout should:
1. Maintain fixed 180px sidebar width on desktop
2. Stack vertically on mobile (sidebar becomes top tabs)
3. Content area scrolls independently
4. Navigation remains fixed during content scroll

## Animation

- **Slide-over entrance**: 220ms ease from right
- **Tab switching**: Instant (no animation)
- **Hover states**: 150ms transition
- **Toggle switch**: 200ms knob slide
- **Focus states**: 150ms border color transition
