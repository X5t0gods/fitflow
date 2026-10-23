import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {createState,applyAction} from '../domain.mjs';
import * as catalog from '../public/catalog.js';
import * as shared from '../public/shared.js';

test('all screens and dialogs render with real application data without runtime exceptions',async()=>{
 const now=new Date('2026-10-22T10:00:00Z');
 const state=createState(now),elements=new Map();
 const node=()=>({innerHTML:'',textContent:'',style:{},inert:false,classList:{add(){},remove(){}},querySelector(){return null;},querySelectorAll(){return [];}});
 for(const id of ['#app','#toast','#modal-root','#rest-timer','#sync-label'])elements.set(id,node());
 const document={querySelector:s=>elements.get(s)||null,querySelectorAll:()=>[],addEventListener(){},body:{style:{}},activeElement:null,hidden:true};
 const location={hash:''};
 const context=vm.createContext({...catalog,...shared,document,location,window:{isSecureContext:false,addEventListener(){},scrollTo(){}},navigator:{},structuredClone,console,localStorage:{getItem(){return null;},setItem(){},removeItem(){}},setInterval(){},setTimeout(){},clearTimeout(){},requestAnimationFrame(){},fetch:async()=>({ok:true,status:200,json:async()=>({state,today:'2026-10-22',serverTime:now.toISOString(),authEnabled:false})})});
 const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
 vm.runInContext(source,context);await new Promise(resolve=>setImmediate(resolve));
 assert.match(elements.get('#app').innerHTML,/今天，你打卡了吗/);
 for(const page of ['today','plan','library','history','settings','workout']){
  vm.runInContext(`route='${page}';render()`,context);assert.ok(elements.get('#app').innerHTML.length>4000,`${page} rendered`);assert.doesNotMatch(elements.get('#app').innerHTML,/NaN|undefined/);
 }
 for(const call of ['showPlanHelp()','showExerciseForm()','showExercise("bench")','showPicker()','showAddToDay("bench")','weightModal()','reminderModal()']){
  vm.runInContext(call,context);assert.match(elements.get('#modal-root').innerHTML,/role="dialog"/);assert.doesNotMatch(elements.get('#modal-root').innerHTML,/NaN|undefined/);vm.runInContext('closeModal()',context);
 }
 const entry=state.active.day.exercises[0];let completed=applyAction(state,{type:'logSet',payload:{id:entry.id,index:0,weight:40,reps:10,done:true}},now);completed=applyAction(completed,{type:'finish',payload:{allowPartial:true}},now);context.completed=completed;
 vm.runInContext('state=completed;route="today";render();showRecord(state.history[0].id)',context);assert.match(elements.get('#app').innerHTML,/今天的进步，已存档/);assert.match(elements.get('#modal-root').innerHTML,/40 kg × 10 次/);
 vm.runInContext('closeModal();route="history";render()',context);assert.match(elements.get('#app').innerHTML,/400/);
});
