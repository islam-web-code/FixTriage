// Hashes the password with SHA-256 before it leaves the browser.
// The server still bcrypt-hashes this value — this is a transport-layer
// obfuscation on top of (not instead of) TLS + server-side bcrypt.
export async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}