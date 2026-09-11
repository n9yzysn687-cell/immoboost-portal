(()=>{
  const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)];

  function draftSlot(){
    for(const key of Object.keys(state.drafts||{})){
      const [w,s]=key.split('|');
      if(Number(w)===state.week&&PROGRAM[s])return s;
    }
    return null;
  }
  function nextSlot(){
    const draft=draftSlot();if(draft)return draft;
    for(const s of ['A','B','C'])if(!state.completed[`${state.week}|${s}`])return s;
    return state.week<12?'A':null;
  }
  function shortFocus(session){
    const value=PROGRAM[session]?.focus||'';
    return value.replace('Séance principale ','').replace('Deuxième séance forte ','').replace('Bras plus fermes + ','').trim();
  }

  function homeVisual(){
    const card=q('#her4NextCard');if(!card)return;
    const slot=nextSlot();
    q('#v10WeekStrip')?.remove();
    card.querySelector('#v10SessionVisual')?.remove();
    if(!slot)return;
    const ses=PROGRAM[slot],ex=activeExercises(slot)?.[0]||ses.ex?.[0];
    if(ex){
      const visual=document.createElement('div');visual.id='v10SessionVisual';visual.className='v10SessionVisual';
      const img=document.createElement('img');img.alt='';img.decoding='async';img.loading='eager';setImage(img,ex.img,ses.name);
      const meta=document.createElement('div');meta.className='v10VisualMeta';
      const week=document.createElement('span');week.textContent=`Semaine ${state.week}`;
      const time=document.createElement('span');time.textContent=ses.duration;
      meta.append(week,time);visual.append(img,meta);card.insertBefore(visual,card.firstChild);
    }
    const strip=document.createElement('div');strip.id='v10WeekStrip';strip.className='v10WeekStrip';
    ['A','B','C'].forEach(s=>{
      const item=document.createElement('button');item.type='button';item.className='v10WeekItem';
      const done=Boolean(state.completed[`${state.week}|${s}`]);if(done)item.classList.add('done');if(s===slot)item.classList.add('next');
      const first=activeExercises(s)?.[0]||PROGRAM[s].ex?.[0],img=document.createElement('img');img.alt='';img.loading='lazy';img.decoding='async';if(first)setImage(img,first.img,PROGRAM[s].name);
      const text=document.createElement('span'),day=document.createElement('b'),focus=document.createElement('small');day.textContent=PROGRAM[s].day.slice(0,3);focus.textContent=done?'Terminée':shortFocus(s);text.append(day,focus);item.append(img,text);
      item.onclick=()=>{state.session=s;state.exerciseIndex=0;saveState(true);go('program')};strip.appendChild(item);
    });
    card.insertAdjacentElement('afterend',strip);
  }

  function exerciseBadge(){
    const media=q('#exercise .media');if(!media)return;
    let badge=q('#v10StepBadge');if(!badge){badge=document.createElement('div');badge.id='v10StepBadge';badge.className='v10StepBadge';media.appendChild(badge)}
    const count=activeExercises(state.session).length;badge.textContent=`${Math.min(state.exerciseIndex+1,count)} / ${count}`;
  }

  function polishPlan(){
    qq('#exerciseList .exerciseRow img').forEach(img=>{img.loading='lazy';img.decoding='async'});
  }

  const home0=renderHome;renderHome=function(){home0();homeVisual()};
  const program0=renderProgram;renderProgram=function(){program0();polishPlan()};
  const exercise0=renderExercise;renderExercise=function(){exercise0();exerciseBadge()};
  const go0=go;go=function(screen){go0(screen);if(screen==='home')homeVisual();if(screen==='program')polishPlan();if(screen==='exercise')exerciseBadge()};

  document.documentElement.classList.add('her10-ready');
  homeVisual();
})();
