import { Injectable, signal, effect, inject } from '@angular/core';
import { VersioningService } from './versioning.service';
import { ShelfService } from './shelf.service';
import { Note } from '../models/shelf.model';
import { VersionTrigger } from '../models/version.model';

/**
 * Session state for a note
 */
interface NoteSession {
  noteId: string;
  startTime: Date;
  lastSaveTime: Date;
  initialSnapshot: string; // JSON snapshot of note at session start
  hasChanges: boolean;
}

/**
 * SessionVersioningService
 * Automatically creates versions when editing sessions start/end
 */
@Injectable({
  providedIn: 'root'
})
export class SessionVersioningService {
  private versioningService = inject(VersioningService);
  private shelfService = inject(ShelfService);
  
  // Active sessions map: noteId -> session
  private activeSessions = signal<Map<string, NoteSession>>(new Map());
  
  // Minimum time between versions (5 minutes)
  private readonly MIN_VERSION_INTERVAL_MS = 5 * 60 * 1000;
  
  // Minimum changes to warrant a version
  private readonly MIN_CHANGE_THRESHOLD = 50; // characters

  constructor() {
    // Listen for page unload to save all active sessions
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveAllActiveSessions();
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Start editing session for a note
   */
  startSession(note: Note): void {
    const sessions = this.activeSessions();
    
    // If session already exists, don't create a new one
    if (sessions.has(note.id)) {
      return;
    }

    const session: NoteSession = {
      noteId: note.id,
      startTime: new Date(),
      lastSaveTime: new Date(),
      initialSnapshot: JSON.stringify(this.createNoteSnapshot(note)),
      hasChanges: false
    };

    sessions.set(note.id, session);
    this.activeSessions.set(new Map(sessions));

    console.log(`📝 Session started for note: ${note.title}`);
  }

  /**
   * End editing session and create version if changes detected
   */
  endSession(noteId: string): void {
    const sessions = this.activeSessions();
    const session = sessions.get(noteId);

    if (!session) {
      return;
    }

    // Get current note state
    const note = this.shelfService.getNote(noteId);
    if (!note) {
      sessions.delete(noteId);
      this.activeSessions.set(new Map(sessions));
      return;
    }

    // Check if there are significant changes
    const hasSignificantChanges = this.hasSignificantChanges(session, note);

    if (hasSignificantChanges) {
      // Create session version
      const sessionDuration = Date.now() - session.startTime.getTime();
      const durationMinutes = Math.round(sessionDuration / 60000);
      
      this.versioningService.createVersion(
        note,
        VersionTrigger.Session,
        `Session ${new Date().toLocaleTimeString()}`,
        `Editing session (${durationMinutes} min)`
      );

      console.log(`💾 Session version created for note: ${note.title}`);
    } else {
      console.log(`⏭️ No significant changes, skipping version for: ${note.title}`);
    }

    // Remove session
    sessions.delete(noteId);
    this.activeSessions.set(new Map(sessions));
  }

  /**
   * Update session to track changes
   */
  trackChange(noteId: string): void {
    const sessions = this.activeSessions();
    const session = sessions.get(noteId);

    if (session) {
      session.hasChanges = true;
      session.lastSaveTime = new Date();
      sessions.set(noteId, session);
      this.activeSessions.set(new Map(sessions));
    }
  }

  /**
   * Check if note is in active session
   */
  isInSession(noteId: string): boolean {
    return this.activeSessions().has(noteId);
  }

  /**
   * Get active session for a note
   */
  getSession(noteId: string): NoteSession | undefined {
    return this.activeSessions().get(noteId);
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Check if there are significant changes since session start
   */
  private hasSignificantChanges(session: NoteSession, currentNote: Note): boolean {
    const initialSnapshot = JSON.parse(session.initialSnapshot);
    const currentSnapshot = this.createNoteSnapshot(currentNote);

    // Check if title changed
    if (initialSnapshot.title !== currentSnapshot.title) {
      return true;
    }

    // Check if content changed significantly
    const contentDiff = Math.abs(
      currentSnapshot.content.length - initialSnapshot.content.length
    );
    if (contentDiff > this.MIN_CHANGE_THRESHOLD) {
      return true;
    }

    // Check if content is different (even if length is similar)
    if (initialSnapshot.content !== currentSnapshot.content) {
      return true;
    }

    // Check if type changed
    if (initialSnapshot.type !== currentSnapshot.type) {
      return true;
    }

    // Check if tags changed
    if (JSON.stringify(initialSnapshot.tags) !== JSON.stringify(currentSnapshot.tags)) {
      return true;
    }

    // Check if blocks changed
    if (JSON.stringify(initialSnapshot.blocks) !== JSON.stringify(currentSnapshot.blocks)) {
      return true;
    }

    return false;
  }

  /**
   * Create a snapshot of note for comparison
   */
  private createNoteSnapshot(note: Note) {
    return {
      title: note.title,
      type: note.type,
      content: note.content,
      tags: [...note.tags],
      blocks: JSON.parse(JSON.stringify(note.blocks)),
      status: note.status
    };
  }

  /**
   * Save all active sessions (called on page unload)
   */
  private saveAllActiveSessions(): void {
    const sessions = this.activeSessions();
    
    sessions.forEach((session, noteId) => {
      this.endSession(noteId);
    });
  }

  /**
   * Get session duration in minutes
   */
  getSessionDuration(noteId: string): number {
    const session = this.getSession(noteId);
    if (!session) return 0;

    const duration = Date.now() - session.startTime.getTime();
    return Math.round(duration / 60000);
  }

  /**
   * Check if enough time has passed since last version
   */
  shouldCreateVersion(noteId: string): boolean {
    const lastVersion = this.versioningService.getLatestVersion(noteId);
    if (!lastVersion) return true;

    const timeSinceLastVersion = Date.now() - new Date(lastVersion.timestamp).getTime();
    return timeSinceLastVersion >= this.MIN_VERSION_INTERVAL_MS;
  }

  /**
   * Force create version for current session
   */
  forceCreateVersion(noteId: string): void {
    const note = this.shelfService.getNote(noteId);
    if (!note) return;

    this.versioningService.createVersion(
      note,
      VersionTrigger.Manual,
      'Manual Checkpoint',
      'User-requested version during editing session'
    );

    console.log(`✅ Manual version created for: ${note.title}`);
  }
}
