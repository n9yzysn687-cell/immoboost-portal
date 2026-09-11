(()=>{
  const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)];
  let restWasRunning=false;

  function rows(){return qq('#setRows .setRow')}
  function checks(){return qq('#setRows .setCheck')}
  function firstOpenIndex(){return checks().findIndex(x=>!x.classList.contains('done'))}
  function allDone(){const c=checks();return c.length>0&&c.every(x=>x.classList.contains('done'))}

  function guideSets({scroll=false}={}){
    const rs=rows(),cs=checks();if(!rs.length)return;
    const active=firstOpenIndex(),done=cs.filter(x=>x.classList.contains('done')).length;
    rs.forEach((row,i)=>{
      row.classList.toggle('v11SetDone',cs[i]?.classList.contains('done'));
      row.classList.toggle('v11SetActive',i===active);
      row.classList.toggle('v11SetLater',active>=0&&i>active);
    });
    let hint=q('#v11SetGuide');
    if(!hint){hint=document.createElement('div');hint.id='v11SetGuide';hint.className='v11SetGuide';q('#setRows')?.insertAdjacentElement('beforebegin',hint)}
    if(hint){
      if(done===rs.length)hint.innerHTML='<strong>Séries terminées ✓</strong><span>Indique simplement ton ressenti puis continue.</span>';
      else hint.innerHTML=`<strong>Série ${active+1} / ${rs.length}</strong><span>Fais les reps prévues, puis coche ✓. Le repos démarre automatiquement.</span>`;
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
    if(label)label.textContent=on&&next>=0?`Puis série ${next+1} / ${total}`:'';
    if(!on&&scroll){guideSets({scroll:true})}
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
