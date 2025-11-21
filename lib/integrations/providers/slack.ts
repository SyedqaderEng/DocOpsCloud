// Slack Integration

import { OAuthProvider, OAuthConfig } from '../oauth/provider'

export class SlackProvider extends OAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.SLACK_CLIENT_ID || '',
      clientSecret: process.env.SLACK_CLIENT_SECRET || '',
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: [
        'channels:read',
        'channels:write',
        'chat:write',
        'files:write',
        'users:read',
        'groups:read',
      ],
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/slack/callback`,
    }
    super(config)
  }

  // Send message to channel
  async postMessage(
    accessToken: string,
    channel: string,
    text: string,
    options?: {
      thread_ts?: string
      blocks?: any[]
      attachments?: any[]
    }
  ): Promise<{
    ok: boolean
    channel: string
    ts: string
    message: any
  }> {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text,
        ...options,
      }),
    })

    if (!response.ok) {
      throw new Error(`Slack post message failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  // Upload file to Slack
  async uploadFile(
    accessToken: string,
    channels: string | string[],
    fileData: Buffer,
    fileName: string,
    options?: {
      title?: string
      initial_comment?: string
      thread_ts?: string
    }
  ): Promise<{
    ok: boolean
    file: {
      id: string
      name: string
      url_private: string
      permalink: string
    }
  }> {
    const form = new FormData()
    form.append('file', new Blob([fileData]), fileName)
    form.append('channels', Array.isArray(channels) ? channels.join(',') : channels)
    if (options?.title) form.append('title', options.title)
    if (options?.initial_comment) form.append('initial_comment', options.initial_comment)
    if (options?.thread_ts) form.append('thread_ts', options.thread_ts)

    const response = await fetch('https://slack.com/api/files.upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    })

    if (!response.ok) {
      throw new Error(`Slack upload file failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  // List channels
  async listChannels(
    accessToken: string,
    options?: {
      exclude_archived?: boolean
      limit?: number
      cursor?: string
    }
  ): Promise<{
    ok: boolean
    channels: Array<{
      id: string
      name: string
      is_channel: boolean
      is_private: boolean
      is_archived: boolean
      num_members: number
    }>
    response_metadata?: {
      next_cursor: string
    }
  }> {
    const params = new URLSearchParams({
      exclude_archived: String(options?.exclude_archived ?? true),
      limit: String(options?.limit ?? 100),
      ...(options?.cursor && { cursor: options.cursor }),
    })

    const response = await fetch(
      `https://slack.com/api/conversations.list?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Slack list channels failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  // Get channel info
  async getChannelInfo(
    accessToken: string,
    channelId: string
  ): Promise<{
    ok: boolean
    channel: {
      id: string
      name: string
      is_channel: boolean
      is_private: boolean
      is_archived: boolean
      topic: { value: string }
      purpose: { value: string }
      num_members: number
    }
  }> {
    const params = new URLSearchParams({ channel: channelId })

    const response = await fetch(
      `https://slack.com/api/conversations.info?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Slack get channel info failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  // Create channel
  async createChannel(
    accessToken: string,
    name: string,
    isPrivate: boolean = false
  ): Promise<{
    ok: boolean
    channel: {
      id: string
      name: string
      is_private: boolean
    }
  }> {
    const response = await fetch('https://slack.com/api/conversations.create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        is_private: isPrivate,
      }),
    })

    if (!response.ok) {
      throw new Error(`Slack create channel failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  // Invite users to channel
  async inviteToChannel(
    accessToken: string,
    channelId: string,
    userIds: string[]
  ): Promise<{
    ok: boolean
    channel: {
      id: string
    }
  }> {
    const response = await fetch('https://slack.com/api/conversations.invite', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        users: userIds.join(','),
      }),
    })

    if (!response.ok) {
      throw new Error(`Slack invite to channel failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  // Get channel members
  async getChannelMembers(
    accessToken: string,
    channelId: string,
    limit: number = 100
  ): Promise<{
    ok: boolean
    members: string[]
    response_metadata?: {
      next_cursor: string
    }
  }> {
    const params = new URLSearchParams({
      channel: channelId,
      limit: String(limit),
    })

    const response = await fetch(
      `https://slack.com/api/conversations.members?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Slack get members failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  // Get user info
  async getUserInfo(
    accessToken: string,
    userId: string
  ): Promise<{
    ok: boolean
    user: {
      id: string
      name: string
      real_name: string
      profile: {
        email: string
        image_48: string
        image_192: string
      }
    }
  }> {
    const params = new URLSearchParams({ user: userId })

    const response = await fetch(`https://slack.com/api/users.info?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Slack get user info failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  // List users
  async listUsers(
    accessToken: string,
    limit: number = 100,
    cursor?: string
  ): Promise<{
    ok: boolean
    members: Array<{
      id: string
      name: string
      real_name: string
      is_bot: boolean
      deleted: boolean
      profile: {
        email?: string
      }
    }>
    response_metadata?: {
      next_cursor: string
    }
  }> {
    const params = new URLSearchParams({
      limit: String(limit),
      ...(cursor && { cursor }),
    })

    const response = await fetch(`https://slack.com/api/users.list?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Slack list users failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  // Update message
  async updateMessage(
    accessToken: string,
    channel: string,
    ts: string,
    text: string,
    options?: {
      blocks?: any[]
      attachments?: any[]
    }
  ): Promise<{
    ok: boolean
    channel: string
    ts: string
  }> {
    const response = await fetch('https://slack.com/api/chat.update', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        ts,
        text,
        ...options,
      }),
    })

    if (!response.ok) {
      throw new Error(`Slack update message failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  // Delete message
  async deleteMessage(
    accessToken: string,
    channel: string,
    ts: string
  ): Promise<{
    ok: boolean
  }> {
    const response = await fetch('https://slack.com/api/chat.delete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        ts,
      }),
    })

    if (!response.ok) {
      throw new Error(`Slack delete message failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  // Add reaction to message
  async addReaction(
    accessToken: string,
    channel: string,
    timestamp: string,
    emoji: string
  ): Promise<{
    ok: boolean
  }> {
    const response = await fetch('https://slack.com/api/reactions.add', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        timestamp,
        name: emoji,
      }),
    })

    if (!response.ok) {
      throw new Error(`Slack add reaction failed: ${await response.text()}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }
}

export const slack = new SlackProvider()
