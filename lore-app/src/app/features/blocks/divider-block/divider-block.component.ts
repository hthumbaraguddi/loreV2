import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Block } from '../../../core/models/shelf.model';

@Component({
  selector: 'lore-divider-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<hr class="block-divider" />`,
  styles: [`.block-divider { border: none; border-top: 1px solid var(--lore-color-border); margin: var(--lore-space-8) 0; }`]
})
export class DividerBlockComponent {
  block = input.required<Block>();
  readOnly = input(false);
}
