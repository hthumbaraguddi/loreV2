import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';
import { SyncStatus } from '../../services/drive.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, LoreIconComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Input() activeShelfName: string = '';
  @Input() activeNotebookName: string = '';
  @Input() activeNotebookIcon: string = '';
  @Input() hasActiveNotebook: boolean = false;
  @Input() syncStatus: SyncStatus = 'idle';
  @Input() isLocalMode: boolean = false;

  @Output() searchChanged = new EventEmitter<string>();
  @Output() addSection = new EventEmitter<void>();
  @Output() addNote = new EventEmitter<void>();
  @Output() openTemplates = new EventEmitter<void>();
  @Output() saveNow = new EventEmitter<void>();
  @Output() openChat = new EventEmitter<void>();
  @Output() openPrompts = new EventEmitter<void>();
  @Output() openSettings = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  searchValue: string = '';

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(query => {
      this.searchChanged.emit(query);
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(value: string): void {
    this.searchValue = value;
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchValue = '';
    this.searchSubject.next('');
  }

  onAddSection(): void {
    this.addSection.emit();
  }

  onAddNote(): void {
    this.addNote.emit();
  }

  onOpenTemplates(): void {
    this.openTemplates.emit();
  }

  onSaveNow(): void {
    this.saveNow.emit();
  }

  onOpenChat(): void {
    this.openChat.emit();
  }

  onOpenPrompts(): void {
    this.openPrompts.emit();
  }

  onOpenSettings(): void {
    this.openSettings.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }

  get syncLabel(): string {
    if (this.isLocalMode) return 'Saved locally';
    switch (this.syncStatus) {
      case 'syncing': return 'Saving…';
      case 'saved':   return 'Saved';
      case 'error':   return 'Retry save';
      default:        return 'Save';
    }
  }
}
