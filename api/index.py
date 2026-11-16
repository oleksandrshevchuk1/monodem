"""Vercel entry point: all account data is checked server-side."""
import sys
import tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server
from identity import AuthenticatedHandler
server.DATA = Path(tempfile.gettempdir()) / 'mono-preview'
server.DATA.mkdir(exist_ok=True)

class handler(server.Handler):
    is_serverless = True
