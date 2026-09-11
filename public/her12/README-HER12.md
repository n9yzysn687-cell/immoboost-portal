# HER12

HER12 is the final private-use, mobile-first 12-week fitness tracker for 3 resistance-training sessions per week.

- Glute hypertrophy is the main training priority.
- Arms are strengthened, especially triceps, without promising local fat loss.
- No running. Optional cardio uses incline walking, bike or elliptical.
- Every session begins with easy movement and light approach sets.
- Starting loads are calibration suggestions, never prescriptions.
- Progression adds repetitions first, then a small load increase after every prescribed set reaches the top of the target range with clean technique.
- Pain stops progression for that exercise.
- Workout logs, drafts and measurements stay in browser localStorage and can be exported/imported as JSON.
- Exercise media is vendored locally under `public/her12/assets/` and pre-cached by the service worker.
- iPhone installation: open HER12 in Safari, tap Share, then Add to Home Screen.

Release QA runs `node scripts/her12-qa.mjs` before type-check and production build.

**Final release gate:** HER12 product QA ✅ · TypeScript type-check ✅ · Next.js production build ✅ · Vercel deployment Ready ✅
