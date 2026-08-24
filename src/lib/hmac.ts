import crypto from 'crypto';

/**
 * Generates an HMAC SHA-256 signature for a text payload using a shared secret.
 */
export function generateSignature(body: string, secret: string): string {
  if (!secret) {
    throw new Error('API_SIGNING_SECRET is not configured.');
  }
  return crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
}

/**
 * Validates a signature against the computed signature of a text payload.
 */
export function verifySignature(body: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  
  try {
    const expected = generateSignature(body, secret);
    // Use timingSafeEqual to protect against timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}
