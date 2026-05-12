import { Component, input, output } from '@angular/core';
import { Block } from '../../../core/models/shelf.model';
import { AskAiBlockComponent } from '../ask-ai-block/ask-ai-block.component';

/**
 * AskClaudeBlockComponent
 *
 * Thin wrapper around AskAiBlockComponent that hard-wires the provider to
 * 'anthropic'. All streaming, history, and copy logic lives in AskAiBlockComponent.
 */
@Component({
  selector: 'lore-ask-claude-block',
  standalone: true,
  imports: [AskAiBlockComponent],
  template: `
    <lore-ask-ai-block
      [block]="block()"
      [provider]="'anthropic'"
      [readOnly]="readOnly()"
      (changed)="changed.emit($event)"
    ></lore-ask-ai-block>
  `
})
export class AskClaudeBlockComponent {
  block    = input.required<Block>();
  readOnly = input(false);
  changed  = output<{ blockId: string; content: string }>();
}