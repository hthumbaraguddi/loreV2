# 🤖 AI Agent Quick Guide

**One-page reference for updating documentation**

---

## ⚡ AFTER COMPLETING ANY TASK

### Step 1: Update `CURRENT_STATUS.md`
```markdown
### Phase X: [Name] 🚧
**Status**: [NEW %] Complete (was [OLD %])

**What's Working:**
- ✅ [Existing items]
- ✅ [Your new feature] ✅ NEW

**Pending:**
- ⏳ [Remove completed items]
```

### Step 2: Update `IMPLEMENTATION_PLAN.md`
```markdown
## Phase X: [Name] (Week X) 🚧 IN PROGRESS

### Tasks:
- [x] [Your completed task] ✅ COMPLETED
```

### Step 3: Update Metrics in `CURRENT_STATUS.md`
```markdown
### Code Statistics
- **Total Components**: [NEW COUNT]
- **Total Services**: [NEW COUNT]
- **Lines of Code**: ~[NEW COUNT]
```

### Step 4: Add Change Log Entry
```markdown
### May 13, 2026
- Implemented [feature name]
- Updated Phase X from Y% to Z%
- Added [component/service name]
```

---

## 📊 HOW TO CALCULATE PERCENTAGES

**Phase Completion:**
```
Completed Tasks / Total Tasks × 100 = Phase %
```

**Overall Completion:**
```
(Completed Phases + Partial Phases) / 16 × 100 = Overall %
```

**Example:**
- 6 complete phases = 6.0
- Phase 7 at 60% = 0.6
- Phase 12 at 75% = 0.75
- Total: 7.35 / 16 = 45.9%

---

## 🔢 HOW TO COUNT METRICS

### Component Count
```bash
find lore-app/src/app -name "*.component.ts" | wc -l
```

### Service Count
```bash
find lore-app/src/app -name "*.service.ts" | grep -v spec | wc -l
```

### Lines of Code
```bash
find lore-app/src/app -name "*.ts" | xargs wc -l | tail -1
```

---

## ✅ VERIFICATION CHECKLIST

Before finishing:
- [ ] `CURRENT_STATUS.md` updated
- [ ] `IMPLEMENTATION_PLAN.md` updated
- [ ] Metrics updated
- [ ] Change log entry added
- [ ] Percentages accurate
- [ ] "Last Updated" date changed

---

## 🎯 PHASE STATUS SYMBOLS

| Symbol | Meaning | When to Use |
|--------|---------|-------------|
| ✅ | Complete | 100% done |
| 🚧 | In Progress | 1-99% done |
| ⏳ | Not Started | 0% done |

---

## 🚨 COMMON MISTAKES

❌ Forgetting to update percentages  
❌ Not adding change log entry  
❌ Leaving outdated "Pending" items  
❌ Not updating metrics  
❌ Marking phase complete when tests missing  

---

## 📂 FILE LOCATIONS

```
/ProgressRecorder/
├── CURRENT_STATUS.md ⭐ UPDATE THIS
├── IMPLEMENTATION_PLAN.md ⭐ UPDATE THIS
├── README_FOR_AI_AGENTS.md (Full guide)
└── UPDATE_CHECKLIST.md (Detailed checklist)
```

---

## 💡 QUICK TIPS

- **Always** update both primary files
- **Always** add a change log entry
- **Always** update metrics
- **Never** skip documentation updates
- **Verify** your changes don't conflict

---

**Need more details?** See `README_FOR_AI_AGENTS.md`  
**Need a checklist?** See `UPDATE_CHECKLIST.md`  
**Need navigation?** See `INDEX.md`
