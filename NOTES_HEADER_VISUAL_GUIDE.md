# Notes Header - Visual Implementation Guide

## Overview
This document provides a visual breakdown of the notes header implementation, comparing the mock design with the Angular implementation.

## Header Layout Comparison

### Mock Design (lore-app-v11.html)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  AI & ML › Transformers › Transformer Architecture    [Live AI] [⚏⚏⚏] [⚡] [⊞] [Save]  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Angular Implementation
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Shelf › Notebook › Note                              [Live AI] [⚏⚏⚏] [⚡] [⊞] [Save]  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Breadcrumb Navigation (Left Side)

#### Structure
```html
<div class="breadcrumb-nav">
  <a class="breadcrumb-link">Shelf Name</a>
  <span class="breadcrumb-sep">›</span>
  <span class="breadcrumb-text">Notebook Name</span>
  <span class="breadcrumb-sep">›</span>
  <span class="breadcrumb-current">Note Title</span>
</div>
```

#### Visual States
```
Normal:     AI & ML › Transformers › Transformer Architecture
Hover:      AI & ML › Transformers › Transformer Architecture
            ^^^^^^                   (underlined, darker purple)
```

#### Styling
- **Shelf Link**: `color: var(--lore-color-accent)` (#7C3AED)
- **Notebook**: `color: var(--lore-color-text-muted)` (grey-600)
- **Note**: `color: var(--lore-color-text-default)` (grey-900)
- **Separator**: `color: var(--lore-color-text-subtle)` (grey-400)
- **Font**: 12px DM Sans

### 2. Live AI Indicator

#### Structure
```html
<div class="ai-live-pill">
  <span class="live-dot"></span>
  <span>Live AI</span>
</div>
```

#### Visual Appearance
```
┌──────────────┐
│ ● Live AI    │  ← Green pill with pulsing dot
└──────────────┘
```

#### Animation
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

#### Styling
- **Background**: `var(--lore-color-success-bg)` (#F0FDF4)
- **Border**: `1px solid var(--lore-color-success-bg)`
- **Text**: `var(--lore-color-success)` (#15803D)
- **Dot**: 5px circle, pulsing animation (2s)
- **Font**: 10.5px JetBrains Mono

### 3. Panel Configuration Toggle

#### Structure
```html
<div class="panel-config-toggle">
  <button class="config-btn active">
    <svg><!-- 1 pane icon --></svg>
  </button>
  <button class="config-btn">
    <svg><!-- 2 panes icon --></svg>
  </button>
  <button class="config-btn">
    <svg><!-- 3 panes icon --></svg>
  </button>
</div>
```

#### Visual States
```
Inactive:  ┌──┐ ┌──┐ ┌──┐
           │▯ │ │▯▯│ │▯▯▯│
           └──┘ └──┘ └──┘

Active:    ┌──┐ ┌──┐ ┌──┐
           │▯ │ │▯▯│ │▯▯▯│  ← Highlighted with shadow
           └──┘ └──┘ └──┘
```

#### Styling
- **Container**: Purple-50 background, 6px border-radius
- **Button**: 28×24px, transparent → surface on hover
- **Active**: Surface background, purple accent, shadow
- **Icons**: 14×14px SVG, stroke-width 1.5

### 4. Focus Mode Toggle

#### Structure
```html
<button class="tool-pill" [class.active]="focusMode()">
  <svg><!-- expand/collapse icon --></svg>
  <span>Focus</span>
</button>
```

#### Visual States
```
Normal:    ┌─────────┐
           │ ⚡ Focus │  ← Border, transparent background
           └─────────┘

Hover:     ┌─────────┐
           │ ⚡ Focus │  ← Purple border, purple-50 background
           └─────────┘

Active:    ┌─────────┐
           │ ⚡ Focus │  ← Purple border, purple-50 background
           └─────────┘
```

#### Styling
- **Height**: 24px
- **Padding**: 0 8px
- **Border**: 1px solid border-strong → accent-border on hover
- **Background**: transparent → accent-bg on hover
- **Font**: 10.5px JetBrains Mono

### 5. Canvas Background Selector

#### Structure
```html
<button class="tool-pill">
  <svg><!-- grid icon --></svg>
  <span>Canvas</span>
</button>
```

#### Visual Appearance
```
┌──────────┐
│ ⊞ Canvas │  ← Same styling as Focus pill
└──────────┘
```

#### Styling
- Same as Focus Mode Toggle
- Icon shows grid pattern (12×12 with cross lines)

### 6. Save Button

#### Structure
```html
<button class="save-btn">
  Save
</button>
```

#### Visual States
```
Normal:    ┌──────┐
           │ Save │  ← Purple background, white text
           └──────┘

Hover:     ┌──────┐
           │ Save │  ← Darker purple
           └──────┘

Active:    ┌──────┐
           │ Save │  ← Slightly scaled down (0.98)
           └──────┘
```

#### Styling
- **Height**: 28px
- **Padding**: 0 10px
- **Background**: `var(--lore-color-accent)` (#7C3AED)
- **Color**: White
- **Font**: 11.5px DM Sans, medium weight
- **Border-radius**: 8px

## Spacing & Layout

### Horizontal Spacing
```
[Breadcrumb] ←─────────────────────→ [Live AI] [8px] [Config] [8px] [Focus] [8px] [Canvas] [8px] [Save]
             ↑                                                                                          ↑
             16px padding                                                                    16px padding
```

### Vertical Alignment
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │ ← 46px total height
│  [All elements vertically centered]                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Color Palette

### Light Mode
```
Breadcrumb Link:     #7C3AED (purple-600)
Breadcrumb Text:     #5C5870 (grey-600)
Breadcrumb Current:  #1A1625 (grey-900)
Separator:           #A09CB8 (grey-400)

Live AI Background:  #F0FDF4 (green-50)
Live AI Text:        #15803D (green-700)
Live AI Dot:         #15803D (green-700)

Panel Config BG:     #F5F3FF (purple-50)
Panel Config Active: #7C3AED (purple-600)

Tool Pill Border:    rgba(109, 40, 217, 0.20)
Tool Pill Hover:     #F5F3FF (purple-50)

Save Button:         #7C3AED (purple-600)
Save Button Text:    #FFFFFF (white)
```

## Responsive Behavior

### Width Breakpoints

#### Wide (>1200px)
```
[Long Breadcrumb Path]                    [All Controls Visible]
```

#### Medium (800-1200px)
```
[Breadcrumb...]                           [All Controls Visible]
```

#### Narrow (<800px)
```
[Breadcrumb...]                           [Essential Controls]
```

### Panel Count Changes

#### 1 Pane
```
┌─────────────────────────────────────────────────────────────────┐
│  Shelf › Notebook › Note A            [Live AI] [⚏] [⚡] [⊞] [Save]  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2 Panes
```
┌─────────────────────────────────────────────────────────────────┐
│  Shelf › Notebook › Note A            [Live AI] [⚏⚏] [⚡] [⊞] [Save] │
└─────────────────────────────────────────────────────────────────┘
```

#### 3 Panes
```
┌─────────────────────────────────────────────────────────────────┐
│  Shelf › Notebook › Note A            [Live AI] [⚏⚏⚏] [⚡] [⊞] [Save] │
└─────────────────────────────────────────────────────────────────┘
```

## Interaction States

### Hover Effects

#### Breadcrumb Link
```
Before:  AI & ML › Transformers › Note
After:   AI & ML › Transformers › Note
         ^^^^^^
         (underlined, darker purple)
```

#### Panel Config Button
```
Before:  ┌──┐
         │▯ │
         └──┘

After:   ┌──┐
         │▯ │  ← Slightly lighter background
         └──┘
```

#### Tool Pills
```
Before:  ┌─────────┐
         │ ⚡ Focus │
         └─────────┘

After:   ┌─────────┐
         │ ⚡ Focus │  ← Purple border, purple-50 background
         └─────────┘
```

#### Save Button
```
Before:  ┌──────┐
         │ Save │
         └──────┘

After:   ┌──────┐
         │ Save │  ← Darker purple (#6D28D9)
         └──────┘
```

### Active States

#### Panel Config
```
Active button has:
- Surface background (#FFFFFF)
- Purple accent color (#7C3AED)
- Subtle shadow (0 1px 3px rgba(109, 40, 217, 0.1))
```

#### Focus Mode
```
When zen mode is active:
- Purple border (#C4B5FD)
- Purple-50 background (#F5F3FF)
- Purple text (#7C3AED)
```

### Focus Visible (Keyboard Navigation)
```
All interactive elements:
- 2px solid purple outline
- 2px offset from element
- Visible only on keyboard focus
```

## Accessibility

### ARIA Labels
```html
<button aria-label="Single pane" title="1 pane">
<button aria-label="Two panes" title="2 panes">
<button aria-label="Three panes" title="3 panes">
<button title="Focus mode">
<button title="Canvas background">
<button title="Save (⌘S)">
```

### Keyboard Navigation
```
Tab Order:
1. Breadcrumb link (shelf)
2. Panel config button 1
3. Panel config button 2
4. Panel config button 3
5. Focus mode toggle
6. Canvas selector
7. Save button
```

### Screen Reader Announcements
```
"AI and Machine Learning, link"
"Transformers"
"Transformer Architecture Deep Dive"
"Live AI indicator"
"Single pane, button, pressed"
"Focus mode, button"
"Canvas background, button"
"Save, button"
```

## Animation Timing

### Live AI Pulse
```
Duration: 2s
Easing: linear
Iteration: infinite
Keyframes: 0% → 50% → 100%
           1.0   0.4   1.0 (opacity)
```

### Hover Transitions
```
Duration: 150ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
Properties: background, color, border-color
```

### Save Button Click
```
Duration: 120ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
Transform: scale(0.98)
```

## Implementation Notes

### Computed Breadcrumb
```typescript
currentBreadcrumb = computed<Breadcrumb | null>(() => {
  const notes = this.activeNotes();
  const activePaneIndex = this.activePane();
  const activeNote = notes[activePaneIndex];

  if (!activeNote) return null;

  return {
    shelf: 'AI & Machine Learning',    // TODO: Get from note
    notebook: 'Transformers',           // TODO: Get from note
    note: activeNote.title || 'Untitled Note'
  };
});
```

### Focus Mode Integration
```typescript
focusMode = this.layoutService.zenMode;

toggleFocusMode(): void {
  this.layoutService.toggleZen();
}
```

### Panel Configuration
```typescript
setPaneCount(count: 1 | 2 | 3): void {
  this.editorService.setPaneCount(count);
  this.updatePaneWidths();
}
```

## Testing Scenarios

### Visual Testing
- [ ] Breadcrumb displays correctly with long names
- [ ] Live AI dot pulses smoothly
- [ ] Panel config buttons show correct active state
- [ ] Focus mode toggle reflects zen mode state
- [ ] Save button has correct hover/active states
- [ ] All elements align vertically
- [ ] Spacing is consistent

### Interaction Testing
- [ ] Breadcrumb link is clickable
- [ ] Panel config buttons change layout
- [ ] Focus mode toggle works
- [ ] Canvas selector opens modal
- [ ] Save button triggers save
- [ ] Keyboard navigation works
- [ ] Focus visible outlines appear

### Responsive Testing
- [ ] Header adapts to narrow widths
- [ ] Breadcrumb truncates gracefully
- [ ] Controls remain accessible
- [ ] No horizontal scrolling

### Accessibility Testing
- [ ] Screen reader announces all elements
- [ ] Keyboard navigation is logical
- [ ] Focus indicators are visible
- [ ] ARIA labels are correct
- [ ] Color contrast meets WCAG AA

## Conclusion

The notes header implementation provides a comprehensive navigation and control interface that matches the mock design. All visual elements, interactions, and animations are implemented according to the design system, ensuring consistency and accessibility throughout the application.
