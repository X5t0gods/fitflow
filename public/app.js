import { MUSCLES, EQUIPMENT, PRESETS, makePlan, prescription, restDay, uid, unitLabel } from './catalog.js';
import { dateKey, addDays, weekday, daysBetween, weekStart, todayInfo, progress, elapsed, forecast, summary, setKey } from './shared.js';

const $=(selector,root=document)=>(typeof root==='string'?document.querySelector(root):root).querySelector(selector);
const $$=(selector,root=document)=>[...(typeof root==='string'?document.querySelector(root):root).querySelectorAll(selector)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>structuredClone(x);
const store={get(key){try{return localStorage.getItem('fitflow:'+key);}catch{return null;}},set(key,value){try{localStorage.setItem('fitflow:'+key,value);}catch{}},remove(key){try{localStorage.removeItem('fitflow:'+key);}catch{}}};
const paths={
 home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
 calendar:'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m2 10h2m4 0h2m-8 4h2',
 dumbbell:'M6 7v10m-3-8v6m15-8v10m3-8v6M6 12h12M5 7h3v10H5zm11 0h3v10h-3z',
 chart:'M4 3v17h17M8 15l4-5 4 3 5-7',
 settings:'m9 3 1-1h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 arrow:'M4 12h15m-6-6 6 6-6 6',
 chevron:'m9 5 7 7-7 7', down:'m6 9 6 6 6-6', left:'m15 5-7 7 7 7',
 check:'m5 12 4 4L19 6',plus:'M12 5v14M5 12h14',close:'m6 6 12 12M6 18 18 6',
 clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 repeat:'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3',
 flame:'M12 2c1 5 6 6 6 11a6 6 0 0 1-12 0c0-3 1-5 3-7 0 4 2 4 2 4s3-3 1-8z',
 target:'M20 12a8 8 0 1 1-8-8m0 4a4 4 0 1 0 4 4M12 12l8-8m-4 0h4v4',
 leaf:'M20 3C10 2 3 5 4 13a6 6 0 0 0 8 6c7-3 8-10 8-16zM3 22 16 8',
 bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
 search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 edit:'m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15z',
 trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
 download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',upload:'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',
 play:'m7 4 13 8-13 8z',pause:'M8 5v14M16 5v14',
 info:'M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 trophy:'M8 3h8v6a4 4 0 0 1-8 0zM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v6m-4 2h8m-6-2h4',
 weight:'M6 7h12l3 14H3zM9 7V5a3 3 0 0 1 6 0v2',
 bars:'M5 17v4M12 10v11M19 3v18',
 cloud:'M6 18a5 5 0 1 1 1-10 6 6 0 0 1 11-1 5 5 0 0 1 0 11M9 15l3 3 5-5',
 logout:'M9 3H4v18h5M10 12h11m-4-4 4 4-4 4',
 up:'m6 15 6-6 6 6',
 machine:'M5 21V3h14v18M5 6h14M9 6v5h6V6M8 17h8M12 11v6M3 21h6m6 0h6',
 run:'m14 6 3-2 2 2-2 2zM12 8l-4 3-4-1m8-2 3 5 5 1m-8-6-2 7-5 5m5-5 5 2v5',
 body:'M15 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0M5 9l7 2 7-2m-7 2v6m0 0-4 6m4-6 4 6',
 cable:'M5 3h14M7 3v4l5 3 5-3V3M12 10v7m-4 3 4-3 4 3',
 shield:'m12 2 8 3v7c0 6-8 10-8 10S4 18 4 12V5zm-4 10 3 3 5-6'
};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.dumbbell}"/></svg>`;
const equipmentIcon=e=>({'固定器械':'machine','绳索':'cable','自重':'body','有氧器械':'run'}[e]||'dumbbell');
const num=v=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:1}).format(v||0);
const time=v=>`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
const weekdays=['周日','周一','周二','周三','周四','周五','周六'];
let state,today,serverOffset=0,authEnabled=false,offline=false;
let route=location.hash.slice(1)||'today',draft=null,draftDay=0,planDirty=false;
let search='',muscle='全部',equipment='全部',pickerSearch='',pickerMuscle='全部';
let historyMonth='',selectedDate='',expanded=new Set(),restUntil=Number(store.get('restUntil'))||0;
let pending=0,queue=Promise.resolve(),modalData=null,lastFocus=null,toastTimeout,installEvent=null;
let lastReminder='';
const app=$('#app');
const exById=id=>state.library.find(e=>e.id===id)||{id,name:'已归档动作',en:'Archived exercise',muscle:'其他',equipment:'自重',unit:'reps'};
const currentInfo=()=>todayInfo(state,today);
const currentTime=()=>Date.now()+serverOffset;
const actButton=(action,label,cls='outline',extra='')=>`<button type="button" class="button ${cls}" data-action="${action}" ${extra}>${label}</button>`;
const thumb=ex=>`<div class="exercise-thumb ${ex.muscle==='胸部'?'chest':ex.muscle==='肩部'?'shoulder':ex.muscle==='手臂'?'arm':''}">${icon(equipmentIcon(ex.equipment))}</div>`;
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),3800);}
function accept(data){state=data.state;today=data.today;serverOffset=Date.parse(data.serverTime)-Date.now();authEnabled=data.authEnabled;offline=false;store.set('cache',JSON.stringify(data));}
function syncLabel(){const el=$('#sync-label');if(el)el.textContent=offline?'离线 · 只读':pending?'正在保存…':'已保存';}
async function load(initial=false){
 try {
  const res=await fetch('/api/state',{cache:'no-store'});if(res.status===401){store.remove('cache');showLogin();return;}
  if(!res.ok)throw new Error('暂时无法连接服务');
  const data=await res.json();const changed=!state||data.state.revision!==state.revision||offline||today!==data.today;
  accept(data);if(initial||changed)render();
 }catch(err){
  offline=true;
  if(!state){try{const cached=JSON.parse(store.get('cache'));if(cached){accept(cached);offline=true;render();return;}}catch{}
   app.innerHTML=`<div class="error-panel"><div class="brand-mark">f.</div><h1>暂时连接不上训练空间</h1><p>请确认本地服务已启动，或手机与电脑连接在同一网络。</p>${actButton('retry','重新连接','primary')}</div>`;
  }else if(initial)render();
  syncLabel();
 }
}
function action(type,payload={},options={}){
 pending++;syncLabel();
 const job=queue.then(async()=>{
  if(offline)throw new Error('当前离线，重新连接后即可保存训练');
  const res=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,payload,revision:state.revision})});
  const data=await res.json();
  if(res.status===401){showLogin();throw new Error('登录已过期，请重新输入密码');}
  if(res.status===409){accept(data);render();throw new Error(data.error);}
  if(!res.ok)throw new Error(data.error||'保存失败，请重试');
  accept(data);if(options.render!==false)render();return data;
 }).catch(err=>{toast(err.message||'网络中断，操作未保存，请重新连接后重试');throw err;}).finally(()=>{pending--;syncLabel();});
 queue=job.catch(()=>{});return job;
}
const nav=[['today','今日训练','home'],['plan','循环计划','repeat'],['library','动作库','dumbbell'],['history','训练记录','chart'],['settings','我的设置','settings']];
function navigate(next){if(route==='plan'&&planDirty&&next!=='plan'){confirmDialog('离开计划编辑？','你有尚未保存的计划调整。离开后，这些调整将丢失。','放弃修改',()=>{draft=null;planDirty=false;location.hash=next;});return;}location.hash=next;}
function render(){
 if(!state)return;
 if(!nav.some(x=>x[0]===route)&&route!=='workout')route='today';
 const activeRoute=route==='workout'?'today':route;
 const title=nav.find(x=>x[0]===activeRoute)?.[1]||'今日训练';
 app.innerHTML=`<aside class="sidebar"><a class="brand" href="#today" aria-label="练序首页"><div class="brand-mark">f.</div><div class="brand-name">练序<span>FITFLOW</span></div></a><div class="nav-caption">MY WORKSPACE</div><nav aria-label="主导航">${nav.map(([id,label,ic])=>`<a href="#${id}" class="nav-item ${activeRoute===id?'active':''}" ${activeRoute===id?'aria-current="page"':''}>${icon(ic)}<span>${label}</span>${activeRoute===id?'<i class="nav-dot"></i>':''}</a>`).join('')}</nav><div class="sidebar-bottom"><div class="sidebar-quote">${icon('leaf')}<p>不必每次都超越自己，<br>保持出现，就已经很好。</p><small>ONE DAY. ONE REP.</small></div><div class="profile"><div class="avatar">${esc(state.settings.name.slice(0,1))}</div><div class="grow"><div class="name">${esc(state.settings.name)}</div><div class="status">你的私人训练空间</div></div><button data-action="go-settings" aria-label="打开设置">${icon('settings','sm')}</button></div></div></aside><div class="app-main"><header class="topbar"><div class="mobile-brand"><div class="brand-mark">f.</div><div class="brand-name">练序</div><small>FITFLOW</small></div><div class="crumb">我的训练空间<span>/</span><strong>${title}</strong></div><div class="top-actions"><div class="sync-status"><i class="status-dot"></i><span id="sync-label">${offline?'离线 · 只读':'已保存'}</span></div><i class="divider-v"></i><button class="icon-button" data-action="reminders" aria-label="每日打卡提醒">${icon('bell')}</button><div class="avatar">${esc(state.settings.name.slice(0,1))}</div></div></header>${offline?'<div class="offline-banner">当前为离线浏览，记录暂不可修改。<button data-action="retry">重新连接 →</button></div>':''}<main class="main" id="main" tabindex="-1">${({today:renderToday,workout:renderWorkout,plan:renderPlan,library:renderLibrary,history:renderHistory,settings:renderSettings}[route])()}<div class="footer-note">FITFLOW · 每一次出现，都算数。</div></main></div><nav class="mobile-nav" aria-label="手机导航">${nav.map(([id,label,ic])=>`<a href="#${id}" class="${activeRoute===id?'active':''}" ${activeRoute===id?'aria-current="page"':''}>${icon(ic)}<span>${label==='我的设置'?'我的':label}</span></a>`).join('')}</nav>`;
 syncLabel();tick();
}
function intro(eyebrow,title,subtitle,extra=''){return `<div class="page-intro"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div>${extra||`<div class="date-chip">${icon('calendar','sm')}${Number(today.slice(5,7))} 月 ${Number(today.slice(8))} 日，${weekdays[weekday(today)]}</div>`}</div>`;}
const dumbbellArt=`<svg class="hero-art" viewBox="0 0 250 250" aria-hidden="true"><circle class="art-orbit" cx="125" cy="125" r="118"/><circle class="art-orbit" cx="125" cy="125" r="94"/><circle class="art-orbit" cx="125" cy="125" r="70"/><rect class="db-bar" x="55" y="114" width="143" height="24" rx="8"/><rect class="db-shadow" x="66" y="75" width="31" height="104" rx="9"/><rect class="db-back" x="51" y="72" width="33" height="104" rx="9"/><rect class="db-front" x="40" y="86" width="29" height="76" rx="7"/><rect class="db-shadow" x="185" y="75" width="30" height="104" rx="9"/><rect class="db-back" x="169" y="72" width="33" height="104" rx="9"/><rect class="db-front" x="155" y="86" width="29" height="76" rx="7"/><path class="art-star" d="m185 33 3 8 8 3-8 3-3 8-3-8-8-3 8-3zm-138 157 2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>`;
function weekStrip(){const start=weekStart(today),future=forecast(state,today,14);return `<div class="week-strip" aria-label="本周训练安排">${Array.from({length:7},(_,i)=>{const date=addDays(start,i),h=state.history.find(x=>x.date===date),f=future.find(x=>x.date===date);return `<button class="week-item ${date===today?'current':''} ${h?'complete':''}" data-action="schedule-day" data-date="${date}" aria-label="${date} ${h?'已打卡':f?.day?.name||'无训练记录'}"><span class="weekday">${['一','二','三','四','五','六','日'][i]}</span><strong class="number">${Number(date.slice(8))}</strong><span class="week-kind">${h?'已打卡':date<today?'未记录':f?.day?.kind==='rest'?'恢复日':f?.day?.tag?.split(' ')[0]||'待安排'}</span><i class="day-dot"></i></button>`;}).join('')}</div>`;}
function goalCard(){const stat=summary(state,today),percent=Math.min(1,stat.week/state.settings.weeklyGoal);return `<section class="card goal-card"><div class="card-heading"><div><h2>本周的小目标</h2><p>一点点积累，也很了不起</p></div>${icon('target','sm')}</div><div class="goal-ring"><svg viewBox="0 0 140 140" aria-hidden="true"><circle class="track" cx="70" cy="70" r="59"/><circle class="fill" cx="70" cy="70" r="59" stroke-dasharray="371" stroke-dashoffset="${371*(1-percent)}"/></svg><div class="goal-text"><strong class="number">${stat.week}<span> / ${state.settings.weeklyGoal}</span></strong><small>本周训练天数</small></div></div><p class="goal-foot">${stat.week>=state.settings.weeklyGoal?'本周目标已完成，做得很好。':`再完成 ${state.settings.weeklyGoal-stat.week} 次，达成本周目标`}</p><div class="goal-stats"><div><strong class="number">${stat.weekMinutes}</strong><small>训练分钟</small></div><div><strong class="number">${num(stat.weekVolume)}</strong><small>累计公斤</small></div></div></section>`;}
function cycleCard(){return `<section class="card"><div class="card-heading"><div><h2>我的训练循环</h2><p>${esc(state.plan.name)}</p></div><a href="#plan" class="text-button" aria-label="编辑循环计划">${icon('edit','sm')}</a></div><div class="cycle-list">${state.plan.days.slice(0,8).map((d,i)=>`<div class="cycle-step ${i===state.cursor?'active':''}"><span class="cycle-number number">${String(i+1).padStart(2,'0')}</span><div class="grow"><div class="cycle-title">${esc(d.name)}</div><div class="cycle-sub">${d.kind==='rest'?'RECOVERY':esc(d.tag)} · ${d.kind==='rest'?'好好休息':`${d.exercises.length} 个动作`}</div></div>${i===state.cursor?'<span class="badge green">当前</span>':''}</div>`).join('')}${state.plan.days.length>8?`<a href="#plan" class="text-button">查看全部 ${state.plan.days.length} 天 →</a>`:''}</div><div class="cycle-footer">${icon('repeat','sm')}完成一轮后，自动开始下一轮</div></section>`;}
function renderToday(){
 const info=currentInfo(),a=state.active,p=progress(a),carry=Math.max(0,daysBetween(a.originalDate,today)),d=info.day;
 const active=info.mode==='workout',done=info.mode==='complete';
 const sets=d.exercises.reduce((sum,e)=>sum+e.sets,0),estimate=Math.max(15,Math.round(d.exercises.reduce((sum,e)=>sum+e.sets*(40+e.rest),0)/60));
 const heroTitle=done?'今天的进步，已存档。':info.mode==='deferred'?'休息，也是计划的一部分。':info.mode==='rest'||info.mode==='fixedRest'?'让身体，慢慢充满电。':esc(d.name);
 const hero=`<section class="hero ${!active?'rest-hero':''}">${dumbbellArt}<div class="hero-content"><div class="hero-meta"><span class="badge dark">${done?'COMPLETED':info.mode==='fixedRest'?'RECOVERY':`DAY ${String(state.cursor+1).padStart(2,'0')}`}</span><span>${esc(d.tag)}</span>${done&&info.record.partial?'<span class="badge orange">部分完成</span>':active&&carry?`<span class="badge orange">顺延 ${carry} 天</span>`:''}</div><h2>${heroTitle}</h2><p class="hero-sub">${done?(info.record.partial?'已按部分完成记录，明天继续下一训练日。':'认真完成的每一组，都有回响。'):info.mode==='deferred'?`下次继续「${esc(a.day.name)}」，已记录的进度会保留。`:!active?'恢复日不计入每周训练目标。':'按自己的节奏，把每一组做扎实。'}</p><div class="hero-tags">${active?`<span>${icon('dumbbell','sm')}${d.exercises.length} 个动作</span><span>${icon('bars','sm')}${sets} 组训练</span><span>${icon('clock','sm')}约 ${estimate} 分钟</span>`:`<span>${icon(done?'check':'leaf','sm')}${done?`${esc(d.name)} · 已打卡`:'保持好状态，下一次再出发'}</span>`}</div><div class="hero-actions">${active?actButton('start-workout',`${icon('play','sm')}${a.started?'继续今日训练':'开始今日训练'} ${icon('arrow','sm')}`,'primary')+actButton('defer','今天休息','ghost'):done?actButton('record-detail','查看训练记录 '+icon('arrow','sm'),'primary',`data-id="${info.record.id}"`):info.mode==='rest'?actButton('finish-rest','完成恢复打卡 '+icon('check','sm'),'primary'):actButton('resume-today','今天还是想练 '+icon('arrow','sm'),'primary')}${done?'<a href="#plan" class="button ghost">查看循环</a>':''}</div>${active&&a.started?`<div class="hero-progress"><div class="progress-track"><span style="width:${p.percent}%"></span></div><span>${p.done} / ${p.total} 组已完成</span></div>`:''}</div></section>`;
 return `${intro('YOUR DAILY TRAINING','把今天，练成进步。','一个动作、一次打卡，都是向前。')}${weekStrip()}<div class="dashboard-grid"><div class="dashboard-main"><div><div class="checkin-bar"><span class="checkin-icon">${icon('check','sm')}</span><span>${done?'今天，你已经打卡了。':'今天，你打卡了吗？'}</span><span class="checkin-answer"><i></i>${done?'已完成':info.mode==='deferred'?'今天休息':'还没打卡'}</span></div>${hero}</div><section><div class="section-heading"><h2>${done?'今日训练回顾':info.mode==='deferred'?'下次继续练':'今日动作清单'}<small>${d.kind==='workout'?`${d.exercises.length} EXERCISES`:'RECOVERY DAY'}</small></h2><a href="#plan" class="text-button">调整计划 ${icon('chevron','sm')}</a></div>${d.kind==='workout'?`<div class="exercise-list">${d.exercises.map((e,i)=>{const ex=done?{...exById(e.exerciseId),...info.record.exerciseNames[e.exerciseId]}:exById(e.exerciseId),logs=done?info.record.logs:a.logs,completed=Array.from({length:e.sets},(_,j)=>logs[setKey(e.id,j)]?.done).filter(Boolean).length;return `<div class="exercise-row">${thumb(ex)}<div class="grow"><div class="exercise-name">${esc(ex.name)}</div><div class="exercise-english">${esc(ex.en||ex.equipment)}</div></div><div class="exercise-meta"><span><b class="number">${e.sets}</b> 组 × <b class="number">${e.reps}</b> ${unitLabel(ex.unit)}</span><span class="rest-meta">${e.rest}s 休息</span></div><button class="exercise-check ${completed===e.sets?'done':''}" data-action="${done?'record-detail':'exercise-start'}" data-id="${done?info.record.id:e.id}" aria-label="${done?'查看记录':'记录'+esc(ex.name)}">${icon(completed===e.sets?'check':'chevron','sm')}</button></div>`;}).join('')}</div>`:`<div class="card empty">${icon('leaf')}<h3>今天，给身体留一点空间。</h3><p>按自己的状态休息、走动或放松。下一次训练依然在等你。</p></div>`}<div class="hint-strip">${icon('repeat','sm')}未完成、未打卡的训练会自动顺延，训练顺序不会被打乱。</div></section></div><aside class="dashboard-aside">${goalCard()}${cycleCard()}<div class="card quote-card"><div class="eyebrow">A LITTLE REMINDER</div><h3>不追赶日历，<br>只跟随自己的节奏。</h3><p>计划可以顺延，进步不会清零。</p><span class="quote-decoration">↗</span></div></aside></div>`;
}
function lastSet(exerciseId){for(const h of [...state.history].reverse()){const log=Object.values(h.logs).filter(x=>x.exerciseId===exerciseId&&x.done);if(log.length)return log[0];}return null;}
function renderWorkout(){
 const info=currentInfo();if(info.mode!=='workout')return renderToday();
 const a=state.active,p=progress(a);
 return `${intro('FOCUS ON YOUR NEXT REP',esc(a.day.name),'重量和次数按实际完成情况记录，完成一组勾选一组。','<a class="button outline" href="#today">'+icon('left','sm')+' 返回今日</a>')}<div class="dashboard-grid"><div class="dashboard-main"><div><div class="workout-top"><div><span class="clock-display number" id="workout-clock">${time(elapsed(a,currentTime()))}</span><small>${a.runningSince?'训练计时中':'计时已暂停'} · <span id="set-progress">${p.done} / ${p.total}</span> 组</small></div>${actButton(a.runningSince?'pause-workout':'resume-workout',icon(a.runningSince?'pause':'play','sm')+(a.runningSince?'暂停计时':'继续计时'),'outline compact')}</div>${a.day.exercises.map((e,i)=>{
  const ex=exById(e.exerciseId),prev=lastSet(ex.id),done=Array.from({length:e.sets},(_,j)=>a.logs[setKey(e.id,j)]?.done).filter(Boolean).length;
  return `<details class="workout-accordion" data-entry="${e.id}" ${expanded.has(e.id)||(!expanded.size&&i===0)?'open':''}><summary>${thumb(ex)}<div class="grow"><div class="exercise-name">${esc(ex.name)}</div><div class="exercise-english">${e.sets} 组 × ${e.reps} ${unitLabel(ex.unit)} · 组间 ${e.rest} 秒</div></div><span class="badge ${done===e.sets?'green':'gray'}">${done} / ${e.sets}</span>${icon('down','sm chevron')}</summary><div class="sets-table"><div class="set-head"><span>组</span><span>重量 / kg</span><span>${ex.unit==='reps'?'次数':`时长 / ${unitLabel(ex.unit)}`}</span><span>完成</span></div>${Array.from({length:e.sets},(_,index)=>{
   const l=a.logs[setKey(e.id,index)]||{weight:prev?.weight??e.weight,reps:e.reps,done:false};
   return `<div class="set-row ${l.done?'is-done':''}" data-entry="${e.id}" data-index="${index}"><span class="set-number number">${String(index+1).padStart(2,'0')}</span><input type="number" inputmode="decimal" min="0" max="2000" step="0.5" value="${l.weight}" name="weight" aria-label="${esc(ex.name)}第${index+1}组重量公斤" ${ex.unit!=='reps'?'disabled':''}><input type="number" inputmode="numeric" min="1" max="3600" step="1" value="${l.reps}" name="reps" aria-label="${esc(ex.name)}第${index+1}组${unitLabel(ex.unit)}"><button type="button" class="set-toggle ${l.done?'done':''}" data-action="toggle-set" aria-pressed="${l.done}" aria-label="${l.done?'取消完成':'完成'}${esc(ex.name)}第${index+1}组">${icon('check')}</button></div>`;
  }).join('')}<p class="last-record">${prev?`上次记录：${num(prev.weight)} kg × ${prev.reps} ${unitLabel(ex.unit)}`:'第一次记录，从适合自己的重量开始；自重动作可填 0 kg。'}${e.note?`<br>备注：${esc(e.note)}`:''}</p></div></details>`;
 }).join('')}<div class="finish-panel"><label for="workout-note">给今天留一句话</label><textarea id="workout-note" maxlength="1000" placeholder="状态如何？有什么想留给下次训练的提醒？">${esc(a.note)}</textarea><div class="session-footer">${actButton('defer','先保存，下次继续','outline')}${actButton('finish-workout',icon('check','sm')+'完成训练并打卡','primary')}</div></div></div></div><aside class="dashboard-aside">${goalCard()}<div class="card"><div class="card-heading"><h2>组间休息</h2>${icon('clock','sm')}</div><p class="small muted">勾选完成后自动计时，也可以随时手动开始。</p><div class="row" style="margin-top:18px">${[60,90,120].map(t=>actButton('rest-start',`${t}s`,'outline compact',`data-seconds="${t}"`)).join('')}</div></div></aside></div>`;
}
function renderPlan(){
 if(!draft)draft=clone(state.plan);if(draftDay>=draft.days.length)draftDay=0;
 const day=draft.days[draftDay];
 return `${intro('BUILD YOUR OWN RHYTHM','你的节奏，你来定义。','选择分化方式，再把每一天调整成适合自己的训练。',actButton('plan-help',icon('info','sm')+'循环规则','outline'))}<div class="plan-summary"><div class="plan-icon">${icon('repeat','lg')}</div><div><h2>${esc(state.plan.name)}</h2><p>${state.plan.days.filter(d=>d.kind==='workout').length} 个训练日 · ${state.plan.days.filter(d=>d.kind==='rest').length} 个恢复日 · 当前第 ${state.cycle} 轮</p></div><span class="badge dark">完成后自动循环</span></div><div class="section-heading"><h2>从一个训练模板开始</h2><span class="muted small">支持继续自定义</span></div><div class="presets">${PRESETS.map(p=>`<button class="preset ${draft.split===p.split?'active':''}" data-action="preset" data-split="${p.split}"><span class="preset-number number">0${p.split}</span><h3>${p.title}</h3><p>${p.subtitle}</p></button>`).join('')}</div><div class="section-heading"><h2>编辑我的循环${planDirty?' <span class="badge orange">未保存</span>':''}</h2>${actButton('add-day',icon('plus','sm')+'添加一天','outline compact')}</div><div class="form-row"><div class="field"><label for="plan-name">计划名称</label><input id="plan-name" maxlength="60" value="${esc(draft.name)}"></div></div><div class="plan-layout"><div class="plan-days" aria-label="循环训练日">${draft.days.map((d,i)=>`<button class="plan-day-button ${i===draftDay?'active':''}" data-action="select-plan-day" data-index="${i}"><span class="day-no number">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(d.name)}</strong><small>${d.kind==='rest'?'休息恢复':`${d.exercises.length} 个动作`}</small></span></button>`).join('')}</div><section class="plan-editor"><div class="form-row"><div class="field"><label for="day-name">当天名称</label><input id="day-name" maxlength="40" value="${esc(day.name)}"></div><div class="field"><label for="day-kind">当天类型</label><select id="day-kind"><option value="workout" ${day.kind==='workout'?'selected':''}>训练日</option><option value="rest" ${day.kind==='rest'?'selected':''}>恢复日</option></select></div></div><div class="row between"><span class="small muted">DAY ${String(draftDay+1).padStart(2,'0')} · ${esc(day.tag)}</span><div class="row">${actButton('move-day-up',icon('left','sm'),'ghost compact',draftDay===0?'disabled aria-label="前移一天"':'aria-label="前移一天"')}${actButton('move-day-down',icon('chevron','sm'),'ghost compact',draftDay===draft.days.length-1?'disabled aria-label="后移一天"':'aria-label="后移一天"')}${actButton('remove-day',icon('trash','sm'),'ghost compact','aria-label="删除这一天"')}</div></div>${day.kind==='rest'?`<div class="empty">${icon('leaf')}<h3>留出恢复的空间</h3><p>恢复日打卡后，下一天进入循环中的下一个训练日。</p></div>`:day.exercises.map((e,i)=>{const ex=exById(e.exerciseId);return `<div class="plan-exercise" data-entry="${e.id}"><div class="plan-exercise-title"><span class="small muted number">${String(i+1).padStart(2,'0')}</span><h4 class="grow">${esc(ex.name)}</h4><button class="mini-button" data-action="move-exercise-up" data-index="${i}" ${i===0?'disabled':''} aria-label="上移动作">${icon('up','sm')}</button><button class="mini-button" data-action="move-exercise-down" data-index="${i}" ${i===day.exercises.length-1?'disabled':''} aria-label="下移动作">${icon('down','sm')}</button><button class="mini-button" data-action="remove-plan-exercise" data-index="${i}" aria-label="移除${esc(ex.name)}">${icon('close','sm')}</button></div><div class="exercise-fields">${[['sets','组数',1,20,1],['reps',unitLabel(ex.unit),1,3600,1],['weight','重量 kg',0,2000,.5],['rest','休息 / 秒',0,900,5]].map(([k,label,min,max,step])=>`<div class="field"><label for="pe-${e.id}-${k}">${label}</label><input id="pe-${e.id}-${k}" type="number" inputmode="${k==='weight'?'decimal':'numeric'}" min="${min}" max="${max}" step="${step}" data-plan-field="${k}" data-index="${i}" value="${e[k]}"></div>`).join('')}</div><input style="width:100%;margin-top:10px;font-size:11px" maxlength="300" data-plan-field="note" data-index="${i}" value="${esc(e.note)}" placeholder="动作备注（可选）" aria-label="${esc(ex.name)}备注"></div>`;}).join('')}${day.kind==='workout'?actButton('add-plan-exercise',icon('plus','sm')+'从动作库添加','outline wide','style="margin-top:17px"'):''}</section></div><div class="plan-save-bar"><p>保存后从第 1 天开始新的循环；历史记录会保留。当前未完成的训练将替换为新计划，今天已打卡则明天开始。</p>${actButton('save-plan',icon('check','sm')+'保存并启用计划','primary')}</div>`;
}
function libraryCards(){
 const list=state.library.filter(e=>(muscle==='全部'||(muscle==='自定义'?e.custom:e.muscle===muscle))&&(equipment==='全部'||e.equipment===equipment)&&`${e.name} ${e.en} ${e.equipment}`.toLowerCase().includes(search.toLowerCase()));
 return `<div class="section-heading"><span class="small muted">${list.length} 个动作 · ${state.library.length} 个动作已收录</span></div><div class="library-grid">${list.length?list.map(e=>`<article class="library-card"><div class="library-art"><span class="badge">${esc(e.muscle)}</span>${icon(equipmentIcon(e.equipment))}</div><div class="library-card-body"><h3>${esc(e.name)}</h3><div class="en">${esc(e.en||'CUSTOM EXERCISE')}</div><div class="library-card-foot"><span>${esc(e.equipment)}${e.custom?' · 自定义':''}</span><button data-action="exercise-detail" data-id="${e.id}" aria-label="查看${esc(e.name)}">${icon('arrow','sm')}</button></div></div></article>`).join(''):`<div class="empty" style="grid-column:1/-1">${icon('search')}<h3>还没有找到这个动作</h3><p>试试其他名称，或创建一个自己的动作。</p>${actButton('new-exercise','创建自定义动作','primary')}</div>`}</div>`;
}
function renderLibrary(){return `${intro('YOUR MOVEMENT COLLECTION','好训练，从熟悉动作开始。','健身房常用动作都在这里，也可以加入你自己的项目。',actButton('new-exercise',icon('plus','sm')+'自定义动作','primary'))}<div class="library-toolbar"><label class="search-bar">${icon('search','sm')}<input id="library-search" type="search" value="${esc(search)}" placeholder="搜索动作、器械…" aria-label="搜索动作"></label><select id="equipment-filter" aria-label="器械筛选">${['全部',...EQUIPMENT].map(x=>`<option value="${x}" ${equipment===x?'selected':''}>${x==='全部'?'全部器械':x}</option>`).join('')}</select></div><div class="tabs library-filters">${['全部',...MUSCLES,'自定义'].map(m=>`<button class="pill ${muscle===m?'active':''}" data-action="filter-muscle" data-muscle="${m}">${m}</button>`).join('')}</div><div id="library-results">${libraryCards()}</div>`;}
function calendar(){const first=historyMonth+'-01',offset=(weekday(first)+6)%7,days=Number(addDays(historyMonth==='9999-12'?'9999-12-31':new Date(Date.UTC(Number(historyMonth.slice(0,4)),Number(historyMonth.slice(5,7)),1)).toISOString().slice(0,10),-1).slice(8));return `<div class="card"><div class="card-heading"><h2>${Number(historyMonth.slice(0,4))} 年 ${Number(historyMonth.slice(5,7))} 月</h2><div class="row"><button class="mini-button" data-action="month-prev" aria-label="上个月">${icon('left','sm')}</button><button class="mini-button" data-action="month-next" aria-label="下个月">${icon('chevron','sm')}</button></div></div><div class="calendar-weekdays">${['一','二','三','四','五','六','日'].map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-grid">${Array.from({length:offset},()=>'<div class="calendar-cell blank"></div>').join('')}${Array.from({length:days},(_,i)=>{const date=historyMonth+'-'+String(i+1).padStart(2,'0'),h=state.history.find(x=>x.date===date);return `<button class="calendar-cell ${h?.kind==='workout'?'trained':''} ${date===today?'today':''} ${date===selectedDate?'selected':''}" data-action="history-date" data-date="${date}" aria-label="${date}${h?' 已打卡':' 无记录'}">${i+1}${h?'<i class="mark"></i>':'<span style="height:4px"></span>'}</button>`;}).join('')}</div><div class="calendar-legend"><span><i></i>完成训练</span><span><i class="rest"></i>恢复打卡</span><span>点击日期查看记录</span></div></div>`;}
function historyRecords(){const records=[...state.history].reverse().filter(h=>selectedDate?h.date===selectedDate:h.date.startsWith(historyMonth));return `<section class="card"><div class="card-heading"><h2>${selectedDate?`${Number(selectedDate.slice(5,7))} 月 ${Number(selectedDate.slice(8))} 日`:'本月训练记录'}</h2>${selectedDate?'<button class="text-button" data-action="all-month">查看整月</button>':`<span class="small muted">${records.length} 条</span>`}</div>${records.length?records.map(h=>`<button class="history-record" data-action="record-detail" data-id="${h.id}"><span class="history-date number">${h.date.slice(5).replace('-',' / ')}</span><div class="exercise-thumb">${icon(h.kind==='rest'?'leaf':'dumbbell')}</div><div class="grow"><h3>${esc(h.day.name)} ${h.partial?'<span class="badge orange">部分完成</span>':''}</h3><p>${h.kind==='rest'?'恢复日已打卡':`${Object.values(h.logs).filter(x=>x.done).length} 组 · ${num(h.volume)} kg · ${Math.round(h.duration/60)} 分钟`}</p></div>${icon('chevron','sm')}</button>`).join(''):`<div class="empty">${icon('calendar')}<h3>这一页，等你来写。</h3><p>${selectedDate?'当天还没有训练记录。':'完成第一次打卡后，这里会留下你的训练足迹。'}</p><a href="#today" class="text-button">回到今日训练 ${icon('arrow','sm')}</a></div>`}</section>`;}
function renderHistory(){
 if(!historyMonth)historyMonth=today.slice(0,7);const stat=summary(state,today),body=[...state.body].sort((a,b)=>a.date.localeCompare(b.date)),last=body.at(-1),values=body.slice(-12).map(x=>x.weight),min=Math.min(...values)-1,max=Math.max(...values)+1;
 return `${intro('EVERY REP COUNTS','看得见的坚持。','把进步交给时间，把每一次训练留在这里。',actButton('export-data',icon('download','sm')+'导出备份','outline'))}<div class="stats-row">${[['dumbbell','累计训练',stat.count,'次','从第一次打卡开始'],['calendar','本月训练',stat.month,'次','认真对待每一个今天'],['weight','累计训练量',num(stat.volume),'kg','完成组的重量 × 次数'],['clock','累计训练时长',stat.minutes,'分钟','每次付出，都有记录']].map(([ic,label,value,unit,note])=>`<div class="stat-card"><div class="stat-label">${icon(ic,'sm')}${label}</div><strong class="number">${value}<small>${unit}</small></strong><p>${note}</p></div>`).join('')}</div><div class="history-layout"><div class="stack">${calendar()}<div id="history-records">${historyRecords()}</div></div><div class="stack"><section class="card"><div class="card-heading"><div><h2>最近 90 天</h2><p>记录每次认真出现的你</p></div>${icon('flame','sm')}</div><div class="heatmap" aria-label="90 天训练热力图">${Array.from({length:91},(_,i)=>{if(i===0)return '<div class="heat-cell" style="visibility:hidden"></div>';const date=addDays(today,i-90),h=state.history.find(x=>x.date===date&&x.kind==='workout');return `<div class="heat-cell ${h?'active':''} ${date===today?'today':''}" title="${date} ${h?'已训练':'未训练'}"></div>`;}).join('')}</div><div class="heat-caption"><span>${addDays(today,-89).slice(5).replace('-','.')}</span><span>今天</span></div></section><section class="card"><div class="card-heading"><div><h2>体重记录</h2><p>关注趋势，尊重变化</p></div>${icon('weight','sm')}</div><div class="body-weight"><strong class="number">${last?num(last.weight):'—'}</strong><span>kg</span></div>${values.length>1?`<svg class="weight-chart" viewBox="0 0 250 90" role="img" aria-label="最近${values.length}次体重记录趋势"><polyline points="${values.map((v,i)=>`${10+i*230/(values.length-1)},${75-(v-min)/(max-min)*60}`).join(' ')}"/></svg>`:''}<p class="small muted" style="margin-bottom:17px">${last?`最近记录：${last.date} · ${body.length} 次记录`:'每一次变化，都值得被记录。'}</p>${actButton('record-weight',icon('plus','sm')+'记录今天体重','outline wide')}</section></div></div>`;
}
function renderSettings(){const s=state.settings;return `${intro('MAKE IT YOURS','让训练，更像你的日常。','安排训练与休息，让每一次打开都有方向。')}<div class="settings-layout"><form id="settings-form" class="stack"><section class="card"><div class="card-heading"><h2>个人与计划</h2>${icon('settings','sm')}</div><div class="form-row"><div class="field"><label for="settings-name">怎么称呼你</label><input id="settings-name" name="name" required maxlength="24" value="${esc(s.name)}"></div><div class="field"><label for="weekly-goal">每周训练目标</label><select id="weekly-goal" name="weeklyGoal">${Array.from({length:7},(_,i)=>`<option value="${i+1}" ${s.weeklyGoal===i+1?'selected':''}>${i+1} 天 / 周</option>`).join('')}</select></div></div><div class="field"><label for="timezone">计划使用的时区</label><select id="timezone" name="timezone">${['Asia/Shanghai','Asia/Hong_Kong','Asia/Tokyo','Asia/Singapore','Australia/Sydney','Europe/London','Europe/Berlin','America/New_York','America/Los_Angeles','UTC'].map(z=>`<option value="${z}" ${s.timezone===z?'selected':''}>${z==='Asia/Shanghai'?'中国标准时间 (UTC+8)':z}</option>`).join('')}${!['Asia/Shanghai','Asia/Hong_Kong','Asia/Tokyo','Asia/Singapore','Australia/Sydney','Europe/London','Europe/Berlin','America/New_York','America/Los_Angeles','UTC'].includes(s.timezone)?`<option selected>${esc(s.timezone)}</option>`:''}</select></div><div class="setting-line"><div><h3>每周固定休息日</h3><p>选中的日子暂停训练排程，保留当前训练，不消耗循环中的一天。</p><div class="day-selector">${[1,2,3,4,5,6,0].map(d=>`<label><input type="checkbox" name="restDay" value="${d}" ${s.restDays.includes(d)?'checked':''}><span>${weekdays[d].slice(1)}</span></label>`).join('')}</div></div></div><div class="setting-line"><div><h3>自动顺延</h3><p>没有完成打卡，当前训练会继续到下个可训练日。已记录的组不会丢失。</p></div><span class="badge green">始终开启</span></div></section><section class="card"><div class="card-heading"><h2>提醒与计时</h2>${icon('bell','sm')}</div><div class="setting-line"><div><h3>每日打卡提醒</h3><p>在打开网站时提醒「今天，你打卡了吗？」。</p></div><input class="switch" type="checkbox" role="switch" name="reminderEnabled" aria-label="开启每日打卡提醒" ${s.reminderEnabled?'checked':''}></div><div class="form-row" style="margin-top:17px"><div class="field"><label for="reminder-time">提醒时间</label><input id="reminder-time" type="time" name="reminderTime" value="${s.reminderTime}" required></div><div class="field"><label for="default-rest">默认组间休息 / 秒</label><input id="default-rest" type="number" inputmode="numeric" min="0" max="900" name="defaultRest" value="${s.defaultRest}" required></div></div><div class="setting-line"><div><h3>自动开始组间计时</h3><p>完成一组后，用该动作设置的休息时长开始倒计时。</p></div><input class="switch" type="checkbox" role="switch" name="autoRestTimer" aria-label="自动开始组间计时" ${s.autoRestTimer?'checked':''}></div><p class="setting-note">提醒仅在网站打开时触发。手机锁屏、关闭网页后的后台推送，需要部署 HTTPS 并另外接入推送服务。</p></section><button class="button primary wide" type="submit">${icon('check','sm')}保存设置</button></form><div class="stack"><section class="card"><div class="card-heading"><h2>数据与备份</h2>${icon('cloud','sm')}</div><div class="info-box">训练计划、动作、打卡与体重记录保存在此服务端。手机和电脑打开同一地址，即可使用同一份数据。</div><div class="backup-actions">${actButton('export-data',icon('download','sm')+'导出备份','outline')}${actButton('import-data',icon('upload','sm')+'导入备份','outline')}</div><input type="file" id="backup-file" accept="application/json,.json" hidden><p class="setting-note">导入将替换当前数据。建议先导出一份备份；历史中的训练内容不会随动作库编辑而改变。</p></section><section class="card"><div class="card-heading"><h2>随时打开，随时记录</h2>${icon('home','sm')}</div><p class="small muted">将练序添加到手机主屏幕，下次训练时直接点开。</p><div class="info-box" style="margin-top:17px">iPhone：在 Safari 打开 → 分享 → 添加到主屏幕。<br>Android：浏览器菜单 → 安装应用 / 添加到主屏幕。</div>${actButton('install-app',icon('plus','sm')+'添加到主屏幕','outline wide','style="margin-top:17px"')}<p class="setting-note">完整应用安装与离线页面需 HTTPS 或本机 localhost。手机通过局域网 HTTP 地址可正常在线使用全部训练功能。</p></section><section class="card"><div class="card-heading"><h2>关于练序</h2><span class="badge green">v1.0</span></div><p class="small muted">一个人，一套计划。让训练按自己的节奏持续下去。</p><div class="setting-line"><div><h3>访问保护</h3><p>${authEnabled?'已启用私人访问密码。':'当前是本地个人模式。云端部署时需配置私人访问密码。'}</p></div>${icon('shield','sm')}</div>${authEnabled?actButton('logout',icon('logout','sm')+'退出登录','outline wide','style="margin-top:12px"'):''}</section></div></div>`;}

function showModal(title,content,kind='info',data={},wide=false){
 if(!modalData)lastFocus=document.activeElement;
 modalData={kind,...data};
 $('#modal-root').innerHTML=`<div class="modal-overlay"><section class="modal ${wide?'wide-modal':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><h2 id="modal-title">${esc(title)}</h2><button type="button" class="icon-button" data-action="close-modal" aria-label="关闭弹窗">${icon('close','sm')}</button></div>${content}<div class="modal-error" role="alert" id="modal-error"></div></section></div>`;
 app.inert=true;document.body.style.overflow='hidden';
 requestAnimationFrame(()=>{$('#modal-root input:not([type=hidden]), #modal-root select, #modal-root button')?.focus({preventScroll:true});});
}
function closeModal(){modalData=null;$('#modal-root').innerHTML='';app.inert=false;document.body.style.overflow='';lastFocus?.isConnected&&lastFocus.focus({preventScroll:true});}
function confirmDialog(title,message,label,callback){showModal(title,`<p class="modal-intro">${esc(message)}</p><div class="modal-actions">${actButton('close-modal','取消','outline')}${actButton('confirm',label,'primary')}</div>`,'confirm',{callback});}
function showLogin(){state=null;closeModal();$('#rest-timer').innerHTML='';app.innerHTML=`<main class="card login-card"><div class="brand"><div class="brand-mark">f.</div><div class="brand-name">练序<span>FITFLOW</span></div></div><h1>欢迎回到训练空间。</h1><p>输入私人访问密码，继续你的计划。</p><form id="login-form"><label class="sr-only" for="login-password">访问密码</label><input type="password" id="login-password" name="password" required autocomplete="current-password" placeholder="访问密码"><button type="submit" class="button primary wide">进入我的训练空间 ${icon('arrow','sm')}</button><div class="modal-error" id="login-error" role="alert"></div></form></main>`;}
function showPlanHelp(){showModal('计划如何循环？',`<div class="help-list"><div><h3>01 / 完成后再往前走</h3><p>训练按计划中的顺序循环。完成训练并打卡后，下一天进入下一个训练日；最后一天完成后回到第 1 天。</p></div><div><h3>02 / 没打卡，就顺延</h3><p>即使一段时间没打开网页，未完成的训练也不会跳过。已记录的组数、次数和重量会保留。</p></div><div><h3>03 / 两种休息安排</h3><p>循环中的恢复日需要完成恢复打卡；每周固定休息日会暂停排程，不消耗训练循环，也无需打卡。选择「今天休息」同样保留当前训练。</p></div><div><h3>04 / 日历是预期安排</h3><p>未来的日程假设你按时完成打卡。发生顺延后，后续日期会一起调整；恢复打卡不计入每周训练目标。</p></div></div><div class="modal-actions">${actButton('close-modal','知道了','primary')}</div>`);}
function showRecord(id){
 const h=state.history.find(x=>x.id===id);if(!h)return;
 showModal(h.day.name,`<p class="modal-intro">${h.date} · 第 ${h.cycle} 轮${h.partial?' · 部分完成':''}</p><div class="complete-metrics"><div><strong class="number">${Object.values(h.logs).filter(x=>x.done).length}</strong><small>完成组数</small></div><div><strong class="number">${num(h.volume)}</strong><small>训练量 / kg</small></div><div><strong class="number">${Math.round(h.duration/60)}</strong><small>训练分钟</small></div></div>${h.day.exercises.map(e=>{const ex=h.exerciseNames[e.exerciseId]||exById(e.exerciseId),logs=Object.values(h.logs).filter(x=>x.entryId===e.id&&x.done);return `<div style="margin-top:18px"><h3 style="font-size:12px">${esc(ex.name)}</h3>${logs.length?logs.map(l=>`<div class="detail-set"><span>第 ${l.index+1} 组</span><strong class="grow">${num(l.weight)} kg × ${l.reps} ${unitLabel(ex.unit)}</strong>${icon('check','sm')}</div>`).join(''):'<p class="small muted" style="margin-top:8px">本次未完成</p>'}</div>`;}).join('')}${h.note?`<div class="info-box">${esc(h.note)}</div>`:''}<div class="modal-actions">${h.date===today&&h.planId===state.plan.id?actButton('undo-finish','撤销今日打卡','outline'):''}${actButton('close-modal','完成','primary')}</div>`,'record');
}
function showExerciseForm(ex=null){
 showModal(ex?'编辑自定义动作':'创建自己的动作',`<p class="modal-intro">把健身房里的常用项目，加入你的个人动作库。</p><form id="exercise-form"><div class="form-row"><div class="field"><label for="ex-name">动作名称</label><input id="ex-name" name="name" required maxlength="60" value="${esc(ex?.name||'')}" placeholder="例如：史密斯上斜卧推"></div></div><div class="form-row"><div class="field"><label for="ex-en">英文名称（可选）</label><input id="ex-en" name="en" maxlength="80" value="${esc(ex?.en||'')}" placeholder="English name"></div></div><div class="form-row"><div class="field"><label for="ex-muscle">训练部位</label><select id="ex-muscle" name="muscle">${MUSCLES.map(m=>`<option ${ex?.muscle===m?'selected':''}>${m}</option>`).join('')}</select></div><div class="field"><label for="ex-equipment">使用器械</label><select id="ex-equipment" name="equipment">${EQUIPMENT.map(e=>`<option ${ex?.equipment===e?'selected':''}>${e}</option>`).join('')}</select></div><div class="field"><label for="ex-unit">记录单位</label><select id="ex-unit" name="unit">${[['reps','次数'],['seconds','秒'],['minutes','分钟']].map(([v,t])=>`<option value="${v}" ${ex?.unit===v?'selected':''}>${t}</option>`).join('')}</select></div></div><div class="field"><label for="ex-note">你的动作笔记（可选）</label><textarea id="ex-note" name="note" maxlength="500" placeholder="器械位置、座椅档位，或想提醒自己的细节…">${esc(ex?.note||'')}</textarea></div><div class="modal-actions">${actButton('close-modal','取消','outline')}<button type="submit" class="button primary">保存动作</button></div></form>`,'exerciseForm',{id:ex?.id});
}
function showExercise(id){const e=exById(id);showModal(e.name,`<div class="library-art" style="border-radius:15px;height:125px;margin-bottom:20px">${icon(equipmentIcon(e.equipment))}</div><p class="modal-intro">${esc(e.en||'CUSTOM EXERCISE')}</p><div class="row"><span class="badge green">${esc(e.muscle)}</span><span class="badge gray">${esc(e.equipment)}</span><span class="badge gray">按${unitLabel(e.unit)}记录</span></div>${e.note?`<div class="info-box">${esc(e.note)}</div>`:''}<div class="modal-actions">${e.custom?actButton('delete-exercise','删除','danger',`data-id="${e.id}"`)+actButton('edit-exercise','编辑','outline',`data-id="${e.id}"`):''}${actButton('add-library-exercise','加入计划 '+icon('plus','sm'),'primary',`data-id="${e.id}"`)}</div>`,'exerciseDetail');}
function pickerResults(){const list=state.library.filter(e=>(pickerMuscle==='全部'||e.muscle===pickerMuscle)&&`${e.name} ${e.en}`.toLowerCase().includes(pickerSearch.toLowerCase()));return list.length?list.map(e=>`<button class="picker-item" data-action="pick-exercise" data-id="${e.id}">${thumb(e)}<div class="grow"><h4>${esc(e.name)}</h4><small>${e.muscle} · ${e.equipment} · ${unitLabel(e.unit)}</small></div>${icon('plus','sm')}</button>`).join(''):'<div class="empty"><p>没有找到相符的动作。可以先到动作库创建。</p></div>';}
function showPicker(){pickerSearch='';pickerMuscle='全部';showModal('添加训练动作',`<label class="search-bar">${icon('search','sm')}<input id="picker-search" type="search" placeholder="搜索动作名称" aria-label="搜索添加动作"></label><div class="tabs" style="margin-top:14px">${['全部',...MUSCLES].map(m=>`<button class="pill ${m===pickerMuscle?'active':''}" data-action="picker-muscle" data-muscle="${m}">${m}</button>`).join('')}</div><div id="picker-results" class="picker-list">${pickerResults()}</div>`,'picker');}
function showAddToDay(id){if(!draft)draft=clone(state.plan);showModal('加入哪一天？',`<p class="modal-intro">${esc(exById(id).name)} · 加入后可调整组数、次数和重量，保存计划后生效。</p><div class="picker-list">${draft.days.map((d,i)=>d.kind==='workout'?`<button class="picker-item" data-action="add-to-day" data-id="${id}" data-index="${i}"><span class="number small muted">${String(i+1).padStart(2,'0')}</span><strong class="grow">${esc(d.name)}</strong>${icon('plus','sm')}</button>`:'').join('')}</div>`,'addToDay');}
function addExerciseToDraft(id,index){const ex=exById(id),e=prescription(id,3,10,state.settings.defaultRest);e.reps=ex.unit==='minutes'?15:ex.unit==='seconds'?45:10;draft.days[index].exercises.push(e);draftDay=index;planDirty=true;}
function weightModal(){const current=state.body.find(x=>x.date===today);showModal('记录今天体重',`<p class="modal-intro">${today} · 同一天重复保存会更新当天记录。</p><form id="weight-form"><div class="field"><label for="body-weight-input">体重 / kg</label><input id="body-weight-input" name="weight" type="number" min="20" max="500" step="0.1" inputmode="decimal" required value="${current?.weight||''}" placeholder="例如 70.5"></div><div class="field" style="margin-top:16px"><label for="body-note">备注（可选）</label><input id="body-note" name="note" maxlength="200" value="${esc(current?.note||'')}" placeholder="例如：晨起空腹"></div><div class="modal-actions">${actButton('close-modal','取消','outline')}<button class="button primary" type="submit">保存记录</button></div></form>`,'weight');}
function reminderModal(){showModal('今天，你打卡了吗？',`<div class="complete-box" style="padding:10px 5px"><div class="complete-icon">${icon(currentInfo().mode==='complete'?'check':'dumbbell')}</div><h2>${currentInfo().mode==='complete'?'今天已经完成，做得很好。':'给自己留一点训练时间。'}</h2><p>${currentInfo().mode==='complete'?'明天打开练序，继续下一次训练。':`当前计划：${esc(state.active.day.name)}。未打卡会自动顺延。`}</p></div><div class="info-box">当前每日提醒时间：${state.settings.reminderTime}。网页打开时才会提醒；浏览器通知需本机 localhost 或 HTTPS 并授予权限。</div><div class="modal-actions">${actButton('enable-notifications','启用浏览器提醒','outline')}${actButton('close-modal','知道了','primary')}</div>`);}
function startRest(seconds){restUntil=Date.now()+seconds*1000;store.set('restUntil',String(restUntil));renderTimer();}
function stopRest(){restUntil=0;store.remove('restUntil');$('#rest-timer').innerHTML='';}
function renderTimer(){
 if(!restUntil||!state){$('#rest-timer').innerHTML='';return;}
 const seconds=Math.max(0,Math.ceil((restUntil-Date.now())/1000));
 if(!seconds){stopRest();toast('休息结束，准备好再开始下一组。');if(navigator.vibrate)navigator.vibrate([120,80,120]);return;}
 const value=$('#rest-timer .rest-time');if(value){value.textContent=time(seconds);return;}
 $('#rest-timer').innerHTML=`${icon('clock')}<div class="rest-text"><div class="rest-label">组间休息</div><strong class="rest-time number">${time(seconds)}</strong></div><button class="timer-control" data-action="rest-add">+30 秒</button><button class="timer-control" data-action="rest-stop">跳过</button><button class="timer-close" data-action="rest-stop" aria-label="关闭休息计时">${icon('close','sm')}</button>`;
}
function tick(){
 if(!state)return;
 const el=$('#workout-clock');if(el)el.textContent=time(elapsed(state.active,currentTime()));
 renderTimer();
 if(state.settings.reminderEnabled&&!document.hidden&&currentInfo().mode==='workout'&&!modalData){
  const nowText=new Intl.DateTimeFormat('en-GB',{timeZone:state.settings.timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(currentTime()));
  if(nowText>=state.settings.reminderTime&&lastReminder!==today&&store.get('reminded')!==today){lastReminder=today;store.set('reminded',today);toast('今天，你打卡了吗？你的训练计划还在等你。');if('Notification'in window&&Notification.permission==='granted'&&store.get('notifications')==='yes'){try{new Notification('练序 · 今天，你打卡了吗？',{body:`今天的计划：${state.active.day.name}`,icon:'/icon-192.png',tag:'fitflow-daily'});}catch{}}}
 }
}
function setPayload(row,done){const weight=$('input[name=weight]',row),reps=$('input[name=reps]',row);if(!weight.checkValidity()||!reps.checkValidity()){weight.reportValidity();reps.reportValidity();return null;}return {id:row.dataset.entry,index:Number(row.dataset.index),weight:Number(weight.value),reps:Number(reps.value),done};}
async function exportData(){const response=await fetch('/api/export');if(!response.ok)throw new Error('导出失败，请检查连接与登录状态');const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`练序备份-${today}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('备份已导出，请妥善保存。');}
async function importFile(file){
 if(!file)return;if(file.size>5*1024*1024)throw new Error('备份文件不能超过 5 MB');
 let data;try{data=JSON.parse(await file.text());}catch{throw new Error('无法读取备份，请选择正确的 JSON 文件');}
 if(data.schemaVersion!==1||!Array.isArray(data.history)||!data.plan)throw new Error('这不是有效的练序备份文件');
 confirmDialog('用备份替换当前数据？',`将导入「${data.plan.name}」和 ${data.history.length} 条打卡记录。当前数据会被替换，请先确认已经导出需要保留的数据。`,'导入并替换',async()=>{await action('restore',{state:data});draft=null;planDirty=false;stopRest();render();toast('备份已恢复。');});
}
async function handleAction(el){
 const id=el.dataset.id,index=Number(el.dataset.index),act=el.dataset.action;
 switch(act){
  case 'retry': await load(true);break;
  case 'go-settings':navigate('settings');break;
  case 'close-modal':closeModal();break;
  case 'confirm':{const callback=modalData?.callback;closeModal();await callback?.();break;}
  case 'plan-help':showPlanHelp();break;
  case 'reminders':reminderModal();break;
  case 'enable-notifications':{
   if(!('Notification'in window)||!window.isSecureContext){toast('当前地址不支持浏览器通知，可继续使用页面内提醒。');break;}
   const permission=await Notification.requestPermission();if(permission==='granted'){store.set('notifications','yes');toast('已启用。网页打开时会在设置的时间提醒你。');}else toast('未获得通知权限，页面内提醒仍然可用。');break;
  }
  case 'start-workout':case 'exercise-start':{
   if(currentInfo().mode!=='workout'){toast('请先恢复今日训练。');break;}
   if(id)expanded.add(id);await action('start',{}, {render:false});navigate('workout');if(route==='workout')render();break;
  }
  case 'pause-workout':await action('pause');break;
  case 'resume-workout':await action('start');break;
  case 'toggle-set':{
   const row=el.closest('.set-row'),wasDone=el.getAttribute('aria-pressed')==='true',p=setPayload(row,!wasDone);if(!p)return;
   el.disabled=true;try{await action('logSet',p);if(!wasDone&&state.settings.autoRestTimer){const e=state.active.day.exercises.find(x=>x.id===p.id);if(e.rest)startRest(e.rest);}}finally{el.disabled=false;}break;
  }
  case 'finish-workout':{
   await queue;const p=progress(state.active);if(!p.done){toast('至少完成一组后再打卡，或先保存留到下次。');break;}
   const note=$('#workout-note')?.value??state.active.note;
   confirmDialog(p.done<p.total?'按已完成的部分打卡？':'完成今天的训练？',p.done<p.total?`已完成 ${p.done} / ${p.total} 组。确认后以「部分完成」记录，明天进入下一训练日。想继续这些动作，可选择取消并先保存。`:`今天的 ${p.total} 组都完成了。确认打卡后，明天继续循环中的下一个训练日。`,'完成并打卡',async()=>{await action('finish',{allowPartial:true,note},{render:false});stopRest();navigate('today');if(route==='today')render();toast('打卡成功，每一次努力都有记录。');});break;
  }
  case 'finish-rest':await action('finish');toast('恢复日已打卡，明天继续下一次训练。');break;
  case 'defer':confirmDialog('今天先休息？','当前训练和已完成的组会保留，下个可训练日继续。今天如果改变主意，也可以随时恢复。','保存并休息',async()=>{await action('defer',{}, {render:false});stopRest();navigate('today');if(route==='today')render();toast('进度已保存，下次继续。');});break;
  case 'resume-today':await action('resumeToday');toast('今天的训练已恢复。');break;
  case 'undo-finish':confirmDialog('撤销今天的打卡？','今天的训练将恢复为未打卡，已完成的组仍会保留，你可以继续记录。','撤销打卡',async()=>{await action('undoFinish');toast('已恢复今天的训练。');});break;
  case 'rest-start':startRest(Number(el.dataset.seconds));break;
  case 'rest-add':startRest(Math.ceil((restUntil-Date.now())/1000)+30);break;
  case 'rest-stop':stopRest();break;
  case 'record-detail':showRecord(id);break;
  case 'schedule-day':{
   const date=el.dataset.date,h=state.history.find(x=>x.date===date);if(h){showRecord(h.id);break;}
   const item=forecast(state,today,14).find(x=>x.date===date);
   if(!item){selectedDate=date;historyMonth=date.slice(0,7);navigate('history');break;}
   showModal(`${Number(date.slice(5,7))} 月 ${Number(date.slice(8))} 日 · ${weekdays[weekday(date)]}`,`<p class="modal-intro">${date===today?'今日安排':'预计安排 · 未完成顺延时，后续日程会自动调整'}</p><h2>${esc(item.day.name)}</h2><div style="margin-top:18px">${item.day.exercises.map(e=>`<div class="detail-set"><span class="grow">${esc(exById(e.exerciseId).name)}</span><strong>${e.sets} × ${e.reps} ${unitLabel(exById(e.exerciseId).unit)}</strong></div>`).join('')||'<div class="info-box">给身体一些恢复时间，当前训练顺序会保留。</div>'}</div><div class="modal-actions">${actButton('close-modal','知道了','primary')}</div>`);break;
  }
  case 'preset':{
   const select=()=>{draft=makePlan(Number(el.dataset.split));draftDay=0;planDirty=true;render();toast('模板已载入，可调整后保存。');};
   if(planDirty)confirmDialog('替换编辑中的模板？','尚未保存的调整将被新的模板替换。已启用的计划不会改变，直到点击保存。','使用新模板',select);else select();break;
  }
  case 'select-plan-day':draftDay=index;render();break;
  case 'add-day':if(draft.days.length>=30){toast('一个循环最多 30 天。');break;}draft.days.push({id:uid(),name:'新的训练日',tag:'CUSTOM',kind:'workout',exercises:[]});draftDay=draft.days.length-1;planDirty=true;render();break;
  case 'remove-day':if(draft.days.length===1){toast('至少保留一个训练日。');break;}confirmDialog('删除这个训练日？',`从编辑中的循环移除「${draft.days[draftDay].name}」，保存后生效。`,'删除',()=>{draft.days.splice(draftDay,1);draftDay=Math.max(0,draftDay-1);planDirty=true;render();});break;
  case 'move-day-up':case 'move-day-down':{const target=draftDay+(act==='move-day-up'?-1:1);if(target<0||target>=draft.days.length)break;[draft.days[draftDay],draft.days[target]]=[draft.days[target],draft.days[draftDay]];draftDay=target;planDirty=true;render();break;}
  case 'move-exercise-up':case 'move-exercise-down':{const list=draft.days[draftDay].exercises,target=index+(act==='move-exercise-up'?-1:1);if(target<0||target>=list.length)break;[list[index],list[target]]=[list[target],list[index]];planDirty=true;render();break;}
  case 'remove-plan-exercise':draft.days[draftDay].exercises.splice(index,1);planDirty=true;render();break;
  case 'add-plan-exercise':showPicker();break;
  case 'picker-muscle':pickerMuscle=el.dataset.muscle;$$('[data-action=picker-muscle]').forEach(x=>x.classList.toggle('active',x===el));$('#picker-results').innerHTML=pickerResults();break;
  case 'pick-exercise':if(draft.days[draftDay].exercises.length>=30){toast('每天最多 30 个动作。');break;}addExerciseToDraft(id,draftDay);closeModal();render();toast('已添加，可继续调整组数与重量。');break;
  case 'save-plan':{
   const bad=$$('input','#main').find(x=>!x.checkValidity());if(bad){bad.reportValidity();return;}
   const save=async()=>{await action('savePlan',{plan:draft},{render:false});draft=clone(state.plan);planDirty=false;draftDay=0;stopRest();render();toast('新计划已启用。');};
   if(state.active.started&&!state.history.some(x=>x.date===today))confirmDialog('替换当前未完成的训练？','已记录但尚未打卡的训练进度将被新计划替换。已经打卡的历史会保留。','保存并替换',save);else await save();break;
  }
  case 'filter-muscle':muscle=el.dataset.muscle;$$('[data-action=filter-muscle]').forEach(x=>x.classList.toggle('active',x===el));$('#library-results').innerHTML=libraryCards();break;
  case 'new-exercise':showExerciseForm();break;
  case 'exercise-detail':showExercise(id);break;
  case 'edit-exercise':showExerciseForm(exById(id));break;
  case 'delete-exercise':confirmDialog('删除自定义动作？',`将从动作库删除「${exById(id).name}」。已打卡的历史记录会保留。`,'删除动作',async()=>{await action('deleteExercise',{id});toast('动作已删除。');});break;
  case 'add-library-exercise':showAddToDay(id);break;
  case 'add-to-day':addExerciseToDraft(id,index);closeModal();navigate('plan');if(route==='plan')render();toast('动作已加入编辑中的计划，保存后生效。');break;
  case 'month-prev':case 'month-next':{const d=new Date(historyMonth+'-15T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+(act==='month-prev'?-1:1));historyMonth=d.toISOString().slice(0,7);selectedDate='';render();break;}
  case 'history-date':selectedDate=el.dataset.date;render();break;
  case 'all-month':selectedDate='';render();break;
  case 'record-weight':weightModal();break;
  case 'export-data':await exportData();break;
  case 'import-data':$('#backup-file').click();break;
  case 'install-app':if(installEvent){await installEvent.prompt();installEvent=null;}else showModal('将练序放到主屏幕',`<div class="help-list"><div><h3>iPhone / Safari</h3><p>点底部分享按钮，选择「添加到主屏幕」。</p></div><div><h3>Android / Chrome</h3><p>点右上角菜单，选择「添加到主屏幕」或「安装应用」。</p></div><div><h3>关于本地地址</h3><p>手机局域网 HTTP 地址支持在线训练记录。完整 PWA 安装与离线页面需要 HTTPS，部署云服务器后可启用。</p></div></div><div class="modal-actions">${actButton('close-modal','知道了','primary')}</div>`);break;
  case 'logout':await fetch('/api/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});store.remove('cache');stopRest();showLogin();break;
 }
}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[href^="#"]');
 if(link&&link.getAttribute('href')!=='#main'){event.preventDefault();navigate(link.getAttribute('href').slice(1));return;}
 if(event.target.classList.contains('modal-overlay')){closeModal();return;}
 const el=event.target.closest('[data-action]');if(!el||el.disabled)return;
 handleAction(el).catch(err=>{const error=$('#modal-error');if(error)error.textContent=err.message;else toast(err.message||'操作未完成，请重试。');});
});
document.addEventListener('input',event=>{
 const el=event.target;
 if(el.id==='library-search'){search=el.value;$('#library-results').innerHTML=libraryCards();}
 if(el.id==='picker-search'){pickerSearch=el.value;$('#picker-results').innerHTML=pickerResults();}
 if(el.id==='plan-name'){draft.name=el.value;planDirty=true;}
 if(el.id==='day-name'){draft.days[draftDay].name=el.value;planDirty=true;}
 if(el.dataset.planField){const k=el.dataset.planField;draft.days[draftDay].exercises[Number(el.dataset.index)][k]=k==='note'?el.value:Number(el.value);planDirty=true;}
});
document.addEventListener('change',event=>{
 const el=event.target;
 if(el.id==='equipment-filter'){equipment=el.value;$('#library-results').innerHTML=libraryCards();}
 if(el.id==='day-kind'){const day=draft.days[draftDay];if(el.value==='rest'&&day.exercises.length){el.value=day.kind;confirmDialog('改为恢复日？','这一天的动作会从编辑中的计划移除。保存计划后生效。','改为恢复日',()=>{day.kind='rest';day.tag='REST';day.exercises=[];planDirty=true;render();});}else{day.kind=el.value;day.tag=el.value==='rest'?'REST':'CUSTOM';planDirty=true;render();}}
 if(el.closest('.set-row')&&el.matches('input')){const row=el.closest('.set-row'),done=$('.set-toggle',row).getAttribute('aria-pressed')==='true',p=setPayload(row,done);if(p)action('logSet',p,{render:false}).catch(()=>{});}
 if(el.id==='workout-note')action('note',{note:el.value},{render:false}).catch(()=>{});
 if(el.id==='backup-file')importFile(el.files?.[0]).catch(err=>toast(err.message)).finally(()=>{el.value='';});
});
document.addEventListener('toggle',event=>{const el=event.target;if(!el.classList?.contains('workout-accordion'))return;if(el.open)expanded.add(el.dataset.entry);else expanded.delete(el.dataset.entry);},true);
document.addEventListener('submit',async event=>{
 event.preventDefault();const form=event.target;if(!form.reportValidity())return;const data=new FormData(form),submit=$('button[type=submit]',form);if(submit)submit.disabled=true;
 try {
  if(form.id==='login-form'){const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:data.get('password')})});const result=await response.json();if(!response.ok)throw new Error(result.error);await load(true);}
  if(form.id==='settings-form'){await action('settings',{name:data.get('name'),timezone:data.get('timezone'),weeklyGoal:Number(data.get('weeklyGoal')),restDays:data.getAll('restDay').map(Number),reminderEnabled:data.has('reminderEnabled'),reminderTime:data.get('reminderTime'),autoRestTimer:data.has('autoRestTimer'),defaultRest:Number(data.get('defaultRest'))});toast('设置已保存。');}
  if(form.id==='exercise-form'){const ex={...Object.fromEntries(data),id:modalData.id||uid()};await action('saveExercise',{exercise:ex},{render:false});closeModal();render();toast('动作已保存到你的动作库。');}
  if(form.id==='weight-form'){await action('body',{weight:Number(data.get('weight')),note:data.get('note')},{render:false});closeModal();render();toast('今天的体重已记录。');}
 }catch(err){const error=$('#modal-error')||$('#login-error');if(error)error.textContent=err.message;else toast(err.message||'保存失败，请重试。');}
 finally{if(submit?.isConnected)submit.disabled=false;}
});
document.addEventListener('keydown',event=>{
 if(!modalData)return;if(event.key==='Escape'){closeModal();return;}
 if(event.key==='Tab'){const list=$$('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]','#modal-root').filter(x=>!x.hidden),first=list[0],last=list.at(-1);if(event.shiftKey&&document.activeElement===first){last?.focus();event.preventDefault();}else if(!event.shiftKey&&document.activeElement===last){first?.focus();event.preventDefault();}}
});
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1)||'today';if(route==='plan'&&planDirty&&next!=='plan'){window.history.replaceState(null,'','#plan');confirmDialog('离开计划编辑？','你有尚未保存的计划调整。离开后，这些调整将丢失。','放弃修改',()=>{draft=null;planDirty=false;location.hash=next;});return;}if(route==='plan'&&next!=='plan'){draft=null;planDirty=false;}route=next;closeModal();render();window.scrollTo({top:0});});
window.addEventListener('beforeunload',event=>{if(planDirty||pending){event.preventDefault();event.returnValue='';}});
window.addEventListener('online',()=>load(true));
window.addEventListener('offline',()=>{offline=true;syncLabel();toast('连接已断开，训练数据已保存至上次成功同步。');});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!pending&&!planDirty&&!modalData)load();});
setInterval(tick,1000);
setInterval(()=>{if(state&&!document.hidden&&!pending&&!planDirty&&!modalData&&!document.activeElement?.matches('input,select,textarea'))load();},30000);
load(true);
if('serviceWorker'in navigator&&window.isSecureContext)navigator.serviceWorker.register('/sw.js').catch(()=>{});
