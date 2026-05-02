# Visual Guide: Shelf, Notebook, and Note Creation

## Feature Overview

This guide demonstrates the new '+' button functionality and filtered note viewing.

---

## 1. Creating a New Shelf

### Location: Top of Sidebar

```
┌─────────────────────────────────────┐
│  🔍 Search notes...    [≡] [▭]  [+] │ ← Click this '+' to create shelf
└─────────────────────────────────────┘
```

### What Happens:
1. Click the purple '+' button in the top toolbar
2. A new shelf appears: `● New Shelf (0)`
3. The shelf is automatically expanded
4. The name field is focused for immediate editing
5. Type new name and press Enter to confirm

### Result:
```
┌─────────────────────────────────────┐
│  ● New Shelf (0)                [+] │ ← New shelf created
│    (empty - no notebooks yet)       │
└─────────────────────────────────────┘
```

---

## 2. Creating a New Notebook

### Location: Shelf Header (on hover)

```
┌─────────────────────────────────────┐
│  ▸ ● AI & Machine Learning (5)  [+] │ ← Hover to see '+' button
└─────────────────────────────────────┘
```

### What Happens:
1. Hover over any shelf header
2. A '+' button appears on the right
3. Click the '+' button
4. A new notebook appears in that shelf
5. The shelf expands if it was collapsed
6. The notebook name field is focused for editing

### Result:
```
┌─────────────────────────────────────┐
│  ▾ ● AI & Machine Learning (5)  [+] │
│    ▸ 📔 Transformers (3)         [+] │
│    ▸ 📗 RAG Patterns (2)         [+] │
│    ▸ 📔 New Notebook (0)         [+] │ ← New notebook created
└─────────────────────────────────────┘
```

---

## 3. Creating a New Note

### Location: Notebook Header (on hover)

```
┌─────────────────────────────────────┐
│    ▸ 📔 Transformers (3)         [+] │ ← Hover to see '+' button
└─────────────────────────────────────┘
```

### What Happens:
1. Hover over any notebook header
2. A '+' button appears on the right
3. Click the '+' button
4. A new note is created in that notebook
5. The notebook expands if it was collapsed
6. The note opens immediately in the editor

### Result:
```
┌─────────────────────────────────────┐
│    ▾ 📔 Transformers (4)         [+] │
│      RESEARCH  Today                 │
│      Transformer Architecture        │
│      The Transformer architecture... │
│                                      │
│      IDEA  Just now                  │
│      New Note                        │ ← New note created & opened
│      No content yet...               │
└─────────────────────────────────────┘
```

---

## 4. Viewing All Notes in a Shelf

### Click Target: Shelf Dot or Shelf Name

```
┌─────────────────────────────────────┐
│  ▾ ● AI & Machine Learning (5)  [+] │
│     ↑ ↑                              │
│     │ └─ Click name                  │
│     └─── Click dot                   │
└─────────────────────────────────────┘
```

### What Happens:
1. Click on the shelf dot (●) or shelf name
2. All open notes close
3. The NoteGrid appears showing all notes from ALL notebooks in that shelf
4. Header shows shelf name with colored dot

### Result - NoteGrid View:
```
┌─────────────────────────────────────────────────────────┐
│  All Notes › AI & Machine Learning                      │
│                                                          │
│  ● AI & Machine Learning                                │
│  5 notes in this shelf                                  │
│                                                          │
│  [All] [Recent] [Favorites] [AI]                        │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ RESEARCH │  │ RESEARCH │  │   IDEA   │             │
│  │ Today    │  │ 2d ago   │  │ 5d ago   │             │
│  │          │  │          │  │          │             │
│  │Transform │  │Attention │  │BERT vs   │             │
│  │Architect │  │Mechanism │  │GPT       │             │
│  │...       │  │...       │  │...       │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
│  ┌──────────┐  ┌──────────┐                            │
│  │ RESEARCH │  │   TASK   │                            │
│  │ 1w ago   │  │ 3d ago   │                            │
│  │          │  │          │                            │
│  │Hybrid    │  │Context   │                            │
│  │Retrieval │  │Window    │                            │
│  │...       │  │...       │                            │
│  └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Viewing All Notes in a Notebook

### Click Target: Notebook Icon or Notebook Name

```
┌─────────────────────────────────────┐
│    ▾ 📔 Transformers (3)         [+] │
│       ↑  ↑                           │
│       │  └─ Click name               │
│       └──── Click icon               │
└─────────────────────────────────────┘
```

### What Happens:
1. Click on the notebook icon (📔) or notebook name
2. All open notes close
3. The NoteGrid appears showing all notes from ONLY that notebook
4. Header shows notebook name with emoji icon

### Result - NoteGrid View:
```
┌─────────────────────────────────────────────────────────┐
│  All Notes › 📔 Transformers                            │
│                                                          │
│  📔 Transformers                                        │
│  3 notes in this notebook                               │
│                                                          │
│  [All] [Recent] [Favorites] [AI]                        │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ RESEARCH │  │ RESEARCH │  │   IDEA   │             │
│  │ Today    │  │ 2d ago   │  │ 5d ago   │             │
│  │          │  │          │  │          │             │
│  │Transform │  │Attention │  │BERT vs   │             │
│  │Architect │  │Mechanism │  │GPT       │             │
│  │...       │  │...       │  │...       │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Returning to All Notes View

### Click Target: "All Notes" in Breadcrumb

```
┌─────────────────────────────────────────────────────────┐
│  All Notes › 📔 Transformers                            │
│  ↑                                                       │
│  └─ Click here to clear filter                          │
└─────────────────────────────────────────────────────────┘
```

### What Happens:
1. Click "All Notes" in the breadcrumb
2. The filter is cleared
3. NoteGrid shows ALL notes from ALL shelves and notebooks

### Result:
```
┌─────────────────────────────────────────────────────────┐
│  All Notes                                              │
│                                                          │
│  📝 Notes                                               │
│  8 notes across 4 notebooks                             │
│                                                          │
│  [All] [Recent] [Favorites] [AI]                        │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [All notes from all shelves and notebooks displayed]   │
└─────────────────────────────────────────────────────────┘
```

---

## Click Behavior Summary

### Sidebar Elements:

| Element | Click Action | Result |
|---------|-------------|--------|
| Top '+' button | Create new shelf | New shelf appears, ready to rename |
| Shelf chevron (▸/▾) | Toggle expansion | Expands/collapses shelf |
| Shelf dot (●) | View shelf notes | Shows NoteGrid with all notes in shelf |
| Shelf name | View shelf notes | Shows NoteGrid with all notes in shelf |
| Shelf '+' button | Create notebook | New notebook appears in shelf |
| Notebook chevron (▸/▾) | Toggle expansion | Expands/collapses notebook |
| Notebook icon (📔) | View notebook notes | Shows NoteGrid with notes in notebook |
| Notebook name | View notebook notes | Shows NoteGrid with notes in notebook |
| Notebook '+' button | Create note | New note created and opened in editor |
| Note item | Open note | Opens note in editor |

### NoteGrid Elements:

| Element | Click Action | Result |
|---------|-------------|--------|
| "All Notes" breadcrumb | Clear filters | Shows all notes from all shelves |
| Note card | Open note | Opens note in editor |
| "+ New Note" card | Create note | Creates note in current filtered notebook |

---

## Keyboard Shortcuts (Future Enhancement)

| Shortcut | Action |
|----------|--------|
| Cmd+N | Create new note in current notebook |
| Cmd+Shift+N | Create new notebook in current shelf |
| Cmd+Shift+S | Create new shelf |
| Escape | Cancel inline rename |
| Enter | Confirm inline rename |

---

## Visual Indicators

### Hover States:
- **Shelf/Notebook headers**: Background changes to light purple
- **'+' buttons**: Fade in on hover, turn purple on hover
- **Note items**: Background changes to light purple

### Active States:
- **Active note**: Purple left border + purple background
- **Focused item**: Purple outline (keyboard navigation)
- **Dragging item**: 50% opacity

### Filter States:
- **Filtered view**: Breadcrumb shows filter path
- **All notes view**: Breadcrumb shows only "All Notes"

---

## Tips for Users

1. **Quick Creation**: Use '+' buttons for fast creation without context menus
2. **Inline Renaming**: Start typing immediately after creation
3. **Filter Navigation**: Click shelf/notebook names to focus on specific content
4. **Breadcrumb Navigation**: Use breadcrumbs to navigate back to broader views
5. **Keyboard Navigation**: Use arrow keys to navigate, Enter to open, F2 to rename

---

## Implementation Notes

- All '+' buttons appear on hover to reduce visual clutter
- Filters are mutually exclusive (shelf OR notebook, not both)
- Creating items automatically expands parent containers
- Inline renaming is triggered immediately after creation
- All state is managed through Angular signals for reactivity
