import { Component, signal, computed, output, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PROVIDER_REGISTRY, PROVIDER_MAP } from '../../../core/config/provider-registry';
import { ApiKeyManagerService } from '../../../core/services/api-key-manager.service';
import { inject } from '@angular/core';

export interface ProviderSelection {
  providerId: string;
  providerName: string;
}

@Component({
  selector: 'lore-ai-mention-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mention-picker" [style.left.px]="position().x" [style.top.px]="position().y">
      <div class="mention-picker-header">
        <span class="mention-picker-title">Ask AI</span>
        <span class="mention-picker-hint">Select a provider</span>
      </div>
      <div class="mention-picker-list">
        @for (provider of availableProviders(); track provider.id) {
          <button
            class="mention-picker-item"
            [class.disabled]="!hasKey(provider.id)"
            [class.selected]="selectedIndex() === $index"
            (click)="selectProvider(provider.id, provider.displayName)"
            (mouseenter)="selectedIndex.set($index)"
          >
            <div class="provider-dot" [style.background-color]="getProviderColor(provider.id)"></div>
            <div class="provider-info">
              <div class="provider-name">{{ provider.displayName }}</div>
              @if (!hasKey(provider.id)) {
                <div class="provider-status">No API key</div>
              }
            </div>
          </button>
        }
      </div>
      <div class="mention-picker-footer">
        <span class="mention-picker-hint">↑↓ Navigate • Enter Select • Esc Cancel</span>
      </div>
    </div>
  `,
  styles: [`
    .mention-picker {
      position: fixed;
      z-index: 1000;
      background: var(--bg-secondary, #252525);
      border: 1px solid var(--border-color, #333);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      min-width: 280px;
      max-width: 320px;
      overflow: hidden;
    }

    .mention-picker-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color, #333);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mention-picker-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary, #fff);
    }

    .mention-picker-hint {
      font-size: 11px;
      color: var(--text-secondary, #999);
    }

    .mention-picker-list {
      max-height: 240px;
      overflow-y: auto;
    }

    .mention-picker-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
      text-align: left;
    }

    .mention-picker-item:hover,
    .mention-picker-item.selected {
      background: var(--bg-hover, rgba(124, 58, 237, 0.1));
    }

    .mention-picker-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .provider-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .provider-info {
      flex: 1;
      min-width: 0;
    }

    .provider-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary, #fff);
    }

    .provider-status {
      font-size: 11px;
      color: var(--text-secondary, #999);
      margin-top: 2px;
    }

    .mention-picker-footer {
      padding: 8px 16px;
      border-top: 1px solid var(--border-color, #333);
      background: var(--bg-primary, #1a1a1a);
    }
  `]
})
export class AiMentionPickerComponent {
  private readonly keyManager = inject(ApiKeyManagerService);

  // Inputs
  readonly position = input.required<{ x: number; y: number }>();
  readonly filterText = input<string>('');

  // Outputs
  readonly providerSelected = output<ProviderSelection>();
  readonly dismissed = output<void>();

  // State
  readonly selectedIndex = signal<number>(0);

  // Registry
  readonly providers = PROVIDER_REGISTRY;

  // Computed
  readonly availableProviders = computed(() => {
    const filter = this.filterText().toLowerCase();
    if (!filter) {
      return this.providers;
    }
    return this.providers.filter(p =>
      p.displayName.toLowerCase().includes(filter)
    );
  });

  // Methods
  hasKey(providerId: string): boolean {
    return this.keyManager.hasKey(providerId);
  }

  selectProvider(providerId: string, providerName: string): void {
    if (!this.hasKey(providerId)) {
      return;
    }
    this.providerSelected.emit({ providerId, providerName });
  }

  getProviderColor(providerId: string): string {
    switch (providerId) {
      case 'anthropic': return '#7C3AED';
      case 'openai': return '#10A37F';
      case 'google': return '#4285F4';
      case 'groq': return '#F55036';
      default: return '#7C3AED';
    }
  }

  // Keyboard navigation
  moveUp(): void {
    const current = this.selectedIndex();
    const newIndex = current > 0 ? current - 1 : this.availableProviders().length - 1;
    this.selectedIndex.set(newIndex);
  }

  moveDown(): void {
    const current = this.selectedIndex();
    const newIndex = current < this.availableProviders().length - 1 ? current + 1 : 0;
    this.selectedIndex.set(newIndex);
  }

  selectCurrent(): void {
    const providers = this.availableProviders();
    const index = this.selectedIndex();
    if (index >= 0 && index < providers.length) {
      const provider = providers[index];
      this.selectProvider(provider.id, provider.displayName);
    }
  }

  dismiss(): void {
    this.dismissed.emit();
  }
}
