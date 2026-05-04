/**
 * Tests for crypto.util.ts
 *
 * Covers:
 *  - Unit tests: basic encrypt/decrypt, error handling, isCryptoAvailable
 *  - Property 5: Encryption round-trip preserves key (PBT)
 *
 * Feature: ai-integration
 */

import * as fc from 'fast-check';
import { decrypt, encrypt, isCryptoAvailable, _resetKeyCache } from './crypto.util';

describe('crypto.util', () => {

  beforeEach(() => {
    // Reset the cached derived key so each test starts fresh.
    _resetKeyCache();
  });

  // ---------------------------------------------------------------------------
  // Unit tests
  // ---------------------------------------------------------------------------

  describe('isCryptoAvailable()', () => {
    it('should return true in a browser-like environment', () => {
      expect(isCryptoAvailable()).toBeTrue();
    });
  });

  describe('encrypt()', () => {
    it('should return a non-empty base64 string', async () => {
      const result = await encrypt('hello world');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should produce different ciphertexts for the same plaintext (random IV)', async () => {
      const a = await encrypt('same input');
      const b = await encrypt('same input');
      // Different IVs → different ciphertexts
      expect(a).not.toEqual(b);
    });

    it('should encrypt an empty string without throwing', async () => {
      const result = await encrypt('');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('decrypt()', () => {
    it('should throw a descriptive error for invalid base64 input', async () => {
      await expectAsync(decrypt('not-valid-base64!!!')).toBeRejectedWithError(
        /Invalid ciphertext: base64 decoding failed/
      );
    });

    it('should throw a descriptive error for ciphertext that is too short', async () => {
      // 12 bytes or fewer → too short (IV alone, no ciphertext body)
      const tooShort = btoa(String.fromCharCode(...new Uint8Array(8)));
      await expectAsync(decrypt(tooShort)).toBeRejectedWithError(/too short/);
    });

    it('should throw a descriptive error when ciphertext is corrupted', async () => {
      const valid = await encrypt('test value');
      // Flip a byte in the middle of the base64 payload
      const bytes = Uint8Array.from(atob(valid), c => c.charCodeAt(0));
      bytes[15] ^= 0xff; // corrupt a byte in the ciphertext body
      const corrupted = btoa(String.fromCharCode(...bytes));
      await expectAsync(decrypt(corrupted)).toBeRejectedWithError(/Decryption failed/);
    });
  });

  describe('encrypt() + decrypt() round-trip', () => {
    it('should round-trip a simple ASCII string', async () => {
      const original = 'sk-ant-api03-test-key-12345';
      expect(await decrypt(await encrypt(original))).toBe(original);
    });

    it('should round-trip a string with unicode characters', async () => {
      const original = '🔑 secret key — café résumé';
      expect(await decrypt(await encrypt(original))).toBe(original);
    });

    it('should round-trip an empty string', async () => {
      expect(await decrypt(await encrypt(''))).toBe('');
    });

    it('should round-trip a long string', async () => {
      const original = 'x'.repeat(10_000);
      expect(await decrypt(await encrypt(original))).toBe(original);
    });
  });

  // ---------------------------------------------------------------------------
  // Property-based test
  // ---------------------------------------------------------------------------

  // Feature: ai-integration, Property 5: encryption round-trip preserves key
  //
  // Validates: Requirements FR-2.3
  describe('Property 5: encryption round-trip preserves key', () => {
    it('decrypt(encrypt(key)) === key for any non-empty string', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          async (key) => {
            const encrypted = await encrypt(key);
            const decrypted = await decrypt(encrypted);
            expect(decrypted).toBe(key);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

});
