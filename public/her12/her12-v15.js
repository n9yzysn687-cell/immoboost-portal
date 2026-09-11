(() => {
  const META_KEY = 'HER12_META_V15';
  const PROFILE_KEY = 'HER12_PROFILE_V4';
  const STATE_KEY = 'HER12_PRIVATE_V2';
  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const q = selector => document.querySelector(selector);
  const clone = value => JSON.parse(JSON.stringify(value));

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      return null;
    }
  }

  function readMeta() {
    return readJson(META_KEY);
  }

  function readProfile() {
    return readJson(PROFILE_KEY);
  }

  function saveMeta(meta) {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }

  function exerciseCatalog() {
    const catalog = {};
    Object.values(PROGRAM).forEach(session => {
      session.ex.forEach(exercise => {
        if (!catalog[exercise.id]) catalog[exercise.id] = clone(exercise);
      });
    });
    return catalog;
  }

  const CATALOG = exerciseCatalog();

  function withSets(id, sets, overrides = {}) {
    const exercise = clone(CATALOG[id]);
    if (!exercise) throw new Error(`HER12 exercise missing: ${id}`);
    exercise.sets = [...sets];
    Object.assign(exercise, overrides);
    return exercise;
  }

  function runningLegSets(runFrequency) {
    if (runFrequency === '4+') {
      return {
        press: [2, 2, 2],
        rdl: [2, 2, 2],
        step: [2, 2, 2],
        hip: [2, 2, 2],
      };
    }
    if (runFrequency === '3') {
      return {
        press: [3, 3, 3],
        rdl: [2, 3, 3],
        step: [2, 2, 2],
        hip: [2, 2, 2],
      };
    }
    return {
      press: [3, 3, 3],
      rdl: [3, 3, 3],
      step: [2, 2, 3],
      hip: [2, 2, 3],
    };
  }

  function maleSessions(meta) {
    const legs = runningLegSets(meta.runFrequency || '1-2');
    return [
      {
        day: 'Lundi',
        name: 'Upper A · Force & largeur',
        focus: 'Dos + pectoraux + épaules',
        duration: '55–65 min',
        cardio: 'Échauffement : 5–7 min facile. Pas de cardio jambes intense après cette séance.',
        ex: [
          withSets('chest', [3, 4, 4], {
            priority: 'main',
            why: 'Base de poussée lourde pour développer les pectoraux et conserver une progression mesurable.',
          }),
          withSets('lat', [3, 4, 4], {
            priority: 'main',
            why: 'Développe la largeur du dos et la force de tirage vertical.',
          }),
          withSets('row', [3, 3, 4], {
            priority: 'main',
            why: 'Épaissit le milieu du dos et équilibre le travail des pectoraux.',
          }),
          withSets('raise', [3, 3, 4], {
            priority: 'main',
            why: 'Cible les deltoïdes latéraux pour accentuer la largeur du haut du corps.',
          }),
          withSets('tri', [2, 3, 3], {
            priority: 'secondary',
            why: 'Complète les poussées et développe les triceps sans rallonger inutilement la séance.',
          }),
          withSets('pallof', [2, 2, 2], {
            target: 'Core',
            why: 'Travaille la stabilité du tronc utile à la musculation et à la course.',
          }),
        ],
      },
      {
        day: 'Mercredi',
        name: 'Running Strength · Jambes',
        focus: 'Force jambes + stabilité pour courir',
        duration: '45–60 min',
        cardio: 'La course reste séparée. Garde cette séance propre et évite de la transformer en circuit cardio.',
        ex: [
          withSets('press', legs.press, {
            priority: 'main',
            why: 'Développe la force des jambes avec beaucoup de stabilité et un coût technique limité.',
          }),
          withSets('rdl', legs.rdl, {
            priority: 'main',
            target: 'Ischios + fessiers',
            why: 'Renforce la chaîne postérieure, importante pour la propulsion et la tenue en course.',
          }),
          withSets('step', legs.step, {
            priority: 'main',
            target: 'Jambe unilatérale + stabilité',
            why: 'Travaille une jambe à la fois, proche des contraintes unilatérales de la course.',
          }),
          withSets('hip', legs.hip, {
            priority: 'secondary',
            target: 'Extension de hanche',
            why: 'Ajoute de la force de hanche sans multiplier les exercices jambes.',
          }),
          withSets('row', [2, 2, 2], {
            priority: 'secondary',
            why: 'Petit rappel haut du corps pour maintenir une fréquence de travail élevée sans fatiguer les jambes.',
          }),
          withSets('pallof', [2, 2, 2], {
            target: 'Core anti-rotation',
            why: 'Stabilise le bassin et le tronc pendant les efforts unilatéraux.',
          }),
        ],
      },
      {
        day: 'Vendredi',
        name: 'Upper B · Volume & épaules',
        focus: 'Dos + épaules + pectoraux + bras',
        duration: '55–65 min',
        cardio: 'Échauffement facile 5 min. Si une course est prévue le lendemain, termine frais.',
        ex: [
          withSets('lat', [3, 4, 4], {
            priority: 'main',
            why: 'Deuxième stimulation du dos pour construire largeur et force.',
          }),
          withSets('chest', [3, 4, 4], {
            priority: 'main',
            why: 'Deuxième stimulation pectoraux pour accumuler un volume hebdomadaire utile.',
          }),
          withSets('row', [3, 4, 4], {
            priority: 'main',
            why: 'Renforce l’épaisseur du dos et la posture du haut du corps.',
          }),
          withSets('raise', [3, 4, 4], {
            priority: 'main',
            why: 'Priorité épaules pour développer une silhouette plus large en haut.',
          }),
          withSets('ohtri', [2, 3, 3], {
            priority: 'secondary',
            why: 'Complète les triceps dans une position différente des poussées.',
          }),
          withSets('pallof', [2, 2, 3], {
            target: 'Core',
            why: 'Maintient un tronc fort sans fatiguer excessivement les jambes avant la course.',
          }),
        ],
      },
    ];
  }

  function setCoachProfiles(sessions) {
    if (typeof HER12_COACH_SET_PROFILE === 'undefined') return;
    sessions.forEach(session => {
      session.ex.forEach(exercise => {
        HER12_COACH_SET_PROFILE[exercise.id] = [...exercise.sets];
      });
    });
  }

  function applyMaleProgram() {
    const meta = readMeta();
    if (meta?.sex !== 'male') return false;
    const profile = readProfile();
    const days = Array.isArray(profile?.days) && profile.days.length === 3
      ? [...profile.days].sort((a, b) => a - b)
      : [0, 2, 4];
    const sessions = maleSessions(meta);
    sessions.forEach((session, index) => {
      session.day = DAYS[days[index]];
      PROGRAM[['A', 'B', 'C'][index]] = session;
    });
    setCoachProfiles(sessions);
    document.documentElement.classList.add('her15-male');
    document.documentElement.classList.remove('her15-female');
    return true;
  }

  function patchOnboardingCopy() {
    const root = q('.her4Onboarding');
    const meta = readMeta();
    if (!root || !meta) return;
    const first = root.querySelector('[data-step="1"]');
    const finalStep = root.querySelector('[data-step="3"]');
    if (meta.sex === 'male') {
      const firstText = first?.querySelector('p');
      const maleFirst = 'Choisis exactement 3 jours de musculation. HER12 répartit Upper A, Running Strength et Upper B pour développer le haut du corps sans négliger les jambes utiles à la course.';
      if (firstText && firstText.textContent !== maleFirst) firstText.textContent = maleFirst;
      const finalTitle = finalStep?.querySelector('h1');
      const finalText = finalStep?.querySelector('.her4Evidence');
      const maleFinalTitle = 'Ton plan Homme est prêt';
      const maleFinalText = 'Deux séances haut du corps prioritaires, une séance jambes orientée course, puis HER12 calibre tes charges et adapte reps, séries et progression.';
      if (finalTitle && finalTitle.textContent !== maleFinalTitle) finalTitle.textContent = maleFinalTitle;
      if (finalText && finalText.textContent !== maleFinalText) finalText.textContent = maleFinalText;
    } else {
      const firstText = first?.querySelector('p');
      const femaleFirst = 'Choisis exactement 3 jours. HER12 répartit les séances pour développer les fessiers, renforcer les jambes et garder un haut du corps équilibré.';
      if (firstText && firstText.textContent !== femaleFirst) firstText.textContent = femaleFirst;
    }
  }

  function profileLabel() {
    const meta = readMeta();
    if (meta?.sex === 'male') return `Homme · Haut du corps + course ${meta.runFrequency || '1-2'}×`;
    return 'Femme · Fessiers + silhouette';
  }

  function restartProfileChoice() {
    const state = readJson(STATE_KEY);
    const hasProgress = Object.keys(state?.records || {}).length > 0 || (state?.measurements || []).length > 0;
    const message = hasProgress
      ? 'Changer de profil Homme/Femme ?\n\nCela remettra les séances, charges, mesures et jours choisis à zéro sur cet appareil afin de ne pas mélanger deux programmes.'
      : 'Changer de profil Homme/Femme ?\n\nHER12 reviendra à l’écran de choix du profil.';
    if (!confirm(message)) return;
    localStorage.removeItem(META_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(STATE_KEY);
    location.reload();
  }

  function addProfileChip() {
    const meta = readMeta();
    const header = q('#home .topHeader');
    if (!meta || !header) return;
    let chip = q('#v15ProfileChip');
    if (!chip) {
      chip = document.createElement('button');
      chip.id = 'v15ProfileChip';
      chip.type = 'button';
      chip.className = 'v15ProfileChip';
      chip.setAttribute('aria-label', 'Changer de profil Homme ou Femme');
      chip.addEventListener('click', restartProfileChoice);
      header.appendChild(chip);
    }
    const label = profileLabel();
    if (chip.textContent !== label) chip.textContent = label;
  }

  function addProfileSettings() {
    const meta = readMeta();
    const card = q('#v14SettingsCard');
    if (!meta || !card) return;
    let line = q('#v15ProfileLine');
    if (!line) {
      line = document.createElement('div');
      line.id = 'v15ProfileLine';
      line.className = 'v15ProfileLine';
      card.prepend(line);
    }
    const label = `Profil actif : ${profileLabel()}`;
    if (line.textContent !== label) line.textContent = label;
    let changeProfile = q('#v15ChangeProfile');
    if (!changeProfile) {
      changeProfile = document.createElement('button');
      changeProfile.id = 'v15ChangeProfile';
      changeProfile.type = 'button';
      changeProfile.className = 'secondary';
      changeProfile.textContent = 'Changer Homme / Femme';
      changeProfile.addEventListener('click', restartProfileChoice);
      line.insertAdjacentElement('afterend', changeProfile);
    }
  }

  function showRunChoice(gate) {
    const panel = gate.querySelector('.v15GatePanel');
    if (!panel) return;
    panel.innerHTML = `
      <div class='v15GateBrand'>HER12</div>
      <div class='v15GateStep'>2 sur 2</div>
      <h1>Combien de fois cours-tu ?</h1>
      <p>HER12 ajuste seulement le volume jambes. Ton haut du corps reste la priorité.</p>
      <div class='v15RunGrid'>
        <button type='button' data-run='0'><b>0</b><span>Pas de course</span></button>
        <button type='button' data-run='1-2'><b>1–2</b><span>sorties / semaine</span></button>
        <button type='button' data-run='3'><b>3</b><span>sorties / semaine</span></button>
        <button type='button' data-run='4+'><b>4+</b><span>sorties / semaine</span></button>
      </div>
      <button type='button' class='v15Back'>← Retour</button>
    `;
    panel.querySelectorAll('[data-run]').forEach(button => {
      button.addEventListener('click', () => {
        saveMeta({ sex: 'male', runFrequency: button.dataset.run });
        applyMaleProgram();
        patchOnboardingCopy();
        gate.remove();
        refreshVisibleUi();
      });
    });
    panel.querySelector('.v15Back')?.addEventListener('click', () => renderProfileGate(gate));
  }

  function renderProfileGate(existing) {
    const gate = existing || document.createElement('div');
    gate.className = 'v15ProfileGate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.innerHTML = `
      <div class='v15GatePanel'>
        <div class='v15GateBrand'>HER12</div>
        <div class='v15GateStep'>1 sur 2</div>
        <h1>Qui va utiliser HER12 ?</h1>
        <p>Choisis ton profil. HER12 adapte le programme dès la première séance.</p>
        <div class='v15SexGrid'>
          <button type='button' data-sex='female'><span class='v15SexIcon'>♀</span><b>Femme</b><small>Fessiers · jambes · silhouette</small></button>
          <button type='button' data-sex='male'><span class='v15SexIcon'>♂</span><b>Homme</b><small>Haut du corps · course · force</small></button>
        </div>
      </div>
    `;
    gate.querySelector('[data-sex="female"]')?.addEventListener('click', () => {
      saveMeta({ sex: 'female', runFrequency: '0' });
      document.documentElement.classList.add('her15-female');
      patchOnboardingCopy();
      gate.remove();
      refreshVisibleUi();
    });
    gate.querySelector('[data-sex="male"]')?.addEventListener('click', () => showRunChoice(gate));
    if (!existing) document.body.appendChild(gate);
  }

  function ensureProfileGate() {
    if (readMeta() || q('.v15ProfileGate')) return;
    renderProfileGate();
  }

  function refreshVisibleUi() {
    requestAnimationFrame(() => {
      if (!q('#home')?.classList.contains('hidden')) renderHome();
      if (!q('#program')?.classList.contains('hidden')) renderProgram();
      addProfileChip();
      addProfileSettings();
    });
  }

  function decorateV15() {
    const meta = readMeta();
    if (meta?.sex === 'male') applyMaleProgram();
    if (meta?.sex === 'female') {
      document.documentElement.classList.add('her15-female');
      document.documentElement.classList.remove('her15-male');
    }
    patchOnboardingCopy();
    ensureProfileGate();
    addProfileChip();
    addProfileSettings();
  }

  let decorateQueued = false;
  new MutationObserver(() => {
    if (decorateQueued) return;
    decorateQueued = true;
    requestAnimationFrame(() => {
      decorateQueued = false;
      patchOnboardingCopy();
      addProfileChip();
      addProfileSettings();
    });
  }).observe(document.body, { childList: true, subtree: true });

  document.documentElement.classList.add('her15-ready');
  decorateV15();
})();
