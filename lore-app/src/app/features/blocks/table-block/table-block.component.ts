import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Block } from '../../../core/models/shelf.model';

@Component({
  selector: 'lore-table-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="blk-table">
      <div class="tbl-header">
        <span class="tbl-title">Table</span>
        @if (!readOnly()) {
          <div class="tbl-actions">
            <button class="tbl-action" type="button" (click)="addRow()">
              + Row
            </button>
            <button class="tbl-action" type="button" (click)="addColumn()">
              + Col
            </button>
          </div>
        }
      </div>

      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              @for (header of headers(); track header; let colIndex = $index) {
                <th
                  [contentEditable]="!readOnly()"
                  [innerHTML]="header"
                  (input)="onHeaderInput($event, colIndex)"
                  [attr.data-placeholder]="'Header ' + (colIndex + 1)"
                ></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row; let rowIndex = $index) {
              <tr>
                @for (cell of row; track cell; let colIndex = $index) {
                  <td
                    [contentEditable]="!readOnly()"
                    [innerHTML]="cell"
                    (input)="onCellInput($event, rowIndex, colIndex)"
                    [attr.data-placeholder]="
                      'Cell ' + (rowIndex + 1) + ', ' + (colIndex + 1)
                    "
                  ></td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .blk-table {
        width: 100%;
        overflow-x: auto;
        border: 1px solid var(--lore-color-border);
        border-radius: var(--lore-radius-lg);
        background: var(--lore-color-bg-surface);
        padding: var(--lore-space-16);
      }

      .tbl-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--lore-space-12);
        gap: var(--lore-space-8);
      }

      .tbl-title {
        font-size: var(--lore-font-size-sm);
        font-weight: 600;
        color: var(--lore-color-text-muted);
      }

      .tbl-actions {
        display: flex;
        gap: 8px;
      }

      .tbl-action {
        border: 1px solid var(--lore-color-border);
        border-radius: var(--lore-radius-sm);
        background: var(--lore-color-bg-surface-2);
        color: var(--lore-color-text-default);
        padding: 6px 10px;
        cursor: pointer;
        font-size: 12px;
      }

      .tbl-wrap {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 420px;
      }

      th,
      td {
        border: 1px solid var(--lore-color-border);
        padding: 10px 12px;
        min-width: 120px;
        vertical-align: top;
        font-size: 14px;
        line-height: 1.6;
        background: var(--lore-color-bg-surface);
        outline: none;
      }

      th {
        background: var(--lore-color-bg-surface-2);
        font-weight: 600;
        color: var(--lore-color-text-default);
      }

      td:empty::before,
      th:empty::before {
        content: attr(data-placeholder);
        color: var(--lore-color-text-faint);
      }

      td[contenteditable='true'],
      th[contenteditable='true'] {
        cursor: text;
      }
    `,
  ],
})
export class TableBlockComponent implements OnInit {
  block = input.required<Block>();
  readOnly = input(false);
  changed = output<{ blockId: string; metadata: Record<string, any> }>();

  headers = signal<string[]>(['Column 1', 'Column 2']);
  rows = signal<string[][]>([['', '']]);

  ngOnInit(): void {
    const metadata = (this.block().metadata ?? {}) as {
      headers?: string[];
      rows?: string[][];
    };
    this.headers.set(
      Array.isArray(metadata.headers) && metadata.headers.length
        ? metadata.headers
        : ['Column 1', 'Column 2'],
    );
    this.rows.set(
      Array.isArray(metadata.rows) && metadata.rows.length
        ? metadata.rows
        : [['', '']],
    );
  }

  onHeaderInput(event: Event, index: number): void {
    const text = (event.target as HTMLElement).innerText;
    this.headers.set(
      this.headers().map((header, idx) => (idx === index ? text : header)),
    );
    this.emitChange();
  }

  onCellInput(event: Event, rowIndex: number, colIndex: number): void {
    const text = (event.target as HTMLElement).innerText;
    this.rows.set(
      this.rows().map((row, rIdx) =>
        rIdx !== rowIndex
          ? row
          : row.map((cell, cIdx) => (cIdx === colIndex ? text : cell)),
      ),
    );
    this.emitChange();
  }

  addRow(): void {
    const newRow = this.headers().map(() => '');
    this.rows.set([...this.rows(), newRow]);
    this.emitChange();
  }

  addColumn(): void {
    this.headers.set([
      ...this.headers(),
      `Column ${this.headers().length + 1}`,
    ]);
    this.rows.set(this.rows().map((row) => [...row, '']));
    this.emitChange();
  }

  private emitChange(): void {
    this.changed.emit({
      blockId: this.block().id,
      metadata: { headers: this.headers(), rows: this.rows() },
    });
  }
}
