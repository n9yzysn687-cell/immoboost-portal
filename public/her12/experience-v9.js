(()=>{
  const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)];

  function workoutMode(on){
    document.documentElement.classList.toggle('her9-workout',Boolean(on));
  }

  function markCurrentSet(){
    const rows=qq('#setRows .setRow');
    let firstOpen=-1;
    rows.forEach((row,i)=>{
      const done=row.querySelector('.setCheck')?.classList.contains('done');
      row.classList.toggle('v9Done',Boolean(done));
      if(!done&&firstOpen<0)firstOpen=i;
      row.classList.remove('v9Current');
    });
    if(firstOpen>=0)rows[firstOpen]?.classList.add('v9Current');
    let hint=q('#v9SetHint');
    if(!hint&&q('#setRows')){hint=document.createElement('div');hint.id='v9SetHint';q('#setRows').insertAdjacentElement('afterend',hint)}
    if(hint){const done=rows.filter(r=>r.querySelector('.setCheck')?.classList.contains('done')).length;hint.textContent=done===rows.length?'Toutes les séries sont faites ✓':`${done}/${rows.length} séries terminées`;}
  }

  function simplifyExerciseNow(){
    workoutMode(true);
    const ex=getCurrentExercise();if(!ex)return;
    const validate=q('#validateExercise');
    if(validate)validate.textContent='Continuer';
    const pain=q('#painBtn');if(pain)pain.textContent='Douleur pendant le mouvement';
    markCurrentSet();
  }

  function simplifySummary(){
    workoutMode(false);
    const h=q('#summary h1');if(h)h.textContent='Séance terminée ✓';
    const p=q('#summary>.muted');if(p)p.textContent='Progression enregistrée.';
    const home=q('#summaryHome');if(home)home.textContent='Terminer';
  }

  function simplifyHome(){
    workoutMode(false);
    const card=q('#her4NextCard');
    if(card){
      const p=card.querySelector('p');
      if(p){p.textContent=p.textContent.replace(/\s*•\s*0\/\d+ exercices$/,'').replace(/\s*•\s*\d+\/\d+ exercices$/,'')}
      const cta=card.querySelector('.cta');if(cta&&cta.textContent==='Commencer maintenant')cta.textContent='Commencer';
    }
  }

  function simplifyProgram(){
    workoutMode(false);
    const title=q('#sessionTitle');
    if(title)title.textContent=title.textContent.replace(/^[^•]+•\s*/, '');
    const meta=q('#sessionMeta');if(meta)meta.textContent=meta.textContent.split('•')[0].trim();
  }

  function simplifyGuide(){workoutMode(false)}
  function simplifyTracking(){workoutMode(false)}

  const home0=renderHome;renderHome=function(){home0();simplifyHome()};
  const program0=renderProgram;renderProgram=function(){program0();simplifyProgram()};
  const exercise0=renderExercise;renderExercise=function(){exercise0();simplifyExerciseNow()};
  const summary0=renderSummary;renderSummary=function(){summary0();simplifySummary()};
  const tracking0=renderTracking;renderTracking=function(){tracking0();simplifyTracking()};
  const go0=go;go=function(screen){go0(screen);if(screen==='exercise')simplifyExerciseNow();else workoutMode(false);if(screen==='more')simplifyGuide()};

  document.addEventListener('click',event=>{
    if(event.target.closest('#setRows .setCheck'))requestAnimationFrame(markCurrentSet);
  },true);

  /* Shorten onboarding copy without changing choices or program generation. */
  function calmOnboarding(){
    const root=q('.her4Onboarding');if(!root)return;
    const steps=qq('.her4Step');
    steps.forEach(step=>{
      const n=step.dataset.step,p=step.querySelector('p');
      if(n==='1'&&p)p.textContent='Choisis 3 jours. HER12 place automatiquement les séances pour bien récupérer.';
      if(n==='2'&&p)p.textContent='Fessiers en priorité. Active simplement les autres zones que tu veux renforcer.';
    });
  }
  const mo=new MutationObserver(()=>calmOnboarding());
  mo.observe(document.body,{childList:true,subtree:true});

  document.documentElement.classList.add('her9-ready');
  calmOnboarding();
  renderHome();
})();