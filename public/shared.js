export function dateKey(now=new Date(),timezone='Asia/Shanghai') {
 return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function addDays(date,n) { const d=new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
export const weekday=date=>new Date(date+'T12:00:00Z').getUTCDay();
export const daysBetween=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
export const weekStart=date=>addDays(date,-((weekday(date)+6)%7));
export const recordToday=(s,today)=>s.history.find(x=>x.date===today);
export const isFixedRest=(s,date)=>s.settings.restDays.includes(weekday(date));
export function todayInfo(s,today) {
 const record=recordToday(s,today);
 if(record) return {mode:'complete',record,day:record.day};
 if(s.active.deferredOn===today) return {mode:'deferred',day:s.active.day};
 if(isFixedRest(s,today)&&s.active.overrideRestDate!==today) return {mode:'fixedRest',day:{name:'固定休息日',tag:'RECOVERY',kind:'rest',exercises:[]}};
 return {mode:s.active.day.kind==='rest'?'rest':'workout',day:s.active.day};
}
export const setKey=(exerciseId,index)=>`${exerciseId}:${index}`;
export function progress(active) {
 const total=active.day.exercises.reduce((n,e)=>n+e.sets,0);
 const done=Object.values(active.logs).filter(x=>x.done).length;
 return {total,done,percent:total?Math.round(done/total*100):0};
}
export function elapsed(active,now=Date.now()) { return Math.max(0,Math.floor(active.elapsedSeconds+(active.runningSince?(now-Date.parse(active.runningSince))/1000:0))); }
export function volume(logs,library) {
 return Object.values(logs).filter(x=>x.done&&library.find(e=>e.id===x.exerciseId)?.unit==='reps').reduce((n,x)=>n+x.weight*x.reps,0);
}
export function forecast(s,today,count=7) {
 let cursor=s.cursor,cycle=s.cycle;
 return Array.from({length:count},(_,i)=>{
  const date=addDays(today,i),record=recordToday(s,date);
  if(record) return {date,day:record.day,status:'complete',cycle:record.cycle};
  if(i===0&&s.active.deferredOn===today) return {date,day:{name:'今天休息',tag:'REST',kind:'rest',exercises:[]},status:'deferred',cycle};
  if(isFixedRest(s,date)&&!(i===0&&s.active.overrideRestDate===today)) return {date,day:{name:'固定休息日',tag:'REST',kind:'rest',exercises:[]},status:'rest',cycle};
  const item={date,day:s.plan.days[cursor],status:i===0?'today':'planned',cycle};
  cursor=(cursor+1)%s.plan.days.length;
  if(cursor===0) cycle++;
  return item;
 });
}
export function summary(s,today) {
 const workouts=s.history.filter(x=>x.kind==='workout');
 const start=weekStart(today), month=today.slice(0,7);
 const week=workouts.filter(x=>x.date>=start&&x.date<=today);
 return {count:workouts.length,week:week.length,month:workouts.filter(x=>x.date.startsWith(month)).length,volume:workouts.reduce((n,x)=>n+x.volume,0),minutes:Math.round(workouts.reduce((n,x)=>n+x.duration,0)/60),weekVolume:week.reduce((n,x)=>n+x.volume,0),weekMinutes:Math.round(week.reduce((n,x)=>n+x.duration,0)/60)};
}
