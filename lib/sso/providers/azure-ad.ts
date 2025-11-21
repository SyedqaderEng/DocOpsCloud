// Azure AD / Microsoft Entra ID SSO Provider (OIDC)

import { OIDCProvider, OIDCConfig } from './oidc'

export class AzureADProvider extends OIDCProvider {
  private tenantId: string

  constructor(tenantId: string, clientId: string, clientSecret: string) {
    const config: OIDCConfig = {
      providerId: 'azure-ad',
      providerName: 'Azure Active Directory',
      entityId: `https://login.microsoftonline.com/${tenantId}`,
      ssoUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
      clientId,
      clientSecret,
      discoveryUrl: `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`,
      scopes: ['openid', 'profile', 'email', 'User.Read', 'GroupMember.Read.All'],
      attributeMappings: {
        email: 'email',
        firstName: 'given_name',
        lastName: 'family_name',
        displayName: 'name',
        groups: 'groups',
      },
    }

    super(config)
    this.tenantId = tenantId
  }

  /**
   * Create Azure AD provider from environment variables
   */
  static fromEnv(): AzureADProvider {
    const tenantId = process.env.AZURE_AD_TENANT_ID || 'common'
    const clientId = process.env.AZURE_AD_CLIENT_ID
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('Azure AD environment variables not configured')
    }

    return new AzureADProvider(tenantId, clientId, clientSecret)
  }

  /**
   * Get user's Azure AD groups using Microsoft Graph API
   */
  async getUserGroups(accessToken: string): Promise<Array<{
    id: string
    displayName: string
    description: string
  }>> {
    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/memberOf',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch user groups')
      }

      const data = await response.json()
      return data.value
        .filter((item: any) => item['@odata.type'] === '#microsoft.graph.group')
        .map((group: any) => ({
          id: group.id,
          displayName: group.displayName,
          description: group.description || '',
        }))
    } catch (error) {
      console.error('Azure AD groups fetch error:', error)
      return []
    }
  }

  /**
   * Get user's profile using Microsoft Graph API
   */
  async getUserProfile(accessToken: string): Promise<{
    id: string
    displayName: string
    mail: string
    jobTitle?: string
    department?: string
    officeLocation?: string
    mobilePhone?: string
  } | null> {
    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }

      return response.json()
    } catch (error) {
      console.error('Azure AD profile fetch error:', error)
      return null
    }
  }

  /**
   * Get user's photo using Microsoft Graph API
   */
  async getUserPhoto(accessToken: string): Promise<Buffer | null> {
    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/photo/$value',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        return null
      }

      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      console.error('Azure AD photo fetch error:', error)
      return null
    }
  }

  /**
   * Create Azure AD user (requires admin consent)
   */
  async createUser(
    accessToken: string,
    userData: {
      displayName: string
      userPrincipalName: string
      mailNickname: string
      accountEnabled?: boolean
      password?: string
    }
  ): Promise<{ id: string; userPrincipalName: string } | null> {
    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/users',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountEnabled: userData.accountEnabled ?? true,
            displayName: userData.displayName,
            mailNickname: userData.mailNickname,
            userPrincipalName: userData.userPrincipalName,
            passwordProfile: userData.password
              ? {
                  forceChangePasswordNextSignIn: true,
                  password: userData.password,
                }
              : undefined,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to create user: ${await response.text()}`)
      }

      const user = await response.json()
      return { id: user.id, userPrincipalName: user.userPrincipalName }
    } catch (error) {
      console.error('Azure AD user creation error:', error)
      return null
    }
  }

  /**
   * Add user to Azure AD group (requires admin consent)
   */
  async addUserToGroup(
    accessToken: string,
    groupId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/groups/${groupId}/members/$ref`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            '@odata.id': `https://graph.microsoft.com/v1.0/users/${userId}`,
          }),
        }
      )

      return response.ok
    } catch (error) {
      console.error('Azure AD group assignment error:', error)
      return false
    }
  }

  /**
   * List all users in tenant (requires admin consent)
   */
  async listUsers(
    accessToken: string,
    top: number = 100
  ): Promise<Array<{
    id: string
    displayName: string
    userPrincipalName: string
    mail: string
    jobTitle?: string
  }>> {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/users?$top=${top}&$select=id,displayName,userPrincipalName,mail,jobTitle`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to list users')
      }

      const data = await response.json()
      return data.value
    } catch (error) {
      console.error('Azure AD users list error:', error)
      return []
    }
  }

  /**
   * List all groups in tenant (requires admin consent)
   */
  async listGroups(
    accessToken: string,
    top: number = 100
  ): Promise<Array<{
    id: string
    displayName: string
    description: string
    mailEnabled: boolean
    securityEnabled: boolean
  }>> {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/groups?$top=${top}&$select=id,displayName,description,mailEnabled,securityEnabled`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to list groups')
      }

      const data = await response.json()
      return data.value
    } catch (error) {
      console.error('Azure AD groups list error:', error)
      return []
    }
  }

  /**
   * Get group members (requires admin consent)
   */
  async getGroupMembers(
    accessToken: string,
    groupId: string
  ): Promise<Array<{
    id: string
    displayName: string
    userPrincipalName: string
  }>> {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id,displayName,userPrincipalName`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch group members')
      }

      const data = await response.json()
      return data.value
    } catch (error) {
      console.error('Azure AD group members fetch error:', error)
      return []
    }
  }

  /**
   * Disable user account (requires admin consent)
   */
  async disableUser(accessToken: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/users/${userId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountEnabled: false,
          }),
        }
      )

      return response.ok
    } catch (error) {
      console.error('Azure AD user disable error:', error)
      return false
    }
  }
}
