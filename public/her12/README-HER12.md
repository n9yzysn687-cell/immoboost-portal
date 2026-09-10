# HER12

Private-use, mobile-first fitness tracker for a 12-week, 3-session-per-week resistance-training plan.

## Product principles

- Glute hypertrophy is the main training priority.
- Arms are strengthened, especially triceps, without promising local fat loss.
- No running. Optional cardio uses incline walking, bike or elliptical.
- Starting loads are calibration suggestions, never prescriptions.
- Progression is simple: first add repetitions within the target range, then add one small load increment after every prescribed set reaches the top of the range with clean technique.
- Pain stops progression for that exercise.
- Coaching text avoids acronyms and training jargon.

## Data and privacy

Workout logs, drafts and measurements are stored in browser localStorage. Export/import is available as JSON. The current Vercel preview URL is public but marked noindex; treat it as a convenience link, not authenticated private storage.

## Media ship gate

The app first requests `public/her12/assets/<exercise>.jpg`. Until final dedicated assets are committed there, the preview falls back to external Pexels images.

The visual layer is not final until every exercise has a technically correct, dedicated adult-female demonstration asset. Final media should use a consistent adult subject and gym environment where feasible and must not use cropped tutorial sheets.

## QA ship gate

Before treating HER12 as final:

1. GitHub Quality Check passes.
2. Vercel preview is Ready.
3. Complete A, B and C end-to-end on iPhone Safari, including backgrounding and returning during the rest timer.
4. Verify every exercise visual corresponds to the named movement.
5. Export and re-import a backup.
6. Confirm an incomplete session cannot be accidentally marked complete.
7. Confirm the explicit pain-stop flow can exit an exercise without forcing remaining sets.
8. Confirm the interface remains usable if a media request fails.
