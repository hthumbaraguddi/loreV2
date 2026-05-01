# Settings Panel - Sync Configuration

## Overview

The Settings panel provides users with options to configure file syncing with local drive and GitHub. This document specifies the UI/UX design and implementation details.

## Settings Panel Structure

```
Settings
├── General
├── Appearance
├── Sync & Storage ← New Section
├── Editor
└── Advanced
```

## Sync & Storage Section

### Section Layout

```
┌─────────────────────────────────────────────────────────┐
│  Sync & Storage                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Storage Tier                                           │
│  ○ Local Only (Free, Unlimited)                        │
│  ○ GitHub Sync (Free for GitHub users)                 │
│  ○ Cloud Storage ($3/mo, 1GB) [Coming Soon]           │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  [Conditional Content Based on Selection]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Option 1: Local Only

### UI Components

```
┌─────────────────────────────────────────────────────────┐
│  ● Local Only (Free, Unlimited)                        │
│                                                         │
│  Your notes are stored in your browser and optionally  │
│  synced to a local folder on your computer.            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Local Folder Sync                                │ │
│  ├───────────────────────────────────────────────────┤ │
│  │                                                   │ │
│  │  □ Enable auto-sync to local folder              │ │
│  │                                                   │ │
│  │  [Select Folder]  📁 Not configured              │ │
│  │                                                   │ │
│  │  Sync Interval                                    │ │
│  │  ○ 1 minute                                       │ │
│  │  ● 5 minutes (Recommended)                        │ │
│  │  ○ 10 minutes                                     │ │
│  │  ○ Manual only                                    │ │
│  │                                                   │ │
│  │  Last synced: Never                               │ │
│  │                                                   │ │
│  │  [Sync Now]                                       │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Export Options                                   │ │
│  ├───────────────────────────────────────────────────┤ │
│  │                                                   │ │
│  │  [Export to Folder]  [Export as ZIP]             │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### States

#### State 1: Not Configured
```
[Select Folder]  📁 Not configured

□ Enable auto-sync to local folder (disabled/grayed out)
```

#### State 2: Folder Selected, Sync Disabled
```
[Change Folder]  📁 /Users/john/Documents/Lore

□ Enable auto-sync to local folder

[Export to This Folder]
```

#### State 3: Folder Selected, Sync Enabled
```
[Change Folder]  📁 /Users/john/Documents/Lore

☑ Enable auto-sync to local folder

Sync Interval
● 5 minutes (Recommended)

Last synced: 2 minutes ago
Next sync: in 3 minutes

[Sync Now]
```

#### State 4: Syncing in Progress
```
[Change Folder]  📁 /Users/john/Documents/Lore

☑ Enable auto-sync to local folder

Syncing... ⟳ 45% (23/51 files)

[Cancel Sync]
```

#### State 5: Sync Error
```
[Change Folder]  📁 /Users/john/Documents/Lore

☑ Enable auto-sync to local folder

⚠️ Sync failed: Permission denied

Last successful sync: 15 minutes ago

[Retry Now]  [View Details]
```

---

## Option 2: GitHub Sync

### UI Components

```
┌─────────────────────────────────────────────────────────┐
│  ● GitHub Sync (Free for GitHub users)                 │
│                                                         │
│  Your notes are synced to a private GitHub repository  │
│  with full version history.                            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  GitHub Connection                                │ │
│  ├───────────────────────────────────────────────────┤ │
│  │                                                   │ │
│  │  [Sign in with GitHub]                            │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### States

#### State 1: Not Connected
```
┌───────────────────────────────────────────────────┐
│  GitHub Connection                                │
├───────────────────────────────────────────────────┤
│                                                   │
│  Not connected                                    │
│                                                   │
│  [Sign in with GitHub]                            │
│                                                   │
│  Benefits:                                        │
│  ✓ Free unlimited storage                        │
│  ✓ Full version history                          │
│  ✓ Access from any device                        │
│  ✓ Edit in VS Code or any editor                 │
│                                                   │
└───────────────────────────────────────────────────┘
```

#### State 2: Connecting
```
┌───────────────────────────────────────────────────┐
│  GitHub Connection                                │
├───────────────────────────────────────────────────┤
│                                                   │
│  Connecting to GitHub... ⟳                       │
│                                                   │
│  Please complete the authorization in the         │
│  popup window.                                    │
│                                                   │
│  [Cancel]                                         │
│                                                   │
└───────────────────────────────────────────────────┘
```

#### State 3: Repository Selection
```
┌───────────────────────────────────────────────────┐
│  GitHub Connection                                │
├───────────────────────────────────────────────────┤
│                                                   │
│  ✓ Connected as @johnsmith                       │
│                                                   │
│  Repository Setup                                 │
│                                                   │
│  ○ Create new repository                         │
│     Repository name: lore-workspace              │
│     ○ Public  ● Private                          │
│                                                   │
│  ○ Use existing repository                       │
│     [Select Repository ▼]                        │
│                                                   │
│  [Continue]  [Disconnect]                        │
│                                                   │
└───────────────────────────────────────────────────┘
```

#### State 4: Initial Sync Choice
```
┌───────────────────────────────────────────────────┐
│  Initial Sync                                     │
├───────────────────────────────────────────────────┤
│                                                   │
│  Repository: johnsmith/lore-workspace            │
│                                                   │
│  You have 34 notes locally.                      │
│  The repository is empty.                        │
│                                                   │
│  ○ Push local notes to GitHub                    │
│     Upload all 34 notes to the repository        │
│                                                   │
│  ○ Pull notes from GitHub                        │
│     Download notes from repository (0 notes)     │
│                                                   │
│  [Start Sync]  [Cancel]                          │
│                                                   │
└───────────────────────────────────────────────────┘
```

#### State 5: Syncing
```
┌───────────────────────────────────────────────────┐
│  GitHub Sync                                      │
├───────────────────────────────────────────────────┤
│                                                   │
│  Syncing with GitHub... ⟳                        │
│                                                   │
│  Uploading: 23/34 files (68%)                    │
│  ████████████░░░░░░                              │
│                                                   │
│  Current: integration-strategy.md                │
│                                                   │
│  [Cancel]                                         │
│                                                   │
└───────────────────────────────────────────────────┘
```

#### State 6: Connected & Synced
```
┌───────────────────────────────────────────────────┐
│  GitHub Connection                                │
├───────────────────────────────────────────────────┤
│                                                   │
│  ✓ Connected as @johnsmith                       │
│  Repository: johnsmith/lore-workspace            │
│                                                   │
│  ☑ Enable auto-sync                              │
│                                                   │
│  Sync Interval                                    │
│  ○ 1 minute                                       │
│  ● 5 minutes (Recommended)                        │
│  ○ 10 minutes                                     │
│  ○ Manual only                                    │
│                                                   │
│  Status: ✓ All changes synced                    │
│  Last synced: 2 minutes ago                       │
│  Next sync: in 3 minutes                          │
│                                                   │
│  [Sync Now]  [View on GitHub]                    │
│                                                   │
│  [Disconnect]                                     │
│                                                   │
└───────────────────────────────────────────────────┘
```

#### State 7: Pending Changes
```
┌───────────────────────────────────────────────────┐
│  GitHub Sync                                      │
├───────────────────────────────────────────────────┤
│                                                   │
│  ✓ Connected as @johnsmith                       │
│  Repository: johnsmith/lore-workspace            │
│                                                   │
│  Status: 3 changes pending                        │
│  • 2 notes modified                               │
│  • 1 note created                                 │
│                                                   │
│  Last synced: 4 minutes ago                       │
│  Next sync: in 1 minute                           │
│                                                   │
│  [Sync Now]  [View Changes]                      │
│                                                   │
└───────────────────────────────────────────────────┘
```

#### State 8: Conflict Detected
```
┌───────────────────────────────────────────────────┐
│  GitHub Sync                                      │
├───────────────────────────────────────────────────┤
│                                                   │
│  ⚠️ Sync conflict detected                       │
│                                                   │
│  1 note has conflicting changes:                 │
│  • integration-strategy.md                       │
│                                                   │
│  Local version: Updated 5 minutes ago            │
│  Remote version: Updated 3 minutes ago           │
│                                                   │
│  [Resolve Conflicts]                             │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## Conflict Resolution Dialog

```
┌─────────────────────────────────────────────────────────┐
│  Resolve Conflict: integration-strategy.md              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │  Local Version      │  │  Remote Version     │     │
│  ├─────────────────────┤  ├─────────────────────┤     │
│  │                     │  │                     │     │
│  │  Updated:           │  │  Updated:           │     │
│  │  5 minutes ago      │  │  3 minutes ago      │     │
│  │                     │  │                     │     │
│  │  Word count: 312    │  │  Word count: 298    │     │
│  │                     │  │                     │     │
│  │  [Preview]          │  │  [Preview]          │     │
│  │                     │  │                     │     │
│  └─────────────────────┘  └─────────────────────┘     │
│                                                         │
│  Choose resolution:                                     │
│  ○ Keep local version (overwrite remote)               │
│  ○ Use remote version (discard local changes)          │
│  ○ Open side-by-side editor to merge manually          │
│                                                         │
│  [Resolve]  [Cancel]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Folder Selection Flow

### Step 1: Click "Select Folder"
```
Browser shows native folder picker dialog
(File System Access API)
```

### Step 2: Permission Request
```
┌─────────────────────────────────────────────────────────┐
│  Grant Folder Access                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Lore needs permission to read and write files in:     │
│                                                         │
│  📁 /Users/john/Documents/Lore                         │
│                                                         │
│  This allows Lore to:                                   │
│  • Save your notes to this folder                      │
│  • Keep files in sync with your browser                │
│  • Create the folder structure automatically           │
│                                                         │
│  [Allow]  [Deny]                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 3: Folder Structure Check
```
┌─────────────────────────────────────────────────────────┐
│  Folder Setup                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Checking folder: /Users/john/Documents/Lore           │
│                                                         │
│  ○ Folder is empty - will create structure             │
│                                                         │
│  OR                                                     │
│                                                         │
│  ○ Existing Lore workspace detected (34 notes)         │
│    • Import existing notes?                            │
│    • Merge with current notes?                         │
│                                                         │
│  [Continue]  [Cancel]                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 4: Initial Sync Direction
```
┌─────────────────────────────────────────────────────────┐
│  Initial Sync                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  You have 34 notes in browser.                         │
│  The folder has 0 notes.                               │
│                                                         │
│  ○ Export browser notes to folder                      │
│     Copy all 34 notes to the folder                    │
│                                                         │
│  ○ Import folder notes to browser                      │
│     Load notes from folder (0 notes)                   │
│                                                         │
│  ○ Merge both                                          │
│     Combine notes from both locations                  │
│                                                         │
│  [Start]  [Cancel]                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Settings Data Model

```typescript
interface SyncSettings {
  // Storage tier
  tier: 'local' | 'github' | 'cloud';
  
  // Local folder sync
  localSync: {
    enabled: boolean;
    folderHandle: FileSystemDirectoryHandle | null;
    folderPath: string | null;
    syncInterval: 1 | 5 | 10 | 0; // 0 = manual only
    lastSyncedAt: string | null;
    nextSyncAt: string | null;
    autoSyncEnabled: boolean;
  };
  
  // GitHub sync
  githubSync: {
    enabled: boolean;
    connected: boolean;
    username: string | null;
    repository: string | null;
    accessToken: string | null;
    syncInterval: 1 | 5 | 10 | 0;
    lastSyncedAt: string | null;
    nextSyncAt: string | null;
    pendingChanges: number;
    autoSyncEnabled: boolean;
  };
  
  // Cloud sync (future)
  cloudSync: {
    enabled: boolean;
    provider: 'supabase' | 'firebase' | null;
    userId: string | null;
    storageUsed: number;
    storageLimit: number;
  };
}
```

---

## Implementation Notes

### File System Access API

```typescript
class LocalFolderSyncService {
  private dirHandle: FileSystemDirectoryHandle | null = null;
  
  async selectFolder(): Promise<void> {
    try {
      // Request folder access
      this.dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });
      
      // Store handle in IndexedDB (persists across sessions)
      await this.storeFolderHandle(this.dirHandle);
      
      // Check folder contents
      await this.checkFolderContents();
      
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled
        return;
      }
      throw error;
    }
  }
  
  async checkFolderContents(): Promise<FolderStatus> {
    const files = await this.listAllFiles(this.dirHandle);
    
    if (files.length === 0) {
      return { status: 'empty', files: [] };
    }
    
    // Check if it's a Lore workspace
    const hasMetaFile = files.some(f => f.name === '_meta.json');
    
    if (hasMetaFile) {
      return { 
        status: 'lore-workspace', 
        files,
        noteCount: await this.countNotes(files)
      };
    }
    
    return { status: 'has-files', files };
  }
  
  async enableAutoSync(interval: number): Promise<void> {
    // Store settings
    await this.updateSettings({
      localSync: {
        enabled: true,
        autoSyncEnabled: true,
        syncInterval: interval
      }
    });
    
    // Start sync timer
    this.startSyncTimer(interval);
  }
  
  private startSyncTimer(intervalMinutes: number): void {
    if (intervalMinutes === 0) return; // Manual only
    
    const intervalMs = intervalMinutes * 60 * 1000;
    
    this.syncTimer = setInterval(async () => {
      await this.syncToFolder();
    }, intervalMs);
  }
}
```

### GitHub OAuth Flow

```typescript
class GitHubSyncService {
  async signInWithGitHub(): Promise<void> {
    const clientId = environment.githubClientId;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'repo';
    
    // Open OAuth popup
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    
    const popup = window.open(authUrl, 'GitHub Auth', 'width=600,height=800');
    
    // Listen for callback
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'github-auth-success') {
        const code = event.data.code;
        await this.exchangeCodeForToken(code);
        popup?.close();
      }
    });
  }
  
  async exchangeCodeForToken(code: string): Promise<void> {
    // Call your backend to exchange code for token
    const response = await fetch('/api/auth/github/token', {
      method: 'POST',
      body: JSON.stringify({ code }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const { access_token, username } = await response.json();
    
    // Store token securely
    await this.storeAccessToken(access_token);
    
    // Update settings
    await this.updateSettings({
      githubSync: {
        connected: true,
        username,
        accessToken: access_token
      }
    });
    
    // Check for existing repository
    await this.checkRepository();
  }
  
  async checkRepository(): Promise<RepositoryStatus> {
    const repoName = 'lore-workspace';
    
    try {
      const repo = await this.octokit.repos.get({
        owner: this.username,
        repo: repoName
      });
      
      return { exists: true, repo };
      
    } catch (error) {
      if (error.status === 404) {
        return { exists: false };
      }
      throw error;
    }
  }
  
  async createRepository(isPrivate: boolean): Promise<void> {
    await this.octokit.repos.createForAuthenticatedUser({
      name: 'lore-workspace',
      description: 'Lore workspace - personal knowledge base',
      private: isPrivate,
      auto_init: true
    });
  }
}
```

---

## Visual Design Specs

### Colors
- Success: `#10b981` (green)
- Warning: `#f59e0b` (amber)
- Error: `#ef4444` (red)
- Info: `#3b82f6` (blue)
- Syncing: `#8b5cf6` (purple)

### Icons
- Folder: 📁 or `folder` icon
- GitHub: GitHub logo
- Sync: ⟳ (rotating when active)
- Success: ✓
- Warning: ⚠️
- Error: ✕

### Animations
- Sync spinner: Rotate 360deg, 1s linear infinite
- Progress bar: Smooth width transition
- Status changes: Fade in/out 200ms

---

## Error Handling

### Common Errors

1. **Permission Denied**
   ```
   ⚠️ Permission denied
   
   Lore doesn't have permission to access this folder.
   Please select the folder again and grant permission.
   
   [Select Folder Again]
   ```

2. **Folder Not Found**
   ```
   ⚠️ Folder not found
   
   The selected folder no longer exists or has been moved.
   
   [Select New Folder]
   ```

3. **Network Error (GitHub)**
   ```
   ⚠️ Network error
   
   Unable to connect to GitHub. Please check your
   internet connection and try again.
   
   [Retry]  [Work Offline]
   ```

4. **Rate Limit (GitHub)**
   ```
   ⚠️ Rate limit exceeded
   
   GitHub API rate limit reached. Sync will resume
   automatically in 15 minutes.
   
   Next sync: 2:45 PM
   
   [OK]
   ```

5. **Storage Full (Cloud)**
   ```
   ⚠️ Storage limit reached
   
   You've used 1.02 GB of your 1 GB limit.
   
   [Upgrade Plan]  [Manage Storage]
   ```

---

## Accessibility

- All buttons have proper ARIA labels
- Status messages announced to screen readers
- Keyboard navigation support
- Focus indicators on all interactive elements
- Color is not the only indicator of status

---

## Browser Compatibility

### File System Access API
- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Opera 72+
- ❌ Firefox (use fallback: ZIP export)
- ❌ Safari (use fallback: ZIP export)

### Fallback for Unsupported Browsers
```
┌───────────────────────────────────────────────────┐
│  Local Folder Sync                                │
├───────────────────────────────────────────────────┤
│                                                   │
│  ℹ️ Your browser doesn't support automatic       │
│     folder sync.                                  │
│                                                   │
│  Alternative options:                             │
│  • Export as ZIP file                            │
│  • Use GitHub sync instead                       │
│  • Try Chrome or Edge for folder sync            │
│                                                   │
│  [Export as ZIP]                                 │
│                                                   │
└───────────────────────────────────────────────────┘
```
