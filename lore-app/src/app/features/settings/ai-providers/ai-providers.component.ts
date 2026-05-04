import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PROVIDER_REGISTRY, PROVIDER_MAP, ProviderDefinition } from '../../../core/config/provider-registry';
import { ApiKeyManagerService } from '../../../core/services/api-key-manager.service';
import { AIService } from '../../../core/services/ai.service';

@Component({
  selector: 'app-ai-providers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-providers.component.html',
  styleUrl: './ai-providers.component.scss'
})
export class AIProvidersComponent {

  // ============================================================================
  // Dependencies
  // ============================================================================

  readonly apiKeyManager = inject(ApiKeyManagerService);
  private readonly aiService = inject(AIService);

  // ============================================================================
  // Registry exposure for template
  // ============================================================================

  readonly providerRegistry = PROVIDER_REGISTRY;

  // ============================================================================
  // Signals — form state
  // ============================================================================

  /** Currently selected provider ID in the dropdown */
  readonly selectedProviderId = signal<string>('');

  /** Value of the API key input field */
  readonly apiKeyInput = signal<string>('');

  /** Inline validation error shown below the key input */
  readonly validationError = signal<string | null>(null);

  /** Whether we are editing an existing provider (vs. adding a new one) */
  readonly isEditMode = signal<boolean>(false);

  /** Which provider ID is currently being edited */
  readonly editingProviderId = signal<string | null>(null);

  // ============================================================================
  // Computed
  // ============================================================================

  /** The full ProviderDefinition for the currently selected provider, or null */
  readonly selectedProvider = computed<ProviderDefinition | null>(
    () => PROVIDER_MAP.get(this.selectedProviderId()) ?? null
  );

  /** Reactive list of provider IDs that have a stored key */
  readonly configuredProviderIds = this.apiKeyManager.configuredProviderIds;

  /** Reactive map of providerId → ConnectionStatus */
  readonly connectionStatus = this.apiKeyManager.connectionStatus;

  // ============================================================================
  // Form interaction
  // ============================================================================

  /** Called when the user picks a provider from the dropdown */
  onProviderSelected(id: string): void {
    this.selectedProviderId.set(id);
    this.validationError.set(null);
    this.apiKeyInput.set('');
    // If we were in edit mode for a different provider, cancel it
    if (this.isEditMode() && this.editingProviderId() !== id) {
      this.isEditMode.set(false);
      this.editingProviderId.set(null);
    }
  }

  /** Save the entered API key for the selected provider */
  async saveProvider(): Promise<void> {
    const providerId = this.selectedProviderId();
    const key = this.apiKeyInput().trim();

    if (!providerId) {
      this.validationError.set('Please select a provider first.');
      return;
    }

    if (!key) {
      this.validationError.set('API key cannot be empty.');
      return;
    }

    if (!this.apiKeyManager.validateKeyFormat(providerId, key)) {
      const placeholder = PROVIDER_MAP.get(providerId)?.keyPlaceholder ?? '';
      this.validationError.set(
        `Invalid key format. Expected format: ${placeholder}`
      );
      return;
    }

    try {
      this.validationError.set(null);
      await this.apiKeyManager.setKey(providerId, key);
      // Reset form on success
      this.apiKeyInput.set('');
      this.selectedProviderId.set('');
      this.isEditMode.set(false);
      this.editingProviderId.set(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save API key.';
      this.validationError.set(message);
    }
  }

  // ============================================================================
  // Provider card actions
  // ============================================================================

  /**
   * Pre-populate the form for editing an existing provider.
   * We do NOT expose the actual key — we set a non-empty placeholder string
   * so the input appears pre-populated without leaking the real value.
   */
  editProvider(providerId: string): void {
    this.selectedProviderId.set(providerId);
    this.isEditMode.set(true);
    this.editingProviderId.set(providerId);
    // Use a placeholder to indicate a key is already saved (never expose the real key)
    this.apiKeyInput.set('••••••••••••••••');
    this.validationError.set(null);
  }

  /** Remove the stored key for a provider after confirmation */
  async deleteProvider(providerId: string): Promise<void> {
    const name = PROVIDER_MAP.get(providerId)?.displayName ?? providerId;
    if (!confirm(`Remove the API key for ${name}? This cannot be undone.`)) {
      return;
    }
    await this.apiKeyManager.clearKey(providerId);
    // If we were editing this provider, reset the form
    if (this.editingProviderId() === providerId) {
      this.selectedProviderId.set('');
      this.apiKeyInput.set('');
      this.isEditMode.set(false);
      this.editingProviderId.set(null);
    }
  }

  /** Trigger a connection test for a configured provider */
  async testConnection(providerId: string): Promise<void> {
    await this.apiKeyManager.testConnection(
      providerId,
      () => this.aiService.testConnection(providerId)
    );
  }

  /** Remove all stored API keys after confirmation */
  async clearAllKeys(): Promise<void> {
    if (!confirm('Remove ALL API keys? This cannot be undone.')) {
      return;
    }
    await this.apiKeyManager.clearAllKeys();
    // Reset form state
    this.selectedProviderId.set('');
    this.apiKeyInput.set('');
    this.isEditMode.set(false);
    this.editingProviderId.set(null);
    this.validationError.set(null);
  }

  // ============================================================================
  // Template helpers
  // ============================================================================

  /** Look up a ProviderDefinition by ID (used in the configured-providers list) */
  providerDef(id: string): ProviderDefinition {
    // Fall back to a minimal stub so the template never crashes on an unknown ID
    return PROVIDER_MAP.get(id) ?? {
      id,
      displayName: id,
      logoAsset: '',
      keyPlaceholder: '',
      keyPattern: /.*/,
      getApiKeyUrl: '',
      apiBaseUrl: '',
      defaultModel: '',
      availableModels: [],
    };
  }

  /** Human-readable label for a provider's current connection status */
  statusLabel(id: string): string {
    const status = this.connectionStatus().get(id) ?? 'unconfigured';
    switch (status) {
      case 'testing':      return 'Testing…';
      case 'connected':    return 'Connected';
      case 'error':        return 'Error';
      case 'unconfigured': return 'Not tested';
      default:             return 'Unknown';
    }
  }

  /** CSS class applied to the status badge based on connection status */
  statusClass(id: string): string {
    return this.connectionStatus().get(id) ?? 'unconfigured';
  }
}
