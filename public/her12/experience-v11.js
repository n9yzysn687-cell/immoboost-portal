(()=>{
  const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)];
  let restWasRunning=false;

  /* Research-backed practical rest targets.
     Longer rests protect performance on demanding compound lifts; smaller movements stay compact. */
  const REST_PROFILE={
    hip:150,rdl:150,bulg:120,abd:90,
    lat:120,row:120,chest:120,tri:90,raise:75,ohtri:90,pallof:75,
    press:150,hip2:120,step:120,kick:75,abs:90
  };
  Object.values(PROGRAM).forEach(session=>session.ex.forEach(ex=>{if(REST_PROFILE[ex.id])ex.rest=REST_PROFILE[ex.id]}));

  function rows(){return qq('#setRows .setRow')}
  function checks(){return qq('#setRows .setCheck')}
  function firstOpenIndex(){return checks().findIndex(x=>!x.classList.contains('done'))}
  function allDone(){const c=checks();return c.length>0&&c.every(x=>x.classList.contains('done'))}
  function fmtRest(sec){const m=Math.floor(sec/60),s=sec%60;return s?`${m}:${String(s).padStart(2,'0')}`:`${m} min`}

  function guideSets({scroll=false}={}){
    const rs=rows(),cs=checks(),ex=getCurrentExercise();if(!rs.length||!ex)return;
    const active=firstOpenIndex(),done=cs.filter(x=>x.classList.contains('done')).length;
    rs.forEach((row,i)=>{
      row.classList.toggle('v11SetDone',cs[i]?.classList.contains('done'));
      row.classList.toggle('v11SetActive',i===active);
      row.classList.toggle('v11SetLater',active>=0&&i>active);
    });
    let hint=q('#v11SetGuide');
    if(!hint){hint=document.createElement('div');hint.id='v11SetGuide';hint.className='v11SetGuide';q('#setRows')?.insertAdjacentElement('beforebegin',hint)}
    if(hint){
      if(done===rs.length)hint.innerHTML='<strong>Tout est fait ✓</strong><span>Choisis ton ressenti, puis passe à l’exercice suivant.</span>';
      else hint.innerHTML=`<strong>Série ${active+1} / ${rs.length}</strong><span>${ex.min}–${ex.max} reps · puis ✓ · repos ${fmtRest(ex.rest)}</span>`;
    }
    if(scroll&&active>=0)rs[active]?.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function timerNextLabel(){
    const timer=q('#restTimer');if(!timer)return null;
    let label=q('#v11TimerNext');
    if(!label){label=document.createElement('div');label.id='v11TimerNext';label.className='v11TimerNext';timer.querySelector('.muted')?.insertAdjacentElement('afterend',label)}
    return label;
  }

  function setRestMode(on,scroll=false){
    document.documentElement.classList.toggle('her11-resting',Boolean(on));
    const label=timerNextLabel(),next=firstOpenIndex(),total=checks().length;
    const title=q('#restTimer .muted');if(title)title.textContent=on?'Repos recommandé':'Repos';
    if(label)label.textContent=on&&next>=0?`Puis série ${next+1} / ${total}`:'';
    if(!on&&scroll)guideSets({scroll:true});
  }

  const startTimer0=startTimer;
  startTimer=function(sec){
    guideSets();
    if(allDone()){
      clearInterval(timerHandle);
      q('#restTimer')?.classList.add('hidden');
      setRestMode(false);
      setTimeout(()=>q('#v7Rating')?.scrollIntoView({behavior:'smooth',block:'center'}),80);
      return;
    }
    restWasRunning=true;
    startTimer0(sec);
    setRestMode(true);
  };

  const updateTimer0=updateTimer;
  updateTimer=function(){
    const wasRemaining=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));
    updateTimer0();
    const nowRemaining=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));
    if(restWasRunning&&wasRemaining>0&&nowRemaining<=0){
      restWasRunning=false;
      setTimeout(()=>setRestMode(false,true),180);
    }
  };

  const exercise0=renderExercise;
  renderExercise=function(){exercise0();requestAnimationFrame(()=>guideSets())};

  document.addEventListener('click',event=>{
    if(event.target.closest('#setRows .setCheck'))requestAnimationFrame(()=>guideSets());
    if(event.target.closest('#timerSkip')){
      restWasRunning=false;
      setTimeout(()=>setRestMode(false,true),30);
    }
  },true);

  document.documentElement.classList.add('her11-ready');
  if(!q('#exercise')?.classList.contains('hidden'))guideSets();
})();

/* Load the adaptive coach after the rest-flow layer is ready. */
(()=>{
  if(!document.querySelector('link[data-her12-layer="v12"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='./experience-v12.css';css.dataset.her12Layer='v12';document.head.appendChild(css)}
  if(!document.querySelector('script[data-her12-layer="v12"]')){const js=document.createElement('script');js.src='./experience-v12.js';js.async=false;js.dataset.her12Layer='v12';document.body.appendChild(js)}
})();
