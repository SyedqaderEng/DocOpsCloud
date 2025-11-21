// Salesforce Integration

import { OAuthProvider, OAuthConfig } from '../oauth/provider'

export class SalesforceProvider extends OAuthProvider {
  private instanceUrl: string = ''

  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.SALESFORCE_CLIENT_ID || '',
      clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
      authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
      scopes: ['api', 'refresh_token', 'full'],
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/salesforce/callback`,
    }
    super(config)
  }

  protected getAdditionalAuthParams(): Record<string, string> {
    return {
      response_type: 'code',
    }
  }

  // Set instance URL from OAuth response
  setInstanceUrl(instanceUrl: string) {
    this.instanceUrl = instanceUrl
  }

  private getApiUrl(instanceUrl: string, path: string): string {
    return `${instanceUrl}/services/data/v59.0${path}`
  }

  // Query records using SOQL
  async query(
    accessToken: string,
    instanceUrl: string,
    soql: string
  ): Promise<{
    totalSize: number
    done: boolean
    records: any[]
    nextRecordsUrl?: string
  }> {
    const params = new URLSearchParams({ q: soql })

    const response = await fetch(
      this.getApiUrl(instanceUrl, `/query?${params.toString()}`),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Salesforce query failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create record
  async createRecord(
    accessToken: string,
    instanceUrl: string,
    objectType: string,
    data: Record<string, any>
  ): Promise<{
    id: string
    success: boolean
    errors: any[]
  }> {
    const response = await fetch(
      this.getApiUrl(instanceUrl, `/sobjects/${objectType}`),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error(`Salesforce create record failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get record by ID
  async getRecord(
    accessToken: string,
    instanceUrl: string,
    objectType: string,
    recordId: string,
    fields?: string[]
  ): Promise<any> {
    let url = this.getApiUrl(instanceUrl, `/sobjects/${objectType}/${recordId}`)

    if (fields && fields.length > 0) {
      url += `?fields=${fields.join(',')}`
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Salesforce get record failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Update record
  async updateRecord(
    accessToken: string,
    instanceUrl: string,
    objectType: string,
    recordId: string,
    data: Record<string, any>
  ): Promise<void> {
    const response = await fetch(
      this.getApiUrl(instanceUrl, `/sobjects/${objectType}/${recordId}`),
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error(`Salesforce update record failed: ${await response.text()}`)
    }
  }

  // Delete record
  async deleteRecord(
    accessToken: string,
    instanceUrl: string,
    objectType: string,
    recordId: string
  ): Promise<void> {
    const response = await fetch(
      this.getApiUrl(instanceUrl, `/sobjects/${objectType}/${recordId}`),
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Salesforce delete record failed: ${await response.text()}`)
    }
  }

  // Get object metadata
  async getObjectMetadata(
    accessToken: string,
    instanceUrl: string,
    objectType: string
  ): Promise<{
    name: string
    label: string
    fields: Array<{
      name: string
      label: string
      type: string
      length?: number
      picklistValues?: any[]
    }>
  }> {
    const response = await fetch(
      this.getApiUrl(instanceUrl, `/sobjects/${objectType}/describe`),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Salesforce get metadata failed: ${await response.text()}`)
    }

    return response.json()
  }

  // List all objects
  async listObjects(
    accessToken: string,
    instanceUrl: string
  ): Promise<{
    sobjects: Array<{
      name: string
      label: string
      custom: boolean
      keyPrefix: string
    }>
  }> {
    const response = await fetch(this.getApiUrl(instanceUrl, '/sobjects'), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Salesforce list objects failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create attachment
  async createAttachment(
    accessToken: string,
    instanceUrl: string,
    parentId: string,
    fileName: string,
    fileData: Buffer,
    contentType: string
  ): Promise<{
    id: string
    success: boolean
  }> {
    const base64Data = fileData.toString('base64')

    const response = await fetch(this.getApiUrl(instanceUrl, '/sobjects/Attachment'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ParentId: parentId,
        Name: fileName,
        Body: base64Data,
        ContentType: contentType,
      }),
    })

    if (!response.ok) {
      throw new Error(`Salesforce create attachment failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Search using SOSL
  async search(
    accessToken: string,
    instanceUrl: string,
    searchQuery: string
  ): Promise<{
    searchRecords: any[]
  }> {
    const params = new URLSearchParams({ q: searchQuery })

    const response = await fetch(
      this.getApiUrl(instanceUrl, `/search?${params.toString()}`),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Salesforce search failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get recently viewed records
  async getRecentlyViewed(
    accessToken: string,
    instanceUrl: string,
    limit: number = 10
  ): Promise<any[]> {
    const response = await fetch(
      this.getApiUrl(instanceUrl, `/recent?limit=${limit}`),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Salesforce get recent failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Bulk create records
  async bulkCreate(
    accessToken: string,
    instanceUrl: string,
    objectType: string,
    records: Record<string, any>[]
  ): Promise<Array<{
    id: string
    success: boolean
    errors: any[]
  }>> {
    const compositeRequest = {
      allOrNone: false,
      compositeRequest: records.map((record, index) => ({
        method: 'POST',
        url: `/services/data/v59.0/sobjects/${objectType}`,
        referenceId: `ref${index}`,
        body: record,
      })),
    }

    const response = await fetch(this.getApiUrl(instanceUrl, '/composite'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(compositeRequest),
    })

    if (!response.ok) {
      throw new Error(`Salesforce bulk create failed: ${await response.text()}`)
    }

    const result = await response.json()
    return result.compositeResponse
  }

  // Get user info
  async getUserInfo(accessToken: string, instanceUrl: string): Promise<{
    id: string
    username: string
    email: string
    display_name: string
    organization_id: string
  }> {
    const response = await fetch(`${instanceUrl}/services/oauth2/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Salesforce get user info failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create Opportunity
  async createOpportunity(
    accessToken: string,
    instanceUrl: string,
    data: {
      Name: string
      StageName: string
      CloseDate: string
      Amount?: number
      AccountId?: string
      [key: string]: any
    }
  ): Promise<{ id: string; success: boolean }> {
    return this.createRecord(accessToken, instanceUrl, 'Opportunity', data)
  }

  // Create Lead
  async createLead(
    accessToken: string,
    instanceUrl: string,
    data: {
      FirstName?: string
      LastName: string
      Company: string
      Email?: string
      Phone?: string
      [key: string]: any
    }
  ): Promise<{ id: string; success: boolean }> {
    return this.createRecord(accessToken, instanceUrl, 'Lead', data)
  }

  // Create Contact
  async createContact(
    accessToken: string,
    instanceUrl: string,
    data: {
      FirstName?: string
      LastName: string
      Email?: string
      Phone?: string
      AccountId?: string
      [key: string]: any
    }
  ): Promise<{ id: string; success: boolean }> {
    return this.createRecord(accessToken, instanceUrl, 'Contact', data)
  }

  // Create Account
  async createAccount(
    accessToken: string,
    instanceUrl: string,
    data: {
      Name: string
      Type?: string
      Industry?: string
      Phone?: string
      Website?: string
      [key: string]: any
    }
  ): Promise<{ id: string; success: boolean }> {
    return this.createRecord(accessToken, instanceUrl, 'Account', data)
  }

  // Create Case
  async createCase(
    accessToken: string,
    instanceUrl: string,
    data: {
      Subject: string
      Description?: string
      Status?: string
      Priority?: string
      Origin?: string
      ContactId?: string
      AccountId?: string
      [key: string]: any
    }
  ): Promise<{ id: string; success: boolean }> {
    return this.createRecord(accessToken, instanceUrl, 'Case', data)
  }
}

export const salesforce = new SalesforceProvider()
