import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromptService } from '../../../services/prompt.service';
import { SavedPrompt } from '../../../models';
import { LoreIconComponent } from '../../lore-icon/lore-icon.component';

@Component({
  selector: 'app-prompt-library-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LoreIconComponent],
  templateUrl: './prompt-library-modal.component.html',
  styleUrls: ['./prompt-library-modal.component.scss'],
})
export class PromptLibraryModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() runPrompt = new EventEmitter<SavedPrompt>();

  @ViewChild('importInput') importInput!: ElementRef<HTMLInputElement>;

  prompts: SavedPrompt[] = [];
  searchQuery = '';

  showNewForm = false;
  newName = '';
  newCategory = '';
  newBody = '';

  expandedHistoryId: string | null = null;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.prompts = this.promptService.getAll();
  }

  constructor(private promptService: PromptService) {}

  get categories(): string[] {
    const cats = new Set(this.filtered.map(p => p.category));
    return Array.from(cats).sort();
  }

  get filtered(): SavedPrompt[] {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.prompts;
    return this.prompts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  promptsForCategory(cat: string): SavedPrompt[] {
    return this.filtered.filter(p => p.category === cat);
  }

  formatDate(ts: number | null): string {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  onRun(p: SavedPrompt): void {
    this.runPrompt.emit(p);
  }

  onDuplicate(p: SavedPrompt): void {
    this.promptService.duplicate(p.id);
    this.refresh();
  }

  onExport(p: SavedPrompt): void {
    this.promptService.exportPrompt(p.id);
  }

  onDelete(p: SavedPrompt): void {
    if (p.isBuiltIn) return;
    this.promptService.delete(p.id);
    this.refresh();
  }

  onImportClick(): void {
    this.importInput?.nativeElement.click();
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        this.promptService.importPrompt(json);
        this.refresh();
      } catch {
        // silently ignore bad files
      }
      input.value = '';
    };
    reader.readAsText(file);
  }

  onNewPrompt(): void {
    this.showNewForm = true;
    this.newName = '';
    this.newCategory = '';
    this.newBody = '';
  }

  onSaveNew(): void {
    if (!this.newName.trim() || !this.newBody.trim()) return;
    const vars = this.promptService.extractVariables(this.newBody);
    const prompt: SavedPrompt = {
      id: `prompt-${Date.now()}`,
      name: this.newName.trim(),
      category: this.newCategory.trim() || 'General',
      body: this.newBody.trim(),
      variables: vars,
      lastRunValues: {},
      defaultTarget: { shelfId: '', notebookId: '', sectionId: '' },
      lastRunAt: null,
      isBuiltIn: false,
      createdAt: Date.now(),
    };
    this.promptService.save(prompt);
    this.refresh();
    this.showNewForm = false;
  }

  onCancelNew(): void {
    this.showNewForm = false;
  }

  getRunCount(promptId: string): number {
    return this.promptService.getRunHistory(promptId).length;
  }

  getRunHistory(promptId: string) {
    return this.promptService.getRunHistory(promptId);
  }

  toggleHistory(promptId: string): void {
    this.expandedHistoryId = this.expandedHistoryId === promptId ? null : promptId;
  }

  close(): void {
    this.closed.emit();
  }
}
