// Local test server: static dist/ with Vercel-style clean URLs + /api/lead, and a mock Supabase/Resend/Meta.
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const DIST=path.resolve('dist');
const MOCK_PORT=+process.env.MOCK_PORT||4101,PORT=+process.env.PORT||4100;
export const store={leads:[],mail:[],meta:[],failDb:false};
process.env.SUPABASE_URL=`http://127.0.0.1:${MOCK_PORT}/sb`;process.env.SUPABASE_SERVICE_ROLE_KEY='test-service-key';
process.env.RESEND_API_KEY='test';process.env.RESEND_API_URL=`http://127.0.0.1:${MOCK_PORT}/resend`;process.env.LEAD_NOTIFY_EMAIL='team@test.invalid';
process.env.META_PIXEL_ID='123';process.env.META_CAPI_TOKEN='tok';process.env.META_GRAPH_URL=`http://127.0.0.1:${MOCK_PORT}/meta`;
const body=r=>new Promise(res=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d))});
http.createServer(async(q,s)=>{const b=await body(q);
 if(q.url==='/__state'){s.end(JSON.stringify(store));return}
 if(q.url==='/__fail'){store.failDb=true;s.end('ok');return}
 if(q.url==='/__ok'){store.failDb=false;s.end('ok');return}
 if(q.url.startsWith('/sb/rest/v1/leads')){if(store.failDb){s.statusCode=500;s.end('{}');return}if(q.headers.authorization!=='Bearer test-service-key'){s.statusCode=401;s.end('{}');return}store.leads.push(JSON.parse(b));s.statusCode=201;s.end('');return}
 if(q.url.startsWith('/resend')){store.mail.push(JSON.parse(b));s.end('{}');return}
 if(q.url.startsWith('/meta')){store.meta.push(JSON.parse(b));s.end('{}');return}
 s.statusCode=404;s.end()}).listen(MOCK_PORT);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.ico':'image/x-icon'};
const lead=require(path.resolve('api/lead.js'));
http.createServer(async(q,s)=>{const u=new URL(q.url,'http://x');let p=decodeURIComponent(u.pathname);
 if(p==='/api/lead'){const b=await body(q);let j;try{j=JSON.parse(b)}catch(e){j=b}
  const res={statusCode:200,setHeader(){},status(c){this.statusCode=c;return this},json(o){s.statusCode=this.statusCode;s.setHeader('Content-Type','application/json');s.end(JSON.stringify(o))}};
  await lead({method:q.method,headers:q.headers,body:j},res);return}
 let f=path.join(DIST,p);const tryf=[f,f+'.html',path.join(f,'index.html')];const hit=tryf.find(x=>x.startsWith(DIST)&&fs.existsSync(x)&&fs.statSync(x).isFile());
 if(!hit){s.statusCode=404;s.setHeader('Content-Type','text/html; charset=utf-8');s.end(fs.readFileSync(path.join(DIST,'404.html')));return}
 s.setHeader('Content-Type',mime[path.extname(hit)]||'application/octet-stream');s.end(fs.readFileSync(hit))}).listen(PORT,()=>console.log('serving',PORT));
