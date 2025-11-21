// OpenID Connect (OIDC) Provider

import { BaseSSOProvider, SSOConfig, SSOValidationResult, SSOUser } from './base'
import * as crypto from 'crypto'

export interface OIDCConfig extends SSOConfig {
  clientId: string
  clientSecret: string
  discoveryUrl: string
  scopes?: string[]
}

export class OIDCProvider extends BaseSSOProvider {
  private oidcConfig: OIDCConfig
  private discoveryData: any = null

  constructor(config: OIDCConfig) {
    super(config)
    this.oidcConfig = config
  }

  /**
   * Fetch OIDC discovery document
   */
  private async getDiscoveryData() {
    if (this.discoveryData) {
      return this.discoveryData
    }

    const response = await fetch(this.oidcConfig.discoveryUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch OIDC discovery document')
    }

    this.discoveryData = await response.json()
    return this.discoveryData
  }

  /**
   * Generate OIDC login URL
   */
  generateLoginUrl(returnUrl?: string): string {
    const state = this.generateState()
    const nonce = this.generateNonce()

    // Store state and nonce for validation (in production, use Redis or database)
    this.storeStateAndNonce(state, nonce)

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/oidc/callback`

    const scopes = this.oidcConfig.scopes || ['openid', 'profile', 'email']

    const params = new URLSearchParams({
      client_id: this.oidcConfig.clientId,
      response_type: 'code',
      scope: scopes.join(' '),
      redirect_uri: redirectUri,
      state,
      nonce,
      ...(returnUrl && { redirect: returnUrl }),
    })

    return `${this.config.ssoUrl}?${params.toString()}`
  }

  /**
   * Validate OIDC response and exchange code for tokens
   */
  async validateResponse(params: {
    code: string
    state: string
  }): Promise<SSOValidationResult> {
    try {
      // Validate state
      if (!this.validateState(params.state)) {
        return { valid: false, error: 'Invalid state parameter' }
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCode(params.code)

      // Validate ID token
      const payload = await this.validateIdToken(tokens.id_token)

      if (!payload) {
        return { valid: false, error: 'Invalid ID token' }
      }

      // Get user info
      const userInfo = await this.getUserInfo(tokens.access_token)

      // Extract user attributes
      const user: SSOUser = {
        email: userInfo.email || payload.email,
        firstName: userInfo.given_name || payload.given_name,
        lastName: userInfo.family_name || payload.family_name,
        displayName: userInfo.name || payload.name,
        groups: userInfo.groups || payload.groups || [],
        attributes: { ...payload, ...userInfo },
      }

      if (!user.email) {
        return { valid: false, error: 'Email not found in OIDC response' }
      }

      return { valid: true, user }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'OIDC validation failed',
      }
    }
  }

  /**
   * Get OIDC metadata (discovery document)
   */
  async getMetadata(): Promise<string> {
    const discovery = await this.getDiscoveryData()
    return JSON.stringify(discovery, null, 2)
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCode(code: string): Promise<{
    access_token: string
    id_token: string
    refresh_token?: string
  }> {
    const discovery = await this.getDiscoveryData()
    const tokenEndpoint = discovery.token_endpoint

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/oidc/callback`

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.oidcConfig.clientId,
      client_secret: this.oidcConfig.clientSecret,
    })

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${await response.text()}`)
    }

    return response.json()
  }

  /**
   * Validate and decode ID token (JWT)
   */
  private async validateIdToken(idToken: string): Promise<any> {
    try {
      // Split JWT into parts
      const parts = idToken.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }

      // Decode payload
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      )

      // Verify issuer
      const discovery = await this.getDiscoveryData()
      if (payload.iss !== discovery.issuer) {
        throw new Error('Invalid issuer')
      }

      // Verify audience
      if (payload.aud !== this.oidcConfig.clientId) {
        throw new Error('Invalid audience')
      }

      // Verify expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired')
      }

      // In production, also verify signature using JWKS
      // This requires fetching public keys from discovery.jwks_uri

      return payload
    } catch (error) {
      console.error('ID token validation error:', error)
      return null
    }
  }

  /**
   * Get user info from userinfo endpoint
   */
  private async getUserInfo(accessToken: string): Promise<any> {
    try {
      const discovery = await this.getDiscoveryData()
      const userinfoEndpoint = discovery.userinfo_endpoint

      const response = await fetch(userinfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user info')
      }

      return response.json()
    } catch (error) {
      console.error('User info fetch error:', error)
      return {}
    }
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Generate random nonce
   */
  private generateNonce(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Store state and nonce for validation
   * In production, use Redis or database with TTL
   */
  private storeStateAndNonce(state: string, nonce: string): void {
    // TODO: Implement proper storage with TTL
    // For now, this is a placeholder
    global._oidcStates = global._oidcStates || new Map()
    global._oidcStates.set(state, { nonce, timestamp: Date.now() })
  }

  /**
   * Validate state parameter
   */
  private validateState(state: string): boolean {
    global._oidcStates = global._oidcStates || new Map()
    const stored = global._oidcStates.get(state)

    if (!stored) {
      return false
    }

    // Check if state is not expired (5 minutes)
    if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
      global._oidcStates.delete(state)
      return false
    }

    global._oidcStates.delete(state)
    return true
  }
}

// Global type augmentation for state storage
declare global {
  var _oidcStates: Map<string, { nonce: string; timestamp: number }> | undefined
}
