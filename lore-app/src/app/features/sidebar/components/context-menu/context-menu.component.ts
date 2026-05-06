import { Component, signal, input, output, effect, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ContextMenuTarget {
  type: 'shelf' | 'notebook' | 'note';
  id: string;
  name: string;
}

export interface ContextMenuAction {
  type: 'open' | 'rename' | 'new-notebook' | 'new-note' | 'change-color' | 'delete' | 'version-history';
  target: ContextMenuTarget;
}

/**
 * ContextMenuComponent
 * Right-click context menu for shelf, notebook, and note items
 */
@Component({
  selector: 'lore-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss'
})
export class ContextMenuComponent {
  private elementRef = inject(ElementRef);

  // Inputs
  target = input<ContextMenuTarget | null>(null);
  position = input<{ x: number; y: number } | null>(null);
  open = input<boolean>(false);

  // Outputs
  actionSelected = output<ContextMenuAction>();
  closed = output<void>();

  // Computed label for "Open" action
  getOpenLabel(): string {
    const t = this.target();
    if (!t) return 'Open';
    
    switch (t.type) {
      case 'shelf':
        return 'Expand / Collapse';
      case 'notebook':
        return 'Open Notebook';
      case 'note':
        return 'Open Note';
      default:
        return 'Open';
    }
  }

  // Show "New Notebook" only for shelves
  showNewNotebook(): boolean {
    return this.target()?.type === 'shelf';
  }

  // Show "Version History" only for notes
  showVersionHistory(): boolean {
    return this.target()?.type === 'note';
  }

  constructor() {
    // Position menu when opened
    effect(() => {
      if (this.open() && this.position()) {
        this.positionMenu();
      }
    });

    // Close on Escape key
    effect(() => {
      if (this.open()) {
        const handler = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            this.close();
          }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
      }
      return undefined;
    });
  }

  /**
   * Position menu near click point, ensuring it stays within viewport
   */
  private positionMenu(): void {
    const pos = this.position();
    if (!pos) return;

    const menu = this.elementRef.nativeElement.querySelector('.ctx-menu');
    if (!menu) return;

    const menuWidth = 190;
    const menuHeight = 200;

    const x = Math.min(pos.x, window.innerWidth - menuWidth);
    const y = Math.min(pos.y, window.innerHeight - menuHeight);

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  /**
   * Handle action selection
   */
  onAction(actionType: ContextMenuAction['type']): void {
    const t = this.target();
    if (!t) return;

    this.actionSelected.emit({
      type: actionType,
      target: t
    });

    this.close();
  }

  /**
   * Close menu
   */
  close(): void {
    this.closed.emit();
  }

  /**
   * Prevent menu from closing when clicking inside
   */
  onMenuClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
