import { Component, input, output } from '@angular/core';
import { Block } from '../../../core/models/shelf.model';
import { AskAiBlockComponent } from '../ask-ai-block/ask-ai-block.component';

/**
 * AskGptBlockComponent
 *
 * Thin wrapper around AskAiBlockComponent that hard-wires the provider to
 * 'openai'. All streaming, history, and copy logic lives in AskAiBlockComponent.
 */
@Component({
  selector: 'lore-ask-gpt-block',
  standalone: true,
  imports: [AskAiBlockComponent],
  template: `
    <lore-ask-ai-block
      [block]="block()"
      [provider]="'openai'"
      [readOnly]="readOnly()"
      (changed)="changed.emit($event)"
    ></lore-ask-ai-block>
  `
})
export class AskGptBlockComponent {
  block    = input.required<Block>();
  readOnly = input(false);
  changed  = output<{ blockId: string; content: string }>();
}
