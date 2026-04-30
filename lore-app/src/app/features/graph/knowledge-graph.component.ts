import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lore-knowledge-graph',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="placeholder">
      <div class="placeholder-content">
        <span class="material-symbols-outlined">hub</span>
        <h2>Knowledge Graph</h2>
        <p>The interactive knowledge graph will be implemented in Phase 10</p>
      </div>
    </div>
  `,
  styles: [`
    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: var(--lore-color-bg-canvas);
    }

    .placeholder-content {
      text-align: center;
      color: var(--lore-color-text-muted);
    }

    .material-symbols-outlined {
      font-size: 64px;
      color: var(--lore-color-icon-muted);
      margin-bottom: var(--lore-space-16);
    }

    h2 {
      font-family: var(--lore-font-serif);
      font-size: var(--lore-font-size-2xl);
      font-weight: 600;
      color: var(--lore-color-text-default);
      margin-bottom: var(--lore-space-8);
    }

    p {
      font-size: var(--lore-font-size-md);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KnowledgeGraphComponent {}
