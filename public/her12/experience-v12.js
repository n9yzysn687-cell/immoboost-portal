const HER12_COACH_SET_PROFILE={"hip":[3,3,4],"rdl":[2,3,3],"bulg":[2,2,2],"abd":[2,2,2],"lat":[2,3,3],"row":[2,3,3],"chest":[2,2,2],"tri":[3,3,4],"raise":[2,2,3],"ohtri":[2,2,3],"pallof":[2,2,2],"press":[2,2,3],"hip2":[2,2,2],"step":[2,2,2],"kick":[2,2,2],"abs":[3,3,4]};

(()=>{
  function init(){
    if(window.__HER12_COACH_V12__)return;window.__HER12_COACH_V12__=true;
    const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)],ALL_GOALS={glutes:true,thighs:true,arms:true,back:true,shoulders:true,abs:true};

    function normalizeStoredProfile(){
      try{const key='HER12_PROFILE_V4',p=JSON.parse(localStorage.getItem(key)||'null');if(!p)return;p.goals={...ALL_GOALS};localStorage.setItem(key,JSON.stringify(p))}catch{}
    }
    normalizeStoredProfile();

    function historyFor(id,beforeWeek=null){
      return Object.entries(state.records||{}).map(([key,record])=>{const [week,session,exerciseId]=key.split('|');return{week:Number(week),session,id:exerciseId,record}}).filter(x=>x.id===id&&(beforeWeek===null||x.week<beforeWeek)).sort((a,b)=>{const ad=Date.parse(a.record?.date||'')||0,bd=Date.parse(b.record?.date||'')||0;return ad&&bd?ad-bd:a.week-b.week});
    }
    function cleanRecord(r){return r&&r.feel!=='pain'&&r.feel!=='hard'&&r.form!=='bad'&&Array.isArray(r.setsDone)&&r.setsDone.every(Boolean)}
    function canAddSet(ex){const recent=historyFor(ex.id,state.week).slice(-2);return recent.length>=2&&recent.every(x=>cleanRecord(x.record))}
    function applyCoachSets(){
      const p=phaseIndex();
      for(const session of Object.values(PROGRAM))for(const ex of session.ex){
        const base=HER12_COACH_SET_PROFILE[ex.id];if(!base)continue;ex.sets=[...base];
        if(p>0&&base[p]>base[p-1]&&!canAddSet(ex))ex.sets[p]=base[p-1];
      }
    }
    applyCoachSets();

    function loadText(load,unit){return Number(load)===0?'Poids du corps':`${roundValue(Number(load))} ${unit}`}
    function coachPlan(ex){
      const rows=historyFor(ex.id,state.week),prev=rows.at(-1)?.record||null,count=ex.sets[phaseIndex()],scheduled=HER12_COACH_SET_PROFILE[ex.id]?.[phaseIndex()]||count;
      if(!prev)return{stage:'Calibration 1 / 2',load:Number(ex.start),reps:Array(count).fill(ex.min),why:'HER12 pose une première référence. Termine les séries proprement et indique le ressenti : la prochaine cible sera calculée à partir de ce résultat.',scheduled,count};
      const previousLoad=Number(prev.load)||0,proposed=Number.isFinite(Number(prev.next))?Number(prev.next):previousLoad,bad=!cleanRecord(prev),load=Math.max(0,proposed),raised=load>previousLoad+1e-6;
      let reps;
      if(bad||raised)reps=Array(count).fill(ex.min);
      else if(readinessValue()==='tired')reps=Array.from({length:count},(_,i)=>Math.min(ex.max,Math.max(ex.min,Number(prev.reps?.[i]??ex.min))));
      else reps=Array.from({length:count},(_,i)=>Math.min(ex.max,Math.max(ex.min,Number(prev.reps?.[i]??ex.min)+1)));
      let why;
      if(bad)why='La dernière exécution était trop lourde ou incomplète. HER12 sécurise la charge et reconstruit des répétitions propres.';
      else if(raised)why='La plage haute a été validée. HER12 augmente légèrement la charge et repart du bas de la plage de répétitions.';
      else if(readinessValue()==='tired')why='Fatigue signalée : HER12 maintient la cible au lieu de forcer une progression aujourd’hui.';
      else why='Même charge, objectif légèrement supérieur. HER12 fait progresser les répétitions avant de remonter le poids.';
      return{stage:rows.length<2?'Calibration 2 / 2':'Niveau calibré',load,reps,why,scheduled,count};
    }
    function seedTarget(ex,plan){
      const d=currentDraft(ex);if(!d||d.coachSeededV12)return false;
      if(d.setsDone?.some(Boolean)){d.coachSeededV12=true;saveState(true);return false}
      d.load=plan.load;d.reps=[...plan.reps];d.coachSeededV12=true;saveState(true);return true;
    }
    function coachCard(){
      const ex=getCurrentExercise();if(!ex)return;const plan=coachPlan(ex),seeded=seedTarget(ex,plan);
      if(seeded){const input=q('#loadInput');if(input)input.value=plan.load;qq('#setRows .repValue').forEach((el,i)=>{if(plan.reps[i]!=null)el.textContent=String(plan.reps[i])})}
      q('#v12Coach')?.remove();const card=document.createElement('article');card.id='v12Coach';card.className='v12Coach';
      const top=document.createElement('div');top.className='v12CoachTop';const stage=document.createElement('span');stage.textContent=plan.stage;const auto=document.createElement('b');auto.textContent='Cible HER12';top.append(stage,auto);
      const target=document.createElement('div');target.className='v12CoachTarget';const load=document.createElement('strong');load.textContent=loadText(plan.load,ex.unit);const prescription=document.createElement('span');prescription.textContent=`${plan.count} séries · ${plan.reps.join(' / ')} reps`;target.append(load,prescription);
      const note=document.createElement('p');note.textContent=plan.why;card.append(top,target,note);
      if(plan.count<plan.scheduled){const hold=document.createElement('div');hold.className='v12Hold';hold.textContent=`Volume maintenu à ${plan.count} séries. HER12 ajoutera la série prévue seulement après 2 passages propres.`;card.appendChild(hold)}
      const anchor=q('#exercise .loggingCard .loadControl')||q('#setRows');anchor?.insertAdjacentElement('afterend',card);
      const header=q('#exercise .loggingCard>.row strong');if(header)header.textContent='Charge cible';
      const hint=q('#loadHint');if(hint)hint.textContent='HER12 ajuste après chaque performance';
    }

    function openSchedule(){
      go('more');setTimeout(()=>{const b=q('#her4Config');if(b)b.click();else showSaveStatus('Ouvre Guide puis « Changer mes jours »',true)},60)
    }
    function addScheduleControl(){
      const section=q('#program');if(!section)return;let b=q('#v12Schedule');if(!b){b=document.createElement('button');b.id='v12Schedule';b.type='button';b.className='v12Schedule';b.textContent='Changer mes jours';section.querySelector('h1')?.insertAdjacentElement('afterend',b);b.onclick=openSchedule}
      const cfg=q('#her4Config');if(cfg)cfg.textContent='Changer mes jours d’entraînement';
    }

    function selectedDays(root){return [...root.querySelectorAll('[data-day].active')].map(b=>Number(b.dataset.day)).sort((a,b)=>a-b)}
    function patchOnboarding(root){
      if(!root)return;
      root.classList.add('v12Onboarding');
      root.querySelectorAll('[data-goal]').forEach(b=>{if(!b.classList.contains('active'))b.click()});
      const one=root.querySelector('[data-step="1"]'),two=root.querySelector('[data-step="2"]'),three=root.querySelector('[data-step="3"]');
      if(one){const over=one.querySelector('.her4Overline'),p=one.querySelector('p');if(over)over.textContent='1 sur 2';if(p)p.textContent='Choisis exactement 3 jours. HER12 décide ensuite des exercices, séries, répétitions, repos et progression.'}
      if(two)two.classList.add('v12HiddenGoalStep');
      if(three){const over=three.querySelector('.her4Overline'),h=three.querySelector('h1'),e=three.querySelector('.her4Evidence'),back=three.querySelector('[data-back]'),create=three.querySelector('#her4Create');if(over)over.textContent='2 sur 2';if(h)h.textContent='HER12 a préparé ton plan';if(e)e.textContent='Les 2 premiers passages sur chaque exercice servent à calibrer ton niveau. Ensuite HER12 pilote les répétitions, la charge et l’ajout de séries selon tes performances.';if(back){back.dataset.back='1';back.textContent='Changer mes jours'}if(create)create.textContent='Démarrer avec HER12'}
      const next=one?.querySelector('[data-next="2"]');if(next&&!next.dataset.v12Bound){next.dataset.v12Bound='1';next.addEventListener('click',()=>setTimeout(()=>root.querySelector('[data-next="3"]')?.click(),0))}
      const summary=root.querySelector('#her4GoalSummary');if(summary&&!three?.classList.contains('hidden'))summary.textContent='Objectif fixé par HER12 : fessiers prioritaires, jambes, bras, dos, épaules et abdos équilibrés.';
      const create=root.querySelector('#her4Create');if(create&&!create.dataset.v12Bound){create.dataset.v12Bound='1';create.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();const days=selectedDays(root);if(days.length!==3)return;let old=null;try{old=JSON.parse(localStorage.getItem('HER12_PROFILE_V4')||'null')}catch{}const same=old&&JSON.stringify([...(old.days||[])].sort((a,b)=>a-b))===JSON.stringify(days);if(same){root.remove();showSaveStatus('✓ Jours inchangés');return}localStorage.setItem('HER12_PROFILE_V4',JSON.stringify({version:2,days,goals:{...ALL_GOALS}}));if(old){state.drafts={};state.readiness={};state.sessionStartedAt={};state.completed=Object.fromEntries(Object.entries(state.completed||{}).filter(([key])=>Number(key.split('|')[0])<state.week));state.session='A';state.exerciseIndex=0;saveState(true)}root.remove();location.reload()},true)}
      if(localStorage.getItem('HER12_PROFILE_V4')&&!root.querySelector('.v12CloseSetup')){const close=document.createElement('button');close.type='button';close.className='v12CloseSetup';close.setAttribute('aria-label','Fermer');close.textContent='×';root.querySelector('.her4OnboardInner')?.prepend(close);close.onclick=()=>root.remove()}
    }
    const observer=new MutationObserver(()=>{patchOnboarding(q('.her4Onboarding'));addScheduleControl()});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});patchOnboarding(q('.her4Onboarding'));

    const program0=renderProgram;renderProgram=function(){applyCoachSets();program0();addScheduleControl()};
    const exercise0=renderExercise;renderExercise=function(){applyCoachSets();exercise0();requestAnimationFrame(coachCard)};
    const go0=go;go=function(screen){applyCoachSets();go0(screen);if(screen==='program')addScheduleControl();if(screen==='exercise')requestAnimationFrame(coachCard);if(screen==='more')setTimeout(()=>{const cfg=q('#her4Config');if(cfg)cfg.textContent='Changer mes jours d’entraînement'},20)};

    document.documentElement.classList.add('her12-coach-ready');
    addScheduleControl();if(!q('#exercise')?.classList.contains('hidden'))coachCard();
  }
  if(document.readyState==='complete')init();else window.addEventListener('load',init,{once:true});
})();
