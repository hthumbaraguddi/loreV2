# Notebook Versioning - User Guide

**Welcome to Lore's Notebook Versioning!** 📜

Never lose your work again. Track every change, compare versions, and restore to any point in your notebook's history.

---

## Quick Start

### Accessing Version History

1. **Right-click** on any notebook in the sidebar
2. Select **"Version History"** from the menu
3. The version history modal opens

---

## Creating Versions

### Quick Snapshot
Create a fast snapshot of your current notebook state:

1. Open version history
2. Click **"📸 Quick Snapshot"**
3. Done! Your snapshot is saved

**When to use:** Quick saves before making major changes

---

### Milestone Version
Create a labeled version for important moments:

1. Open version history
2. Click **"⭐ Create Milestone"**
3. Enter a **label** (e.g., "Before Refactor", "Chapter 1 Complete")
4. Optionally add a **description**
5. Click **"Create"**

**When to use:** Major milestones, completed sections, before big reorganizations

**Benefits:**
- Milestones are never auto-deleted
- Easy to find in timeline
- Gold badge for visibility

---

## Viewing Version History

### Timeline Tab

The timeline shows all your versions in chronological order:

**Version Card Information:**
- **Version number** (v1, v2, v3...)
- **Badge** showing type:
  - 🟡 **Milestone** - Important labeled versions
  - 🔵 **Manual** - Quick snapshots
  - ⚫ **Auto** - Automatic saves (future feature)
  - 🟢 **Backup** - Created before restores
- **Timestamp** - When it was created
- **Label** - Your custom label (for milestones)
- **Change summary** - What changed (+3 ~2 -1)
- **Significant changes** - Human-readable description

**Example:**
```
v12  [Milestone]  2h ago
"Chapter 3 Complete"
+5 ~2 -1
• 5 note(s) added
• 2 note(s) modified
• 1 note(s) deleted
```

---

## Restoring Versions

### How to Restore

1. Open version history
2. Find the version you want to restore to
3. Click **"↺ Restore"** button
4. **Review the preview** showing:
   - ✅ Notes that will be added
   - ✏️ Notes that will be modified
   - ❌ Notes that will be removed
5. Click **"✓ Confirm Restore"**

### Safety Features

- **Automatic backup** created before every restore
- **Preview changes** before committing
- **Warning messages** if notes will be deleted
- **Undo capability** - restore to the backup if needed

### What Happens During Restore

- Your notebook returns to the exact state of that version
- All notes, titles, content, and structure are restored
- Current state is saved as a backup version
- You can always restore back to the backup

---

## Comparing Versions

Want to see what changed between two points in time?

### How to Compare

1. Open version history
2. Switch to **"Compare"** tab
3. Select **Version 1** from the dropdown
4. Select **Version 2** from the dropdown
5. View the detailed comparison

### Comparison Results

**Summary Statistics:**
- Number of notes added
- Number of notes modified
- Number of notes removed
- Number of notes unchanged

**Detailed Changes:**
- **Added Notes** - New notes in Version 2
- **Modified Notes** - Notes that changed, with badges showing what changed:
  - Title changed
  - Content changed
  - Type changed
  - Tags changed
  - Blocks changed
- **Removed Notes** - Notes deleted in Version 2

**Example Use Cases:**
- "What did I change this week?"
- "What's different between my draft and final version?"
- "Did I accidentally delete something important?"

---

## Analytics

Track your notebook's evolution over time.

### How to View Analytics

1. Open version history
2. Switch to **"Analytics"** tab

### Available Metrics

**Overview:**
- Total versions created
- Number of milestones
- Total notes added/modified/deleted
- Average time between versions
- Growth rate (notes per week)
- Most active day of the week

**Version Breakdown:**
- Manual snapshots count
- Auto-saves count (future)
- Milestones count
- Backup versions count

**Timeline:**
- First version date
- Latest version date

**Example Insights:**
- "Your notebook grew 40% this month"
- "You're most productive on Tuesdays"
- "Average 3 versions per week"

---

## Managing Versions

### Deleting Versions

1. Find the version in timeline
2. Click the **🗑️** button
3. Confirm deletion

**Note:** Milestone versions cannot be deleted (they're protected)

### Editing Version Labels

1. Select a version
2. Edit the label or description
3. Changes save automatically

---

## Best Practices

### When to Create Versions

✅ **Do create versions:**
- Before major reorganizations
- After completing a section
- Before trying experimental ideas
- At the end of work sessions
- Before sharing with others

❌ **Don't create versions:**
- After every tiny edit (wait for auto-save)
- Multiple times per minute
- For testing purposes only

### Naming Milestones

**Good labels:**
- "Before Refactor"
- "Chapter 3 Complete"
- "Pre-Review Version"
- "Backup Before Merge"
- "Final Draft v1"

**Poor labels:**
- "asdf"
- "test"
- "version"
- "backup"

### Organizing Your History

- Use milestones for important points
- Let auto-save handle routine changes
- Delete unnecessary manual snapshots
- Keep milestone count reasonable (5-10 per notebook)

---

## Tips & Tricks

### 💡 Tip 1: Preview Before Restore
Always review the restore preview. It shows exactly what will change, preventing surprises.

### 💡 Tip 2: Use Milestones Strategically
Create milestones at decision points. They're easy to find and never get deleted.

### 💡 Tip 3: Compare Before and After
Use the compare feature to see the impact of major changes.

### 💡 Tip 4: Check Analytics Regularly
Analytics help you understand your workflow and productivity patterns.

### 💡 Tip 5: Restore to Backup
If a restore didn't work as expected, look for the "Backup" version created just before it.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Close modal | `Esc` |
| Create milestone | (Coming soon) |
| Quick snapshot | (Coming soon) |

---

## Troubleshooting

### "No version history available"
**Solution:** Create your first version using "Quick Snapshot" or "Create Milestone"

### "Restore preview shows unexpected changes"
**Solution:** Double-check you selected the correct version. Compare with current state first.

### "Can't delete a version"
**Solution:** Milestone versions are protected and cannot be deleted. This is by design.

### "Version history not showing recent changes"
**Solution:** Auto-save may be disabled. Create a manual snapshot to capture current state.

### "Too many versions"
**Solution:** The system keeps the last 50 versions automatically. Older non-milestone versions are deleted. Create milestones for versions you want to keep forever.

---

## FAQ

**Q: How many versions can I create?**  
A: The system keeps the last 50 versions. Milestone versions are always kept, even beyond this limit.

**Q: Do versions take up a lot of space?**  
A: Each version stores a complete snapshot. For typical notebooks (20-50 notes), you can store 50 versions comfortably in browser storage.

**Q: Can I export version history?**  
A: Not yet, but this feature is planned for a future update.

**Q: Do versions sync across devices?**  
A: Not yet. Versions are stored locally. Cloud sync is planned for the future.

**Q: What happens if I delete a notebook?**  
A: All version history for that notebook is also deleted. Be careful!

**Q: Can I restore individual notes instead of the whole notebook?**  
A: Not yet, but selective restore is planned for Phase 3.

**Q: How do I know which version to restore to?**  
A: Use the compare feature to see what changed between versions. This helps you identify the right restore point.

**Q: Can I undo a restore?**  
A: Yes! A backup version is automatically created before every restore. Just restore to that backup.

**Q: Why can't I delete milestone versions?**  
A: Milestones are protected because they mark important points in your notebook's history. If you really need to delete one, you can update its label to indicate it's no longer needed.

---

## Advanced Features (Coming Soon)

### Phase 2: Automation
- ⏰ Auto-save every 15 minutes
- 🧠 Smart change detection
- 📅 Session-based snapshots

### Phase 3: Advanced Tools
- 🌿 Branching and merging
- 🔍 Content-level diff viewer
- 🎯 Selective note restore
- 📤 Export version history

### Phase 4: Intelligence
- 🤖 AI-generated version summaries
- 💡 Smart milestone suggestions
- 🔎 Search across all versions
- 📊 Predictive analytics

---

## Getting Help

**Need assistance?**
- Check this guide first
- Review the troubleshooting section
- Contact support with specific questions

**Found a bug?**
- Note the steps to reproduce
- Check what version you were trying to restore
- Report with screenshots if possible

---

## Glossary

**Version** - A snapshot of your notebook at a specific point in time

**Milestone** - A labeled version marking an important moment

**Snapshot** - Another word for version

**Restore** - Return your notebook to a previous version's state

**Diff** - The differences between two versions

**Backup** - Automatic version created before restore operations

**Timeline** - Chronological list of all versions

**Retention Policy** - Automatic deletion of old versions (keeps last 50)

---

**Happy versioning!** 🎉

Remember: Version history gives you the freedom to experiment, knowing you can always go back. Use it liberally!

---

*User Guide Version: 1.0*  
*Last Updated: May 6, 2026*
