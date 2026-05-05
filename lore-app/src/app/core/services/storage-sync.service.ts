import { Injectable, signal } from '@angular/core';

export type StorageTier = 'local' | 'github' | 'cloud';
export type SyncInterval = 1 | 5 | 10 | 0; // 0 = manual only

export interface LocalSyncSettings {
  enabled: boolean;
  folderHandle: FileSystemDirectoryHandle | null;
  folderPath: string | null;
  syncInterval: SyncInterval;
  lastSyncedAt: string | null;
  nextSyncAt: string | null;
  autoSyncEnabled: boolean;
  isSyncing: boolean;
  syncProgress: number;
  syncError: string | null;
}

export interface GitHubSyncSettings {
  enabled: boolean;
  connected: boolean;
  username: string | null;
  repository: string | null;
  accessToken: string | null;
  syncInterval: SyncInterval;
  lastSyncedAt: string | null;
  nextSyncAt: string | null;
  pendingChanges: number;
  autoSyncEnabled: boolean;
  isSyncing: boolean;
  syncProgress: number;
  syncError: string | null;
}

export interface CloudSyncSettings {
  enabled: boolean;
  provider: 'supabase' | 'firebase' | null;
  userId: string | null;
  storageUsed: number;
  storageLimit: number;
}

export interface SyncSettings {
  tier: StorageTier;
  localSync: LocalSyncSettings;
  githubSync: GitHubSyncSettings;
  cloudSync: CloudSyncSettings;
}

@Injectable({
  providedIn: 'root'
})
export class StorageSyncService {
  // Sync settings signal
  syncSettings = signal<SyncSettings>({
    tier: 'local',
    localSync: {
      enabled: false,
      folderHandle: null,
      folderPath: null,
      syncInterval: 5,
      lastSyncedAt: null,
      nextSyncAt: null,
      autoSyncEnabled: false,
      isSyncing: false,
      syncProgress: 0,
      syncError: null
    },
    githubSync: {
      enabled: false,
      connected: false,
      username: null,
      repository: null,
      accessToken: null,
      syncInterval: 5,
      lastSyncedAt: null,
      nextSyncAt: null,
      pendingChanges: 0,
      autoSyncEnabled: false,
      isSyncing: false,
      syncProgress: 0,
      syncError: null
    },
    cloudSync: {
      enabled: false,
      provider: null,
      userId: null,
      storageUsed: 0,
      storageLimit: 1073741824 // 1GB
    }
  });

  private syncTimer: any = null;

  constructor() {
    // Load settings from localStorage
    this.loadSettings();
    
    // Try to restore folder handle on startup
    this.restoreFolderHandleOnStartup();
  }

  // ─── Storage Tier ──────────────────────────────────────────────

  /**
   * Set storage tier
   */
  setStorageTier(tier: StorageTier): void {
    this.syncSettings.update(settings => ({
      ...settings,
      tier
    }));
    this.saveSettings();
  }

  // ─── Local Folder Sync ─────────────────────────────────────────

  /**
   * Check if File System Access API is supported
   */
  isFileSystemAccessSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  /**
   * Select folder for local sync
   */
  async selectFolder(): Promise<void> {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error('File System Access API is not supported in this browser');
    }

    try {
      // Request folder access
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });

      // Store folder path
      const folderPath = dirHandle.name;

      // Update settings
      this.syncSettings.update(settings => ({
        ...settings,
        localSync: {
          ...settings.localSync,
          folderHandle: dirHandle,
          folderPath: folderPath,
          syncError: null
        }
      }));

      // Store handle in IndexedDB for persistence
      await this.storeFolderHandle(dirHandle);

      this.saveSettings();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled
        return;
      }
      throw error;
    }
  }

  /**
   * Enable auto-sync for local folder
   */
  enableLocalAutoSync(interval: SyncInterval): void {
    this.syncSettings.update(settings => ({
      ...settings,
      localSync: {
        ...settings.localSync,
        enabled: true,
        autoSyncEnabled: true,
        syncInterval: interval
      }
    }));

    this.saveSettings();

    // Start sync timer
    if (interval > 0) {
      this.startSyncTimer(interval);
    }
  }

  /**
   * Disable auto-sync for local folder
   */
  disableLocalAutoSync(): void {
    this.syncSettings.update(settings => ({
      ...settings,
      localSync: {
        ...settings.localSync,
        autoSyncEnabled: false
      }
    }));

    this.saveSettings();
    this.stopSyncTimer();
  }

  /**
   * Sync to local folder now
   */
  async syncToLocalFolder(): Promise<void> {
    const settings = this.syncSettings();
    
    if (!settings.localSync.folderHandle) {
      throw new Error('No folder selected');
    }

    try {
      // Update syncing state
      this.syncSettings.update(s => ({
        ...s,
        localSync: {
          ...s.localSync,
          isSyncing: true,
          syncProgress: 0,
          syncError: null
        }
      }));

      // Get all data from localStorage
      const data = this.getAllDataFromLocalStorage();
      
      // Update progress
      this.updateSyncProgress('local', 20);

      // Write to folder structure
      await this.writeDataToFolder(settings.localSync.folderHandle, data);
      
      // Update progress
      this.updateSyncProgress('local', 100);

      // Update success state
      const now = new Date().toISOString();
      this.syncSettings.update(s => ({
        ...s,
        localSync: {
          ...s.localSync,
          isSyncing: false,
          syncProgress: 100,
          lastSyncedAt: now,
          nextSyncAt: this.calculateNextSync(s.localSync.syncInterval)
        }
      }));

      this.saveSettings();
    } catch (error: any) {
      // Update error state
      this.syncSettings.update(s => ({
        ...s,
        localSync: {
          ...s.localSync,
          isSyncing: false,
          syncError: error.message
        }
      }));
      throw error;
    }
  }

  /**
   * Import from local folder
   */
  async importFromFolder(): Promise<void> {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error('File System Access API is not supported in this browser');
    }

    try {
      // Request folder access
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
        startIn: 'documents'
      });

      // Update syncing state
      this.syncSettings.update(s => ({
        ...s,
        localSync: {
          ...s.localSync,
          isSyncing: true,
          syncProgress: 0,
          syncError: null
        }
      }));

      // Read data from folder
      const importedData = await this.readDataFromFolder(dirHandle);
      
      // Update progress
      this.updateSyncProgress('local', 50);

      // Merge with existing data
      await this.mergeImportedData(importedData);
      
      // Update progress
      this.updateSyncProgress('local', 100);

      // Update success state
      this.syncSettings.update(s => ({
        ...s,
        localSync: {
          ...s.localSync,
          isSyncing: false,
          syncProgress: 100
        }
      }));

      this.saveSettings();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled
        this.syncSettings.update(s => ({
          ...s,
          localSync: {
            ...s.localSync,
            isSyncing: false,
            syncProgress: 0
          }
        }));
        return;
      }
      
      // Update error state
      this.syncSettings.update(s => ({
        ...s,
        localSync: {
          ...s.localSync,
          isSyncing: false,
          syncError: error.message
        }
      }));
      throw error;
    }
  }

  // ─── GitHub Sync ───────────────────────────────────────────────

  /**
   * Save chat history sessions as Markdown files to the configured local folder.
   * Creates a `chat-history/` subfolder inside the sync folder.
   */
  async saveChatHistory(sessions: any[]): Promise<void> {
    const folderHandle = this.syncSettings().localSync.folderHandle;
    if (!folderHandle) {
      throw new Error('No folder selected. Configure a local folder in Sync & Export first.');
    }

    // Create / open the chat-history subfolder
    const chatFolder = await folderHandle.getDirectoryHandle('chat-history', { create: true });

    for (const session of sessions) {
      const safeName = this._safeChatFilename(session.title, session.id);
      const fileHandle = await chatFolder.getFileHandle(`${safeName}.md`, { create: true });
      const writable   = await fileHandle.createWritable();

      const lines: string[] = [
        `# ${session.title}`,
        ``,
        `**Provider:** ${session.providerId}`,
        `**Created:** ${new Date(session.createdAt).toLocaleString()}`,
        `**Updated:** ${new Date(session.updatedAt).toLocaleString()}`,
        `**Messages:** ${session.messages?.length ?? 0}`,
        ``,
        `---`,
        ``,
      ];

      for (const msg of (session.messages ?? [])) {
        const role = msg.role === 'user' ? 'You' : session.providerId;
        const time = new Date(msg.timestamp).toLocaleString();
        lines.push(`**${role}** _(${time})_`);
        lines.push(``);
        lines.push(msg.error ? `> ⚠ ${msg.error}` : msg.content);
        lines.push(``);
        lines.push(`---`);
        lines.push(``);
      }

      await writable.write(lines.join('\n'));
      await writable.close();
    }
  }

  private _safeChatFilename(title: string, id: string): string {
    const slug = title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '-').toLowerCase();
    return (slug || 'chat') + '-' + id.slice(0, 8);
  }

  /**
   * Sign in with GitHub
   */
  async signInWithGitHub(): Promise<void> {
    // TODO: Implement GitHub OAuth flow
    // This would involve:
    // 1. Open OAuth popup
    // 2. Exchange code for token
    // 3. Store token securely
    // 4. Check for existing repository

    // Simulate for now
    this.syncSettings.update(settings => ({
      ...settings,
      githubSync: {
        ...settings.githubSync,
        connected: true,
        username: 'demo-user',
        repository: 'lore-workspace'
      }
    }));

    this.saveSettings();
  }

  /**
   * Disconnect from GitHub
   */
  disconnectGitHub(): void {
    this.syncSettings.update(settings => ({
      ...settings,
      githubSync: {
        ...settings.githubSync,
        connected: false,
        username: null,
        repository: null,
        accessToken: null
      }
    }));

    this.saveSettings();
  }

  /**
   * Enable auto-sync for GitHub
   */
  enableGitHubAutoSync(interval: SyncInterval): void {
    this.syncSettings.update(settings => ({
      ...settings,
      githubSync: {
        ...settings.githubSync,
        enabled: true,
        autoSyncEnabled: true,
        syncInterval: interval
      }
    }));

    this.saveSettings();

    // Start sync timer
    if (interval > 0) {
      this.startSyncTimer(interval);
    }
  }

  /**
   * Disable auto-sync for GitHub
   */
  disableGitHubAutoSync(): void {
    this.syncSettings.update(settings => ({
      ...settings,
      githubSync: {
        ...settings.githubSync,
        autoSyncEnabled: false
      }
    }));

    this.saveSettings();
    this.stopSyncTimer();
  }

  /**
   * Sync to GitHub now
   */
  async syncToGitHub(): Promise<void> {
    const settings = this.syncSettings();
    
    if (!settings.githubSync.connected) {
      throw new Error('Not connected to GitHub');
    }

    try {
      // Update syncing state
      this.syncSettings.update(s => ({
        ...s,
        githubSync: {
          ...s.githubSync,
          isSyncing: true,
          syncProgress: 0,
          syncError: null
        }
      }));

      // TODO: Implement actual GitHub sync logic
      // This would involve:
      // 1. Get all data from IndexedDB
      // 2. Push to GitHub repository
      // 3. Update progress

      // Simulate sync for now
      await this.simulateSync();

      // Update success state
      const now = new Date().toISOString();
      this.syncSettings.update(s => ({
        ...s,
        githubSync: {
          ...s.githubSync,
          isSyncing: false,
          syncProgress: 100,
          lastSyncedAt: now,
          nextSyncAt: this.calculateNextSync(s.githubSync.syncInterval),
          pendingChanges: 0
        }
      }));

      this.saveSettings();
    } catch (error: any) {
      // Update error state
      this.syncSettings.update(s => ({
        ...s,
        githubSync: {
          ...s.githubSync,
          isSyncing: false,
          syncError: error.message
        }
      }));
    }
  }

  // ─── Private Methods ───────────────────────────────────────────

  /**
   * Start sync timer
   */
  private startSyncTimer(intervalMinutes: number): void {
    this.stopSyncTimer();

    if (intervalMinutes === 0) return; // Manual only

    const intervalMs = intervalMinutes * 60 * 1000;

    this.syncTimer = setInterval(async () => {
      const settings = this.syncSettings();
      
      if (settings.tier === 'local' && settings.localSync.autoSyncEnabled) {
        await this.syncToLocalFolder();
      } else if (settings.tier === 'github' && settings.githubSync.autoSyncEnabled) {
        await this.syncToGitHub();
      }
    }, intervalMs);
  }

  /**
   * Stop sync timer
   */
  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Calculate next sync time
   */
  private calculateNextSync(intervalMinutes: number): string | null {
    if (intervalMinutes === 0) return null;

    const now = new Date();
    const next = new Date(now.getTime() + intervalMinutes * 60 * 1000);
    return next.toISOString();
  }

  /**
   * Simulate sync (for demo purposes)
   */
  private async simulateSync(): Promise<void> {
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const progress = (i / steps) * 100;
      const settings = this.syncSettings();
      
      if (settings.tier === 'local') {
        this.syncSettings.update(s => ({
          ...s,
          localSync: {
            ...s.localSync,
            syncProgress: progress
          }
        }));
      } else if (settings.tier === 'github') {
        this.syncSettings.update(s => ({
          ...s,
          githubSync: {
            ...s.githubSync,
            syncProgress: progress
          }
        }));
      }
    }
  }

  /**
   * Store folder handle in IndexedDB
   */
  private async storeFolderHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['folderHandles'], 'readwrite');
      const store = transaction.objectStore('folderHandles');
      
      return new Promise((resolve, reject) => {
        const request = store.put({ id: 'main', handle });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to store folder handle:', error);
    }
  }

  /**
   * Restore folder handle from IndexedDB
   */
  private async restoreFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['folderHandles'], 'readonly');
      const store = transaction.objectStore('folderHandles');
      
      return new Promise((resolve, reject) => {
        const request = store.get('main');
        request.onsuccess = async () => {
          const result = request.result;
          if (result && result.handle) {
            // Verify we still have permission
            const permission = await result.handle.queryPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
              resolve(result.handle);
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          console.error('Failed to restore folder handle:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error('Failed to restore folder handle:', error);
      return null;
    }
  }

  /**
   * Open IndexedDB
   */
  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('lore-sync', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('folderHandles')) {
          db.createObjectStore('folderHandles', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Get all data from localStorage
   */
  private getAllDataFromLocalStorage(): any {
    const data: any = {
      shelves: [],
      settings: {},
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    // Get shelves data
    const shelvesData = localStorage.getItem('lore-shelves');
    if (shelvesData) {
      try {
        data.shelves = JSON.parse(shelvesData);
      } catch (error) {
        console.error('Failed to parse shelves data:', error);
      }
    }

    // Get other settings
    const syncSettings = localStorage.getItem('lore-sync-settings');
    if (syncSettings) {
      try {
        data.settings.sync = JSON.parse(syncSettings);
      } catch (error) {
        console.error('Failed to parse sync settings:', error);
      }
    }

    return data;
  }

  /**
   * Write data to folder
   */
  private async writeDataToFolder(folderHandle: FileSystemDirectoryHandle, data: any): Promise<void> {
    try {
      // Create lore-data folder
      const dataFolder = await folderHandle.getDirectoryHandle('lore-data', { create: true });
      
      // Update progress
      this.updateSyncProgress('local', 40);

      // Write shelves
      if (data.shelves && Array.isArray(data.shelves)) {
        for (const shelf of data.shelves) {
          await this.writeShelfToFolder(dataFolder, shelf);
        }
      }

      // Update progress
      this.updateSyncProgress('local', 80);

      // Write metadata
      const metadataFile = await dataFolder.getFileHandle('metadata.json', { create: true });
      const metadataWritable = await metadataFile.createWritable();
      await metadataWritable.write(JSON.stringify(data.metadata, null, 2));
      await metadataWritable.close();

      // Update progress
      this.updateSyncProgress('local', 90);
    } catch (error: any) {
      throw new Error(`Failed to write data to folder: ${error.message}`);
    }
  }

  /**
   * Write shelf to folder
   */
  private async writeShelfToFolder(dataFolder: FileSystemDirectoryHandle, shelf: any): Promise<void> {
    try {
      // Create shelf folder
      const shelfFolder = await dataFolder.getDirectoryHandle(this.sanitizeFileName(shelf.name), { create: true });
      
      // Write shelf metadata
      const shelfMetaFile = await shelfFolder.getFileHandle('shelf.json', { create: true });
      const shelfMetaWritable = await shelfMetaFile.createWritable();
      await shelfMetaWritable.write(JSON.stringify({
        id: shelf.id,
        name: shelf.name,
        color: shelf.color,
        icon: shelf.icon,
        createdAt: shelf.createdAt,
        updatedAt: shelf.updatedAt
      }, null, 2));
      await shelfMetaWritable.close();

      // Write notebooks
      if (shelf.notebooks && Array.isArray(shelf.notebooks)) {
        for (const notebook of shelf.notebooks) {
          await this.writeNotebookToFolder(shelfFolder, notebook);
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to write shelf "${shelf.name}": ${error.message}`);
    }
  }

  /**
   * Write notebook to folder
   */
  private async writeNotebookToFolder(shelfFolder: FileSystemDirectoryHandle, notebook: any): Promise<void> {
    try {
      // Create notebook folder
      const notebookFolder = await shelfFolder.getDirectoryHandle(this.sanitizeFileName(notebook.name), { create: true });
      
      // Write notebook metadata
      const notebookMetaFile = await notebookFolder.getFileHandle('notebook.json', { create: true });
      const notebookMetaWritable = await notebookMetaFile.createWritable();
      await notebookMetaWritable.write(JSON.stringify({
        id: notebook.id,
        name: notebook.name,
        icon: notebook.icon,
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt
      }, null, 2));
      await notebookMetaWritable.close();

      // Write notes
      if (notebook.notes && Array.isArray(notebook.notes)) {
        for (const note of notebook.notes) {
          await this.writeNoteToFolder(notebookFolder, note);
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to write notebook "${notebook.name}": ${error.message}`);
    }
  }

  /**
   * Write note to folder
   */
  private async writeNoteToFolder(notebookFolder: FileSystemDirectoryHandle, note: any): Promise<void> {
    try {
      // Create note file (markdown format)
      const noteFileName = `${this.sanitizeFileName(note.title)}.md`;
      const noteFile = await notebookFolder.getFileHandle(noteFileName, { create: true });
      const noteWritable = await noteFile.createWritable();
      
      // Build markdown content
      let markdown = `# ${note.title}\n\n`;
      markdown += `---\n`;
      markdown += `id: ${note.id}\n`;
      markdown += `type: ${note.type}\n`;
      markdown += `status: ${note.status}\n`;
      markdown += `tags: ${note.tags ? note.tags.join(', ') : ''}\n`;
      markdown += `created: ${note.createdAt}\n`;
      markdown += `updated: ${note.updatedAt}\n`;
      markdown += `---\n\n`;
      
      // Add content
      if (note.content) {
        markdown += note.content + '\n\n';
      }
      
      // Add blocks
      if (note.blocks && Array.isArray(note.blocks)) {
        for (const block of note.blocks) {
          markdown += this.blockToMarkdown(block) + '\n\n';
        }
      }
      
      await noteWritable.write(markdown);
      await noteWritable.close();
    } catch (error: any) {
      throw new Error(`Failed to write note "${note.title}": ${error.message}`);
    }
  }

  /**
   * Convert block to markdown
   */
  private blockToMarkdown(block: any): string {
    switch (block.type) {
      case 'hypothesis':
        return `> **Hypothesis**: ${block.content}`;
      case 'conclusion':
        return `> **Conclusion**: ${block.content}`;
      case 'note':
        return `> **Note**: ${block.content}`;
      case 'warning':
        return `> ⚠️ **Warning**: ${block.content}`;
      case 'quote':
        return `> ${block.content}\n> — ${block.attribution || 'Unknown'}`;
      case 'code':
        return `\`\`\`${block.language || ''}\n${block.content}\n\`\`\``;
      case 'divider':
        return `---`;
      default:
        return block.content || '';
    }
  }

  /**
   * Sanitize file name
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 255);
  }

  /**
   * Update sync progress
   */
  private updateSyncProgress(tier: 'local' | 'github', progress: number): void {
    if (tier === 'local') {
      this.syncSettings.update(s => ({
        ...s,
        localSync: {
          ...s.localSync,
          syncProgress: progress
        }
      }));
    } else {
      this.syncSettings.update(s => ({
        ...s,
        githubSync: {
          ...s.githubSync,
          syncProgress: progress
        }
      }));
    }
  }

  /**
   * Restore folder handle on startup
   */
  private async restoreFolderHandleOnStartup(): Promise<void> {
    const handle = await this.restoreFolderHandle();
    if (handle) {
      this.syncSettings.update(s => ({
        ...s,
        localSync: {
          ...s.localSync,
          folderHandle: handle,
          folderPath: handle.name
        }
      }));
    }
  }

  /**
   * Read data from folder
   */
  private async readDataFromFolder(folderHandle: FileSystemDirectoryHandle): Promise<any> {
    try {
      // Look for lore-data folder
      const dataFolder = await folderHandle.getDirectoryHandle('lore-data', { create: false });
      
      const data: any = {
        shelves: [],
        metadata: null
      };

      // Read metadata
      try {
        const metadataFile = await dataFolder.getFileHandle('metadata.json', { create: false });
        const metadataFileContent = await metadataFile.getFile();
        const metadataText = await metadataFileContent.text();
        data.metadata = JSON.parse(metadataText);
      } catch (error) {
        console.warn('No metadata.json found, continuing without it');
      }

      // Read all shelf folders
      for await (const entry of (dataFolder as any).values()) {
        if (entry.kind === 'directory' && entry.name !== 'metadata.json') {
          const shelf = await this.readShelfFromFolder(entry);
          if (shelf) {
            data.shelves.push(shelf);
          }
        }
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to read data from folder: ${error.message}`);
    }
  }

  /**
   * Read shelf from folder
   */
  private async readShelfFromFolder(shelfFolder: FileSystemDirectoryHandle): Promise<any | null> {
    try {
      // Read shelf metadata
      let shelfMeta: any = {
        name: shelfFolder.name,
        color: '#7C3AED',
        icon: undefined
      };

      try {
        const shelfMetaFile = await shelfFolder.getFileHandle('shelf.json', { create: false });
        const shelfMetaFileContent = await shelfMetaFile.getFile();
        const shelfMetaText = await shelfMetaFileContent.text();
        shelfMeta = JSON.parse(shelfMetaText);
      } catch (error) {
        console.warn(`No shelf.json found for ${shelfFolder.name}, using defaults`);
      }

      const shelf: any = {
        ...shelfMeta,
        notebooks: []
      };

      // Read all notebook folders
      for await (const entry of (shelfFolder as any).values()) {
        if (entry.kind === 'directory' && entry.name !== 'shelf.json') {
          const notebook = await this.readNotebookFromFolder(entry, shelf.id);
          if (notebook) {
            shelf.notebooks.push(notebook);
          }
        }
      }

      return shelf;
    } catch (error: any) {
      console.error(`Failed to read shelf ${shelfFolder.name}:`, error);
      return null;
    }
  }

  /**
   * Read notebook from folder
   */
  private async readNotebookFromFolder(notebookFolder: FileSystemDirectoryHandle, shelfId: string): Promise<any | null> {
    try {
      // Read notebook metadata
      let notebookMeta: any = {
        name: notebookFolder.name,
        icon: '📔'
      };

      try {
        const notebookMetaFile = await notebookFolder.getFileHandle('notebook.json', { create: false });
        const notebookMetaFileContent = await notebookMetaFile.getFile();
        const notebookMetaText = await notebookMetaFileContent.text();
        notebookMeta = JSON.parse(notebookMetaText);
      } catch (error) {
        console.warn(`No notebook.json found for ${notebookFolder.name}, using defaults`);
      }

      const notebook: any = {
        ...notebookMeta,
        shelfId,
        notes: []
      };

      // Read all note files
      for await (const entry of (notebookFolder as any).values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          const note = await this.readNoteFromFile(entry, notebook.id);
          if (note) {
            notebook.notes.push(note);
          }
        }
      }

      return notebook;
    } catch (error: any) {
      console.error(`Failed to read notebook ${notebookFolder.name}:`, error);
      return null;
    }
  }

  /**
   * Read note from markdown file
   */
  private async readNoteFromFile(noteFile: FileSystemFileHandle, notebookId: string): Promise<any | null> {
    try {
      const file = await noteFile.getFile();
      const text = await file.text();

      // Parse markdown with frontmatter
      const lines = text.split('\n');
      let inFrontmatter = false;
      let frontmatterLines: string[] = [];
      let contentLines: string[] = [];
      let title = noteFile.name.replace('.md', '');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.trim() === '---') {
          if (i === 0 || (i === 1 && lines[0].startsWith('#'))) {
            inFrontmatter = true;
            continue;
          } else if (inFrontmatter) {
            inFrontmatter = false;
            continue;
          }
        }

        if (inFrontmatter) {
          frontmatterLines.push(line);
        } else {
          contentLines.push(line);
        }
      }

      // Parse frontmatter
      const metadata: any = {
        id: undefined,
        type: 'idea',
        status: 'draft',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      for (const line of frontmatterLines) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          if (key === 'tags') {
            metadata.tags = value.split(',').map(t => t.trim()).filter(t => t);
          } else {
            metadata[key] = value;
          }
        }
      }

      // Extract title from first heading if present
      const content = contentLines.join('\n').trim();
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1];
      }

      // Parse blocks from content (simplified - just store as content for now)
      const note: any = {
        ...metadata,
        notebookId,
        title,
        content,
        preview: content.substring(0, 120),
        blocks: [],
        linkedNoteIds: []
      };

      return note;
    } catch (error: any) {
      console.error(`Failed to read note ${noteFile.name}:`, error);
      return null;
    }
  }

  /**
   * Merge imported data with existing data
   */
  private async mergeImportedData(importedData: any): Promise<void> {
    try {
      // Get existing data
      const existingData = this.getAllDataFromLocalStorage();
      
      // Simple merge strategy: add imported shelves with new IDs to avoid conflicts
      const mergedShelves = [...existingData.shelves];
      
      for (const importedShelf of importedData.shelves) {
        // Generate new IDs for imported items to avoid conflicts
        const newShelf = {
          ...importedShelf,
          id: this.generateId(),
          notebooks: importedShelf.notebooks.map((nb: any) => ({
            ...nb,
            id: this.generateId(),
            shelfId: importedShelf.id, // Will be updated
            notes: nb.notes.map((note: any) => ({
              ...note,
              id: this.generateId(),
              notebookId: nb.id // Will be updated
            }))
          }))
        };

        // Update notebook shelfIds
        newShelf.notebooks.forEach((nb: any) => {
          nb.shelfId = newShelf.id;
          // Update note notebookIds
          nb.notes.forEach((note: any) => {
            note.notebookId = nb.id;
          });
        });

        mergedShelves.push(newShelf);
      }

      // Save merged data
      localStorage.setItem('lore-shelves', JSON.stringify(mergedShelves));
      
      // Reload the page to refresh the UI with new data
      window.location.reload();
    } catch (error: any) {
      throw new Error(`Failed to merge imported data: ${error.message}`);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    const stored = localStorage.getItem('lore-sync-settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        this.syncSettings.set({
          ...this.syncSettings(),
          ...settings,
          // Don't restore folderHandle from localStorage
          localSync: {
            ...this.syncSettings().localSync,
            ...settings.localSync,
            folderHandle: null
          }
        });
      } catch (error) {
        console.error('Failed to load sync settings:', error);
      }
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    const settings = this.syncSettings();
    // Don't save folderHandle to localStorage
    const toSave = {
      ...settings,
      localSync: {
        ...settings.localSync,
        folderHandle: null
      }
    };
    localStorage.setItem('lore-sync-settings', JSON.stringify(toSave));
  }

  /**
   * Format relative time
   */
  formatRelativeTime(isoString: string | null): string {
    if (!isoString) return 'Never';

    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  /**
   * Format next sync time
   */
  formatNextSyncTime(isoString: string | null): string {
    if (!isoString) return 'Manual only';

    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    
    const diffHours = Math.ceil(diffMins / 60);
    return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }
}
