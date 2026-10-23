import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createState, reconcile, applyAction, validateBackup } from './domain.mjs';
import { dateKey } from './public/shared.js';

const root=path.dirname(fileURLToPath(import.meta.url));
const publicDir=path.join(root,'public');
const dataDir=path.resolve(process.env.DATA_DIR||path.join(root,'data'));
const port=Number(process.env.PORT||3210),host=process.env.HOST||'0.0.0.0';
const password=process.env.APP_PASSWORD||'',production=process.env.NODE_ENV==='production';
const secureCookie=process.env.COOKIE_SECURE==='true';
if(production&&password.length<12)throw new Error('生产环境需设置至少 12 位 APP_PASSWORD。请参阅 README.md。');
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT 不正确');
fs.mkdirSync(dataDir,{recursive:true});
const dataFile=path.join(dataDir,'state.json');
let state;
if(fs.existsSync(dataFile)) {
 const raw=JSON.parse(fs.readFileSync(dataFile,'utf8'));
 state=validateBackup(raw,new Date(),{resume:true});
 state.revision=Number.isInteger(raw.revision)?raw.revision+1:1;
} else state=createState();
function persist(next) {
 const tmp=path.join(dataDir,`state-${process.pid}.tmp`);
 const fd=fs.openSync(tmp,'w',0o600);
 try{fs.writeFileSync(fd,JSON.stringify(next,null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 if(fs.existsSync(dataFile))fs.copyFileSync(dataFile,path.join(dataDir,'state.previous.json'));
 fs.renameSync(tmp,dataFile);state=next;
}
persist(state);
const sessions=new Map(),attempts=new Map();
const localHosts=new Set(['localhost','127.0.0.1','[::1]',...Object.values(os.networkInterfaces()).flat().filter(Boolean).map(x=>x.address)]);
const allowedHosts=(process.env.ALLOWED_HOSTS||'').split(',').map(x=>x.trim()).filter(Boolean);
const auth=req=>!password||(()=>{const token=req.headers.cookie?.match(/(?:^|;\s*)fitflow_session=([^;]+)/)?.[1];const expiry=sessions.get(token);if(expiry&&expiry>Date.now())return true;if(token)sessions.delete(token);return false;})();
function headers(res) {
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','same-origin');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
 res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req){
 if(!req.headers['content-type']?.startsWith('application/json'))throw Object.assign(new Error('请求需为 JSON'),{status:415});
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>5*1024*1024)throw Object.assign(new Error('文件过大，最多 5 MB'),{status:413});chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(new Error('JSON 格式不正确'),{status:400});}
}
function refresh(){const next=structuredClone(state);if(reconcile(next)){next.revision++;persist(next);}}
const envelope=()=>({state,today:dateKey(new Date(),state.settings.timezone),serverTime:new Date().toISOString(),authEnabled:!!password});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 headers(res);
 try {
  const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
  const reqHost=(req.headers.host||'').replace(/:\d+$/,'');
  if(!localHosts.has(reqHost)&&!allowedHosts.includes(reqHost)){json(res,403,{error:'此主机名未获允许，请在 ALLOWED_HOSTS 配置域名'});return;}
  if(!['GET','HEAD','POST'].includes(req.method)){json(res,405,{error:'不支持此请求方法'});return;}
  if(req.method==='POST') {
   const origin=req.headers.origin;
   if(origin&&new URL(origin).host!==req.headers.host){json(res,403,{error:'不允许跨站写入'});return;}
   if(req.headers['sec-fetch-site']==='cross-site'){json(res,403,{error:'不允许跨站写入'});return;}
  }
  if(pathname==='/api/health'){json(res,200,{ok:true,app:'fitflow'});return;}
  if(pathname==='/api/auth'&&req.method==='GET'){json(res,200,{authenticated:auth(req),authEnabled:!!password});return;}
  if(pathname==='/api/login'&&req.method==='POST') {
   const p=await body(req),ip=req.socket.remoteAddress;
   const item=attempts.get(ip)||{count:0,until:Date.now()+900000};
   if(item.until<Date.now()){item.count=0;item.until=Date.now()+900000;}
   if(item.count>=10){json(res,429,{error:'尝试次数过多，请 15 分钟后重试'});return;}
   const hash=v=>crypto.createHash('sha256').update(v).digest();
   if(typeof p.password!=='string'||!crypto.timingSafeEqual(hash(p.password),hash(password))){item.count++;attempts.set(ip,item);json(res,401,{error:'访问密码不正确'});return;}
   attempts.delete(ip);
   for(const [key,exp] of sessions)if(exp<Date.now())sessions.delete(key);
   const token=crypto.randomBytes(32).toString('hex');sessions.set(token,Date.now()+30*86400000);
   res.setHeader('Set-Cookie',`fitflow_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${secureCookie?'; Secure':''}`);
   json(res,200,{ok:true});return;
  }
  if(pathname.startsWith('/api/')) {
   if(!auth(req)){json(res,401,{error:'请先输入访问密码'});return;}
   if(pathname==='/api/logout'&&req.method==='POST') {
    const token=req.headers.cookie?.match(/(?:^|;\s*)fitflow_session=([^;]+)/)?.[1];sessions.delete(token);
    res.setHeader('Set-Cookie','fitflow_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');json(res,200,{ok:true});return;
   }
   refresh();
   if(pathname==='/api/state'&&req.method==='GET'){json(res,200,envelope());return;}
   if(pathname==='/api/export'&&req.method==='GET'){
    res.setHeader('Content-Disposition',`attachment; filename="fitflow-${dateKey()}.json"`);json(res,200,state);return;
   }
   if(pathname==='/api/action'&&req.method==='POST'){
    const action=await body(req);refresh();
    if(action.revision!==state.revision){json(res,409,{error:'另一设备更新了数据，已刷新，请重新操作',...envelope()});return;}
    persist(applyAction(state,action));json(res,200,envelope());return;
   }
   json(res,404,{error:'接口不存在'});return;
  }
  if(!['GET','HEAD'].includes(req.method)){json(res,405,{error:'方法不支持'});return;}
  const file=path.resolve(publicDir,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(publicDir+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){json(res,404,{error:'页面不存在'});return;}
  const ext=path.extname(file);res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':'no-cache'});
  if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
 }catch(err){if(!res.headersSent)json(res,err.status||500,{error:err.status?err.message:'保存失败，请稍后重试。原有数据未被替换。'});else res.end();if(!err.status)console.error(err);}
});
server.requestTimeout=15000;
server.listen(port,host,()=>{
 console.log(`练序 FITFLOW is running\nLocal: http://localhost:${port}`);
 for(const [name,addresses] of Object.entries(os.networkInterfaces()))for(const a of addresses||[])if(a.family==='IPv4'&&!a.internal&&!a.address.startsWith('169.254.')&&!a.address.startsWith('198.18.'))console.log(`LAN (${name}): http://${a.address}:${port}`);
 console.log(`Data: ${dataDir}\nAccess password: ${password?'enabled':'not configured (local personal use)'}`);
});
server.on('error',err=>{console.error(err.message);process.exitCode=1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
