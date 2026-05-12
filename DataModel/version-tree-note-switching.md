# Version Tree Note Switching Feature

## Overview
Enhanced the version tree functionality to automatically close when users click on a different note in the sidebar, allowing seamless navigation back to note editing.

## Implementation Date
May 6, 2026

## Problem Statement
When a user was viewing the version tree for a note, clicking on a different note in the sidebar had unclear behavior. The expected behavior is:
- User views version tree for Note A
- User clicks Note B in sidebar
- Version tree closes and Note B opens for editing

## Solution
Implemented an Angular `effect()` that watches for note changes when in version tree mode and automatically closes the version tree, returning to normal note editing mode.

## Technical Implementation

### File Modified
`lore-app/src/app/features/editor/pane/pane.component.ts`

### Changes Made

**1. Added `effect` import**
```typescript
import { Component, signal, input, output, HostListener, inject, effect } from '@angular/core';
```

**2. Added constructor with effect**
```typescript
constructor() {
  // Watch for note changes - close version tree when switching notes
  effect(() => {
    const ref = this.noteRef();
    const mode = this.viewMode();
    const currentVersionNote = this.versionTreeNote();
    
    // If in version tree mode and note changes to a different note, close version tree
    if (mode === 'version-tree' && ref && currentVersionNote) {
      if (ref.id !== currentVersionNote.id) {
        // Different note selected, close version tree and show the new note
        this.closeVersionTree();
      }
    }
  });
}
```

## How It Works

### Angular Effects
Angular's `effect()` is a reactive primitive that automatically runs whenever any signal it reads changes. In this case:

1. **Signals Tracked**:
   - `noteRef()` - The current note reference in the pane
   - `viewMode()` - Whether the pane is showing 'note' or 'version-tree'
   - `versionTreeNote()` - The note currently displayed in version tree

2. **Reactive Behavior**:
   - When any signal changes, the effect runs
   - If in version tree mode AND a different note is selected
   - Automatically close version tree by calling `closeVersionTree()`
   - Pane switches back to note editing mode
   - New note displays in editor

### User Flow

**Before Enhancement:**
1. User opens Note A
2. User clicks history button → Version tree shows Note A's history
3. User clicks Note B in sidebar → Unclear behavior, might stay in version tree or cause confusion

**After Enhancement:**
1. User opens Note A
2. User clicks history button → Version tree shows Note A's history
3. User clicks Note B in sidebar → Version tree automatically closes, Note B opens for editing
4. User can click history button again to see Note B's version history if needed

## Benefits

### 1. Clear Navigation
- Clicking a note in sidebar always opens that note for editing
- Consistent behavior regardless of current view mode
- No confusion about what will happen

### 2. Intuitive Workflow
- Version tree is a "modal" view that closes when switching context
- Similar to how other tools handle history/preview modes
- Natural return to editing mode

### 3. Reduced Cognitive Load
- Users don't need to remember to close version tree
- Automatic cleanup of UI state
- Focus on the task at hand (editing the new note)

### 4. Reactive Architecture
- Uses Angular's reactive primitives (signals + effects)
- Automatic cleanup without manual event handling
- Clean separation of concerns

## Edge Cases Handled

### 1. Same Note Clicked
- If user clicks the same note while in version tree
- Effect detects `ref.id === currentVersionNote.id`
- Version tree stays open (no unnecessary close/reopen)

### 2. Note Deleted While Viewing
- If note is deleted, `noteRef` becomes null
- Effect doesn't trigger close (no new note to show)
- User must manually close version tree

### 3. Switching from Version Tree to Note Mode
- Effect only runs when `viewMode === 'version-tree'`
- No interference with normal note editing
- Clean state transitions

### 4. Multiple Panes
- Each pane has its own effect
- Independent version tree states per pane
- Closing version tree in one pane doesn't affect others

## Testing Checklist

- [x] Code compiles without errors
- [x] TypeScript diagnostics pass
- [x] Dev server recompiled successfully
- [ ] Browser test: Open version tree for Note A
- [ ] Browser test: Click Note B in sidebar → Version tree closes, Note B opens
- [ ] Browser test: Click history button → Version tree shows Note B's history
- [ ] Browser test: Click Note A in sidebar → Version tree closes, Note A opens
- [ ] Browser test: Click same note while in version tree → Version tree stays open
- [ ] Browser test: Multiple panes work independently

## Code Quality

### Advantages of This Approach

1. **Declarative**: Effect clearly states "when note changes in version tree mode, update the tree"
2. **Automatic**: No manual event subscriptions or cleanup needed
3. **Type-Safe**: Full TypeScript support with signals
4. **Testable**: Easy to test by changing signal values
5. **Maintainable**: Single source of truth for version tree note

### Alternative Approaches Considered

1. **Manual Event Handling**: 
   - Could listen to sidebar click events
   - Would require tight coupling between components
   - More complex state management

2. **Service-Based State**:
   - Could create a VersionTreeStateService
   - Track which pane is in version tree mode
   - More complex architecture for simple behavior

3. **No Auto-Close**:
   - Let version tree stay open when switching notes
   - Update to show new note's history
   - Less intuitive, users might get confused about which note they're viewing

## Future Enhancements

### 1. Keyboard Shortcut
- Press 'H' to toggle version tree
- Press 'Escape' to close version tree
- Quick access without mouse

### 2. Remember Last View
- If user was in version tree for Note A
- Switches to Note B (version tree closes)
- Switches back to Note A → Automatically reopen version tree
- Preserves user's workflow context

### 3. Version Tree in Sidebar
- Alternative view: show version tree in sidebar panel
- Allows viewing versions while editing
- Side-by-side comparison

### 4. Quick Version Preview
- Hover over note in sidebar
- Show tooltip with version count and last version date
- Quick insight without opening version tree

## Related Files

### Modified
- `lore-app/src/app/features/editor/pane/pane.component.ts`

### Related (No Changes)
- `lore-app/src/app/features/version-tree/version-tree.component.ts`
- `lore-app/src/app/features/sidebar/sidebar.component.ts`
- `lore-app/src/app/core/services/editor.service.ts`
- `lore-app/src/app/core/services/shelf.service.ts`

## Conclusion

This enhancement provides clear, intuitive behavior when switching notes while viewing version history. By automatically closing the version tree and returning to note editing mode, users get a consistent experience that matches their expectations.

The implementation is minimal and leverages Angular's reactive primitives for clean, maintainable code. The behavior is similar to how preview/history modes work in other applications, making it immediately familiar to users.
