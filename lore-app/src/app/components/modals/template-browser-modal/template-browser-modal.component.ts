import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SECTION_COLORS } from '../../../models';
import { TemplateDefinition } from '../../../services/template.service';

@Component({
  selector: 'app-template-browser-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-browser-modal.component.html',
  styleUrls: ['./template-browser-modal.component.scss']
})
export class TemplateBrowserModalComponent {
  @Input() templates: TemplateDefinition[] = [];
  @Output() selected = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() buildTemplate = new EventEmitter<void>();
  @Output() importTemplate = new EventEmitter<void>();

  readonly colors = SECTION_COLORS;

  getColor(colorKey: string) {
    return this.colors[colorKey] || this.colors['gray'];
  }

  select(templateId: string): void {
    this.selected.emit(templateId);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  onBuildTemplate(): void {
    this.buildTemplate.emit();
  }

  onImportTemplate(): void {
    this.importTemplate.emit();
  }
}
