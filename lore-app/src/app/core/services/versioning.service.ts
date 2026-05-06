import { Injectable, signal, computed } from '@angular/core';
import { 
  NoteVersion, 
  VersionTrigger, 
  NoteSnapshot, 
  ChangesSummary,
  RestoreOptions,
  RestorePreview,
  VersionDiff,
  VersionAnalytics,
  VersionConfig,
  DEFAULT_VERSION_CONFIG
} from '../models/version.model';
import { Note } from '../models/shelf.model';
import { LocalStorageService } from './local-storage.service';

/**
 * VersioningService
 * Manages note version history, snapshots, and restoration
 */
@Injectable({
  providedIn: 'root'
})
export class VersioningService {
  private readonly VERSION_STORAGE_KEY = 'note_versions';
  private readonly CONFIG_STORAGE_KEY = 'version_config';
  
  // Signals
  private versionsSignal = signal<Map<string, NoteVersion[]>>(new Map());
  private configSignal = signal<VersionConfig>(DEFAULT_VERSION_CONFIG);
  
  // Public computed signals
  config = this.configSignal.asReadonly();
  
  constructor(private localStorage: LocalStorageService) {
    this.loadFromStorage();
    this.loadConfig();
  }

  // ═══════════════════════════════════════════════════════════
  // VERSION CREATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Create a new version snapshot
   */
  createVersion(
    note: Note,
    trigger: VersionTrigger = VersionTrigger.Manual,
    label?: string,
    description?: string
  ): NoteVersion {
    const versions = this.getVersionHistory(note.id);
    const previousVersion = versions[versions.length - 1];
    
    const snapshot: NoteSnapshot = {
      title: note.title,
      type: note.type,
      content: note.content,
      preview: note.preview,
      tags: [...note.tags],
      status: note.status,
      blocks: JSON.parse(JSON.stringify(note.blocks)), // Deep clone
      linkedNoteIds: [...note.linkedNoteIds]
    };

    const changesSummary = this.calculateChanges(
      previousVersion?.snapshot,
      snapshot
    );

    const newVersion: NoteVersion = {
      id: this.generateId(),
      noteId: note.id,
      versionNumber: versions.length + 1,
      timestamp: new Date(),
      trigger,
      label,
      description,
      snapshot,
      changesSummary,
      tags: [],
      isCompressed: false
    };

    // Add to version history
    const updatedVersions = [...versions, newVersion];
    
    // Apply retention policy
    const trimmedVersions = this.applyRetentionPolicy(updatedVersions);
    
    // Update storage
    const allVersions = this.versionsSignal();
    allVersions.set(note.id, trimmedVersions);
    this.versionsSignal.set(new Map(allVersions));
    this.saveToStorage();

    return newVersion;
  }

  /**
   * Create initial version for a note
   */
  createInitialVersion(note: Note): NoteVersion {
    return this.createVersion(
      note,
      VersionTrigger.Manual,
      'Initial Version',
      'First snapshot of this note'
    );
  }

  /**
   * Create milestone version
   */
  createMilestone(
    note: Note,
    label: string,
    description?: string
  ): NoteVersion {
    return this.createVersion(
      note,
      VersionTrigger.Milestone,
      label,
      description
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VERSION RETRIEVAL
  // ═══════════════════════════════════════════════════════════

  /**
   * Get version history for a note
   */
  getVersionHistory(noteId: string): NoteVersion[] {
    const allVersions = this.versionsSignal();
    return allVersions.get(noteId) || [];
  }

  /**
   * Get specific version by ID
   */
  getVersion(versionId: string): NoteVersion | undefined {
    const allVersions = this.versionsSignal();
    for (const versions of allVersions.values()) {
      const version = versions.find(v => v.id === versionId);
      if (version) return version;
    }
    return undefined;
  }

  /**
   * Get latest version for a note
   */
  getLatestVersion(noteId: string): NoteVersion | undefined {
    const versions = this.getVersionHistory(noteId);
    return versions[versions.length - 1];
  }

  /**
   * Get milestone versions only
   */
  getMilestones(noteId: string): NoteVersion[] {
    return this.getVersionHistory(noteId)
      .filter(v => v.trigger === VersionTrigger.Milestone);
  }

  // ═══════════════════════════════════════════════════════════
  // VERSION RESTORATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Preview what will change during restore
   */
  previewRestore(
    currentNote: Note,
    versionId: string
  ): RestorePreview | null {
    const version = this.getVersion(versionId);
    if (!version) return null;

    const currentSnapshot: NoteSnapshot = {
      title: currentNote.title,
      type: currentNote.type,
      content: currentNote.content,
      preview: currentNote.preview,
      tags: [...currentNote.tags],
      status: currentNote.status,
      blocks: JSON.parse(JSON.stringify(currentNote.blocks)),
      linkedNoteIds: [...currentNote.linkedNoteIds]
    };

    const changes = this.calculateChanges(currentSnapshot, version.snapshot);

    const warnings: string[] = [];
    if (changes.contentChanged) {
      warnings.push('Note content will be replaced');
    }
    if (changes.blocksChanged) {
      warnings.push('Note blocks will be replaced');
    }
    if (changes.titleChanged) {
      warnings.push(`Title will change to "${version.snapshot.title}"`);
    }

    return {
      currentSnapshot,
      targetSnapshot: version.snapshot,
      changes,
      warnings
    };
  }

  /**
   * Restore note to a specific version
   * Returns the restored snapshot
   */
  restoreVersion(
    currentNote: Note,
    versionId: string,
    options: Partial<RestoreOptions> = {}
  ): NoteSnapshot | null {
    const version = this.getVersion(versionId);
    if (!version) return null;

    const defaultOptions: RestoreOptions = {
      versionId,
      createBackup: true
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Create backup before restore
    if (finalOptions.createBackup) {
      this.createVersion(
        currentNote,
        VersionTrigger.BeforeRestore,
        'Before Restore',
        `Backup before restoring to version ${version.versionNumber}`
      );
    }

    // Return the snapshot to restore
    return version.snapshot;
  }

  // ═══════════════════════════════════════════════════════════
  // VERSION COMPARISON
  // ═══════════════════════════════════════════════════════════

  /**
   * Compare two versions
   */
  compareVersions(versionId1: string, versionId2: string): VersionDiff | null {
    const version1 = this.getVersion(versionId1);
    const version2 = this.getVersion(versionId2);

    if (!version1 || !version2) return null;

    const changes = this.calculateChanges(version1.snapshot, version2.snapshot);

    return {
      version1,
      version2,
      changes
    };
  }

  // ═══════════════════════════════════════════════════════════
  // VERSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Delete a specific version
   */
  deleteVersion(versionId: string): boolean {
    const allVersions = this.versionsSignal();
    let deleted = false;

    for (const [noteId, versions] of allVersions.entries()) {
      const filtered = versions.filter(v => v.id !== versionId);
      if (filtered.length < versions.length) {
        allVersions.set(noteId, filtered);
        deleted = true;
        break;
      }
    }

    if (deleted) {
      this.versionsSignal.set(new Map(allVersions));
      this.saveToStorage();
    }

    return deleted;
  }

  /**
   * Delete all versions for a note
   */
  deleteNoteVersions(noteId: string): boolean {
    const allVersions = this.versionsSignal();
    const existed = allVersions.has(noteId);
    
    if (existed) {
      allVersions.delete(noteId);
      this.versionsSignal.set(new Map(allVersions));
      this.saveToStorage();
    }

    return existed;
  }

  /**
   * Update version metadata
   */
  updateVersion(
    versionId: string,
    updates: Partial<Pick<NoteVersion, 'label' | 'description' | 'tags'>>
  ): boolean {
    const allVersions = this.versionsSignal();
    let updated = false;

    for (const [noteId, versions] of allVersions.entries()) {
      const index = versions.findIndex(v => v.id === versionId);
      if (index !== -1) {
        const updatedVersion = { ...versions[index], ...updates };
        const newVersions = [...versions];
        newVersions[index] = updatedVersion;
        allVersions.set(noteId, newVersions);
        updated = true;
        break;
      }
    }

    if (updated) {
      this.versionsSignal.set(new Map(allVersions));
      this.saveToStorage();
    }

    return updated;
  }

  // ═══════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════

  /**
   * Get analytics for a note's version history
   */
  getAnalytics(noteId: string): VersionAnalytics | null {
    const versions = this.getVersionHistory(noteId);
    if (versions.length === 0) return null;

    const timestamps = versions.map(v => new Date(v.timestamp).getTime());
    const oldest = new Date(Math.min(...timestamps));
    const newest = new Date(Math.max(...timestamps));

    // Calculate average time between versions
    let totalTimeDiff = 0;
    for (let i = 1; i < timestamps.length; i++) {
      totalTimeDiff += timestamps[i] - timestamps[i - 1];
    }
    const avgTimeMs = versions.length > 1 ? totalTimeDiff / (versions.length - 1) : 0;
    const avgTimeMinutes = avgTimeMs / (1000 * 60);

    // Count changes
    const changeFrequency = {
      titleChanges: 0,
      contentChanges: 0,
      typeChanges: 0,
      tagsChanges: 0,
      blocksChanges: 0
    };

    let totalChanges = 0;
    versions.forEach(v => {
      if (v.changesSummary.titleChanged) changeFrequency.titleChanges++;
      if (v.changesSummary.contentChanged) changeFrequency.contentChanges++;
      if (v.changesSummary.typeChanged) changeFrequency.typeChanges++;
      if (v.changesSummary.tagsChanged) changeFrequency.tagsChanges++;
      if (v.changesSummary.blocksChanged) changeFrequency.blocksChanges++;
      totalChanges += v.changesSummary.totalChanges;
    });

    // Versions by trigger
    const versionsByTrigger: Record<VersionTrigger, number> = {
      [VersionTrigger.Manual]: 0,
      [VersionTrigger.Auto]: 0,
      [VersionTrigger.Milestone]: 0,
      [VersionTrigger.BeforeRestore]: 0,
      [VersionTrigger.Session]: 0
    };
    versions.forEach(v => {
      versionsByTrigger[v.trigger]++;
    });

    // Most active day
    const dayCount: Record<string, number> = {};
    versions.forEach(v => {
      const day = new Date(v.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalVersions: versions.length,
      oldestVersion: oldest,
      newestVersion: newest,
      averageTimeBetweenVersions: avgTimeMinutes,
      totalChanges,
      mostActiveDay,
      versionsByTrigger,
      changeFrequency,
      milestoneCount: versionsByTrigger[VersionTrigger.Milestone]
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Update version configuration
   */
  updateConfig(updates: Partial<VersionConfig>): void {
    const current = this.configSignal();
    const updated = { ...current, ...updates };
    this.configSignal.set(updated);
    this.saveConfig();
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.configSignal.set(DEFAULT_VERSION_CONFIG);
    this.saveConfig();
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Calculate changes between two snapshots
   */
  private calculateChanges(
    previous: NoteSnapshot | undefined,
    current: NoteSnapshot
  ): ChangesSummary {
    if (!previous) {
      return {
        titleChanged: false,
        contentChanged: false,
        typeChanged: false,
        tagsChanged: false,
        blocksChanged: false,
        statusChanged: false,
        totalChanges: 1,
        significantChanges: ['Initial snapshot']
      };
    }

    const titleChanged = previous.title !== current.title;
    const contentChanged = previous.content !== current.content;
    const typeChanged = previous.type !== current.type;
    const tagsChanged = JSON.stringify(previous.tags) !== JSON.stringify(current.tags);
    const blocksChanged = JSON.stringify(previous.blocks) !== JSON.stringify(current.blocks);
    const statusChanged = previous.status !== current.status;

    const significantChanges: string[] = [];
    if (titleChanged) significantChanges.push(`Title changed to "${current.title}"`);
    if (contentChanged) significantChanges.push('Content modified');
    if (typeChanged) significantChanges.push(`Type changed to ${current.type}`);
    if (tagsChanged) significantChanges.push('Tags updated');
    if (blocksChanged) significantChanges.push('Blocks modified');
    if (statusChanged) significantChanges.push(`Status changed to ${current.status}`);

    const totalChanges = [titleChanged, contentChanged, typeChanged, tagsChanged, blocksChanged, statusChanged]
      .filter(Boolean).length;

    return {
      titleChanged,
      contentChanged,
      typeChanged,
      tagsChanged,
      blocksChanged,
      statusChanged,
      totalChanges,
      significantChanges
    };
  }

  /**
   * Apply retention policy to version history
   */
  private applyRetentionPolicy(versions: NoteVersion[]): NoteVersion[] {
    const config = this.configSignal();
    if (!config.enabled || versions.length <= config.maxVersionsToKeep) {
      return versions;
    }

    // Always keep milestones
    const milestones = versions.filter(v => v.trigger === VersionTrigger.Milestone);
    const nonMilestones = versions.filter(v => v.trigger !== VersionTrigger.Milestone);

    // Keep most recent non-milestones up to limit
    const keepCount = config.maxVersionsToKeep - milestones.length;
    const recentNonMilestones = nonMilestones.slice(-keepCount);

    // Combine and sort by timestamp
    return [...milestones, ...recentNonMilestones]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load versions from storage
   */
  private loadFromStorage(): void {
    const stored = this.localStorage.getItem<Record<string, NoteVersion[]>>(
      this.VERSION_STORAGE_KEY
    );

    if (stored) {
      const versionMap = new Map<string, NoteVersion[]>();
      Object.entries(stored).forEach(([noteId, versions]) => {
        // Convert date strings back to Date objects
        const parsedVersions = versions.map(v => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }));
        versionMap.set(noteId, parsedVersions);
      });
      this.versionsSignal.set(versionMap);
    }
  }

  /**
   * Save versions to storage
   */
  private saveToStorage(): void {
    const versionMap = this.versionsSignal();
    const obj: Record<string, NoteVersion[]> = {};
    versionMap.forEach((versions, noteId) => {
      obj[noteId] = versions;
    });
    this.localStorage.setItem(this.VERSION_STORAGE_KEY, obj);
  }

  /**
   * Load configuration from storage
   */
  private loadConfig(): void {
    const stored = this.localStorage.getItem<VersionConfig>(this.CONFIG_STORAGE_KEY);
    if (stored) {
      this.configSignal.set(stored);
    }
  }

  /**
   * Save configuration to storage
   */
  private saveConfig(): void {
    this.localStorage.setItem(this.CONFIG_STORAGE_KEY, this.configSignal());
  }
}
