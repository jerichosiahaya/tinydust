import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'mods/tinydust/usage_scan.py'
spec = importlib.util.spec_from_file_location('tinydust_usage_scan', SCRIPT)
usage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(usage)
NOW = datetime(2026, 11, 17, 12, tzinfo=timezone.utc)


class UsageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.home = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def jsonl(self, relative, records, mtime=NOW):
        path = self.home / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(''.join(json.dumps(record) + '\n' for record in records))
        os.utime(path, (mtime.timestamp(), mtime.timestamp()))
        return path

    def open_code(self):
        path = self.home / '.local/share/opencode/opencode.db'
        path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(path) as db:
            db.execute('CREATE TABLE message (id TEXT, time_created INTEGER, data TEXT)')
            db.execute('INSERT INTO message VALUES (?,?,?)', ('m1', int(NOW.timestamp()*1000), json.dumps({
                'role': 'assistant', 'providerID': 'openai', 'modelID': 'gpt-sample',
                'tokens': {'input': 15, 'output': 5, 'cache': {'read': 10, 'write': 0}}, 'cost': 0.02,
                'content': 'SECRET_DO_NOT_RETURN',
            })))
            db.execute('INSERT INTO message VALUES (?,?,?)', ('m2', int(NOW.timestamp()*1000), json.dumps({'role':'user','content':'SECRET_DO_NOT_RETURN'})))
        os.utime(path, (NOW.timestamp(), NOW.timestamp()))
        return path

    def fixture(self):
        stamp = NOW.isoformat()
        pi = {'type':'message','id':'p1','timestamp':stamp,'message':{'role':'assistant','provider':'openai','model':'gpt-sample',
              'content':'SECRET_DO_NOT_RETURN','usage':{'input':100,'output':20,'cacheRead':30,'cacheWrite':10,'cost':{'total':1.2,'totalFromProvider':True}}}}
        comp = {'type':'usage','id':'p2','timestamp':stamp,'provider':'unknown','model':'unpriced','usage':{'input':10,'output':5}}
        self.jsonl('.pi/agent/sessions/work/a.jsonl',[pi,pi,comp])
        claude = lambda output: {'type':'assistant','timestamp':stamp,'message':{'id':'message-1','model':'claude-sample',
                 'content':'SECRET_DO_NOT_RETURN','usage':{'input_tokens':10,'output_tokens':output,'cache_read_input_tokens':100,'cache_creation_input_tokens':40}}}
        self.jsonl('.claude/projects/work/b.jsonl',[claude(1),claude(20)])
        codex = [{'type':'session_meta','payload':{'id':'session-1','model_provider':'openai'}},
                 {'type':'turn_context','payload':{'model':'gpt-sample'}},
                 {'type':'event_msg','timestamp':stamp,'payload':{'type':'token_count','info':{'total_token_usage':{'input_tokens':100,'cached_input_tokens':40,'output_tokens':10}}}},
                 {'type':'event_msg','timestamp':stamp,'payload':{'type':'token_count','info':{'total_token_usage':{'input_tokens':100,'cached_input_tokens':40,'output_tokens':10}}}},
                 {'type':'event_msg','timestamp':stamp,'payload':{'type':'token_count','info':{'total_token_usage':{'input_tokens':180,'cached_input_tokens':50,'output_tokens':25}}}}]
        self.jsonl('.codex/sessions/c.jsonl',codex)
        self.jsonl('.codex/archived_sessions/copy.jsonl',codex)
        return self.open_code()

    def test_four_sources_dedupe_and_keep_private_text_out(self):
        database=self.fixture();before=hashlib.sha256(database.read_bytes()).hexdigest()
        files_before={str(p.relative_to(self.home)):hashlib.sha256(p.read_bytes()).hexdigest() for p in self.home.rglob('*') if p.is_file()}
        scan=usage.Scanner(self.home,{},now=NOW)
        report=scan.run(price_loader=lambda: self.fail('Offline scan must not request prices'))
        today=report['periods']['today'];self.assertEqual(today['tokens'],580)
        self.assertAlmostEqual(today['usd'],1.22);self.assertEqual(today['priced'],190);self.assertEqual(today['unpriced'],390)
        self.assertEqual({row['name']:row['tokens'] for row in today['sources']},{'Pi':175,'Claude Code':170,'Codex':205,'OpenCode':30})
        self.assertEqual(hashlib.sha256(database.read_bytes()).hexdigest(),before)
        files_after={str(p.relative_to(self.home)):hashlib.sha256(p.read_bytes()).hexdigest() for p in self.home.rglob('*') if p.is_file()}
        self.assertEqual(files_after,files_before,'offline scanning must not write a usage cache or alter session files')
        self.assertNotIn('SECRET_DO_NOT_RETURN',json.dumps(report))
        self.assertNotIn(str(self.home),json.dumps(report))
        self.assertFalse(report['pricing']['requested'])
        self.assertTrue(any('Codex' in note for note in report['notes']))

    def test_pi_replayed_response_id_is_counted_once(self):
        def row(ident,stamp,output):return {'type':'message','id':ident,'timestamp':stamp,'message':{'role':'assistant','responseId':'response-1',
          'provider':'openai','model':'gpt-sample','usage':{'input':10,'output':output}}}
        self.jsonl('.pi/agent/sessions/a.jsonl',[row('one',NOW.isoformat(),1),row('two',(NOW-timedelta(seconds=1)).isoformat(),5)])
        report=usage.Scanner(self.home,{},now=NOW).run()
        self.assertEqual(report['periods']['today']['tokens'],15)

    def test_pi_subagent_usage_is_counted_without_prompt_content(self):
        row={'recordType':'message','role':'assistant','runId':'sample','childIndex':0,'timestamp':NOW.isoformat(),
             'provider':'openai','model':'gpt-sample','usage':{'input':8,'output':2},'content':'SECRET_DO_NOT_RETURN'}
        self.jsonl('.pi/agent/sessions/sub.jsonl',[row,row])
        report=usage.Scanner(self.home,{},now=NOW).run()
        self.assertEqual(report['periods']['today']['tokens'],10)
        self.assertNotIn('SECRET_DO_NOT_RETURN',json.dumps(report))

    def test_reported_zero_is_not_confused_with_unknown_price(self):
        event={'tokens':usage.token_set(input=10),'cost':0.0,'provider_cost':False,'provider':'x','model':'y'}
        self.assertEqual(usage.price_event(event,{}),(0.0,10,0))
        event['provider_cost']=True
        self.assertEqual(usage.price_event(event,{}),(0.0,0,10))

    def test_catalog_exact_matches_and_missing_components_are_explicit(self):
        rates=usage.parse_catalog({'data':[{'id':'openai/gpt-sample','pricing':{'prompt':'0.000001','completion':'0.000002','input_cache_read':'0.0000001'}}]})
        event={'tokens':usage.token_set(10,5,20,7),'cost':None,'provider_cost':False,'provider':'openai','model':'gpt-sample'}
        cost,missing,priced=usage.price_event(event,rates)
        self.assertAlmostEqual(cost,0.000022);self.assertEqual(missing,7);self.assertEqual(priced,35)
        event['model']='gpt-sample-unknown';self.assertEqual(usage.price_event(event,rates),(0.0,42,0))
        self.assertIsNone(usage.price_number(True))

    def test_price_fetch_uses_only_the_fixed_public_url(self):
        requests=[]
        class Response:
            def __enter__(self):return self
            def __exit__(self,*_args):pass
            def read(self,_limit):return json.dumps({'data':[{'id':'openai/test','pricing':{'prompt':'0.1','completion':'0.2'}}]}).encode()
        def fake(request,timeout):
            requests.append(request);self.assertEqual(timeout,6);return Response()
        with patch.object(usage,'urlopen',fake):
            rates=usage.fetch_prices()
        self.assertIn('openai/test',rates);self.assertEqual(requests[0].full_url,usage.CATALOG_URL)
        self.assertEqual(requests[0].get_method(),'GET');self.assertIsNone(requests[0].data)
        self.assertNotIn('authorization',{name.lower() for name,_value in requests[0].header_items()})

    def test_prices_are_optional_and_failure_is_visible(self):
        self.fixture();calls=[]
        report=usage.Scanner(self.home,{},now=NOW).run(include_prices=True,price_loader=lambda: calls.append(True) or {})
        self.assertEqual(calls,[True]);self.assertTrue(report['pricing']['requested']);self.assertFalse(report['pricing']['available'])
        self.assertTrue(any('prices unavailable' in note for note in report['notes']))

    def test_periods_and_old_files(self):
        now=NOW.isoformat();old=(NOW-timedelta(days=10)).isoformat();ancient=(NOW-timedelta(days=35)).isoformat()
        def row(i,stamp):return {'type':'message','id':i,'timestamp':stamp,'message':{'role':'assistant','usage':{'input':10,'output':0}}}
        self.jsonl('.pi/agent/sessions/recent.jsonl',[row('a',now),row('b',old),row('c',ancient)])
        self.jsonl('.pi/agent/sessions/old.jsonl',[row('d',ancient)],mtime=NOW-timedelta(days=35))
        report=usage.Scanner(self.home,{},now=NOW).run()
        self.assertEqual([report['periods'][k]['tokens'] for k in ['today','week','month']],[10,10,20])
        self.assertEqual(report['periods']['today']['sources'][0]['files'],1)

    def test_limits_and_bad_records_are_reported_without_paths(self):
        self.jsonl('.pi/agent/sessions/a.jsonl',[{'type':'usage','id':'x','timestamp':NOW.isoformat(),'usage':{'input':12}}])
        report=usage.Scanner(self.home,{},now=NOW,max_bytes=1).run()
        self.assertTrue(report['partial']);self.assertTrue(any('limit' in note for note in report['notes']))
        path=self.home/'.claude/projects/bad.jsonl';path.parent.mkdir(parents=True);path.write_bytes(b'{"usage": bad}\n')
        os.utime(path,(NOW.timestamp(),NOW.timestamp()))
        report=usage.Scanner(self.home,{},now=NOW).run()
        self.assertTrue(report['partial']);self.assertNotIn(str(self.home),json.dumps(report))

    def test_compressed_codex_sessions_are_disclosed(self):
        path=self.home/'.codex/sessions/archive.jsonl.zst';path.parent.mkdir(parents=True);path.write_bytes(b'fixture')
        report=usage.Scanner(self.home,{},now=NOW).run()
        self.assertTrue(report['partial']);self.assertTrue(any('Compressed Codex' in note for note in report['notes']))

    def test_invalid_counts_are_skipped_and_marked_partial(self):
        stamp=NOW.isoformat()
        records=[{'type':'message','id':'bad','timestamp':stamp,'message':{'role':'assistant','usage':{'input':-2,'output':5}}},
                 {'type':'message','id':'bad2','timestamp':stamp,'message':{'role':'assistant','usage':{'input':True,'output':5}}}]
        self.jsonl('.pi/agent/sessions/bad.jsonl',records)
        report=usage.Scanner(self.home,{},now=NOW).run()
        self.assertTrue(report['partial']);self.assertEqual(report['periods']['today']['tokens'],0)
        self.assertTrue(any('invalid token' in note for note in report['notes']))
        self.assertFalse(usage.valid_counts(10**400));self.assertFalse(usage.valid_counts(1.5))

    def test_old_compressed_codex_sessions_do_not_mark_recent_scan_partial(self):
        path=self.home/'.codex/sessions/old.jsonl.zst';path.parent.mkdir(parents=True);path.write_bytes(b'fixture')
        old=(NOW-timedelta(days=35)).timestamp();os.utime(path,(old,old))
        report=usage.Scanner(self.home,{},now=NOW).run()
        self.assertFalse(report['partial'])

    def test_discovery_limit_marks_unvisited_sources_as_not_checked(self):
        self.jsonl('.pi/agent/sessions/a.jsonl',[{'type':'usage','id':'p','timestamp':NOW.isoformat(),'usage':{'input':1}}])
        self.jsonl('.claude/projects/a.jsonl',[{'type':'assistant','timestamp':NOW.isoformat(),'message':{'id':'c','usage':{'input_tokens':2}}}])
        with patch.object(usage,'MAX_FILES',1):report=usage.Scanner(self.home,{},now=NOW).run()
        sources={row['name']:row for row in report['periods']['today']['sources']}
        self.assertTrue(report['partial']);self.assertTrue(sources['Pi']['checked']);self.assertFalse(sources['Claude Code']['checked'])

    def test_custom_source_roots_are_honored(self):
        stamp=NOW.isoformat()
        self.jsonl('custom-pi/sessions/a.jsonl',[{'type':'usage','id':'p','timestamp':stamp,'usage':{'input':3}}])
        self.jsonl('custom-claude/projects/a.jsonl',[{'type':'assistant','timestamp':stamp,'message':{'id':'c','usage':{'input_tokens':4}}}])
        env={'PI_CODING_AGENT_DIR':str(self.home/'custom-pi'),'CLAUDE_CONFIG_DIR':str(self.home/'custom-claude')}
        report=usage.Scanner(self.home,env,now=NOW).run()
        sources={row['name']:row for row in report['periods']['today']['sources']}
        self.assertEqual(sources['Pi']['tokens'],3);self.assertEqual(sources['Claude Code']['tokens'],4)

    def test_missing_sources_are_not_fabricated(self):
        report=usage.Scanner(self.home,{},now=NOW).run()
        self.assertTrue(all(not row['found'] for row in report['periods']['today']['sources']))
        self.assertEqual(report['periods']['today']['tokens'],0);self.assertEqual(report['periods']['today']['priced'],0)

    @unittest.skipIf(os.name == 'nt', 'Symlink creation may require Windows privileges')
    def test_symlinked_session_files_are_not_followed(self):
        outside=self.home/'outside.jsonl';outside.write_text(json.dumps({'type':'usage','id':'secret','timestamp':NOW.isoformat(),'usage':{'input':99}})+'\n')
        os.utime(outside,(NOW.timestamp(),NOW.timestamp()))
        root=self.home/'.pi/agent/sessions';root.mkdir(parents=True)
        (root/'link.jsonl').symlink_to(outside)
        report=usage.Scanner(self.home,{},now=NOW).run()
        self.assertEqual(report['periods']['today']['tokens'],0)

    def test_cli_offline_outputs_only_summary(self):
        stamp=datetime.now(timezone.utc).isoformat()
        self.jsonl('.pi/agent/sessions/a.jsonl',[{'type':'message','id':'p','timestamp':stamp,'message':{'role':'assistant','content':'SECRET_DO_NOT_RETURN','usage':{'input':5}}}],mtime=datetime.now(timezone.utc))
        env={k:v for k,v in os.environ.items() if k not in {'PI_CODING_AGENT_DIR','CLAUDE_CONFIG_DIR','CODEX_HOME','XDG_DATA_HOME'}}
        result=subprocess.run([sys.executable,str(SCRIPT),'--home',str(self.home)],env=env,text=True,capture_output=True,check=True,timeout=15)
        data=json.loads(result.stdout);self.assertEqual(data['kind'],'tinydust-usage');self.assertNotIn('SECRET_DO_NOT_RETURN',result.stdout)
        self.assertNotIn(str(self.home),result.stdout);self.assertFalse(data['pricing']['requested'])


if __name__=='__main__':
    unittest.main()
