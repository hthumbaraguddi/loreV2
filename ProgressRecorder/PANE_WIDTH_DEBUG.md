# Pane Width Issue - Debug Guide

## Current Implementation

### How Widths Are Applied
```html
<lore-pane
  [style.width.%]="pane.width"
/>
```

The width comes from the `panes()` computed signal:

```typescript
panes = computed(() => {
  const count = this.paneCount();
  const notes = this.activeNotes();
  const widths = this.paneWidths();
  
  // Ensure we have the right number of widths
  let actualWidths: number[];
  if (widths.length !== count) {
    // Recalculate widths if count doesn't match
    if (count === 1) {
      actualWidths = [100];
    } else if (count === 2) {
      actualWidths = [50, 50];
    } else {
      actualWidths = [33.33, 33.33, 33.34];
    }
  } else {
    actualWidths = widths;
  }
  
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    noteRef: notes[i] || null,
    width: actualWidths[i]
  }));
});
```

## Debug Steps

### 1. Check Browser Console
Open the browser console and add this to the component:

```typescript
constructor() {
  this.updatePaneWidths();
  
  effect(() => {
    const count = this.paneCount();
    console.log('Pane count changed to:', count);
    this.updatePaneWidths();
    console.log('Updated widths:', this.paneWidths());
  });
  
  // Debug panes computed
  effect(() => {
    const panes = this.panes();
    console.log('Panes computed:', panes.map(p => ({
      index: p.index,
      width: p.width,
      hasNote: !!p.noteRef
    })));
  });
}
```

### 2. Check Rendered HTML
In browser DevTools, inspect the pane elements and check:

```html
<!-- Should see something like: -->
<lore-pane style="width: 50%;"></lore-pane>
<lore-pane style="width: 50%;"></lore-pane>
```

### 3. Check CSS
Make sure the pane component has:

```scss
:host {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
  // Should NOT have a fixed width!
}
```

## Possible Issues

### Issue 1: Flex Container
The `.editor-container` might be using flexbox which could override width:

```scss
.editor-container {
  flex: 1;
  display: flex;  // ← This could cause issues
  position: relative;
  overflow: hidden;
}
```

**Fix:** Panes should respect their width even in flex container.

### Issue 2: Pane Component CSS
The pane component might have CSS that overrides the width:

```scss
.pane {
  flex: 1;  // ← This would make all panes equal width!
}
```

**Fix:** Remove `flex: 1` from pane.

### Issue 3: Width Not Updating
The width might be set initially but not updating when panes close.

**Fix:** Ensure the computed signal is reactive.

## Testing Checklist

1. [ ] Open 3 notes
2. [ ] Check browser console for pane count = 3
3. [ ] Check browser console for widths = [33.33, 33.33, 33.34]
4. [ ] Check DevTools - each pane should have `style="width: 33.33%"` etc.
5. [ ] Close one pane
6. [ ] Check browser console for pane count = 2
7. [ ] Check browser console for widths = [50, 50]
8. [ ] Check DevTools - each pane should have `style="width: 50%"`
9. [ ] Visually verify panes are 50% width each

## Expected Console Output

```
// Initial load with 3 notes
Pane count changed to: 3
Updated widths: [33.33, 33.33, 33.34]
Panes computed: [
  { index: 0, width: 33.33, hasNote: true },
  { index: 1, width: 33.33, hasNote: true },
  { index: 2, width: 33.34, hasNote: true }
]

// After closing one pane
Pane count changed to: 2
Updated widths: [50, 50]
Panes computed: [
  { index: 0, width: 50, hasNote: true },
  { index: 1, width: 50, hasNote: true }
]
```

## Quick Fix to Try

If the issue persists, try adding this CSS to force the width:

```scss
// In split-editor.component.scss
.editor-container {
  lore-pane {
    flex-shrink: 0;  // Prevent flex from shrinking
    flex-grow: 0;    // Prevent flex from growing
  }
}
```

Or change the container to not use flexbox:

```scss
.editor-container {
  display: block;  // Instead of flex
  position: relative;
  height: 100%;
  
  lore-pane {
    display: inline-block;
    vertical-align: top;
    height: 100%;
  }
}
```
