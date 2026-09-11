(()=>{
  const PROFILE_STORE="HER12_PROFILE_V4";
  const DAYS=["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
  const SHORT=["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  const GOALS={glutes:"Fessiers",thighs:"Cuisses",arms:"Bras",back:"Dos",shoulders:"Épaules",abs:"Ventre"};
  const BASE=JSON.parse(JSON.stringify(PROGRAM));
  let guideFocus=null;
  const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)];
  const clone=x=>JSON.parse(JSON.stringify(x));
  const readProfile=()=>{try{return JSON.parse(localStorage.getItem(PROFILE_STORE))}catch{return null}};
  let profile=readProfile();

  function validProfile(p){return p&&Array.isArray(p.days)&&p.days.length===3&&p.days.every(d=>Number.isInteger(d)&&d>=0&&d<7)&&p.goals&&p.goals.glutes===true}
  function circularDistance(a,b){const d=Math.abs(a-b);return Math.min(d,7-d)}
  function scheduleFor(p){
    const days=[...p.days].sort((a,b)=>a-b);let bestPair=[days[0],days[2]],best=-1;
    for(let i=0;i<days.length;i++)for(let j=i+1;j<days.length;j++){const score=circularDistance(days[i],days[j]);if(score>best){best=score;bestPair=[days[i],days[j]]}}
    const upper=days.find(d=>!bestPair.includes(d));const lowers=bestPair.slice().sort((a,b)=>a-b);let lowerIndex=0;
    return days.map(day=>({day,template:day===upper?"B":lowers[lowerIndex++]===day?"A":"C"}));
  }
  function tuneGoals(session,p){
    for(const ex of session.ex){
      if(!p.goals.thighs&&["bulg","press","step"].includes(ex.id))ex.sets=ex.sets.map(v=>Math.min(v,1));
      if(!p.goals.arms&&ex.id==="tri")ex.sets=[1,2,2];
      if(!p.goals.arms&&ex.id==="ohtri")ex.sets=[0,1,1];
      if(!p.goals.back&&["lat","row"].includes(ex.id))ex.sets=[2,2,2];
      if(!p.goals.shoulders&&ex.id==="raise")ex.sets=[1,1,2];
      if(!p.goals.abs&&["pallof","abs"].includes(ex.id))ex.sets=[1,1,2];
    }
    return session;
  }
  function applyProfile(p){
    if(!validProfile(p))return;
    const plan=scheduleFor(p),slots=["A","B","C"];
    plan.forEach((item,index)=>{const session=tuneGoals(clone(BASE[item.template]),p);session.day=DAYS[item.day];PROGRAM[slots[index]]=session});
    document.documentElement.classList.add("her4-ready");
  }
  if(validProfile(profile))applyProfile(profile);

  function firstDraft(){
    for(const [key,draft] of Object.entries(state.drafts||{})){const [w,s,id]=key.split("|");if(Number(w)!==state.week)continue;const ex=PROGRAM[s]?.ex.find(x=>x.id===id);if(ex)return{week:Number(w),session:s,id,ex,draft}}
    return null;
  }
  function nextSessionSlot(){for(const s of ["A","B","C"])if(!state.completed[`${state.week}|${s}`])return s;return state.week<12?"A":null}
  function goalText(){return Object.entries(profile?.goals||{}).filter(([,v])=>v).map(([k])=>GOALS[k]).join(" • ")}

  function renderLeanHome(){
    if(!validProfile(profile))return;
    q("#home .sessions")?.closest(".card")?.classList.add("her4LegacyHome");q("#resumeDraftCard")?.classList.add("her4Hide");
    const draft=firstDraft(),slot=draft?.session||nextSessionSlot();let card=q("#her4NextCard");if(!card){card=document.createElement("article");card.id="her4NextCard";card.className="her4NextCard";q("#home .topHeader")?.insertAdjacentElement("afterend",card)}
    card.replaceChildren();
    if(!slot){card.innerHTML='<div class="her4Overline">Programme terminé</div><h2>12 semaines complètes ✓</h2><p>Le suivi reste disponible dans l’onglet Suivi.</p>';return}
    const ses=PROGRAM[slot],exs=activeExercises(slot),done=exs.filter(ex=>state.records[recordKey(slot,ex.id)]).length;
    const top=document.createElement("div");top.className="her4Overline";top.textContent=draft?"À reprendre":"Prochaine séance";
    const h=document.createElement("h2");h.textContent=draft?draft.ex.name:`${ses.day} • ${ses.name}`;
    const p=document.createElement("p");p.textContent=draft?`${ses.day} • ${draft.ex.target}`:`${ses.focus} • ${done}/${exs.length} exercices terminés`;
    const progress=document.createElement("div");progress.className="progress";progress.innerHTML=`<span style="width:${exs.length?done/exs.length*100:0}%"></span>`;
    const b=document.createElement("button");b.type="button";b.className="cta";b.textContent=draft?"Reprendre":"Commencer";
    b.onclick=()=>{if(draft){state.session=draft.session;const list=activeExercises(draft.session);state.exerciseIndex=Math.max(0,list.findIndex(x=>x.id===draft.id));saveState(true);renderExercise();go("exercise");return}q("#continueBtn")?.click()};
    card.append(top,h,p,progress,b);
    let week=q("#her4Week");if(!week){week=document.createElement("div");week.id="her4Week";week.className="her4Week";card.insertAdjacentElement("afterend",week)}week.replaceChildren();
    ["A","B","C"].forEach(s=>{const x=document.createElement("button");x.type="button";x.className=`her4Day${state.completed[`${state.week}|${s}`]?" done":""}`;x.innerHTML=`<b>${PROGRAM[s].day.slice(0,3)}</b><span>${PROGRAM[s].focus.replace("Séance principale ","").replace("Deuxième séance forte ","")}</span>`;x.onclick=()=>{state.session=s;state.exerciseIndex=0;saveState(true);go("program")};week.appendChild(x)});
  }

  const baseHome=renderHome;renderHome=function(){baseHome();renderLeanHome();qq("[data-open]").forEach((b,i)=>{const s=["A","B","C"][i];const title=b.querySelector("b"),sub=b.querySelector("span");if(title)title.textContent=`${s} • ${PROGRAM[s].day}`;if(sub)sub.textContent=PROGRAM[s].focus})};

  createExerciseRow=function(ex,index){
    const rec=state.records[recordKey(state.session,ex.id)],prev=previousRecord(state.session,ex.id),b=document.createElement("button");b.type="button";b.className="exerciseRow her4ExerciseRow";
    const img=document.createElement("img");img.loading="lazy";img.decoding="async";setImage(img,ex.img,ex.name);
    const text=document.createElement("div"),name=document.createElement("b"),meta=document.createElement("small"),last=document.createElement("small");name.textContent=ex.name;meta.textContent=`${ex.sets[phaseIndex()]} × ${ex.min}–${ex.max} • ${ex.target}`;last.className="her4Last";last.textContent=rec?`Aujourd’hui : ${roundValue(Number(rec.load))} ${ex.unit}`:prev?`Dernière fois : ${roundValue(Number(prev.load))} ${ex.unit}`:`Charge à tester : ${roundValue(ex.start)} ${ex.unit}`;text.append(name,meta,last);
    const done=document.createElement("span");done.className=`doneDot${rec?" done":""}`;done.textContent=rec?"✓":"›";b.append(img,text,done);b.onclick=()=>{state.exerciseIndex=index;ensureSessionStart();saveState(true);renderExercise();go("exercise")};return b;
  };

  const baseProgram=renderProgram;renderProgram=function(){baseProgram();q("#sessionCardio")?.classList.add("her4Hide");const title=q("#sessionTitle");if(title)title.textContent=`${PROGRAM[state.session].day} • ${PROGRAM[state.session].name}`;requestAnimationFrame(()=>q("#sessionTabs .active")?.scrollIntoView({inline:"center",block:"nearest"}))};

  function techniqueButton(){let b=q("#her4Technique");if(!b){b=document.createElement("button");b.id="her4Technique";b.type="button";b.className="her4Technique";q("#exercise .media")?.insertAdjacentElement("afterend",b)}const ex=getCurrentExercise();b.textContent="Voir la technique et le pourquoi ›";b.onclick=()=>{guideFocus=ex?.id||null;go("more")}}
  const baseExercise=renderExercise;renderExercise=function(){baseExercise();techniqueButton()};

  function renderGuide(){
    const section=q("#more");if(!section)return;section.querySelector(".eyebrow").textContent="Guide";section.querySelector("h1").textContent="Technique & explications";
    let intro=q("#her4GuideIntro");if(!intro){intro=document.createElement("article");intro.id="her4GuideIntro";intro.className="card her4GuideIntro";intro.innerHTML='<strong>Le suivi reste simple.</strong><p>Ici seulement, tu retrouves la technique, le pourquoi de chaque exercice et les principes du programme.</p>';section.querySelector("h1").insertAdjacentElement("afterend",intro)}
    let library=q("#her4GuideLibrary");if(!library){library=document.createElement("div");library.id="her4GuideLibrary";intro.insertAdjacentElement("afterend",library)}library.replaceChildren();
    const seen=new Set();for(const s of ["A","B","C"]){for(const ex of PROGRAM[s].ex){if(seen.has(ex.id)||ex.sets.every(v=>v===0))continue;seen.add(ex.id);const d=document.createElement("details");d.className="her4GuideExercise";d.dataset.exid=ex.id;const sm=document.createElement("summary");sm.innerHTML=`<img src="./assets/${ex.img}" alt=""><span><b>${ex.name}</b><small>${ex.target}</small></span><i>+</i>`;const body=document.createElement("div");body.className="her4GuideBody";const steps=ex.steps.map(x=>`<li>${x}</li>`).join("");body.innerHTML=`<p><strong>Pourquoi :</strong> ${ex.why}</p><p><strong>À sentir :</strong> ${ex.feel}</p><ol>${steps}</ol><p class="muted">Alternative : ${ex.alt}</p>`;d.append(sm,body);library.appendChild(d)}}
    let science=q("#her4Science");if(!science){science=document.createElement("details");science.id="her4Science";science.className="card her4Science";science.innerHTML='<summary><b>Pourquoi ce plan est construit ainsi ?</b></summary><p>HER12 répartit deux séances bas du corps autour d’une séance haut du corps. La priorité est le volume hebdomadaire utile et progressif, pas la complexité.</p><p>L’ACSM 2026 situe autour de 10 séries hebdomadaires par groupe musculaire un repère utile pour l’hypertrophie, à individualiser. Les données récentes montrent aussi des rendements décroissants quand on augmente encore le volume.</p><p>Pour les fessiers, les données 2025 soutiennent une combinaison Hip Thrust, mouvements de squat/presse et extensions de hanche.</p><div class="her4Sources"><a href="https://acsm.org/resistance-training-guidelines-update-2026/" target="_blank" rel="noopener">ACSM 2026</a><a href="https://pubmed.ncbi.nlm.nih.gov/40276368/" target="_blank" rel="noopener">Revue fessiers 2025</a><a href="https://pubmed.ncbi.nlm.nih.gov/41343037/" target="_blank" rel="noopener">Volume & fréquence 2026</a></div>';library.insertAdjacentElement("afterend",science)}
    let config=q("#her4Config");if(!config){config=document.createElement("button");config.id="her4Config";config.className="secondary her4Config";config.textContent="Modifier mes jours et objectifs";science.insertAdjacentElement("afterend",config);config.onclick=()=>showOnboarding(true)}
    if(guideFocus){const d=library.querySelector(`[data-exid="${guideFocus}"]`);if(d){d.open=true;setTimeout(()=>d.scrollIntoView({behavior:"smooth",block:"start"}),50)}guideFocus=null}
  }
  const baseGo=go;go=function(screen){baseGo(screen);if(screen==="more")renderGuide()};
  const lastNav=qq(".nav").at(-1);if(lastNav)lastNav.innerHTML='<span>◎</span>Guide';

  function onboardingMarkup(){return `<div class="her4Onboarding" role="dialog" aria-modal="true"><div class="her4OnboardInner"><div class="her4Brand">HER12</div><div class="her4Step" data-step="1"><div class="her4Overline">1 sur 3</div><h1>Quels jours peux-tu t’entraîner ?</h1><p>Choisis exactement 3 jours. HER12 placera les deux séances fessiers le plus intelligemment possible autour de la semaine.</p><div class="her4Days">${DAYS.map((d,i)=>`<button type="button" data-day="${i}"><b>${SHORT[i]}</b><span>${d}</span></button>`).join("")}</div><button class="cta" data-next="2">Continuer</button></div><div class="her4Step hidden" data-step="2"><div class="her4Overline">2 sur 3</div><h1>Qu’est-ce qu’on veut développer ?</h1><p>Les fessiers restent la priorité principale. Choisis les zones à renforcer autour.</p><div class="her4Goals"><button class="active locked" data-goal="glutes"><b>🍑 Fessiers</b><span>Priorité</span></button>${Object.entries(GOALS).filter(([k])=>k!=="glutes").map(([k,v])=>`<button type="button" class="active" data-goal="${k}"><b>${v}</b><span>Renforcer</span></button>`).join("")}</div><div class="her4Split"><button class="secondary" data-back="1">Retour</button><button class="cta" data-next="3">Voir mon programme</button></div></div><div class="her4Step hidden" data-step="3"><div class="her4Overline">3 sur 3</div><h1>Ton programme est prêt</h1><p id="her4GoalSummary"></p><div id="her4PlanPreview" class="her4PlanPreview"></div><p class="her4Evidence">Deux séances fessiers, une séance haut du corps, volume progressif et récupération entre les gros efforts.</p><div class="her4Split"><button class="secondary" data-back="2">Modifier</button><button class="cta" id="her4Create">Créer mon programme</button></div></div></div></div>`}
  function showOnboarding(reconfigure=false){
    q(".her4Onboarding")?.remove();document.body.insertAdjacentHTML("beforeend",onboardingMarkup());const root=q(".her4Onboarding");root.dataset.reconfigure=reconfigure?"1":"0";
    const selected=new Set(validProfile(profile)?profile.days:[0,2,4]);const goals={glutes:true,thighs:true,arms:true,back:true,shoulders:true,abs:true,...(profile?.goals||{})};
    function paint(){root.querySelectorAll("[data-day]").forEach(b=>b.classList.toggle("active",selected.has(Number(b.dataset.day))));root.querySelectorAll("[data-goal]").forEach(b=>b.classList.toggle("active",Boolean(goals[b.dataset.goal])));const n=root.querySelector('[data-next="2"]');if(n)n.disabled=selected.size!==3}
    function step(n){root.querySelectorAll(".her4Step").forEach(x=>x.classList.toggle("hidden",x.dataset.step!==String(n)));if(n===3){const p={days:[...selected],goals};const plan=scheduleFor(p);q("#her4GoalSummary").textContent=`Priorité : ${Object.entries(goals).filter(([,v])=>v).map(([k])=>GOALS[k]).join(" • ")}.`;const prev=q("#her4PlanPreview");prev.innerHTML="";plan.forEach((item,i)=>{const ses=BASE[item.template],row=document.createElement("div");row.innerHTML=`<b>${DAYS[item.day]}</b><span>${ses.name}</span>`;prev.appendChild(row)})}root.querySelector(".her4OnboardInner").scrollTop=0}
    root.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>{const d=Number(b.dataset.day);if(selected.has(d))selected.delete(d);else if(selected.size<3)selected.add(d);paint()});root.querySelectorAll("[data-goal]").forEach(b=>b.onclick=()=>{if(b.dataset.goal==="glutes")return;goals[b.dataset.goal]=!goals[b.dataset.goal];paint()});root.querySelectorAll("[data-next]").forEach(b=>b.onclick=()=>step(Number(b.dataset.next)));root.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>step(Number(b.dataset.back)));
    q("#her4Create")?.addEventListener("click",()=>{const next={version:1,days:[...selected].sort((a,b)=>a-b),goals};if(Object.keys(state.records||{}).length&&reconfigure){if(!confirm("Modifier le programme remettra le suivi des séances à zéro pour éviter de mélanger deux programmes. Continuer ?"))return;const measurements=[...(state.measurements||[])];state=freshState();state.measurements=measurements}profile=next;localStorage.setItem(PROFILE_STORE,JSON.stringify(profile));applyProfile(profile);root.remove();state.session="A";state.exerciseIndex=0;saveState(true);renderHome();renderProgram();showSaveStatus("✓ Programme personnalisé créé")});paint();step(1);
  }

  if(!validProfile(profile))showOnboarding(false);else{renderHome();renderProgram();}
})();