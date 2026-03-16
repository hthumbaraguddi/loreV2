import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';

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

  @Output() searchChanged = new EventEmitter<string>();
  @Output() addSection = new EventEmitter<void>();
  @Output() addNote = new EventEmitter<void>();
  @Output() openTemplates = new EventEmitter<void>();

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
}
