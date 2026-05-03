# Landing Page Visual Guide 🎨

## Overview
The dark landing page is now fully integrated as an Angular component and serves as the default entry point for the Lore application.

## Page Structure

### 1. **Topbar** (Header)
```
┌─────────────────────────────────────────────────────────┐
│ [L] Lore  [v3.0.0] [AI-POWERED]    Features Docs       │
│                                     Changelog [Get Started →] │
└─────────────────────────────────────────────────────────┘
```
- Logo with "L" mark
- Version badge and AI-POWERED badge
- Navigation links
- CTA button

### 2. **Hero Section** (Main Content Area)
```
┌─────────────────────────────────────────────────────────┐
│  LEFT COLUMN                    │  RIGHT COLUMN         │
│  ─────────────────────────────  │  ───────────────────  │
│  [✦ LIVE CLAUDE API] [14 BLOCK TYPES] [SPLIT PANES]   │
│                                 │                       │
│  Your knowledge,                │  ┌─────────────────┐ │
│  supercharged by AI             │  │ [L] Lore        │ │
│                                 │  │ Your knowledge, │ │
│  Capture ideas, chat with       │  │ organised       │ │
│  Claude, GPT-4o, Gemini...      │  │                 │ │
│                                 │  │ 🟢 Claude       │ │
│  ┌─ AI FEATURES ─────────────┐ │  │ Sonnet 4        │ │
│  │ ✦ In-App AI Chat          │ │  │                 │ │
│  │ 📚 Prompt Library          │ │  │ Sign in to     │ │
│  │ ⏱ Scheduled Prompts        │ │  │ continue       │ │
│  │ @ @Mention AI Inline       │ │  │                 │ │
│  │ 📄 HTML Note Generation    │ │  │ [GitHub Button] │ │
│  │ 🕸️ Knowledge Graph         │ │  │ [Local Button]  │ │
│  └────────────────────────────┘ │  │                 │ │
│                                 │  │ Works with:     │ │
│  ┌─ CORE FEATURES ────────────┐ │  │ Claude Gemini   │ │
│  │ 📚 Shelves & Notebooks     │ │  │ Groq OpenRouter │ │
│  │ ⚡ Split Pane Editor       │ │  └─────────────────┘ │
│  │ 🔍 Advanced Search         │ │                       │
│  │ 🔗 [[Note Linking          │ │                       │
│  │ 📤 Export & Gist Sync      │ │                       │
│  │ 🔒 Your Key, Your Data     │ │                       │
│  │ 🎨 14 Block Types          │ │                       │
│  │ 📋 8 Built-in Templates    │ │                       │
│  └────────────────────────────┘ │                       │
└─────────────────────────────────────────────────────────┘
```

### 3. **Below the Fold** (Scrollable Content)

#### Stats Row
```
┌──────────────────────────────────────────────────────────┐
│  14          6           3            8           ∞      │
│  Block types AI providers Split panes Templates  Prompts │
└──────────────────────────────────────────────────────────┘
```

#### Feature Showcases
- **Split Pane Editor**: Visual representation of 3-column layout
- **14 Block Types**: List of draggable block types with icons
- **Prompt Library**: Cards showing scheduled prompts
- **Scheduled Runs**: Dashboard with run status
- **HTML Notes**: Preview of generated reports
- **Knowledge Graph**: SVG visualization of note connections

#### UX Features Grid (3 columns)
```
┌─────────────┬─────────────┬─────────────┐
│ 🌙 Dark mode│ 🧘 Zen mode │ ⚡ Quick Cap│
│ ⌘⇧D         │ ⌘F          │ ⌘J          │
├─────────────┼─────────────┼─────────────┤
│ 🔍 Search   │ 🔗 Share    │ 🔔 Notifs   │
│ ⌘K          │ ⌘⇧S         │             │
├─────────────┼─────────────┼─────────────┤
│ 💬 Comments │ 📐 Template │ 🎨 Canvas   │
│             │ Builder     │ Backgrounds │
├─────────────┼─────────────┼─────────────┤
│ ⌚ Version   │ 🚀 Onboard  │ ⌨️ Shortcuts│
│ History     │ Flow        │ ?           │
└─────────────┴─────────────┴─────────────┘
```

#### Settings Features (3 columns)
```
┌─────────────┬─────────────┬─────────────┐
│ 🤖 AI       │ 👤 Profile  │ ⚙️ Behaviour│
│ Providers   │ & Persona   │             │
├─────────────┼─────────────┼─────────────┤
│ 🔄 Sync &   │ 📋 Templates│ 🌗 Appearance│
│ Export      │             │             │
└─────────────┴─────────────┴─────────────┘
```

#### Design System Strip
```
┌──────────────────────────────────────────────────────────┐
│ Typography          Colour Tokens        Block Palette   │
│ ─────────────────   ─────────────────   ───────────────  │
│ Lora - headings     [Purple swatches]   💡 Hyp  🎯 Con   │
│ DM Sans - UI        [Teal, Amber, etc]  📝 Note ⚠️ Warn  │
│ JetBrains - code                         ✦ Claude ✦ GPT  │
└──────────────────────────────────────────────────────────┘
```

#### Bottom CTA
```
┌──────────────────────────────────────────────────────────┐
│              Ready to build your                         │
│              knowledge base?                             │
│                                                          │
│     Start free. Use your own API key. Your data stays   │
│     yours.                                               │
│                                                          │
│     [🔗 Continue with GitHub]  [💻 Use Locally]         │
└──────────────────────────────────────────────────────────┘
```

### 4. **Footer**
```
┌──────────────────────────────────────────────────────────┐
│ [L] Lore · Your knowledge,    Docs Changelog GitHub     │
│     supercharged by AI        Privacy              v3.0.0│
└──────────────────────────────────────────────────────────┘
```

## Color Scheme (Dark Theme)

### Background Colors
- **Page Background**: `#0F0D1A` (very dark purple-black)
- **Surface/Cards**: `#1E1A2E` (dark purple-gray)
- **Borders**: `rgba(139, 92, 246, 0.15)` (subtle purple)

### Accent Colors
- **Primary Purple**: `#8B5CF6` (p500)
- **Light Purple**: `#A78BFA` (p400)
- **Dark Purple**: `#7C3AED` (p600)
- **Teal**: `#34D399`
- **Amber**: `#FCD34D`
- **Rose**: `#F472B6`
- **Blue**: `#60A5FA`

### Text Colors
- **Primary Text**: `rgba(255, 255, 255, 0.95)`
- **Secondary Text**: `rgba(255, 255, 255, 0.75)`
- **Tertiary Text**: `rgba(255, 255, 255, 0.55)`
- **Muted Text**: `rgba(255, 255, 255, 0.35)`

## Typography

### Font Families
1. **Lora** (serif) - Note titles, headings, logo
2. **DM Sans** (sans-serif) - UI, body text, labels
3. **JetBrains Mono** (monospace) - Code, metadata, badges

### Font Sizes
- **Hero H1**: 48px (3rem)
- **Section Headers**: 28px
- **Card Titles**: 13-14px
- **Body Text**: 12-13px
- **Small Text**: 10-11px
- **Tiny Text**: 8-9px

## Interactive Elements

### Buttons
1. **GitHub Button** (Primary)
   - Background: Purple gradient
   - Icon: GitHub logo
   - Action: Navigate to `/notes?auth=github`

2. **Local Button** (Secondary)
   - Background: Transparent with border
   - Icon: Computer/monitor
   - Action: Navigate to `/notes?auth=local`

3. **Top Nav CTA**
   - Text: "Get Started →"
   - Action: Navigate to `/notes?auth=local`

### Hover Effects
- Cards: Subtle scale and glow
- Buttons: Brightness increase
- Links: Color shift to lighter purple

## Responsive Behavior
- **Desktop**: Full two-column hero layout
- **Tablet**: Stacked layout with adjusted spacing
- **Mobile**: Single column, simplified cards

## Animations
- **Fade Up**: Hero content (0.6s ease)
- **Fade In**: Stats row (0.8s ease, 0.3s delay)
- **Smooth Transitions**: All interactive elements (300ms)

## Key Visual Elements

### Badges
- Version badge: `v3.0.0`
- AI badge: `AI-POWERED`
- Feature badges: `LIVE CLAUDE API`, `14 BLOCK TYPES`, `SPLIT PANES`

### Icons
- Emoji-based icons for features (✦, 📚, ⏱, @, 📄, 🕸️)
- SVG icons for buttons (GitHub, computer)
- Colored dots for status indicators

### Visual Hierarchy
1. Hero headline (largest, most prominent)
2. Auth card (right side, elevated)
3. Feature sections (organized with labels)
4. Showcase blocks (alternating layouts)
5. Footer (minimal, informational)

---

**Access the landing page**: http://localhost:4201/
**Theme**: Dark with purple accents
**Status**: ✅ Fully integrated and functional
