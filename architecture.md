# Architecture — Maybe A New Me

> Map of the code as it is now.

## Current state
A bilingual (Vietnamese / English) PWA with a tactile "warm paper + extruded objects" design system, synthesized sounds and experimental iOS haptics.

- **Focus** runs real strict-mode sessions: countdown on a black screen, wake lock, leave-the-app limits (phone), random "Still there?" checks with an escalating chime, a required note, and saved history.
- **Journey** shows the real streak (from session history) with a low-poly flame for all 9 tiers; tiers can be previewed.
- **Chests** shows the chest and rarity teasers; chest earning/opening is not wired to the UI yet.
- **Settings**: daily goal (applies tomorrow), language, sound, haptics (with diagnostics), sound test.
- `src/core/` holds all game rules as pure, tested TypeScript.
- Hidden dev mode (tap the Focus kicker 5 times): sessions run 25x faster; time limits stay in real seconds.

## Tooling (project root)
| File | Role |
|---|---|
| `package.json` | Scripts: `dev`, `build` (type-check + Vite build), `preview`, `test` (Vitest), `lint` (ESLint) |
| `vite.config.ts` | React plugin; PWA manifest + service worker (auto update, precaches js/css/html/svg/png/woff2; PNG + SVG manifest icons); base path `/maybe-a-new-me/` for builds (GitHub Pages); Vitest config (`tests/**/*.test.ts`) |
| `tsconfig.json` | Strict TypeScript, bundler resolution, no emit (Vite compiles) |
| `eslint.config.js` | typescript-eslint + @stylistic (Allman braces, 4-space indent, semicolons, single quotes) + react-hooks |
| `index.html` | Entry page with iOS standalone meta tags, `apple-touch-icon`, light theme color, `viewport-fit=cover` |
| `public/icons/icon.svg` | App icon: low-poly flame (Xích Hỏa palette) on cream, used as favicon and manifest icon |
| `public/icons/apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | PNG renders of the same icon (iOS home screen needs PNG; 192/512 for the manifest) |
| `docs/screenshots/` | iPhone screenshots used in the README |
| `.github/workflows/deploy.yml` | On push to `main`: `npm ci`, `npm test`, `npm run build`, publish `dist/` to GitHub Pages |
| `.gitignore` | Ignores build output plus local-only files that never go to GitHub: `CLAUDE.md` (AI context), the plan and playbook notes, `.vscode/` |

## Source files

### Core (`src/core/`, pure TypeScript, no React / browser APIs)
Time, time zone and randomness are always passed in, so every rule is deterministic and tested.

| File | Role |
|---|---|
| `types.ts` | Shared types: `DayKey`, `RandomFn`, `Device`, `FocusLength`, `SportActivity`, `Rarity`, `ChestType`, `ItemSlot`, `DayRecord`, `DayResult`, `PityState`, `SessionRecord` (finished session in history), `SportCheckIn` |
| `day_key.ts` | App days start at `DAY_START_HOUR` = 4 AM. `getDayKey(epoch_ms, timezone_offset_minutes)`, `addDays()`, `daysBetween()`, `getWeekday()` (0 = Sunday), `compareDayKeys()` |
| `rng.ts` | `createSeededRandom(seed)`: mulberry32 generator for reproducible tests |
| `scheduled_value.ts` | Settings that change from tomorrow (daily goal, sport weekdays): `Schedule<Value>` history, `createSchedule()`, `getValueForDay()`, `scheduleChange()` (same-day changes replace each other), `getPendingChange()` |
| `day_records.ts` | `buildDayRecords(input)` / `buildDayRecord()`: sessions + sport check-ins + goal/sport schedules → one `DayRecord` per day from the first day to today. `countCompletedSessions()`, `isSportDay()` |
| `flame_tiers.ts` | `FLAME_TIERS` (9 tiers: `index`, `min_days`), `getTierForStreak()`, `getNextTier()`, `getTierProgress()` → `{ current, next, days_into_tier, days_to_next, ratio }`. Tier names/words live in i18n |
| `streak_engine.ts` | `isDayKept()` (goal met, or sport day with check-in + `SPORT_DAY_MIN_SESSIONS`), `FREEZE_EARN_EVERY_DAYS` = 7, `FREEZE_CAP_BY_STREAK` / `getFreezeCap()` (2 → 3 at 30 → 4 at 100 → 5 at 180), `computeStreak(records, today)` → `StreakState` (`current_streak`, `best_streak`, `freezes_owned`, `current_tier_index`, `day_results`: kept / frozen / missed / pending). Recomputed from full history; today stays pending until kept |
| `session_rules.ts` | Strict-mode state machine `FocusGuardState` (status `running` → `awaiting_note` → `completed`, or `broken` with `BreakReason`: left_app, away_too_long, missed_check, clock_jump, gave_up). Events: `startSession(now, minutes, device, random, limit_scale)`, `tickSession`, `onAppHidden`, `onAppVisible`, `answerPresenceCheck`, `giveUpSession`, `completeSession`. Helpers: `getRemainingSeconds`, `getElapsedSeconds`, `getOpenPresenceCheck`, `getMaxAwayMs`, `getResponseSeconds`, `isNoteValid`. Rules: 60 s per trip away / 180 s total per 25 min (phone only), random checks (`planPresenceChecks`: phone 1, desktop 2 per 25 min, 90 s to answer, never in the first/last 3 min), clock moving back > 5 s breaks, note ≥ 5 chars. `limit_scale` multiplies all time limits (dev mode) |
| `reward_config.ts` | Tuning knobs: `CHEST_RATES` (daily / silver / milestone), `SILVER_CHEST_EVERY_DAYS`, pity (`PITY_EPIC_AT` 10, soft legendary from 35 at +2 % per chest, hard at 50), `SHARDS_FOR_DUPLICATE`, `SHARD_COST` |
| `reward_catalog.ts` | `REWARD_CATALOG`: 36 items (`id`, `slot`, `rarity`, `source` default / gacha / milestone): 5 defaults, 6 titles, 4 themes, 4 sound packs, 4 timer skins, 5 rare flames, 8 tier flames. `getItem()`, `getDefaultItemIds()`, `getGachaPool(rarity)`, `getMilestoneFlameId(tier)` |
| `gacha_engine.ts` | `getEffectiveRates()` (soft pity takes odds from the lowest rarities), `rollRarity()` (hard epic pity upgrades low rolls keeping the epic : legendary ratio), `nextPity()`, `openChest()` → `{ rarity, item_id, is_duplicate, shards_gained, next_pity }`, `exchangeShards()`, `getChestsForKeptDay(prev, new)` (daily always, silver every 7th day, milestone on a new tier) |

### i18n (`src/i18n/`)
| File | Role |
|---|---|
| `strings.ts` | `Language` (`vi` / `en`), `STRINGS` tables (Vietnamese defines `StringKey`, English must match), `translate(language, key, params)` fills `{name}` placeholders, `tierNameKey()` / `tierWordsKey()` / `itemNameKey()` build `tier_<index>_name/_words` and `item_<id>` keys |
| `use_t.ts` | `useT()` hook: returns `t(key, params)` bound to `settings_store.language`; components re-render when it changes |

### App shell
| File | Role |
|---|---|
| `src/main.tsx` | Imports bundled fonts (Space Grotesk 500/700, Space Mono 400/700, Vietnamese subset) and global CSS; initializes the settings store; unlocks audio on the first `pointerdown` / `touchend` / `click`; calls `useFocusStore.recoverAfterReload()` so a session interrupted by closing the app is judged on launch; mounts `App` |
| `src/app.tsx` | Holds `active_tab` state (no router), animates screen transitions, renders `TabBar` and the `FocusSessionLayer` above everything |

### Styles (`src/styles/`)
| File | Role |
|---|---|
| `tokens.css` | CSS variables: paper/ink colors, tile face/side colors, flat palette (flame, pink, cyan, yellow, blue, lilac), accent, button colors, rarity colors, radii, shadows, fonts (`--font-display`, `--font-ui`, `--font-mono`), layout sizes |
| `global.css` | Reset, paper background, no text selection / tap highlight / overscroll, global `.mono_label` class, reduced-motion support |

### Design system (`src/ui/`)
| File | Role |
|---|---|
| `motion_presets.ts` | Shared springs: `SPRING_PRESS`, `SPRING_SLIDE`, `SPRING_POP` |
| `tactile_button.tsx` | Extruded button: face sinks into its side band on press (spring), `press`/`release` sounds on pointer down/up, haptic on click. Variants `accent`/`neutral`/`ink`, sizes `sm`/`md`/`lg` (`lg` is uppercase display text), latched `is_selected` (ink face), `is_disabled` |
| `toggle_switch.tsx` | On/off switch: absolutely positioned knob (only `x` animates, stays vertically centered), even inset ring on the track, `toggle` sound + haptic |
| `segmented_switch.tsx` | Generic `SegmentedSwitch<Value>`: sunken track, labeled options, raised ink thumb that slides (`useId` layoutId per instance); even shadows and cap-height-trimmed labels (`text-box`) for optical centering; used for VI / EN |
| `tab_bar.tsx` | Floating extruded dock; `TabId` = streak (Journey), focus, rewards, settings with translated labels; ink pill slides between tabs (`layoutId`) |
| `screen.tsx` | Page frame: safe-area padding, optional mono `kicker` (with optional `onKickerTap`) + display `title`, left or center aligned |
| `ribbon.tsx` | Banner with folded notched tails; colors `blue`/`ink`/`flame`; pops in |
| `typewriter_text.tsx` | Types text character by character with soft `tick` sounds; each new character fades in from a warm accent glow to ink (no caret); reserves final size so layout does not jump; restarts when `text` changes |
| `hold_button.tsx` | Press-and-hold to confirm (default 2 s): a fill grows while held, letting go cancels. Used for "give up" |
| `haptic_overlay.tsx` | Nearly invisible real `<input type="checkbox" switch>` stretched over a tap area, so the finger itself toggles a switch (newer iOS only buzzes for real taps). Currently used on the Settings test pad; parent must be `position: relative` and not a `<button>` |
| `icons.tsx` | Inline SVG icons (flame, timer, chest, gear) using `currentColor` |

### Sound (`src/sound/`)
| File | Role |
|---|---|
| `sfx_engine.ts` | Web Audio synthesizer. `playSfx(name, loudness_scale = 1)` for `press`, `release`, `tab`, `toggle`, `chime`, `tick`, `whoosh`, `sparkle`, `crack`; `loudness_scale` > 1 for escalating alarms. Context lifecycle: `unlockAudio()` resumes any non-running state (incl. iOS `interrupted`), re-resumes on `visibilitychange`, rebuilds a fresh context on the next tap if a resume fails or times out (400 ms). Sets `navigator.audioSession.type = 'playback'` so sounds play with the silent switch on |
| `haptic_hack.ts` | `triggerHaptic()`: `navigator.vibrate` on Android; on iOS appends an invisible label wrapping `<input switch>` to `<body>`, clicks it, removes it. Called from click handlers. Known not to buzz on newer iOS (programmatic clicks); see `haptic_overlay.tsx` |

### Stores (`src/stores/`)
| File | Role |
|---|---|
| `clock.ts` | Browser-side helpers: `getDayKeyAt(epoch_ms)` / `getTodayKey()` (device time zone), `detectDevice()` (`pointer: coarse` → phone), `createId()` |
| `settings_store.ts` | Zustand + persist (`mnm-settings`): `language`, `is_sound_enabled`, `sfx_volume`, `is_haptic_enabled`, `is_dev_mode` (+ `toggleDevMode`). Subscribes the sound/haptic engines and `<html lang>` to every change |
| `progress_store.ts` | Zustand + persist (`mnm-progress`): `first_day_key`, `sessions` (SessionRecord history), `sport_check_ins`, `goal_schedule` (default 4, range 1–12), `sport_weekday_schedule` (default Mon + Thu). Actions `addSession`, `setDailyGoal(goal, today)` (applies tomorrow). Derived via core, never stored: `useTodayProgress()` → `{ today, done, goal, is_kept, is_sport_day }`, `useStreak()` → `StreakState`, `useGoalSetting()` → `{ today_goal, tomorrow_goal }`, `getTodayRecord()` |
| `focus_store.ts` | Zustand + persist (`mnm-focus`): `selected_length`, `session` (`FocusGuardState`), `clock_origin`, `time_scale` (1, or `DEV_TIME_SCALE` = 25). `getSessionNow()` = real time sped up by `time_scale`. Actions run the core state machine: `start(device, is_dev_mode)` (limit_scale = time_scale), `tick`, `appHidden`, `appVisible`, `answerCheck`, `giveUp`, `submitNote(note)`, `dismiss`, `recoverAfterReload` (phone: time closed counts as time away). Broken and completed sessions are written to `progress_store`. A `merge` step upgrades sessions saved without `limit_scale` |

### Features (`src/features/`)
| File | Role |
|---|---|
| `streak/streak_screen.tsx` | Journey tab: real streak from `useStreak()`; translated tier name, ribbon (streak count / passed / lock with unlock day), `LowPolyFlame`, typewriter words, progress counter + bar to next tier, `TierStrip` |
| `streak/low_poly_flame.tsx` | SVG flame (size prop or `--flame-size` CSS variable; journey uses `min(230px, 25dvh)`): 20 shell + 5 core facets with 4-shade lighting; facets fly in and assemble on mount / tier change; sway; floating shards; glow + ground shadow; `rainbow` and `galaxy` effects |
| `streak/flame_palettes.ts` | `FLAME_PALETTES[tier_index]`: facet shades, core colors, glow, shard colors, effect |
| `streak/tier_strip.tsx` | Extruded strip of 9 mini flame badges (colored when reached, outlined when locked) with a sliding marker; tap to preview |
| `focus/focus_screen.tsx` | Idle Focus tab: kitchen-timer dial (size capped at `30dvh`; SVG pie-slice wedge; needle in an unclipped layer with a fixed shadow; ratchet ticks on change), mono time, today's pips from `useTodayProgress()`, 25/50 selector (persisted), start button (starts a session; shows a DEV badge in dev mode). Kicker shows "session n / goal" or "goal done"; 5 taps on it toggle dev mode with a toast |
| `focus/focus_session_layer.tsx` | Fixed full-screen layer while a session exists; runs `useFocusGuard` and `useWakeLock`; picks the view by status; plays the time-up chime (3 rings), crack + haptic on break, sparkle on completion |
| `focus/session_running.tsx` | Black running view: label (+ DEV chip), thin progress ring, big countdown, time-away budget (phone) or desktop check count, leave hint, hold-to-give-up; shows `PresenceCheck` when a check is open |
| `focus/presence_check.tsx` | "Still there?" over a solid accent screen with a pulsing flash, countdown in real seconds, big answer button; chime rings every 8 s, louder each time (0.6 → 2.2) |
| `focus/session_note.tsx` | "What did you do?" textarea (17 px so iOS doesn't zoom), live min-length hint, save button disabled until valid |
| `focus/session_done.tsx` | Celebration: today's pips with the new one popping in, "flame kept today" ribbon when the goal is met, typewriter line (goal met / sessions left), continue |
| `focus/session_broken.tsx` | Cracked, shaking dial, reason per `BreakReason`, retry (starts a new session) / back |
| `focus/use_focus_guard.ts` | While running: 1 s tick interval, `visibilitychange` → hidden/visible, `pagehide` → hidden |
| `focus/use_wake_lock.ts` | Screen wake lock while active; re-requested whenever the page becomes visible; fails silently |
| `focus/format_time.ts` | `formatClock(seconds)` → `mm:ss` (rounded up) |
| `rewards/chest_screen.tsx` | 2.5D chest that floats and rattles when tapped (typewriter line changes after 3 taps), chest count ribbon, rarity teaser cards with drop rates. Epic: purple sweep, pulsing gem, sparkles. Legendary: rotating conic gold border (`@property --border-angle`), pulsing glow, gold sweep, spinning gem, gold gradient text, more sparkles |
| `rewards/chest_art.tsx` | Flat-shaded SVG chest (front, side, lid, bands, lock) |
| `settings/settings_screen.tsx` | Goal group (− / + stepper editing tomorrow's goal, caption shows today vs tomorrow when pending), General (VI / EN), Sound & haptics (sound, volume, haptic toggle, native iOS switch diagnostic, overlay-method haptic test pad), sound test buttons + haptic-only button, version |

Each `.tsx` with styles has a sibling `<name>.module.css` (CSS Modules); the focus session views share `focus/focus_session.module.css`.

### Tests (`tests/`)
| File | Role |
|---|---|
| `flame_tiers.test.ts` | Milestones, tier lookup for every boundary, next tier, progress ratio |
| `i18n_strings.test.ts` | English and Vietnamese have identical keys, every tier has a name + words in both languages, placeholder filling |
| `day_key.test.ts` | 4 AM boundary, time zones, year/leap-year math, weekdays, scheduled values applying tomorrow |
| `day_records.test.ts` | Completed-session counting, sport weekdays, one record per day, per-day goals, end-to-end streak from raw history |
| `streak_engine.test.ts` | Kept-day rules (goal, sport day), freeze earning/spending, freeze caps by streak, resets, best streak, pending today |
| `session_rules.test.ts` | Presence-check planning, honest session to completion, leave-app limits (phone vs desktop, 25 vs 50 min), missed / late checks, clock rollback, dev `limit_scale`, give up |
| `gacha_engine.test.ts` | Config sums, catalog integrity + i18n names, soft/hard pity, 10,000-chest simulation, duplicates → shards, shard exchange, chests per kept day |

Each core test file also pins the numbers agreed in the plan, so an accidental edit to a rule fails a test.

## Empty folders reserved by the plan
`src/features/music/`, `src/features/onboarding/`, `public/audio/lofi/`, `public/audio/ambient/`.

## Data flow
- **Session:** Focus start → `focus_store.start` → core `startSession`. `useFocusGuard` feeds ticks and visibility events → core state machine → new `session`. On break or completion, `focus_store` writes a `SessionRecord` to `progress_store`.
- **Progress:** `progress_store` history → core `buildDayRecords` → `computeStreak` → Journey (streak, tier) and Focus/Done screens (today's done / goal).
- **Settings:** `settings_store` → subscription → `sfx_engine` / `haptic_hack`; `language` → `useT()` → every visible string.
- **Flame visuals:** tier index → `FLAME_PALETTES` → `low_poly_flame` / `tier_strip`.

## Conventions
- Variables `snake_case`, functions `camelCase`, components/types/enums `PascalCase`, constants `UPPER_SNAKE_CASE`.
- Files `snake_case`, including React component files (`tab_bar.tsx` exports `TabBar`). CSS Module class names are `snake_case`.
- Component props use `snake_case` fields (`is_selected`, `aria_label`); callback props are `camelCase` (`onChange`).
- Zustand: select single values (or functions) per hook call; never return a new object from a selector (Zustand 5 would re-render forever).
- Allman braces; English code comments with aligned trailing `//` comments.
- All visible text comes from `src/i18n/strings.ts` via `useT()` (both `vi` and `en`); "VI"/"EN" labels and the "Tiếng Việt · English" caption are the only literals. Display and mono text is uppercased with CSS (`text-transform`), not in the source strings.
- Lint with ESLint + @stylistic; Prettier is not used.
