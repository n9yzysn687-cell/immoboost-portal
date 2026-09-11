# HER12

Private-use, mobile-first fitness tracker for a 12-week, 3-session-per-week resistance-training plan.

## Product principles

- Glute hypertrophy is the main training priority.
- Arms are strengthened, especially triceps, without promising local fat loss.
- No running. Optional cardio uses incline walking, bike or elliptical.
- Every session starts with 5–7 minutes of easy movement and light approach sets for the first main exercise.
- Starting loads are calibration suggestions, never prescriptions.
- Progression is simple: first add repetitions within the target range, then add one small load increment after every prescribed set reaches the top of the range with clean technique.
- Pain stops progression for that exercise.
- Coaching text avoids acronyms and training jargon.

## Final user flow

1. Choose the current week and session A, B or C.
2. Select how recovered you feel today.
3. Open each exercise and read **why**, **where to feel it**, and the five technique steps.
4. Log the load and repetitions set by set. A rest timer starts when a set is checked.
5. Report how difficult the exercise felt and whether technique stayed clean.
6. HER12 prepares the recommendation for the next exposure: keep the load, add repetitions, increase slightly, reduce, or stop progression if pain was reported.
7. Progress, notes, measurements and history stay stored locally in the browser and can be exported/imported as JSON.

## Media

Exercise media is vendored locally under `public/her12/assets/`. HER12 therefore does not depend on those image hosts during normal use and the service worker pre-caches the local exercise media for offline use after installation.

The media pack uses free-to-use Pexels photography selected for private, non-commercial use. Coaching text is the source of truth for execution. Exercise names were adjusted where needed so the written instruction and the selected visual do not intentionally teach conflicting movements.

## Privacy

Workout logs, drafts and measurements are stored in browser `localStorage`. No HER12 account or remote fitness database is used. The Vercel URL is public but marked `noindex`; anyone who receives the link can still open it, so it should only be shared with the intended person.

## iPhone installation

Open HER12 in Safari, tap **Share**, then **Add to Home Screen**. The PWA uses an Apple touch icon, a standalone manifest and a service worker. The app shell and exercise images are cached for faster repeat use and offline resilience.

## Automated release QA

The repository runs `node scripts/her12-qa.mjs` on every pull request before type-check and production build. It verifies the A/B/C program structure, unique exercise IDs, phase-set definitions, repetition and rest ranges, five-step coaching, every referenced local media file, service-worker precaching and required app-shell references.

The final release gate is:

- HER12 product QA: green.
- TypeScript type-check: green.
- Next.js production build: green.
- Vercel deployment: Ready.
- A normal exercise cannot be validated while prescribed sets remain unchecked.
- The explicit pain flow can exit an exercise without forcing the remaining sets.
- A session is complete only when every active exercise has a saved record.
- Session progression is A → B → C → next week.
- Rest timing is based on an absolute end timestamp so backgrounding the browser does not simply pause the clock.
- Measurement entries reject an entirely empty submission and same-day measurements replace the previous same-day entry.
- Import data is normalized and user-entered text is rendered as text rather than injected HTML.
