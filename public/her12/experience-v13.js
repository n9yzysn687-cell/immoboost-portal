(()=>{
  const q=s=>document.querySelector(s);
  const PROFILE_KEY='HER12_PROFILE_V4';

  function openDaySetup(){
    go('more');
    requestAnimationFrame(()=>{
      const config=q('#her4Config');
      if(config) config.click();
      else showSaveStatus('Ouvre Guide puis « Changer mes jours »',true);
    });
  }

  function fullReset(){
    const ok=confirm('Recommencer HER12 à zéro ?\n\nCela effacera les séances, charges, mesures et jours choisis sur cet appareil.');
    if(!ok)return;
    try{
      Object.keys(localStorage).filter(key=>key.startsWith('HER12_')).forEach(key=>localStorage.removeItem(key));
      localStorage.removeItem(PROFILE_KEY);
    }catch{}
    location.reload();
  }

  function actionButton(id,label,onClick,className='v13QuickAction'){
    let button=q('#'+id);
    if(!button){
      button=document.createElement('button');
      button.id=id;
      button.type='button';
      button.className=className;
      button.textContent=label;
      button.addEventListener('click',onClick);
    }
    return button;
  }

  function decorateHome(){
    const header=q('#home .topHeader');
    if(!header)return;
    const button=actionButton('v13HomeDays','Jours',openDaySetup);
    if(!button.isConnected)header.appendChild(button);
  }

  function decorateProgram(){
    const section=q('#program');
    if(!section)return;
    const button=actionButton('v13ProgramDays','Changer mes jours',openDaySetup,'v13ProgramDays');
    const title=section.querySelector('h1');
    if(title&&!button.isConnected)title.insertAdjacentElement('afterend',button);
  }

  function decorateGuide(){
    const section=q('#more');
    if(!section)return;
    let card=q('#v13SettingsCard');
    if(!card){
      card=document.createElement('article');
      card.id='v13SettingsCard';
      card.className='card v13SettingsCard';

      const title=document.createElement('strong');
      title.textContent='Réglages du programme';
      const text=document.createElement('p');
      text.textContent='Tu peux changer les jours sans perdre ton historique, ou recommencer entièrement si tu veux repartir de zéro.';

      const change=actionButton('v13GuideDays','Changer mes jours',openDaySetup,'secondary');
      const reset=actionButton('v13ResetAll','Recommencer HER12 à zéro',fullReset,'secondary v13Danger');
      card.append(title,text,change,reset);

      const config=q('#her4Config');
      if(config)config.insertAdjacentElement('afterend',card);
      else section.appendChild(card);
    }
  }

  function decorate(){
    decorateHome();
    decorateProgram();
    decorateGuide();
  }

  const home0=renderHome;
  renderHome=function(){home0();decorateHome()};
  const program0=renderProgram;
  renderProgram=function(){program0();decorateProgram()};
  const go0=go;
  go=function(screen){
    go0(screen);
    requestAnimationFrame(()=>{
      if(screen==='home')decorateHome();
      if(screen==='program')decorateProgram();
      if(screen==='more')decorateGuide();
    });
  };

  const observer=new MutationObserver(()=>decorate());
  observer.observe(document.body,{childList:true,subtree:true});
  decorate();
  document.documentElement.classList.add('her13-ready');
})();
