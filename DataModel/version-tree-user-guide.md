# Version Tree User Guide

## Quick Start

### Opening Version Tree
1. Open any note in the editor
2. Click the **⏱️ history button** in the top-right corner
3. The version tree appears in the main panel

### Viewing Different Notes' Histories
When viewing a note's version tree:

1. Click any other note in the sidebar
2. The version tree **automatically closes**
3. The new note opens for editing
4. Click the history button (⏱️) to see the new note's version history

**Note**: The version tree closes when switching notes to keep the interface clean and focused on the current task.

### Closing Version Tree
- Click the **✕ close button** in the version tree header
- Returns to normal note editing mode

## Version Tree Features

### Git-Style Visualization
- **Branch Lines**: Vertical lines connecting versions
- **Commit Dots**: Circular badges with emoji icons
- **Color Coding**: Different colors for different version types

### Version Types

| Icon | Type | Color | Description |
|------|------|-------|-------------|
| ⭐ | Milestone | Gold | Important checkpoints you manually mark |
| 📸 | Manual | Blue | Quick snapshots you create on demand |
| ✏️ | Session | Purple | Automatic versions when you finish editing |
| 🔄 | Backup | Green | Automatic backup before restoring |
| 💾 | Auto | Gray | Scheduled automatic versions (if enabled) |

### Version Information
Each version shows:
- **Version Number**: v1, v2, v3...
- **Timestamp**: Relative (2h ago) or absolute date
- **Label**: Custom label for milestones
- **Description**: Optional description
- **Changes**: Summary of what changed
- **Actions**: Restore, delete, compare buttons

## Creating Versions

### Quick Snapshot
1. Click **"Quick Snapshot"** button
2. Version created instantly with current state
3. Useful for saving progress before major changes

### Create Milestone
1. Click **"Create Milestone"** button
2. Enter a label (required): e.g., "Draft Complete"
3. Enter description (optional): e.g., "First complete draft ready for review"
4. Click **"Create"**
5. Milestone appears in version tree with ⭐ icon

### Automatic Session Versions
- Versions created automatically when you finish editing
- No manual action needed
- Triggered when:
  - You close a note
  - You switch to a different note
  - You close the browser
- Only creates version if significant changes detected (>50 characters)

## Comparing Versions

### How to Compare
1. Click **"Compare"** button in header (compare_arrows icon)
2. Click first version → Shows "1" badge
3. Click second version → Shows "2" badge
4. Comparison panel appears below version tree

### Comparison Results
Shows:
- **Total Changes**: Number of fields that changed
- **Change Details**: List of what changed
- **Before/After Values**: For title, type, status changes
- **Content Modified**: Indicates content was edited

### Clear Comparison
- Click **"Clear"** button to reset selection
- Click **"Compare"** button again to exit compare mode

## Restoring Versions

### How to Restore
1. Find the version you want to restore to
2. Click **"Restore"** button
3. Confirmation dialog appears
4. Click **"OK"** to confirm

### What Happens
1. **Automatic Backup**: Current state saved as backup version (🔄)
2. **Restoration**: Note restored to selected version
3. **New Version**: Restoration creates a new version in history
4. **Safe Operation**: Original version preserved, can restore again if needed

### What Gets Restored
- Title
- Content
- Type (research, journal, task, etc.)
- Tags
- Blocks
- Status

## Version Management

### Deleting Versions
- Click **delete** button (🗑️) on any version
- Confirmation required for milestone versions
- Cannot delete if it's the only version

### Version Retention
- System keeps last **50 versions** by default
- **Milestone versions** always preserved
- Older non-milestone versions automatically cleaned up
- Configurable in settings (future feature)

## Keyboard Shortcuts (Future)

| Shortcut | Action |
|----------|--------|
| Escape | Close version tree |
| ↑/↓ | Navigate versions |
| Enter | Select/view version |
| C | Toggle compare mode |
| R | Restore selected version |
| M | Create milestone |
| S | Create quick snapshot |

## Tips & Best Practices

### When to Create Milestones
- ✅ Before major refactoring
- ✅ After completing a section
- ✅ Before sharing with others
- ✅ At project checkpoints
- ✅ When switching focus areas

### When to Use Quick Snapshots
- ✅ Before experimenting with ideas
- ✅ During brainstorming sessions
- ✅ When trying different approaches
- ✅ Before making risky changes

### Browsing Multiple Notes' Histories
To view version histories of multiple notes:

1. Open Note A, click history button
2. Review Note A's version history
3. Click close button (✕) or click Note B in sidebar
4. Note B opens for editing
5. Click history button to see Note B's version history
6. Repeat as needed

**Tip**: The version tree automatically closes when you switch notes, keeping your workspace clean and focused.

### Version Labels
Good labels are:
- ✅ Descriptive: "Added methodology section"
- ✅ Concise: "Draft v1"
- ✅ Contextual: "Before client review"
- ✅ Dated: "2026-05-06 Final"

Avoid:
- ❌ Generic: "Update"
- ❌ Vague: "Changes"
- ❌ Too long: "Made some changes to the introduction and also updated..."

## Troubleshooting

### Version Tree Not Showing
- **Check**: Is a note open in the editor?
- **Solution**: Open a note first, then click history button

### No Versions Available
- **Reason**: Note is new, no versions created yet
- **Solution**: Click "Create First Snapshot" button

### Version Tree Shows Wrong Note
- **Reason**: Version tree should close when switching notes
- **Solution**: If it doesn't close, click the close button (✕) manually

### Can't Switch Notes in Version Tree
- **Expected**: Version tree closes when you click a different note
- **Check**: Are you clicking notes in the sidebar?
- **Solution**: Click the new note, version tree should close automatically

### Restore Not Working
- **Check**: Did you confirm the dialog?
- **Check**: Is the note locked or read-only?
- **Solution**: Try closing and reopening the note

## Advanced Features (Future)

### Version Search
- Search versions by content
- Filter by date range
- Filter by trigger type
- Find specific changes

### Version Export
- Export version history as JSON
- Import version history from backup
- Share version history with team

### Version Branching
- Create alternative versions
- Merge versions together
- Track multiple storylines

### Collaborative Versioning
- See who created each version
- Version comments and discussions
- Conflict resolution

## FAQ

**Q: How many versions can I create?**
A: Unlimited! But system keeps last 50 + all milestones by default.

**Q: Do versions take up a lot of space?**
A: Each version stores complete note state. For typical notes, 50 versions ≈ 1-5 MB.

**Q: Can I disable automatic versioning?**
A: Not yet, but coming in future update. You can delete unwanted versions.

**Q: Are versions synced to cloud?**
A: Currently stored in browser localStorage. Cloud sync coming soon.

**Q: Can I compare versions from different notes?**
A: Not yet, but planned for future release.

**Q: What happens if I clear browser data?**
A: All versions are lost. Export feature coming soon for backups.

**Q: Can I restore to a version from weeks ago?**
A: Yes! All versions are preserved (up to retention limit).

**Q: Do versions include images and attachments?**
A: Yes, complete note state including blocks is saved.

## Support

For issues or feature requests:
1. Check this guide first
2. Review implementation documentation
3. Test in browser console
4. Report bugs with reproduction steps

## Version History of This Guide

- **v1.0** (2026-05-06): Initial guide with note switching feature
- **v0.9** (2026-05-06): Git-style version tree implementation
- **v0.8** (2026-05-06): Session-based automatic versioning
- **v0.7** (2026-05-06): Note-level versioning (refactored from notebook-level)
