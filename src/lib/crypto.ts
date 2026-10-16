import crypto from 'crypto';

// Master secret key fallback for demo/development if environment variable is not supplied.
// In production on Vercel, set ENCRYPTION_SECRET_KEY to a 64-character hex string (32 bytes).
const RAW_KEY = process.env.ENCRYPTION_SECRET_KEY || 'smartface-super-secure-gis-attendance-key-2026-production-32b!';
const CIPHER_KEY = crypto.createHash('sha256').update(RAW_KEY).digest(); // Exactly 32 bytes

const RAW_HMAC_KEY = process.env.HMAC_SECRET_KEY || RAW_KEY;
const HMAC_KEY = crypto.createHash('sha256').update(RAW_HMAC_KEY).digest();

// Replay prevention: store recently seen nonces with expiration
const recentNonces = new Map<string, number>();
const NONCE_TTL_MS = 60000; // 1 minute

function cleanExpiredNonces() {
  const now = Date.now();
  for (const [nonce, expiresAt] of recentNonces.entries()) {
    if (now > expiresAt) {
      recentNonces.delete(nonce);
    }
  }
}

/**
 * AES-256-GCM Encryption
 * Output format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encryptAESGCM(plainText: string): string {
  try {
    const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', CIPHER_KEY, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('[Crypto] AES-256-GCM encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * AES-256-GCM Decryption
 */
export function decryptAESGCM(encryptedPayload: string): string {
  try {
    if (!encryptedPayload || !encryptedPayload.includes(':')) {
      return encryptedPayload; // Return as-is if unencrypted or legacy
    }
    
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      throw new Error('Malformed encrypted payload format (expected iv:authTag:ciphertext)');
    }
    
    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', CIPHER_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[Crypto] AES-256-GCM decryption failed:', error);
    return '[Encrypted Data Protected]';
  }
}

/**
 * Create HMAC-SHA256 signature for attendance record
 * Signature message format: `${userId}:${timestamp}:${nonce}`
 */
export function generateHMACSignature(userId: string, timestamp: number, nonce: string): string {
  const message = `${userId}:${timestamp}:${nonce}`;
  return crypto.createHmac('sha256', HMAC_KEY).update(message).digest('hex');
}

/**
 * Verify HMAC-SHA256 signature and check against replay & timestamp drift (> 5000ms)
 */
export function verifyHMACSignature(
  userId: string,
  timestamp: number,
  nonce: string,
  signature: string
): { valid: boolean; error?: string } {
  cleanExpiredNonces();
  
  const now = Date.now();
  const drift = Math.abs(now - timestamp);
  
  // Guardrail 1: Timestamp drift rejection (> 5000ms)
  if (drift > 5000) {
    return {
      valid: false,
      error: `Security Drift Rejection: Client clock drift of ${drift}ms exceeds max allowed 5000ms threshold.`
    };
  }
  
  // Guardrail 2: Anti-Replay check
  if (recentNonces.has(nonce)) {
    return {
      valid: false,
      error: 'Security Replay Rejection: Nonce has already been consumed. Replay attack prevented.'
    };
  }
  
  // Guardrail 3: Cryptographic HMAC signature check
  const expectedSignature = generateHMACSignature(userId, timestamp, nonce);
  
  const expectedBuf = Buffer.from(expectedSignature, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');
  
  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    return {
      valid: false,
      error: 'Security Cryptographic Rejection: Invalid signature or payload tampered.'
    };
  }
  
  // Mark nonce as consumed
  recentNonces.set(nonce, now + NONCE_TTL_MS);
  
  return { valid: true };
}
