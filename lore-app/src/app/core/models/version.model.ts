/**
 * Version Model
 * Data structures for notebook versioning system
 */

import { Note } from './shelf.model';

/**
 * Version Trigger Types
 */
export enum VersionTrigger {
  Manual = 'manual',
  Auto = 'auto',
  Milestone = 'milestone',
  BeforeRestore = 'before-restore',
  Session = 'session'
}

/**
 * Note Snapshot
 * Complete state of a note at a point in time
 */
export interface NoteSnapshot {
  title: string;
  type: string;
  content: string;
  preview?: string;
  tags: string[];
  status: string;
  blocks: any[];
  linkedNoteIds: string[];
}

/**
 * Changes Summary
 * High-level summary of what changed in this version
 */
export interface ChangesSummary {
  titleChanged: boolean;
  contentChanged: boolean;
  typeChanged: boolean;
  tagsChanged: boolean;
  blocksChanged: boolean;
  statusChanged: boolean;
  totalChanges: number;
  significantChanges: string[];
}

/**
 * Note Version
 * A single version/snapshot of a note
 */
export interface NoteVersion {
  id: string;
  noteId: string;
  versionNumber: number;
  timestamp: Date;
  trigger: VersionTrigger;
  label?: string;
  description?: string;
  snapshot: NoteSnapshot;
  changesSummary: ChangesSummary;
  author?: string;
  tags: string[];
  isCompressed: boolean;
}

/**
 * Restore Options
 * Configuration for restoring a version
 */
export interface RestoreOptions {
  versionId: string;
  createBackup: boolean;
}

/**
 * Restore Preview
 * Preview of what will change during restore
 */
export interface RestorePreview {
  currentSnapshot: NoteSnapshot;
  targetSnapshot: NoteSnapshot;
  changes: ChangesSummary;
  warnings: string[];
}

/**
 * Version Diff
 * Comparison between two versions
 */
export interface VersionDiff {
  version1: NoteVersion;
  version2: NoteVersion;
  changes: ChangesSummary;
  contentDiff?: string; // Future: character-level diff
}

/**
 * Note Diff (removed - not needed for note-level versioning)
 */

/**
 * Version Analytics
 * Statistics and insights about version history
 */
export interface VersionAnalytics {
  totalVersions: number;
  oldestVersion: Date;
  newestVersion: Date;
  averageTimeBetweenVersions: number; // in minutes
  totalChanges: number;
  mostActiveDay: string;
  versionsByTrigger: Record<VersionTrigger, number>;
  changeFrequency: {
    titleChanges: number;
    contentChanges: number;
    typeChanges: number;
    tagsChanges: number;
    blocksChanges: number;
  };
  milestoneCount: number;
}

/**
 * Version Configuration
 * Settings for versioning behavior
 */
export interface VersionConfig {
  enabled: boolean;
  autoSaveEnabled: boolean;
  autoSaveIntervalMinutes: number;
  maxVersionsToKeep: number;
  compressionEnabled: boolean;
  createSessionSnapshots: boolean;
}

/**
 * Default version configuration
 */
export const DEFAULT_VERSION_CONFIG: VersionConfig = {
  enabled: true,
  autoSaveEnabled: false, // Disabled - using session-based versioning instead
  autoSaveIntervalMinutes: 15,
  maxVersionsToKeep: 50,
  compressionEnabled: true,
  createSessionSnapshots: true
};
