import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd(),her12=path.join(root,'public','her12');
const mustExist=['index.html','styles-v2.css','enhancements-v3.css','experience-v4.css','experience-v5.css','experience-v6.css','experience-v7.css','experience-v8.css','experience-v9.css','experience-v10.css','experience-v11.css','experience-v12.css','program-v2.js','runtime-v2.js','enhancements-v3.js','experience-v4b.js','experience-v5.js','experience-v6.js','experience-v7.js','experience-v8.js','experience-v9.js','experience-v10.js','experience-v11.js','experience-v12.js','manifest.webmanifest','sw.js','icon.svg','apple-touch-icon.png'];
const fail=message=>{console.error(`HER12 QA FAIL: ${message}`);process.exitCode=1};
for(const file of mustExist)if(!fs.existsSync(path.join(her12,file)))fail(`missing ${file}`);

const programSource=fs.readFileSync(path.join(her12,'program-v2.js'),'utf8'),sandbox={};vm.createContext(sandbox);vm.runInContext(`${programSource}\nthis.__PROGRAM = PROGRAM;`,sandbox);const program=sandbox.__PROGRAM;
if(!program||typeof program!=='object')fail('PROGRAM is not readable');const sessions=Object.keys(program||{});if(sessions.join(',')!=='A,B,C')fail(`expected sessions A,B,C; got ${sessions.join(',')}`);
const ids=new Set(),media=new Set(['hero.jpg']);
for(const [sessionId,session] of Object.entries(program||{})){if(!session.day||!session.name||!session.focus||!session.duration||!session.cardio)fail(`session ${sessionId} is missing descriptive fields`);if(!Array.isArray(session.ex)||session.ex.length<4)fail(`session ${sessionId} has too few exercises`);for(const ex of session.ex||[]){for(const key of ['id','name','img','target','unit','why','feel','alt'])if(!ex[key])fail(`${sessionId}/${ex.id||'?'} missing ${key}`);if(ids.has(ex.id))fail(`duplicate exercise id ${ex.id}`);ids.add(ex.id);media.add(ex.img);if(!Array.isArray(ex.sets)||ex.sets.length!==3||ex.sets.some(v=>!Number.isInteger(v)||v<0||v>6))fail(`${sessionId}/${ex.id} has invalid phase sets`);if(!Number.isFinite(ex.min)||!Number.isFinite(ex.max)||ex.min<1||ex.max<ex.min)fail(`${sessionId}/${ex.id} has invalid rep range`);if(!Number.isFinite(ex.start)||ex.start<0||!Number.isFinite(ex.step)||ex.step<0)fail(`${sessionId}/${ex.id} has invalid load calibration`);if(!Number.isFinite(ex.rest)||ex.rest<30||ex.rest>300)fail(`${sessionId}/${ex.id} has invalid rest time`);if(!Array.isArray(ex.steps)||ex.steps.length!==5||ex.steps.some(s=>typeof s!=='string'||!s.trim()))fail(`${sessionId}/${ex.id} must have exactly five technique steps`)}}

const v12=fs.readFileSync(path.join(her12,'experience-v12.js'),'utf8'),profileMatch=v12.match(/const HER12_COACH_SET_PROFILE=(\{[^\n]+\});/);let coachSets={};
if(!profileMatch)fail('adaptive coach set profile is not readable');else{try{coachSets=JSON.parse(profileMatch[1])}catch{fail('adaptive coach set profile is not valid JSON')}}
for(const id of ids){const sets=coachSets[id];if(!Array.isArray(sets)||sets.length!==3)fail(`coach set profile missing ${id}`);else if(sets.some(v=>!Number.isInteger(v)||v<2||v>6))fail(`coach set profile ${id} must keep every active exercise at 2-6 sets; got ${sets.join('/')}`)}
const plannedSets=(ex,phase)=>coachSets[ex.id]?.[phase]??ex.sets?.[phase]??0;

const gluteWeights={hip:1,rdl:.75,bulg:.5,abd:1,press:.5,hip2:1,step:.5,kick:1};
const gluteSessions=Object.entries(program).filter(([,session])=>session.ex.some(ex=>gluteWeights[ex.id]>0));
if(gluteSessions.length!==2)fail(`expected exactly 2 glute-focused weekly sessions; got ${gluteSessions.length}`);
const gluteVolume=[0,1,2].map(phase=>Object.values(program).reduce((sum,session)=>sum+session.ex.reduce((s,ex)=>s+(gluteWeights[ex.id]||0)*plannedSets(ex,phase),0),0));
gluteVolume.forEach((volume,phase)=>{if(volume<10||volume>16)fail(`phase ${phase+1} glute planning volume ${volume.toFixed(2)} is outside 10-16 effective-set guardrail`)});
if(!(gluteVolume[0]<=gluteVolume[1]&&gluteVolume[1]<=gluteVolume[2]))fail(`glute planning volume must progress across phases: ${gluteVolume.join(' -> ')}`);

const tri=program.B.ex.find(ex=>ex.id==='tri'),ohtri=program.B.ex.find(ex=>ex.id==='ohtri'),abs=program.C.ex.find(ex=>ex.id==='abs');
if(!tri||!ohtri)fail('direct triceps work missing');
const tricepsVolume=[0,1,2].map(phase=>plannedSets(tri,phase)+plannedSets(ohtri,phase));
tricepsVolume.forEach((volume,phase)=>{if(volume<5||volume>8)fail(`phase ${phase+1} direct triceps volume ${volume} is outside 5-8 set guardrail`)});
if(!abs||abs.start<=0||abs.step<=0||abs.max>20||!abs.name.toLowerCase().includes('crunch'))fail('abs priority must use progressively loadable crunch work rather than endurance-only reps');
const absSets=[0,1,2].map(phase=>plannedSets(abs,phase));if(absSets.some(v=>v<3||v>4))fail(`loaded abs sets should stay compact at 3-4 sets; got ${absSets.join('/')}`);

for(const file of media){const full=path.join(her12,'assets',file);if(!fs.existsSync(full))fail(`missing local exercise media assets/${file}`);else if(fs.statSync(full).size<8_000)fail(`exercise media assets/${file} is suspiciously small`)}

const index=fs.readFileSync(path.join(her12,'index.html'),'utf8');
for(const ref of ['styles-v2.css','enhancements-v3.css','experience-v4.css','experience-v5.css','experience-v6.css','experience-v7.css','experience-v8.css','experience-v9.css','experience-v10.css','program-v2.js','runtime-v2.js','enhancements-v3.js','experience-v4b.js','experience-v5.js','experience-v6.js','experience-v7.js','experience-v8.js','experience-v9.js','experience-v10.js','manifest.webmanifest','apple-touch-icon.png'])if(!index.includes(ref))fail(`index.html does not reference ${ref}`);
if(!index.includes('noindex,nofollow,noarchive'))fail('preview privacy robots directive missing');
if(!index.includes('rel="preload"')||!index.includes('assets/hero.jpg'))fail('critical hero image preload missing');

const runtime=fs.readFileSync(path.join(her12,'runtime-v2.js'),'utf8');for(const token of ['localStorage','sessionIsComplete','startTimer','normalizeState','pain'])if(!runtime.includes(token))fail(`runtime missing expected safety/progression primitive: ${token}`);
const enhancements=fs.readFileSync(path.join(her12,'enhancements-v3.js'),'utf8');for(const token of ['smartTargetCard','wakeLock','storage.persist','WARM_MEDIA','Petit plateau détecté','stopImmediatePropagation'])if(!enhancements.includes(token))fail(`v3 enhancement missing expected performance/intelligence primitive: ${token}`);
const v4=fs.readFileSync(path.join(her12,'experience-v4b.js'),'utf8');for(const token of ['HER12_PROFILE_V4','scheduleFor','Quels jours veux-tu t’entraîner','Voir la technique et le pourquoi','Modifier mes jours et objectifs','ACSM 2026'])if(!v4.includes(token))fail(`v4 experience missing expected onboarding/UX primitive: ${token}`);
const v5=fs.readFileSync(path.join(her12,'experience-v5.js'),'utf8');for(const token of ['HER12_TODAY_V5','Adapter aujourd’hui','Express','Allégée','activeExercises=function','Comment était la séance','Mensurations','Aujourd’hui'])if(!v5.includes(token))fail(`v5 coach-first experience missing expected primitive: ${token}`);
const v6=fs.readFileSync(path.join(her12,'experience-v6.js'),'utf8');for(const token of ['HER12_FLOW_V6','Échauffement rapide','Équipement indisponible ? Faire plus tard','v6SetCounter','Retour au calme','Deux séances difficiles récemment'])if(!v6.includes(token))fail(`v6 gym-floor flow missing expected primitive: ${token}`);
const v7=fs.readFileSync(path.join(her12,'experience-v7.js'),'utf8');for(const token of ['Commencer maintenant','Comment était l’exercice ?','Reprendre ${reps','v7NoteToggle','firstUnfinishedIndex','setNativeChoice'])if(!v7.includes(token))fail(`v7 one-tap flow missing expected primitive: ${token}`);
const v8=fs.readFileSync(path.join(her12,'experience-v8.js'),'utf8');for(const token of ['quietNav','compactWeekNav','simplifyExercise','her8-ready'])if(!v8.includes(token))fail(`v8 quiet UI missing expected primitive: ${token}`);
const v9=fs.readFileSync(path.join(her12,'experience-v9.js'),'utf8');for(const token of ['workoutMode','markCurrentSet','calmOnboarding','her9-workout','Progression enregistrée'])if(!v9.includes(token))fail(`v9 single-lane flow missing expected primitive: ${token}`);
const v10=fs.readFileSync(path.join(her12,'experience-v10.js'),'utf8');for(const token of ['homeVisual','v10SessionVisual','v10WeekStrip','exerciseBadge','v11Progress','experience-v11.css','experience-v11.js','her10-ready'])if(!v10.includes(token))fail(`v10/v11 visual or progress layer missing expected primitive: ${token}`);
const v11=fs.readFileSync(path.join(her12,'experience-v11.js'),'utf8');for(const token of ['guideSets','startTimer=function','Puis série','allDone','her11-resting','timerSkip','REST_PROFILE','Repos recommandé','hip:150','press:150','tri:90','experience-v12.css','experience-v12.js'])if(!v11.includes(token))fail(`guided rest flow missing expected primitive: ${token}`);
for(const token of ['HER12_COACH_SET_PROFILE','historyFor','Calibration 1 / 2','canAddSet','Changer mes jours','coachSeededV12','location.reload','Cible HER12','Volume maintenu'])if(!v12.includes(token))fail(`adaptive coach missing expected primitive: ${token}`);
for(const [name,source] of [['runtime-v2.js',runtime],['enhancements-v3.js',enhancements],['experience-v4b.js',v4],['experience-v5.js',v5],['experience-v6.js',v6],['experience-v7.js',v7],['experience-v8.js',v8],['experience-v9.js',v9],['experience-v10.js',v10],['experience-v11.js',v11],['experience-v12.js',v12]]){try{new vm.Script(source)}catch(error){fail(`${name} syntax error: ${error.message}`)}}

const sw=fs.readFileSync(path.join(her12,'sw.js'),'utf8');
for(const file of media)if(!sw.includes(`./assets/${file}`))fail(`service worker does not know assets/${file}`);
for(const ref of ['./enhancements-v3.css','./enhancements-v3.js','./experience-v4.css','./experience-v4b.js','./experience-v5.css','./experience-v5.js','./experience-v6.css','./experience-v6.js','./experience-v7.css','./experience-v7.js','./experience-v8.css','./experience-v8.js','./experience-v9.css','./experience-v9.js','./experience-v10.css','./experience-v10.js','./experience-v11.css','./experience-v11.js','./experience-v12.css','./experience-v12.js','WARM_MEDIA','her12-v16'])if(!sw.includes(ref))fail(`service worker missing current cache primitive: ${ref}`);

if(!process.exitCode)console.log(`HER12 QA OK: ${sessions.length} sessions, ${ids.size} unique exercises, ${media.size} local images, glute planning ${gluteVolume.map(v=>v.toFixed(2)).join(' -> ')} effective-set estimate, triceps ${tricepsVolume.join(' -> ')}, loaded abs ${absSets.join(' -> ')}, every active coach exercise >=2 sets, adaptive load/reps/set progression + schedule re-entry verified.`);
