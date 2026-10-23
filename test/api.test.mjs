import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile} from 'node:fs/promises';
import {once} from 'node:events';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
async function freePort(){const s=net.createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const port=s.address().port;await new Promise(resolve=>s.close(resolve));return port;}
async function startServer(port,dataDir,extra={}){
 const child=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',DATA_DIR:dataDir,APP_PASSWORD:'',NODE_ENV:'test',...extra},stdio:['ignore','pipe','pipe'],windowsHide:true});
 let output='';
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{child.kill();reject(new Error('Server startup timeout: '+output));},10000);
  child.stdout.on('data',chunk=>{output+=chunk.toString();if(output.includes('Local:')){clearTimeout(timeout);resolve();}});
  child.stderr.on('data',chunk=>output+=chunk.toString());
  child.on('exit',code=>{clearTimeout(timeout);reject(new Error('Server exited '+code+': '+output));});
  child.on('error',err=>{clearTimeout(timeout);reject(err);});
 });
 return child;
}
async function stop(child){if(child.exitCode!==null)return;const ended=once(child,'exit');child.kill();await ended;}

test('HTTP data persistence, validation, revisions, backup, security and static resources', {timeout:30000},async t=>{
 const dataDir=await mkdtemp(path.join(os.tmpdir(),'fitflow-api-test-')),port=await freePort(),base=`http://127.0.0.1:${port}`;
 let child=await startServer(port,dataDir);t.after(async()=>stop(child));
 let revision;
 const get=async route=>{const r=await fetch(base+route);return {r,data:await r.json()};};
 const post=async(type,payload={},rev=revision)=>{const r=await fetch(base+'/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,payload,revision:rev})});const data=await r.json();if(r.ok)revision=data.state.revision;return {r,data};};
 await t.test('serves phone app and all offline assets',async()=>{
  for(const url of ['/','/app.js','/style.css','/catalog.js','/shared.js','/sw.js','/manifest.webmanifest','/icon-192.png','/icon-512.png']){const r=await fetch(base+url);assert.equal(r.status,200,url);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);await r.arrayBuffer();}
  assert.equal((await get('/api/health')).data.ok,true);
  assert.equal((await fetch(base+'/data/state.json')).status,404);
  assert.equal((await fetch(base+'/.env')).status,404);
 });
 await t.test('logs set, prevents stale concurrent writes, and persists atomically',async()=>{
  const initial=(await get('/api/state')).data;revision=initial.state.revision;const stale=revision,entry=initial.state.active.day.exercises[0];
  const result=await post('logSet',{id:entry.id,index:0,weight:50,reps:8,done:true});assert.equal(result.r.status,200);assert.equal(Object.values(result.data.state.active.logs)[0].weight,50);
  const conflict=await post('settings',{name:'stale client'},stale);assert.equal(conflict.r.status,409);assert.equal(conflict.data.state.settings.name,'训练者');
  const disk=JSON.parse(await readFile(path.join(dataDir,'state.json'),'utf8'));assert.equal(Object.values(disk.active.logs)[0].reps,8);
 });
 await t.test('invalid mutations leave previous data unchanged',async()=>{
  const previous=revision;assert.equal((await post('settings',{weeklyGoal:99})).r.status,400);assert.equal((await post('restore',{state:{schemaVersion:1}})).r.status,400);
  assert.equal((await get('/api/state')).data.state.revision,previous);
 });
 await t.test('rejects cross-origin writes and unsupported content types',async()=>{
  const bad=await fetch(base+'/api/action',{method:'POST',headers:{'content-type':'application/json',origin:'https://foreign.example'},body:'{}'});assert.equal(bad.status,403);
  const text=await fetch(base+'/api/action',{method:'POST',headers:{'content-type':'text/plain'},body:'{}'});assert.equal(text.status,415);
 });
 await t.test('finishes once, exports backup, and restores it',async()=>{
  const result=await post('finish',{allowPartial:true});assert.equal(result.r.status,200);assert.equal(result.data.state.history[0].volume,400);assert.equal(result.data.state.cursor,1);
  assert.equal((await post('finish',{allowPartial:true})).r.status,400);
  const exported=await get('/api/export');assert.match(exported.r.headers.get('content-disposition'),/attachment/);assert.equal(exported.data.history.length,1);
  const imported=await post('restore',{state:exported.data});assert.equal(imported.r.status,200);assert.equal(imported.data.state.history.length,1);
 });
 await t.test('survives a real server restart',async()=>{
  await stop(child);child=await startServer(port,dataDir);const result=(await get('/api/state')).data;assert.equal(result.state.history[0].volume,400);assert.equal(result.state.cursor,1);assert.equal(result.state.history.length,1);assert.ok(result.state.revision>revision);
 });
});

test('production access password, login, private cookies, and logout', {timeout:30000},async t=>{
 const dataDir=await mkdtemp(path.join(os.tmpdir(),'fitflow-auth-test-')),port=await freePort(),base=`http://127.0.0.1:${port}`;
 const child=await startServer(port,dataDir,{NODE_ENV:'production',APP_PASSWORD:'test-only-password-12345',COOKIE_SECURE:'true'});t.after(async()=>stop(child));
 assert.equal((await fetch(base+'/api/state')).status,401);
 assert.equal((await fetch(base+'/api/export')).status,401);
 const login=async password=>fetch(base+'/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})});
 assert.equal((await login('incorrect')).status,401);
 const success=await login('test-only-password-12345');assert.equal(success.status,200);
 const cookie=success.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);assert.match(cookie,/Secure/);
 assert.equal((await fetch(base+'/api/state',{headers:{cookie}})).status,200);
 assert.equal((await fetch(base+'/api/logout',{method:'POST',headers:{cookie,'content-type':'application/json'},body:'{}'})).status,200);
 assert.equal((await fetch(base+'/api/state',{headers:{cookie}})).status,401);
});
