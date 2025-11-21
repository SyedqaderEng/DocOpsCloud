// Dropbox Integration

import { OAuthProvider, OAuthConfig } from '../oauth/provider'

export class DropboxProvider extends OAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.DROPBOX_CLIENT_ID || '',
      clientSecret: process.env.DROPBOX_CLIENT_SECRET || '',
      authorizationUrl: 'https://www.dropbox.com/oauth2/authorize',
      tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
      scopes: ['files.content.write', 'files.content.read', 'files.metadata.read'],
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/dropbox/callback`,
    }
    super(config)
  }

  protected getAdditionalAuthParams(): Record<string, string> {
    return {
      token_access_type: 'offline',
    }
  }

  // Upload file to Dropbox
  async uploadFile(
    accessToken: string,
    filePath: string,
    fileData: Buffer,
    mode: 'add' | 'overwrite' = 'add'
  ): Promise<{ id: string; path_display: string; client_modified: string }> {
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: filePath,
          mode,
          autorename: true,
          mute: false,
        }),
      },
      body: fileData,
    })

    if (!response.ok) {
      throw new Error(`Dropbox upload failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Download file from Dropbox
  async downloadFile(accessToken: string, filePath: string): Promise<Buffer> {
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({ path: filePath }),
      },
    })

    if (!response.ok) {
      throw new Error(`Dropbox download failed: ${await response.text()}`)
    }

    return Buffer.from(await response.arrayBuffer())
  }

  // List files and folders
  async listFolder(
    accessToken: string,
    folderPath: string = '',
    recursive: boolean = false
  ): Promise<{
    entries: Array<{
      '.tag': 'file' | 'folder'
      name: string
      path_display: string
      id: string
      size?: number
      client_modified?: string
    }>
    has_more: boolean
    cursor?: string
  }> {
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: folderPath,
        recursive,
        include_deleted: false,
        include_has_explicit_shared_members: false,
        include_mounted_folders: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Dropbox list folder failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create folder
  async createFolder(
    accessToken: string,
    folderPath: string
  ): Promise<{ name: string; path_display: string; id: string }> {
    const response = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: folderPath,
        autorename: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Dropbox create folder failed: ${await response.text()}`)
    }

    const result = await response.json()
    return result.metadata
  }

  // Delete file or folder
  async delete(accessToken: string, path: string): Promise<void> {
    const response = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    })

    if (!response.ok) {
      throw new Error(`Dropbox delete failed: ${await response.text()}`)
    }
  }

  // Get file metadata
  async getMetadata(
    accessToken: string,
    path: string
  ): Promise<{
    '.tag': 'file' | 'folder'
    name: string
    path_display: string
    id: string
    size?: number
    client_modified?: string
  }> {
    const response = await fetch('https://api.dropboxapi.com/2/files/get_metadata', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        include_deleted: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Dropbox get metadata failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Search files
  async search(
    accessToken: string,
    query: string,
    path: string = '',
    maxResults: number = 100
  ): Promise<{
    matches: Array<{
      metadata: {
        '.tag': 'file' | 'folder'
        name: string
        path_display: string
        id: string
      }
    }>
    has_more: boolean
  }> {
    const response = await fetch('https://api.dropboxapi.com/2/files/search_v2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        options: {
          path: path || undefined,
          max_results: maxResults,
          file_status: 'active',
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Dropbox search failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Copy file or folder
  async copy(
    accessToken: string,
    fromPath: string,
    toPath: string
  ): Promise<{ name: string; path_display: string; id: string }> {
    const response = await fetch('https://api.dropboxapi.com/2/files/copy_v2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_path: fromPath,
        to_path: toPath,
        autorename: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Dropbox copy failed: ${await response.text()}`)
    }

    const result = await response.json()
    return result.metadata
  }

  // Move file or folder
  async move(
    accessToken: string,
    fromPath: string,
    toPath: string
  ): Promise<{ name: string; path_display: string; id: string }> {
    const response = await fetch('https://api.dropboxapi.com/2/files/move_v2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_path: fromPath,
        to_path: toPath,
        autorename: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Dropbox move failed: ${await response.text()}`)
    }

    const result = await response.json()
    return result.metadata
  }
}

export const dropbox = new DropboxProvider()
