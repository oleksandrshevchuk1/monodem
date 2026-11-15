"""Durable, atomic state storage for serverless functions via Upstash Redis REST."""
import json
import os
from urllib.request import Request, urlopen

class StorageNotConfigured(RuntimeError):
    pass

class SharedStore:
    def __init__(self):
        self.url = os.environ.get('UPSTASH_REDIS_REST_URL') or os.environ.get('KV_REST_API_URL')
        self.token = os.environ.get('UPSTASH_REDIS_REST_TOKEN') or os.environ.get('KV_REST_API_TOKEN')
        self.key = os.environ.get('MONO_STATE_KEY', 'monodem:shared-state:v1')
        if not self.url or not self.token:
            raise StorageNotConfigured('Connect Upstash Redis to this Vercel project')

    def command(self, *args):
        request = Request(self.url.rstrip('/'), data=json.dumps(args).encode(), headers={
            'Authorization': 'Bearer ' + self.token, 'Content-Type': 'application/json'})
        with urlopen(request, timeout=15) as response:
            result = json.load(response)
        if result.get('error'):
            raise RuntimeError('Shared database request failed')
        return result['result']

    def read(self, expected, initial):
        # Return JSON as an opaque string: Redis Lua must not change empty arrays into objects.
        script = """
        if redis.call('HEXISTS', KEYS[1], 'revision') == 0 then
          redis.call('HSET', KEYS[1], 'revision', '1', 'state', ARGV[2])
        end
        local revision = redis.call('HGET', KEYS[1], 'revision')
        if revision == ARGV[1] then return {revision} end
        return {revision, redis.call('HGET', KEYS[1], 'state')}
        """
        result = self.command('EVAL', script, 1, self.key, str(expected or ''), json.dumps(initial, ensure_ascii=False))
        record = {'revision': int(result[0])}
        if len(result) == 1:
            record['unchanged'] = True
        else:
            record['state'] = json.loads(result[1])
        return record

    def write(self, expected, state):
        script = """
        local revision = tonumber(redis.call('HGET', KEYS[1], 'revision') or '1')
        if revision ~= tonumber(ARGV[1]) then return -revision end
        redis.call('HSET', KEYS[1], 'revision', revision + 1, 'state', ARGV[2])
        return revision + 1
        """
        return int(self.command('EVAL', script, 1, self.key, str(expected), json.dumps(state, ensure_ascii=False, allow_nan=False)))
