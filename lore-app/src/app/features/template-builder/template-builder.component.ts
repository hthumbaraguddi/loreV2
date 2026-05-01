import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { BlockType } from '../../core/models/shelf.model';
import { TemplateService, Template, TemplateBlock } from '../../core/services/template.service';

// Reuse interfaces from TemplateService

@Component({
  selector: 'lore-template-builder',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './template-builder.component.html',
  styleUrl: './template-builder.component.scss'
})
export class TemplateBuilderComponent {
  private templateService = inject(TemplateService);
  
  // Template state
  templateName = signal('');
  templateDescription = signal('');
  templateCategory = signal('Research');
  templateNoteType = signal('Research');
  
  // Available block palette
  paletteBlocks = signal<TemplateBlock[]>([
    { id: 'pal_hyp', type: BlockType.Hypothesis, name: 'Hypothesis', description: 'Core assumption', icon: '💡', required: false, order: 0 },
    { id: 'pal_con', type: BlockType.Conclusion, name: 'Conclusion', description: 'Key takeaway', icon: '🎯', required: false, order: 1 },
    { id: 'pal_note', type: BlockType.Note, name: 'Note / Insight', description: 'Standalone insight', icon: '📝', required: false, order: 2 },
    { id: 'pal_warn', type: BlockType.Warning, name: 'Warning', description: 'Risk or caveat', icon: '⚠️', required: false, order: 3 },
    { id: 'pal_kd', type: BlockType.KeyDifferences, name: 'Key Differences', description: 'Side-by-side table', icon: '⚡', required: false, order: 4 },
    { id: 'pal_kf', type: BlockType.KeyFindings, name: 'Key Findings', description: 'Numbered list', icon: '🔑', required: false, order: 5 },
    { id: 'pal_check', type: BlockType.Checklist, name: 'Checklist', description: 'Interactive tasks', icon: '✅', required: false, order: 6 },
    { id: 'pal_code', type: BlockType.Code, name: 'Code Block', description: 'Syntax highlighted', icon: '💻', required: false, order: 7 },
    { id: 'pal_ai', type: BlockType.AskClaude, name: 'Ask Claude', description: 'Inline AI prompt', icon: '✦', required: false, order: 8 },
    { id: 'pal_img', type: BlockType.Image, name: 'Image', description: 'Upload or paste', icon: '🖼️', required: false, order: 9 },
    { id: 'pal_div', type: BlockType.Divider, name: 'Divider', description: 'Horizontal rule', icon: '—', required: false, order: 10 }
  ]);

  // Template canvas blocks
  canvasBlocks = signal<TemplateBlock[]>([]);

  // Categories and note types from service
  categories = this.templateService.categories;
  noteTypes = this.templateService.noteTypes;

  // ─── Palette drag handlers ──────────────────────────────────────

  onPaletteDragStart(event: DragEvent, block: TemplateBlock): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('application/lore-template-block', JSON.stringify(block));
    event.dataTransfer.effectAllowed = 'copy';
  }

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault();
    const canvas = event.currentTarget as HTMLElement;
    canvas.classList.add('drag-over');
  }

  onCanvasDragLeave(event: DragEvent): void {
    const canvas = event.currentTarget as HTMLElement;
    canvas.classList.remove('drag-over');
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    const canvas = event.currentTarget as HTMLElement;
    canvas.classList.remove('drag-over');

    try {
      const blockData = event.dataTransfer?.getData('application/lore-template-block');
      if (blockData) {
        const block = JSON.parse(blockData) as TemplateBlock;
        this.addBlockToCanvas(block);
      }
    } catch (error) {
      console.error('Failed to parse dropped block:', error);
    }
  }

  // ─── Canvas block handlers ──────────────────────────────────────

  addBlockToCanvas(sourceBlock: TemplateBlock): void {
    const newBlock: TemplateBlock = {
      ...sourceBlock,
      id: `tbl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      order: this.canvasBlocks().length
    };
    
    this.canvasBlocks.update(blocks => [...blocks, newBlock]);
  }

  removeBlockFromCanvas(blockId: string): void {
    this.canvasBlocks.update(blocks => blocks.filter(b => b.id !== blockId));
  }

  toggleBlockRequired(blockId: string): void {
    this.canvasBlocks.update(blocks =>
      blocks.map(b => b.id === blockId ? { ...b, required: !b.required } : b)
    );
  }

  onCanvasDropReorder(event: CdkDragDrop<TemplateBlock[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    
    const blocks = [...this.canvasBlocks()];
    moveItemInArray(blocks, event.previousIndex, event.currentIndex);
    
    // Update order property
    const reordered = blocks.map((b, i) => ({ ...b, order: i }));
    this.canvasBlocks.set(reordered);
  }

  // ─── Template actions ──────────────────────────────────────────

  clearCanvas(): void {
    this.canvasBlocks.set([]);
  }

  saveTemplate(): void {
    if (!this.templateName().trim()) {
      alert('Please enter a template name');
      return;
    }

    const template = this.templateService.createTemplate({
      name: this.templateName(),
      description: this.templateDescription(),
      category: this.templateCategory(),
      noteType: this.templateNoteType(),
      blocks: this.canvasBlocks()
    });

    alert(`Template "${template.name}" saved with ${template.blocks.length} blocks`);
    
    // Reset form
    this.templateName.set('');
    this.templateDescription.set('');
    this.templateCategory.set('Research');
    this.templateNoteType.set('Research');
    this.canvasBlocks.set([]);
  }

  // ─── Utilities ──────────────────────────────────────────────────

  getBlockCount(): number {
    return this.canvasBlocks().length;
  }

  getRequiredBlockCount(): number {
    return this.canvasBlocks().filter(b => b.required).length;
  }
}