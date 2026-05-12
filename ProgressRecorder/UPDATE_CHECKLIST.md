# ✅ Documentation Update Checklist

**Use this checklist after completing ANY implementation task**

---

## 🎯 MANDATORY UPDATES (Do Every Time)

### 1. Update `CURRENT_STATUS.md`
- [ ] Update phase completion percentage
- [ ] Add completed items to "What's Working" section
- [ ] Remove completed items from "Pending" section
- [ ] Update "Total Components" count
- [ ] Update "Total Services" count
- [ ] Update "Lines of Code" estimate
- [ ] Update "Feature Completion" percentages
- [ ] Add entry to "Change Log" with today's date
- [ ] Update "Last Updated" date at top of file

### 2. Update `IMPLEMENTATION_PLAN.md`
- [ ] Check off completed tasks `[x]`
- [ ] Update phase status (⏳ → 🚧 → ✅)
- [ ] Update "Phase Completion Status" section
- [ ] Add to "Key Achievements" if significant
- [ ] Update "Last Updated" date at top of file

---

## 📋 OPTIONAL UPDATES (When Applicable)

### 3. Create Phase Completion Document (Only if phase 100% done)
- [ ] Create `PHASE_X_[NAME]_COMPLETE.md`
- [ ] Include: Overview, What Was Implemented, Files Created, Testing Checklist
- [ ] Include: Known Limitations, Next Steps

### 4. Create Feature Documentation (Only for major features)
- [ ] Create `[feature-name]-implementation-summary.md`
- [ ] Create `[feature-name]-user-guide.md` if needed
- [ ] Place in `/DataModel/` or `/ProgressRecorder/`

---

## 🔢 METRICS TO UPDATE

### Component Count
```bash
find lore-app/src/app -name "*.component.ts" | wc -l
```
Update in `CURRENT_STATUS.md`: **Total Components**: [count]

### Service Count
```bash
find lore-app/src/app -name "*.service.ts" | grep -v spec | wc -l
```
Update in `CURRENT_STATUS.md`: **Total Services**: [count]

### Build Status
```bash
cd lore-app && npm run build
```
Update in `CURRENT_STATUS.md`: **Bundle Size** and **Build Time**

---

## 📝 CHANGE LOG TEMPLATE

Add this to the bottom of `CURRENT_STATUS.md`:

```markdown
### [Today's Date]
- [Brief description of what was completed]
- Updated [Phase Name] from X% to Y%
- Added [new component/service/feature]
- Marked [specific task] as complete
- Updated metrics: [what changed]
```

---

## ✅ VERIFICATION

Before considering your task complete:

- [ ] Both `CURRENT_STATUS.md` and `IMPLEMENTATION_PLAN.md` updated
- [ ] All percentages are accurate
- [ ] Change log entry added
- [ ] Metrics updated
- [ ] No conflicting information
- [ ] Build still passes (`npm run build`)

---

## 🚨 COMMON MISTAKES TO AVOID

❌ Forgetting to update percentages  
❌ Not adding a change log entry  
❌ Leaving outdated "Pending" items  
❌ Not updating metrics  
❌ Marking phase complete when tests missing  

---

**Quick Tip:** Bookmark this file and check it after every task!
