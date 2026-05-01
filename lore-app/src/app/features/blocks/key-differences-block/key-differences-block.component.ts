import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Block } from '../../../core/models/shelf.model';

interface DiffRow { left: string; right: string; }

@Component({
  selector: 'lore-key-differences-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="blk-keydiff">
      <!-- Column headers -->
      <div class="kd-hdr">
        <div class="kd-col-hdr">
          <input
            [value]="headers().left"
            (input)="onHeaderInput($event, 'left')"
            [readOnly]="readOnly()"
            placeholder="Option A"
          />
        </div>
        <div class="kd-col-hdr">
          <input
            [value]="headers().right"
            (input)="onHeaderInput($event, 'right')"
            [readOnly]="readOnly()"
            placeholder="Option B"
          />
        </div>
      </div>
      <!-- Rows -->
      <div class="kd-body">
        <div class="kd-col">
          @for (row of rows(); track $index) {
            <div class="kd-row">
              <div class="kd-dot"></div>
              <div
                class="kd-inp"
                [contentEditable]="!readOnly()"
                (input)="onCellInput($event, $index, 'left')"
                [innerHTML]="row.left"
                [attr.data-placeholder]="'Point ' + ($index + 1) + '…'"
              ></div>
            </div>
          }
        </div>
        <div class="kd-col">
          @for (row of rows(); track $index) {
            <div class="kd-row">
              <div class="kd-dot"></div>
              <div
                class="kd-inp"
                [contentEditable]="!readOnly()"
                (input)="onCellInput($event, $index, 'right')"
                [innerHTML]="row.right"
                [attr.data-placeholder]="'Point ' + ($index + 1) + '…'"
              ></div>
            </div>
          }
        </div>
      </div>
      @if (!readOnly()) {
        <button class="kd-add" (click)="addRow()">+ Add row</button>
      }
    </div>
  `,
  styles: [`
    .blk-keydiff {
      border: 1px solid var(--lore-color-border-strong);
      border-radius: var(--lore-radius-md); overflow: hidden;
    }
    .kd-hdr { display: flex; background: var(--lore-primitive-purple-50); border-bottom: 1px solid var(--lore-color-border-strong); }
    .kd-col-hdr {
      flex: 1; padding: 6px 10px;
      font-size: 10.5px; font-weight: 600; color: var(--lore-primitive-purple-600);
      font-family: 'JetBrains Mono', monospace;
      border-right: 1px solid var(--lore-color-border-strong);
      &:last-child { border-right: none; }
      input {
        border: none; background: transparent; outline: none;
        font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
        font-weight: 600; color: inherit; width: 100%;
      }
    }
    .kd-body { display: flex; }
    .kd-col { flex: 1; border-right: 1px solid var(--lore-color-border-strong); &:last-child { border-right: none; } }
    .kd-row {
      display: flex; gap: 7px; padding: 6px 10px;
      border-bottom: 1px solid var(--lore-color-border-default);
      font-size: 13.5px; color: var(--lore-color-text-muted); align-items: flex-start;
      &:last-child { border-bottom: none; }
    }
    .kd-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--lore-primitive-purple-400); flex-shrink: 0; margin-top: 7px; }
    .kd-inp {
      border: none; background: transparent; outline: none;
      font-family: 'Lora', serif; font-size: 13.5px; color: var(--lore-color-text-muted);
      width: 100%; line-height: 1.6; min-height: 20px;
      &:empty::before { content: attr(data-placeholder); color: var(--lore-color-text-faint); }
    }
    .kd-add {
      width: 100%; padding: 6px; border: none; background: var(--lore-primitive-purple-50);
      border-top: 1px solid var(--lore-color-border-default);
      font-size: 11px; color: var(--lore-color-text-faint); cursor: pointer;
      &:hover { color: var(--lore-primitive-purple-600); }
    }
  `]
})
export class KeyDifferencesBlockComponent {
  block = input.required<Block>();
  readOnly = input(false);
  changed = output<{ blockId: string; content: string }>();

  headers = signal({ left: 'Option A', right: 'Option B' });
  rows = signal<DiffRow[]>([{ left: '', right: '' }, { left: '', right: '' }]);

  ngOnInit(): void {
    try {
      const data = JSON.parse(this.block().content || '{}');
      if (data.headers) this.headers.set(data.headers);
      if (data.rows) this.rows.set(data.rows);
    } catch { /* use defaults */ }
  }

  onHeaderInput(e: Event, side: 'left' | 'right'): void {
    this.headers.set({ ...this.headers(), [side]: (e.target as HTMLInputElement).value });
    this.emit();
  }

  onCellInput(e: Event, index: number, side: 'left' | 'right'): void {
    const rows = this.rows().map((r, i) =>
      i === index ? { ...r, [side]: (e.target as HTMLElement).innerHTML } : r
    );
    this.rows.set(rows);
    this.emit();
  }

  addRow(): void {
    this.rows.set([...this.rows(), { left: '', right: '' }]);
    this.emit();
  }

  private emit(): void {
    this.changed.emit({ blockId: this.block().id, content: JSON.stringify({ headers: this.headers(), rows: this.rows() }) });
  }
}
