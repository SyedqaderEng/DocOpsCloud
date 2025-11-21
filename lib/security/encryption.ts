// Data Encryption at Rest

import * as crypto from 'crypto'

export class EncryptionService {
  private algorithm = 'aes-256-gcm'
  private keyLength = 32 // 256 bits
  private ivLength = 16 // 128 bits
  private tagLength = 16 // 128 bits

  /**
   * Get current encryption key
   * In production, use a key management service (AWS KMS, Azure Key Vault)
   */
  private getCurrentKey(): Buffer {
    const keyString = process.env.ENCRYPTION_KEY
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable not set')
    }

    // Ensure key is exactly 32 bytes
    const key = Buffer.from(keyString, 'hex')
    if (key.length !== this.keyLength) {
      throw new Error(`Encryption key must be ${this.keyLength} bytes`)
    }

    return key
  }

  /**
   * Get encryption key by version (for key rotation)
   */
  private getKeyByVersion(version: number): Buffer {
    const keyString = process.env[`ENCRYPTION_KEY_V${version}`] || process.env.ENCRYPTION_KEY
    if (!keyString) {
      throw new Error(`Encryption key version ${version} not found`)
    }

    const key = Buffer.from(keyString, 'hex')
    if (key.length !== this.keyLength) {
      throw new Error(`Encryption key must be ${this.keyLength} bytes`)
    }

    return key
  }

  /**
   * Get current key version
   */
  private getCurrentKeyVersion(): number {
    return parseInt(process.env.ENCRYPTION_KEY_VERSION || '1', 10)
  }

  /**
   * Encrypt data
   */
  encrypt(plaintext: string | Buffer): string {
    const key = this.getCurrentKey()
    const keyVersion = this.getCurrentKeyVersion()
    const iv = crypto.randomBytes(this.ivLength)

    const cipher = crypto.createCipheriv(this.algorithm, key, iv)

    const plaintextBuffer = typeof plaintext === 'string'
      ? Buffer.from(plaintext, 'utf-8')
      : plaintext

    const encrypted = Buffer.concat([
      cipher.update(plaintextBuffer),
      cipher.final(),
    ])

    const tag = cipher.getAuthTag()

    // Format: version:iv:tag:ciphertext (all hex encoded)
    return `${keyVersion}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
  }

  /**
   * Decrypt data
   */
  decrypt(ciphertext: string): Buffer {
    const parts = ciphertext.split(':')
    if (parts.length !== 4) {
      throw new Error('Invalid ciphertext format')
    }

    const [versionStr, ivHex, tagHex, encryptedHex] = parts
    const version = parseInt(versionStr, 10)

    const key = this.getKeyByVersion(version)
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv)
    decipher.setAuthTag(tag)

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ])
  }

  /**
   * Decrypt to string
   */
  decryptToString(ciphertext: string): string {
    return this.decrypt(ciphertext).toString('utf-8')
  }

  /**
   * Re-encrypt data with new key version
   */
  reencrypt(ciphertext: string): string {
    const decrypted = this.decrypt(ciphertext)
    return this.encrypt(decrypted)
  }

  /**
   * Generate new encryption key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Hash data (one-way)
   */
  hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex')
    const hash = crypto
      .pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512')
      .toString('hex')

    return `${actualSalt}:${hash}`
  }

  /**
   * Verify hash
   */
  verifyHash(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':')
    const newHash = crypto
      .pbkdf2Sync(data, salt, 100000, 64, 'sha512')
      .toString('hex')

    return hash === newHash
  }

  /**
   * Generate secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Generate HMAC for data integrity
   */
  generateHMAC(data: string, secret?: string): string {
    const actualSecret = secret || process.env.HMAC_SECRET || this.getCurrentKey().toString('hex')
    return crypto
      .createHmac('sha256', actualSecret)
      .update(data)
      .digest('hex')
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(data: string, hmac: string, secret?: string): boolean {
    const expectedHMAC = this.generateHMAC(data, secret)
    return crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(expectedHMAC)
    )
  }
}

export const encryption = new EncryptionService()
