// SharePoint Integration (Microsoft Graph API)

import { OAuthProvider, OAuthConfig } from '../oauth/provider'

export class SharePointProvider extends OAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: ['Sites.ReadWrite.All', 'Files.ReadWrite.All', 'offline_access'],
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/sharepoint/callback`,
    }
    super(config)
  }

  protected getAdditionalAuthParams(): Record<string, string> {
    return {
      response_type: 'code',
      response_mode: 'query',
    }
  }

  // Get user's sites
  async getSites(accessToken: string): Promise<{
    value: Array<{
      id: string
      name: string
      displayName: string
      webUrl: string
      createdDateTime: string
    }>
  }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/sites?search=*', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`SharePoint get sites failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get site by ID
  async getSite(
    accessToken: string,
    siteId: string
  ): Promise<{
    id: string
    name: string
    displayName: string
    webUrl: string
  }> {
    const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`SharePoint get site failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get document libraries (drives) in a site
  async getDocumentLibraries(accessToken: string, siteId: string): Promise<{
    value: Array<{
      id: string
      name: string
      description: string
      webUrl: string
      driveType: string
    }>
  }> {
    const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`SharePoint get libraries failed: ${await response.text()}`)
    }

    return response.json()
  }

  // List items in a document library
  async listLibraryItems(
    accessToken: string,
    siteId: string,
    driveId: string,
    folderId?: string
  ): Promise<{
    value: Array<{
      id: string
      name: string
      size?: number
      createdDateTime: string
      lastModifiedDateTime: string
      webUrl: string
      folder?: { childCount: number }
      file?: { mimeType: string }
    }>
  }> {
    const endpoint = folderId
      ? `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${folderId}/children`
      : `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root/children`

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`SharePoint list items failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Upload file to SharePoint library
  async uploadFile(
    accessToken: string,
    siteId: string,
    driveId: string,
    fileName: string,
    fileData: Buffer,
    folderId?: string
  ): Promise<{ id: string; webUrl: string; name: string }> {
    const uploadPath = folderId
      ? `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${folderId}:/${fileName}:/content`
      : `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${fileName}:/content`

    const response = await fetch(uploadPath, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: fileData,
    })

    if (!response.ok) {
      throw new Error(`SharePoint upload failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Download file from SharePoint
  async downloadFile(accessToken: string, siteId: string, driveId: string, itemId: string): Promise<Buffer> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${itemId}/content`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`SharePoint download failed: ${await response.text()}`)
    }

    return Buffer.from(await response.arrayBuffer())
  }

  // Create folder in SharePoint
  async createFolder(
    accessToken: string,
    siteId: string,
    driveId: string,
    folderName: string,
    parentId?: string
  ): Promise<{ id: string; webUrl: string; name: string }> {
    const createPath = parentId
      ? `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${parentId}/children`
      : `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root/children`

    const response = await fetch(createPath, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename',
      }),
    })

    if (!response.ok) {
      throw new Error(`SharePoint create folder failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Delete item from SharePoint
  async deleteItem(accessToken: string, siteId: string, driveId: string, itemId: string): Promise<void> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${itemId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`SharePoint delete failed: ${await response.text()}`)
    }
  }

  // Get item metadata
  async getItem(
    accessToken: string,
    siteId: string,
    driveId: string,
    itemId: string
  ): Promise<{
    id: string
    name: string
    size?: number
    createdDateTime: string
    lastModifiedDateTime: string
    webUrl: string
    folder?: { childCount: number }
    file?: { mimeType: string }
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${itemId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`SharePoint get item failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Search in SharePoint site
  async search(
    accessToken: string,
    siteId: string,
    query: string
  ): Promise<{
    value: Array<{
      id: string
      name: string
      webUrl: string
    }>
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root/search(q='${encodeURIComponent(query)}')`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`SharePoint search failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Copy item
  async copyItem(
    accessToken: string,
    siteId: string,
    driveId: string,
    itemId: string,
    destinationFolderId: string,
    newName?: string
  ): Promise<{ id: string }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${itemId}/copy`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentReference: {
            driveId,
            id: destinationFolderId,
          },
          ...(newName && { name: newName }),
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`SharePoint copy failed: ${await response.text()}`)
    }

    const monitorUrl = response.headers.get('Location')
    return { id: monitorUrl || '' }
  }

  // Move item
  async moveItem(
    accessToken: string,
    siteId: string,
    driveId: string,
    itemId: string,
    destinationFolderId: string,
    newName?: string
  ): Promise<{ id: string; name: string; webUrl: string }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${itemId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentReference: {
            driveId,
            id: destinationFolderId,
          },
          ...(newName && { name: newName }),
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`SharePoint move failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create sharing link
  async createSharingLink(
    accessToken: string,
    siteId: string,
    driveId: string,
    itemId: string,
    type: 'view' | 'edit' = 'view',
    scope: 'anonymous' | 'organization' = 'organization'
  ): Promise<{ link: { webUrl: string; type: string } }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${itemId}/createLink`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          scope,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`SharePoint create link failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get site lists
  async getLists(accessToken: string, siteId: string): Promise<{
    value: Array<{
      id: string
      name: string
      displayName: string
      description: string
      webUrl: string
    }>
  }> {
    const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`SharePoint get lists failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get list items
  async getListItems(
    accessToken: string,
    siteId: string,
    listId: string
  ): Promise<{
    value: Array<{
      id: string
      fields: Record<string, any>
      createdDateTime: string
      lastModifiedDateTime: string
    }>
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`SharePoint get list items failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create list item
  async createListItem(
    accessToken: string,
    siteId: string,
    listId: string,
    fields: Record<string, any>
  ): Promise<{
    id: string
    fields: Record<string, any>
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    )

    if (!response.ok) {
      throw new Error(`SharePoint create list item failed: ${await response.text()}`)
    }

    return response.json()
  }
}

export const sharepoint = new SharePointProvider()
