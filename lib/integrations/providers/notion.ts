// Notion Integration

import { OAuthProvider, OAuthConfig } from '../oauth/provider'

export class NotionProvider extends OAuthProvider {
  constructor() {
    const config: OAuthConfig = {
      clientId: process.env.NOTION_CLIENT_ID || '',
      clientSecret: process.env.NOTION_CLIENT_SECRET || '',
      authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
      scopes: [], // Notion doesn't use granular scopes
      redirectUri: `${process.env.NEXTAUTH_URL}/api/integrations/notion/callback`,
    }
    super(config)
  }

  protected getAdditionalAuthParams(): Record<string, string> {
    return {
      owner: 'user',
    }
  }

  private getHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    }
  }

  // Search across workspace
  async search(
    accessToken: string,
    query: string,
    filter?: {
      value: 'page' | 'database'
      property: 'object'
    }
  ): Promise<{
    results: any[]
    next_cursor: string | null
    has_more: boolean
  }> {
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify({
        query,
        ...(filter && { filter }),
      }),
    })

    if (!response.ok) {
      throw new Error(`Notion search failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get page
  async getPage(accessToken: string, pageId: string): Promise<any> {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: this.getHeaders(accessToken),
    })

    if (!response.ok) {
      throw new Error(`Notion get page failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create page
  async createPage(
    accessToken: string,
    parent: { database_id: string } | { page_id: string },
    properties: Record<string, any>,
    children?: any[]
  ): Promise<any> {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify({
        parent,
        properties,
        ...(children && { children }),
      }),
    })

    if (!response.ok) {
      throw new Error(`Notion create page failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Update page properties
  async updatePage(
    accessToken: string,
    pageId: string,
    properties: Record<string, any>
  ): Promise<any> {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify({ properties }),
    })

    if (!response.ok) {
      throw new Error(`Notion update page failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Archive page
  async archivePage(accessToken: string, pageId: string): Promise<any> {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify({ archived: true }),
    })

    if (!response.ok) {
      throw new Error(`Notion archive page failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get database
  async getDatabase(accessToken: string, databaseId: string): Promise<any> {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      headers: this.getHeaders(accessToken),
    })

    if (!response.ok) {
      throw new Error(`Notion get database failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Query database
  async queryDatabase(
    accessToken: string,
    databaseId: string,
    filter?: any,
    sorts?: any[],
    startCursor?: string,
    pageSize?: number
  ): Promise<{
    results: any[]
    next_cursor: string | null
    has_more: boolean
  }> {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: this.getHeaders(accessToken),
        body: JSON.stringify({
          ...(filter && { filter }),
          ...(sorts && { sorts }),
          ...(startCursor && { start_cursor: startCursor }),
          ...(pageSize && { page_size: pageSize }),
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Notion query database failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Create database
  async createDatabase(
    accessToken: string,
    parent: { page_id: string },
    title: Array<{
      type: 'text'
      text: { content: string }
    }>,
    properties: Record<string, any>
  ): Promise<any> {
    const response = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify({
        parent,
        title,
        properties,
      }),
    })

    if (!response.ok) {
      throw new Error(`Notion create database failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Update database
  async updateDatabase(
    accessToken: string,
    databaseId: string,
    updates: {
      title?: any[]
      properties?: Record<string, any>
    }
  ): Promise<any> {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'PATCH',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error(`Notion update database failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get block children
  async getBlockChildren(
    accessToken: string,
    blockId: string,
    startCursor?: string,
    pageSize?: number
  ): Promise<{
    results: any[]
    next_cursor: string | null
    has_more: boolean
  }> {
    const params = new URLSearchParams()
    if (startCursor) params.append('start_cursor', startCursor)
    if (pageSize) params.append('page_size', String(pageSize))

    const url = `https://api.notion.com/v1/blocks/${blockId}/children${
      params.toString() ? `?${params.toString()}` : ''
    }`

    const response = await fetch(url, {
      headers: this.getHeaders(accessToken),
    })

    if (!response.ok) {
      throw new Error(`Notion get block children failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Append block children
  async appendBlockChildren(
    accessToken: string,
    blockId: string,
    children: any[]
  ): Promise<{
    results: any[]
  }> {
    const response = await fetch(
      `https://api.notion.com/v1/blocks/${blockId}/children`,
      {
        method: 'PATCH',
        headers: this.getHeaders(accessToken),
        body: JSON.stringify({ children }),
      }
    )

    if (!response.ok) {
      throw new Error(`Notion append blocks failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Update block
  async updateBlock(
    accessToken: string,
    blockId: string,
    updates: Record<string, any>
  ): Promise<any> {
    const response = await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
      method: 'PATCH',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error(`Notion update block failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Delete block
  async deleteBlock(accessToken: string, blockId: string): Promise<any> {
    const response = await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
      method: 'DELETE',
      headers: this.getHeaders(accessToken),
    })

    if (!response.ok) {
      throw new Error(`Notion delete block failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get user
  async getUser(accessToken: string, userId: string): Promise<{
    id: string
    name: string
    avatar_url: string
    type: 'person' | 'bot'
    person?: {
      email: string
    }
  }> {
    const response = await fetch(`https://api.notion.com/v1/users/${userId}`, {
      headers: this.getHeaders(accessToken),
    })

    if (!response.ok) {
      throw new Error(`Notion get user failed: ${await response.text()}`)
    }

    return response.json()
  }

  // List all users
  async listUsers(
    accessToken: string,
    startCursor?: string,
    pageSize?: number
  ): Promise<{
    results: any[]
    next_cursor: string | null
    has_more: boolean
  }> {
    const params = new URLSearchParams()
    if (startCursor) params.append('start_cursor', startCursor)
    if (pageSize) params.append('page_size', String(pageSize))

    const url = `https://api.notion.com/v1/users${
      params.toString() ? `?${params.toString()}` : ''
    }`

    const response = await fetch(url, {
      headers: this.getHeaders(accessToken),
    })

    if (!response.ok) {
      throw new Error(`Notion list users failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get current bot user
  async getBotUser(accessToken: string): Promise<{
    id: string
    name: string
    type: 'bot'
    bot: {
      owner: any
      workspace_name: string
    }
  }> {
    const response = await fetch('https://api.notion.com/v1/users/me', {
      headers: this.getHeaders(accessToken),
    })

    if (!response.ok) {
      throw new Error(`Notion get bot user failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Add comment to page
  async addComment(
    accessToken: string,
    pageId: string,
    richText: Array<{
      type: 'text'
      text: { content: string }
    }>
  ): Promise<any> {
    const response = await fetch('https://api.notion.com/v1/comments', {
      method: 'POST',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify({
        parent: { page_id: pageId },
        rich_text: richText,
      }),
    })

    if (!response.ok) {
      throw new Error(`Notion add comment failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Get comments
  async getComments(
    accessToken: string,
    blockId: string,
    startCursor?: string,
    pageSize?: number
  ): Promise<{
    results: any[]
    next_cursor: string | null
    has_more: boolean
  }> {
    const params = new URLSearchParams({
      block_id: blockId,
      ...(startCursor && { start_cursor: startCursor }),
      ...(pageSize && { page_size: String(pageSize) }),
    })

    const response = await fetch(
      `https://api.notion.com/v1/comments?${params.toString()}`,
      {
        headers: this.getHeaders(accessToken),
      }
    )

    if (!response.ok) {
      throw new Error(`Notion get comments failed: ${await response.text()}`)
    }

    return response.json()
  }

  // Helper: Create simple text page
  async createSimpleTextPage(
    accessToken: string,
    parentPageId: string,
    title: string,
    content: string
  ): Promise<any> {
    return this.createPage(
      accessToken,
      { page_id: parentPageId },
      {
        title: {
          title: [
            {
              type: 'text',
              text: { content: title },
            },
          ],
        },
      },
      [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content },
              },
            ],
          },
        },
      ]
    )
  }

  // Helper: Create database entry
  async createDatabaseEntry(
    accessToken: string,
    databaseId: string,
    properties: Record<string, any>
  ): Promise<any> {
    return this.createPage(accessToken, { database_id: databaseId }, properties)
  }
}

export const notion = new NotionProvider()
