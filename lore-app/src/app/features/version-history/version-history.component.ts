import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  NoteVersion, 
  VersionTrigger,
  VersionDiff,
  RestorePreview,
  VersionAnalytics
} from '../../core/models/version.model';
import { Note } from '../../core/models/shelf.model';
import { VersioningService } from '../../core/services/versioning.service';

/**
 * VersionHistoryComponent
 * Displays version history timeline and management UI for notes
 */
@Component({
  selector: 'lore-version-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './version-history.component.html',
  styleUrl: './version-history.component.scss'
})
export class VersionHistoryComponent {
  // Inputs
  note = input.required<Note>();
  
  // Outputs
  close = output<void>();
  restore = output<string>(); // Emits version ID to restore
  
  // Signals
  activeTab = signal<'timeline' | 'compare' | 'analytics'>('timeline');
  selectedVersion = signal<NoteVersion | null>(null);
  compareVersion1 = signal<NoteVersion | null>(null);
  compareVersion2 = signal<NoteVersion | null>(null);
  showRestorePreview = signal(false);
  restorePreview = signal<RestorePreview | null>(null);
  
  // New version form
  showCreateForm = signal(false);
  newVersionLabel = signal('');
  newVersionDescription = signal('');
  
  // Computed
  versions = computed(() => {
    return this.versioningService.getVersionHistory(this.note().id);
  });
  
  milestones = computed(() => {
    return this.versioningService.getMilestones(this.note().id);
  });
  
  analytics = computed(() => {
    return this.versioningService.getAnalytics(this.note().id);
  });
  
  versionDiff = computed(() => {
    const v1 = this.compareVersion1();
    const v2 = this.compareVersion2();
    if (!v1 || !v2) return null;
    return this.versioningService.compareVersions(v1.id, v2.id);
  });
  
  hasVersions = computed(() => this.versions().length > 0);
  
  constructor(private versioningService: VersioningService) {}

  // ═══════════════════════════════════════════════════════════
  // VERSION CREATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Show create version form
   */
  openCreateForm(): void {
    this.showCreateForm.set(true);
    this.newVersionLabel.set('');
    this.newVersionDescription.set('');
  }

  /**
   * Create new milestone version
   */
  createMilestone(): void {
    const label = this.newVersionLabel().trim();
    if (!label) return;

    this.versioningService.createMilestone(
      this.note(),
      label,
      this.newVersionDescription().trim() || undefined
    );

    this.showCreateForm.set(false);
    this.newVersionLabel.set('');
    this.newVersionDescription.set('');
  }

  /**
   * Create quick snapshot
   */
  createQuickSnapshot(): void {
    this.versioningService.createVersion(
      this.note(),
      VersionTrigger.Manual,
      'Manual Snapshot'
    );
  }

  /**
   * Cancel create form
   */
  cancelCreate(): void {
    this.showCreateForm.set(false);
    this.newVersionLabel.set('');
    this.newVersionDescription.set('');
  }

  // ═══════════════════════════════════════════════════════════
  // VERSION SELECTION & PREVIEW
  // ═══════════════════════════════════════════════════════════

  /**
   * Select a version to view details
   */
  selectVersion(version: NoteVersion): void {
    this.selectedVersion.set(version);
    this.showRestorePreview.set(false);
  }

  /**
   * Preview restore for selected version
   */
  previewRestoreVersion(): void {
    const version = this.selectedVersion();
    if (!version) return;

    const preview = this.versioningService.previewRestore(
      this.note(),
      version.id
    );
    
    this.restorePreview.set(preview);
    this.showRestorePreview.set(true);
  }

  /**
   * Confirm and restore version
   */
  confirmRestore(): void {
    const version = this.selectedVersion();
    if (!version) return;

    this.restore.emit(version.id);
    this.showRestorePreview.set(false);
    this.selectedVersion.set(null);
  }

  /**
   * Cancel restore preview
   */
  cancelRestore(): void {
    this.showRestorePreview.set(false);
    this.restorePreview.set(null);
  }

  // ═══════════════════════════════════════════════════════════
  // VERSION COMPARISON
  // ═══════════════════════════════════════════════════════════

  /**
   * Select first version for comparison
   */
  selectCompareVersion1(version: NoteVersion): void {
    this.compareVersion1.set(version);
  }

  /**
   * Select second version for comparison
   */
  selectCompareVersion2(version: NoteVersion): void {
    this.compareVersion2.set(version);
  }

  /**
   * Clear comparison selection
   */
  clearComparison(): void {
    this.compareVersion1.set(null);
    this.compareVersion2.set(null);
  }

  // ═══════════════════════════════════════════════════════════
  // VERSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Delete a version
   */
  deleteVersion(versionId: string, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this version?')) {
      this.versioningService.deleteVersion(versionId);
      
      // Clear selection if deleted version was selected
      if (this.selectedVersion()?.id === versionId) {
        this.selectedVersion.set(null);
      }
    }
  }

  /**
   * Update version label
   */
  updateVersionLabel(versionId: string, newLabel: string): void {
    this.versioningService.updateVersion(versionId, { label: newLabel });
  }

  // ═══════════════════════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Set active tab
   */
  setTab(tab: 'timeline' | 'compare' | 'analytics'): void {
    this.activeTab.set(tab);
  }

  /**
   * Close modal
   */
  closeModal(): void {
    this.close.emit();
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * Format full date and time
   */
  formatFullDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Get trigger badge class
   */
  getTriggerBadge(trigger: VersionTrigger): string {
    switch (trigger) {
      case VersionTrigger.Milestone:
        return 'badge-milestone';
      case VersionTrigger.Manual:
        return 'badge-manual';
      case VersionTrigger.Auto:
        return 'badge-auto';
      case VersionTrigger.BeforeRestore:
        return 'badge-backup';
      case VersionTrigger.Session:
        return 'badge-session';
      default:
        return 'badge-default';
    }
  }

  /**
   * Get trigger label
   */
  getTriggerLabel(trigger: VersionTrigger): string {
    switch (trigger) {
      case VersionTrigger.Milestone:
        return 'Milestone';
      case VersionTrigger.Manual:
        return 'Manual';
      case VersionTrigger.Auto:
        return 'Auto-save';
      case VersionTrigger.BeforeRestore:
        return 'Backup';
      case VersionTrigger.Session:
        return 'Session';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get change summary text
   */
  getChangeSummary(version: NoteVersion): string {
    const changes = version.changesSummary;
    const parts: string[] = [];
    
    if (changes.titleChanged) parts.push('Title');
    if (changes.contentChanged) parts.push('Content');
    if (changes.typeChanged) parts.push('Type');
    if (changes.tagsChanged) parts.push('Tags');
    if (changes.blocksChanged) parts.push('Blocks');
    if (changes.statusChanged) parts.push('Status');
    
    return parts.length > 0 ? parts.join(', ') + ' changed' : 'No changes';
  }

  /**
   * Track by version ID
   */
  trackByVersionId(index: number, version: NoteVersion): string {
    return version.id;
  }
}
