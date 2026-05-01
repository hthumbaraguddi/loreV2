# Lore Storage Strategy

## Overview

Lore implements a three-tier storage architecture to accommodate different user needs, from privacy-focused local-only storage to cloud-synced solutions.

## Storage Tiers

### Tier 1: Local-Only Storage (Free, Unlimited)
- **Target Users**: Privacy-focused, offline workers, no sync needed
- **Storage**: IndexedDB + File System Access API
- **Cost**: Free
- **Capacity**: Unlimited (limited by disk space)

### Tier 2: GitHub Storage (Free for GitHub Users)
- **Target Users**: Developers, tech-savvy users
- **Storage**: GitHub repository + IndexedDB cache
- **Cost**: Free
- **Capacity**: Unlimited

### Tier 3: Cloud Database ($3/month, 1GB)
- **Target Users**: Non-technical users wanting easy sync
- **Storage**: Supabase/Firebase + IndexedDB cache
- **Cost**: $3/month
- **Capacity**: 1GB

## Architecture Details

### Local Storage Architecture

```
Application Layer
       ↓
IndexedDB (Primary Storage)
       ↓
File System Access API (Export/Backup)
```

#### IndexedDB Schema

**Database Name**: `lore-local`
**Version**: 3

**Object Stores**:

1. **meta** - Application metadata
   - keyPath: `key`
   - Stores: app version, schema version, sync config, counts

2. **tags** - Global tag definitions
   - keyPath: `id`
   - Stores: tag id, name, color

3. **shelves** - Top-level containers
   - keyPath: `id`
   - indexes: `order`, `updatedAt`
   - Stores: shelf metadata

4. **notebooks** - Mid-level containers
   - keyPath: `id`
   - indexes: `shelfId`, `order`, `isPinned`, `updatedAt`
   - Stores: notebook metadata

5. **notes** - Note metadata
   - keyPath: `id`
   - indexes: `notebookId`, `isFavorite`, `isPinned`, `isArchived`, `updatedAt`
   - Stores: note metadata (without content)

6. **noteContent** - Note markdown content
   - keyPath: `noteId`
   - Stores: markdown content separately for performance

7. **noteMeta** - Note metadata extensions
   - keyPath: `noteId`
   - Stores: revisions, attachments, checksums, sync info

8. **searchIndex** - Full-text search index
   - keyPath: `id`
   - Stores: tokenized content for fast search

#### Auto-Sync to File System

**Sync Interval**: Every 1-5 minutes (configurable)

**Sync Strategy**:
```typescript
class FileSystemSyncService {
  private syncInterval: number = 300000; // 5 minutes default
  private dirHandle: FileSystemDirectoryHandle | null = null;
  private isDirty: boolean = false;
  
  async enableAutoSync() {
    // Request directory access
    this.dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite'
    });
    
    // Start sync timer
    setInterval(() => this.syncIfDirty(), this.syncInterval);
  }
  
  async syncIfDirty() {
    if (!this.isDirty || !this.dirHandle) return;
    
    await this.syncToFileSystem();
    this.isDirty = false;
  }
  
  async syncToFileSystem() {
    // 1. Export _meta.json
    await this.writeFile('_meta.json', await this.buildMetaJson());
    
    // 2. Export tags.json
    await this.writeFile('tags.json', await this.getTagsJson());
    
    // 3. Export shelves
    const shelves = await db.shelves.getAll();
    for (const shelf of shelves) {
      await this.syncShelf(shelf);
    }
  }
  
  async syncShelf(shelf: Shelf) {
    const shelfDir = await this.dirHandle.getDirectoryHandle(
      `shelves/${shelf.slug}`,
      { create: true }
    );
    
    // Write shelf.json
    await this.writeFileInDir(shelfDir, 'shelf.json', shelf);
    
    // Sync notebooks
    const notebooks = await db.notebooks.getByShelfId(shelf.id);
    const notebooksDir = await shelfDir.getDirectoryHandle('notebooks', { create: true });
    
    for (const notebook of notebooks) {
      await this.syncNotebook(notebooksDir, notebook);
    }
  }
  
  async syncNotebook(parentDir: FileSystemDirectoryHandle, notebook: Notebook) {
    const notebookDir = await parentDir.getDirectoryHandle(
      notebook.slug,
      { create: true }
    );
    
    // Write notebook.json
    await this.writeFileInDir(notebookDir, 'notebook.json', notebook);
    
    // Sync notes
    const notes = await db.notes.getByNotebookId(notebook.id);
    const notesDir = await notebookDir.getDirectoryHandle('notes', { create: true });
    
    for (const note of notes) {
      await this.syncNote(notesDir, note);
    }
  }
  
  async syncNote(parentDir: FileSystemDirectoryHandle, note: Note) {
    // Get note content
    const content = await db.noteContent.get(note.id);
    const meta = await db.noteMeta.get(note.id);
    
    // Build markdown with frontmatter
    const markdown = this.buildMarkdownWithFrontmatter(note, content.markdown);
    
    // Write note.md
    await this.writeFileInDir(parentDir, `${note.slug}.md`, markdown);
    
    // Write note.meta.json
    await this.writeFileInDir(parentDir, `${note.slug}.meta.json`, meta);
  }
  
  private buildMarkdownWithFrontmatter(note: Note, content: string): string {
    return `---
id: ${note.id}
notebookId: ${note.notebookId}
templateId: ${note.templateId || 'null'}
title: ${note.title}
tags: [${note.tags.join(', ')}]
wordCount: ${note.wordCount}
isFavorite: ${note.isFavorite}
isPinned: ${note.isPinned}
isArchived: ${note.isArchived}
createdAt: ${note.createdAt}
updatedAt: ${note.updatedAt}
---

${content}`;
  }
  
  private async writeFileInDir(
    dirHandle: FileSystemDirectoryHandle,
    fileName: string,
    content: any
  ) {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    
    const data = typeof content === 'string' 
      ? content 
      : JSON.stringify(content, null, 2);
    
    await writable.write(data);
    await writable.close();
  }
  
  markDirty() {
    this.isDirty = true;
  }
}
```

**Change Detection**:
```typescript
// Mark dirty on any data change
class StorageService {
  constructor(private syncService: FileSystemSyncService) {}
  
  async createNote(note: Note, content: string) {
    await db.notes.add(note);
    await db.noteContent.add({ noteId: note.id, markdown: content });
    
    // Mark for sync
    this.syncService.markDirty();
  }
  
  async updateNote(id: string, updates: Partial<Note>, content?: string) {
    await db.notes.update(id, updates);
    
    if (content) {
      await db.noteContent.update(id, { markdown: content });
    }
    
    // Mark for sync
    this.syncService.markDirty();
  }
}
```

### GitHub Storage Architecture

```
Application Layer
       ↓
IndexedDB (Local Cache)
       ↓
Sync Queue
       ↓
GitHub API (Remote Storage)
```

#### GitHub Repository Structure

```
lore-workspace/
├── _meta.json
├── tags.json
└── shelves/
    ├── work-projects/
    │   ├── shelf.json
    │   └── notebooks/
    │       └── sap-btp-migration/
    │           ├── notebook.json
    │           └── notes/
    │               ├── integration-strategy.md
    │               └── integration-strategy.meta.json
    └── personal/
        └── ...
```

#### Sync Strategy

**Push Strategy**: Incremental sync every 1-5 minutes

```typescript
class GitHubSyncService {
  private syncQueue: SyncQueue;
  private syncInterval: number = 300000; // 5 minutes
  
  async init(token: string) {
    this.octokit = new Octokit({ auth: token });
    
    // Start sync timer
    setInterval(() => this.processSyncQueue(), this.syncInterval);
  }
  
  async processSyncQueue() {
    const batch = await this.syncQueue.getBatch(10);
    
    for (const item of batch) {
      try {
        await this.syncItem(item);
        await this.syncQueue.markComplete(item.id);
      } catch (error) {
        await this.syncQueue.markFailed(item.id, error);
      }
    }
  }
  
  async syncItem(item: SyncQueueItem) {
    // Get current file SHA
    let currentSha: string | null = null;
    
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: item.path
      });
      currentSha = data.sha;
    } catch (error) {
      // File doesn't exist yet
    }
    
    // Create or update file
    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: item.path,
      message: `Update: ${item.path}`,
      content: btoa(item.content),
      sha: currentSha
    });
  }
}
```

**Pull Strategy**: Check for remote changes on app start and periodically

```typescript
async pullChanges() {
  const lastSync = await this.getLastSyncTimestamp();
  
  // Get commits since last sync
  const commits = await this.octokit.repos.listCommits({
    owner: this.owner,
    repo: this.repo,
    since: lastSync
  });
  
  // Download changed files
  for (const commit of commits) {
    const files = await this.getCommitFiles(commit.sha);
    
    for (const file of files) {
      await this.applyRemoteChange(file);
    }
  }
  
  await this.setLastSyncTimestamp(new Date().toISOString());
}
```

**Conflict Resolution**:
```typescript
async handleConflict(localChange: Change, remoteFile: GitHubFile) {
  const remoteContent = atob(remoteFile.content);
  const localNote = this.parseMarkdown(localChange.content);
  const remoteNote = this.parseMarkdown(remoteContent);
  
  if (remoteNote.updatedAt > localNote.updatedAt) {
    // Show conflict dialog
    const choice = await this.showConflictDialog({
      local: localNote,
      remote: remoteNote
    });
    
    if (choice === 'use-remote') {
      await this.applyRemoteChange(remoteFile);
    } else if (choice === 'keep-local') {
      await this.forcePush(localChange);
    }
  } else {
    // Local is newer - force push
    await this.forcePush(localChange);
  }
}
```

### Cloud Database Architecture (Supabase)

```
Application Layer
       ↓
IndexedDB (Local Cache)
       ↓
Real-time Sync
       ↓
Supabase (PostgreSQL + Storage)
```

#### Database Schema

**Tables**:

1. **users**
   - id (uuid, primary key)
   - email (text)
   - plan ('free' | 'cloud')
   - storage_used (bigint)
   - storage_limit (bigint)
   - created_at (timestamp)

2. **shelves**
   - id (text, primary key)
   - user_id (uuid, foreign key)
   - name (text)
   - description (text)
   - icon (text)
   - color (text)
   - order (integer)
   - created_at (timestamp)
   - updated_at (timestamp)
   - deleted_at (timestamp, nullable)

3. **notebooks**
   - id (text, primary key)
   - user_id (uuid, foreign key)
   - shelf_id (text, foreign key)
   - name (text)
   - description (text)
   - icon (text)
   - color (text)
   - cover_image (text, nullable)
   - order (integer)
   - is_pinned (boolean)
   - note_count (integer)
   - created_at (timestamp)
   - updated_at (timestamp)
   - deleted_at (timestamp, nullable)

4. **notes**
   - id (text, primary key)
   - user_id (uuid, foreign key)
   - notebook_id (text, foreign key)
   - template_id (text, nullable)
   - title (text)
   - tags (text[])
   - word_count (integer)
   - is_favorite (boolean)
   - is_pinned (boolean)
   - is_archived (boolean)
   - created_at (timestamp)
   - updated_at (timestamp)
   - deleted_at (timestamp, nullable)

5. **note_content**
   - note_id (text, primary key, foreign key)
   - markdown (text)
   - updated_at (timestamp)

6. **note_meta**
   - note_id (text, primary key, foreign key)
   - checksum (text)
   - attachments (jsonb)
   - revisions (jsonb)
   - ai_generated (boolean)
   - last_synced_at (timestamp)

7. **tags**
   - id (text, primary key)
   - user_id (uuid, foreign key)
   - name (text)
   - color (text)

#### Real-time Sync

```typescript
class SupabaseSyncService {
  private supabase: SupabaseClient;
  
  async init(userId: string) {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.setupRealtimeSync();
  }
  
  setupRealtimeSync() {
    // Listen for remote changes
    this.supabase
      .channel('notes-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        (payload) => this.handleRemoteNoteChange(payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'note_content' },
        (payload) => this.handleRemoteContentChange(payload)
      )
      .subscribe();
  }
  
  async handleRemoteNoteChange(payload: any) {
    const note = payload.new;
    
    // Check if local version is newer
    const localNote = await db.notes.get(note.id);
    
    if (!localNote || new Date(note.updated_at) > new Date(localNote.updatedAt)) {
      // Apply remote change
      await db.notes.put(this.mapToLocalNote(note));
      
      // Notify UI
      this.notifyNoteUpdated(note.id);
    }
  }
  
  async saveNote(note: Note, content: string) {
    // 1. Save to local cache first (optimistic update)
    await db.notes.put(note);
    await db.noteContent.put({ noteId: note.id, markdown: content });
    
    // 2. Sync to Supabase
    await this.supabase.from('notes').upsert(this.mapToRemoteNote(note));
    await this.supabase.from('note_content').upsert({
      note_id: note.id,
      markdown: content,
      updated_at: new Date().toISOString()
    });
  }
}
```

## Bulk Import Strategy

### Import Wizard Flow

```
1. Select Source
   ├── Local Folder
   ├── ZIP File
   ├── GitHub Repository
   └── Notion Export

2. Analyze Files
   ├── Count files
   ├── Calculate total size
   ├── Detect structure
   └── Suggest organization

3. Preview Organization
   ├── Show suggested shelves/notebooks
   ├── Allow manual adjustment
   └── Confirm import

4. Execute Import
   ├── Create shelves/notebooks
   ├── Import notes
   ├── Update counts
   └── Show completion summary
```

### Import Strategies

#### Strategy 1: Preserve Folder Structure

```typescript
async importFromFolder(dirHandle: FileSystemDirectoryHandle) {
  const structure = await this.analyzeFolderStructure(dirHandle);
  
  // Map folders to shelves/notebooks
  for (const folder of structure.topLevel) {
    const shelf = await this.createShelf({
      name: folder.name,
      description: `Imported from ${folder.path}`
    });
    
    for (const subfolder of folder.subfolders) {
      const notebook = await this.createNotebook({
        shelfId: shelf.id,
        name: subfolder.name
      });
      
      for (const file of subfolder.files) {
        await this.importFile(file, notebook.id);
      }
    }
  }
}
```

#### Strategy 2: Single Notebook Import

```typescript
async importToSingleNotebook(files: File[]) {
  // Create "Imported" shelf if doesn't exist
  let shelf = await db.shelves.getByName('Imported');
  if (!shelf) {
    shelf = await this.createShelf({ name: 'Imported' });
  }
  
  // Create "Unsorted" notebook
  const notebook = await this.createNotebook({
    shelfId: shelf.id,
    name: 'Unsorted',
    description: `${files.length} imported notes`
  });
  
  // Import all files
  for (const file of files) {
    await this.importFile(file, notebook.id);
  }
  
  return { shelf, notebook, count: files.length };
}
```

#### Strategy 3: AI-Assisted Organization

```typescript
async smartImport(files: File[]) {
  // Analyze content
  const previews = await Promise.all(
    files.map(async f => ({
      name: f.name,
      preview: (await f.text()).slice(0, 500),
      size: f.size
    }))
  );
  
  // Call AI to suggest organization
  const suggestions = await this.ai.suggestOrganization(previews);
  
  // Show preview to user
  return {
    shelves: suggestions.shelves,
    confidence: suggestions.confidence
  };
}
```

## Performance Optimizations

### 1. Lazy Loading
- Load note content only when opened
- Virtual scrolling for large notebooks

### 2. Debounced Saves
- Auto-save after 500ms of inactivity
- Batch multiple changes

### 3. Search Index
- Pre-compute on note save
- Store tokenized content

### 4. Caching
- Cache frequently accessed notes
- LRU eviction policy

## Storage Tier Comparison

| Feature | Local Only | GitHub | Cloud DB |
|---------|-----------|--------|----------|
| Cost | Free | Free | $3/mo |
| Storage | Unlimited | Unlimited | 1GB |
| Sync | File System | Git | Real-time |
| Backup | Manual | Auto | Auto |
| Version History | ❌ | ✅ | Limited |
| Collaboration | ❌ | ✅ | ✅ |
| Offline | ✅ | ✅ | ✅ |
| Privacy | 100% | GitHub | Provider |
| Setup | None | GitHub account | Email |
| Tech Level | Any | Developer | Any |

## Migration Path

### Phase 1: Local-Only (MVP)
- IndexedDB storage
- File System Access API export
- Auto-sync to local folder (1-5 min)

### Phase 2: GitHub Sync
- GitHub OAuth integration
- Repository creation/connection
- Incremental sync
- Conflict resolution

### Phase 3: Cloud Database
- Supabase integration
- Real-time sync
- Paid tier ($3/mo)
- Storage quota management

## Future: Attachment Support

### Local Tier
- Store in IndexedDB as blobs (up to 50MB per file)
- Or reference file:// URLs

### GitHub Tier
- Use Git LFS (Large File Storage)
- Free: 1GB storage + 1GB bandwidth/month

### Cloud Tier
- Supabase Storage
- 1GB included in $3 plan
- CDN delivery
