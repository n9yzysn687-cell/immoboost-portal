(()=>{
  const MODE_STORE="HER12_TODAY_V5",FEEDBACK_STORE="HER12_FEEDBACK_V5";
  const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)];
  const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
  let modes=read(MODE_STORE,{}),feedback=read(FEEDBACK_STORE,{});
  const saveModes=()=>{try{localStorage.setItem(MODE_STORE,JSON.stringify(modes))}catch{}};
  const saveFeedback=()=>{try{localStorage.setItem(FEEDBACK_STORE,JSON.stringify(feedback))}catch{}};
  const modeKey=(session=state.session,week=state.week)=>`${week}|${session}`;
  const currentMode=(session=state.session,week=state.week)=>modes[modeKey(session,week)]||"standard";
  const modeMeta=mode=>mode==="express"?{label:"Express",time:"≈ 35 min",icon:"⚡"}:mode==="recovery"?{label:"Allégée",time:"≈ 30 min",icon:"🌿"}:{label:"Standard",time:"séance complète",icon:"🔥"};

  /* Daily adaptation: temporary, local to one session. It never rewrites the 12-week program. */
  const active0=activeExercises;
  activeExercises=function(session=state.session,week=state.week){
    const list=active0(session,week),mode=currentMode(session,week);
    if(mode==="standard"||list.length<=3)return list;
    const mains=list.filter(ex=>ex.priority==="main"),secondary=list.filter(ex=>ex.priority!=="main");
    const keep=mode==="express"?[...mains,...secondary.slice(0,Math.max(0,4-mains.length))]:[...mains.slice(0,3),...secondary.slice(0,Math.max(0,3-Math.min(3,mains.length)))];
    const ids=new Set(keep.map(ex=>ex.id));return list.filter(ex=>ids.has(ex.id));
  };

  function hasStarted(session=state.session,week=state.week){return PROGRAM[session]?.ex?.some(ex=>Boolean(state.records[recordKey(session,ex.id,week)]))||false}
  function draftSession(){for(const key of Object.keys(state.drafts||{})){const [w,s]=key.split("|");if(Number(w)===state.week)return s}return null}
  function nextSlot(){const draft=draftSession();if(draft)return draft;for(const s of["A","B","C"])if(!state.completed[`${state.week}|${s}`])return s;return state.week<12?"A":null}
  function durationText(session,mode=currentMode(session)){const base=PROGRAM[session]?.duration||"";return mode==="standard"?base:modeMeta(mode).time}

  function setMode(session,mode){
    if(hasStarted(session)){return false}
    if(mode==="standard")delete modes[modeKey(session)];else modes[modeKey(session)]=mode;
    state.readiness=state.readiness||{};state.readiness[modeKey(session)]=mode==="recovery"?"tired":"normal";
    saveModes();saveState(true);return true;
  }

  function closeSheet(){q("#v5Sheet")?.remove()}
  function openSheet(session){
    closeSheet();const locked=hasStarted(session),selected=currentMode(session),ses=PROGRAM[session];
    const root=document.createElement("div");root.id="v5Sheet";root.className="v5Sheet";root.innerHTML=`<div class="v5SheetPanel" role="dialog" aria-modal="true" aria-label="Adapter la séance"><div class="v5Grabber"></div><h2>Adapter aujourd’hui</h2><p>${ses.day} • ${ses.name}. Le programme de fond ne change pas.</p>${locked?'<div class="v5Locked">La séance a déjà commencé. Le format est verrouillé pour garder un suivi cohérent.</div>':''}<button class="v5Mode ${selected==="standard"?'active':''}" data-mode="standard" ${locked?'disabled':''}><span class="v5ModeIcon">🔥</span><span><b>Standard</b><small>Tout le programme prévu aujourd’hui</small></span><span>${ses.duration}</span></button><button class="v5Mode ${selected==="express"?'active':''}" data-mode="express" ${locked?'disabled':''}><span class="v5ModeIcon">⚡</span><span><b>Express</b><small>Priorités conservées, accessoires réduits</small></span><span>≈ 35 min</span></button><button class="v5Mode ${selected==="recovery"?'active':''}" data-mode="recovery" ${locked?'disabled':''}><span class="v5ModeIcon">🌿</span><span><b>Allégée</b><small>Fatigue élevée : essentiels seulement, aucune hausse automatique</small></span><span>≈ 30 min</span></button><button class="v5SheetClose">Fermer</button></div>`;
    document.body.appendChild(root);root.addEventListener("click",event=>{if(event.target===root)closeSheet()});root.querySelector(".v5SheetClose").onclick=closeSheet;
    root.querySelectorAll("[data-mode]").forEach(btn=>btn.onclick=()=>{if(!setMode(session,btn.dataset.mode))return;closeSheet();renderHome();if(!q("#program")?.classList.contains("hidden")){state.session=session;renderProgram()}});
  }

  function addAdapt(target,session){
    if(!target||!session)return;target.querySelector(".v5AdaptRow")?.remove();const mode=currentMode(session),meta=modeMeta(mode),row=document.createElement("div");row.className="v5AdaptRow";row.innerHTML=`<div class="v5AdaptMeta"><b>${meta.icon} ${meta.label}</b><span>${durationText(session,mode)}</span></div><button class="v5AdaptBtn" type="button">Adapter</button>`;row.querySelector("button").onclick=()=>openSheet(session);target.appendChild(row);
  }

  function enhanceHome(){
    document.documentElement.classList.add("her5-ready");const h=q("#home .topHeader h1"),sub=q("#home .topHeader .muted");if(h)h.textContent="Aujourd’hui";if(sub)sub.textContent=`Semaine ${state.week} • ton coach du jour`;
    const slot=nextSlot();if(slot)addAdapt(q("#her4NextCard"),slot);
  }
  const home0=renderHome;renderHome=function(){home0();enhanceHome()};

  function coachBar(){
    const list=q("#exerciseList");if(!list)return;let bar=q("#v5CoachBar");if(!bar){bar=document.createElement("div");bar.id="v5CoachBar";bar.className="v5CoachBar";list.insertAdjacentElement("beforebegin",bar)}const meta=modeMeta(currentMode());bar.replaceChildren();const text=document.createElement("div"),strong=document.createElement("strong"),small=document.createElement("span"),btn=document.createElement("button");strong.textContent=`${meta.icon} ${meta.label}`;small.textContent=`${durationText(state.session)} • ${activeExercises(state.session).length} exercices`;text.append(strong,small);btn.type="button";btn.textContent="Adapter";btn.onclick=()=>openSheet(state.session);bar.append(text,btn);
  }
  const program0=renderProgram;renderProgram=function(){program0();coachBar();const h=q("#program>h1");if(h)h.textContent="Ton plan"};

  function exerciseProgress(){
    const exs=activeExercises(state.session),index=Math.max(0,state.exerciseIndex),host=q("#exercise .exerciseIntro");if(!host)return;let box=q("#v5ExerciseProgress");if(!box){box=document.createElement("div");box.id="v5ExerciseProgress";box.className="v5ExerciseProgress";host.insertAdjacentElement("afterend",box)}const pct=exs.length?(index/exs.length)*100:0;box.innerHTML=`<div class="v5ProgressTop"><span>${PROGRAM[state.session].day}</span><span>${index+1} / ${exs.length}</span></div><div class="progress"><span style="width:${pct}%"></span></div>`;
    const effort=q("#feelBtns");if(effort){const labels={easy:["🙂 Facile","Encore 4+"],good:["✅ Bien","Encore 1–3"],hard:["😣 Lourd","0 / forme cassée"]};effort.querySelectorAll("button").forEach(b=>{const x=labels[b.dataset.feel];if(x)b.innerHTML=`${x[0]}<span>${x[1]}</span>`})}
  }
  const exercise0=renderExercise;renderExercise=function(){exercise0();exerciseProgress()};

  function addFeedback(){
    const list=q("#summaryList");if(!list)return;let card=q("#v5Feedback");if(!card){card=document.createElement("div");card.id="v5Feedback";card.className="v5Feedback";list.insertAdjacentElement("afterend",card)}const key=modeKey(),value=feedback[key]||"";card.innerHTML=`<b>Comment était la séance ?</b><p>Un toucher suffit. Ce retour reste sur cet appareil.</p><div class="v5FeedbackBtns"><button data-rate="easy">🙂 Facile</button><button data-rate="good">✅ Juste bien</button><button data-rate="hard">😮‍💨 Dure</button></div>`;card.querySelectorAll("button").forEach(b=>{b.classList.toggle("active",b.dataset.rate===value);b.onclick=()=>{feedback[key]=b.dataset.rate;saveFeedback();card.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b))}})
  }
  const summary0=renderSummary;renderSummary=function(){summary0();addFeedback()};

  function trackingShortcut(){
    const section=q("#tracking");if(!section)return;let b=q("#v5Measures");if(!b){b=document.createElement("button");b.id="v5Measures";b.className="v5MeasureShortcut";b.type="button";b.innerHTML='<span><b>Mensurations</b><span>Poids, taille, hanches, bras, cuisse</span></span><strong>›</strong>';section.querySelector(".kpis")?.insertAdjacentElement("afterend",b);b.onclick=()=>go("body")}
  }
  const tracking0=renderTracking;renderTracking=function(){tracking0();trackingShortcut()};

  function navLabels(){const map={home:["⌂","Aujourd’hui"],program:["🏋","Plan"],tracking:["▥","Progrès"],more:["◎","Guide"]};qq(".bottom .nav").forEach(b=>{const x=map[b.dataset.nav];if(x)b.innerHTML=`<span>${x[0]}</span>${x[1]}`})}
  navLabels();

  /* Tiny tactile acknowledgement where supported. iOS safely ignores navigator.vibrate. */
  document.addEventListener("click",event=>{if(event.target.closest(".cta,.roundBtn,.setCheck,.v5Mode")&&navigator.vibrate)navigator.vibrate(8)},{passive:true});

  /* Repaint once after all previous experience layers have initialised. */
  renderHome();
})();
