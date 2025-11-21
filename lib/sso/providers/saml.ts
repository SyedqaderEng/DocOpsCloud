// SAML 2.0 Provider
import { BaseSSOProvider, SSOConfig, SSOValidationResult, SSOUser } from './base'
import * as crypto from 'crypto'

export class SAMLProvider extends BaseSSOProvider {
  private assertionConsumerServiceUrl: string

  constructor(config: SSOConfig) {
    super(config)
    this.assertionConsumerServiceUrl =
      `${process.env.NEXTAUTH_URL}/api/auth/saml/acs`
  }

  /**
   * Generate SAML login URL with AuthnRequest
   */
  generateLoginUrl(returnUrl?: string): string {
    const requestId = this.generateId()
    const issueInstant = new Date().toISOString()

    const authnRequest = this.buildAuthnRequest(requestId, issueInstant)
    const encodedRequest = Buffer.from(authnRequest).toString('base64')

    const params = new URLSearchParams({
      SAMLRequest: encodedRequest,
      ...(returnUrl && { RelayState: returnUrl }),
    })

    return `${this.config.ssoUrl}?${params.toString()}`
  }

  /**
   * Validate SAML response
   */
  async validateResponse(samlResponse: string): Promise<SSOValidationResult> {
    try {
      // Decode SAML response
      const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8')

      // Parse XML (simplified - in production use xml-crypto library)
      const assertions = this.parseAssertions(decoded)

      if (!assertions) {
        return { valid: false, error: 'No assertions found in SAML response' }
      }

      // Validate signature if certificate is provided
      if (this.config.certificate) {
        const isValid = await this.validateSignature(decoded, this.config.certificate)
        if (!isValid) {
          return { valid: false, error: 'Invalid SAML signature' }
        }
      }

      // Extract user from assertions
      const user = this.extractUserFromAssertions(assertions)

      if (!user.email) {
        return { valid: false, error: 'Email not found in SAML assertions' }
      }

      return { valid: true, user }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'SAML validation failed',
      }
    }
  }

  /**
   * Generate SAML metadata for Service Provider
   */
  async getMetadata(): Promise<string> {
    const entityId = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    return `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="${entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true"
                      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="${this.assertionConsumerServiceUrl}"
                                 index="0" isDefault="true"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`
  }

  /**
   * Build SAML AuthnRequest
   */
  private buildAuthnRequest(requestId: string, issueInstant: string): string {
    const entityId = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    return `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${this.config.ssoUrl}"
  AssertionConsumerServiceURL="${this.assertionConsumerServiceUrl}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${entityId}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                      AllowCreate="true"/>
</samlp:AuthnRequest>`
  }

  /**
   * Parse assertions from SAML response (simplified XML parsing)
   */
  private parseAssertions(xml: string): Record<string, any> | null {
    // In production, use proper XML parser like xml2js or fast-xml-parser
    // This is simplified for demonstration

    const attributes: Record<string, any> = {}

    // Extract NameID (email)
    const nameIdMatch = xml.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/)
    if (nameIdMatch) {
      attributes['email'] = nameIdMatch[1]
    }

    // Extract AttributeStatements
    const attrRegex = /<saml:Attribute Name="([^"]+)"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/g
    let match

    while ((match = attrRegex.exec(xml)) !== null) {
      const attrName = match[1]
      const attrValue = match[2]
      attributes[attrName] = attrValue
    }

    return Object.keys(attributes).length > 0 ? attributes : null
  }

  /**
   * Extract user from SAML assertions
   */
  private extractUserFromAssertions(assertions: Record<string, any>): SSOUser {
    return this.extractUserAttributes(assertions, this.config.attributeMappings)
  }

  /**
   * Validate SAML response signature
   */
  private async validateSignature(xml: string, certificate: string): Promise<boolean> {
    try {
      // In production, use xml-crypto library for proper signature validation
      // This is a placeholder implementation

      // Extract signature value from XML
      const signatureMatch = xml.match(/<SignatureValue>([^<]+)<\/SignatureValue>/)
      if (!signatureMatch) {
        return false
      }

      const signature = Buffer.from(signatureMatch[1], 'base64')

      // Extract signed info
      const signedInfoMatch = xml.match(/<SignedInfo>([\s\S]*?)<\/SignedInfo>/)
      if (!signedInfoMatch) {
        return false
      }

      const signedInfo = signedInfoMatch[0]

      // Verify signature with certificate
      const verifier = crypto.createVerify('RSA-SHA256')
      verifier.update(signedInfo)

      const publicKey = `-----BEGIN CERTIFICATE-----\n${certificate}\n-----END CERTIFICATE-----`

      return verifier.verify(publicKey, signature)
    } catch (error) {
      console.error('Signature validation error:', error)
      return false
    }
  }

  /**
   * Generate unique ID for SAML requests
   */
  private generateId(): string {
    return `_${crypto.randomBytes(16).toString('hex')}`
  }
}
