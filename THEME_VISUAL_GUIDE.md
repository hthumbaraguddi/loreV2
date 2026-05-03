# Theme System - Visual Guide

## 🎨 Where to Find Theme Controls

### 1. Settings Panel (Primary Control)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ Settings                              [Save Changes]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌─────────────────────────────────────────┐ │
│  │ 🤖 AI    │  │                                          │ │
│  │ 👤 Profile│  │  Appearance                             │ │
│  │          │  │  Customize the look and feel of Lore    │ │
│  │ ⚙️ AI    │  │                                          │ │
│  │ 🔄 Sync  │  │  ┌────────────────────────────────────┐ │ │
│  │ 📋 Temp  │  │  │ Theme                              │ │ │
│  │          │  │  │                                    │ │ │
│  │ 🎨 Appear│◄─┼──┤  ┌──────┐  ┌──────┐  ┌──────┐   │ │ │
│  └──────────┘  │  │  │Light │  │ Dark │  │System│   │ │ │
│                │  │  │  ☀️  │  │  🌙  │  │  💻  │   │ │ │
│                │  │  └──────┘  └──────┘  └──────┘   │ │ │
│                │  │     ✓                            │ │ │
│                │  └────────────────────────────────────┘ │ │
│                │                                          │ │
│                │  ┌────────────────────────────────────┐ │ │
│                │  │ Font Size                          │ │ │
│                │  │  [Small] [Medium✓] [Large]        │ │ │
│                │  └────────────────────────────────────┘ │ │
│                │                                          │ │
│                │  ┌────────────────────────────────────┐ │ │
│                │  │ Density                            │ │ │
│                │  │  [Compact] [Comfortable✓] [Spacious]│ │
│                │  └────────────────────────────────────┘ │ │
│                └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Location**: Settings → Appearance Tab  
**Features**:
- Three theme options with visual previews
- Light theme shows soft lavender
- Dark theme shows deep purple-black
- System theme shows split preview

---

### 2. Nav Rail Quick Toggle (Secondary Control)

```
┌──┐
│L │  ← Logo
├──┤
│📝│  ← Notes
│🕸️│  ← Graph
│📄│  ← HTML Notes
│💬│  ← AI Chat
│📚│  ← Prompt Library
├──┤
│🔔│  ← Notifications
│⚙️│  ← Settings
│  │
│  │  ← Spacer
│  │
│🌙│  ← Theme Toggle (NEW!) ✨
├──┤
│H │  ← User Avatar
└──┘
```

**Location**: Nav Rail, Bottom Section (above user avatar)  
**Features**:
- Single-click theme toggle
- Icon changes: ☀️ (light mode) ↔ 🌙 (dark mode)
- Hover tooltip shows keyboard shortcut
- 32x32px compact button

---

### 3. Keyboard Shortcut (Power User)

```
┌─────────────────────────────────────────┐
│                                         │
│         Press ⌘⇧D (Mac)                │
│         or Ctrl⇧D (Windows/Linux)      │
│                                         │
│         to toggle theme instantly!     │
│                                         │
└─────────────────────────────────────────┘
```

**Shortcut**: 
- Mac: `⌘⇧D` (Command + Shift + D)
- Windows/Linux: `Ctrl⇧D` (Control + Shift + D)

**Features**:
- Works from anywhere in the app
- Instant theme toggle
- No need to open settings

---

## 🎨 Theme Previews

### Light Theme

```
┌─────────────────────────────────────────────────────────────┐
│  Background: #F6F4FF (Soft Lavender) ☁️                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Card Background: #FFFFFF (White)                      │ │
│  │                                                         │ │
│  │  Primary Text: #1A1130 (Deep Purple-Black)            │ │
│  │  Secondary Text: #3B2F62 (Purple-Grey)                │ │
│  │  Muted Text: #7B6F9A (Light Purple)                   │ │
│  │                                                         │ │
│  │  Border: rgba(124, 58, 237, 0.12) (Purple Tint)       │ │
│  │  Shadow: Purple-tinted soft glow                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Accent: #7C3AED (Vibrant Purple) 💜                       │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics**:
- Soft, easy on the eyes
- Purple-tinted throughout
- High contrast for readability
- Professional and modern

---

### Dark Theme

```
┌─────────────────────────────────────────────────────────────┐
│  Background: #0F0D1A (Deep Purple-Black) 🌙                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Card Background: #1E1A2E (Dark Purple)               │ │
│  │                                                         │ │
│  │  Primary Text: #F0EEFF (Off-White with Purple Tint)   │ │
│  │  Secondary Text: #C4B5FD (Light Purple)               │ │
│  │  Muted Text: #7B6F9A (Muted Purple)                   │ │
│  │                                                         │ │
│  │  Border: rgba(139, 92, 246, 0.14) (Purple Glow)       │ │
│  │  Shadow: Deep black with subtle glow                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Accent: #8B5CF6 (Bright Purple) ✨                        │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics**:
- Rich, immersive experience
- Purple glow effects
- Excellent contrast
- Easy on eyes in low light

---

### System Theme

```
┌─────────────────────────────────────────────────────────────┐
│  Follows your operating system preference                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🌅 Daytime (OS Light Mode)                                │
│  → Uses Light Theme (#F6F4FF)                               │
│                                                              │
│  🌙 Nighttime (OS Dark Mode)                               │
│  → Uses Dark Theme (#0F0D1A)                                │
│                                                              │
│  🔄 Auto-switches when OS theme changes                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics**:
- Automatic theme switching
- Respects OS preference
- No manual intervention needed
- Updates in real-time

---

## 🎬 Theme Transition Animation

```
Light Theme                Dark Theme
┌──────────┐              ┌──────────┐
│ ☀️ #F6F4FF│              │ 🌙 #0F0D1A│
│          │              │          │
│  Hello   │  ─────────>  │  Hello   │
│  World   │   300ms      │  World   │
│          │   smooth     │          │
└──────────┘              └──────────┘

Properties that animate:
✓ background-color
✓ border-color
✓ color (text)
✓ box-shadow

Duration: 300ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

**Features**:
- Smooth 300ms transitions
- All colors animate together
- No jarring flashes
- Professional feel

---

## 🎯 Component Locations

### Theme Toggle Button

```
Nav Rail (Bottom Section)
├── Spacer (flex-grow)
├── 🌙 Theme Toggle ← HERE! (NEW)
└── H User Avatar
```

**Styling**:
```scss
.theme-toggle {
  width: 32px;
  height: 32px;
  border-radius: 5px;
  background: transparent;
  color: var(--t3);
  
  &:hover {
    background: var(--lore-color-state-hover);
    color: var(--t1);
  }
}
```

---

### Settings Panel Theme Selector

```
Settings Panel → Appearance Tab
└── Theme Section
    ├── Light Option (☀️)
    ├── Dark Option (🌙)
    └── System Option (💻)
```

**Styling**:
```scss
.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  
  &.active {
    border-color: var(--lore-color-accent);
    background: var(--lore-color-accent-bg);
  }
}

.theme-preview {
  width: 60px;
  height: 40px;
  border-radius: var(--r-sm);
  
  &.light { background: #F6F4FF; }
  &.dark { background: #0F0D1A; }
  &.auto { background: linear-gradient(to right, #F6F4FF 50%, #0F0D1A 50%); }
}
```

---

## 📱 Responsive Behavior

### Desktop
```
┌─────────────────────────────────────────────────────────────┐
│ Nav Rail │ Sidebar │ Editor │ Right Panel                   │
│    🌙    │         │        │                               │
│    ↑     │         │        │                               │
│  Toggle  │         │        │                               │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (Future)
```
┌─────────────────────────────────────┐
│ ☰ Menu                    🌙 Toggle │
├─────────────────────────────────────┤
│                                     │
│         Editor Content              │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 Color Comparison

### Backgrounds

| Element | Light Theme | Dark Theme |
|---------|-------------|------------|
| Canvas | `#F6F4FF` ☁️ | `#0F0D1A` 🌙 |
| Sidebar | `#EEE9FF` | `#13101F` |
| Surface | `#FFFFFF` | `#1E1A2E` |
| Surface 2 | `#F2EEFF` | `#252138` |

### Text

| Element | Light Theme | Dark Theme |
|---------|-------------|------------|
| Primary | `#1A1130` | `#F0EEFF` |
| Secondary | `#3B2F62` | `#C4B5FD` |
| Muted | `#7B6F9A` | `#7B6F9A` |
| Subtle | `#A89EC8` | `#4A4068` |

### Accents

| Element | Light Theme | Dark Theme |
|---------|-------------|------------|
| Primary | `#7C3AED` 💜 | `#8B5CF6` ✨ |
| Hover | `#6D28D9` | `#A78BFA` |
| Active | `#5B21B6` | `#C4B5FD` |

---

## 🔍 Visual Indicators

### Theme Toggle Icon States

```
Light Mode Active:
┌────┐
│ 🌙 │  ← Shows moon (click to go dark)
└────┘

Dark Mode Active:
┌────┐
│ ☀️ │  ← Shows sun (click to go light)
└────┘

Hover State:
┌────┐
│ 🌙 │  ← Background highlight
└────┘   Color changes to --t1
```

### Settings Panel Selection

```
Not Selected:
┌──────┐
│ ☀️   │
│Light │
└──────┘
Border: --border
Background: transparent

Selected:
┌──────┐
│ ☀️   │  ← Purple border
│Light │     Purple background
└──────┘
Border: --lore-color-accent
Background: --lore-color-accent-bg
```

---

## 💡 User Flows

### Flow 1: First-Time User

```
1. App loads with light theme (default)
   ↓
2. User explores app
   ↓
3. User notices 🌙 icon in nav rail
   ↓
4. User clicks → Dark theme activates
   ↓
5. Theme preference saved to localStorage
   ↓
6. Next visit → Dark theme loads automatically
```

### Flow 2: Settings Power User

```
1. User opens Settings (⚙️)
   ↓
2. Navigates to Appearance tab
   ↓
3. Sees three theme options with previews
   ↓
4. Clicks "System" option
   ↓
5. Theme now follows OS preference
   ↓
6. Auto-switches day/night with OS
```

### Flow 3: Keyboard Shortcut User

```
1. User working in editor
   ↓
2. Wants to switch theme quickly
   ↓
3. Presses ⌘⇧D (or Ctrl⇧D)
   ↓
4. Theme toggles instantly
   ↓
5. Continues working
   ↓
6. Can toggle anytime without leaving context
```

---

## 🎯 Visual Hierarchy

### Theme Controls Priority

```
1. Settings Panel (Primary)
   └── Full control, all options, visual previews
   
2. Nav Rail Toggle (Secondary)
   └── Quick access, single-click toggle
   
3. Keyboard Shortcut (Power User)
   └── Instant access, no UI needed
```

### Visual Weight

```
Most Prominent:
├── Settings Panel Theme Selector
│   └── Large previews, clear labels
│
Medium Prominence:
├── Nav Rail Toggle Button
│   └── Visible but not distracting
│
Least Prominent:
└── Keyboard Shortcut
    └── Hidden but powerful
```

---

## 🎨 Design Principles

### 1. Progressive Disclosure
- Basic users: See toggle button
- Intermediate users: Find settings panel
- Power users: Discover keyboard shortcut

### 2. Visual Feedback
- Immediate theme change
- Smooth transitions
- Clear active states

### 3. Consistency
- Same purple theme throughout
- Consistent spacing and sizing
- Unified interaction patterns

### 4. Accessibility
- Keyboard navigation
- ARIA labels
- High contrast ratios
- Clear focus states

---

## 📊 Visual Metrics

### Button Sizes
- Theme toggle: 32x32px
- Theme preview: 60x40px
- Settings option: ~120x80px

### Spacing
- Nav rail gap: 8px
- Settings card gap: 12px
- Theme option gap: 8px

### Border Radius
- Small (buttons): 5px
- Medium (cards): 10px
- Large (panels): 14px

### Transitions
- Duration: 300ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Properties: background, border, color, shadow

---

## 🎉 Visual Polish

### Hover Effects
```
Default State → Hover State
─────────────────────────────
Transparent  → Light background
--t3 color   → --t1 color
No shadow    → Subtle shadow
```

### Active States
```
Hover State → Active State
─────────────────────────────
Light bg    → Darker bg
--t1 color  → --t1 color
Subtle shadow → No shadow
```

### Focus States
```
Default → Focus
─────────────────
No ring → Purple ring
        → 4px offset
        → 35% opacity
```

---

**Visual Guide Complete!** 🎨

This guide shows exactly where and how the theme system appears in the UI, making it easy for users to find and use theme controls.
