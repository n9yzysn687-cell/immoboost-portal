(()=>{
  const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)];

  function nextSessionTarget(){
    for(const s of ["A","B","C"]) if(!state.completed[`${state.week}|${s}`]) return{week:state.week,session:s};
    return state.week<12?{week:state.week+1,session:"A"}:null;
  }
  function firstUnfinishedIndex(session){
    const list=activeExercises(session);
    const i=list.findIndex(ex=>!state.records[recordKey(session,ex.id)]);
    return i<0?0:i;
  }

  /* Repair a legacy markup nesting issue without forcing a migration of saved installs. */
  function repairLoadControl(){
    const plus=q("#plusLoad"),control=q("#exercise .loadControl");
    if(plus&&control&&plus.parentElement!==control)control.appendChild(plus);
  }

  /* One-tap start from Today. The Plan stays available, but it is no longer a mandatory stop. */
  function directStart(){
    const card=q("#her4NextCard"),button=card?.querySelector(".cta");
    if(!button||button.textContent.trim()==="Reprendre") return;
    const target=nextSessionTarget();
    if(!target) return;
    button.textContent=target.week>state.week?"Commencer la semaine suivante":"Commencer maintenant";
    button.onclick=()=>{
      state.week=target.week;
      state.session=target.session;
      state.exerciseIndex=firstUnfinishedIndex(target.session);
      saveState(true);
      go("program");
      requestAnimationFrame(()=>{
        const rows=qq("#exerciseList .exerciseRow");
        const row=rows[state.exerciseIndex]||rows[0];
        row?.click();
      });
    };
  }

  function setNativeChoice(feel,form){
    const feelBox=q("#feelBtns"),formBox=q("#formBtns");
    if(feelBox){feelBox.dataset.value=feel;feelBox.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.feel===feel))}
    if(formBox){formBox.dataset.value=form;formBox.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.form===form))}
  }
  function nativeChoice(){return{feel:q("#feelBtns")?.dataset.value||"",form:q("#formBtns")?.dataset.value||""}}

  /* Collapse two questionnaires into one gym-friendly decision. Runtime still receives the same safe values. */
  function ratingBlock(){
    const logging=q("#exercise .loggingCard"),effort=q("#exercise .effortBlock"),form=q("#exercise .formBlock");
    if(!logging||!effort||!form) return;
    effort.classList.add("her7NativeHidden");
    form.classList.add("her7NativeHidden");
    let box=q("#v7Rating");
    if(!box){
      box=document.createElement("div");box.id="v7Rating";box.className="v7Rating";
      box.innerHTML='<div class="v7RatingTitle"><b>Comment était l’exercice ?</b><span>1 toucher</span></div><div class="v7RatingBtns"><button type="button" data-rate="easy"><strong>🙂 Facile</strong><small>Propre, encore 4+ reps</small></button><button type="button" data-rate="good"><strong>✅ Bien</strong><small>Difficile mais propre</small></button><button type="button" data-rate="hard"><strong>😣 Trop lourd</strong><small>Technique qui se dégrade</small></button></div>';
      form.insertAdjacentElement("afterend",box);
    }
    const value=nativeChoice();
    const selected=value.feel==="easy"&&value.form==="clean"?"easy":value.feel==="good"&&["clean","ok"].includes(value.form)?"good":value.feel==="hard"||value.form==="bad"?"hard":"";
    box.querySelectorAll("[data-rate]").forEach(btn=>{
      btn.classList.toggle("active",btn.dataset.rate===selected);
      btn.onclick=()=>{
        const rate=btn.dataset.rate;
        if(rate==="easy")setNativeChoice("easy","clean");
        if(rate==="good")setNativeChoice("good","clean");
        if(rate==="hard")setNativeChoice("hard","bad");
        box.querySelectorAll("[data-rate]").forEach(x=>x.classList.toggle("active",x===btn));
        completionAssist();
      };
    });
  }

  /* Notes stay available without living in the primary flow. */
  function compactNote(){
    const note=q("#exerciseNote");if(!note)return;
    note.classList.add("v7NoteCollapsed");
    let toggle=q("#v7NoteToggle");
    if(!toggle){toggle=document.createElement("button");toggle.id="v7NoteToggle";toggle.type="button";toggle.className="v7NoteToggle";note.insertAdjacentElement("beforebegin",toggle)}
    const has=Boolean(note.value.trim());
    note.classList.toggle("v7NoteOpen",has);
    toggle.textContent=has?"Masquer la note":"+ Ajouter une note";
    toggle.onclick=()=>{
      const open=!note.classList.contains("v7NoteOpen");note.classList.toggle("v7NoteOpen",open);toggle.textContent=open?"Masquer la note":"+ Ajouter une note";if(open)setTimeout(()=>note.focus(),30);
    };
  }

  /* Previous reps can be reused in one touch when the same exercise comes back. */
  function reuseLastReps(){
    const ex=getCurrentExercise(),prev=ex?previousRecord(state.session,ex.id):null,rows=qq("#setRows .repValue");
    let b=q("#v7Reuse");
    if(!prev||!rows.length){b?.remove();return}
    if(!b){b=document.createElement("button");b.id="v7Reuse";b.type="button";b.className="v7Reuse";q("#exercise .setsHeader")?.insertAdjacentElement("afterend",b)}
    const reps=prev.reps||[];b.textContent=`↻ Reprendre ${reps.slice(0,rows.length).join(" / ")} reps`;
    b.onclick=()=>{rows.forEach((r,i)=>{if(Number.isFinite(Number(reps[i])))r.textContent=reps[i]});b.textContent="✓ Répétitions reprises";setTimeout(()=>{b.textContent=`↻ Reprendre ${reps.slice(0,rows.length).join(" / ")} reps`},1000)};
  }

  function completionAssist(){
    const checks=qq("#setRows .setCheck"),all=checks.length&&checks.every(x=>x.classList.contains("done")),rating=q("#v7Rating"),validate=q("#validateExercise"),choice=nativeChoice(),pain=choice.feel==="pain";
    if(!rating||!validate)return;
    rating.classList.toggle("v7Attention",all&&!choice.feel&&!pain);
    validate.classList.toggle("v7Ready",pain||(all&&Boolean(choice.feel)&&Boolean(choice.form)));
    validate.setAttribute("aria-disabled",String(!(pain||(all&&choice.feel&&choice.form))));
    if(all&&!choice.feel&&!pain)setTimeout(()=>rating.scrollIntoView({behavior:"smooth",block:"center"}),80);
  }

  function progressLabel(){
    const exs=activeExercises(state.session),done=exs.filter(ex=>state.records[recordKey(state.session,ex.id)]).length;
    const top=q("#v5ExerciseProgress .v5ProgressTop span:first-child");
    if(top)top.textContent=`${PROGRAM[state.session].day} • ${done}/${exs.length} terminés`;
  }

  const exercise0=renderExercise;
  renderExercise=function(){
    exercise0();repairLoadControl();ratingBlock();compactNote();reuseLastReps();progressLabel();completionAssist();
  };

  /* Prevent accidental completion: all prescribed sets must be checked, except when pain stops the exercise. */
  document.addEventListener("click",event=>{
    if(event.target.closest("#setRows .setCheck"))setTimeout(completionAssist,20);
    if(event.target.closest("#painBtn"))setTimeout(completionAssist,20);
    const validate=event.target.closest("#validateExercise");
    if(!validate)return;
    const choice=nativeChoice(),pain=choice.feel==="pain",checks=qq("#setRows .setCheck"),all=checks.length&&checks.every(x=>x.classList.contains("done"));
    if(!pain&&!all){event.preventDefault();event.stopImmediatePropagation();const d=q("#decision");if(d){d.className="decision bad";d.textContent="Termine ou coche chaque série avant de valider."}q("#setRows")?.scrollIntoView({behavior:"smooth",block:"center"});return}
    if(!pain&&(!choice.feel||!choice.form)){event.preventDefault();event.stopImmediatePropagation();q("#v7Rating")?.classList.add("v7Attention");q("#v7Rating")?.scrollIntoView({behavior:"smooth",block:"center"})}
  },true);

  /* Make Today feel current without adding another dashboard widget. */
  function todayLabel(){
    const sub=q("#home .topHeader .muted");if(!sub)return;
    const day=new Intl.DateTimeFormat("fr-BE",{weekday:"long"}).format(new Date());
    sub.textContent=`${day.charAt(0).toUpperCase()+day.slice(1)} • semaine ${state.week}`;
  }
  const home0=renderHome;
  renderHome=function(){home0();todayLabel();directStart()};

  document.documentElement.classList.add("her7-ready");
  renderHome();
})();

/* Quiet UI pass: reuse the proven v7 behavior while removing visual clutter. */
(()=>{
  const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)];

  function quietNav(){
    const body=q('.bottom .nav[data-nav="body"]');
    if(body){body.setAttribute('aria-hidden','true');body.tabIndex=-1}
    const labels={home:['⌂','Aujourd’hui'],program:['▦','Plan'],tracking:['↗','Progrès'],more:['?','Guide']};
    qq('.bottom .nav').forEach(btn=>{const x=labels[btn.dataset.nav];if(x)btn.innerHTML=`<span>${x[0]}</span>${x[1]}`});
  }

  function compactWeekNav(){
    const tabs=q('#weekTabs');if(!tabs)return;
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
    const texts={great:'En forme',normal:'Normal',tired:'Fatiguée'};
    qq('#readyBtns button').forEach(btn=>{if(texts[btn.dataset.ready])btn.textContent=texts[btn.dataset.ready]});
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
