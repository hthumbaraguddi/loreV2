# Notebook Versioning - Quick Reference Card

## 🚀 Quick Actions

| Action | Steps |
|--------|-------|
| **Open Version History** | Right-click notebook → "Version History" |
| **Quick Snapshot** | Open history → "📸 Quick Snapshot" |
| **Create Milestone** | Open history → "⭐ Create Milestone" → Enter label |
| **Restore Version** | Select version → "↺ Restore" → Review → Confirm |
| **Compare Versions** | "Compare" tab → Select 2 versions |
| **View Analytics** | "Analytics" tab |
| **Delete Version** | Click 🗑️ on version card |

---

## 📊 Version Types

| Badge | Type | Description | Auto-Deleted? |
|-------|------|-------------|---------------|
| 🟡 | **Milestone** | Important labeled versions | ❌ Never |
| 🔵 | **Manual** | Quick snapshots | ✅ After 50 versions |
| ⚫ | **Auto** | Automatic saves | ✅ After 50 versions |
| 🟢 | **Backup** | Pre-restore backups | ✅ After 50 versions |
| 🟣 | **Session** | Session snapshots | ✅ After 50 versions |

---

## 🎯 When to Create Versions

### ✅ Good Times
- Before major reorganization
- After completing a section
- Before trying experimental ideas
- End of work session
- Before sharing with others
- Before deleting multiple notes

### ❌ Bad Times
- After every tiny edit
- Multiple times per minute
- Just for testing

---

## 🔄 Restore Process

```
1. Select version
2. Click "↺ Restore"
3. Review preview:
   ✅ Notes to add
   ✏️ Notes to modify
   ❌ Notes to remove
4. Click "✓ Confirm"
5. Done! (Backup created automatically)
```

---

## 📈 Analytics Metrics

| Metric | What It Shows |
|--------|---------------|
| **Total Versions** | All versions created |
| **Milestones** | Important labeled versions |
| **Notes Added** | Total notes added across all versions |
| **Notes Modified** | Total notes modified |
| **Notes Deleted** | Total notes deleted |
| **Avg Time Between** | Average minutes between versions |
| **Growth Rate** | Notes added per week |
| **Most Active Day** | Day with most version activity |

---

## 🔍 Compare Results

### Summary Stats
- **Added** - New notes in Version 2
- **Modified** - Changed notes
- **Removed** - Deleted notes
- **Unchanged** - Same in both

### Change Badges
- **Title** - Title changed
- **Content** - Content changed
- **Type** - Note type changed
- **Tags** - Tags changed
- **Blocks** - Blocks changed

---

## ⚙️ Default Settings

```typescript
Versioning: Enabled
Auto-save: Enabled (future)
Auto-save interval: 15 minutes
Max versions: 50
Compression: Enabled
Session snapshots: Enabled
```

---

## 💾 Storage Info

- **Location:** Browser localStorage
- **Key:** `notebook_versions`
- **Typical size:** 1-5 MB (50 versions)
- **Limit:** ~5-10 MB (browser dependent)
- **Retention:** Last 50 versions + all milestones

---

## 🛡️ Safety Features

✅ **Automatic backup before restore**  
✅ **Preview changes before committing**  
✅ **Warning messages for deletions**  
✅ **Milestone protection**  
✅ **Undo via backup restore**

---

## 🎨 Visual Indicators

### Change Summary Format
```
+5 ~2 -1
│  │  └─ 1 note deleted
│  └──── 2 notes modified
└─────── 5 notes added
```

### Timestamp Display
- **Just now** - < 1 minute
- **5m ago** - < 1 hour
- **2h ago** - < 24 hours
- **3d ago** - < 7 days
- **Jan 15** - Older

---

## 🔑 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close modal |
| (More coming soon) | |

---

## ⚠️ Important Notes

1. **Milestones are protected** - Cannot be deleted
2. **Backups are automatic** - Created before every restore
3. **50 version limit** - Oldest non-milestones deleted
4. **Local storage only** - No cloud sync yet
5. **Full notebook restore** - Can't restore individual notes yet

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| No history | Create first version |
| Can't delete | Milestones are protected |
| Unexpected preview | Check version number |
| Too many versions | System auto-deletes oldest |
| Changes not saved | Create manual snapshot |

---

## 📝 Naming Best Practices

### ✅ Good Labels
- "Before Refactor"
- "Chapter 3 Complete"
- "Pre-Review Version"
- "Final Draft v1"

### ❌ Poor Labels
- "asdf"
- "test"
- "version"
- "backup"

---

## 🎓 Pro Tips

1. **Preview first** - Always review restore preview
2. **Milestone strategically** - Use for decision points
3. **Compare often** - See impact of changes
4. **Check analytics** - Understand your workflow
5. **Restore to backup** - If restore didn't work

---

## 📞 Need Help?

1. Check User Guide
2. Review Troubleshooting
3. Contact Support

---

## 🔮 Coming Soon

**Phase 2:** Auto-save, Smart triggers  
**Phase 3:** Branching, Selective restore  
**Phase 4:** AI summaries, Version search  
**Phase 5:** Collaboration, Cloud sync

---

**Print this card for quick reference!** 📄

*Quick Reference v1.0 | May 6, 2026*
