/**
 * Tests for api-key-manager.service.ts
 *
 * Covers:
 *  - Unit tests: setKey, getKey, clearKey, clearAllKeys, hasKey,
 *                validateKeyFormat, testConnection, signal state
 *  - Property 2: Valid key format accepted and persisted (PBT)
 *  - Property 3: Invalid key format rejected (PBT)
 *  - Property 4: API keys are never stored in plaintext (PBT)
 *  - Property 6: Configured providers list invariant (PBT)
 *
 * Feature: ai-integration
 */

import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { ApiKeyManagerService, ConnectionStatus } from './api-key-manager.service';
import { PROVIDER_REGISTRY, PROVIDER_MAP } from '../config/provider-registry';
import { _resetKeyCache } from '../../shared/utils/crypto.util';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clear all lore.ai.key.* entries from localStorage between tests. */
function clearAiKeys(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('lore.ai.key.')) {
      toRemove.push(k);
    }
  }
  toRemove.forEach(k => localStorage.removeItem(k));
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ApiKeyManagerService', () => {
  let service: ApiKeyManagerService;

  beforeEach(() => {
    clearAiKeys();
    _resetKeyCache();

    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiKeyManagerService);
  });

  afterEach(() => {
    clearAiKeys();
  });

  // -------------------------------------------------------------------------
  // Unit tests — validateKeyFormat
  // -------------------------------------------------------------------------

  describe('validateKeyFormat()', () => {
    it('should return true for a valid Anthropic key', () => {
      expect(service.validateKeyFormat('anthropic', 'sk-ant-api03-abc')).toBeTrue();
    });

    it('should return false for an invalid Anthropic key', () => {
      expect(service.validateKeyFormat('anthropic', 'sk-openai-abc')).toBeFalse();
    });

    it('should return true for a valid OpenAI key', () => {
      expect(service.validateKeyFormat('openai', 'sk-abc123')).toBeTrue();
    });

    it('should return false for an invalid OpenAI key', () => {
      expect(service.validateKeyFormat('openai', 'AIzaXYZ')).toBeFalse();
    });

    it('should return true for a valid Google key', () => {
      expect(service.validateKeyFormat('google', 'AIzaXYZ123')).toBeTrue();
    });

    it('should return false for an unknown provider', () => {
      expect(service.validateKeyFormat('unknown-provider', 'sk-ant-abc')).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // Unit tests — setKey / getKey
  // -------------------------------------------------------------------------

  describe('setKey() / getKey()', () => {
    it('should store and retrieve a valid Anthropic key', async () => {
      await service.setKey('anthropic', 'sk-ant-api03-test');
      expect(await service.getKey('anthropic')).toBe('sk-ant-api03-test');
    });

    it('should throw when the key format is invalid', async () => {
      await expectAsync(
        service.setKey('anthropic', 'invalid-key')
      ).toBeRejectedWithError(/Invalid API key format/);
    });

    it('should return null for a provider with no stored key', async () => {
      expect(await service.getKey('anthropic')).toBeNull();
    });

    it('should update configuredProviderIds signal after setKey', async () => {
      expect(service.configuredProviderIds()).not.toContain('anthropic');
      await service.setKey('anthropic', 'sk-ant-api03-test');
      expect(service.configuredProviderIds()).toContain('anthropic');
    });

    it('should not duplicate entries in configuredProviderIds when setKey is called twice', async () => {
      await service.setKey('anthropic', 'sk-ant-api03-test');
      await service.setKey('anthropic', 'sk-ant-api03-test2');
      const ids = service.configuredProviderIds();
      expect(ids.filter(id => id === 'anthropic').length).toBe(1);
    });

    it('should reset connectionStatus to unconfigured after setKey', async () => {
      await service.setKey('anthropic', 'sk-ant-api03-test');
      expect(service.connectionStatus().get('anthropic')).toBe('unconfigured');
    });
  });

  // -------------------------------------------------------------------------
  // Unit tests — clearKey
  // -------------------------------------------------------------------------

  describe('clearKey()', () => {
    it('should remove the key from localStorage', async () => {
      await service.setKey('openai', 'sk-test-key');
      await service.clearKey('openai');
      expect(localStorage.getItem('lore.ai.key.openai')).toBeNull();
    });

    it('should remove the provider from configuredProviderIds', async () => {
      await service.setKey('openai', 'sk-test-key');
      await service.clearKey('openai');
      expect(service.configuredProviderIds()).not.toContain('openai');
    });

    it('should remove the provider from connectionStatus', async () => {
      await service.setKey('openai', 'sk-test-key');
      await service.clearKey('openai');
      expect(service.connectionStatus().has('openai')).toBeFalse();
    });

    it('should not throw when clearing a key that does not exist', async () => {
      await expectAsync(service.clearKey('nonexistent')).toBeResolved();
    });
  });

  // -------------------------------------------------------------------------
  // Unit tests — clearAllKeys
  // -------------------------------------------------------------------------

  describe('clearAllKeys()', () => {
    it('should remove all lore.ai.key.* entries from localStorage', async () => {
      await service.setKey('anthropic', 'sk-ant-api03-test');
      await service.setKey('openai', 'sk-test-key');
      await service.clearAllKeys();
      expect(localStorage.getItem('lore.ai.key.anthropic')).toBeNull();
      expect(localStorage.getItem('lore.ai.key.openai')).toBeNull();
    });

    it('should reset configuredProviderIds to empty', async () => {
      await service.setKey('anthropic', 'sk-ant-api03-test');
      await service.clearAllKeys();
      expect(service.configuredProviderIds()).toEqual([]);
    });

    it('should reset connectionStatus to empty map', async () => {
      await service.setKey('anthropic', 'sk-ant-api03-test');
      await service.clearAllKeys();
      expect(service.connectionStatus().size).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Unit tests — hasKey
  // -------------------------------------------------------------------------

  describe('hasKey()', () => {
    it('should return false when no key is stored', () => {
      expect(service.hasKey('anthropic')).toBeFalse();
    });

    it('should return true after setKey', async () => {
      await service.setKey('anthropic', 'sk-ant-api03-test');
      expect(service.hasKey('anthropic')).toBeTrue();
    });

    it('should return false after clearKey', async () => {
      await service.setKey('anthropic', 'sk-ant-api03-test');
      await service.clearKey('anthropic');
      expect(service.hasKey('anthropic')).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // Unit tests — testConnection (stub)
  // -------------------------------------------------------------------------

  describe('testConnection()', () => {
    it('should return a ConnectionResult with success: false (stub)', async () => {
      const result = await service.testConnection('anthropic');
      expect(result.providerId).toBe('anthropic');
      expect(result.success).toBeFalse();
      expect(result.error).toBeTruthy();
    });

    it('should set connectionStatus to "error" after the stub call', async () => {
      await service.testConnection('anthropic');
      expect(service.connectionStatus().get('anthropic')).toBe('error');
    });
  });

  // -------------------------------------------------------------------------
  // Unit tests — signal initialisation from localStorage
  // -------------------------------------------------------------------------

  describe('signal initialisation from localStorage', () => {
    it('should populate configuredProviderIds from pre-existing localStorage keys', async () => {
      // Simulate a key already stored before the service is created.
      const { encrypt } = await import('../../shared/utils/crypto.util');
      const encrypted = await encrypt('sk-ant-api03-preexisting');
      localStorage.setItem('lore.ai.key.anthropic', encrypted);

      // Re-create the service so it scans localStorage on construction.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(ApiKeyManagerService);

      expect(freshService.configuredProviderIds()).toContain('anthropic');
      expect(freshService.connectionStatus().get('anthropic')).toBe('unconfigured');
    });
  });

  // =========================================================================
  // Property-based tests
  // =========================================================================

  // -------------------------------------------------------------------------
  // Property 2: Valid key format accepted and persisted
  //
  // Validates: Requirements US-1.4, FR-2.1, FR-2.3
  // -------------------------------------------------------------------------
  describe('Property 2: valid key format accepted and persisted', () => {
    it('setKey then getKey returns the original value for any valid key', async () => {
      // Feature: ai-integration, Property 2: valid key format accepted and persisted
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...PROVIDER_REGISTRY),
          async (provider) => {
            // Generate a key that satisfies the provider's keyPattern.
            // We use the known prefixes from the registry to build valid keys.
            const prefix = provider.keyPlaceholder.replace(/\.\.\.$/, '');
            const suffix = 'test-key-abcdef1234';
            const key = prefix + suffix;

            // Only proceed if the generated key actually matches the pattern.
            if (!provider.keyPattern.test(key)) {
              return; // skip — generator couldn't produce a matching key
            }

            clearAiKeys();
            _resetKeyCache();

            await service.setKey(provider.id, key);
            const retrieved = await service.getKey(provider.id);
            expect(retrieved).toBe(key);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // -------------------------------------------------------------------------
  // Property 3: Invalid key format rejected
  //
  // Validates: Requirements US-1.5, FR-2.4
  // -------------------------------------------------------------------------
  describe('Property 3: invalid key format rejected', () => {
    it('validateKeyFormat returns false and setKey throws for any non-matching key', async () => {
      // Feature: ai-integration, Property 3: invalid key format rejected
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...PROVIDER_REGISTRY),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (provider, key) => {
            if (provider.keyPattern.test(key)) {
              return; // skip valid keys — this property is about invalid ones
            }

            // validateKeyFormat must return false
            expect(service.validateKeyFormat(provider.id, key)).toBeFalse();

            // setKey must throw
            const storageKeyBefore = localStorage.getItem(`lore.ai.key.${provider.id}`);
            await expectAsync(
              service.setKey(provider.id, key)
            ).toBeRejectedWithError(/Invalid API key format/);

            // localStorage must be unchanged
            const storageKeyAfter = localStorage.getItem(`lore.ai.key.${provider.id}`);
            expect(storageKeyAfter).toBe(storageKeyBefore);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // -------------------------------------------------------------------------
  // Property 4: API keys are never stored in plaintext
  //
  // Validates: Requirements FR-2.2, NFR-1
  // -------------------------------------------------------------------------
  describe('Property 4: API keys are never stored in plaintext', () => {
    it('localStorage value must not equal the plaintext key after setKey', async () => {
      // Feature: ai-integration, Property 4: API keys never stored in plaintext
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...PROVIDER_REGISTRY),
          async (provider) => {
            const prefix = provider.keyPlaceholder.replace(/\.\.\.$/, '');
            const key = prefix + 'plaintext-check-9876';

            if (!provider.keyPattern.test(key)) {
              return; // skip if we can't build a valid key for this provider
            }

            clearAiKeys();
            _resetKeyCache();

            await service.setKey(provider.id, key);
            const stored = localStorage.getItem(`lore.ai.key.${provider.id}`);

            // The stored value must exist and must NOT equal the plaintext key.
            expect(stored).not.toBeNull();
            expect(stored).not.toBe(key);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // -------------------------------------------------------------------------
  // Property 6: Configured providers list invariant
  //
  // Validates: Requirements US-1.6, US-1.9
  // -------------------------------------------------------------------------
  describe('Property 6: configured providers list invariant', () => {
    it('configuredProviderIds has no duplicates and matches stored keys', async () => {
      // Feature: ai-integration, Property 6: configured providers list invariant
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom(...PROVIDER_REGISTRY.map(p => p.id)),
            { minLength: 0, maxLength: PROVIDER_REGISTRY.length * 2 }
          ),
          async (providerIds) => {
            clearAiKeys();
            _resetKeyCache();

            // Re-create service with clean state.
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({});
            const freshService = TestBed.inject(ApiKeyManagerService);

            // Save a valid key for each provider ID in the sequence.
            for (const id of providerIds) {
              const provider = PROVIDER_MAP.get(id)!;
              const prefix = provider.keyPlaceholder.replace(/\.\.\.$/, '');
              const key = prefix + 'invariant-test-key';
              if (provider.keyPattern.test(key)) {
                await freshService.setKey(id, key);
              }
            }

            const configured = freshService.configuredProviderIds();

            // No duplicates.
            const unique = new Set(configured);
            expect(configured.length).toBe(unique.size);

            // Every entry in the signal has a corresponding localStorage key.
            for (const id of configured) {
              expect(localStorage.getItem(`lore.ai.key.${id}`)).not.toBeNull();
            }

            // Every localStorage key is reflected in the signal.
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k?.startsWith('lore.ai.key.')) {
                const id = k.slice('lore.ai.key.'.length);
                expect(configured).toContain(id);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

});
