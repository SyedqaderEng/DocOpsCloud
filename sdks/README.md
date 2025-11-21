# DocOps Cloud SDKs

Official SDKs for the DocOps Cloud API v2.

## Available SDKs

- **JavaScript/TypeScript** - For Node.js and browser applications
- **Python** - For Python 3.7+ applications

## Quick Start

### JavaScript/TypeScript

```bash
npm install @docops/sdk
```

```typescript
import { DocOpsClient } from '@docops/sdk'

const client = new DocOpsClient({
  apiKey: 'your_api_key_here'
})

// List files
const files = await client.files.list()
console.log(files.data)

// Upload a file
const upload = await client.files.upload('document.pdf', fileBuffer, {
  mimeType: 'application/pdf'
})

// Create a workflow
const workflow = await client.workflows.create({
  name: 'PDF Processing',
  trigger: { type: 'file_upload' },
  steps: [
    { action: 'file.compress', config: { quality: 80 } },
    { action: 'notify.email', config: { to: 'user@example.com' } }
  ]
})
```

### Python

```bash
pip install docops-sdk
```

```python
from docops import DocOpsClient

client = DocOpsClient(api_key='your_api_key_here')

# List files
files = client.files.list()
print(files.data)

# Upload a file
with open('document.pdf', 'rb') as f:
    upload = client.files.upload('document.pdf', f.read(), mime_type='application/pdf')

# AI operations
summary = client.ai.summarize(text='Long document text...', length='short')
print(summary.data['summary'])

translation = client.ai.translate(text='Hello world', target_language='es')
print(translation.data['translated_text'])
```

## Authentication

All API requests require an API key. You can generate one in your [Dashboard](https://app.docops.cloud/settings/api).

```typescript
// JavaScript
const client = new DocOpsClient({ apiKey: 'doc_key_...' })
```

```python
# Python
client = DocOpsClient(api_key='doc_key_...')
```

## Rate Limiting

API requests are rate limited based on your subscription tier:

- **Free**: 100 requests/minute
- **Pro**: 1,000 requests/minute
- **Enterprise**: Custom limits

Rate limit information is included in the response metadata:

```typescript
const response = await client.files.list()
console.log(response.meta.rate_limit)
// { limit: 100, remaining: 99, reset: 1234567890 }
```

## Error Handling

### JavaScript

```typescript
import { DocOpsClient, DocOpsError } from '@docops/sdk'

try {
  const files = await client.files.list()
} catch (error) {
  if (error instanceof DocOpsError) {
    console.error(`Error ${error.code}: ${error.message}`)
    console.error(`Status: ${error.statusCode}`)
    console.error(`Details:`, error.details)
  }
}
```

### Python

```python
from docops import DocOpsClient, DocOpsError

try:
    files = client.files.list()
except DocOpsError as e:
    print(f"Error {e.code}: {e.message}")
    print(f"Status: {e.status_code}")
    print(f"Details: {e.details}")
```

## Pagination

List endpoints support pagination:

```typescript
// JavaScript
const page1 = await client.files.list(1, 25) // page 1, 25 items
const page2 = await client.files.list(2, 25) // page 2, 25 items

console.log(page1.meta.pagination)
// {
//   page: 1,
//   per_page: 25,
//   total: 100,
//   total_pages: 4,
//   has_next: true,
//   has_prev: false
// }
```

```python
# Python
page1 = client.files.list(page=1, per_page=25)
page2 = client.files.list(page=2, per_page=25)

print(page1.meta['pagination'])
```

## API Resources

### Files

- `files.list(page?, per_page?)` - List files
- `files.get(fileId)` - Get file by ID
- `files.upload(filename, content, options?)` - Upload file
- `files.delete(fileId)` - Delete file

### Workflows

- `workflows.list(page?, per_page?)` - List workflows
- `workflows.get(workflowId)` - Get workflow by ID
- `workflows.create(workflow)` - Create workflow
- `workflows.trigger(workflowId, data?)` - Trigger workflow
- `workflows.delete(workflowId)` - Delete workflow

### AI Operations

- `ai.summarize(text, options?)` - Summarize text
- `ai.translate(text, targetLanguage)` - Translate text
- `ai.extract(text, documentType)` - Extract data from document

### Integrations

- `integrations.list()` - List available integrations
- `integrations.connect(provider)` - Initiate OAuth connection
- `integrations.connections()` - List active connections
- `integrations.disconnect(connectionId)` - Disconnect integration

## Webhooks

Configure webhooks to receive real-time notifications:

```typescript
// JavaScript
const webhook = await client.webhooks.create({
  url: 'https://yourapp.com/webhook',
  events: ['file.uploaded', 'workflow.completed'],
  secret: 'your_webhook_secret'
})
```

Webhook payload example:

```json
{
  "event": "file.uploaded",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "file_id": "file_123",
    "filename": "document.pdf",
    "user_id": "user_456"
  }
}
```

Verify webhook signatures:

```typescript
import crypto from 'crypto'

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}
```

## Support

- **Documentation**: https://docs.docops.cloud
- **API Reference**: https://docs.docops.cloud/api
- **Support**: support@docops.cloud
- **GitHub**: https://github.com/docops/sdk

## License

MIT
