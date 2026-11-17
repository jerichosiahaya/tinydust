"""On-demand local usage summaries. No transcript text is output or persisted."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import sqlite3
import stat
import sys
import time
from urllib.request import Request, urlopen

MAX_BYTES = 512 * 1024 * 1024
MAX_LINE = 16 * 1024 * 1024
MAX_FILES = 2000
MAX_EVENTS = 50000
MAX_SECONDS = 25
CATALOG_URL = 'https://openrouter.ai/api/v1/models'
TOKEN_FIELDS = ('input', 'output', 'cache_read', 'cache_write', 'other')


def valid_counts(*values):
    return all(value is None or (isinstance(value, (int, float)) and not isinstance(value, bool) and
        0 <= value <= 10**15 and math.isfinite(value) and int(value) == value) for value in values)


def integer(value):
    return int(value) if value is not None and valid_counts(value) else 0


def timestamp(value):
    try:
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            return float(value) / 1000 if value > 10**11 else float(value)
        text = str(value)
        result = datetime.fromisoformat(text[:-1] + '+00:00' if text.endswith('Z') else text)
        return (result if result.tzinfo else result.replace(tzinfo=timezone.utc)).timestamp()
    except (TypeError, ValueError, OverflowError, OSError):
        return None


def text(value, default='unknown'):
    if not isinstance(value, str):
        return default
    value = ' '.join(value.split())[:120]
    return value or default


def token_set(input=0, output=0, cache_read=0, cache_write=0, other=0):
    return {key: integer(value) for key, value in zip(TOKEN_FIELDS, (input, output, cache_read, cache_write, other))}


def price_number(value):
    if isinstance(value, bool):
        return None
    try:
        n = float(value)
        return n if math.isfinite(n) and 0 <= n <= 1000 else None
    except (TypeError, ValueError, OverflowError):
        return None


def parse_catalog(payload):
    if not isinstance(payload, dict) or not isinstance(payload.get('data'), list):
        return {}
    rates = {}
    for row in payload['data']:
        if not isinstance(row, dict) or not isinstance(row.get('id'), str) or not isinstance(row.get('pricing'), dict):
            continue
        price = row['pricing']
        rates[row['id'].lower()] = {
            'input': price_number(price.get('prompt')),
            'output': price_number(price.get('completion')),
            'cache_read': price_number(price.get('input_cache_read')),
            'cache_write': price_number(price.get('input_cache_write')),
        }
    return rates


def fetch_prices():
    try:
        request = Request(CATALOG_URL, headers={'Accept': 'application/json', 'User-Agent': 'TinyDust-Usage/1'})
        with urlopen(request, timeout=6) as response:
            payload = response.read(8 * 1024 * 1024 + 1)
        if len(payload) > 8 * 1024 * 1024:
            return {}
        return parse_catalog(json.loads(payload))
    except Exception:
        return {}


def price_event(event, rates):
    tokens = event['tokens']
    total = sum(tokens.values())
    recorded = event.get('cost')
    if recorded is not None and (recorded > 0 or event.get('provider_cost') is True):
        return recorded, 0, total
    provider = event['provider'].lower()
    model = event['model'].lower()
    aliases = {'openai-codex': 'openai', 'openai': 'openai', 'anthropic': 'anthropic', 'google': 'google', 'openrouter': 'openrouter'}
    candidates = [model] if '/' in model else ([aliases[provider] + '/' + model] if provider in aliases and provider != 'openrouter' else [])
    rate = next((rates[key] for key in candidates if key in rates), None)
    if not rate:
        return 0.0, total, 0
    usd, missing = 0.0, tokens['other']
    for key in TOKEN_FIELDS[:-1]:
        amount = tokens[key]
        if amount and rate.get(key) is None:
            missing += amount
        elif amount:
            usd += amount * rate[key]
    return usd, missing, total - missing


def roots(home, env):
    pi = Path(env.get('PI_CODING_AGENT_DIR') or home / '.pi' / 'agent').expanduser()
    claude = Path(env.get('CLAUDE_CONFIG_DIR') or home / '.claude').expanduser()
    codex = Path(env.get('CODEX_HOME') or home / '.codex').expanduser()
    xdg = Path(env.get('XDG_DATA_HOME') or home / '.local' / 'share').expanduser()
    return {
        'Pi': [pi / 'sessions'],
        'Claude Code': [claude / 'projects'],
        'Codex': [codex / 'sessions', codex / 'archived_sessions'],
        'OpenCode': [xdg / 'opencode'],
    }


class Scanner:
    def __init__(self, home, env=None, now=None, max_bytes=MAX_BYTES, max_seconds=MAX_SECONDS):
        self.home = Path(home)
        self.env = dict(env or {})
        self.now = now or datetime.now().astimezone()
        self.since = (self.now - timedelta(days=30)).timestamp()
        self.deadline = time.monotonic() + max_seconds
        self.max_bytes = max_bytes
        self.bytes_read = 0
        self.events = {}
        self.sources = {name: {'checked': False, 'found': False, 'files': 0, 'scanned': 0, 'issues': 0} for name in roots(self.home, self.env)}
        self.notes = set()
        self.partial = False

    def issue(self, source, note):
        self.sources[source]['issues'] += 1
        self.notes.add(note)
        self.partial = True

    def bounded(self):
        if self.bytes_read >= self.max_bytes:
            self.notes.add('Scan reached its 512 MiB read limit.'); self.partial = True; return False
        if time.monotonic() >= self.deadline:
            self.notes.add('Scan reached its time limit.'); self.partial = True; return False
        if len(self.events) >= MAX_EVENTS:
            self.notes.add('Scan reached its event limit.'); self.partial = True; return False
        return True

    def discover(self):
        files = []
        traversed = 0
        for source, directories in roots(self.home, self.env).items():
            self.sources[source]['checked'] = True
            for root in directories:
                if not root.is_dir():
                    continue
                self.sources[source]['found'] = True
                def walk_error(_error):
                    self.issue(source, 'Some source folders could not be read.')
                for directory, subdirs, names in os.walk(root, followlinks=False, onerror=walk_error):
                    if time.monotonic() >= self.deadline:
                        self.issue(source, 'Source discovery reached its time limit.'); return sorted(files, key=lambda item: item[0], reverse=True)
                    subdirs[:] = sorted(subdirs)
                    for name in sorted(names):
                        traversed += 1
                        if traversed > 200000:
                            self.issue(source, 'Source discovery reached its entry limit.'); return sorted(files, key=lambda item: item[0], reverse=True)
                        candidate = Path(directory) / name
                        if name.endswith('.jsonl.zst') and source == 'Codex':
                            try:
                                info = os.lstat(candidate)
                                if stat.S_ISREG(info.st_mode) and info.st_mtime >= self.since:
                                    self.issue(source, 'Compressed Codex sessions are not included.')
                            except OSError:
                                self.issue(source, 'Some source files could not be inspected.')
                            continue
                        eligible = name.endswith('.jsonl') if source != 'OpenCode' else name.startswith('opencode') and name.endswith('.db')
                        if not eligible:
                            continue
                        try:
                            info = os.lstat(candidate)
                            if not stat.S_ISREG(info.st_mode) or info.st_mtime < self.since:
                                continue
                            self.sources[source]['files'] += 1
                            files.append((info.st_mtime, source, candidate, info.st_size))
                        except OSError:
                            self.issue(source, 'Some source files could not be inspected.')
                        if len(files) >= MAX_FILES:
                            self.issue(source, 'Scan reached its file limit.'); return sorted(files, key=lambda item: item[0], reverse=True)
        return sorted(files, key=lambda item: item[0], reverse=True)

    def add(self, key, source, stamp, provider, model, tokens, cost=None, provider_cost=False):
        at = timestamp(stamp)
        total = sum(tokens.values())
        if at is None or not math.isfinite(at):
            self.issue(source, 'Some usage records had no usable timestamp.'); return
        if at < self.since or at > self.now.timestamp() + 300 or not total:
            return
        row = {'source': source, 'at': at, 'provider': text(provider), 'model': text(model), 'tokens': tokens,
               'cost': price_number(cost), 'provider_cost': provider_cost is True}
        previous = self.events.get(key)
        if previous:
            row['at'] = min(row['at'], previous['at'])
            row['tokens'] = {field: max(tokens[field], previous['tokens'][field]) for field in TOKEN_FIELDS}
            if previous.get('cost') is not None and (row['cost'] is None or previous['cost'] > row['cost']):
                row['cost'] = previous['cost']; row['provider_cost'] = previous.get('provider_cost', False)
        self.events[key] = row

    def pi(self, record, source, path_key):
        typ = record.get('type'); message = record.get('message') if isinstance(record.get('message'), dict) else {}
        response = None
        if typ == 'message' and message.get('role') in ('assistant', 'toolResult'):
            usage = message.get('usage'); provider = message.get('provider'); model = message.get('responseModel') or message.get('model')
            response = message.get('responseId'); ident = response or record.get('id') or message.get('toolCallId')
        elif typ in ('usage', 'compaction', 'branch_summary'):
            usage = record.get('usage'); provider = record.get('provider'); model = record.get('model'); ident = record.get('id')
        elif record.get('recordType') == 'message' and record.get('role') == 'assistant':
            usage = record.get('usage'); provider = record.get('provider') or message.get('provider'); model = record.get('model') or message.get('model')
            response = record.get('responseId') or message.get('responseId')
            ident = response or record.get('id') or f"sub:{record.get('runId') or path_key}:{record.get('childIndex',0)}"
        else:
            return
        if not isinstance(usage, dict):
            return
        raw = [usage.get(key) for key in ('input','output','cacheRead','cacheWrite','totalTokens')]
        if not valid_counts(*raw):
            self.issue(source, 'Some usage records had invalid token counts.'); return
        t = token_set(*raw[:4])
        if not sum(t.values()):t['other'] = integer(raw[4])
        stamp = record.get('timestamp') or record.get('ts') or message.get('timestamp')
        if not ident:
            self.issue(source, 'Some Pi records lacked a stable ID and were skipped.'); return
        cost = usage.get('cost') if isinstance(usage.get('cost'), dict) else {}
        key = ('Pi-response', str(response), text(provider), text(model)) if response else ('Pi', str(ident), str(stamp), text(provider), text(model))
        self.add(key, source, stamp, provider, model, t, cost.get('total'), cost.get('totalFromProvider'))

    def claude(self, record, source):
        message = record.get('message') if isinstance(record.get('message'), dict) else {}
        usage = message.get('usage') if isinstance(message.get('usage'), dict) else None
        if record.get('type') != 'assistant' or not usage:
            return
        ident = message.get('id')
        if not ident:
            self.issue(source, 'Some Claude records lacked a message ID and were skipped.'); return
        creation = usage.get('cache_creation_input_tokens')
        if creation is None and isinstance(usage.get('cache_creation'), dict):
            values = list(usage['cache_creation'].values())
            if not valid_counts(*values):
                self.issue(source, 'Some usage records had invalid token counts.'); return
            creation = sum(integer(v) for v in values)
        raw = [usage.get('input_tokens'), usage.get('output_tokens'), usage.get('cache_read_input_tokens'), creation]
        if not valid_counts(*raw):
            self.issue(source, 'Some usage records had invalid token counts.'); return
        tokens = token_set(*raw)
        self.add(('Claude Code', str(ident)), source, record.get('timestamp'), message.get('provider') or 'anthropic', message.get('model'), tokens)

    def codex(self, record, source, state):
        payload = record.get('payload') if isinstance(record.get('payload'), dict) else {}
        typ = record.get('type')
        if typ == 'session_meta':
            state['session'] = text(payload.get('id'), state['session']); state['provider'] = text(payload.get('model_provider'), state['provider'])
        elif typ == 'turn_context':
            state['model'] = text(payload.get('model'), state['model'])
        elif typ == 'event_msg' and payload.get('type') == 'token_usage_record':
            self.issue(source, 'Some newer Codex usage records are not included.')
        elif typ == 'event_msg' and payload.get('type') == 'token_count':
            info = payload.get('info') if isinstance(payload.get('info'), dict) else {}
            total = info.get('total_token_usage'); last = info.get('last_token_usage')
            if isinstance(total, dict):
                values = [total.get(k) for k in ('input_tokens','cached_input_tokens','output_tokens')]
                if not valid_counts(*values):
                    self.issue(source, 'Some usage records had invalid token counts.'); return
                vector = tuple(integer(value) for value in values)
                previous = state.get('previous')
                reset = bool(previous and any(v < old for v, old in zip(vector, previous)))
                if reset:state['epoch'] += 1
                delta = vector if previous is None or reset else tuple(v-old for v, old in zip(vector, previous))
                state['previous'] = vector
                key = ('Codex', state['session'], state['epoch'], vector)
            elif isinstance(last, dict):
                values = [last.get(k) for k in ('input_tokens','cached_input_tokens','output_tokens')]
                if not valid_counts(*values):
                    self.issue(source, 'Some usage records had invalid token counts.'); return
                delta = tuple(integer(value) for value in values)
                key = ('Codex-last', state['session'], str(record.get('timestamp')), delta)
            else:
                return
            inp, cached, out = delta
            if cached > inp:
                self.issue(source, 'Some Codex cached-token counts were inconsistent.'); return
            tokens = token_set(inp-cached, out, cached)
            self.add(key, source, record.get('timestamp'), state['provider'], state['model'], tokens)

    def jsonl(self, source, path):
        path_key = hashlib.sha256(os.fsencode(path)).hexdigest()[:16]
        state = {'session': path_key, 'provider': 'unknown', 'model': 'unknown', 'epoch': 0}
        try:
            with path.open('rb') as f:
                while self.bounded():
                    line = f.readline(MAX_LINE + 1)
                    if not line:break
                    self.bytes_read += len(line)
                    if len(line) > MAX_LINE:
                        self.issue(source, 'Some oversized records were skipped.')
                        while line and not line.endswith(b'\n') and self.bounded():
                            line = f.readline(MAX_LINE + 1); self.bytes_read += len(line)
                        continue
                    if b'usage' not in line and not (source == 'Codex' and (b'session_meta' in line or b'turn_context' in line)):
                        continue
                    try:
                        record = json.loads(line)
                    except (ValueError, UnicodeDecodeError):
                        self.issue(source, 'Some incomplete or malformed records were skipped.'); continue
                    if not isinstance(record, dict):continue
                    if source == 'Pi':self.pi(record, source, path_key)
                    elif source == 'Claude Code':self.claude(record, source)
                    else:self.codex(record, source, state)
        except OSError:
            self.issue(source, 'Some source files could not be read.')

    def opencode(self, source, path, size):
        # Open the source database read-only; do not modify or cache session records.
        try:
            db = sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True, timeout=1)
            try:
                db.execute('PRAGMA query_only=ON')
                for ident, created, raw in db.execute('SELECT id, time_created, data FROM message'):
                    if not self.bounded():break
                    self.bytes_read += len(raw.encode('utf-8')) if isinstance(raw, str) else 0
                    if not isinstance(raw, str) or len(raw)>MAX_LINE:
                        self.issue(source, 'Some oversized database records were skipped.');continue
                    try:data=json.loads(raw)
                    except ValueError:self.issue(source, 'Some malformed database records were skipped.');continue
                    if not isinstance(data, dict) or data.get('role') != 'assistant' or not isinstance(data.get('tokens'), dict):continue
                    usage=data['tokens']; cache=usage.get('cache') if isinstance(usage.get('cache'),dict) else {}
                    values=[usage.get('input'),usage.get('output'),cache.get('read'),cache.get('write')]
                    if not valid_counts(*values):
                        self.issue(source, 'Some usage records had invalid token counts.');continue
                    tokens=token_set(*values)
                    stamp=(data.get('time') or {}).get('created') if isinstance(data.get('time'),dict) else None
                    self.add(('OpenCode',str(ident)),source,stamp or created,data.get('providerID'),data.get('modelID'),tokens,data.get('cost'))
            finally:db.close()
        except (OSError, sqlite3.Error):
            self.issue(source, 'An OpenCode database could not be read safely.')

    def run(self, include_prices=False, price_loader=fetch_prices):
        files=self.discover()
        for _,source,path,size in files:
            if not self.bounded():break
            self.sources[source]['scanned'] += 1
            if source=='OpenCode':self.opencode(source,path,size)
            else:self.jsonl(source,path)
        if self.sources['Codex']['files']:
            self.notes.add('Codex forked or resumed sessions may be incomplete or duplicated.')
        rates=price_loader() if include_prices else {}
        if include_prices and not rates:self.notes.add('Public prices unavailable; showing recorded costs only.')
        return self.summary(rates,include_prices)

    def summary(self,rates,include_prices):
        now=self.now.timestamp(); today=self.now.date()
        windows={'today':lambda at:datetime.fromtimestamp(at,timezone.utc).astimezone(self.now.tzinfo).date()==today,
                 'week':lambda at:at>=now-7*86400,'month':lambda at:at>=now-30*86400}
        result={}
        for key,contains in windows.items():
            total={'tokens':0,'usd':0.0,'priced':0,'unpriced':0,'sources':[],'models':[]}
            sources={name:{'name':name,'tokens':0,'usd':0.0,'priced':0,'unpriced':0,**status} for name,status in self.sources.items()}
            models={}
            for event in self.events.values():
                if not contains(event['at']):continue
                count=sum(event['tokens'].values());cost,missing,priced=price_event(event,rates)
                for bucket in (total,sources[event['source']],models.setdefault((event['source'],event['model']),{'source':event['source'],'name':event['model'],'tokens':0,'usd':0.0,'priced':0,'unpriced':0})):
                    bucket['tokens']+=count;bucket['usd']+=cost;bucket['priced']+=priced;bucket['unpriced']+=missing
            total['sources']=list(sources.values())
            total['models']=sorted(models.values(),key=lambda row:row['tokens'],reverse=True)[:8]
            result[key]=total
        return {'kind':'tinydust-usage','version':1,'generatedAt':self.now.isoformat(),'partial':self.partial,
                'notes':sorted(self.notes),'pricing':{'requested':include_prices,'available':bool(rates)},'periods':result}


def main():
    parser=argparse.ArgumentParser(description='Summarize recent AI usage without saving conversation text.')
    parser.add_argument('--prices',action='store_true',help='Fetch the public OpenRouter model-price catalog')
    parser.add_argument('--home',help='Home directory to scan (default: current user)')
    args=parser.parse_args()
    try:
        report=Scanner(Path(args.home) if args.home else Path.home(),os.environ).run(include_prices=args.prices)
        print(json.dumps(report,separators=(',',':'),allow_nan=False))
    except Exception:
        print(json.dumps({'kind':'tinydust-usage','version':1,'error':'Usage scan failed; no session text was saved.'}))
        return 1
    return 0


if __name__=='__main__':
    sys.exit(main())
