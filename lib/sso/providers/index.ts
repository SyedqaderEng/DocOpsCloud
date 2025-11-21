// SSO Providers Index

export { BaseSSOProvider, type SSOConfig, type SSOUser, type SSOValidationResult } from './base'
export { SAMLProvider } from './saml'
export { OIDCProvider, type OIDCConfig } from './oidc'
export { OktaProvider } from './okta'
export { AzureADProvider } from './azure-ad'

export type SSOProviderType = 'saml' | 'oidc' | 'okta' | 'azure-ad'

export interface SSOProviderMetadata {
  id: SSOProviderType
  name: string
  description: string
  protocol: 'SAML' | 'OIDC'
  supportsGroups: boolean
  requiresCertificate: boolean
}

export const SSO_PROVIDERS: Record<SSOProviderType, SSOProviderMetadata> = {
  saml: {
    id: 'saml',
    name: 'SAML 2.0',
    description: 'Generic SAML 2.0 identity provider',
    protocol: 'SAML',
    supportsGroups: true,
    requiresCertificate: true,
  },
  oidc: {
    id: 'oidc',
    name: 'OpenID Connect',
    description: 'Generic OpenID Connect identity provider',
    protocol: 'OIDC',
    supportsGroups: true,
    requiresCertificate: false,
  },
  okta: {
    id: 'okta',
    name: 'Okta',
    description: 'Okta identity and access management',
    protocol: 'OIDC',
    supportsGroups: true,
    requiresCertificate: false,
  },
  'azure-ad': {
    id: 'azure-ad',
    name: 'Azure AD',
    description: 'Microsoft Azure Active Directory / Entra ID',
    protocol: 'OIDC',
    supportsGroups: true,
    requiresCertificate: false,
  },
}

export function getSSOProviderMetadata(providerId: SSOProviderType): SSOProviderMetadata {
  return SSO_PROVIDERS[providerId]
}

export function getAllSSOProviders(): SSOProviderMetadata[] {
  return Object.values(SSO_PROVIDERS)
}
