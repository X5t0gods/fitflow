import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, applyAction, reconcile, validateBackup } from '../domain.mjs';
import { dateKey, todayInfo, forecast, progress, summary, elapsed } from '../public/shared.js';
import { makePlan } from '../public/catalog.js';

const now=new Date('2026-10-22T10:00:00Z');
const act=(s,type,payload={},date=now)=>applyAction(s,{type,payload},date);
const logOne=(s,date=now)=>act(s,'logSet',{id:s.active.day.exercises[0].id,index:0,weight:40,reps:10,done:true},date);
const finish=(s,date=now)=>act(logOne(s,date),'finish',{allowPartial:true},date);

test('default plan includes a gym catalog, three training days and recovery',()=>{
 const s=createState(now);assert.equal(s.library.length,55);assert.equal(s.plan.days.length,4);assert.equal(s.plan.split,3);assert.equal(s.history.length,0);assert.equal(todayInfo(s,'2026-10-22').mode,'workout');
});
test('all six presets validate and persist',()=>{
 for(let split=1;split<=6;split++){const s=act(createState(now),'savePlan',{plan:makePlan(split)});assert.equal(s.plan.split,split);assert.equal(validateBackup(s,now).plan.split,split);}
});
test('missing many days keeps the same task and partial set progress',()=>{
 const s=logOne(createState(now)),id=s.active.id;
 assert.equal(reconcile(s,new Date('2026-11-05T02:00:00Z')),true);
 assert.equal(s.active.id,id);assert.equal(s.cursor,0);assert.equal(progress(s.active).done,1);assert.equal(s.active.originalDate,'2026-10-22');assert.equal(s.active.scheduledFor,'2026-11-05');assert.equal(s.history.length,0);
});
test('opening or starting a page never counts as checking in',()=>{
 const s=act(createState(now),'start');assert.equal(s.history.length,0);assert.equal(s.cursor,0);assert.equal(s.active.started,true);
});
test('partial finish needs explicit confirmation and at least one logged set',()=>{
 const s=createState(now);assert.throws(()=>act(s,'finish',{allowPartial:true}),/至少完成/);
 const logged=logOne(s);assert.throws(()=>act(logged,'finish'),/确认/);
 const finished=act(logged,'finish',{allowPartial:true});assert.equal(finished.history[0].partial,true);assert.equal(finished.history[0].volume,400);assert.equal(finished.cursor,1);
});
test('finishing advances exactly once, schedules tomorrow, and blocks duplicate check-in',()=>{
 const s=finish(createState(now));assert.equal(s.active.originalDate,'2026-10-23');assert.equal(todayInfo(s,'2026-10-22').mode,'complete');assert.throws(()=>act(s,'finish',{allowPartial:true}),/没有可记录/);assert.equal(s.history.length,1);
 const f=forecast(s,'2026-10-22',3);assert.equal(f[0].status,'complete');assert.equal(f[1].day.id,s.plan.days[1].id);assert.equal(f[2].day.id,s.plan.days[2].id);
});
test('undo restores both cycle position and checked sets',()=>{
 const s=act(finish(createState(now)),'undoFinish');assert.equal(s.cursor,0);assert.equal(s.history.length,0);assert.equal(progress(s.active).done,1);assert.equal(s.active.runningSince,null);
});
test('manual rest preserves progress and can be resumed the same day',()=>{
 let s=act(logOne(createState(now)),'defer');assert.equal(todayInfo(s,'2026-10-22').mode,'deferred');assert.equal(s.cursor,0);assert.equal(progress(s.active).done,1);
 s=act(s,'resumeToday');assert.equal(todayInfo(s,'2026-10-22').mode,'workout');assert.equal(progress(s.active).done,1);
});
test('fixed weekly rests do not consume a cycle day and can be overridden',()=>{
 let s=act(createState(now),'settings',{restDays:[4]});assert.equal(todayInfo(s,'2026-10-22').mode,'fixedRest');assert.equal(forecast(s,'2026-10-22',2)[1].day.id,s.plan.days[0].id);
 assert.throws(()=>act(s,'start'),/没有可记录/);s=act(s,'resumeToday');assert.equal(todayInfo(s,'2026-10-22').mode,'workout');assert.equal(s.cursor,0);
});
test('recovery day check-in completes the loop without counting as a workout',()=>{
 let s=createState(now);
 for(let i=0;i<3;i++)s=finish(s,new Date(`2026-10-${22+i}T10:00:00Z`));
 const date=new Date('2026-10-25T10:00:00Z');reconcile(s,date);assert.equal(todayInfo(s,'2026-10-25').mode,'rest');
 s=act(s,'finish',{},date);assert.equal(s.cursor,0);assert.equal(s.cycle,2);assert.equal(summary(s,'2026-10-25').count,3);assert.equal(s.history.length,4);
});
test('timezone midnight rolls date correctly, ends the timer, and preserves the task',()=>{
 assert.equal(dateKey(new Date('2026-10-22T16:00:00Z'),'Asia/Shanghai'),'2026-10-23');
 let s=act(createState(new Date('2026-10-22T15:50:00Z')),'start',{},new Date('2026-10-22T15:50:00Z'));
 reconcile(s,new Date('2026-10-23T04:00:00Z'));assert.equal(s.active.elapsedSeconds,600);assert.equal(s.active.runningSince,null);assert.equal(s.cursor,0);
});
test('pause and restart preserve elapsed training duration',()=>{
 let s=act(createState(now),'start');s=act(s,'pause',{},new Date(now.getTime()+120000));assert.equal(s.active.elapsedSeconds,120);
 s=act(s,'start',{},new Date(now.getTime()+150000));const recovered=validateBackup(s,new Date(now.getTime()+180000),{resume:true});assert.equal(elapsed(recovered.active,now.getTime()+180000),150);
});
test('server restart after midnight counts only training up to the previous midnight',()=>{
 const n=new Date('2026-10-22T15:50:00Z'),s=act(createState(n),'start',{},n);
 const restored=validateBackup(s,new Date('2026-10-24T10:00:00Z'),{resume:true});assert.equal(restored.active.elapsedSeconds,600);assert.equal(restored.active.runningSince,null);
});
test('plan changes keep history snapshots and assign a new plan version',()=>{
 let s=finish(createState(now));const id=s.plan.id,history=structuredClone(s.history[0]);const p=structuredClone(s.plan);p.days.reverse();s=act(s,'savePlan',{plan:p});assert.notEqual(s.plan.id,id);assert.deepEqual(s.history[0],history);assert.equal(s.active.originalDate,'2026-10-23');assert.doesNotThrow(()=>validateBackup(s,now));assert.throws(()=>act(s,'undoFinish'),/当前计划/);
});
test('weight logging updates the same date without duplicate records',()=>{
 let s=act(createState(now),'body',{weight:70.5});s=act(s,'body',{weight:70.2});assert.equal(s.body.length,1);assert.equal(s.body[0].weight,70.2);
});
test('backup round trip works and malformed numeric, identity, and referenced data is rejected',()=>{
 const s=finish(createState(now));assert.equal(validateBackup(s,now).history.length,1);
 const bad=structuredClone(s);bad.active.elapsedSeconds=-2;assert.throws(()=>validateBackup(bad,now));
 const injected=structuredClone(s);injected.library[0].id='x" onclick="alert(1)';assert.throws(()=>validateBackup(injected,now));
 const missing=structuredClone(s);missing.active.day.exercises[0].exerciseId='missing';assert.throws(()=>validateBackup(missing,now));
 const nan=structuredClone(s);nan.history[0].volume=null;assert.throws(()=>validateBackup(nan,now));
});
test('numeric constraints and all-rest schedules cannot be saved',()=>{
 const s=createState(now),p=makePlan(2);p.days[0].exercises[0].sets=0;assert.throws(()=>act(s,'savePlan',{plan:p}),/组数/);assert.throws(()=>act(s,'settings',{restDays:[0,1,2,3,4,5,6]}),/至少保留/);
 const p2=makePlan(2);p2.days.forEach(d=>d.kind='rest');assert.throws(()=>act(s,'savePlan',{plan:p2}),/至少需要/);
});
test('custom exercises support creation, validation, and references in a plan',()=>{
 let s=createState(now);const custom={id:'custom-example',name:'自定义器械动作',en:'Custom',muscle:'胸部',equipment:'固定器械',unit:'reps',note:'座椅 3 档'};s=act(s,'saveExercise',{exercise:custom});assert.equal(s.library.at(-1).custom,true);
 const p=makePlan(1);p.days[0].exercises[0].exerciseId=custom.id;s=act(s,'savePlan',{plan:p});assert.throws(()=>act(s,'deleteExercise',{id:custom.id}),/正在训练计划/);assert.doesNotThrow(()=>validateBackup(s,now));
});
