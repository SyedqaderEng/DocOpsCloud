// Okta SSO Provider (OIDC)

import { OIDCProvider, OIDCConfig } from './oidc'

export class OktaProvider extends OIDCProvider {
  constructor(oktaDomain: string, clientId: string, clientSecret: string) {
    const config: OIDCConfig = {
      providerId: 'okta',
      providerName: 'Okta',
      entityId: `https://${oktaDomain}`,
      ssoUrl: `https://${oktaDomain}/oauth2/v1/authorize`,
      clientId,
      clientSecret,
      discoveryUrl: `https://${oktaDomain}/.well-known/openid-configuration`,
      scopes: ['openid', 'profile', 'email', 'groups'],
      attributeMappings: {
        email: 'email',
        firstName: 'given_name',
        lastName: 'family_name',
        displayName: 'name',
        groups: 'groups',
      },
    }

    super(config)
  }

  /**
   * Create Okta provider from environment variables
   */
  static fromEnv(): OktaProvider {
    const oktaDomain = process.env.OKTA_DOMAIN
    const clientId = process.env.OKTA_CLIENT_ID
    const clientSecret = process.env.OKTA_CLIENT_SECRET

    if (!oktaDomain || !clientId || !clientSecret) {
      throw new Error('Okta environment variables not configured')
    }

    return new OktaProvider(oktaDomain, clientId, clientSecret)
  }

  /**
   * Get Okta user groups
   */
  async getUserGroups(accessToken: string): Promise<string[]> {
    try {
      const response = await fetch(`https://${this.getOktaDomain()}/api/v1/users/me/groups`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user groups')
      }

      const groups = await response.json()
      return groups.map((g: any) => g.profile.name)
    } catch (error) {
      console.error('Okta groups fetch error:', error)
      return []
    }
  }

  /**
   * Assign user to Okta group
   */
  async assignUserToGroup(
    apiToken: string,
    userId: string,
    groupId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `https://${this.getOktaDomain()}/api/v1/groups/${groupId}/users/${userId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `SSWS ${apiToken}`,
            Accept: 'application/json',
          },
        }
      )

      return response.ok
    } catch (error) {
      console.error('Okta group assignment error:', error)
      return false
    }
  }

  /**
   * Create Okta user
   */
  async createUser(
    apiToken: string,
    userData: {
      email: string
      firstName: string
      lastName: string
      login?: string
    }
  ): Promise<{ id: string; email: string } | null> {
    try {
      const response = await fetch(
        `https://${this.getOktaDomain()}/api/v1/users?activate=true`,
        {
          method: 'POST',
          headers: {
            Authorization: `SSWS ${apiToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            profile: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              login: userData.login || userData.email,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to create user: ${await response.text()}`)
      }

      const user = await response.json()
      return { id: user.id, email: user.profile.email }
    } catch (error) {
      console.error('Okta user creation error:', error)
      return null
    }
  }

  /**
   * Deactivate Okta user
   */
  async deactivateUser(apiToken: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://${this.getOktaDomain()}/api/v1/users/${userId}/lifecycle/deactivate`,
        {
          method: 'POST',
          headers: {
            Authorization: `SSWS ${apiToken}`,
            Accept: 'application/json',
          },
        }
      )

      return response.ok
    } catch (error) {
      console.error('Okta user deactivation error:', error)
      return false
    }
  }

  /**
   * List all Okta users
   */
  async listUsers(
    apiToken: string,
    limit: number = 200
  ): Promise<Array<{
    id: string
    email: string
    firstName: string
    lastName: string
    status: string
  }>> {
    try {
      const response = await fetch(
        `https://${this.getOktaDomain()}/api/v1/users?limit=${limit}`,
        {
          headers: {
            Authorization: `SSWS ${apiToken}`,
            Accept: 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to list users')
      }

      const users = await response.json()
      return users.map((u: any) => ({
        id: u.id,
        email: u.profile.email,
        firstName: u.profile.firstName,
        lastName: u.profile.lastName,
        status: u.status,
      }))
    } catch (error) {
      console.error('Okta users list error:', error)
      return []
    }
  }

  private getOktaDomain(): string {
    return process.env.OKTA_DOMAIN || ''
  }
}
