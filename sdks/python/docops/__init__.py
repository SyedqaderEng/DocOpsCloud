# DocOps Cloud Python SDK

import requests
import base64
from typing import Optional, Dict, Any, List
from dataclasses import dataclass


@dataclass
class APIResponse:
    """API response wrapper"""
    success: bool
    data: Any = None
    error: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None


class DocOpsError(Exception):
    """DocOps API Error"""
    def __init__(self, code: str, message: str, status_code: int, details: Any = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(f"{code}: {message}")


class FilesAPI:
    """Files API endpoints"""
    def __init__(self, client):
        self.client = client

    def list(self, page: int = 1, per_page: int = 25) -> APIResponse:
        """List files"""
        return self.client._request('GET', f'/v2/files?page={page}&per_page={per_page}')

    def get(self, file_id: str) -> APIResponse:
        """Get file by ID"""
        return self.client._request('GET', f'/v2/files/{file_id}')

    def upload(self, filename: str, content: bytes, mime_type: Optional[str] = None,
               metadata: Optional[Dict] = None) -> APIResponse:
        """Upload a file"""
        base64_content = base64.b64encode(content).decode('utf-8')
        body = {
            'filename': filename,
            'content': base64_content,
        }
        if mime_type:
            body['mime_type'] = mime_type
        if metadata:
            body['metadata'] = metadata

        return self.client._request('POST', '/v2/files', body)

    def delete(self, file_id: str) -> APIResponse:
        """Delete a file"""
        return self.client._request('DELETE', f'/v2/files/{file_id}')


class WorkflowsAPI:
    """Workflows API endpoints"""
    def __init__(self, client):
        self.client = client

    def list(self, page: int = 1, per_page: int = 25) -> APIResponse:
        """List workflows"""
        return self.client._request('GET', f'/v2/workflows?page={page}&per_page={per_page}')

    def get(self, workflow_id: str) -> APIResponse:
        """Get workflow by ID"""
        return self.client._request('GET', f'/v2/workflows/{workflow_id}')

    def create(self, name: str, trigger: Dict, steps: List[Dict],
               description: Optional[str] = None) -> APIResponse:
        """Create a workflow"""
        body = {
            'name': name,
            'trigger': trigger,
            'steps': steps,
        }
        if description:
            body['description'] = description

        return self.client._request('POST', '/v2/workflows', body)

    def trigger(self, workflow_id: str, data: Optional[Dict] = None) -> APIResponse:
        """Trigger a workflow"""
        return self.client._request('POST', f'/v2/workflows/{workflow_id}/trigger',
                                    {'data': data or {}})

    def delete(self, workflow_id: str) -> APIResponse:
        """Delete a workflow"""
        return self.client._request('DELETE', f'/v2/workflows/{workflow_id}')


class AIAPI:
    """AI operations API endpoints"""
    def __init__(self, client):
        self.client = client

    def summarize(self, text: str, length: str = 'medium') -> APIResponse:
        """Summarize text using AI"""
        return self.client._request('POST', '/v2/ai/summarize',
                                    {'text': text, 'length': length})

    def translate(self, text: str, target_language: str) -> APIResponse:
        """Translate text to target language"""
        return self.client._request('POST', '/v2/ai/translate',
                                    {'text': text, 'target_language': target_language})

    def extract(self, text: str,
                document_type: str = 'general') -> APIResponse:
        """Extract data from document"""
        return self.client._request('POST', '/v2/ai/extract',
                                    {'text': text, 'document_type': document_type})


class IntegrationsAPI:
    """Integrations API endpoints"""
    def __init__(self, client):
        self.client = client

    def list(self) -> APIResponse:
        """List available integrations"""
        return self.client._request('GET', '/v2/integrations')

    def connect(self, provider: str) -> APIResponse:
        """Initiate integration connection"""
        return self.client._request('POST', f'/v2/integrations/{provider}/connect')

    def connections(self) -> APIResponse:
        """List user's active connections"""
        return self.client._request('GET', '/v2/integrations/connections')

    def disconnect(self, connection_id: str) -> APIResponse:
        """Disconnect an integration"""
        return self.client._request('DELETE',
                                    f'/v2/integrations/connections/{connection_id}')


class DocOpsClient:
    """
    DocOps Cloud Python SDK Client

    Usage:
        client = DocOpsClient(api_key='your_api_key')
        files = client.files.list()
        print(files.data)
    """

    def __init__(self, api_key: str, base_url: str = 'https://api.docops.cloud',
                 timeout: int = 30):
        """
        Initialize DocOps client

        Args:
            api_key: Your API key
            base_url: API base URL (default: https://api.docops.cloud)
            timeout: Request timeout in seconds (default: 30)
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout

        # Initialize API endpoints
        self.files = FilesAPI(self)
        self.workflows = WorkflowsAPI(self)
        self.ai = AIAPI(self)
        self.integrations = IntegrationsAPI(self)

    def _request(self, method: str, path: str, body: Optional[Dict] = None) -> APIResponse:
        """Internal request method"""
        url = f"{self.base_url}{path}"
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key,
        }

        try:
            response = requests.request(
                method=method,
                url=url,
                json=body,
                headers=headers,
                timeout=self.timeout
            )

            data = response.json()

            if not response.ok:
                error = data.get('error', {})
                raise DocOpsError(
                    code=error.get('code', 'request_failed'),
                    message=error.get('message', 'Request failed'),
                    status_code=response.status_code,
                    details=error.get('details')
                )

            return APIResponse(
                success=data.get('success', False),
                data=data.get('data'),
                error=data.get('error'),
                meta=data.get('meta')
            )

        except requests.exceptions.Timeout:
            raise DocOpsError('timeout', 'Request timeout', 408)
        except requests.exceptions.RequestException as e:
            raise DocOpsError('network_error', str(e), 0)


__all__ = ['DocOpsClient', 'DocOpsError', 'APIResponse']
