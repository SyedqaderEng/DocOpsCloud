// OAuth 2.0 Provider Base Class

import { createHash, randomBytes } from 'crypto'

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  authorizationUrl: string
  tokenUrl: string
  scopes: string[]
  redirectUri: string
}

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  tokenType: string
  scope?: string
}

export abstract class OAuthProvider {
  protected config: OAuthConfig

  constructor(config: OAuthConfig) {
    this.config = config
  }

  // Generate authorization URL
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state: state || this.generateState(),
      ...this.getAdditionalAuthParams(),
    })

    return `${this.config.authorizationUrl}?${params.toString()}`
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...this.getTokenHeaders(),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      }).toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OAuth token exchange failed: ${error}`)
    }

    const data = await response.json()
    return this.parseTokenResponse(data)
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...this.getTokenHeaders(),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }).toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OAuth token refresh failed: ${error}`)
    }

    const data = await response.json()
    return this.parseTokenResponse(data)
  }

  // Parse token response
  protected parseTokenResponse(data: any): OAuthTokens {
    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      tokenType: data.token_type || 'Bearer',
      scope: data.scope,
    }
  }

  // Generate random state for CSRF protection
  protected generateState(): string {
    return randomBytes(32).toString('hex')
  }

  // Additional auth params (override in subclass)
  protected getAdditionalAuthParams(): Record<string, string> {
    return {}
  }

  // Additional token headers (override in subclass)
  protected getTokenHeaders(): Record<string, string> {
    return {}
  }

  // Validate state
  validateState(received: string, expected: string): boolean {
    return received === expected
  }

  // Check if token is expired
  isTokenExpired(expiresAt?: Date): boolean {
    if (!expiresAt) return false
    return Date.now() >= expiresAt.getTime() - 300000 // 5 min buffer
  }
}

// Credential encryption/decryption
export class CredentialEncryption {
  private algorithm = 'aes-256-gcm'
  private key: Buffer

  constructor(secretKey?: string) {
    const key = secretKey || process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
    this.key = createHash('sha256').update(key).digest()
  }

  encrypt(data: any): string {
    const crypto = require('crypto')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)

    const text = JSON.stringify(data)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex'),
    })
  }

  decrypt(encryptedData: string): any {
    const crypto = require('crypto')
    const { iv, data, authTag } = JSON.parse(encryptedData)

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    )

    decipher.setAuthTag(Buffer.from(authTag, 'hex'))

    let decrypted = decipher.update(data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return JSON.parse(decrypted)
  }
}
