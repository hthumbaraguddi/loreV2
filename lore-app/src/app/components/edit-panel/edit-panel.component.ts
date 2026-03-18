import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Note } from '../../models';
import { TemplateService, TemplateDefinition } from '../../services/template.service';
import { PasteAiResponseModalComponent } from '../modals/paste-ai-response-modal/paste-ai-response-modal.component';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';

@Component({
  selector: 'app-edit-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, PasteAiResponseModalComponent, LoreIconComponent],
  templateUrl: './edit-panel.component.html',
  styleUrls: ['./edit-panel.component.scss'],
})
export class EditPanelComponent implements OnChanges {
  @Input() note: Note | null = null;
  @Input() sectionId: string | null = null;
  @Input() notebookId: string | null = null;
  @Input() isOpen: boolean = false;

  @Output() saved = new EventEmitter<{ title: string; templateId: string; data: Record<string, any> }>();
  @Output() deleted = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private sanitizer = inject(DomSanitizer);
  private templateService = inject(TemplateService);

  templates: TemplateDefinition[] = [];
  selectedTemplate: TemplateDefinition | null = null;
  noteTitle: string = '';
  formHtml: SafeHtml = '';
  pasteModalOpen = false;

  get pasteTarget(): { notebookId: string; sectionId: string } | null {
    return this.notebookId && this.sectionId
      ? { notebookId: this.notebookId, sectionId: this.sectionId }
      : null;
  }

  get isEdit(): boolean {
    return !!this.note;
  }

  get panelTitle(): string {
    return this.isEdit ? 'Edit Note' : 'New Note';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.templates = this.templateService.getTemplates();
      this.initPanel();
    }
  }

  private initPanel(): void {
    this.templates = this.templateService.getTemplates();

    if (this.note) {
      // Editing existing note — pre-select its template
      this.noteTitle = this.note.title;
      const tpl = this.templates.find(t => t.id === this.note!.templateId) ?? this.templates[0];
      this.selectTemplate(tpl, this.note.data);
    } else {
      // New note — select first template, empty form
      this.noteTitle = '';
      this.selectTemplate(this.templates[0] ?? null, undefined);
    }
  }

  selectTemplate(tpl: TemplateDefinition | null, data?: Record<string, any>): void {
    this.selectedTemplate = tpl;
    if (tpl) {
      const html = tpl.buildForm(data);
      this.formHtml = this.sanitizer.bypassSecurityTrustHtml(html);
    } else {
      this.formHtml = '';
    }
  }

  onChipClick(tpl: TemplateDefinition): void {
    // When switching templates while editing, preserve existing data only if same template
    const existingData = this.note && this.selectedTemplate?.id === tpl.id ? this.note.data : undefined;
    this.selectTemplate(tpl, existingData);
  }

  onSave(): void {
    if (!this.selectedTemplate) return;
    const data = this.selectedTemplate.readForm();
    const title = this.selectedTemplate.id === 'rich'
      ? (data['title'] as string || 'Untitled Note')
      : this.noteTitle.trim();
    this.saved.emit({ title, templateId: this.selectedTemplate.id, data });
  }

  onDelete(): void {
    this.deleted.emit();
  }

  onClose(): void {
    this.closed.emit();
  }

  openPasteModal(): void {
    this.pasteModalOpen = true;
  }

  templateIcon(tpl: TemplateDefinition): string {
    const map: Record<string, string> = {
      rich:       'note',
      research:   'lightbulb',
      finance:    'chart-bar',
      watchlist:  'bookmark',
      journal:    'calendar',
      scrum:      'milestone',
      investing:  'inv-chart',
    };
    return map[tpl.id] ?? 'template';
  }

  onPasteModalClosed(): void {
    this.pasteModalOpen = false;
  }

  onPasteNoteSaved(): void {
    this.pasteModalOpen = false;
    this.closed.emit();
  }
}
