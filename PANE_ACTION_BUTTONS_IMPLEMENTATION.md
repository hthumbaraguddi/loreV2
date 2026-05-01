# Pane Action Buttons Implementation

## Summary
Moved Panel, History, and Canvas buttons from the pane header to floating action buttons in the top right corner of the notes panel content area.

## Changes Made

### 1. HTML Structure (`pane.component.html`)
- **Removed** Panel, History, and Canvas buttons from pane header
- **Added** floating action buttons container (`.pane-actions`) inside `.pane-content`
- Buttons now appear as floating overlay in top right corner of note content area
- Only visible when a note is loaded in the pane

### 2. Styling (`pane.component.scss`)
- **Added** `.pane-actions` container:
  - Positioned absolutely in top right corner (12px from top and right)
  - Initially hidden (opacity: 0)
  - Becomes visible on pane hover or when buttons receive focus
  - z-index: 10 to float above content
  
- **Added** `.pane-action-btn` styling:
  - 32×32px circular buttons
  - White background with border and shadow
  - Smooth hover effects (lift animation, color change)
  - Material Icons (18px)
  - Accessible focus states

### 3. Behavior
- **Visibility**: Buttons fade in when hovering over the pane
- **Always Available**: Visible in both single-pane and multi-pane layouts
- **Non-intrusive**: Float over content without taking layout space
- **Accessible**: Keyboard navigable with focus indicators

## Button Functions (Placeholders)
1. **Panel** (`view_sidebar` icon) - Opens panel options for the pane
2. **History** (`history` icon) - Shows version history for the note
3. **Canvas** (`grid_on` icon) - Changes canvas background for the pane

## Visual Design
```
┌─────────────────────────────────────────┐
│ Pane Header (when 2+ panes)            │
│ [Icon] Note Title              [Close]  │
├─────────────────────────────────────────┤
│                          [P] [H] [C] ←──┤ Floating buttons
│                                         │
│  Note Content Area                      │
│                                         │
│                                         │
└─────────────────────────────────────────┘

P = Panel, H = History, C = Canvas
```

## Next Steps
1. Implement `onPanelClick()` - Create panel options dropdown/modal
2. Implement `onHistoryClick()` - Create history sidebar/modal
3. Implement `onCanvasClick()` - Create canvas picker modal
4. Consider adding tooltips with keyboard shortcuts
5. Test accessibility with screen readers

## Files Modified
- `lore-app/src/app/features/editor/pane/pane.component.html`
- `lore-app/src/app/features/editor/pane/pane.component.scss`

## Design Rationale
- **Top right corner placement**: Standard location for contextual actions
- **Floating design**: Doesn't consume vertical space in header
- **Hover reveal**: Keeps interface clean, reveals on interaction
- **Always available**: Works in both single and multi-pane layouts
- **Visual hierarchy**: Subtle shadow and hover effects indicate interactivity
