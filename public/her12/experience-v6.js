(()=>{
  const FLOW_STORE="HER12_FLOW_V6",FEEDBACK_STORE="HER12_FEEDBACK_V5";
  const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)];
  const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
  let flow=read(FLOW_STORE,{warmup:{},deferred:{},cooldown:{}});
  flow.warmup=flow.warmup||{};flow.deferred=flow.deferred||{};flow.cooldown=flow.cooldown||{};
  const saveFlow=()=>{try{localStorage.setItem(FLOW_STORE,JSON.stringify(flow))}catch{}};
  const sessionKey=(session=state.session,week=state.week)=>`${week}|${session}`;
  const exKey=(session,id,week=state.week)=>`${week}|${session}|${id}`;
  const sessionHasStarted=(session=state.session,week=state.week)=>PROGRAM[session]?.ex?.some(ex=>Boolean(state.records[recordKey(session,ex.id,week)]))||Object.keys(state.drafts||{}).some(k=>k.startsWith(`${week}|${session}|`));

  function toast(text){
    let box=q("#v6Toast");if(!box){box=document.createElement("div");box.id="v6Toast";box.className="v6Toast";document.body.appendChild(box)}
    box.textContent=text;box.classList.add("show");clearTimeout(box._t);box._t=setTimeout(()=>box.classList.remove("show"),1800);
  }

  function closeWarmup(){q("#v6Warmup")?.remove()}
  function openWarmup(session,continuation){
    if(flow.warmup[sessionKey(session)]){continuation?.();return}
    closeWarmup();const ses=PROGRAM[session],first=activeExercises(session)[0];
    const root=document.createElement("div");root.id="v6Warmup";root.className="v6Warmup";
    root.innerHTML=`<div class="v6WarmPanel" role="dialog" aria-modal="true" aria-label="Échauffement"><div class="v6Grab"></div><div class="v6Overline">Avant de commencer</div><h2>Échauffement rapide</h2><p>${ses.day} • ${ses.name}</p><div class="v6WarmStep"><span>1</span><div><b>3–5 min faciles</b><small>Marche, vélo ou elliptique. Juste assez pour te réchauffer.</small></div></div><div class="v6WarmStep"><span>2</span><div><b>${first?.name||"Premier exercice"} très léger</b><small>Fais 8–10 répétitions sans chercher l’effort.</small></div></div><div class="v6WarmStep"><span>3</span><div><b>Une série d’approche</b><small>Un peu plus lourd, toujours facile et propre.</small></div></div><button class="cta" data-warm="done">Je suis prête</button><button class="v6TextBtn" data-warm="skip">Passer l’échauffement</button></div>`;
    document.body.appendChild(root);
    root.addEventListener("click",e=>{if(e.target===root)closeWarmup()});
    root.querySelector('[data-warm="done"]').onclick=()=>{flow.warmup[sessionKey(session)]="done";saveFlow();closeWarmup();continuation?.()};
    root.querySelector('[data-warm="skip"]').onclick=()=>{flow.warmup[sessionKey(session)]="skipped";saveFlow();closeWarmup();continuation?.()};
  }

  const createRow0=createExerciseRow;
  createExerciseRow=function(ex,index){
    const row=createRow0(ex,index),original=row.onclick,key=exKey(state.session,ex.id);
    if(flow.deferred[key]&&!state.records[recordKey(state.session,ex.id)]){const last=row.querySelector("small:last-of-type");if(last){last.textContent="À faire plus tard";last.classList.add("v6DeferredText")}}
    row.onclick=event=>{
      const enter=()=>original?.call(row,event);
      if(!sessionHasStarted(state.session)&&!flow.warmup[sessionKey()])openWarmup(state.session,enter);else enter();
    };
    return row;
  };

  function nextUnfinished(excludeId){
    const list=activeExercises(state.session),start=Math.max(0,state.exerciseIndex);
    for(let pass=0;pass<2;pass++){
      const from=pass===0?start+1:0,to=pass===0?list.length:start+1;
      for(let i=from;i<to;i++){const ex=list[i];if(ex.id!==excludeId&&!state.records[recordKey(state.session,ex.id)])return i}
    }
    return -1;
  }

  function addDeferButton(){
    const ex=getCurrentExercise();if(!ex)return;let b=q("#v6Defer");
    if(!b){b=document.createElement("button");b.id="v6Defer";b.type="button";b.className="v6Defer";const anchor=q("#her4Technique")||q("#smartTargetCard")||q("#exercise .media");anchor?.insertAdjacentElement("afterend",b)}
    b.textContent="Équipement indisponible ? Faire plus tard";
    b.onclick=()=>{
      flow.deferred[exKey(state.session,ex.id)]=true;saveFlow();const next=nextUnfinished(ex.id);
      if(next<0){toast("Reviens sur cet exercice dès que l’équipement se libère.");go("program");return}
      state.exerciseIndex=next;saveState(true);renderExercise();toast("Exercice gardé pour plus tard");window.scrollTo(0,0);
    };
  }

  function setCounter(){
    const rows=qq("#setRows .setCheck"),done=rows.filter(x=>x.classList.contains("done")).length;let c=q("#v6SetCounter");
    if(!c){c=document.createElement("span");c.id="v6SetCounter";c.className="v6SetCounter";q("#exercise .setsHeader")?.appendChild(c)}
    c.textContent=`${done}/${rows.length}`;const validate=q("#validateExercise");if(validate&&rows.length)validate.textContent=done===rows.length?"Terminer l’exercice →":"Valider et continuer";
  }

  function animateExercise(){const s=q("#exercise");if(!s)return;s.classList.remove("v6Enter");requestAnimationFrame(()=>{s.classList.add("v6Enter");setTimeout(()=>s.classList.remove("v6Enter"),220)})}
  const exercise0=renderExercise;
  renderExercise=function(){
    exercise0();
    const current=getCurrentExercise();if(current&&state.records[recordKey(state.session,current.id)]){delete flow.deferred[exKey(state.session,current.id)];saveFlow()}
    addDeferButton();setCounter();animateExercise();
  };
  document.addEventListener("click",e=>{if(e.target.closest("#setRows .setCheck"))setTimeout(setCounter,0);if(e.target.closest("#painBtn")){const v=q("#validateExercise");if(v)v.textContent="Enregistrer l’arrêt →"}},{passive:true});

  function coachHint(){
    const feedback=read(FEEDBACK_STORE,{}),ordered=[];for(let w=1;w<=state.week;w++)for(const s of["A","B","C"]){if(state.completed[`${w}|${s}`])ordered.push(feedback[`${w}|${s}`])}
    const recent=ordered.filter(Boolean).slice(-2);let card=q("#v6CoachHint");if(recent.length===2&&recent.every(x=>x==="hard")){
      if(!card){card=document.createElement("div");card.id="v6CoachHint";card.className="v6CoachHint";q("#her4NextCard")?.insertAdjacentElement("afterend",card)}
      card.innerHTML='<b>🌿 Deux séances difficiles récemment</b><span>Si la fatigue est encore là, touche « Adapter » et choisis Allégée aujourd’hui.</span>';
    }else card?.remove();
  }
  const home0=renderHome;renderHome=function(){home0();coachHint()};

  function addCooldown(){
    let card=q("#v6Cooldown");if(card)return;card=document.createElement("div");card.id="v6Cooldown";card.className="v6Cooldown";
    card.innerHTML='<div><b>Retour au calme</b><span>Optionnel • 5 min de marche ou vélo tranquille</span></div><div class="v6CoolBtns"><button data-cool="start">Lancer 5 min</button><button data-cool="skip">Pas maintenant</button></div>';
    const feedback=q("#v5Feedback"),anchor=feedback||q("#summaryList");anchor?.insertAdjacentElement("afterend",card);
    card.querySelector('[data-cool="start"]').onclick=()=>{flow.cooldown[sessionKey()]="done";saveFlow();startTimer(300);const label=q("#restTimer .muted");if(label)label.textContent="Retour au calme";card.classList.add("done");card.querySelector("div:first-child span").textContent="5 minutes lancées ✓"};
    card.querySelector('[data-cool="skip"]').onclick=()=>{flow.cooldown[sessionKey()]="skipped";saveFlow();card.remove()};
  }
  const summary0=renderSummary;renderSummary=function(){summary0();addCooldown()};

  /* Clean completed/dead deferred flags when the related exercise was eventually logged. */
  Object.keys(flow.deferred).forEach(key=>{if(state.records[key])delete flow.deferred[key]});saveFlow();
  renderHome();
})();
