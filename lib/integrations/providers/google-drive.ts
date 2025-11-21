// Google Drive Integration

import { OAuthProvider, OAuthConfig } from '../oauth/provider'

export class GoogleDriveProvider extends OAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/google-drive/callback`,
    }
    super(config)
  }

  protected getAdditionalAuthParams(): Record<string, string> {
    return {
      access_type: 'offline',
      prompt: 'consent',
    }
  }

  // Upload file to Google Drive
  async uploadFile(
    accessToken: string,
    fileName: string,
    fileData: Buffer,
    mimeType: string,
    folderId?: string
  ): Promise<{ id: string; webViewLink: string }> {
    const metadata = {
      name: fileName,
      ...(folderId && { parents: [folderId] }),
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', new Blob([fileData], { type: mimeType }))

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    )

    if (!response.ok) {
      throw new Error(`Google Drive upload failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Download file from Google Drive
  async downloadFile(accessToken: string, fileId: string): Promise<Buffer> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Google Drive download failed: ${await response.text()}`)
    }

    return Buffer.from(await response.arrayBuffer())
  }

  // List files
  async listFiles(
    accessToken: string,
    folderId?: string,
    pageSize = 10
  ): Promise<{ files: any[]; nextPageToken?: string }> {
    const params = new URLSearchParams({
      pageSize: String(pageSize),
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink)',
      ...(folderId && { q: `'${folderId}' in parents` }),
    })

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Google Drive list failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create folder
  async createFolder(
    accessToken: string,
    folderName: string,
    parentId?: string
  ): Promise<{ id: string; webViewLink: string }> {
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId && { parents: [parentId] }),
    }

    const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    })

    if (!response.ok) {
      throw new Error(`Google Drive folder creation failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Delete file
  async deleteFile(accessToken: string, fileId: string): Promise<void> {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Google Drive delete failed: ${await response.text()}`)
    }
  }
}

export const googleDrive = new GoogleDriveProvider()
