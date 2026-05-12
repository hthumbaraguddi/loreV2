# 🤖 Guide for AI Agents: Documentation Update Protocol

**Purpose:** This document tells AI agents which files to update when completing implementation tasks.

**Last Updated:** May 13, 2026

---

## 📋 PRIMARY FILES TO UPDATE (ALWAYS)

When you complete ANY implementation task, you MUST update these two files:

### 1. `CURRENT_STATUS.md` ⭐ PRIMARY STATUS FILE
**Location:** `/ProgressRecorder/CURRENT_STATUS.md`

**When to Update:** After completing ANY feature, service, or component

**What to Update:**
- Phase completion percentages
- "What's Working" sections
- "Pending" sections
- Code statistics (component count, service count, lines of code)
- Build metrics
- Feature completion percentages
- Technical debt section
- Next steps section
- Change log at the bottom

**Example Update:**
```markdown
### Phase 7: AI Features - Part 2 🚧
**Status**: 80% Complete (was 60%)

**What's Working:**
- ✅ AI chat sidebar
- ✅ Inline AI mentions (@) ✅ NEW
- ✅ Context passing from notes

**Pending:**
- ⏳ AI Behaviour settings tab
```

---

### 2. `IMPLEMENTATION_PLAN.md` ⭐ MASTER PLAN FILE
**Location:** `/ProgressRecorder/IMPLEMENTATION_PLAN.md`

**When to Update:** After completing ANY task from the plan

**What to Update:**
- Overall Progress Summary (phase completion status)
- Key Achievements list
- Task checkboxes `[ ]` → `[x]`
- Phase status (⏳ → 🚧 → ✅)
- Deliverable status

**Example Update:**
```markdown
## Phase 7: AI Features - Part 2 (Week 7) 🚧 IN PROGRESS
### Tasks:
2. **Inline AI Mentions**
   - [x] Implement `@mention` trigger detection ✅ COMPLETED
   - [x] Create AI model picker dropdown ✅ COMPLETED
   - [x] Add inline response rendering ✅ COMPLETED
   - [x] Implement context passing (note content) ✅ COMPLETED
```

---

## 📄 SECONDARY FILES TO UPDATE (WHEN APPLICABLE)

### 3. Phase-Specific Completion Documents
**Location:** `/ProgressRecorder/PHASE_X_*.md`

**When to Update:** When you complete an ENTIRE phase

**Create New File:** `PHASE_X_[FEATURE_NAME]_COMPLETE.md`

**Template:**
```markdown
# Phase X: [Feature Name] - Implementation Complete

**Date:** [Current Date]
**Status:** ✅ Complete
**Build Status:** ✅ Passing (no errors)

## Overview
[Brief description of what was implemented]

## What Was Implemented
[Detailed list of features, services, components]

## Files Created/Modified
[List all files with line counts]

## Testing Checklist
[Manual testing steps]

## Known Limitations
[Any limitations or pending items]

## Next Steps
[What comes next]
```

**Examples:**
- `PHASE_6_AI_INTEGRATION_PART_1.md`
- `PHASE_7_AI_FEATURES_PART_2_COMPLETE.md`

---

### 4. Feature-Specific Documentation
**Location:** `/DataModel/` or `/ProgressRecorder/`

**When to Update:** When implementing a major feature (versioning, comments, etc.)

**Create Files Like:**
- `[feature-name]-implementation-summary.md`
- `[feature-name]-user-guide.md`
- `[feature-name]-brainstorm.md`

**Examples:**
- `notebook-versioning-implementation-summary.md`
- `session-based-versioning-summary.md`
- `version-tree-implementation-summary.md`

---

## 🔄 UPDATE WORKFLOW FOR AI AGENTS

### When You Complete a Task:

```
1. ✅ Update CURRENT_STATUS.md
   - Change phase percentage
   - Add to "What's Working"
   - Remove from "Pending"
   - Update metrics
   - Add to change log

2. ✅ Update IMPLEMENTATION_PLAN.md
   - Check off completed tasks [x]
   - Update phase status if needed
   - Update "Key Achievements"

3. ✅ (Optional) Create phase completion doc
   - Only if entire phase is done
   - Use template above

4. ✅ (Optional) Create feature documentation
   - Only for major features
   - Implementation summary
   - User guide if needed
```

---

## 📊 METRICS TO TRACK

When updating `CURRENT_STATUS.md`, always update these metrics:

### Code Statistics
```markdown
- **Total Components**: [count]
- **Total Services**: [count]
- **Total Models**: [count]
- **Lines of Code**: ~[count]
- **TypeScript Errors**: 0 (strict mode)
```

**How to Count:**
```bash
# Components
find src/app -name "*.component.ts" | wc -l

# Services
find src/app -name "*.service.ts" | grep -v spec | wc -l

# Models
find src/app -name "*.model.ts" | wc -l

# Lines of code (approximate)
find src/app -name "*.ts" | xargs wc -l | tail -1
```

### Build Metrics
```markdown
- **Bundle Size**: [size] kB ([gzipped] kB gzipped)
- **Build Time**: ~[seconds] seconds
```

**How to Get:**
```bash
npm run build
# Look at the output for bundle size and build time
```

### Feature Completion
```markdown
- **Phase 1-X**: 100% ✅
- **Phase Y**: [percentage]% 🚧
- **Overall**: ~[percentage]% complete
```

**How to Calculate:**
- Count completed phases / total phases (16)
- Add partial completion of in-progress phases
- Example: 6 complete + 0.6 (Phase 7) + 0.75 (Phase 12) = 7.35 / 16 = 45.9%

---

## 🎯 PHASE STATUS INDICATORS

Use these consistently:

| Status | Symbol | When to Use |
|--------|--------|-------------|
| **Complete** | ✅ | 100% of phase tasks done |
| **In Progress** | 🚧 | 1-99% of phase tasks done |
| **Not Started** | ⏳ | 0% of phase tasks done |

---

## 📝 CHANGE LOG FORMAT

Always add an entry to the change log in `CURRENT_STATUS.md`:

```markdown
## 📝 Change Log

### [Current Date]
- [Brief description of what was completed]
- Updated [phase name] from X% to Y%
- Added [new feature/service/component]
- Marked [task] as complete
- Updated metrics: [what changed]

### [Previous Date]
- [Previous changes]
```

---

## 🚨 CRITICAL RULES FOR AI AGENTS

### DO:
✅ **ALWAYS** update `CURRENT_STATUS.md` after completing a task
✅ **ALWAYS** update `IMPLEMENTATION_PLAN.md` after completing a task
✅ **ALWAYS** add a change log entry with the current date
✅ **ALWAYS** update metrics (component count, service count, etc.)
✅ **ALWAYS** verify your changes don't conflict with existing content
✅ **ALWAYS** use the correct phase status symbols (✅ 🚧 ⏳)

### DON'T:
❌ **NEVER** leave outdated percentages
❌ **NEVER** forget to update the "Last Updated" date
❌ **NEVER** mark a phase as complete if tests are missing
❌ **NEVER** skip updating metrics
❌ **NEVER** create duplicate entries in the change log

---

## 🔍 VERIFICATION CHECKLIST

Before finishing your task, verify:

- [ ] `CURRENT_STATUS.md` updated with new completion percentage
- [ ] `IMPLEMENTATION_PLAN.md` tasks checked off
- [ ] Metrics updated (component count, service count, LOC)
- [ ] Change log entry added with current date
- [ ] Phase status symbol correct (✅ 🚧 ⏳)
- [ ] "What's Working" section updated
- [ ] "Pending" section updated
- [ ] Build metrics updated if bundle size changed
- [ ] No conflicting information between files

---

## 📂 FILE STRUCTURE REFERENCE

```
loreV2/
├── ProgressRecorder/
│   ├── README_FOR_AI_AGENTS.md ⭐ THIS FILE
│   ├── CURRENT_STATUS.md ⭐ PRIMARY - UPDATE ALWAYS
│   ├── IMPLEMENTATION_PLAN.md ⭐ PRIMARY - UPDATE ALWAYS
│   ├── PHASE_1_COMPLETE.md
│   ├── PHASE_2_COMPLETE.md
│   ├── PHASE_6_AI_INTEGRATION_PART_1.md
│   ├── STATUS_UPDATE_MAY_13_2026.md
│   ├── PHASE_6_VERIFICATION_GUIDE.md
│   └── [other phase completion docs]
├── DataModel/
│   ├── notebook-versioning-brainstorm.md
│   ├── notebook-versioning-implementation-summary.md
│   ├── session-based-versioning-summary.md
│   └── [other feature docs]
└── lore-app/
    └── src/app/
        └── [implementation code]
```

---

## 💡 EXAMPLES

### Example 1: Completing a Small Task

**Task:** Implemented inline AI mentions (@)

**Updates Required:**

1. **CURRENT_STATUS.md:**
```markdown
### Phase 7: AI Features - Part 2 🚧
**Status**: 80% Complete (was 60%)

**What's Working:**
- ✅ AI chat sidebar
- ✅ Inline AI mentions (@) ✅ NEW
```

2. **IMPLEMENTATION_PLAN.md:**
```markdown
2. **Inline AI Mentions**
   - [x] Implement `@mention` trigger detection
   - [x] Create AI model picker dropdown
   - [x] Add inline response rendering
```

3. **Change Log:**
```markdown
### May 13, 2026
- Implemented inline AI mentions (@) feature
- Updated Phase 7 from 60% to 80%
- Added mention trigger detection component
```

---

### Example 2: Completing an Entire Phase

**Task:** Completed Phase 7

**Updates Required:**

1. **CURRENT_STATUS.md:**
```markdown
## ✅ Completed Phases (7/16)

### Phase 7: AI Features - Part 2 ✅
**Status**: 100% Complete
```

2. **IMPLEMENTATION_PLAN.md:**
```markdown
- ✅ **Phase 7**: AI Features Part 2 - **COMPLETE**
```

3. **Create New File:** `PHASE_7_AI_FEATURES_PART_2_COMPLETE.md`

4. **Update Metrics:**
```markdown
### Feature Completion
- **Phase 1-7**: 100% ✅
- **Overall**: ~48% complete
```

---

## 🎓 QUICK REFERENCE CARD

```
┌─────────────────────────────────────────────────────────┐
│  AFTER COMPLETING ANY TASK, UPDATE:                     │
├─────────────────────────────────────────────────────────┤
│  1. ⭐ CURRENT_STATUS.md                                │
│     - Phase percentage                                  │
│     - What's Working section                            │
│     - Metrics                                           │
│     - Change log                                        │
│                                                         │
│  2. ⭐ IMPLEMENTATION_PLAN.md                           │
│     - Task checkboxes [x]                               │
│     - Phase status                                      │
│     - Key Achievements                                  │
│                                                         │
│  3. (Optional) Create phase completion doc              │
│     - Only if entire phase done                         │
│                                                         │
│  4. (Optional) Create feature documentation             │
│     - Only for major features                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🤝 COORDINATION BETWEEN AI AGENTS

If multiple AI agents are working on the project:

1. **Always read** `CURRENT_STATUS.md` first to see what's already done
2. **Check** `IMPLEMENTATION_PLAN.md` to see what tasks are available
3. **Update** both files immediately after completing your task
4. **Add** a change log entry with your specific changes
5. **Verify** no conflicts with other agents' updates

---

## 📞 QUESTIONS?

If you're unsure about:
- **What percentage to use?** → Count completed tasks / total tasks in that phase
- **Which phase a task belongs to?** → Check `IMPLEMENTATION_PLAN.md`
- **Whether to create a new doc?** → Only for complete phases or major features
- **How to count metrics?** → Use the bash commands in "Metrics to Track" section

---

**Remember:** Keeping documentation updated is as important as writing code!

**Status:** 🟢 Active  
**Maintained By:** All AI Agents  
**Last Updated:** May 13, 2026
