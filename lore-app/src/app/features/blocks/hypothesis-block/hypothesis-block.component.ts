import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Block } from '../../../core/models/shelf.model';

@Component({
  selector: 'lore-hypothesis-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="blk-callout hyp">
      <div class="blk-ico">💡</div>
      <div class="blk-body">
        <div class="blk-lbl">Hypothesis</div>
        <div
          class="blk-txt"
          [contentEditable]="!readOnly()"
          [attr.data-placeholder]="'State your hypothesis…'"
          (input)="onInput($event)"
          [innerHTML]="block().content"
        ></div>
      </div>
    </div>
  `,
  styles: [`
    .blk-callout {
      display: flex; gap: 10px;
      border-left: 3px solid;
      border-radius: 0 var(--lore-radius-md) var(--lore-radius-md) 0;
      padding: 11px 13px;
    }
    .hyp { background: var(--lore-primitive-yellow-50); border-color: var(--lore-primitive-yellow-600); }
    .blk-ico { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
    .blk-body { flex: 1; }
    .blk-lbl {
      font-size: 9.5px; font-weight: 600; letter-spacing: 0.1em;
      text-transform: uppercase; font-family: 'JetBrains Mono', monospace;
      margin-bottom: 4px; color: var(--lore-primitive-yellow-600);
    }
    .blk-txt {
      border: none; background: transparent; outline: none;
      font-family: 'Lora', serif; font-size: 14px; font-style: italic;
      line-height: 1.65; color: var(--lore-color-text-muted); width: 100%;
      min-height: 14px;
      &:empty::before { content: attr(data-placeholder); color: var(--lore-color-text-faint); }
    }
  `]
})
export class HypothesisBlockComponent {
  block = input.required<Block>();
  readOnly = input(false);
  changed = output<{ blockId: string; content: string }>();
  onInput(e: Event): void {
    this.changed.emit({ blockId: this.block().id, content: (e.target as HTMLElement).innerHTML });
  }
}
