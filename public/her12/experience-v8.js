(()=>{
  const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)];

  function quietNav(){
    const body=q('.bottom .nav[data-nav="body"]');
    if(body){body.setAttribute('aria-hidden','true');body.tabIndex=-1}
    const labels={home:['⌂','Aujourd’hui'],program:['▦','Plan'],tracking:['↗','Progrès'],more:['?','Guide']};
    qq('.bottom .nav').forEach(btn=>{const x=labels[btn.dataset.nav];if(x)btn.innerHTML=`<span>${x[0]}</span>${x[1]}`});
  }

  function compactWeekNav(){
    const tabs=q('#weekTabs'),sessions=q('#sessionTabs');
    if(!tabs||!sessions)return;
    let nav=q('#v8WeekNav');
    if(!nav){
      nav=document.createElement('div');nav.id='v8WeekNav';nav.setAttribute('aria-label','Changer de semaine');
      nav.innerHTML='<button type="button" data-dir="-1" aria-label="Semaine précédente">‹</button><strong></strong><button type="button" data-dir="1" aria-label="Semaine suivante">›</button>';
      tabs.insertAdjacentElement('afterend',nav);
      nav.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{
        const next=Math.min(12,Math.max(1,state.week+Number(btn.dataset.dir)));
        if(next===state.week)return;
        state.week=next;state.exerciseIndex=0;saveState(true);renderProgram();
      });
    }
    nav.querySelector('strong').textContent=`Semaine ${state.week} / 12`;
    nav.querySelector('[data-dir="-1"]').disabled=state.week<=1;
    nav.querySelector('[data-dir="1"]').disabled=state.week>=12;
  }

  function simplifyProgram(){
    compactWeekNav();
    const ready=q('#program .readinessCard>strong');if(ready)ready.textContent='Forme aujourd’hui';
    const h=q('#program>h1');if(h)h.textContent='Plan';
    const eyebrow=q('#program>.eyebrow');if(eyebrow)eyebrow.textContent=`Semaine ${state.week}`;
    q('#readyBtns [data-ready="great"]')?.replaceChildren(document.createTextNode('En forme'));
    q('#readyBtns [data-ready="normal"]')?.replaceChildren(document.createTextNode('Normal'));
    q('#readyBtns [data-ready="tired"]')?.replaceChildren(document.createTextNode('Fatiguée'));
  }

  function simplifyHome(){
    const eyebrow=q('#home .topHeader .eyebrow');if(eyebrow)eyebrow.textContent='HER12';
    const h=q('#home .topHeader h1');if(h)h.textContent='Aujourd’hui';
    const adapt=q('#her4NextCard .v5AdaptBtn');if(adapt)adapt.textContent='Options';
  }

  function simplifyExercise(){
    const ex=getCurrentExercise();if(!ex)return;
    const back=q('#backExercise');if(back)back.textContent='‹ Plan';
    const intro=q('#exercise .exerciseIntro');
    let meta=q('#v8ExerciseMeta');
    if(!meta&&intro){meta=document.createElement('div');meta.id='v8ExerciseMeta';intro.appendChild(meta)}
    if(meta){const count=ex.sets[phaseIndex()];meta.textContent=`${ex.target} · ${count} × ${ex.min}–${ex.max}`}
    const technique=q('#her4Technique');if(technique)technique.textContent='Technique & explications ›';
    const load=q('#loadInput');if(load)load.setAttribute('aria-label',`Charge pour ${ex.name}`);
    const validate=q('#validateExercise');if(validate&&validate.textContent.includes('Valider'))validate.textContent='Terminer l’exercice';
  }

  function simplifyTracking(){
    const h=q('#tracking>h1');if(h)h.textContent='Progrès';
    const eyebrow=q('#tracking>.eyebrow');if(eyebrow)eyebrow.textContent=`Semaine ${state.week}`;
  }

  function simplifyGuide(){
    const h=q('#more>h1');if(h)h.textContent='Guide';
    const eyebrow=q('#more>.eyebrow');if(eyebrow)eyebrow.textContent='Besoin d’aide ?';
  }

  const home0=renderHome;renderHome=function(){home0();simplifyHome();quietNav()};
  const program0=renderProgram;renderProgram=function(){program0();simplifyProgram();quietNav()};
  const exercise0=renderExercise;renderExercise=function(){exercise0();simplifyExercise();quietNav()};
  const tracking0=renderTracking;renderTracking=function(){tracking0();simplifyTracking();quietNav()};
  const go0=go;go=function(screen){go0(screen);if(screen==='more')simplifyGuide();quietNav()};

  document.documentElement.classList.add('her8-ready');
  quietNav();
  renderHome();
})();