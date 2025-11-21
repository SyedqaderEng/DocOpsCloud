// OneDrive Integration (Microsoft Graph API)

import { OAuthProvider, OAuthConfig } from '../oauth/provider'

export class OneDriveProvider extends OAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: ['Files.ReadWrite', 'Files.ReadWrite.All', 'offline_access'],
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/onedrive/callback`,
    }
    super(config)
  }

  protected getAdditionalAuthParams(): Record<string, string> {
    return {
      response_type: 'code',
      response_mode: 'query',
    }
  }

  // Upload file to OneDrive
  async uploadFile(
    accessToken: string,
    fileName: string,
    fileData: Buffer,
    folderId?: string
  ): Promise<{ id: string; webUrl: string; name: string }> {
    const uploadPath = folderId
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${fileName}:/content`
      : `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/content`

    const response = await fetch(uploadPath, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: fileData,
    })

    if (!response.ok) {
      throw new Error(`OneDrive upload failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Upload large file (>4MB) using upload session
  async uploadLargeFile(
    accessToken: string,
    fileName: string,
    fileData: Buffer,
    folderId?: string
  ): Promise<{ id: string; webUrl: string; name: string }> {
    // Create upload session
    const sessionPath = folderId
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${fileName}:/createUploadSession`
      : `https://graph.microsoft.com/v1.0/me/drive/root:/${fileName}:/createUploadSession`

    const sessionResponse = await fetch(sessionPath, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item: {
          '@microsoft.graph.conflictBehavior': 'rename',
        },
      }),
    })

    if (!sessionResponse.ok) {
      throw new Error(`OneDrive create session failed: ${await sessionResponse.text()}`)
    }

    const session = await sessionResponse.json()
    const uploadUrl = session.uploadUrl

    // Upload in chunks (10MB chunks)
    const chunkSize = 10 * 1024 * 1024
    const fileSize = fileData.length
    let offset = 0

    while (offset < fileSize) {
      const end = Math.min(offset + chunkSize, fileSize)
      const chunk = fileData.slice(offset, end)

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': chunk.length.toString(),
          'Content-Range': `bytes ${offset}-${end - 1}/${fileSize}`,
        },
        body: chunk,
      })

      if (!uploadResponse.ok && uploadResponse.status !== 202) {
        throw new Error(`OneDrive chunk upload failed: ${await uploadResponse.text()}`)
      }

      offset = end
    }

    // Get final file info
    const finalResponse = await fetch(uploadUrl, { method: 'GET' })
    return finalResponse.json()
  }

  // Download file from OneDrive
  async downloadFile(accessToken: string, fileId: string): Promise<Buffer> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`OneDrive download failed: ${await response.text()}`)
    }

    return Buffer.from(await response.arrayBuffer())
  }

  // List files and folders
  async listItems(
    accessToken: string,
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
    const listPath = folderId
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`
      : 'https://graph.microsoft.com/v1.0/me/drive/root/children'

    const response = await fetch(listPath, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`OneDrive list failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create folder
  async createFolder(
    accessToken: string,
    folderName: string,
    parentId?: string
  ): Promise<{ id: string; webUrl: string; name: string }> {
    const createPath = parentId
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children`
      : 'https://graph.microsoft.com/v1.0/me/drive/root/children'

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
      throw new Error(`OneDrive create folder failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Delete file or folder
  async deleteItem(accessToken: string, itemId: string): Promise<void> {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`OneDrive delete failed: ${await response.text()}`)
    }
  }

  // Get item metadata
  async getItem(
    accessToken: string,
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
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`OneDrive get item failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Search files
  async search(
    accessToken: string,
    query: string
  ): Promise<{
    value: Array<{
      id: string
      name: string
      webUrl: string
      size?: number
    }>
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root/search(q='${encodeURIComponent(query)}')`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`OneDrive search failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Copy item
  async copyItem(
    accessToken: string,
    itemId: string,
    destinationFolderId: string,
    newName?: string
  ): Promise<{ id: string }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/copy`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentReference: {
            id: destinationFolderId,
          },
          ...(newName && { name: newName }),
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`OneDrive copy failed: ${await response.text()}`)
    }

    // Copy is async, returns location header to monitor status
    const monitorUrl = response.headers.get('Location')
    return { id: monitorUrl || '' }
  }

  // Move item
  async moveItem(
    accessToken: string,
    itemId: string,
    destinationFolderId: string,
    newName?: string
  ): Promise<{ id: string; name: string; webUrl: string }> {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parentReference: {
          id: destinationFolderId,
        },
        ...(newName && { name: newName }),
      }),
    })

    if (!response.ok) {
      throw new Error(`OneDrive move failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create sharing link
  async createSharingLink(
    accessToken: string,
    itemId: string,
    type: 'view' | 'edit' = 'view',
    scope: 'anonymous' | 'organization' = 'anonymous'
  ): Promise<{ link: { webUrl: string; type: string } }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/createLink`,
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
      throw new Error(`OneDrive create link failed: ${await response.text()}`)
    }

    return response.json()
  }
}

export const onedrive = new OneDriveProvider()
