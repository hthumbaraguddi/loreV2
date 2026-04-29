import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lore-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.width]="size || 16" [attr.height]="size || 16">
      <use [attr.href]="'/assets/icons.svg#' + name"></use>
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    svg { display: block; }
  `]
})
export class LoreIconComponent {
  @Input() name!: string;
  @Input() size?: number;
}
