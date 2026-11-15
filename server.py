"""Local demo server. All browsers share one versioned, durable state file."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from threading import RLock
from datetime import date
import argparse
import json
import os
import re
import io
import zipfile
import hashlib
import base64
import pymupdf as fitz
from xml.sax.saxutils import escape

ROOT=Path(__file__).resolve().parent
DIST=ROOT/'dist'
DATA=ROOT/'data'
STATE_FILE=DATA/'state.json'
LOCK=RLock()
MAX_BYTES=96*1024*1024

def empty_state():
    return dict(name='Демо-користувач',holder='DEMO USER',card='0000 0000 0000 0000',account='Чорна картка',opening=0,cashback=0,avatar=None,transactions=[],files=[],extraCards=[],activeCard='main',jars=[],deposits=[],categories=[],contacts=[],messages=[],regular=[],creditLimit=0,notifications=0,cardSettings={},cashbackRates=[dict(name='Кафе та ресторани',rate=3,icon='coffee-fill'),dict(name='Покупки',rate=2,icon='shopping-bag-fill'),dict(name='Авто та АЗС',rate=2,icon='car-fill'),dict(name='Розваги',rate=5,icon='gift-fill')])

def read_record():
    if not STATE_FILE.exists():
        record={'revision':1,'state':empty_state()}
        write_record(record)
        return record
    return json.loads(STATE_FILE.read_text(encoding='utf-8'))

def write_record(record):
    DATA.mkdir(exist_ok=True)
    temporary=DATA/'state.pending.json'
    with temporary.open('w',encoding='utf-8') as stream:
        json.dump(record,stream,ensure_ascii=False,allow_nan=False,separators=(',',':'))
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary,STATE_FILE)

def validate(state):
    if not isinstance(state,dict):raise ValueError('Невірний формат даних')
    for key in ['name','card','account']:
        if not isinstance(state.get(key),str):raise ValueError('Пошкоджене поле '+key)
    for key in ['opening','cashback']:
        if not isinstance(state.get(key),(int,float)) or isinstance(state[key],bool):raise ValueError('Пошкоджена сума '+key)
    for key in ['transactions','files','extraCards','jars','contacts','regular','deposits']:
        if not isinstance(state.get(key,[]),list):raise ValueError('Пошкоджений список '+key)
    for tx in state.get('transactions',[]):
        if not isinstance(tx,dict) or not isinstance(tx.get('id'),str) or not isinstance(tx.get('title'),str) or not isinstance(tx.get('amount'),(int,float)) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',tx.get('date','')):raise ValueError('Пошкоджена операція')
    for attachment in state.get('files',[]):
        kind=attachment.get('type','')
        if kind not in ['image/jpeg','image/png','image/webp','application/pdf'] or not str(attachment.get('blob','')).startswith('data:'+kind+';base64,'):raise ValueError('Пошкоджене вкладення')
    json.dumps(state,allow_nan=False)

def statement_xlsx(state,query):
    start=query.get('start',['0000-00-00'])[0]
    end=query.get('end',['9999-99-99'])[0]
    card=query.get('card',['main'])[0]
    english=query.get('language',['uk'])[0]=='en'
    rows=[['DEMO - NOT A BANK DOCUMENT' if english else 'ДЕМО · НЕ БАНКІВСЬКИЙ ДОКУМЕНТ'],[state['name'],start+' — '+end],['Date','Description','Amount, UAH'] if english else ['Дата','Операція','Сума, UAH']]
    for tx in state.get('transactions',[]):
        if tx.get('cardId','main')==card and start<=tx['date']<=end:rows.append([tx['date'],tx['title'],tx['amount']])
    cells=[]
    for r,values in enumerate(rows,1):
        parts=[]
        for c,value in enumerate(values):
            reference=chr(65+c)+str(r)
            if isinstance(value,(int,float)):parts.append(f'<c r="{reference}" s="1"><v>{value}</v></c>')
            else:
                text=escape(re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]','',str(value)))
                parts.append(f'<c r="{reference}" t="inlineStr"><is><t xml:space="preserve">{text}</t></is></c>')
        cells.append(f'<row r="{r}">'+''.join(parts)+'</row>')
    output=io.BytesIO()
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>')
        z.writestr('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        z.writestr('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Demo statement" sheetId="1" r:id="rId1"/></sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
        z.writestr('xl/styles.xml','<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>')
        z.writestr('xl/worksheets/sheet1.xml','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="2" width="52" customWidth="1"/><col min="3" max="3" width="23" customWidth="1"/></cols><sheetData>'+''.join(cells)+'</sheetData></worksheet>')
    return output.getvalue()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(DIST),**kwargs)
    def log_request(self,code='-',size='-'):
        if str(code).startswith(('4','5')):super().log_request(code,size)
    def end_headers(self):
        self.send_header('Cache-Control',getattr(self,'cache_control','no-store'))
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()
    def json_response(self,status,value):
        body=json.dumps(value,ensure_ascii=False,allow_nan=False,separators=(',',':')).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if urlparse(self.path).path in ('/mono/', '/admin/'):
            self.path = '/admin.html' if urlparse(self.path).path == '/admin/' else '/index.html'
        parsed=urlparse(self.path)
        if parsed.path in ('/','/index.html'):
            with LOCK:record=read_record()
            profile=record['state']
            avatar=profile.get('avatar') or ''
            signature=str(len(avatar))+':'+avatar[:64]+':'+avatar[-64:] if avatar else ''
            token=hashlib.sha256(avatar.encode()).hexdigest()[:20] if avatar else ''
            local_avatar=avatar.startswith(('data:image/jpeg;base64,','data:image/png;base64,','data:image/webp;base64,'))
            avatar_url='/api/profile-avatar?v='+token if local_avatar else (avatar or None)
            bootstrap={'name':profile.get('name',''),'avatar':avatar_url,'avatarSignature':signature}
            payload=json.dumps(bootstrap,ensure_ascii=False).replace('<','\\u003c').replace('&','\\u0026')
            extra='<script type="application/json" id="entry-bootstrap">'+payload+'</script>'
            if local_avatar:extra+='<link rel="preload" as="image" href="'+avatar_url+'">'
            body=(DIST/'index.html').read_text(encoding='utf-8').replace('</head>',extra+'</head>').encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type','text/html; charset=utf-8')
            self.send_header('Content-Length',str(len(body)))
            self.end_headers()
            return self.wfile.write(body)
        if parsed.path=='/api/profile-avatar':
            with LOCK:avatar=read_record()['state'].get('avatar') or ''
            if not avatar.startswith(('data:image/jpeg;base64,','data:image/png;base64,','data:image/webp;base64,')):
                return self.json_response(404,{'error':'Фото профілю не задане'})
            token=hashlib.sha256(avatar.encode()).hexdigest()[:20]
            if parse_qs(parsed.query).get('v',[''])[0]!=token:
                self.send_response(302)
                self.send_header('Location','/api/profile-avatar?v='+token)
                self.end_headers()
                return
            raw=base64.b64decode(avatar.split(',',1)[1],validate=True)
            self.cache_control='private, max-age=31536000, immutable'
            self.send_response(200)
            self.send_header('Content-Type',avatar[5:].split(';',1)[0])
            self.send_header('ETag','"'+token+'"')
            self.send_header('Content-Length',str(len(raw)))
            self.end_headers()
            return self.wfile.write(raw)
        if parsed.path=='/api/state':
            with LOCK:record=read_record()
            if parse_qs(parsed.query).get('revision',[''])[0]==str(record['revision']):
                return self.json_response(200,{'revision':record['revision'],'unchanged':True})
            return self.json_response(200,record)
        if parsed.path=='/api/example':
            return self.json_response(200,json.loads((ROOT/'data'/'example.json').read_text(encoding='utf-8')))
        if parsed.path=='/api/health':return self.json_response(200,{'ok':True,'storage':'server','version':11})
        if parsed.path=='/api/statement.xlsx':
            with LOCK:record=read_record()
            body=statement_xlsx(record['state'],parse_qs(parsed.query))
            self.send_response(200)
            self.send_header('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            self.send_header('Content-Disposition','attachment; filename="demo-statement.xlsx"')
            self.send_header('Content-Length',str(len(body)))
            self.end_headers()
            return self.wfile.write(body)
        return super().do_GET()
    def do_POST(self):
        if urlparse(self.path).path=='/api/receipt-preview':
            origin=self.headers.get('Origin','')
            if origin and urlparse(origin).netloc!=self.headers.get('Host',''):return self.json_response(403,{'error':'Інше джерело'})
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=10*1024*1024:raise ValueError('PDF до 10 МБ')
                raw=self.rfile.read(length)
                key=hashlib.sha256(raw).hexdigest()
                cache=DATA/'receipt-previews';cache.mkdir(exist_ok=True)
                target=cache/(key+'.json')
                with LOCK:
                    if target.exists():result=json.loads(target.read_text())
                    else:
                        with fitz.open(stream=raw,filetype='pdf') as doc:
                            if doc.needs_pass or not 0<len(doc)<=20:raise ValueError('PDF захищений або містить понад 20 сторінок')
                            pages=[]
                            for page in doc:
                                scale=min(2,1400/max(page.rect.width,page.rect.height))
                                png=page.get_pixmap(matrix=fitz.Matrix(scale,scale),alpha=False).tobytes('png')
                                pages.append('data:image/png;base64,'+base64.b64encode(png).decode())
                            result={'pages':pages}
                        target.write_text(json.dumps(result))
                return self.json_response(200,result)
            except Exception:
                return self.json_response(400,{'error':'Не вдалося відкрити PDF. Перевірте файл.'})
        if urlparse(self.path).path!='/api/state':return self.json_response(404,{'error':'Невідомий шлях'})
        # Only accept browser requests from this local project's origins.
        origin=self.headers.get('Origin','')
        if origin and urlparse(origin).netloc!=self.headers.get('Host',''):return self.json_response(403,{'error':'Інше джерело запиту'})
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<size<=MAX_BYTES:return self.json_response(413,{'error':'Дані перевищують 96 МБ'})
            payload=json.loads(self.rfile.read(size))
            state=payload.get('state')
            validate(state)
            with LOCK:
                record=read_record()
                if payload.get('revision')!=record['revision']:return self.json_response(409,{'error':'Дані вже змінилися в іншому вікні. Оновіть форму та повторіть зміну.','revision':record['revision']})
                record={'revision':record['revision']+1,'state':state}
                write_record(record)
            self.json_response(200,{'revision':record['revision']})
        except (ValueError,TypeError,KeyError) as error:self.json_response(400,{'error':str(error)})

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=int(os.environ.get('PORT','8080')))
    parser.add_argument('--host',default=os.environ.get('HOST','127.0.0.1'))
    parser.add_argument('--data-dir',type=Path,default=Path(os.environ.get('DATA_DIR',str(DATA))))
    options=parser.parse_args()
    DATA=options.data_dir.resolve()
    DATA.mkdir(parents=True,exist_ok=True)
    STATE_FILE=DATA/'state.json'
    with LOCK:read_record()
    print(f'Demo: http://127.0.0.1:{options.port}/index.html',flush=True)
    print(f'Admin: http://127.0.0.1:{options.port}/admin.html',flush=True)
    class LocalServer(ThreadingHTTPServer):
        request_queue_size=128
        daemon_threads=True
    LocalServer((options.host,options.port),Handler).serve_forever()
