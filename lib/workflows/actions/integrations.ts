// Workflow Integration Actions

import { registerAction, ActionResult } from './index'
import { ExecutionContext } from '../engine/executor'
import { executeIntegrationAction } from '@/lib/integrations/service'
import {
  googleDrive,
  dropbox,
  slack,
  salesforce,
  hubspot,
  notion,
} from '@/lib/integrations/providers'

// Google Drive: Upload file
registerAction('integration.google-drive.upload', async (config, context: ExecutionContext) => {
  const { fileName, fileData, folderId } = config

  const result = await executeIntegrationAction(
    context.userId,
    'google-drive',
    async (accessToken) => {
      return await googleDrive.uploadFile(
        accessToken,
        fileName,
        Buffer.from(fileData, 'base64'),
        'application/octet-stream',
        folderId
      )
    }
  )

  return {
    success: true,
    data: {
      fileId: result.id,
      webViewLink: result.webViewLink,
      name: result.name,
    },
  }
})

// Dropbox: Upload file
registerAction('integration.dropbox.upload', async (config, context: ExecutionContext) => {
  const { filePath, fileData } = config

  const result = await executeIntegrationAction(
    context.userId,
    'dropbox',
    async (accessToken) => {
      return await dropbox.uploadFile(
        accessToken,
        filePath,
        Buffer.from(fileData, 'base64'),
        'overwrite'
      )
    }
  )

  return {
    success: true,
    data: {
      id: result.id,
      path: result.path_display,
    },
  }
})

// Slack: Send message
registerAction('integration.slack.send-message', async (config, context: ExecutionContext) => {
  const { channel, text, blocks } = config

  const result = await executeIntegrationAction(
    context.userId,
    'slack',
    async (accessToken) => {
      return await slack.postMessage(accessToken, channel, text, {
        ...(blocks && { blocks }),
      })
    }
  )

  return {
    success: true,
    data: {
      messageId: result.ts,
      channel: result.channel,
    },
  }
})

// Slack: Upload file
registerAction('integration.slack.upload-file', async (config, context: ExecutionContext) => {
  const { channels, fileName, fileData, title, comment } = config

  const result = await executeIntegrationAction(
    context.userId,
    'slack',
    async (accessToken) => {
      return await slack.uploadFile(
        accessToken,
        channels,
        Buffer.from(fileData, 'base64'),
        fileName,
        {
          title,
          initial_comment: comment,
        }
      )
    }
  )

  return {
    success: true,
    data: {
      fileId: result.file.id,
      url: result.file.url_private,
    },
  }
})

// Salesforce: Create record
registerAction('integration.salesforce.create-record', async (config, context: ExecutionContext) => {
  const { objectType, data } = config

  const result = await executeIntegrationAction(
    context.userId,
    'salesforce',
    async (accessToken, instanceUrl) => {
      if (!instanceUrl) throw new Error('Salesforce instance URL not found')
      return await salesforce.createRecord(accessToken, instanceUrl, objectType, data)
    }
  )

  return {
    success: true,
    data: {
      id: result.id,
      success: result.success,
    },
  }
})

// Salesforce: Create lead
registerAction('integration.salesforce.create-lead', async (config, context: ExecutionContext) => {
  const { firstName, lastName, company, email, phone } = config

  const result = await executeIntegrationAction(
    context.userId,
    'salesforce',
    async (accessToken, instanceUrl) => {
      if (!instanceUrl) throw new Error('Salesforce instance URL not found')
      return await salesforce.createLead(accessToken, instanceUrl, {
        FirstName: firstName,
        LastName: lastName,
        Company: company,
        Email: email,
        Phone: phone,
      })
    }
  )

  return {
    success: true,
    data: {
      leadId: result.id,
    },
  }
})

// HubSpot: Create contact
registerAction('integration.hubspot.create-contact', async (config, context: ExecutionContext) => {
  const { email, firstname, lastname, phone, company } = config

  const result = await executeIntegrationAction(
    context.userId,
    'hubspot',
    async (accessToken) => {
      return await hubspot.createContact(accessToken, {
        email,
        firstname,
        lastname,
        phone,
        company,
      })
    }
  )

  return {
    success: true,
    data: {
      contactId: result.id,
      properties: result.properties,
    },
  }
})

// HubSpot: Create deal
registerAction('integration.hubspot.create-deal', async (config, context: ExecutionContext) => {
  const { dealname, dealstage, amount, closedate } = config

  const result = await executeIntegrationAction(
    context.userId,
    'hubspot',
    async (accessToken) => {
      return await hubspot.createDeal(accessToken, {
        dealname,
        dealstage,
        amount,
        closedate,
      })
    }
  )

  return {
    success: true,
    data: {
      dealId: result.id,
      properties: result.properties,
    },
  }
})

// Notion: Create page
registerAction('integration.notion.create-page', async (config, context: ExecutionContext) => {
  const { parentId, title, content } = config

  const result = await executeIntegrationAction(
    context.userId,
    'notion',
    async (accessToken) => {
      return await notion.createSimpleTextPage(
        accessToken,
        parentId,
        title,
        content
      )
    }
  )

  return {
    success: true,
    data: {
      pageId: result.id,
      url: result.url,
    },
  }
})

// Notion: Create database entry
registerAction('integration.notion.create-db-entry', async (config, context: ExecutionContext) => {
  const { databaseId, properties } = config

  const result = await executeIntegrationAction(
    context.userId,
    'notion',
    async (accessToken) => {
      return await notion.createDatabaseEntry(accessToken, databaseId, properties)
    }
  )

  return {
    success: true,
    data: {
      pageId: result.id,
    },
  }
})

// Export action metadata
export const INTEGRATION_ACTION_METADATA = {
  'integration.google-drive.upload': {
    name: 'Upload to Google Drive',
    category: 'integration',
    provider: 'google-drive',
    inputs: ['fileName', 'fileData', 'folderId?'],
    outputs: ['fileId', 'webViewLink', 'name'],
  },
  'integration.dropbox.upload': {
    name: 'Upload to Dropbox',
    category: 'integration',
    provider: 'dropbox',
    inputs: ['filePath', 'fileData'],
    outputs: ['id', 'path'],
  },
  'integration.slack.send-message': {
    name: 'Send Slack Message',
    category: 'integration',
    provider: 'slack',
    inputs: ['channel', 'text', 'blocks?'],
    outputs: ['messageId', 'channel'],
  },
  'integration.slack.upload-file': {
    name: 'Upload File to Slack',
    category: 'integration',
    provider: 'slack',
    inputs: ['channels', 'fileName', 'fileData', 'title?', 'comment?'],
    outputs: ['fileId', 'url'],
  },
  'integration.salesforce.create-record': {
    name: 'Create Salesforce Record',
    category: 'integration',
    provider: 'salesforce',
    inputs: ['objectType', 'data'],
    outputs: ['id', 'success'],
  },
  'integration.salesforce.create-lead': {
    name: 'Create Salesforce Lead',
    category: 'integration',
    provider: 'salesforce',
    inputs: ['firstName', 'lastName', 'company', 'email?', 'phone?'],
    outputs: ['leadId'],
  },
  'integration.hubspot.create-contact': {
    name: 'Create HubSpot Contact',
    category: 'integration',
    provider: 'hubspot',
    inputs: ['email', 'firstname?', 'lastname?', 'phone?', 'company?'],
    outputs: ['contactId', 'properties'],
  },
  'integration.hubspot.create-deal': {
    name: 'Create HubSpot Deal',
    category: 'integration',
    provider: 'hubspot',
    inputs: ['dealname', 'dealstage', 'amount?', 'closedate?'],
    outputs: ['dealId', 'properties'],
  },
  'integration.notion.create-page': {
    name: 'Create Notion Page',
    category: 'integration',
    provider: 'notion',
    inputs: ['parentId', 'title', 'content'],
    outputs: ['pageId', 'url'],
  },
  'integration.notion.create-db-entry': {
    name: 'Create Notion Database Entry',
    category: 'integration',
    provider: 'notion',
    inputs: ['databaseId', 'properties'],
    outputs: ['pageId'],
  },
}
