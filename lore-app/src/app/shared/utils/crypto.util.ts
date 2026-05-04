/**
 * Crypto Utilities
 * Provides encryption/decryption for sensitive data using the Web Crypto API (AES-GCM).
 *
 * Key derivation: PBKDF2 from a fixed app-level password + salt so the key is
 * consistent across page reloads, allowing stored ciphertext to be decrypted
 * after a browser refresh.
 *
 * Wire format: base64( IV[12 bytes] || AES-GCM-ciphertext )
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // bytes — standard for AES-GCM

// Fixed app-level key material — consistent across page reloads.
// Changing these constants will invalidate all previously stored ciphertext.
const KEY_PASSWORD = 'lore-ai-key-v1';
const KEY_SALT = 'lore-salt-2024';

/** Cached derived key — derived once per page load. */
let _cachedKey: CryptoKey | null = null;

/**
 * Derive a consistent AES-GCM key via PBKDF2.
 * The result is cached so derivation only happens once per page load.
 */
async function getDerivedKey(): Promise<CryptoKey> {
  if (_cachedKey) {
    return _cachedKey;
  }

  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(KEY_PASSWORD),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  _cachedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(KEY_SALT),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );

  return _cachedKey;
}

/**
 * Encrypt a plaintext string using AES-GCM.
 *
 * Returns a base64-encoded string whose binary layout is:
 *   [ IV (12 bytes) | AES-GCM ciphertext ]
 *
 * The IV is randomly generated per call so identical plaintexts produce
 * different ciphertexts.
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const key = await getDerivedKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    // Prepend IV so decrypt() can extract it without out-of-band storage.
    const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), IV_LENGTH);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Decrypt a base64-encoded ciphertext produced by {@link encrypt}.
 *
 * Throws a descriptive error if the input is malformed or the key does not
 * match (e.g. the ciphertext was produced with a different key version).
 */
export async function decrypt(ciphertext: string): Promise<string> {
  try {
    // Decode base64 → raw bytes
    let combined: Uint8Array;
    try {
      combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    } catch {
      throw new Error('Invalid ciphertext: base64 decoding failed');
    }

    if (combined.length <= IV_LENGTH) {
      throw new Error(
        `Invalid ciphertext: too short (${combined.length} bytes, expected > ${IV_LENGTH})`
      );
    }

    const iv = combined.slice(0, IV_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH);

    const key = await getDerivedKey();

    let decrypted: ArrayBuffer;
    try {
      decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        encryptedData
      );
    } catch {
      throw new Error(
        'Decryption failed: ciphertext may be corrupted or was encrypted with a different key'
      );
    }

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    // Re-throw descriptive errors as-is; wrap unexpected ones.
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Decryption failed: ${String(error)}`);
  }
}

/**
 * Returns true when the Web Crypto API is available in the current environment.
 * Useful for feature-detection in tests or SSR guards.
 */
export function isCryptoAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
  );
}

// Exported for testing only — allows resetting the cached key between test runs.
export function _resetKeyCache(): void {
  _cachedKey = null;
}
