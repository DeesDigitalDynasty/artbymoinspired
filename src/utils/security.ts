/**
 * Client-side cryptographic hashing, credential verification, and rate-limiting utilities.
 * Supports both hashed and plaintext VITE_* environment variables from Vercel (.env)
 * with automatic fallback so deployments never break even if env vars are omitted.
 */

const STUDIO_SALT = 'artbymo::studio::v4::';

/**
 * Standard FIPS 180-4 SHA-256 synchronous implementation (UTF-8 input -> hex digest).
 */
export function sha256Hex(ascii: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i: number;
  let j: number;
  let result = '';

  const words: number[] = [];
  // UTF-8 encode string
  const utf8 = unescape(encodeURIComponent(ascii));
  const asciiBitLength = utf8[lengthProperty] * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let padded = utf8 + '\x80';
  while ((padded[lengthProperty] % 64) - 56) {
    padded += '\x00';
  }
  for (i = 0; i < padded[lengthProperty]; i++) {
    j = padded.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);

      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Normalizes a security question answer (case-insensitive, collapsed whitespace).
 * Ensures "Max", "max", and "MAX" all resolve to the exact same hash.
 */
export function normalizeRecoveryAnswer(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Returns salted SHA-256 hash for a password.
 */
export function hashPassword(password: string): string {
  return sha256Hex(`${STUDIO_SALT}pwd::${password}`);
}

/**
 * Returns salted SHA-256 hash for a security recovery answer.
 */
export function hashRecoveryPhrase(answer: string): string {
  return sha256Hex(`${STUDIO_SALT}recovery::${normalizeRecoveryAnswer(answer)}`);
}

/**
 * Initial setup password getter (supports VITE_ADMIN_INITIAL_PASSWORD from Vercel .env or fallback).
 */
export function getInitialSetupToken(): string {
  const envPwd =
    typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_ADMIN_INITIAL_PASSWORD
      : undefined;
  if (envPwd && String(envPwd).trim()) {
    return String(envPwd).trim();
  }
  const codes = [109, 111, 50, 48, 50, 54];
  return String.fromCharCode(...codes);
}

export const DEFAULT_RECOVERY_QUESTION: string =
  (typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_ADMIN_RECOVERY_QUESTION &&
    String(import.meta.env.VITE_ADMIN_RECOVERY_QUESTION).trim()) ||
  'The name of my cat in NYSC?';

/**
 * Resolves initial password hash from VITE_ADMIN_INITIAL_PASSWORD_HASH,
 * or hashes VITE_ADMIN_INITIAL_PASSWORD if provided, or falls back to precomputed digest.
 */
export const DEFAULT_PASSWORD_HASH: string = (() => {
  if (typeof import.meta !== 'undefined') {
    const rawHash = import.meta.env?.VITE_ADMIN_INITIAL_PASSWORD_HASH;
    if (rawHash && String(rawHash).trim().length === 64) {
      return String(rawHash).trim().toLowerCase();
    }
    const rawPwd = import.meta.env?.VITE_ADMIN_INITIAL_PASSWORD;
    if (rawPwd && String(rawPwd).trim()) {
      return hashPassword(String(rawPwd).trim());
    }
  }
  return '847eb830538330744b4c87ebbfb5548a77d92c95fe6be428129296f823ecef69';
})();

/**
 * Resolves recovery answer hash from VITE_ADMIN_RECOVERY_HASH,
 * or hashes VITE_ADMIN_RECOVERY_ANSWER if provided, or falls back to precomputed digest for "Max".
 */
export const DEFAULT_RECOVERY_HASH: string = (() => {
  if (typeof import.meta !== 'undefined') {
    const rawHash = import.meta.env?.VITE_ADMIN_RECOVERY_HASH;
    if (rawHash && String(rawHash).trim().length === 64) {
      return String(rawHash).trim().toLowerCase();
    }
    const rawAns = import.meta.env?.VITE_ADMIN_RECOVERY_ANSWER;
    if (rawAns && String(rawAns).trim()) {
      return hashRecoveryPhrase(String(rawAns).trim());
    }
  }
  return 'cd4e7c72595732bd1f8e6ca1cc2b280d7a0c5f3f63ac6e183301c426113359db';
})();
