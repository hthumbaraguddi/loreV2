# How to Access Phase 9 Features

**Quick Reference Guide for Testing Phase 9 Features**

---

## 🚀 Quick Start

1. **Start the development server**:
   ```bash
   cd lore-app
   npm start
   ```

2. **Open your browser**:
   ```
   http://localhost:4200
   ```

---

## 📍 Entry Points

### 1. Global Search (⌘K)

**How to Access**:
- Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) from anywhere in the app

**What You'll See**:
- Search overlay with backdrop blur
- Search input field
- Filter chips: All, Notes, Notebooks, Tags
- Search results with icons and previews

**What You Can Do**:
- Type to search across all notes, notebooks, and tags
- Use arrow keys (↑↓) to navigate results
- Press Enter to select a result
- Press ESC to close
- Click filter chips to filter by type

**URL**: N/A (overlay, accessible from anywhere)

---

### 2. Tags Browser

**How to Access**:
- Click the **"Tags"** icon (label icon) in the left navigation rail
- OR navigate directly to: `http://localhost:4200/tags`

**What You'll See**:
- Header with "Tags" title and statistics
- Search box for filtering tags
- Grid/List view toggle buttons
- Tag cards showing:
  - Tag name
  - Note count
  - Preview of notes with that tag
  - Edit and delete buttons

**What You Can Do**:
- Search tags using the search box
- Toggle between grid and list view
- Click a tag card to see all notes with that tag
- Edit or delete tags

**URL**: `http://localhost:4200/tags`

---

### 3. Tag Filter (Notes by Tag)

**How to Access**:
- From Tags Browser: Click on any tag card
- OR navigate directly to: `http://localhost:4200/tags/[tagName]`
  - Example: `http://localhost:4200/tags/research`

**What You'll See**:
- Header with tag name
- Statistics showing number of notes
- List of all notes with that tag
- Each note shows:
  - Icon (based on note type)
  - Title
  - Path (Shelf › Notebook)
  - Preview text
  - Last updated date

**What You Can Do**:
- Click any note to open it in the editor
- Click the close button (X) to return to tags browser

**URL**: `http://localhost:4200/tags/:tagName`

---

### 4. Context Panel (Not Yet Integrated)

**Status**: Component created but not yet integrated with editor

**Future Access**:
- Will be accessible from the note editor
- Toggle button in editor toolbar
- Shows note statistics, tags, links, and backlinks

**Current Status**: Pending integration (Phase 9 - 35% remaining)

---

## 🎯 Complete User Flows

### Flow 1: Browse and Filter by Tag

```
1. Click "Tags" icon in navigation rail
   ↓
2. See all tags in grid view
   ↓
3. (Optional) Search for specific tag
   ↓
4. Click on a tag card
   ↓
5. See all notes with that tag
   ↓
6. Click on a note
   ↓
7. Note opens in editor
```

### Flow 2: Global Search

```
1. Press ⌘K (or Ctrl+K)
   ↓
2. Search overlay appears
   ↓
3. Type your search query
   ↓
4. (Optional) Click filter chip to filter by type
   ↓
5. Use arrow keys to navigate results
   ↓
6. Press Enter to select
   ↓
7. Navigate to selected item
```

---

## 🗺️ Navigation Map

```
Left Navigation Rail (Vertical Icons)
├── 📄 Notes → /notes
├── 🕸️ Graph → /graph
├── 🌐 HTML Notes → /html-notes
├── 📐 Template Builder → /template-builder
├── 🤖 AI Chat (opens right panel)
├── 📚 Prompt Library → /prompts
├── 🏷️ Tags → /tags ← NEW! Click here
├── 🔔 Notifications (opens panel)
└── ⚙️ Settings → /settings

Global Shortcuts
├── ⌘K / Ctrl+K → Global Search ← NEW! Press this
└── ⌘⇧D → Toggle Dark Mode
```

---

## 📸 Visual Guide

### Navigation Rail Location
```
┌─────────────────────────────────────┐
│ [L]  ← Logo                         │
│                                     │
│ [📄] ← Notes                        │
│ [🕸️] ← Graph                        │
│ [🌐] ← HTML Notes                   │
│ [📐] ← Template Builder             │
│ [🤖] ← AI Chat                      │
│ [📚] ← Prompt Library               │
│ [🏷️] ← Tags (NEW! Click here)      │
│ [🔔] ← Notifications                │
│                                     │
│      ↑ Spacer                       │
│                                     │
│ [⚙️] ← Settings                     │
│ [👤] ← Profile                      │
└─────────────────────────────────────┘
```

### Tags Browser Layout
```
┌─────────────────────────────────────────────┐
│ Tags                    [12] Tags [45] Notes│
│ Browse and manage all tags                  │
├─────────────────────────────────────────────┤
│ [🔍 Search tags…]           [Grid] [List]  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │Research  │  │Finance   │  │Journal   │ │
│  │    5     │  │    3     │  │    8     │ │
│  │          │  │          │  │          │ │
│  │• Note 1  │  │• Note 1  │  │• Note 1  │ │
│  │• Note 2  │  │• Note 2  │  │• Note 2  │ │
│  │          │  │          │  │          │ │
│  │[Edit][Del]│  │[Edit][Del]│  │[Edit][Del]│
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### Global Search Overlay
```
┌─────────────────────────────────────────────┐
│                                             │
│     ┌───────────────────────────────┐      │
│     │ [🔍] Search notes, notebooks… │      │
│     │                               │      │
│     │ [All][Notes][Notebooks][Tags] │      │
│     │                               │      │
│     │ 📄 Note Title                 │      │
│     │    Shelf › Notebook           │      │
│     │                               │      │
│     │ 📄 Another Note               │      │
│     │    Shelf › Notebook           │      │
│     │                               │      │
│     │ 🏷️ Tag: research (5 notes)    │      │
│     │                               │      │
│     └───────────────────────────────┘      │
│                                             │
│     Press ESC to close                      │
└─────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Test Global Search
- [ ] Press ⌘K (or Ctrl+K)
- [ ] Search overlay appears
- [ ] Type "research" in search box
- [ ] See search results
- [ ] Click "Notes" filter chip
- [ ] Results filter to notes only
- [ ] Use arrow keys to navigate
- [ ] Press Enter to select
- [ ] Press ESC to close

### Test Tags Browser
- [ ] Click "Tags" icon in navigation rail
- [ ] Tags browser page loads
- [ ] See tag cards in grid view
- [ ] Click grid/list toggle
- [ ] View changes to list
- [ ] Type in search box
- [ ] Tags filter as you type
- [ ] Click on a tag card
- [ ] Tag filter page loads

### Test Tag Filter
- [ ] From tags browser, click a tag
- [ ] Tag filter page loads with tag name
- [ ] See list of notes with that tag
- [ ] Click on a note
- [ ] Note opens in editor
- [ ] Go back to tag filter
- [ ] Click close button (X)
- [ ] Returns to tags browser

---

## 🐛 Troubleshooting

### Global Search Not Opening
- **Issue**: Pressing ⌘K doesn't open search
- **Solution**: Make sure you're in the app (not on landing page)
- **Check**: Look for the navigation rail on the left

### Tags Icon Not Visible
- **Issue**: Can't find Tags icon in navigation
- **Solution**: Scroll down in the navigation rail
- **Check**: It's between "Prompt Library" and "Notifications"

### Tag Filter Shows No Notes
- **Issue**: Tag filter page is empty
- **Solution**: The tag might not have any notes yet
- **Check**: Go back to tags browser and try a different tag

### Routes Not Working
- **Issue**: URLs like `/tags` show 404
- **Solution**: Make sure dev server is running
- **Check**: Run `npm start` in lore-app directory

---

## 📞 Quick Reference

| Feature | Access Method | URL |
|---------|--------------|-----|
| **Global Search** | ⌘K or Ctrl+K | N/A (overlay) |
| **Tags Browser** | Click Tags icon | `/tags` |
| **Tag Filter** | Click tag card | `/tags/:tagName` |
| **Context Panel** | Not yet integrated | N/A |

---

## 🎯 What's Next

The following features are created but need integration:
1. **Context Panel** - Needs integration with note editor
2. **Mini Graph View** - Not yet created
3. **Link Preview** - Not yet created
4. **Unlinked Mentions** - Not yet created

**Current Phase 9 Progress**: 65% complete

---

## 💡 Tips

1. **Use keyboard shortcuts**: ⌘K is the fastest way to search
2. **Explore tags**: Tags browser is great for discovering related notes
3. **Filter results**: Use filter chips in global search for better results
4. **Navigate efficiently**: Use arrow keys in search for quick navigation

---

**Need Help?** Check the documentation in `/ProgressRecorder/` folder for more details!
