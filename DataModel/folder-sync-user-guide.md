# Folder Sync & Import - User Guide

**Last Updated:** May 4, 2026

---

## Overview

Lore now supports **local folder sync** and **import**, allowing you to:
- 📤 **Export** your notes to a local folder as markdown files
- 📥 **Import** notes from a local folder back into Lore
- 🔄 **Auto-sync** with configurable intervals
- 💾 **Backup** your notes to your file system
- ✏️ **Edit** notes in external editors (VS Code, Obsidian, etc.)

---

## Getting Started

### 1. **Access Settings**

1. Click the **Settings** icon (⚙️) in the sidebar
2. Navigate to **Sync & Export** panel
3. Select **Local Only** as your storage tier

### 2. **Select a Sync Folder**

1. Click **📁 Select Folder** button
2. Choose a folder on your computer (e.g., `Documents/Lore-Notes`)
3. Grant permission when prompted
4. The folder path will be displayed in the UI

**Note:** Your browser will remember this folder across sessions.

### 3. **Enable Auto-Sync (Optional)**

1. Toggle **Enable auto-sync to local folder** ON
2. Choose a sync interval:
   - **1 minute** - For active development/testing
   - **5 minutes** - ⭐ Recommended for most users
   - **10 minutes** - For less frequent updates
   - **Manual only** - You control all syncs

### 4. **Sync Your Notes**

**Manual Sync:**
- Click **Sync Now** button anytime

**Auto-Sync:**
- Happens automatically based on your interval
- See "Next sync in X minutes" countdown
- See "Last synced X minutes ago" timestamp

---

## Folder Structure

When you sync, Lore creates this structure:

```
your-selected-folder/
└── lore-data/
    ├── metadata.json                    # Export metadata
    ├── AI & Machine Learning/           # Shelf folder
    │   ├── shelf.json                   # Shelf metadata
    │   ├── Transformers/                # Notebook folder
    │   │   ├── notebook.json            # Notebook metadata
    │   │   ├── Transformer Architecture Deep Dive.md
    │   │   └── Attention Mechanisms Survey.md
    │   └── RAG Patterns/
    │       ├── notebook.json
    │       └── Hybrid Retrieval Strategies.md
    └── Personal/
        ├── shelf.json
        └── Daily Journal/
            ├── notebook.json
            └── Monday — Deep Work Session.md
```

**Key Points:**
- ✅ One folder per shelf
- ✅ One subfolder per notebook
- ✅ One `.md` file per note
- ✅ Metadata stored in JSON files

---

## Markdown Format

Each note is exported as a markdown file with frontmatter:

```markdown
# Note Title

---
id: note_123
type: research
status: in-progress
tags: transformers, attention, architecture
created: 2026-03-16T10:00:00.000Z
updated: 2026-03-16T15:30:00.000Z
---

Note content here...

> **Hypothesis**: Flash Attention + GQA will become standard

> **Conclusion**: Current best practice is Flash Attention + GQA

```python
def scaled_dot_product_attention(Q, K, V):
    d_k = K.shape[-1]
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)
    return torch.softmax(scores, dim=-1)
```

---
```

**Block Types Converted:**
- `hypothesis` → `> **Hypothesis**: content`
- `conclusion` → `> **Conclusion**: content`
- `note` → `> **Note**: content`
- `warning` → `> ⚠️ **Warning**: content`
- `quote` → `> content\n> — attribution`
- `code` → ` ```language\ncontent\n``` `
- `divider` → `---`

---

## Importing Notes

### From a Previous Export

1. Go to **Settings** → **Sync & Export**
2. Scroll to **Export Options** section
3. Click **📥 Import** button
4. Select the folder containing `lore-data/`
5. Wait for import to complete
6. Page will reload with imported notes

### From Another App

If you have notes from another markdown-based app (Obsidian, Notion, etc.):

1. **Create folder structure:**
   ```
   import-folder/
   └── lore-data/
       └── My Shelf/
           └── My Notebook/
               └── My Note.md
   ```

2. **Add frontmatter to each note:**
   ```markdown
   # Note Title
   
   ---
   type: idea
   status: draft
   tags: tag1, tag2
   ---
   
   Note content...
   ```

3. **Import via Lore:**
   - Click **📥 Import** button
   - Select `import-folder`
   - Wait for import to complete

**Note:** Imported notes get new IDs to avoid conflicts with existing notes.

---

## Editing Notes Externally

### With VS Code

1. **Sync your notes** to a local folder
2. **Open folder in VS Code:**
   ```bash
   code ~/Documents/Lore-Notes/lore-data
   ```
3. **Edit markdown files** as needed
4. **Import back into Lore** when done

### With Obsidian

1. **Sync your notes** to a local folder
2. **Open as Obsidian vault:**
   - Open Obsidian
   - Click "Open folder as vault"
   - Select `lore-data` folder
3. **Edit notes** in Obsidian
4. **Import back into Lore** when done

### With Any Text Editor

1. **Sync your notes** to a local folder
2. **Navigate to** `lore-data/[Shelf]/[Notebook]/`
3. **Edit `.md` files** with any text editor
4. **Import back into Lore** when done

---

## Version Control with Git

### Setup

```bash
cd ~/Documents/Lore-Notes
git init
git add lore-data/
git commit -m "Initial commit"
```

### Workflow

1. **Sync notes** from Lore
2. **Review changes:**
   ```bash
   git status
   git diff
   ```
3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Updated transformer notes"
   ```
4. **Push to remote** (optional):
   ```bash
   git remote add origin https://github.com/username/lore-notes.git
   git push -u origin main
   ```

---

## Syncing Across Devices

### Via Cloud Storage (Dropbox, iCloud, Google Drive)

1. **Select sync folder** inside your cloud storage:
   - Example: `~/Dropbox/Lore-Notes`
2. **Enable auto-sync** on all devices
3. **Cloud service** handles file syncing
4. **Import on other devices** to get latest notes

**Workflow:**
- **Device A:** Edit notes → Auto-sync to folder → Cloud syncs
- **Device B:** Cloud syncs → Import from folder → See latest notes

### Via Git (Manual)

1. **Device A:**
   ```bash
   cd ~/Documents/Lore-Notes
   git add .
   git commit -m "Updated notes"
   git push
   ```

2. **Device B:**
   ```bash
   cd ~/Documents/Lore-Notes
   git pull
   # Then import in Lore
   ```

---

## Troubleshooting

### "No folder selected" Error

**Solution:** Click **📁 Select Folder** and choose a folder.

### "Permission denied" Error

**Solution:** 
1. Click **📁 Change Folder**
2. Select the same folder again
3. Grant permission when prompted

### "Browser not supported" Warning

**Cause:** Your browser doesn't support File System Access API.

**Solution:**
- Use Chrome or Edge (recommended)
- Or use GitHub sync (when available)
- Or use manual JSON export

### Import Not Working

**Checklist:**
- ✅ Folder contains `lore-data/` directory
- ✅ Markdown files have proper frontmatter
- ✅ JSON files are valid (use JSONLint to check)
- ✅ File names don't have special characters

### Sync Progress Stuck

**Solution:**
1. Refresh the page
2. Try syncing again
3. Check browser console for errors

### Imported Notes Not Showing

**Cause:** Page didn't reload after import.

**Solution:** Manually refresh the page (Cmd+R / Ctrl+R).

---

## Best Practices

### 1. **Regular Backups**
- Enable auto-sync with 5-minute interval
- Or manually sync before closing Lore
- Keep multiple backup locations

### 2. **Version Control**
- Use Git for version history
- Commit after major changes
- Push to remote for off-site backup

### 3. **Cloud Storage**
- Sync to Dropbox/iCloud for automatic backup
- Access notes from any device
- No manual import/export needed

### 4. **External Editing**
- Use VS Code for bulk edits
- Use Obsidian for graph view
- Always import back into Lore after editing

### 5. **Conflict Resolution**
- Import creates new notes (doesn't overwrite)
- Manually delete duplicates if needed
- Use Git to track changes

---

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 86+ | ✅ Full | Recommended |
| Edge 86+ | ✅ Full | Recommended |
| Safari 15.2+ | ⚠️ Limited | Some features may not work |
| Firefox | ❌ None | Use GitHub sync instead |

---

## FAQ

### Q: Where are my notes stored?

**A:** Notes are stored in:
1. **Browser localStorage** (always)
2. **Local folder** (if sync enabled)
3. **GitHub** (if GitHub sync enabled - coming soon)

### Q: Can I edit notes in VS Code?

**A:** Yes! Sync to a folder, edit in VS Code, then import back into Lore.

### Q: Will import overwrite my existing notes?

**A:** No. Import creates new notes with new IDs. You can manually delete duplicates.

### Q: Can I sync across devices?

**A:** Yes, via cloud storage (Dropbox, iCloud) or Git. See "Syncing Across Devices" section.

### Q: What happens if I delete a note in the folder?

**A:** It won't be deleted in Lore until you import. Import only adds notes, doesn't remove them.

### Q: Can I use Obsidian with Lore?

**A:** Yes! Sync to a folder, open as Obsidian vault, edit, then import back.

### Q: Is my data encrypted?

**A:** Not currently. Files are stored as plain markdown. Use encrypted cloud storage if needed.

### Q: Can I export to other formats?

**A:** Currently: Markdown. Coming soon: JSON, ZIP. Use Pandoc to convert markdown to other formats.

---

## Coming Soon

### GitHub Sync (Phase 7)
- ✅ OAuth authentication
- ✅ Push/pull to private repository
- ✅ Commit history
- ✅ Conflict resolution

### Cloud Storage (Phase 8)
- ✅ Supabase/Firebase integration
- ✅ Real-time sync across devices
- ✅ Collaborative editing
- ✅ 1GB storage

### Advanced Export (Phase 9)
- ✅ JSON export (single file)
- ✅ ZIP export (all HTML notes)
- ✅ PDF export
- ✅ Notion export

---

## Support

**Issues?** Check the troubleshooting section above.

**Feature requests?** Open an issue on GitHub.

**Questions?** Join our Discord community.

---

**Happy note-taking!** 📝✨
