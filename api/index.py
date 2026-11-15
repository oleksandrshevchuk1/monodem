"""Stateless Vercel API: private demo state stays in the user's browser."""
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse, parse_qs
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server
from shared_store import SharedStore, StorageNotConfigured
server.DATA = Path(tempfile.gettempdir()) / 'mono-preview'
server.DATA.mkdir(exist_ok=True)

class handler(server.Handler):
    def endpoint(self):
        parsed = urlparse(self.path)
        endpoint = parse_qs(parsed.query).get('endpoint', [''])[0]
        if endpoint:
            self.path = '/api/' + endpoint + ('?revision=' + parse_qs(parsed.query)['revision'][0] if 'revision' in parse_qs(parsed.query) else '')
        return urlparse(self.path).path

    def do_GET(self):
        path = self.endpoint()
        if path == '/api/state':
            try:
                query = parse_qs(urlparse(self.path).query)
                return self.json_response(200, SharedStore().read(query.get('revision', [''])[0], server.empty_state()))
            except StorageNotConfigured:
                return self.json_response(503, {'code': 'STORAGE_NOT_CONFIGURED', 'error': 'Connect Upstash Redis in Vercel Storage to enable synchronization.'})
            except Exception:
                return self.json_response(502, {'error': 'Shared storage is temporarily unavailable.'})
        if path == '/api/health':
            try:
                SharedStore()
                configured = True
            except StorageNotConfigured:
                configured = False
            return self.json_response(200, {'ok': True, 'version': 40, 'storage': 'shared' if configured else 'local', 'productionDomain': server.os.environ.get('VERCEL_PROJECT_PRODUCTION_URL')})
        if path == '/api/example':
            return super().do_GET()
        return self.json_response(404, {'error': 'Unknown endpoint'})

    def do_POST(self):
        path = self.endpoint()
        if path == '/api/state':
            origin = self.headers.get('Origin', '')
            if origin and urlparse(origin).netloc != self.headers.get('Host', ''):
                return self.json_response(403, {'error': 'Invalid origin'})
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 4 * 1024 * 1024:
                    return self.json_response(413, {'error': 'Shared data exceeds 4 MB. Remove unused attachments.'})
                payload = server.json.loads(self.rfile.read(length))
                server.validate(payload['state'])
                revision = payload.get('revision')
                if type(revision) is not int or revision < 1:
                    raise ValueError('Invalid revision')
                result = SharedStore().write(revision, payload['state'])
                if result < 0:
                    return self.json_response(409, {'error': 'Data changed in another window. Reload the form.', 'revision': -result})
                return self.json_response(200, {'revision': result})
            except StorageNotConfigured:
                return self.json_response(503, {'code': 'STORAGE_NOT_CONFIGURED', 'error': 'Connect Upstash Redis in Vercel Storage.'})
            except (ValueError, KeyError, TypeError):
                return self.json_response(400, {'error': 'Invalid state'})
            except Exception:
                return self.json_response(502, {'error': 'Shared storage is temporarily unavailable.'})
        if path == '/api/receipt-preview':
            return super().do_POST()
        if path == '/api/statement.xlsx':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 4 * 1024 * 1024:
                    raise ValueError('Invalid request size')
                payload = server.json.loads(self.rfile.read(length))
                state = payload['state']
                server.validate(state)
                query = {key: [str(value)] for key, value in payload['query'].items()}
                body = server.statement_xlsx(state, query)
                self.send_response(200)
                self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                return self.wfile.write(body)
            except (ValueError, KeyError, TypeError):
                return self.json_response(400, {'error': 'Invalid statement request'})
        return self.json_response(404, {'error': 'Unknown endpoint'})
