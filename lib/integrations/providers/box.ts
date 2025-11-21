// Box Integration

import { OAuthProvider, OAuthConfig } from '../oauth/provider'

export class BoxProvider extends OAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.BOX_CLIENT_ID || '',
      clientSecret: process.env.BOX_CLIENT_SECRET || '',
      authorizationUrl: 'https://account.box.com/api/oauth2/authorize',
      tokenUrl: 'https://api.box.com/oauth2/token',
      scopes: ['root_readwrite'],
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/box/callback`,
    }
    super(config)
  }

  // Upload file to Box
  async uploadFile(
    accessToken: string,
    fileName: string,
    fileData: Buffer,
    folderId: string = '0' // 0 is root folder
  ): Promise<{
    id: string
    name: string
    size: number
    created_at: string
    modified_at: string
  }> {
    const form = new FormData()
    form.append('attributes', JSON.stringify({ name: fileName, parent: { id: folderId } }))
    form.append('file', new Blob([fileData]))

    const response = await fetch('https://upload.box.com/api/2.0/files/content', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    })

    if (!response.ok) {
      throw new Error(`Box upload failed: ${await response.text()}`)
    }

    const result = await response.json()
    return result.entries[0]
  }

  // Download file from Box
  async downloadFile(accessToken: string, fileId: string): Promise<Buffer> {
    const response = await fetch(`https://api.box.com/2.0/files/${fileId}/content`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Box download failed: ${await response.text()}`)
    }

    return Buffer.from(await response.arrayBuffer())
  }

  // List folder items
  async listFolderItems(
    accessToken: string,
    folderId: string = '0',
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    entries: Array<{
      type: 'file' | 'folder'
      id: string
      name: string
      size?: number
      created_at: string
      modified_at: string
    }>
    total_count: number
    offset: number
    limit: number
  }> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      fields: 'id,name,type,size,created_at,modified_at',
    })

    const response = await fetch(
      `https://api.box.com/2.0/folders/${folderId}/items?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Box list folder failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create folder
  async createFolder(
    accessToken: string,
    folderName: string,
    parentId: string = '0'
  ): Promise<{
    id: string
    name: string
    created_at: string
    modified_at: string
  }> {
    const response = await fetch('https://api.box.com/2.0/folders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        parent: { id: parentId },
      }),
    })

    if (!response.ok) {
      throw new Error(`Box create folder failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Delete file or folder
  async deleteItem(accessToken: string, itemId: string, itemType: 'file' | 'folder'): Promise<void> {
    const endpoint =
      itemType === 'file'
        ? `https://api.box.com/2.0/files/${itemId}`
        : `https://api.box.com/2.0/folders/${itemId}?recursive=true`

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok && response.status !== 204) {
      throw new Error(`Box delete failed: ${await response.text()}`)
    }
  }

  // Get file info
  async getFileInfo(
    accessToken: string,
    fileId: string
  ): Promise<{
    id: string
    name: string
    size: number
    created_at: string
    modified_at: string
    description: string
    shared_link: any
  }> {
    const response = await fetch(`https://api.box.com/2.0/files/${fileId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Box get file info failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get folder info
  async getFolderInfo(
    accessToken: string,
    folderId: string
  ): Promise<{
    id: string
    name: string
    created_at: string
    modified_at: string
    description: string
    item_collection: {
      total_count: number
    }
  }> {
    const response = await fetch(`https://api.box.com/2.0/folders/${folderId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Box get folder info failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Search content
  async search(
    accessToken: string,
    query: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    entries: Array<{
      type: 'file' | 'folder'
      id: string
      name: string
    }>
    total_count: number
  }> {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
      offset: String(offset),
    })

    const response = await fetch(
      `https://api.box.com/2.0/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Box search failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Copy file
  async copyFile(
    accessToken: string,
    fileId: string,
    destinationFolderId: string,
    newName?: string
  ): Promise<{
    id: string
    name: string
  }> {
    const response = await fetch(`https://api.box.com/2.0/files/${fileId}/copy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { id: destinationFolderId },
        ...(newName && { name: newName }),
      }),
    })

    if (!response.ok) {
      throw new Error(`Box copy file failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Copy folder
  async copyFolder(
    accessToken: string,
    folderId: string,
    destinationFolderId: string,
    newName?: string
  ): Promise<{
    id: string
    name: string
  }> {
    const response = await fetch(`https://api.box.com/2.0/folders/${folderId}/copy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { id: destinationFolderId },
        ...(newName && { name: newName }),
      }),
    })

    if (!response.ok) {
      throw new Error(`Box copy folder failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Move file
  async moveFile(
    accessToken: string,
    fileId: string,
    destinationFolderId: string,
    newName?: string
  ): Promise<{
    id: string
    name: string
  }> {
    const response = await fetch(`https://api.box.com/2.0/files/${fileId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { id: destinationFolderId },
        ...(newName && { name: newName }),
      }),
    })

    if (!response.ok) {
      throw new Error(`Box move file failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Move folder
  async moveFolder(
    accessToken: string,
    folderId: string,
    destinationFolderId: string,
    newName?: string
  ): Promise<{
    id: string
    name: string
  }> {
    const response = await fetch(`https://api.box.com/2.0/folders/${folderId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { id: destinationFolderId },
        ...(newName && { name: newName }),
      }),
    })

    if (!response.ok) {
      throw new Error(`Box move folder failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create shared link
  async createSharedLink(
    accessToken: string,
    fileId: string,
    access: 'open' | 'company' | 'collaborators' = 'open'
  ): Promise<{
    shared_link: {
      url: string
      download_url: string
      access: string
    }
  }> {
    const response = await fetch(`https://api.box.com/2.0/files/${fileId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shared_link: {
          access,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Box create shared link failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get current user info
  async getCurrentUser(accessToken: string): Promise<{
    id: string
    name: string
    login: string
    space_amount: number
    space_used: number
  }> {
    const response = await fetch('https://api.box.com/2.0/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Box get user failed: ${await response.text()}`)
    }

    return response.json()
  }
}

export const box = new BoxProvider()
