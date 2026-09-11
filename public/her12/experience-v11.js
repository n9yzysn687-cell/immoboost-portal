(()=>{
  const q=s=>document.querySelector(s);

  function rowsFor(id){
    return Object.entries(state.records||{}).map(([key,record])=>{
      const [week,session,exerciseId]=key.split('|');
      return{week:Number(week),session,id:exerciseId,record};
    }).filter(x=>x.id===id&&Number.isFinite(Number(x.record?.load))).sort((a,b)=>{
      const ad=Date.parse(a.record?.date||'')||0,bd=Date.parse(b.record?.date||'')||0;
      return ad&&bd?ad-bd:a.week-b.week;
    });
  }

  function loadProgress(id){
    const rows=rowsFor(id);if(!rows.length)return null;
    const first=Number(rows[0].record.load),best=Math.max(...rows.map(x=>Number(x.record.load)));
    const delta=best-first,pct=first>0?Math.round(delta/first*100):null;
    return{first,best,delta,pct,count:rows.length};
  }

  function loadUnit(id){
    for(const session of Object.values(PROGRAM)){
      const ex=session.ex.find(x=>x.id===id);if(ex)return ex.unit;
    }
    return'kg';
  }

  function deltaText(p,unit){
    if(!p||p.count<2)return'Première référence enregistrée';
    if(Math.abs(p.delta)<.001)return'Charge de référence maintenue';
    if(p.pct!==null)return`${p.delta>0?'+':''}${p.pct}% depuis le départ`;
    return`${p.delta>0?'+':''}${roundValue(p.delta)} ${unit} depuis le départ`;
  }

  function goalCard({label,id,detail}){
    const p=loadProgress(id),unit=loadUnit(id),card=document.createElement('article');
    card.className=`v11GoalCard${p?' active':''}`;
    const top=document.createElement('div');top.className='v11GoalTop';top.innerHTML=`<b>${label}</b><span>${detail}</span>`;card.appendChild(top);
    if(!p){const empty=document.createElement('div');empty.className='v11Empty';empty.textContent='La progression apparaîtra après les premières séances.';card.appendChild(empty);return card}
    const metric=document.createElement('div');metric.className='v11Metric';metric.innerHTML=`${roundValue(p.best)} <small>${unit}</small>`;
    const delta=document.createElement('div');delta.className='v11Delta';delta.textContent=deltaText(p,unit);card.append(metric,delta);return card;
  }

  function measureValue(m,key){const n=Number(m?.[key]);return Number.isFinite(n)&&n>0?n:null}
  function bodyMetric(label,key,first,last){
    const a=measureValue(first,key),b=measureValue(last,key),box=document.createElement('div');box.className='v11BodyMetric';
    const title=document.createElement('span');title.textContent=label;const value=document.createElement('strong');value.textContent=b===null?'—':`${roundValue(b)} cm`;const d=document.createElement('small');
    if(a!==null&&b!==null&&first!==last){const delta=Math.round((b-a)*10)/10;d.textContent=Math.abs(delta)<.05?'stable':`${delta>0?'+':''}${String(delta).replace('.',',')} cm`}
    else d.textContent=a!==null?'référence':'à mesurer';
    box.append(title,value,d);return box;
  }

  function bodyCard(){
    const list=state.measurements||[],first=list[0]||null,last=list.at(-1)||first,card=document.createElement('article');card.className='v11BodyCard';
    const head=document.createElement('div');head.className='v11SectionHead';head.style.margin='0';head.innerHTML=`<strong>Silhouette</strong><span>${list.length?'mesures réelles':'point de départ'}</span>`;card.appendChild(head);
    const grid=document.createElement('div');grid.className='v11BodyGrid';grid.append(bodyMetric('Taille','waist',first,last),bodyMetric('Hanches','hips',first,last),bodyMetric('Bras','arm',first,last));card.appendChild(grid);
    const btn=document.createElement('button');btn.type='button';btn.textContent=list.length?'Voir / ajouter mes mesures':'Ajouter mes mesures de départ';btn.onclick=()=>go('body');card.appendChild(btn);return card;
  }

  function checkpoints(){
    const wrap=document.createElement('div');wrap.className='v11Checkpoints';
    [{week:1,title:'S1',sub:'Départ'},{week:4,title:'S4',sub:'1er bilan'},{week:8,title:'S8',sub:'2e bilan'},{week:12,title:'S12',sub:'Bilan final'}].forEach((cp,index,all)=>{
      const next=all[index+1]?.week||13,item=document.createElement('div');item.className='v11Checkpoint';
      if(state.week>cp.week)item.classList.add('done');if(state.week>=cp.week&&state.week<next)item.classList.add('now');
      item.innerHTML=`<b>${cp.title}</b><span>${cp.sub}</span>`;wrap.appendChild(item);
    });return wrap;
  }

  function buildProgress(){
    const section=q('#tracking');if(!section)return;q('#v11Progress')?.remove();
    const root=document.createElement('div');root.id='v11Progress';
    const lead=document.createElement('p');lead.className='v11Lead';lead.textContent='On suit ce qui compte vraiment : régularité, force sur les exercices clés et mensurations.';root.appendChild(lead);
    const done=doneCount(),pct=Math.min(100,Math.round(done/36*100)),hero=document.createElement('article');hero.className='v11ProgressHero';
    hero.innerHTML=`<div class="v11HeroTop"><div><span>Programme</span><strong>${done}<small style="font-size:11px;color:#929ba8"> / 36 séances</small></strong></div><b>${pct}%</b></div><div class="progress"><span style="width:${pct}%"></span></div><div class="v11HeroFoot"><span>Semaine ${state.week} / 12</span><span>${fullWeeks()} semaine${fullWeeks()===1?'':'s'} complète${fullWeeks()===1?'':'s'}</span></div>`;root.appendChild(hero);
    const goalsHead=document.createElement('div');goalsHead.className='v11SectionHead';goalsHead.innerHTML='<strong>Force par objectif</strong><span>meilleure charge validée</span>';root.appendChild(goalsHead);
    const rail=document.createElement('div');rail.className='v11GoalRail';[
      {label:'Fessiers',id:'hip',detail:'Hip Thrust'},
      {label:'Cuisses',id:'press',detail:'Leg Press'},
      {label:'Bras',id:'tri',detail:'Triceps'},
      {label:'Dos',id:'lat',detail:'Lat Pulldown'},
      {label:'Abdos',id:'abs',detail:'Crunch chargé'}
    ].forEach(x=>rail.appendChild(goalCard(x)));root.appendChild(rail);
    const bodyHead=document.createElement('div');bodyHead.className='v11SectionHead';bodyHead.innerHTML='<strong>Corps</strong><span>sans interprétation automatique</span>';root.append(bodyHead,bodyCard());
    const checkpointsHead=document.createElement('div');checkpointsHead.className='v11SectionHead';checkpointsHead.innerHTML='<strong>Points de contrôle</strong><span>mesures + charges</span>';root.append(checkpointsHead,checkpoints());
    section.querySelector('h1')?.insertAdjacentElement('afterend',root);
  }

  const tracking0=renderTracking;renderTracking=function(){tracking0();buildProgress()};
  const go0=go;go=function(screen){go0(screen);if(screen==='tracking')buildProgress()};
  document.documentElement.classList.add('her11-ready');
})();
