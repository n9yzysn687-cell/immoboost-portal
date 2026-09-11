(()=>{
  const HER3_VERSION="3.0";
  const herQ=s=>document.querySelector(s),herQQ=s=>[...document.querySelectorAll(s)];
  const herPreloaded=new Set();
  let herWakeLock=null,herOnlineTimer=null;

  function herPreloadImage(file,high=false){
    if(!file||herPreloaded.has(file))return;
    herPreloaded.add(file);
    const href=`./assets/${file}`;
    const link=document.createElement("link");
    link.rel="preload";link.as="image";link.href=href;
    if(high)link.fetchPriority="high";
    document.head.appendChild(link);
    const img=new Image();img.decoding="async";img.src=href;
  }

  setImage=function(img,filename,alt=""){
    if(!img)return;
    img.alt=alt;
    img.decoding="async";
    const critical=img.id==="heroImage"||img.id==="exerciseImage";
    img.loading=critical?"eager":"lazy";
    if(critical)img.fetchPriority="high";
    img.onerror=()=>{
      img.classList.add("mediaMissing");
      img.parentElement?.querySelector(".mediaFallback")?.classList.remove("hidden");
    };
    img.onload=()=>{
      img.classList.remove("mediaMissing");
      img.parentElement?.querySelector(".mediaFallback")?.classList.add("hidden");
    };
    const src=`./assets/${filename}`;
    if(img.getAttribute("src")!==src)img.src=src;
  };

  const herBaseRecommendation=recommendation;
  recommendation=function(ex,load,reps,feel,form){
    const result=herBaseRecommendation(ex,load,reps,feel,form);
    const prev=previousRecord(state.session,ex.id);
    if(!prev||feel==="pain"||result.kind==="bad")return result;
    const prevLoad=Number(prev.load),prevNext=Number(prev.next??prev.load),prevTotal=(prev.reps||[]).reduce((a,b)=>a+Number(b||0),0),nowTotal=reps.reduce((a,b)=>a+Number(b||0),0);
    if(result.next>load&&(prev.feel==="pain"||prev.form==="pain"||prev.kind==="bad")){
      return{kind:"more",text:`🧠 Séance de stabilisation : reste à ${roundValue(load)} ${ex.unit} encore une fois. La séance précédente demandait déjà de corriger la charge ou la technique.`,next:load};
    }
    if(result.next===load&&Number.isFinite(prevLoad)&&prevLoad===load&&nowTotal>prevTotal){
      const gain=nowTotal-prevTotal;
      return{...result,text:`✅ Progression réelle : +${gain} répétition${gain>1?"s":""} au total à ${roundValue(load)} ${ex.unit}. Garde cette charge jusqu’au haut de la plage.`};
    }
    if(prevNext>prevLoad&&load===prevNext&&result.kind!=="bad"){
      return{...result,text:`✅ Nouveau palier validé à ${roundValue(load)} ${ex.unit}. Priorité maintenant à reconstruire les répétitions proprement avant toute nouvelle hausse.`};
    }
    return result;
  };

  function herExerciseHistory(ex){
    const rows=[];
    for(let w=1;w<state.week;w++){
      const r=state.records[recordKey(state.session,ex.id,w)];
      if(r)rows.push({week:w,...r});
    }
    return rows;
  }

  function herTargetFor(ex){
    const prev=previousRecord(state.session,ex.id),ready=readinessValue();
    if(!prev)return{title:"Calibration intelligente",text:`Commence autour de ${roundValue(ex.start)} ${ex.unit}. Le but est de trouver une charge où les dernières répétitions deviennent difficiles sans dégrader le mouvement.`,meta:"Première séance : aucune performance précédente."};
    const previousLoad=Number(prev.load),next=Number(prev.next??prev.load),prevTotal=(prev.reps||[]).reduce((a,b)=>a+Number(b||0),0),history=herExerciseHistory(ex),last3=history.slice(-3);
    if(prev.feel==="pain"||prev.form==="pain")return{title:"Reprise prudente",text:`Ne cherche pas à battre un record. Repars à ${roundValue(Math.min(previousLoad,next))} ${ex.unit} seulement si le mouvement est sans douleur.`,meta:"La dernière séance contient un signal de douleur."};
    if(ready==="tired")return{title:"Mode contrôle",text:`Aujourd’hui, garde ${roundValue(next)} ${ex.unit} au maximum et cherche surtout une exécution propre. HER12 bloque l’augmentation automatique.`,meta:"Tu as indiqué être fatiguée aujourd’hui."};
    if(next>previousLoad)return{title:"Nouveau palier",text:`Charge cible : ${roundValue(next)} ${ex.unit}. Vise au moins ${ex.min} répétitions propres sur chaque série avant de reconstruire progressivement jusqu’à ${ex.max}.`,meta:`Dernière séance : ${roundValue(previousLoad)} ${ex.unit} • ${(prev.reps||[]).join(" / ")} reps.`};
    if(last3.length===3){
      const same=last3.every(r=>Number(r.load)===Number(last3[0].load)),totals=last3.map(r=>(r.reps||[]).reduce((a,b)=>a+Number(b||0),0));
      if(same&&Math.max(...totals)-Math.min(...totals)<=1)return{title:"Petit plateau détecté",text:`Reste à ${roundValue(next)} ${ex.unit}, prends tout le repos prévu et vise seulement +1 répétition totale. Pas besoin de forcer une hausse de poids.`,meta:"Les 3 dernières séances sont très proches en charge et répétitions."};
    }
    return{title:"Objectif du jour",text:`Reste à ${roundValue(next)} ${ex.unit}. Si le mouvement reste propre, essaie de battre la dernière séance d’au moins 1 répétition totale.`,meta:`Dernier total : ${prevTotal} répétitions.`};
  }

  function herRenderTarget(){
    const ex=getCurrentExercise();if(!ex)return;
    let card=herQ("#smartTargetCard");
    if(!card){card=document.createElement("article");card.id="smartTargetCard";card.className="card smartTargetCard";herQ(".previousCard")?.insertAdjacentElement("afterend",card)}
    const target=herTargetFor(ex);card.replaceChildren();
    const title=document.createElement("div");title.className="smartTitle";title.textContent=`🧠 ${target.title}`;
    const text=document.createElement("p");text.className="smartText";text.textContent=target.text;
    const meta=document.createElement("div");meta.className="smartMeta";meta.textContent=target.meta;
    card.append(title,text,meta);
  }

  function herFindDraft(){
    const prefix=`${state.week}|`;
    for(const [key,draft] of Object.entries(state.drafts||{})){
      if(!key.startsWith(prefix))continue;
      const [week,session,id]=key.split("|");
      const ex=PROGRAM[session]?.ex.find(x=>x.id===id);
      if(ex)return{week:Number(week),session,id,ex,draft};
    }
    return null;
  }

  function herRenderResume(){
    const existing=herQ("#resumeDraftCard"),draft=herFindDraft();
    if(!draft){existing?.remove();return}
    let card=existing;
    if(!card){card=document.createElement("article");card.id="resumeDraftCard";card.className="card resumeDraftCard";herQ(".progressCard")?.insertAdjacentElement("afterend",card)}
    card.replaceChildren();
    const text=document.createElement("div"),title=document.createElement("div"),meta=document.createElement("div"),button=document.createElement("button");
    title.className="resumeTitle";title.textContent=`Reprendre ${draft.session} • ${draft.ex.name}`;
    meta.className="resumeMeta";const done=(draft.draft.setsDone||[]).filter(Boolean).length,total=draft.ex.sets[phaseIndex(draft.week)];meta.textContent=`Semaine ${draft.week} • ${done}/${total} séries cochées`;
    text.append(title,meta);button.type="button";button.className="cta";button.textContent="Reprendre";
    button.onclick=()=>{state.week=draft.week;state.session=draft.session;const exs=activeExercises(draft.session,draft.week);state.exerciseIndex=Math.max(0,exs.findIndex(x=>x.id===draft.id));saveState(true);renderExercise();go("exercise")};
    card.append(text,button);
  }

  function herRenderSessionQuickAction(){
    const exs=activeExercises(state.session),done=exs.filter(ex=>state.records[recordKey(state.session,ex.id)]).length,next=exs.findIndex(ex=>!state.records[recordKey(state.session,ex.id)]);
    let box=herQ("#sessionQuickAction");
    if(!box){box=document.createElement("div");box.id="sessionQuickAction";box.className="sessionQuickAction";herQ("#exerciseList")?.insertAdjacentElement("beforebegin",box)}
    box.replaceChildren();
    const line=document.createElement("div");line.className="sessionProgressLine";line.innerHTML=`<span>Progression de la séance</span><strong>${done}/${exs.length}</strong>`;
    const prog=document.createElement("div");prog.className="progress";const span=document.createElement("span");span.style.width=`${exs.length?done/exs.length*100:0}%`;prog.append(span);
    const button=document.createElement("button");button.type="button";button.className="cta";
    if(next<0){button.textContent="Séance déjà terminée ✓";button.disabled=true;button.style.opacity=".65"}
    else{button.textContent=done?`Continuer : ${exs[next].name}`:`Démarrer : ${exs[next].name}`;button.onclick=()=>{state.exerciseIndex=next;ensureSessionStart();saveState(true);renderExercise();go("exercise")}}
    box.append(line,prog,button);
  }

  function herPreloadAroundCurrent(){
    const exs=activeExercises(state.session);const current=exs[state.exerciseIndex],next=exs[state.exerciseIndex+1],prev=exs[state.exerciseIndex-1];
    if(current)herPreloadImage(current.img,true);if(next)herPreloadImage(next.img);if(prev)herPreloadImage(prev.img);
  }

  const herBaseRenderHome=renderHome;
  renderHome=function(){herBaseRenderHome();herRenderResume();herPreloadImage("hero.jpg",true);herPreloadImage("hip_thrust.jpg");herPreloadImage("triceps_pushdown.jpg");herPreloadImage("leg_press.jpg")};
  const herBaseRenderProgram=renderProgram;
  renderProgram=function(){herBaseRenderProgram();herRenderSessionQuickAction();requestAnimationFrame(()=>herQ("#weekTabs .active")?.scrollIntoView({block:"nearest",inline:"center"}))};
  const herBaseRenderExercise=renderExercise;
  renderExercise=function(){herBaseRenderExercise();herRenderTarget();herPreloadAroundCurrent()};

  async function herAcquireWakeLock(){
    if(!("wakeLock" in navigator)||document.hidden||herWakeLock)return;
    try{herWakeLock=await navigator.wakeLock.request("screen");herWakeLock.addEventListener("release",()=>{herWakeLock=null},{once:true})}catch{}
  }
  async function herReleaseWakeLock(){if(herWakeLock){try{await herWakeLock.release()}catch{}herWakeLock=null}}
  const herBaseGo=go;
  go=function(screen){herBaseGo(screen);if(screen==="exercise")herAcquireWakeLock();else herReleaseWakeLock()};
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!herQ("#exercise")?.classList.contains("hidden"))herAcquireWakeLock()});

  const continueBtn=herQ("#continueBtn");
  continueBtn?.addEventListener("click",event=>{
    event.preventDefault();event.stopImmediatePropagation();
    if(!advanceToNextSession()){showSaveStatus("🏆 Les 12 semaines sont terminées");return}
    ensureSessionStart();const exs=activeExercises(state.session),first=exs.findIndex(ex=>!state.records[recordKey(state.session,ex.id)]);state.exerciseIndex=Math.max(0,first);saveState(true);renderExercise();go("exercise");
  },true);

  function herConnectivity(){
    let chip=herQ("#connectivityChip");if(!chip){chip=document.createElement("div");chip.id="connectivityChip";chip.className="connectivityChip";chip.setAttribute("role","status");document.body.appendChild(chip)}
    clearTimeout(herOnlineTimer);
    if(navigator.onLine){chip.textContent="En ligne ✓";chip.classList.add("visible");herOnlineTimer=setTimeout(()=>chip.classList.remove("visible"),1200)}
    else{chip.textContent="Hors ligne • HER12 reste disponible";chip.classList.add("visible")}
  }
  window.addEventListener("online",herConnectivity);window.addEventListener("offline",herConnectivity);

  if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
  const herIdle=window.requestIdleCallback||((cb)=>setTimeout(cb,1200));
  herIdle(()=>navigator.serviceWorker?.ready?.then(reg=>reg.active?.postMessage({type:"WARM_MEDIA",version:HER3_VERSION})).catch(()=>{}));
  herConnectivity();
  renderHome();
})();