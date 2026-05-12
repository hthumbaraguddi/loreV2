import { Component, signal, computed, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  NoteVersion, 
  VersionTrigger,
  VersionDiff
} from '../../core/models/version.model';
import { Note } from '../../core/models/shelf.model';
import { VersioningService } from '../../core/services/versioning.service';
import { ShelfService } from '../../core/services/shelf.service';

/**
 * VersionTreeComponent
 * Git-style version tree view in the main panel
 */
@Component({
  selector: 'lore-version-tree',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './version-tree.component.html',
  styleUrl: './version-tree.component.scss'
})
export class VersionTreeComponent {
  private versioningService = inject(VersioningService);
  private shelfService = inject(ShelfService);
  
  // Inputs
  note = input.required<Note>();
  
  // Outputs
  close = output<void>();
  versionSelected = output<NoteVersion>();
  
  // Signals
  selectedVersion = signal<NoteVersion | null>(null);
  compareMode = signal(false);
  compareVersion1 = signal<NoteVersion | null>(null);
  compareVersion2 = signal<NoteVersion | null>(null);
  showCreateForm = signal(false);
  newVersionLabel = signal('');
  newVersionDescription = signal('');
  
  // Computed
  versions = computed(() => {
    return this.versioningService.getVersionHistory(this.note().id);
  });
  
  currentNote = computed(() => this.note());
  
  hasVersions = computed(() => this.versions().length > 0);
  
  versionDiff = computed(() => {
    const v1 = this.compareVersion1();
    const v2 = this.compareVersion2();
    if (!v1 || !v2) return null;
    return this.versioningService.compareVersions(v1.id, v2.id);
  });
  
  // Git-style tree structure
  versionTree = computed(() => {
    const versions = this.versions();
    return versions.map((version, index) => ({
      version,
      isFirst: index === 0,
      isLast: index === versions.length - 1,
      isCurrent: index === versions.length - 1,
      branchLine: index < versions.length - 1
    }));
  });

  // ═══════════════════════════════════════════════════════════
  // VERSION ACTIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Select a version
   */
  selectVersion(version: NoteVersion): void {
    if (this.compareMode()) {
      this.selectForCompare(version);
    } else {
      this.selectedVersion.set(version);
      this.versionSelected.emit(version);
    }
  }

  /**
   * Select version for comparison
   */
  selectForCompare(version: NoteVersion): void {
    if (!this.compareVersion1()) {
      this.compareVersion1.set(version);
    } else if (!this.compareVersion2()) {
      this.compareVersion2.set(version);
    } else {
      // Reset and start over
      this.compareVersion1.set(version);
      this.compareVersion2.set(null);
    }
  }

  /**
   * Toggle compare mode
   */
  toggleCompareMode(): void {
    this.compareMode.set(!this.compareMode());
    if (!this.compareMode()) {
      this.compareVersion1.set(null);
      this.compareVersion2.set(null);
    }
  }

  /**
   * Clear comparison
   */
  clearComparison(): void {
    this.compareVersion1.set(null);
    this.compareVersion2.set(null);
  }

  /**
   * Restore to version
   */
  restoreToVersion(version: NoteVersion): void {
    if (!confirm(`Restore to version ${version.versionNumber}? Current state will be backed up.`)) {
      return;
    }

    const success = this.shelfService.restoreNoteFromVersion(this.note().id, version.id);
    if (success) {
      console.log('✅ Note restored successfully');
      this.selectedVersion.set(null);
    } else {
      console.error('❌ Failed to restore note');
    }
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
   * Open create milestone form
   */
  openCreateForm(): void {
    this.showCreateForm.set(true);
  }

  /**
   * Create milestone
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
   * Cancel create form
   */
  cancelCreate(): void {
    this.showCreateForm.set(false);
    this.newVersionLabel.set('');
    this.newVersionDescription.set('');
  }

  /**
   * Delete version
   */
  deleteVersion(version: NoteVersion, event: Event): void {
    event.stopPropagation();
    
    if (version.trigger === VersionTrigger.Milestone) {
      if (!confirm('Delete this milestone version? This cannot be undone.')) {
        return;
      }
    }

    this.versioningService.deleteVersion(version.id);
    
    if (this.selectedVersion()?.id === version.id) {
      this.selectedVersion.set(null);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Check if version is selected
   */
  isSelected(version: NoteVersion): boolean {
    return this.selectedVersion()?.id === version.id;
  }

  /**
   * Check if version is selected for comparison
   */
  isSelectedForCompare(version: NoteVersion): boolean {
    return this.compareVersion1()?.id === version.id || 
           this.compareVersion2()?.id === version.id;
  }

  /**
   * Get compare selection number (1 or 2)
   */
  getCompareNumber(version: NoteVersion): number | null {
    if (this.compareVersion1()?.id === version.id) return 1;
    if (this.compareVersion2()?.id === version.id) return 2;
    return null;
  }

  /**
   * Format date
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
   * Format full date
   */
  formatFullDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
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
   * Get trigger icon
   */
  getTriggerIcon(trigger: VersionTrigger): string {
    switch (trigger) {
      case VersionTrigger.Milestone:
        return '⭐';
      case VersionTrigger.Manual:
        return '📸';
      case VersionTrigger.Auto:
        return '💾';
      case VersionTrigger.BeforeRestore:
        return '🔄';
      case VersionTrigger.Session:
        return '✏️';
      default:
        return '📝';
    }
  }

  /**
   * Get change summary
   */
  getChangeSummary(version: NoteVersion): string {
    const changes = version.changesSummary;
    const parts: string[] = [];
    
    if (changes.titleChanged) parts.push('Title');
    if (changes.contentChanged) parts.push('Content');
    if (changes.typeChanged) parts.push('Type');
    if (changes.tagsChanged) parts.push('Tags');
    if (changes.blocksChanged) parts.push('Blocks');
    
    return parts.length > 0 ? parts.join(', ') : 'No changes';
  }

  /**
   * Close panel
   */
  closePanel(): void {
    this.close.emit();
  }

  /**
   * Track by version ID
   */
  trackByVersionId(index: number, version: NoteVersion): string {
    return version.id;
  }
}
