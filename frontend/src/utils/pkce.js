/**
 * PKCE (Proof Key for Code Exchange) helpers.
 * All crypto is done in the browser using the Web Crypto API.
 */

function base64urlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a cryptographically random code_verifier (43-128 chars, URL-safe).
 */
export function generateCodeVerifier() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return base64urlEncode(array);
}

/**
 * Derive the code_challenge from a code_verifier using SHA-256.
 * Returns a base64url-encoded string.
 */
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(digest);
}
