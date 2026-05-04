import { Injectable, signal, Signal } from '@angular/core';
import { encrypt, decrypt } from '../../shared/utils/crypto.util';
import { PROVIDER_MAP } from '../config/provider-registry';

// ============================================================================
// Exported Types
// ============================================================================

export type ConnectionStatus = 'unconfigured' | 'testing' | 'connected' | 'error';

export interface ConnectionResult {
  providerId: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const KEY_PREFIX = 'lore.ai.key.';

// ============================================================================
// Service
// ============================================================================

/**
 * API_Key_Manager
 *
 * Generic service for storing, retrieving, validating, and clearing AI provider
 * API keys. All methods accept a `providerId: string` — no union types.
 *
 * Storage key convention: `lore.ai.key.{providerId}`
 * Keys are encrypted via AES-GCM before being written to localStorage.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiKeyManagerService {

  // --------------------------------------------------------------------------
  // Private signal state
  // --------------------------------------------------------------------------

  /** Writable signal backing configuredProviderIds. */
  private readonly _configuredProviderIds = signal<string[]>(
    this.scanStoredProviderIds()
  );

  /** Writable signal backing connectionStatus. */
  private readonly _connectionStatus = signal<Map<string, ConnectionStatus>>(
    this.buildInitialConnectionStatus()
  );

  // --------------------------------------------------------------------------
  // Public signals (read-only views)
  // --------------------------------------------------------------------------

  /**
   * List of provider IDs that currently have a stored (encrypted) key.
   * Initialised by scanning localStorage on construction.
   */
  readonly configuredProviderIds: Signal<string[]> =
    this._configuredProviderIds.asReadonly();

  /**
   * Map of providerId → ConnectionStatus.
   * Initialised to 'unconfigured' for all providers that have a stored key.
   */
  readonly connectionStatus: Signal<Map<string, ConnectionStatus>> =
    this._connectionStatus.asReadonly();

  // --------------------------------------------------------------------------
  // Storage methods
  // --------------------------------------------------------------------------

  /**
   * Validate the key format, then encrypt and persist it.
   * Updates `configuredProviderIds` and resets the connection status to
   * 'unconfigured' for the provider.
   *
   * @throws if the key format is invalid or encryption fails.
   */
  async setKey(providerId: string, key: string): Promise<void> {
    if (!this.validateKeyFormat(providerId, key)) {
      throw new Error(
        `Invalid API key format for provider "${providerId}"`
      );
    }

    const encrypted = await encrypt(key);
    localStorage.setItem(`${KEY_PREFIX}${providerId}`, encrypted);

    // Update configuredProviderIds — add if not already present.
    this._configuredProviderIds.update(ids =>
      ids.includes(providerId) ? ids : [...ids, providerId]
    );

    // Reset connection status to 'unconfigured' after a new key is saved.
    this._connectionStatus.update(map => {
      const next = new Map(map);
      next.set(providerId, 'unconfigured');
      return next;
    });
  }

  /**
   * Read and decrypt the stored key for the given provider.
   * Returns `null` if no key is stored.
   */
  async getKey(providerId: string): Promise<string | null> {
    const stored = localStorage.getItem(`${KEY_PREFIX}${providerId}`);
    if (stored === null) {
      return null;
    }

    try {
      return await decrypt(stored);
    } catch (error) {
      console.error(
        `Failed to decrypt API key for provider "${providerId}":`,
        error
      );
      return null;
    }
  }

  /**
   * Remove the stored key for the given provider.
   * Updates `configuredProviderIds` and `connectionStatus` signals.
   */
  async clearKey(providerId: string): Promise<void> {
    localStorage.removeItem(`${KEY_PREFIX}${providerId}`);

    this._configuredProviderIds.update(ids =>
      ids.filter(id => id !== providerId)
    );

    this._connectionStatus.update(map => {
      const next = new Map(map);
      next.delete(providerId);
      return next;
    });
  }

  /**
   * Remove all `lore.ai.key.*` entries from localStorage.
   * Resets both signals to empty state.
   */
  async clearAllKeys(): Promise<void> {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEY_PREFIX)) {
        keysToRemove.push(k);
      }
    }

    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }

    this._configuredProviderIds.set([]);
    this._connectionStatus.set(new Map());
  }

  // --------------------------------------------------------------------------
  // Synchronous helpers
  // --------------------------------------------------------------------------

  /**
   * Synchronous check — returns `true` if the provider currently has a stored
   * key, based on the signal state (no localStorage read).
   */
  hasKey(providerId: string): boolean {
    return this._configuredProviderIds().includes(providerId);
  }

  /**
   * Validate the API key format for the given provider by delegating to the
   * provider's `keyPattern` in the registry.
   *
   * Returns `false` for unknown provider IDs.
   */
  validateKeyFormat(providerId: string, key: string): boolean {
    return PROVIDER_MAP.get(providerId)?.keyPattern.test(key) ?? false;
  }

  // --------------------------------------------------------------------------
  // Connection testing
  // --------------------------------------------------------------------------

  /**
   * Test the connection for the given provider by making a real minimal API
   * call. Pass in the `testFn` from AIService to avoid circular DI.
   * Updates `connectionStatus` signal accordingly.
   *
   * @param providerId  The provider to test
   * @param testFn      Optional async function that performs the actual test.
   *                    If omitted, marks status as 'error' with a helpful message.
   */
  async testConnection(
    providerId: string,
    testFn?: () => Promise<boolean>
  ): Promise<ConnectionResult> {
    // Mark as testing.
    this._connectionStatus.update(map => {
      const next = new Map(map);
      next.set(providerId, 'testing');
      return next;
    });

    let success = false;
    let error: string | undefined;

    if (testFn) {
      try {
        success = await testFn();
        if (!success) {
          error = 'Connection failed — check your API key and try again.';
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Connection test failed.';
      }
    } else {
      error = 'No test function provided.';
    }

    const result: ConnectionResult = { providerId, success, error };

    this._connectionStatus.update(map => {
      const next = new Map(map);
      next.set(providerId, success ? 'connected' : 'error');
      return next;
    });

    return result;
  }

  // --------------------------------------------------------------------------
  // Private initialisation helpers
  // --------------------------------------------------------------------------

  /**
   * Scan localStorage for keys matching `lore.ai.key.*` and return the
   * corresponding provider IDs. Called once during construction.
   */
  private scanStoredProviderIds(): string[] {
    const ids: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEY_PREFIX)) {
        ids.push(k.slice(KEY_PREFIX.length));
      }
    }

    return ids;
  }

  /**
   * Build the initial `connectionStatus` map — 'unconfigured' for every
   * provider that already has a stored key.
   */
  private buildInitialConnectionStatus(): Map<string, ConnectionStatus> {
    const map = new Map<string, ConnectionStatus>();

    for (const id of this.scanStoredProviderIds()) {
      map.set(id, 'unconfigured');
    }

    return map;
  }
}
