// HubSpot Integration

import { OAuthProvider, OAuthConfig } from '../oauth/provider'

export class HubSpotProvider extends OAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.HUBSPOT_CLIENT_ID || '',
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
      authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
      tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
      scopes: [
        'crm.objects.contacts.read',
        'crm.objects.contacts.write',
        'crm.objects.companies.read',
        'crm.objects.companies.write',
        'crm.objects.deals.read',
        'crm.objects.deals.write',
        'files',
        'forms',
      ],
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/hubspot/callback`,
    }
    super(config)
  }

  // Create contact
  async createContact(
    accessToken: string,
    properties: {
      email: string
      firstname?: string
      lastname?: string
      phone?: string
      company?: string
      website?: string
      [key: string]: any
    }
  ): Promise<{
    id: string
    properties: any
    createdAt: string
    updatedAt: string
  }> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    })

    if (!response.ok) {
      throw new Error(`HubSpot create contact failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get contact by ID
  async getContact(
    accessToken: string,
    contactId: string,
    properties?: string[]
  ): Promise<{
    id: string
    properties: any
    createdAt: string
    updatedAt: string
  }> {
    let url = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`

    if (properties && properties.length > 0) {
      url += `?properties=${properties.join(',')}`
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HubSpot get contact failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Update contact
  async updateContact(
    accessToken: string,
    contactId: string,
    properties: Record<string, any>
  ): Promise<{
    id: string
    properties: any
    updatedAt: string
  }> {
    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      }
    )

    if (!response.ok) {
      throw new Error(`HubSpot update contact failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Search contacts
  async searchContacts(
    accessToken: string,
    filters: Array<{
      propertyName: string
      operator: string
      value: string
    }>,
    limit: number = 10
  ): Promise<{
    total: number
    results: Array<{
      id: string
      properties: any
    }>
  }> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [{ filters }],
        limit,
      }),
    })

    if (!response.ok) {
      throw new Error(`HubSpot search contacts failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create company
  async createCompany(
    accessToken: string,
    properties: {
      name: string
      domain?: string
      industry?: string
      phone?: string
      city?: string
      state?: string
      [key: string]: any
    }
  ): Promise<{
    id: string
    properties: any
    createdAt: string
  }> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    })

    if (!response.ok) {
      throw new Error(`HubSpot create company failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get company
  async getCompany(
    accessToken: string,
    companyId: string,
    properties?: string[]
  ): Promise<{
    id: string
    properties: any
  }> {
    let url = `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`

    if (properties && properties.length > 0) {
      url += `?properties=${properties.join(',')}`
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HubSpot get company failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Update company
  async updateCompany(
    accessToken: string,
    companyId: string,
    properties: Record<string, any>
  ): Promise<{
    id: string
    properties: any
  }> {
    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      }
    )

    if (!response.ok) {
      throw new Error(`HubSpot update company failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create deal
  async createDeal(
    accessToken: string,
    properties: {
      dealname: string
      dealstage: string
      amount?: string
      closedate?: string
      pipeline?: string
      [key: string]: any
    }
  ): Promise<{
    id: string
    properties: any
    createdAt: string
  }> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    })

    if (!response.ok) {
      throw new Error(`HubSpot create deal failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get deal
  async getDeal(
    accessToken: string,
    dealId: string,
    properties?: string[]
  ): Promise<{
    id: string
    properties: any
  }> {
    let url = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`

    if (properties && properties.length > 0) {
      url += `?properties=${properties.join(',')}`
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HubSpot get deal failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Update deal
  async updateDeal(
    accessToken: string,
    dealId: string,
    properties: Record<string, any>
  ): Promise<{
    id: string
    properties: any
  }> {
    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    })

    if (!response.ok) {
      throw new Error(`HubSpot update deal failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Associate records (e.g., contact to company)
  async associateRecords(
    accessToken: string,
    fromObjectType: string,
    fromObjectId: string,
    toObjectType: string,
    toObjectId: string,
    associationType: string
  ): Promise<{
    fromObjectId: string
    toObjectId: string
  }> {
    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}/${toObjectId}/${associationType}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HubSpot associate records failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get associations
  async getAssociations(
    accessToken: string,
    objectType: string,
    objectId: string,
    toObjectType: string
  ): Promise<{
    results: Array<{
      id: string
      type: string
    }>
  }> {
    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/${objectType}/${objectId}/associations/${toObjectType}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HubSpot get associations failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Upload file
  async uploadFile(
    accessToken: string,
    fileName: string,
    fileData: Buffer,
    folderId?: string,
    options?: {
      access: 'PUBLIC_INDEXABLE' | 'PUBLIC_NOT_INDEXABLE' | 'PRIVATE'
      overwrite?: boolean
    }
  ): Promise<{
    id: string
    url: string
    name: string
    size: number
  }> {
    const form = new FormData()
    form.append('file', new Blob([fileData]), fileName)

    const uploadOptions = {
      access: options?.access || 'PRIVATE',
      overwrite: options?.overwrite || false,
      ...(folderId && { folderId }),
    }
    form.append('options', JSON.stringify(uploadOptions))

    const response = await fetch('https://api.hubapi.com/filemanager/api/v3/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    })

    if (!response.ok) {
      throw new Error(`HubSpot upload file failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get file
  async getFile(accessToken: string, fileId: string): Promise<{
    id: string
    url: string
    name: string
    size: number
    createdAt: string
  }> {
    const response = await fetch(`https://api.hubapi.com/filemanager/api/v3/files/${fileId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HubSpot get file failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create note
  async createNote(
    accessToken: string,
    properties: {
      hs_note_body: string
      hs_timestamp?: string
    },
    associations?: Array<{
      to: { id: string }
      types: Array<{ associationCategory: string; associationTypeId: number }>
    }>
  ): Promise<{
    id: string
    properties: any
  }> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties,
        ...(associations && { associations }),
      }),
    })

    if (!response.ok) {
      throw new Error(`HubSpot create note failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create task
  async createTask(
    accessToken: string,
    properties: {
      hs_task_body: string
      hs_task_subject: string
      hs_task_status: string
      hs_task_priority?: string
      hs_timestamp?: string
    }
  ): Promise<{
    id: string
    properties: any
  }> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/tasks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    })

    if (!response.ok) {
      throw new Error(`HubSpot create task failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get forms
  async getForms(accessToken: string): Promise<{
    results: Array<{
      id: string
      name: string
      createdAt: string
    }>
  }> {
    const response = await fetch('https://api.hubapi.com/marketing/v3/forms', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HubSpot get forms failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get form submissions
  async getFormSubmissions(
    accessToken: string,
    formId: string,
    limit: number = 50
  ): Promise<{
    results: Array<{
      submittedAt: string
      values: Array<{
        name: string
        value: string
      }>
    }>
  }> {
    const params = new URLSearchParams({ limit: String(limit) })

    const response = await fetch(
      `https://api.hubapi.com/form-integrations/v1/submissions/forms/${formId}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HubSpot get form submissions failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get pipelines
  async getPipelines(
    accessToken: string,
    objectType: 'deals' | 'tickets'
  ): Promise<{
    results: Array<{
      id: string
      label: string
      stages: Array<{
        id: string
        label: string
        displayOrder: number
      }>
    }>
  }> {
    const response = await fetch(
      `https://api.hubapi.com/crm/v3/pipelines/${objectType}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HubSpot get pipelines failed: ${await response.text()}`)
    }

    return response.json()
  }
}

export const hubspot = new HubSpotProvider()
