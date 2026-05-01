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

      // TODO: Implement actual sync logic
      // This would involve:
      // 1. Get all data from IndexedDB
      // 2. Write to folder structure
      // 3. Update progress

      // Simulate sync for now
      await this.simulateSync();

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
    }
  }

  // ─── GitHub Sync ───────────────────────────────────────────────

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
    // TODO: Implement IndexedDB storage
    // This would store the handle for persistence across sessions
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
