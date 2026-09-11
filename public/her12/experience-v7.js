(()=>{
  const q=s=>document.querySelector(s),qq=s=>[...document.querySelectorAll(s)];

  function nextSessionSlot(){
    for(const s of ["A","B","C"]) if(!state.completed[`${state.week}|${s}`]) return s;
    return state.week<12?"A":null;
  }
  function firstUnfinishedIndex(session){
    const list=activeExercises(session);
    const i=list.findIndex(ex=>!state.records[recordKey(session,ex.id)]);
    return i<0?0:i;
  }

  /* One-tap start from Today. The Plan stays available, but it is no longer a mandatory stop. */
  function directStart(){
    const card=q("#her4NextCard"),button=card?.querySelector(".cta");
    if(!button||button.textContent.trim()==="Reprendre") return;
    const slot=nextSessionSlot();
    if(!slot) return;
    button.textContent="Commencer maintenant";
    button.onclick=()=>{
      state.session=slot;
      state.exerciseIndex=firstUnfinishedIndex(slot);
      saveState(true);
      go("program");
      requestAnimationFrame(()=>{
        const rows=qq("#exerciseList .exerciseRow");
        const target=rows[state.exerciseIndex]||rows[0];
        target?.click();
      });
    };
  }
  const home0=renderHome;
  renderHome=function(){home0();directStart()};

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
        const rows=qq("#setRows .setCheck");
        if(rows.length&&rows.every(x=>x.classList.contains("done"))) q("#validateExercise")?.classList.add("v7Ready");
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
    const checks=qq("#setRows .setCheck"),all=checks.length&&checks.every(x=>x.classList.contains("done")),rating=q("#v7Rating"),validate=q("#validateExercise");
    if(!rating||!validate)return;
    rating.classList.toggle("v7Attention",all&&!nativeChoice().feel);
    validate.classList.toggle("v7Ready",all&&Boolean(nativeChoice().feel)&&Boolean(nativeChoice().form));
    if(all&&!nativeChoice().feel){setTimeout(()=>rating.scrollIntoView({behavior:"smooth",block:"center"}),80)}
  }

  function progressLabel(){
    const exs=activeExercises(state.session),done=exs.filter(ex=>state.records[recordKey(state.session,ex.id)]).length;
    const top=q("#v5ExerciseProgress .v5ProgressTop span:first-child");
    if(top)top.textContent=`${PROGRAM[state.session].day} • ${done}/${exs.length} terminés`;
  }

  const exercise0=renderExercise;
  renderExercise=function(){
    exercise0();ratingBlock();compactNote();reuseLastReps();progressLabel();completionAssist();
  };

  document.addEventListener("click",event=>{
    if(event.target.closest("#setRows .setCheck")) setTimeout(completionAssist,20);
    if(event.target.closest("#painBtn")){
      q("#v7Rating")?.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
      q("#validateExercise")?.classList.add("v7Ready");
    }
  },{passive:true});

  /* Make Today feel current without adding another dashboard widget. */
  function todayLabel(){
    const sub=q("#home .topHeader .muted");if(!sub)return;
    const day=new Intl.DateTimeFormat("fr-BE",{weekday:"long"}).format(new Date());
    sub.textContent=`${day.charAt(0).toUpperCase()+day.slice(1)} • semaine ${state.week}`;
  }
  const home1=renderHome;
  renderHome=function(){home1();todayLabel();directStart()};

  document.documentElement.classList.add("her7-ready");
  renderHome();
})();