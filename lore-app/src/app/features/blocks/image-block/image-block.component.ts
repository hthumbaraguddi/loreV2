import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Block } from '../../../core/models/shelf.model';

@Component({
  selector: 'lore-image-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="block-image">
      @if (block().content) {
        <figure>
          <img [src]="block().content" [alt]="block().metadata?.['alt'] || ''" />
          @if (block().metadata?.['caption']) {
            <figcaption>{{ block().metadata?.['caption'] }}</figcaption>
          }
        </figure>
      } @else if (!readOnly()) {
        <div class="image-placeholder" (click)="triggerUpload()">
          <span class="material-symbols-outlined">add_photo_alternate</span>
          <p>Click to add an image</p>
          <p class="hint">Paste a URL or upload a file</p>
          <input #fileInput type="file" accept="image/*" (change)="onFile($event)" style="display:none" />
        </div>
      }
    </div>
  `,
  styles: [`
    .block-image { text-align: center; }
    img { max-width: 100%; border-radius: var(--lore-radius-md); }
    figcaption { font-size: var(--lore-font-size-sm); color: var(--lore-color-text-muted); margin-top: var(--lore-space-8); }
    .image-placeholder {
      border: 2px dashed var(--lore-color-border); border-radius: var(--lore-radius-md);
      padding: var(--lore-space-32); cursor: pointer; color: var(--lore-color-text-muted);
      &:hover { border-color: var(--lore-color-accent); background: var(--lore-color-accent-subtle); }
      .material-symbols-outlined { font-size: 40px; margin-bottom: var(--lore-space-8); }
      p { margin: 0 0 var(--lore-space-4); }
      .hint { font-size: var(--lore-font-size-sm); }
    }
  `]
})
export class ImageBlockComponent {
  block = input.required<Block>();
  readOnly = input(false);
  changed = output<{ blockId: string; content: string }>();

  triggerUpload(): void {
    const url = prompt('Enter image URL:');
    if (url) this.changed.emit({ blockId: this.block().id, content: url });
  }

  onFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.changed.emit({ blockId: this.block().id, content: reader.result as string });
    reader.readAsDataURL(file);
  }
}
