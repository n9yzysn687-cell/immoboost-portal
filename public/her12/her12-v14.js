(() => {
  const q = s => document.querySelector(s);

  function openDaySetup() {
    go('more');
    requestAnimationFrame(() => {
      const config = q('#her4Config');
      if (config) config.click();
      else showSaveStatus('Ouvre Guide puis « Changer mes jours »', true);
    });
  }

  function openSettings() {
    go('more');
    requestAnimationFrame(() => {
      decorateGuide();
      q('#v14SettingsCard')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  function fullReset() {
    if (
      !confirm(
        'Recommencer HER12 à zéro ?\n\nCela effacera les séances, charges, mesures et jours choisis sur cet appareil.'
      )
    )
      return;
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('HER12_'))
        .forEach(key => localStorage.removeItem(key));
    } catch {}
    location.reload();
  }

  function makeButton(id, label, onClick, className) {
    let button = q('#' + id);
    if (!button) {
      button = document.createElement('button');
      button.id = id;
      button.type = 'button';
      button.className = className;
      button.textContent = label;
      button.addEventListener('click', onClick);
    }
    return button;
  }

  function decorateHome() {
    const header = q('#home .topHeader');
    if (!header) return;
    const button = makeButton(
      'v14HomeSettings',
      'Réglages',
      openSettings,
      'v14QuickAction'
    );
    if (!button.isConnected) header.appendChild(button);
  }

  function decorateProgram() {
    const button = q('#v12Schedule');
    if (!button) return;
    if (button.textContent !== 'Changer mes jours') button.textContent = 'Changer mes jours';
    if (!button.classList.contains('v14ProgramDays')) button.classList.add('v14ProgramDays');
  }

  function decorateGuide() {
    const section = q('#more');
    if (!section) return;
    let card = q('#v14SettingsCard');
    if (card) return;
    card = document.createElement('article');
    card.id = 'v14SettingsCard';
    card.className = 'card v14SettingsCard';
    const title = document.createElement('strong');
    title.textContent = 'Réglages du programme';
    const text = document.createElement('p');
    text.textContent =
      'Change tes 3 jours sans perdre ton historique, ou recommence entièrement si tu veux repartir de zéro.';
    const change = makeButton(
      'v14GuideDays',
      'Changer mes jours',
      openDaySetup,
      'secondary'
    );
    const reset = makeButton(
      'v14ResetAll',
      'Recommencer HER12 à zéro',
      fullReset,
      'secondary v14Danger'
    );
    card.append(title, text, change, reset);
    const config = q('#her4Config');
    if (config) config.insertAdjacentElement('afterend', card);
    else section.appendChild(card);
  }

  function repairOnboardingFlow() {
    const root = q('.her4Onboarding');
    if (!root) return;
    const next = root.querySelector('[data-step="1"] [data-next="2"]');
    if (!next || next.dataset.v14Direct === '1') return;
    next.dataset.v14Direct = '1';
    next.addEventListener('click', () => {
      setTimeout(() => {
        const finalStep = root.querySelector('[data-step="3"]');
        if (!finalStep || !finalStep.classList.contains('hidden')) return;
        const bridge = root.querySelector('[data-next="3"]');
        if (bridge) bridge.click();
        setTimeout(() => {
          if (!finalStep.classList.contains('hidden')) return;
          root.querySelectorAll('.her4Step').forEach(step => step.classList.add('hidden'));
          finalStep.classList.remove('hidden');
        }, 0);
      }, 0);
    });
  }

  function decorate() {
    decorateHome();
    decorateProgram();
    decorateGuide();
    repairOnboardingFlow();
  }
  let decorateQueued = false;
  new MutationObserver(() => {
    if (decorateQueued) return;
    decorateQueued = true;
    requestAnimationFrame(() => {
      decorateQueued = false;
      decorate();
    });
  }).observe(document.body, {
    childList: true,
    subtree: true,
  });
  document.documentElement.classList.add('her14-ready');
  decorate();
})();
