/**
 * The identifier that ties one visit's tracking calls together.
 *
 * crypto.randomUUID is only exposed in a secure context. Over plain http it is
 * not merely unavailable, it is undefined, so calling it throws and takes the
 * whole page down with an unhandled runtime error rather than degrading. That
 * is how the funnel is reached on a phone during local testing, on a LAN
 * address that cannot be https, and it is one deploy behind a proxy from being
 * true in front of real people.
 *
 * getRandomValues carries no such gate and is the fallback. Math.random is the
 * one after it, for a context that offers neither. Neither substitute needs to
 * be cryptographically strong: the value keys one visit's events to each other
 * and is never a secret or a key.
 */
export function createSessionId(): string {
  const webCrypto = globalThis.crypto;

  if (typeof webCrypto?.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  const bytes = new Uint8Array(16);

  if (typeof webCrypto?.getRandomValues === "function") {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Version 4, variant 1, so the value passes anything that validates the shape.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}
