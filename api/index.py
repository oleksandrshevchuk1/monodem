"""Stateless Vercel API: private demo state stays in the user's browser."""
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse, parse_qs
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server
server.DATA = Path(tempfile.gettempdir()) / 'mono-preview'
server.DATA.mkdir(exist_ok=True)

class handler(server.Handler):
    def endpoint(self):
        parsed = urlparse(self.path)
        endpoint = parse_qs(parsed.query).get('endpoint', [''])[0]
        if endpoint:
            self.path = '/api/' + endpoint
        return urlparse(self.path).path

    def do_GET(self):
        path = self.endpoint()
        if path in ('/api/example', '/api/health'):
            return super().do_GET()
        return self.json_response(404, {'error': 'Unknown endpoint'})

    def do_POST(self):
        path = self.endpoint()
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
