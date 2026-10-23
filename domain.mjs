import { CATALOG, makePlan, uid, MUSCLES, EQUIPMENT } from './public/catalog.js';
import { dateKey, addDays, todayInfo, recordToday, progress, elapsed, volume } from './public/shared.js';

const clone=x=>structuredClone(x);
const fail=message=>{throw Object.assign(new Error(message),{status:400});};
const str=(v,max=100)=>typeof v==='string'?v.trim().slice(0,max):'';
const checkedId=v=>{if(typeof v!=='string'||!(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/).test(v)||['constructor','prototype'].includes(v))fail('记录编号格式不正确');return v;};
const num=(v,min,max,label)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail(`${label}需在 ${min}–${max} 之间`);return v;};
const integer=(v,min,max,label)=>{num(v,min,max,label);if(!Number.isInteger(v))fail(`${label}必须为整数`);return v;};
const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
function makeActive(s,date) {return {id:uid(),day:clone(s.plan.days[s.cursor]),originalDate:date,scheduledFor:date,logs:{},started:false,elapsedSeconds:0,runningSince:null,note:'',deferredOn:null,overrideRestDate:null};}
export function createState(now=new Date()) {
 const today=dateKey(now);
 const s={schemaVersion:1,revision:0,createdAt:now.toISOString(),lastDate:today,settings:{name:'训练者',timezone:'Asia/Shanghai',weeklyGoal:4,restDays:[],reminderTime:'19:00',reminderEnabled:true,autoRestTimer:true,defaultRest:90},library:clone(CATALOG),plan:makePlan(3),cursor:0,cycle:1,history:[],body:[]};
 s.active=makeActive(s,today);return s;
}
function midnight(date,zone) {
 let guess=Date.parse(date+'T00:00:00Z');
 for(let i=0;i<3;i++) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  const local=Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
  guess+=Date.parse(date+'T00:00:00Z')-local;
 }
 return guess;
}
export function reconcile(s,now=new Date()) {
 const today=dateKey(now,s.settings.timezone);
 if(s.lastDate===today)return false;
 if(s.active.runningSince) {
  const end=Math.min(now.getTime(),midnight(addDays(s.lastDate,1),s.settings.timezone));
  s.active.elapsedSeconds=elapsed(s.active,Math.max(Date.parse(s.active.runningSince),end));
  s.active.runningSince=null;
 }
 if(s.active.scheduledFor<today)s.active.scheduledFor=today;
 s.lastDate=today;return true;
}
export function validatePlan(p,library) {
 if(!p||!str(p.name)||!Array.isArray(p.days)||p.days.length<1||p.days.length>30)fail('计划需包含 1–30 个训练或休息日');
 const known=new Set(library.map(e=>e.id)),ids=new Set();
 const days=p.days.map(d=>{
  if(!str(d.name)||!['rest','workout'].includes(d.kind)||!Array.isArray(d.exercises))fail('训练日格式不正确');
  const id=checkedId(d.id||uid());if(ids.has(id))fail('训练日编号不能重复');ids.add(id);
  if(d.kind==='workout'&&(d.exercises.length<1||d.exercises.length>30))fail('每个训练日需包含 1–30 个动作');
  const eids=new Set();
  const exercises=d.kind==='rest'?[]:d.exercises.map(e=>{
   if(!known.has(e.exerciseId))fail('计划包含不存在的动作');
   const eid=checkedId(e.id||uid());if(eids.has(eid))fail('动作记录编号不能重复');eids.add(eid);
   return {id:eid,exerciseId:e.exerciseId,sets:integer(e.sets,1,20,'组数'),reps:integer(e.reps,1,3600,'次数或时长'),weight:num(e.weight,0,2000,'重量'),rest:integer(e.rest,0,900,'休息秒数'),note:str(e.note,300)};
  });
  return {id,name:str(d.name,40),tag:str(d.tag,30)||'TRAINING',kind:d.kind,exercises};
 });
 if(!days.some(x=>x.kind==='workout'))fail('循环至少需要一个训练日');
 return {id:checkedId(p.id||uid()),name:str(p.name,60),split:days.filter(x=>x.kind==='workout').length,days};
}
function checkedSettings(v,old) {
 if(!v||typeof v!=='object'||Array.isArray(v))fail('设置格式错误');
 const result={...old};
 if(v.name!==undefined){result.name=str(v.name,24);if(!result.name)fail('请填写称呼');}
 if(v.timezone!==undefined) {try{dateKey(new Date(),v.timezone);}catch{fail('无效的时区');} result.timezone=str(v.timezone,60);}
 if(v.weeklyGoal!==undefined)result.weeklyGoal=integer(v.weeklyGoal,1,7,'每周目标');
 if(v.restDays!==undefined){if(!Array.isArray(v.restDays)||v.restDays.some(x=>!Number.isInteger(x)||x<0||x>6)||new Set(v.restDays).size>6)fail('至少保留一个可训练日');result.restDays=[...new Set(v.restDays)];}
 if(v.reminderTime!==undefined){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.reminderTime))fail('提醒时间格式不正确');result.reminderTime=v.reminderTime;}
 for(const key of ['reminderEnabled','autoRestTimer'])if(v[key]!==undefined){if(typeof v[key]!=='boolean')fail('设置格式错误');result[key]=v[key];}
 if(v.defaultRest!==undefined)result.defaultRest=integer(v.defaultRest,0,900,'默认组间休息');
 return result;
}
function checkedExercise(v,custom=true) {
 if(!v||!str(v.name)||!MUSCLES.includes(v.muscle)||!EQUIPMENT.includes(v.equipment)||!['reps','seconds','minutes'].includes(v.unit))fail('请完整填写动作名称、部位、器械和计量方式');
 return {id:checkedId(v.id||uid()),name:str(v.name,60),en:str(v.en,80),muscle:v.muscle,equipment:v.equipment,unit:v.unit,note:str(v.note,500),custom};
}
function requireActive(s,today,workoutOnly=false) {
 const info=todayInfo(s,today);
 if(!['workout','rest'].includes(info.mode)||(workoutOnly&&info.mode!=='workout'))fail('今天没有可记录的训练，请先恢复今日训练或查看打卡记录');
}
export function applyAction(source,action,now=new Date()) {
 let s=clone(source);reconcile(s,now);
 const today=dateKey(now,s.settings.timezone),a=s.active,p=action.payload||{};
 switch(action.type) {
  case 'start': requireActive(s,today,true);a.started=true;if(!a.runningSince)a.runningSince=now.toISOString();break;
  case 'pause': requireActive(s,today,true);a.elapsedSeconds=elapsed(a,now.getTime());a.runningSince=null;break;
  case 'logSet': {
   requireActive(s,today,true);
   const exercise=a.day.exercises.find(e=>e.id===p.id);if(!exercise)fail('动作不存在');
   integer(p.index,0,exercise.sets-1,'组编号');
   a.started=true;
   a.logs[`${p.id}:${p.index}`]={exerciseId:exercise.exerciseId,entryId:p.id,index:p.index,weight:num(p.weight,0,2000,'重量'),reps:integer(p.reps,1,3600,'次数或时长'),done:p.done===true};
   break;
  }
  case 'note': requireActive(s,today,true);a.note=str(p.note,1000);break;
  case 'finish': {
   requireActive(s,today);
   const stat=progress(a);
   if(a.day.kind==='workout'&&!stat.done)fail('请至少完成一组训练再打卡');
   if(stat.done<stat.total&&!p.allowPartial)fail('还有未完成的组，请确认是否按已完成部分打卡');
   a.elapsedSeconds=elapsed(a,now.getTime());a.runningSince=null;
   if(p.note!==undefined)a.note=str(p.note,1000);
   s.history.push({id:uid(),date:today,kind:a.day.kind,day:clone(a.day),logs:clone(a.logs),exerciseNames:Object.fromEntries(s.library.map(e=>[e.id,{name:e.name,unit:e.unit}])),duration:a.elapsedSeconds,volume:Math.round(volume(a.logs,s.library)*100)/100,note:a.note,cycle:s.cycle,cursor:s.cursor,planId:s.plan.id,originalDate:a.originalDate,finishedAt:now.toISOString(),partial:stat.done<stat.total,activeSnapshot:clone(a)});
   s.cursor=(s.cursor+1)%s.plan.days.length;if(s.cursor===0)s.cycle++;
   s.active=makeActive(s,addDays(today,1));break;
  }
  case 'undoFinish': {
   const record=recordToday(s,today);if(!record||s.history.at(-1)?.id!==record.id||record.planId!==s.plan.id)fail('只能撤销当前计划今天最近一次打卡');
   s.history=s.history.filter(x=>x.id!==record.id);s.cursor=record.cursor;s.cycle=record.cycle;s.active=clone(record.activeSnapshot);s.active.runningSince=null;break;
  }
  case 'defer': requireActive(s,today);a.elapsedSeconds=elapsed(a,now.getTime());a.runningSince=null;a.deferredOn=today;a.scheduledFor=addDays(today,1);break;
  case 'resumeToday': if(recordToday(s,today))fail('今天已经完成打卡');a.deferredOn=null;a.overrideRestDate=today;a.scheduledFor=today;break;
  case 'savePlan': s.plan=validatePlan(p.plan,s.library);s.plan.id=uid();s.cursor=0;s.cycle=1;s.active=makeActive(s,recordToday(s,today)?addDays(today,1):today);break;
  case 'saveExercise': {
   const old=s.library.find(x=>x.id===p.exercise?.id);if(old&&!old.custom)fail('内置动作不能修改，可以创建自定义动作');
   const ex=checkedExercise(p.exercise);if(old&&old.unit!==ex.unit&&Object.values(a.logs).some(x=>x.exerciseId===old.id))fail('当前训练已记录此动作，请先打卡或更换计划后再修改单位');if(old)s.library=s.library.map(x=>x.id===ex.id?ex:x);else {if(s.library.length>=500)fail('动作库最多保存 500 个动作');s.library.push(ex);}break;
  }
  case 'deleteExercise': {
   const ex=s.library.find(x=>x.id===p.id);if(!ex?.custom)fail('只能删除自定义动作');
   if(s.plan.days.some(d=>d.exercises.some(e=>e.exerciseId===p.id))||a.day.exercises.some(e=>e.exerciseId===p.id))fail('此动作正在训练计划中，请先从计划移除');
   s.library=s.library.filter(x=>x.id!==p.id);break;
  }
  case 'settings': s.settings=checkedSettings(p,s.settings);reconcile(s,now);break;
  case 'body': {const weight=num(p.weight,20,500,'体重');s.body=s.body.filter(x=>x.date!==today);s.body.push({date:today,weight,note:str(p.note,200)});break;}
  case 'restore': s=validateBackup(p.state,now);break;
  default:fail('未知操作');
 }
 s.revision=source.revision+1;return s;
}
export function validateBackup(input,now=new Date(),options={}) {
 if(!input||input.schemaVersion!==1||!Array.isArray(input.library)||!Array.isArray(input.history)||!Array.isArray(input.body)||input.library.length>500||input.history.length>20000)fail('备份格式或版本不正确');
 const s=clone(input);
 s.settings=checkedSettings(s.settings,createState(now).settings);
 const seen=new Set();s.library=s.library.map(e=>{const ex=checkedExercise(e,e.custom===true);if(seen.has(ex.id))fail('备份动作编号重复');seen.add(ex.id);return ex;});
 s.plan=validatePlan(s.plan,s.library);
 integer(s.cursor,0,s.plan.days.length-1,'循环位置');integer(s.cycle,1,100000,'循环次数');
 if(!validDate(s.lastDate)||!s.active||s.active.day?.id!==s.plan.days[s.cursor].id||!validDate(s.active.originalDate)||!validDate(s.active.scheduledFor)||!s.active.logs||Array.isArray(s.active.logs))fail('备份训练状态不正确');
 checkedId(s.active.id);
 for(const key of ['deferredOn','overrideRestDate'])if(s.active[key]!==null&&!validDate(s.active[key]))fail('备份休息日期错误');
 if(typeof s.active.started!=='boolean'||typeof s.active.note!=='string'||s.active.note.length>1000)fail('备份训练状态错误');
 if(JSON.stringify(s.active.day)!==JSON.stringify(s.plan.days[s.cursor]))fail('备份训练日与计划不匹配');
 num(s.active.elapsedSeconds,0,1e9,'累计时长');
 if(s.active.runningSince&&!Number.isFinite(Date.parse(s.active.runningSince)))fail('备份计时状态不正确');
 const checkLogs=(logs,day)=>{
  if(!logs||typeof logs!=='object'||Array.isArray(logs))fail('备份训练组格式错误');
  for(const [key,l] of Object.entries(logs)) {
   const ex=day.exercises.find(x=>x.id===l.entryId);
   if(!ex||l.exerciseId!==ex.exerciseId||key!==`${l.entryId}:${l.index}`||typeof l.done!=='boolean')fail('备份训练组引用错误');
   integer(l.index,0,ex.sets-1,'组编号');num(l.weight,0,2000,'重量');integer(l.reps,1,3600,'次数或时长');
  }
 };
 checkLogs(s.active.logs,s.active.day);
 const dates=new Set(),historyIds=new Set();for(const h of s.history){
  checkedId(h.id);checkedId(h.planId);if(historyIds.has(h.id))fail('备份记录编号重复');historyIds.add(h.id);
  if(!validDate(h.date)||dates.has(h.date)||!['workout','rest'].includes(h.kind)||!h.day||!Array.isArray(h.day.exercises)||!h.exerciseNames)fail('备份历史记录不正确');dates.add(h.date);
  integer(h.cycle,1,100000,'循环次数');integer(h.cursor,0,29,'循环位置');
  num(h.duration,0,1e9,'时长');num(h.volume,0,1e12,'训练量');checkLogs(h.logs,h.day);
  if(h.day.kind!==h.kind||typeof h.day.name!=='string'||typeof h.day.tag!=='string')fail('备份历史训练日错误');
  const hIds=new Set();for(const e of h.day.exercises){checkedId(e.id);checkedId(e.exerciseId);if(hIds.has(e.id))fail('历史动作编号重复');hIds.add(e.id);integer(e.sets,1,20,'组数');integer(e.reps,1,3600,'次数');num(e.weight,0,2000,'重量');integer(e.rest,0,900,'休息秒数');}
  for(const value of Object.values(h.exerciseNames)){if(!value||typeof value.name!=='string'||!['reps','seconds','minutes'].includes(value.unit))fail('历史动作名称格式错误');}
  if(!h.activeSnapshot||JSON.stringify(h.activeSnapshot.day)!==JSON.stringify(h.day)||JSON.stringify(h.activeSnapshot.logs)!==JSON.stringify(h.logs))fail('备份撤销记录不正确');
  const snap=h.activeSnapshot;checkedId(snap.id);
  if(!validDate(snap.originalDate)||!validDate(snap.scheduledFor)||snap.runningSince!==null||typeof snap.started!=='boolean'||typeof snap.note!=='string'||snap.note.length>1000)fail('备份撤销状态不正确');
  for(const key of ['deferredOn','overrideRestDate'])if(snap[key]!==null&&!validDate(snap[key]))fail('备份撤销日期错误');
  checkLogs(h.activeSnapshot.logs,h.activeSnapshot.day);num(h.activeSnapshot.elapsedSeconds,0,1e9,'时长');
  if(h.planId===s.plan.id&&(h.cursor>=s.plan.days.length||h.day.id!==s.plan.days[h.cursor].id))fail('历史循环位置不正确');
 }
 if(s.body.length>20000)fail('体重记录过多');for(const b of s.body){if(!validDate(b.date))fail('体重日期错误');num(b.weight,20,500,'体重');}
 s.revision=0;reconcile(s,now);if(!options.resume)s.active.runningSince=null;return s;
}
