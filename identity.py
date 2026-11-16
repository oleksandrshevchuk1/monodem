"""Server-side accounts, expiring access and opaque persistent sessions."""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from http.cookies import SimpleCookie
from pathlib import Path
from threading import RLock
from urllib.parse import urlparse, parse_qs
from auth_config import BOOTSTRAP_HASH

SESSION_TTL = 90 * 86400
COOKIE = 'mono_session'
FILE_LOCK = RLock()


class AccessError(Exception):
    def __init__(self, status, message, code='ACCESS_DENIED'):
        self.status, self.message, self.code = status, message, code


class FileKV:
    def __init__(self, directory):
        self.path = Path(directory) / 'identity.json'
        self.prefix = 'local'

    def _run(self, operation):
        with FILE_LOCK:
            values = json.loads(self.path.read_text()) if self.path.exists() else {}
            now = time.time()
            values = {k: v for k, v in values.items() if not v.get('expires') or v['expires'] > now}
            result = operation(values)
            self.path.parent.mkdir(parents=True, exist_ok=True)
            pending = self.path.with_suffix('.pending.json')
            pending.write_text(json.dumps(values), encoding='utf-8')
            os.replace(pending, self.path)
            return result

    def get(self, key):
        return self._run(lambda values: values.get(key, {}).get('value'))

    def set(self, key, value, ttl=0, nx=False):
        def update(values):
            if nx and key in values:
                return False
            values[key] = {'value': value, 'expires': time.time() + ttl if ttl else 0}
            return True
        return self._run(update)

    def delete(self, key):
        return self._run(lambda values: values.pop(key, None))

    def cas(self, key, previous, value):
        def update(values):
            if values.get(key, {}).get('value') != previous:
                return False
            values[key] = {'value': value, 'expires': 0}
            return True
        return self._run(update)

    def increment(self, key, ttl):
        def update(values):
            item = values.setdefault(key, {'value': '0', 'expires': time.time() + ttl})
            item['value'] = str(int(item['value']) + 1)
            return int(item['value'])
        return self._run(update)


class RedisKV:
    def __init__(self):
        from shared_store import SharedStore
        self.store = SharedStore()
        self.prefix = self.store.key + ':identity:v1'

    def key(self, key):
        return self.prefix + ':' + key

    def get(self, key):
        return self.store.command('GET', self.key(key))

    def set(self, key, value, ttl=0, nx=False):
        args = ['SET', self.key(key), value]
        if ttl:
            args += ['EX', int(ttl)]
        if nx:
            args += ['NX']
        return self.store.command(*args) == 'OK'

    def delete(self, key):
        return self.store.command('DEL', self.key(key))

    def cas(self, key, previous, value):
        script = "if redis.call('GET',KEYS[1]) == ARGV[1] then redis.call('SET',KEYS[1],ARGV[2]);return 1 end;return 0"
        return self.store.command('EVAL', script, 1, self.key(key), previous, value) == 1

    def increment(self, key, ttl):
        script = "local n=redis.call('INCR',KEYS[1]);if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end;return n"
        return int(self.store.command('EVAL', script, 1, self.key(key), int(ttl)))


def password_hash(password, salt=None):
    if not isinstance(password, str) or not 12 <= len(password) <= 256:
        raise AccessError(400, 'Пароль має містити від 12 до 256 символів.', 'INVALID_PASSWORD')
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 600000)
    return 'pbkdf2$600000$' + base64.b64encode(salt).decode() + '$' + base64.b64encode(digest).decode()


def password_matches(password, encoded):
    try:
        _, iterations, salt, expected = encoded.split('$')
        if not isinstance(password, str) or len(password) > 256:
            return False
        actual = hashlib.pbkdf2_hmac('sha256', password.encode(), base64.b64decode(salt), int(iterations))
        return hmac.compare_digest(actual, base64.b64decode(expected))
    except (ValueError, TypeError):
        return False


def username(value):
    value = str(value or '').strip().lower()
    if not re.fullmatch(r'[a-z0-9_.@-]{3,64}', value):
        raise AccessError(400, 'Логін: 3–64 латинські літери, цифри, крапка, @, _ або дефіс.', 'INVALID_LOGIN')
    return value


def public_user(user):
    return {key: user.get(key) for key in ('id', 'login', 'name', 'role', 'expiresAt', 'disabled', 'createdAt', 'createdBy')}


class Accounts:
    def __init__(self, store):
        self.store = store

    def document(self):
        raw = self.store.get('accounts')
        return raw, json.loads(raw) if raw else {'users': []}

    def change(self, operation):
        for _ in range(8):
            raw, doc = self.document()
            result = operation(doc)
            value = json.dumps(doc, separators=(',', ':'))
            if (self.store.set('accounts', value, nx=True) if raw is None else self.store.cas('accounts', raw, value)):
                return result
        raise AccessError(409, 'Дані змінились. Повторіть дію.', 'CONFLICT')

    def active(self, user):
        if not user or user.get('disabled') or (user.get('expiresAt') and user['expiresAt'] <= time.time()):
            raise AccessError(403, 'Доступ до кабінету завершився або його вимкнено.', 'ACCOUNT_INACTIVE')
        return user

    def authenticate(self, token):
        if not token or len(token) > 128:
            raise AccessError(401, 'Увійдіть у свій кабінет.', 'LOGIN_REQUIRED')
        key = 'session:' + hashlib.sha256(token.encode()).hexdigest()
        raw = self.store.get(key)
        session = json.loads(raw) if raw else None
        users = self.document()[1]['users']
        user = next((u for u in users if session and u['id'] == session['userId']), None)
        if not user or user.get('version', 1) != session.get('version'):
            raise AccessError(401, 'Сесію завершено. Увійдіть знову.', 'LOGIN_REQUIRED')
        return self.active(user)

    def issue_session(self, user):
        token = secrets.token_urlsafe(32)
        self.store.set('session:' + hashlib.sha256(token.encode()).hexdigest(), json.dumps({'userId': user['id'], 'version': user.get('version', 1)}), SESSION_TTL)
        return token

    def logout(self, token):
        if token:
            self.store.delete('session:' + hashlib.sha256(token.encode()).hexdigest())

    def bootstrap(self, payload):
        key = re.sub(r'\s+', '', str(payload.get('setupKey', '')))
        if not hmac.compare_digest(hashlib.sha256(key.encode()).hexdigest(), BOOTSTRAP_HASH):
            raise AccessError(403, 'Невірний одноразовий ключ.', 'INVALID_SETUP_KEY')
        login = username(payload.get('login'))
        hashed = password_hash(payload.get('password'))
        user = {'id': secrets.token_hex(16), 'login': login, 'name': str(payload.get('name') or login)[:80], 'role': 'owner', 'password': hashed, 'stateKey': 'legacy', 'version': 1, 'expiresAt': None, 'disabled': False, 'createdAt': int(time.time()), 'createdBy': None}
        def create(doc):
            if doc['users']:
                raise AccessError(409, 'Головний кабінет уже створений.', 'SETUP_COMPLETE')
            doc['users'].append(user)
            return user
        return self.change(create)

    def login(self, payload, ip):
        login = str(payload.get('login', '')).strip().lower()[:128]
        # Both counters have fixed lifetimes; absent users get the same costly comparison.
        for label in ['ip:' + ip, 'login:' + login]:
            key = 'rate:' + hashlib.sha256(label.encode()).hexdigest()
            if self.store.increment(key, 900) > (60 if label.startswith('ip:') else 12):
                raise AccessError(429, 'Забагато спроб. Спробуйте через 15 хвилин.', 'RATE_LIMITED')
        user = next((u for u in self.document()[1]['users'] if u['login'] == login), None)
        dummy = 'pbkdf2$600000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
        if not password_matches(payload.get('password'), user['password'] if user else dummy):
            raise AccessError(401, 'Невірний логін або пароль.', 'INVALID_CREDENTIALS')
        self.active(user)
        return user

    def can_manage(self, actor, user):
        return actor['role'] == 'owner' or (actor['role'] == 'admin' and user.get('createdBy') == actor['id'] and user['role'] == 'user')

    def users(self, actor):
        if actor['role'] not in ('owner', 'admin'):
            raise AccessError(403, 'Видавати кабінети може лише адміністратор.')
        return [public_user(u) for u in self.document()[1]['users'] if self.can_manage(actor, u)]

    def create_user(self, actor, payload):
        if actor['role'] not in ('owner', 'admin'):
            raise AccessError(403, 'Видавати кабінети може лише адміністратор.')
        role = payload.get('role', 'user')
        if role not in ('user', 'admin') or (role == 'admin' and actor['role'] != 'owner'):
            raise AccessError(403, 'Цю роль може призначити лише власник.')
        login, hashed = username(payload.get('login')), password_hash(payload.get('password'))
        days = payload.get('days')
        if days not in (None, 7, 30):
            raise AccessError(400, 'Оберіть тиждень, місяць або безстроковий доступ.')
        now = int(time.time())
        user = {'id': secrets.token_hex(16), 'login': login, 'name': str(payload.get('name') or login)[:80], 'role': role, 'password': hashed, 'stateKey': None, 'version': 1, 'expiresAt': now + days * 86400 if days else None, 'disabled': False, 'createdAt': now, 'createdBy': actor['id']}
        user['stateKey'] = user['id']
        def create(doc):
            if any(u['login'] == login for u in doc['users']):
                raise AccessError(409, 'Цей логін уже зайнятий.')
            doc['users'].append(user)
            return public_user(user)
        return self.change(create)

    def update_user(self, actor, payload):
        target_id = str(payload.get('id', ''))
        hashed = password_hash(payload['password']) if payload.get('password') else None
        def update(doc):
            user = next((u for u in doc['users'] if u['id'] == target_id), None)
            if not user or user['role'] == 'owner' or not self.can_manage(actor, user):
                raise AccessError(403, 'Немає прав на зміну цього кабінету.')
            if 'role' in payload:
                if actor['role'] != 'owner' or payload['role'] not in ('user', 'admin'):
                    raise AccessError(403, 'Роль може змінити лише власник.')
                if user['role'] != payload['role']:
                    user['version'] += 1
                user['role'] = payload['role']
            if 'days' in payload:
                if payload['days'] not in (None, 7, 30):
                    raise AccessError(400, 'Невірний строк доступу.')
                user['expiresAt'] = int(time.time()) + payload['days'] * 86400 if payload['days'] else None
            if 'disabled' in payload:
                if type(payload['disabled']) is not bool:
                    raise AccessError(400, 'Невірний стан доступу.')
                if user.get('disabled') != payload['disabled']:
                    user['version'] += 1
                user['disabled'] = payload['disabled']
            if hashed:
                user['password'] = hashed
                user['version'] += 1
            return public_user(user)
        return self.change(update)


class AuthenticatedHandler:
    is_serverless = False

    def identity(self):
        if not hasattr(self, '_identity'):
            store = RedisKV() if self.is_serverless else FileKV(self.state_module.DATA)
            self._identity = Accounts(store)
        return self._identity

    def cookie_name(self):
        return '__Host-' + COOKIE if self.is_serverless or self.headers.get('X-Forwarded-Proto') == 'https' else COOKIE

    def session_token(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get('Cookie', ''))
            name = self.cookie_name()
            return cookie[name].value if name in cookie else None
        except Exception:
            return None

    def principal(self):
        if getattr(self, '_principal_headers', None) is not self.headers:
            self._principal_headers = self.headers
            self._principal = self.identity().authenticate(self.session_token())
        return self._principal

    def workspace(self):
        actor = self.principal()
        target_id = self.headers.get('X-Workspace-Id')
        if not target_id or target_id == actor['id']:
            return actor
        target = next((u for u in self.identity().document()[1]['users'] if u['id'] == target_id), None)
        if not target or not self.identity().can_manage(actor, target):
            raise AccessError(403, 'Немає доступу до цього кабінету.')
        return target

    def current_record(self, expected=''):
        scope = self.workspace()['stateKey']
        if self.is_serverless:
            from shared_store import SharedStore
            store = SharedStore()
            if scope != 'legacy':
                store.key += ':workspace:' + scope
            return store.read(expected, {**self.state_module.empty_state(), 'name': self.workspace()['name']})
        with self.state_module.LOCK:
            path = self.state_module.STATE_FILE if scope == 'legacy' else self.state_module.DATA / 'tenants' / (scope + '.json')
            record = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'revision': 1, 'state': {**self.state_module.empty_state(), 'name': self.workspace()['name']}}
            return {'revision': record['revision'], 'unchanged': True} if str(record['revision']) == str(expected) else record

    def store_record(self, revision, state):
        scope = self.workspace()['stateKey']
        if self.is_serverless:
            from shared_store import SharedStore
            store = SharedStore()
            if scope != 'legacy':
                store.key += ':workspace:' + scope
            return store.write(revision, state)
        with self.state_module.LOCK:
            path = self.state_module.STATE_FILE if scope == 'legacy' else self.state_module.DATA / 'tenants' / (scope + '.json')
            old = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'revision': 1}
            if old['revision'] != revision:
                return -old['revision']
            path.parent.mkdir(parents=True, exist_ok=True)
            pending = path.with_suffix('.pending.json')
            pending.write_text(json.dumps({'revision': revision + 1, 'state': state}, ensure_ascii=False, allow_nan=False), encoding='utf-8')
            os.replace(pending, path)
            return revision + 1

    def secure_json(self, status, value, cookie=None):
        body = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        if cookie is not None:
            flags = '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + str(SESSION_TTL if cookie else 0)
            if self.is_serverless or self.headers.get('X-Forwarded-Proto') == 'https':
                flags += '; Secure'
            self.send_header('Set-Cookie', self.cookie_name() + '=' + cookie + flags)
        self.end_headers()
        self.wfile.write(body)

    def api_path(self):
        parsed = urlparse(self.path)
        endpoint = parse_qs(parsed.query).get('endpoint', [''])[0]
        if endpoint:
            query = {k: v for k, v in parse_qs(parsed.query).items() if k != 'endpoint'}
            from urllib.parse import urlencode
            self.path = '/api/' + endpoint + ('?' + urlencode(query, doseq=True) if query else '')
        return urlparse(self.path).path

    def read_json_body(self):
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 4 * 1024 * 1024:
                raise ValueError()
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError()
            return payload
        except (ValueError, TypeError):
            raise AccessError(400, 'Невірний формат запиту.')

    def same_origin(self):
        origin = self.headers.get('Origin')
        if (origin and urlparse(origin).netloc != self.headers.get('Host')) or self.headers.get('Sec-Fetch-Site') == 'cross-site':
            raise AccessError(403, 'Запит з іншого сайту відхилено.')

    def do_GET(self):
        try:
            path = self.api_path()
            if path in ('/mono/login.html', '/admin/login.html'):
                self.path = '/login.html'
                return super().do_GET()
            if path == '/api/health':
                return self.secure_json(200, {'ok': True, 'version': 59, 'authentication': True})
            if path == '/api/auth/session':
                setup = not self.identity().document()[1]['users']
                if setup:
                    return self.secure_json(401, {'code': 'SETUP_REQUIRED', 'setupRequired': True})
                actor = self.principal()
                self.identity().store.set('session:' + hashlib.sha256(self.session_token().encode()).hexdigest(), json.dumps({'userId': actor['id'], 'version': actor['version']}), SESSION_TTL)
                return self.secure_json(200, {'user': public_user(actor)}, cookie=self.session_token())
            if path.startswith('/api/'):
                self.principal()
                if path == '/api/auth/users':
                    return self.secure_json(200, {'users': self.identity().users(self.principal())})
                if path == '/api/state':
                    return self.secure_json(200, self.current_record(parse_qs(urlparse(self.path).query).get('revision', [''])[0]))
                if path == '/api/statement.xlsx':
                    body = self.state_module.statement_xlsx(self.current_record()['state'], parse_qs(urlparse(self.path).query))
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                    self.send_header('Content-Length', str(len(body)))
                    self.end_headers()
                    return self.wfile.write(body)
            elif path in ('/', '/mono/', '/index.html', '/admin/', '/admin.html'):
                try:
                    self.principal()
                except AccessError:
                    self.send_response(302)
                    self.send_header('Location', ('/admin/' if 'admin' in path else '/mono/') + 'login.html?next=' + ('admin' if 'admin' in path else 'mono'))
                    self.end_headers()
                    return
            return super().do_GET()
        except AccessError as error:
            return self.secure_json(error.status, {'error': error.message, 'code': error.code})
        except Exception:
            return self.secure_json(503, {'error': 'Сховище кабінетів тимчасово недоступне.', 'code': 'STORAGE_UNAVAILABLE'})

    def do_POST(self):
        try:
            path = self.api_path()
            self.same_origin()
            if path in ('/api/auth/login', '/api/auth/setup'):
                payload = self.read_json_body()
                identity = self.identity()
                if path.endswith('/setup'):
                    if identity.store.increment('setup-rate:' + hashlib.sha256(self.client_address[0].encode()).hexdigest(), 900) > 15:
                        raise AccessError(429, 'Забагато спроб. Зачекайте 15 хвилин.')
                    user = identity.bootstrap(payload)
                else:
                    user = identity.login(payload, self.headers.get('X-Vercel-Forwarded-For', self.client_address[0]).split(',')[0])
                identity.logout(self.session_token())
                return self.secure_json(200, {'user': public_user(user)}, cookie=identity.issue_session(user))
            actor = self.principal()
            if path == '/api/auth/logout':
                self.identity().logout(self.session_token())
                return self.secure_json(200, {'ok': True}, cookie='')
            if path in ('/api/auth/users/create', '/api/auth/users/update'):
                method = self.identity().create_user if path.endswith('/create') else self.identity().update_user
                return self.secure_json(200, {'user': method(actor, self.read_json_body())})
            if path == '/api/auth/password':
                payload = self.read_json_body()
                if not password_matches(payload.get('currentPassword'), actor['password']):
                    raise AccessError(403, 'Поточний пароль невірний.')
                hashed = password_hash(payload.get('password'))
                def update(doc):
                    user = next(u for u in doc['users'] if u['id'] == actor['id'])
                    user['password'] = hashed
                    user['version'] += 1
                    return user
                updated = self.identity().change(update)
                return self.secure_json(200, {'ok': True}, cookie=self.identity().issue_session(updated))
            if path == '/api/state':
                payload = self.read_json_body()
                self.state_module.validate(payload.get('state'))
                revision = payload.get('revision')
                if type(revision) is not int or revision < 1:
                    raise AccessError(400, 'Невірна ревізія даних.')
                result = self.store_record(revision, payload['state'])
                return self.secure_json(409 if result < 0 else 200, {'revision': abs(result), **({'error': 'Дані змінились в іншому вікні.'} if result < 0 else {})})
            if path == '/api/statement.xlsx':
                payload = self.read_json_body()
                body = self.state_module.statement_xlsx(self.current_record()['state'], {k: [str(v)] for k, v in payload.get('query', {}).items()})
                self.send_response(200)
                self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                return self.wfile.write(body)
            return super().do_POST()
        except AccessError as error:
            return self.secure_json(error.status, {'error': error.message, 'code': error.code})
        except (ValueError, KeyError, TypeError):
            return self.secure_json(400, {'error': 'Невірний формат запиту.'})
        except Exception:
            return self.secure_json(503, {'error': 'Сховище кабінетів тимчасово недоступне.', 'code': 'STORAGE_UNAVAILABLE'})
