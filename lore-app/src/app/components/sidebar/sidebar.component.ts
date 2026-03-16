import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppState, Shelf, Notebook } from '../../models';
import { DataService } from '../../services/data.service';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, LoreIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() state!: AppState;
  @Input() displayName: string = '';

  @Output() notebookSelected = new EventEmitter<Notebook>();
  @Output() addShelf = new EventEmitter<void>();
  @Output() addNotebook = new EventEmitter<Shelf>();
  @Output() editShelf = new EventEmitter<Shelf>();
  @Output() editNotebook = new EventEmitter<Notebook>();
  @Output() openSettings = new EventEmitter<void>();
  @Output() openTemplates = new EventEmitter<void>();
  @Output() openTemplateBuilder = new EventEmitter<void>();
  @Output() openImportTemplate = new EventEmitter<void>();

  private data = inject(DataService);

  get userInitial(): string {
    return this.displayName ? this.displayName.charAt(0).toUpperCase() : '?';
  }

  getNotebooksForShelf(shelfId: string): Notebook[] {
    return this.state?.notebooks?.filter(nb => nb.shelfId === shelfId) ?? [];
  }

  isActiveNotebook(notebookId: string): boolean {
    return this.state?.activeNotebookId === notebookId;
  }

  onToggleSidebar(): void {
    this.data.toggleSidebar();
  }

  onToggleShelf(shelf: Shelf, event: Event): void {
    event.stopPropagation();
    this.data.toggleShelf(shelf.id);
  }

  onSelectNotebook(notebook: Notebook): void {
    this.data.setActiveNotebook(notebook.id);
    this.notebookSelected.emit(notebook);
  }

  onAddShelf(): void {
    this.addShelf.emit();
  }

  onAddNotebook(shelf: Shelf, event: Event): void {
    event.stopPropagation();
    this.addNotebook.emit(shelf);
  }

  onEditShelf(shelf: Shelf, event: Event): void {
    event.stopPropagation();
    this.editShelf.emit(shelf);
  }

  onEditNotebook(notebook: Notebook, event: Event): void {
    event.stopPropagation();
    this.editNotebook.emit(notebook);
  }

  onOpenSettings(): void {
    this.openSettings.emit();
  }

  onOpenTemplates(): void {
    this.openTemplates.emit();
  }

  onOpenTemplateBuilder(): void {
    this.openTemplateBuilder.emit();
  }

  onOpenImportTemplate(): void {
    this.openImportTemplate.emit();
  }
}
