# Notebook Versioning - Feature Brainstorming & Design Document

**Date:** May 6, 2026  
**Status:** Brainstorming Phase  
**Project:** Lore Note-Taking Application

---

## 1. Executive Summary

This document explores versioning capabilities for notebooks in the Lore application. Versioning will enable users to track changes, restore previous states, compare versions, and maintain a complete history of their knowledge evolution.

---

## 2. Current State Analysis

### Existing Data Model
- **Hierarchy:** Shelf → Notebook → Note
- **Notebook Properties:** id, shelfId, name, icon, notes[], order, createdAt, updatedAt
- **Note Properties:** id, notebookId, title, type, content, preview, tags, status, blocks[], linkedNoteIds[], createdAt, updatedAt
- **Storage:** LocalStorage-based with ShelfService managing state via Angular signals

### Current Limitations
- No version history tracking
- No ability to restore previous states
- No change tracking or diff visualization
- No branching or forking capabilities
- updatedAt timestamp only shows last modification time

---

## 3. Core Feature Ideas

### 3.1 Automatic Version Snapshots

**Concept:** Automatically create version snapshots at strategic points

**Trigger Options:**
- **Time-based:** Auto-save every N minutes when changes detected
- **Event-based:** On manual save, on note creation/deletion, on major edits
- **Smart triggers:** When content changes exceed threshold (e.g., 10% of content modified)
- **Session-based:** Create snapshot when user closes/reopens notebook
- **Milestone-based:** User manually marks important versions

**Metadata to Capture:**
```typescript
interface NotebookVersion {
  id: string;
  notebookId: string;
  versionNumber: number;
  timestamp: Date;
  trigger: 'auto' | 'manual' | 'milestone';
  label?: string; // User-defined label for milestones
  description?: string; // Optional description
  snapshot: NotebookSnapshot; // Full state at this point
  changesSummary: ChangesSummary; // What changed
  author?: string; // For multi-user scenarios
  tags: string[]; // Version-specific tags
}

interface NotebookSnapshot {
  name: string;
  icon: string;
  notes: Note[]; // Full note array at this version
  order: number;
}

interface ChangesSummary {
  notesAdded: number;
  notesDeleted: number;
  notesModified: number;
  totalChanges: number;
  significantChanges: string[]; // Human-readable descriptions
}
```

**Storage Strategy:**
- Keep last N versions (e.g., 50) in localStorage
- Compress older versions (delta encoding)
- Option to export version history to file
- Cloud sync for premium users

---

### 3.2 Version Timeline & History Browser

**Concept:** Visual timeline to browse and explore version history

**UI Components:**
- **Timeline View:** Horizontal/vertical timeline with version markers
- **Version Cards:** Show timestamp, label, changes summary, preview
- **Quick Preview:** Hover to see snapshot without full restore
- **Search & Filter:** Find versions by date range, label, change type
- **Comparison Mode:** Side-by-side view of two versions

**Features:**
- Scrub through timeline to see notebook evolution
- Visual indicators for milestone versions vs auto-saves
- Color coding by change magnitude (minor/moderate/major)
- Jump to specific dates or version numbers
- Bookmark important versions

---

### 3.3 Restore & Rollback

**Concept:** Restore notebook to any previous version

**Restore Options:**
1. **Full Restore:** Replace current notebook with selected version
2. **Selective Restore:** Cherry-pick specific notes from a version
3. **Merge Restore:** Combine current state with previous version
4. **Preview Before Restore:** See what will change before committing

**Safety Features:**
- Create automatic backup before restore
- Confirmation dialog with change preview
- Undo restore (restore to pre-restore state)
- Restore creates new version (non-destructive)

**Implementation:**
```typescript
interface RestoreOptions {
  versionId: string;
  mode: 'full' | 'selective' | 'merge';
  selectedNoteIds?: string[]; // For selective restore
  createBackup: boolean;
  preserveCurrentNotes: boolean; // For merge mode
}
```

---

### 3.4 Diff & Comparison Tools

**Concept:** Compare any two versions to see what changed

**Comparison Views:**
- **Side-by-Side:** Two versions displayed in parallel
- **Unified Diff:** Single view with additions/deletions highlighted
- **Note-Level Diff:** List of notes added/removed/modified
- **Content-Level Diff:** Character-by-character diff for modified notes
- **Block-Level Diff:** Compare structured blocks within notes

**Visual Indicators:**
- Green: Added content
- Red: Deleted content
- Yellow: Modified content
- Blue: Moved/reordered content

**Export Options:**
- Export diff as markdown
- Export diff as PDF report
- Share comparison link (for collaboration)

---

### 3.5 Version Branching & Forking

**Concept:** Create alternative versions without affecting main timeline

**Use Cases:**
- Experiment with different organizational structures
- Try different note arrangements
- Create "what-if" scenarios
- Maintain multiple perspectives on same topic

**Features:**
- Create branch from any version
- Switch between branches
- Merge branches back to main
- Delete branches
- Branch naming and descriptions

**Data Model:**
```typescript
interface NotebookBranch {
  id: string;
  notebookId: string;
  name: string;
  description?: string;
  parentVersionId: string; // Version where branch started
  createdAt: Date;
  isActive: boolean;
  versions: NotebookVersion[];
}
```

---

### 3.6 Version Annotations & Comments

**Concept:** Add context and notes to specific versions

**Features:**
- Add comments to any version
- Tag versions with labels (e.g., "before-refactor", "milestone-v1")
- Rate versions (star important ones)
- Add rich text descriptions
- Attach external references or links

**Use Cases:**
- Document why changes were made
- Mark decision points
- Add retrospective insights
- Create learning journal alongside version history

---

### 3.7 Change Analytics & Insights

**Concept:** Analyze patterns in notebook evolution

**Metrics to Track:**
- Notes created/deleted over time
- Most edited notes
- Average time between versions
- Growth rate (notes per week/month)
- Activity heatmap (when changes happen)
- Note type distribution over time
- Tag evolution

**Visualizations:**
- Line chart: Notebook size over time
- Bar chart: Changes per version
- Heatmap: Activity by day/hour
- Pie chart: Note types distribution
- Network graph: Note relationships evolution

**Insights:**
- "Your notebook grew 40% this month"
- "Most active editing time: 9-11 AM"
- "Top 5 most revised notes"
- "Longest stable period: 2 weeks"

---

### 3.8 Collaborative Versioning

**Concept:** Track changes in multi-user scenarios

**Features:**
- Author attribution per version
- Conflict resolution for simultaneous edits
- Review and approval workflow
- Comment threads on versions
- Merge requests between users

**Data Model Extensions:**
```typescript
interface CollaborativeVersion extends NotebookVersion {
  authorId: string;
  authorName: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewers: string[];
  comments: VersionComment[];
  mergeConflicts?: MergeConflict[];
}
```

---

### 3.9 Export & Backup

**Concept:** Export version history for archival or migration

**Export Formats:**
- **JSON:** Full version history with all metadata
- **Markdown:** Human-readable version timeline
- **ZIP:** Each version as separate folder
- **Git-style:** Export as git repository with commits
- **PDF Report:** Visual timeline with summaries

**Backup Options:**
- Auto-backup to cloud storage
- Export to external drive
- Email version snapshots
- Sync with version control systems (GitHub, GitLab)

---

### 3.10 Smart Version Compression

**Concept:** Optimize storage by using delta encoding

**Strategies:**
- **Delta Encoding:** Store only differences between versions
- **Deduplication:** Share common notes across versions
- **Compression:** Use gzip/brotli for older versions
- **Pruning:** Auto-delete very old auto-save versions
- **Archival:** Move old versions to separate storage

**Implementation:**
```typescript
interface DeltaVersion {
  id: string;
  baseVersionId: string; // Reference to full snapshot
  delta: NotebookDelta; // Only the changes
  compressed: boolean;
}

interface NotebookDelta {
  notesAdded: Note[];
  notesRemoved: string[]; // IDs only
  notesModified: NotePatch[]; // Partial updates
  metadataChanges: Partial<Notebook>;
}
```

---

## 4. Advanced Features

### 4.1 AI-Powered Version Summaries

**Concept:** Use AI to generate human-readable summaries of changes

**Features:**
- Auto-generate version descriptions
- Summarize key changes in natural language
- Suggest version labels based on content
- Identify significant milestones automatically
- Generate "what changed" reports

**Example Output:**
> "Version 23: Added 3 new research notes on transformer architecture. Reorganized RAG patterns section. Deleted 2 outdated task notes. Major update to 'Attention Mechanisms Survey'."

---

### 4.2 Version-Based Search

**Concept:** Search across all versions, not just current state

**Features:**
- Find when specific content was added/removed
- Search for notes that existed in past versions
- Track when tags were added/removed
- Find versions containing specific keywords
- Time-travel search: "Show me this notebook as it was in March"

---

### 4.3 Automatic Conflict Detection

**Concept:** Detect and warn about potential issues before they happen

**Scenarios:**
- Detect if restoring will delete recent work
- Warn if branching from old version
- Identify conflicting changes in merge
- Suggest resolution strategies

---

### 4.4 Version Templates

**Concept:** Save version states as reusable templates

**Use Cases:**
- Create template from successful notebook structure
- Apply template to new notebooks
- Share templates with other users
- Build library of notebook patterns

---

### 4.5 Scheduled Snapshots

**Concept:** Create versions on a schedule

**Options:**
- Daily snapshots at specific time
- Weekly milestone versions
- Monthly archival versions
- Before/after major events (e.g., project completion)

---

## 5. User Experience Considerations

### 5.1 Discoverability
- Version icon in notebook header
- Subtle indicator showing version count
- Keyboard shortcut for version history (Cmd+H)
- Context menu option "View History"

### 5.2 Performance
- Lazy load version history (don't load all at once)
- Virtualized timeline for large histories
- Background processing for version creation
- Debounce auto-save to avoid too many versions

### 5.3 Accessibility
- Keyboard navigation through timeline
- Screen reader support for version descriptions
- High contrast mode for diff visualization
- Accessible date/time pickers

### 5.4 Mobile Considerations
- Simplified timeline view for small screens
- Swipe gestures for version navigation
- Touch-friendly comparison tools
- Offline version access

---

## 6. Technical Implementation Strategy

### 6.1 Data Model Extensions

```typescript
// Add to Notebook interface
interface Notebook {
  // ... existing fields
  versioningEnabled: boolean;
  currentVersionId: string;
  versionHistory: NotebookVersion[];
  branches?: NotebookBranch[];
}

// New service: VersioningService
@Injectable({ providedIn: 'root' })
export class VersioningService {
  // Version CRUD
  createVersion(notebookId: string, trigger: VersionTrigger): NotebookVersion;
  getVersionHistory(notebookId: string): NotebookVersion[];
  getVersion(versionId: string): NotebookVersion | undefined;
  deleteVersion(versionId: string): boolean;
  
  // Restore operations
  restoreVersion(notebookId: string, versionId: string, options: RestoreOptions): boolean;
  previewRestore(notebookId: string, versionId: string): RestorePreview;
  
  // Comparison
  compareVersions(versionId1: string, versionId2: string): VersionDiff;
  
  // Branching
  createBranch(notebookId: string, name: string, fromVersionId: string): NotebookBranch;
  switchBranch(notebookId: string, branchId: string): boolean;
  mergeBranch(sourceBranchId: string, targetBranchId: string): MergeResult;
  
  // Analytics
  getVersionAnalytics(notebookId: string): VersionAnalytics;
  
  // Export
  exportVersionHistory(notebookId: string, format: ExportFormat): Blob;
}
```

### 6.2 Storage Architecture

**Option 1: LocalStorage with Compression**
- Pros: Simple, no backend needed, works offline
- Cons: Size limits (~5-10MB), no cross-device sync
- Best for: MVP, single-user scenarios

**Option 2: IndexedDB**
- Pros: Larger storage (50MB+), better performance, structured queries
- Cons: More complex API, still local-only
- Best for: Production-ready local versioning

**Option 3: Hybrid (Local + Cloud)**
- Pros: Best of both worlds, cross-device sync, unlimited storage
- Cons: Requires backend, authentication, sync logic
- Best for: Full-featured product

### 6.3 Performance Optimizations

1. **Lazy Loading:** Load versions on-demand
2. **Pagination:** Show 20 versions at a time
3. **Caching:** Cache frequently accessed versions
4. **Web Workers:** Process diffs in background
5. **Virtual Scrolling:** For large timelines
6. **Debouncing:** Limit auto-save frequency

### 6.4 Migration Strategy

```typescript
// Version 1: Add versioning fields to existing notebooks
interface MigrationV1 {
  addVersioningFields(): void;
  createInitialVersion(): void;
  backfillVersionHistory(): void;
}

// Backward compatibility
interface BackwardCompatibility {
  detectOldFormat(): boolean;
  migrateToNewFormat(): void;
  maintainOldFormat(): boolean; // For rollback
}
```

---

## 7. Phased Implementation Plan

### Phase 1: Foundation (MVP)
**Goal:** Basic version history with manual snapshots

**Features:**
- Manual version creation
- Version list view
- Basic restore functionality
- Simple diff view (note-level only)

**Estimated Effort:** 2-3 weeks

---

### Phase 2: Automation
**Goal:** Automatic versioning and smart triggers

**Features:**
- Auto-save versions
- Smart trigger detection
- Version compression
- Timeline visualization

**Estimated Effort:** 2-3 weeks

---

### Phase 3: Advanced Tools
**Goal:** Professional-grade versioning tools

**Features:**
- Branching and merging
- Advanced diff tools (content-level)
- Version annotations
- Export functionality

**Estimated Effort:** 3-4 weeks

---

### Phase 4: Intelligence
**Goal:** AI-powered insights and automation

**Features:**
- AI-generated summaries
- Change analytics
- Smart suggestions
- Version-based search

**Estimated Effort:** 3-4 weeks

---

### Phase 5: Collaboration
**Goal:** Multi-user versioning

**Features:**
- Author attribution
- Review workflows
- Conflict resolution
- Shared version history

**Estimated Effort:** 4-6 weeks

---

## 8. Success Metrics

### User Engagement
- % of users who enable versioning
- Average versions created per notebook
- Version restore usage rate
- Time spent in version history view

### Quality Metrics
- Reduction in accidental data loss
- User satisfaction scores
- Support tickets related to lost data
- Feature adoption rate

### Performance Metrics
- Version creation time < 100ms
- Timeline load time < 500ms
- Diff calculation time < 1s
- Storage efficiency (compression ratio)

---

## 9. Risks & Mitigation

### Risk 1: Storage Limitations
**Impact:** High  
**Probability:** Medium  
**Mitigation:** Implement aggressive compression, pruning strategies, cloud backup option

### Risk 2: Performance Degradation
**Impact:** High  
**Probability:** Medium  
**Mitigation:** Lazy loading, pagination, background processing, performance monitoring

### Risk 3: User Confusion
**Impact:** Medium  
**Probability:** High  
**Mitigation:** Clear UI/UX, onboarding tutorial, contextual help, sensible defaults

### Risk 4: Data Corruption
**Impact:** Critical  
**Probability:** Low  
**Mitigation:** Validation on save, backup before restore, version integrity checks

### Risk 5: Sync Conflicts (Multi-device)
**Impact:** High  
**Probability:** High (if cloud sync enabled)  
**Mitigation:** Conflict detection, resolution UI, last-write-wins with manual override

---

## 10. Open Questions

1. **How many versions should we keep by default?**
   - Option A: Last 50 versions
   - Option B: All versions within 30 days + milestones
   - Option C: User-configurable limit

2. **Should versioning be opt-in or opt-out?**
   - Opt-in: Users explicitly enable it
   - Opt-out: Enabled by default, users can disable
   - Recommendation: Opt-out (better data protection)

3. **How to handle very large notebooks (1000+ notes)?**
   - Limit version history size
   - Compress aggressively
   - Warn users about performance impact

4. **Should we version individual notes or only notebooks?**
   - Notebook-level: Simpler, captures relationships
   - Note-level: More granular, better for large notebooks
   - Both: Maximum flexibility, more complexity
   - Recommendation: Start with notebook-level, add note-level later

5. **Integration with existing sync mechanisms?**
   - How does versioning interact with folder sync?
   - Should versions sync across devices?
   - Conflict resolution strategy?

---

## 11. Competitive Analysis

### Notion
- **Versioning:** Page history with restore
- **Strengths:** Simple, integrated, free for all users
- **Weaknesses:** Limited to 30 days for free users, no branching

### Obsidian
- **Versioning:** Via Git plugin or Sync service
- **Strengths:** Full Git power, unlimited history
- **Weaknesses:** Requires technical knowledge, not built-in

### Roam Research
- **Versioning:** Daily notes capture temporal context
- **Strengths:** Time-based navigation built into core UX
- **Weaknesses:** No explicit version control, hard to restore

### Evernote
- **Versioning:** Note history (premium only)
- **Strengths:** Automatic, reliable
- **Weaknesses:** Premium-only, limited comparison tools

### Our Opportunity
- **Built-in from day one** (not premium-gated)
- **Notebook-level versioning** (captures relationships)
- **AI-powered insights** (unique differentiator)
- **Branch/merge support** (power user feature)

---

## 12. Next Steps

1. **Review & Feedback:** Share with team, gather input
2. **Prioritization:** Rank features by value/effort
3. **Technical Spike:** Prototype storage strategy (IndexedDB vs LocalStorage)
4. **UI Mockups:** Design version timeline and diff views
5. **Implementation:** Start with Phase 1 (MVP)

---

## 13. Appendix: Example User Flows

### Flow 1: Creating a Manual Milestone
1. User clicks version icon in notebook header
2. Modal opens: "Create Version Snapshot"
3. User enters label: "Before major refactor"
4. User adds description (optional)
5. Clicks "Create Snapshot"
6. Success toast: "Version saved"

### Flow 2: Restoring a Previous Version
1. User opens version history
2. Browses timeline, finds desired version
3. Clicks "Preview" to see what will change
4. Reviews diff: 3 notes will be deleted, 2 restored
5. Clicks "Restore"
6. Confirmation: "This will create a backup of current state"
7. Clicks "Confirm"
8. Notebook restored, backup created

### Flow 3: Comparing Two Versions
1. User opens version history
2. Selects version A (March 15)
3. Clicks "Compare with..."
4. Selects version B (April 1)
5. Side-by-side diff view opens
6. User sees: 5 notes added, 2 modified, 1 deleted
7. Clicks on modified note to see content diff
8. Character-level diff highlights changes

---

**Document Version:** 1.0  
**Last Updated:** May 6, 2026  
**Author:** AI Assistant  
**Status:** Ready for Review
