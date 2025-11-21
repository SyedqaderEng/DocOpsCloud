// Microsoft Teams Integration (Microsoft Graph API)

import { OAuthProvider, OAuthConfig } from '../oauth/provider'

export class MicrosoftTeamsProvider extends OAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: [
        'Team.ReadBasic.All',
        'Channel.ReadBasic.All',
        'ChannelMessage.Send',
        'Chat.ReadWrite',
        'offline_access',
      ],
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/microsoft-teams/callback`,
    }
    super(config)
  }

  protected getAdditionalAuthParams(): Record<string, string> {
    return {
      response_type: 'code',
      response_mode: 'query',
    }
  }

  // Get user's teams
  async getTeams(accessToken: string): Promise<{
    value: Array<{
      id: string
      displayName: string
      description: string
      isArchived: boolean
      webUrl: string
    }>
  }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/joinedTeams', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Teams get teams failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get team channels
  async getChannels(accessToken: string, teamId: string): Promise<{
    value: Array<{
      id: string
      displayName: string
      description: string
      email: string
      webUrl: string
      membershipType: string
    }>
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${teamId}/channels`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Teams get channels failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Send message to channel
  async sendMessageToChannel(
    accessToken: string,
    teamId: string,
    channelId: string,
    content: string,
    contentType: 'text' | 'html' = 'text'
  ): Promise<{
    id: string
    createdDateTime: string
    body: {
      content: string
      contentType: string
    }
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            contentType,
            content,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Teams send message failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Reply to message
  async replyToMessage(
    accessToken: string,
    teamId: string,
    channelId: string,
    messageId: string,
    content: string,
    contentType: 'text' | 'html' = 'text'
  ): Promise<{
    id: string
    createdDateTime: string
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            contentType,
            content,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Teams reply to message failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get channel messages
  async getChannelMessages(
    accessToken: string,
    teamId: string,
    channelId: string,
    top: number = 50
  ): Promise<{
    value: Array<{
      id: string
      createdDateTime: string
      from: {
        user: {
          id: string
          displayName: string
        }
      }
      body: {
        content: string
        contentType: string
      }
    }>
  }> {
    const params = new URLSearchParams({ $top: String(top) })

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Teams get messages failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create channel
  async createChannel(
    accessToken: string,
    teamId: string,
    displayName: string,
    description?: string,
    membershipType: 'standard' | 'private' = 'standard'
  ): Promise<{
    id: string
    displayName: string
    description: string
    membershipType: string
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${teamId}/channels`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName,
          description: description || '',
          membershipType,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Teams create channel failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get team members
  async getTeamMembers(accessToken: string, teamId: string): Promise<{
    value: Array<{
      id: string
      displayName: string
      userId: string
      email: string
      roles: string[]
    }>
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${teamId}/members`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Teams get members failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Add member to team
  async addTeamMember(
    accessToken: string,
    teamId: string,
    userId: string,
    roles: string[] = []
  ): Promise<{
    id: string
    roles: string[]
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${teamId}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles,
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${userId}')`,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Teams add member failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get user chats
  async getChats(accessToken: string): Promise<{
    value: Array<{
      id: string
      topic: string
      chatType: string
      createdDateTime: string
    }>
  }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/chats', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Teams get chats failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Send chat message
  async sendChatMessage(
    accessToken: string,
    chatId: string,
    content: string,
    contentType: 'text' | 'html' = 'text'
  ): Promise<{
    id: string
    createdDateTime: string
  }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/chats/${chatId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            contentType,
            content,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Teams send chat message failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get chat messages
  async getChatMessages(accessToken: string, chatId: string, top: number = 50): Promise<{
    value: Array<{
      id: string
      createdDateTime: string
      from: {
        user: {
          id: string
          displayName: string
        }
      }
      body: {
        content: string
        contentType: string
      }
    }>
  }> {
    const params = new URLSearchParams({ $top: String(top) })

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/chats/${chatId}/messages?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Teams get chat messages failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get online meetings
  async getOnlineMeetings(accessToken: string): Promise<{
    value: Array<{
      id: string
      subject: string
      startDateTime: string
      endDateTime: string
      joinWebUrl: string
    }>
  }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Teams get meetings failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create online meeting
  async createOnlineMeeting(
    accessToken: string,
    subject: string,
    startDateTime: string,
    endDateTime: string
  ): Promise<{
    id: string
    subject: string
    startDateTime: string
    endDateTime: string
    joinWebUrl: string
  }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        startDateTime,
        endDateTime,
      }),
    })

    if (!response.ok) {
      throw new Error(`Teams create meeting failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Upload file to channel
  async uploadFileToChannel(
    accessToken: string,
    teamId: string,
    channelId: string,
    fileName: string,
    fileData: Buffer
  ): Promise<{
    id: string
    name: string
    webUrl: string
  }> {
    // First, get the folder for the channel
    const driveResponse = await fetch(
      `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/filesFolder`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!driveResponse.ok) {
      throw new Error(`Teams get files folder failed: ${await driveResponse.text()}`)
    }

    const folderInfo = await driveResponse.json()
    const driveId = folderInfo.parentReference.driveId
    const folderId = folderInfo.id

    // Upload file to the drive
    const uploadResponse = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${folderId}:/${fileName}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: fileData,
      }
    )

    if (!uploadResponse.ok) {
      throw new Error(`Teams upload file failed: ${await uploadResponse.text()}`)
    }

    return uploadResponse.json()
  }
}

export const microsoftTeams = new MicrosoftTeamsProvider()
