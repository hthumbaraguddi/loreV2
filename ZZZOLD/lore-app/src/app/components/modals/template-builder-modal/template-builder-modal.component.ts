import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomTemplate, TemplateField, SECTION_COLORS } from '../../../models';

export interface FieldTypeMeta {
  type: string;
  label: string;
  icon: string;
  desc: string;
}

export const FIELD_TYPES: FieldTypeMeta[] = [
  { type: 'text',      label: 'Short Text',  icon: '📝', desc: 'Single line input' },
  { type: 'textarea',  label: 'Long Text',   icon: '📄', desc: 'Multi-line text area' },
  { type: 'date',      label: 'Date',        icon: '📅', desc: 'Date picker' },
  { type: 'select',    label: 'Dropdown',    icon: '🔽', desc: 'Choose from options' },
  { type: 'rating',    label: 'Rating',      icon: '⭐', desc: '1–5 star rating' },
  { type: 'list',      label: 'List',        icon: '📋', desc: 'Add multiple items' },
  { type: 'checklist', label: 'Checklist',   icon: '☑️',  desc: 'Checkable list items' },
];

const BUILDER_ICONS = [
  '📋', '📓', '🗒️', '💡', '🎯', '🌟', '📊', '🎬', '🎨', '🏋️',
  '🍕', '✈️', '💻', '🔬', '📷', '🎵', '🏠', '💰', '📚', '🤝'
];

@Component({
  selector: 'app-template-builder-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './template-builder-modal.component.html',
  styleUrls: ['./template-builder-modal.component.scss']
})
export class TemplateBuilderModalComponent implements OnChanges {
  @Input() template: CustomTemplate | null = null;
  @Output() saved = new EventEmitter<CustomTemplate>();
  @Output() cancelled = new EventEmitter<void>();

  // Template meta
  templateName = '';
  templateIcon = '📋';
  templateColor = 'purple';

  // Fields list (working copy)
  fields: TemplateField[] = [];

  // Add/edit field form state
  showAddForm = false;
  editFieldIndex = -1;
  newFieldLabel = '';
  newFieldPlaceholder = '';
  newFieldType: TemplateField['type'] = 'text';
  newFieldRequired = false;
  newFieldOptions: string[] = [];
  newOptionText = '';

  readonly fieldTypes = FIELD_TYPES;
  readonly builderIcons = BUILDER_ICONS;
  readonly colorKeys = Object.keys(SECTION_COLORS);
  readonly colors = SECTION_COLORS;

  get isEdit(): boolean { return !!this.template; }
  get modalTitle(): string { return this.isEdit ? '✏️ Edit Template' : '🧩 Build a Template'; }
  get isAddFormOpen(): boolean { return this.showAddForm || this.editFieldIndex >= 0; }
  get addFormTitle(): string { return this.editFieldIndex >= 0 ? 'Edit Field' : 'Add New Field'; }
  get addFormButtonLabel(): string { return this.editFieldIndex >= 0 ? 'Update Field' : 'Add Field'; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['template']) {
      if (this.template) {
        this.templateName = this.template.name;
        this.templateIcon = this.template.icon;
        this.templateColor = this.template.color;
        this.fields = JSON.parse(JSON.stringify(this.template.fields));
      } else {
        this.templateName = '';
        this.templateIcon = '📋';
        this.templateColor = 'purple';
        this.fields = [
          { id: 'title', type: 'text', label: 'Title', placeholder: '', required: true }
        ];
      }
      this.resetAddForm();
    }
  }

  // ── Icon / Color pickers ──────────────────────────────

  pickIcon(icon: string): void {
    this.templateIcon = icon;
  }

  pickColor(color: string): void {
    this.templateColor = color;
  }

  // ── Field list actions ────────────────────────────────

  moveField(index: number, dir: -1 | 1): void {
    const j = index + dir;
    if (j <= 0 || j >= this.fields.length) return; // index 0 is locked title
    [this.fields[index], this.fields[j]] = [this.fields[j], this.fields[index]];
  }

  removeField(index: number): void {
    this.fields.splice(index, 1);
  }

  startEditField(index: number): void {
    const f = this.fields[index];
    this.editFieldIndex = index;
    this.showAddForm = false;
    this.newFieldLabel = f.label;
    this.newFieldPlaceholder = f.placeholder || '';
    this.newFieldType = f.type;
    this.newFieldRequired = f.required || false;
    this.newFieldOptions = f.options ? [...f.options] : [];
  }

  startAddField(): void {
    this.showAddForm = true;
    this.editFieldIndex = -1;
    this.newFieldLabel = '';
    this.newFieldPlaceholder = '';
    this.newFieldType = 'text';
    this.newFieldRequired = false;
    this.newFieldOptions = [];
  }

  cancelField(): void {
    this.resetAddForm();
  }

  confirmField(): void {
    const label = this.newFieldLabel.trim();
    if (!label) return;

    const options = this.newFieldType === 'select'
      ? this.newFieldOptions.filter(o => o.trim())
      : undefined;

    if (this.editFieldIndex >= 0) {
      const f = this.fields[this.editFieldIndex];
      f.label = label;
      f.placeholder = this.newFieldPlaceholder.trim();
      f.type = this.newFieldType;
      f.required = this.newFieldRequired;
      if (options !== undefined) f.options = options; else delete f.options;
    } else {
      const fid = label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36);
      const newField: TemplateField = {
        id: fid,
        type: this.newFieldType,
        label,
        placeholder: this.newFieldPlaceholder.trim(),
        required: this.newFieldRequired,
      };
      if (options !== undefined) newField.options = options;
      this.fields.push(newField);
    }

    this.resetAddForm();
  }

  // ── Select options management ─────────────────────────

  addOption(): void {
    const opt = this.newOptionText.trim();
    if (opt) {
      this.newFieldOptions.push(opt);
      this.newOptionText = '';
    }
  }

  removeOption(index: number): void {
    this.newFieldOptions.splice(index, 1);
  }

  // ── Save / Cancel ─────────────────────────────────────

  save(): void {
    const name = this.templateName.trim();
    if (!name) return;
    if (this.fields.length <= 1) return; // need at least one field besides title

    const id = this.template?.id || ('ctpl_' + Date.now().toString(36));
    const result: CustomTemplate = {
      id,
      name,
      icon: this.templateIcon,
      color: this.templateColor,
      fields: this.fields,
    };
    this.saved.emit(result);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  // ── Helpers ───────────────────────────────────────────

  getFieldTypeMeta(type: string): FieldTypeMeta {
    return FIELD_TYPES.find(ft => ft.type === type) || FIELD_TYPES[0];
  }

  isFieldLocked(field: TemplateField): boolean {
    return field.id === 'title';
  }

  private resetAddForm(): void {
    this.showAddForm = false;
    this.editFieldIndex = -1;
    this.newFieldLabel = '';
    this.newFieldPlaceholder = '';
    this.newFieldType = 'text';
    this.newFieldRequired = false;
    this.newFieldOptions = [];
    this.newOptionText = '';
  }
}
