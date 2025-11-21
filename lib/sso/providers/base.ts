// SSO Base Provider

export interface SSOConfig {
  providerId: string
  providerName: string
  entityId: string
  ssoUrl: string
  certificate?: string
  attributeMappings?: AttributeMappings
}

export interface AttributeMappings {
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  groups?: string
}

export interface SSOUser {
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  groups?: string[]
  attributes?: Record<string, any>
}

export interface SSOValidationResult {
  valid: boolean
  user?: SSOUser
  error?: string
}

export abstract class BaseSSOProvider {
  protected config: SSOConfig

  constructor(config: SSOConfig) {
    this.config = config
  }

  /**
   * Generate SSO login URL
   */
  abstract generateLoginUrl(returnUrl?: string): string

  /**
   * Validate SSO response
   */
  abstract validateResponse(response: any): Promise<SSOValidationResult>

  /**
   * Generate SSO metadata
   */
  abstract getMetadata(): Promise<string>

  /**
   * Extract user attributes from SSO response
   */
  protected extractUserAttributes(
    attributes: Record<string, any>,
    mappings?: AttributeMappings
  ): SSOUser {
    const defaultMappings: AttributeMappings = {
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
      lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
      displayName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      groups: 'http://schemas.xmlsoap.org/claims/Group',
    }

    const finalMappings = mappings || defaultMappings

    const user: SSOUser = {
      email: attributes[finalMappings.email] || '',
      firstName: attributes[finalMappings.firstName || ''],
      lastName: attributes[finalMappings.lastName || ''],
      displayName: attributes[finalMappings.displayName || ''],
      groups: attributes[finalMappings.groups || ''] ?
        (Array.isArray(attributes[finalMappings.groups || ''])
          ? attributes[finalMappings.groups || '']
          : [attributes[finalMappings.groups || '']])
        : [],
      attributes,
    }

    return user
  }
}
