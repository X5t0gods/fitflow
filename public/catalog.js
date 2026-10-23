export const MUSCLES = ['胸部', '背部', '肩部', '腿部', '臀部', '手臂', '核心', '有氧'];
export const EQUIPMENT = ['杠铃', '哑铃', '固定器械', '绳索', '自重', '有氧器械'];
const rows = [
 ['bench','杠铃平板卧推','Barbell Bench Press','胸部','杠铃'],
 ['incline-db','上斜哑铃卧推','Incline Dumbbell Press','胸部','哑铃'],
 ['db-bench','哑铃平板卧推','Dumbbell Bench Press','胸部','哑铃'],
 ['chest-press','坐姿器械推胸','Machine Chest Press','胸部','固定器械'],
 ['cable-fly','龙门架夹胸','Cable Fly','胸部','绳索'],
 ['pec-deck','蝴蝶机夹胸','Pec Deck Fly','胸部','固定器械'],
 ['pushup','俯卧撑','Push Up','胸部','自重'],
 ['dip','双杠臂屈伸','Dip','胸部','自重'],
 ['lat-pull','高位下拉','Lat Pulldown','背部','固定器械'],
 ['row','坐姿绳索划船','Seated Cable Row','背部','绳索'],
 ['barbell-row','杠铃俯身划船','Barbell Row','背部','杠铃'],
 ['db-row','单臂哑铃划船','Dumbbell Row','背部','哑铃'],
 ['pullup','引体向上','Pull Up','背部','自重'],
 ['assisted-pullup','辅助引体向上','Assisted Pull Up','背部','固定器械'],
 ['straight-pull','直臂下压','Straight Arm Pulldown','背部','绳索'],
 ['machine-row','器械胸托划船','Chest Supported Row','背部','固定器械'],
 ['deadlift','传统硬拉','Deadlift','背部','杠铃'],
 ['ohp','杠铃站姿推举','Overhead Press','肩部','杠铃'],
 ['db-press','坐姿哑铃推举','Dumbbell Shoulder Press','肩部','哑铃'],
 ['lateral','哑铃侧平举','Lateral Raise','肩部','哑铃'],
 ['cable-lateral','绳索侧平举','Cable Lateral Raise','肩部','绳索'],
 ['face-pull','绳索面拉','Face Pull','肩部','绳索'],
 ['reverse-fly','反向蝴蝶机飞鸟','Reverse Pec Deck','肩部','固定器械'],
 ['front-raise','哑铃前平举','Front Raise','肩部','哑铃'],
 ['squat','杠铃深蹲','Barbell Back Squat','腿部','杠铃'],
 ['leg-press','器械腿举','Leg Press','腿部','固定器械'],
 ['hack-squat','哈克深蹲','Hack Squat','腿部','固定器械'],
 ['leg-extension','坐姿腿屈伸','Leg Extension','腿部','固定器械'],
 ['leg-curl','俯卧腿弯举','Leg Curl','腿部','固定器械'],
 ['rdl','罗马尼亚硬拉','Romanian Deadlift','腿部','杠铃'],
 ['bulgarian','保加利亚分腿蹲','Bulgarian Split Squat','腿部','哑铃'],
 ['goblet','高脚杯深蹲','Goblet Squat','腿部','哑铃'],
 ['calf','站姿提踵','Standing Calf Raise','腿部','固定器械'],
 ['lunge','哑铃行走箭步蹲','Walking Lunge','腿部','哑铃'],
 ['hip-thrust','杠铃臀推','Barbell Hip Thrust','臀部','杠铃'],
 ['abduction','坐姿髋外展','Hip Abduction','臀部','固定器械'],
 ['kickback','绳索后踢腿','Cable Kickback','臀部','绳索'],
 ['bridge','臀桥','Glute Bridge','臀部','自重'],
 ['curl','哑铃弯举','Dumbbell Curl','手臂','哑铃'],
 ['barbell-curl','杠铃弯举','Barbell Curl','手臂','杠铃'],
 ['hammer','哑铃锤式弯举','Hammer Curl','手臂','哑铃'],
 ['preacher','牧师凳弯举','Preacher Curl','手臂','固定器械'],
 ['pushdown','绳索三头下压','Triceps Pushdown','手臂','绳索'],
 ['overhead-tri','绳索过顶臂屈伸','Overhead Triceps Extension','手臂','绳索'],
 ['skullcrusher','仰卧杠铃臂屈伸','Skull Crusher','手臂','杠铃'],
 ['plank','平板支撑','Plank','核心','自重','seconds'],
 ['crunch','卷腹','Crunch','核心','自重'],
 ['cable-crunch','绳索卷腹','Cable Crunch','核心','绳索'],
 ['leg-raise','悬垂举腿','Hanging Leg Raise','核心','自重'],
 ['ab-wheel','健腹轮','Ab Wheel Rollout','核心','自重'],
 ['treadmill','跑步机','Treadmill','有氧','有氧器械','minutes'],
 ['bike','动感单车','Stationary Bike','有氧','有氧器械','minutes'],
 ['elliptical','椭圆机','Elliptical','有氧','有氧器械','minutes'],
 ['rowing','划船机','Rowing Machine','有氧','有氧器械','minutes'],
 ['stair','爬楼机','Stair Climber','有氧','有氧器械','minutes']
];
export const CATALOG = rows.map(([id,name,en,muscle,equipment,unit='reps'])=>({id,name,en,muscle,equipment,unit,custom:false,note:''}));
export const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export function prescription(exerciseId, sets=3, reps=10, rest=90) {
 const ex=CATALOG.find(x=>x.id===exerciseId);
 return {id:uid(),exerciseId,sets,reps:ex?.unit==='seconds'?45:ex?.unit==='minutes'?15:reps,weight:0,rest,note:''};
}
const day=(name,tag,ids)=>({id:uid(),name,tag,kind:'workout',exercises:ids.map(id=>prescription(id))});
export const restDay=()=>({id:uid(),name:'休息与恢复',tag:'REST',kind:'rest',exercises:[]});
export const PRESETS = [
 {split:1,title:'全身训练',subtitle:'全身循环 · 自由安排频率'},
 {split:2,title:'上下肢二分化',subtitle:'上肢 / 下肢'},
 {split:3,title:'推拉腿三分化',subtitle:'胸肩三头 / 背部二头 / 腿臀'},
 {split:4,title:'经典四分化',subtitle:'胸 / 背 / 肩臂 / 腿'},
 {split:5,title:'部位五分化',subtitle:'胸 / 背 / 肩 / 腿 / 手臂'},
 {split:6,title:'双循环六分化',subtitle:'推拉腿 A / 推拉腿 B'}
];
export function makePlan(split=3) {
 const push=()=>day('胸肩 · 推力日','PUSH',['bench','incline-db','db-press','lateral','pushdown']);
 const pull=()=>day('背部 · 拉力日','PULL',['lat-pull','row','db-row','face-pull','curl']);
 const legs=()=>day('腿臀 · 下肢日','LEGS',['squat','rdl','leg-press','leg-curl','calf']);
 const chest=()=>day('胸部训练','CHEST',['bench','incline-db','chest-press','cable-fly']);
 const back=()=>day('背部训练','BACK',['lat-pull','barbell-row','row','straight-pull']);
 const shoulder=()=>day('肩部训练','SHOULDERS',['db-press','lateral','face-pull','reverse-fly']);
 const arms=()=>day('手臂训练','ARMS',['barbell-curl','hammer','pushdown','overhead-tri']);
 const choices={
 1:[day('全身力量日','FULL BODY',['goblet','db-bench','lat-pull','db-press','plank'])],
 2:[day('上肢训练','UPPER',['bench','lat-pull','db-press','row','curl']),legs()],
 3:[push(),pull(),legs()],
 4:[chest(),back(),day('肩臂训练','SHOULDERS & ARMS',['db-press','lateral','curl','pushdown']),legs()],
 5:[chest(),back(),shoulder(),legs(),arms()],
 6:[push(),pull(),legs(),day('推力日 B','PUSH B',['db-bench','pec-deck','ohp','cable-lateral','overhead-tri']),day('拉力日 B','PULL B',['assisted-pullup','machine-row','straight-pull','reverse-fly','hammer']),day('下肢日 B','LEGS B',['hack-squat','hip-thrust','bulgarian','leg-extension','calf'])]
 };
 const days=choices[split]||choices[3];
 if(split===6) days.splice(3,0,restDay());
 days.push(restDay());
 return {id:uid(),name:PRESETS.find(x=>x.split===split)?.title||'我的训练计划',split,days};
}
export const unitLabel = unit => unit==='seconds'?'秒':unit==='minutes'?'分钟':'次';
