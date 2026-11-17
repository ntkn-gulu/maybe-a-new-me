# Architecture — Maybe A New Me

> Map of the code as it is now.

## Current state
A bilingual (Vietnamese / English) PWA with a tactile "warm paper + extruded objects" design system, synthesized sounds and experimental iOS haptics.

- **Focus** runs real strict-mode sessions: countdown on a black screen, wake lock, leave-the-app limits (phone), random "Still there?" checks with an escalating chime, a required note, and saved history.
- **Journey** shows the real streak (from session history) with the theme's flame for every reached tier (tiers not reached yet hide their color and name behind a "?"), a sport-day check-in card on sport days, best streak + streak freezes, and a month calendar heatmap (kept / frozen / missed / today).
- **Level up**: reaching a new tier opens a full-screen moment once after any session screen closes: the old flame shakes, the user taps it 3 times (each tap buzzes the iPhone and cracks it), it bursts and the new one assembles.
- **Chests** shows the chest and rarity teasers; chest earning/opening is not wired to the UI yet.
- **Settings**: daily goal (default 2, applies tomorrow), theme (3D / 2.0 / Sketch), language, date format (DD/MM or MM/DD), sound, haptics; the sound test only shows in dev mode.
- **Themes** (`settings_store.theme`): **3D** (`classic_3d`, the original look: extruded tiles, low-poly flame, extruded dial and chest), **2.0** (`paper_ink`, default: same tactile UI, illustrations as cut paper layers with soft paper shadows and hand-drawn ink outlines; the flame's ink "boils" like hand-drawn animation), **Sketch** (`sketch`: paper + ink art and the whole UI redrawn as a sketchbook: Patrick Hand font, wobbly ink frames, hatched pen shadows). Each illustration has an extruded and a paper + ink version, picked with `useArtStyle()`. The git tag `theme-3d-original` marks the last commit before the paper + ink work.
- Every tap target is a `div` with button semantics (`getPressableProps`) holding a `HapticOverlay`, so iPhones buzz on tap.
- `src/core/` holds all game rules as pure, tested TypeScript.
- Hidden dev mode (tap the Focus kicker 5 times): sessions run 25x faster (time limits stay in real seconds); Journey shows a dev panel to fake the streak (0–400), try flame color items, replay the level-up screen and preview the sport check-in card on any day.
- Flames support an equipped color item (`color_id`); nothing equips one yet outside the dev panel.

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
| `.gitignore` | Ignores build output plus local-only files that never go to GitHub: `CLAUDE.md` (AI context), the plan and playbook notes, `.vscode/`, `sketch_img/` (design reference images) |

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
| `flame_tiers.ts` | `FLAME_TIERS` (9 tiers: `index`, `min_days`), `getTierForStreak()`, `getNextTier()`, `getTierProgress()` → `{ current, next, days_into_tier, days_to_next, ratio }`. Level up: `getLevelUp(celebrated, current)` → `{ from_index, to_index }` or null, `settleCelebratedTier()` (the celebrated tier falls with a lost streak, never rises). Tier names/words live in i18n |
| `streak_engine.ts` | `isDayKept()` (goal met, or sport day with check-in + `SPORT_DAY_MIN_SESSIONS`), `getDayTarget(record)` (the goal, or `min(goal, SPORT_DAY_MIN_SESSIONS)` on a checked-in sport day), `getSessionsToKeep(record)` (target − done, 0 once kept), `FREEZE_EARN_EVERY_DAYS` = 7, `FREEZE_CAP_BY_STREAK` / `getFreezeCap()` (2 → 3 at 30 → 4 at 100 → 5 at 180), `computeStreak(records, today)` → `StreakState` (`current_streak`, `best_streak`, `freezes_owned`, `current_tier_index`, `day_results`: kept / frozen / missed / pending). Recomputed from full history; today stays pending until kept |
| `sport_rules.ts` | `SPORT_ACTIVITIES` (badminton, gym, home_workout, running, other), `MIN_CHECK_IN_NOTE_LENGTH` = 3, `canCheckInSport(record)` (sport day, once), `isCheckInNoteValid()` |
| `calendar_month.ts` | `MonthKey` (`YYYY-MM`), `getMonthKey()`, `getMonthParts()`, `addMonths()`, `getDaysInMonth()`, `getWeekdayOrder()` (Monday first, `WEEK_START_WEEKDAY`), `buildMonthGrid(month)` → day keys padded with `null` to whole weeks |
| `session_rules.ts` | Strict-mode state machine `FocusGuardState` (status `running` → `awaiting_note` → `completed`, or `broken` with `BreakReason`: left_app, away_too_long, missed_check, clock_jump, gave_up). Events: `startSession(now, minutes, device, random, limit_scale)`, `tickSession`, `onAppHidden`, `onAppVisible`, `answerPresenceCheck`, `giveUpSession`, `completeSession`. Helpers: `getRemainingSeconds`, `getElapsedSeconds`, `getOpenPresenceCheck`, `getMaxAwayMs`, `getResponseSeconds`, `isNoteValid`. Rules: 60 s per trip away / 180 s total per 25 min (phone only), random checks (`planPresenceChecks`: phone 1, desktop 2 per 25 min, 90 s to answer, never in the first/last 3 min), clock moving back > 5 s breaks, note ≥ 5 chars. `limit_scale` multiplies all time limits (dev mode) |
| `reward_config.ts` | Tuning knobs: `CHEST_RATES` (daily / silver / milestone), `SILVER_CHEST_EVERY_DAYS`, pity (`PITY_EPIC_AT` 10, soft legendary from 35 at +2 % per chest, hard at 50), `SHARDS_FOR_DUPLICATE`, `SHARD_COST` |
| `reward_catalog.ts` | `REWARD_CATALOG`: 36 items (`id`, `slot`, `rarity`, `source` default / gacha / milestone): 5 defaults, 6 titles, 4 themes, 4 sound packs, 4 timer skins, 5 rare flames, 8 tier flames. `getItem()`, `getDefaultItemIds()`, `getGachaPool(rarity)`, `getMilestoneFlameId(tier)` |
| `gacha_engine.ts` | `getEffectiveRates()` (soft pity takes odds from the lowest rarities), `rollRarity()` (hard epic pity upgrades low rolls keeping the epic : legendary ratio), `nextPity()`, `openChest()` → `{ rarity, item_id, is_duplicate, shards_gained, next_pity }`, `exchangeShards()`, `getChestsForKeptDay(prev, new)` (daily always, silver every 7th day, milestone on a new tier) |

### i18n (`src/i18n/`)
| File | Role |
|---|---|
| `strings.ts` | `Language` (`vi` / `en`), `STRINGS` tables (Vietnamese defines `StringKey`, English must match), `translate(language, key, params)` fills `{name}` placeholders, `tierNameKey()` / `tierWordsKey()` / `itemNameKey()` / `monthNameKey()` / `weekdayKey()` / `sportActivityKey()` build `tier_<index>_name/_words`, `item_<id>`, `month_<1..12>`, `weekday_<0..6>` and `sport_<activity>` keys |
| `date_format.ts` | `DateFormat` (`day_first` / `month_first`), `DEFAULT_DATE_FORMAT` = day first, `formatDayMonth(day_key, format)` → `07/11` or `11/07` |
| `use_t.ts` | `useT()` hook: returns `t(key, params)` bound to `settings_store.language`; components re-render when it changes |

### App shell
| File | Role |
|---|---|
| `src/main.tsx` | Imports bundled fonts (Space Grotesk 500/700, Space Mono 400/700, Patrick Hand 400 for the sketch theme; Vietnamese subsets), `global.css` and `sketch_theme.css`; initializes the settings store; unlocks audio on the first `pointerdown` / `touchend` / `click`; calls `useFocusStore.recoverAfterReload()` so a session interrupted by closing the app is judged on launch; mounts `App` |
| `src/app.tsx` | Holds `active_tab` state (no router), animates screen transitions, mounts `InkFilters` once, renders `TabBar`, the `FocusSessionLayer` and the `LevelUpGate` above everything |

### Styles (`src/styles/`)
| File | Role |
|---|---|
| `tokens.css` | CSS variables: paper/ink colors, tile face/side colors, flat palette (flame, pink, cyan, yellow, blue, lilac), accent, button colors, rarity colors, radii, shadows, fonts (`--font-display`, `--font-ui`, `--font-mono`), layout sizes |
| `global.css` | Reset, paper background, no text selection / tap highlight / overscroll, global `.mono_label` class, reduced-motion support |
| `sketch_theme.css` | Sketch theme, on with `<html data-theme="sketch">`: token overrides (paper/ink colors, Patrick Hand for every font role, no fake bold), paper grain, pre-drawn wobbly outlines as SVG data URIs (`--sk-frame-image` 9-slice, `--sk-pill-image`, `--sk-circle-image`), and the opt-in global classes: `sk-frame` (`::before` = ink outline via `border-image` + `--sk-fill` inside; `::after` = hatched shadow), `sk-flat` (no shadow), `sk-pill`, `sk-round`, `sk-abs` / `sk-fixed` (keep positioning), `sk-hatch-block` (a thickness band becomes hatching), `sk-input`, `sk-hide`, `sk-only` (hidden outside the sketch theme), `sk-no-shadow`. No SVG filter runs on UI elements (they are slow on iPhone). In other themes all of this does nothing |

### Design system (`src/ui/`)
| File | Role |
|---|---|
| `motion_presets.ts` | Shared springs: `SPRING_PRESS`, `SPRING_SLIDE`, `SPRING_POP` (position/scale only: it overshoots) and `OPACITY_FADE` (tween to pair with springs so opacity never bounces back) |
| `ink_filters.tsx` | `InkFilters`: hidden SVG with shared, never-animated defs, mounted once in `App`: `ink-rough-a/b/c` (three wobbles with different noise; boiling ink is drawn once per filter and CSS shows one copy at a time), `ink-rough` (single static wobble for ink that does not boil: dial, chest, broken dial ring), `paper-lift` (paper drop shadow), `sketch-hatch` pattern. Exports `INK_BOIL_FRAMES`, `INK_ROUGH_FILTER`, `PAPER_LIFT_FILTER` |
| `pressable.ts` | `getPressableProps(onActivate, is_disabled, role)`: role, tabIndex, `aria-disabled`, click and Enter/Space handling for div-based tap targets |
| `tactile_button.tsx` | Extruded button (`div` + `getPressableProps` + `HapticOverlay`): face sinks into its side band on press (spring), `press`/`release` sounds on pointer down/up, Android vibration on click. Variants `accent`/`neutral`/`ink`, sizes `sm`/`md`/`lg` (`lg` is uppercase display text), latched `is_selected` (ink face), `is_disabled` |
| `toggle_switch.tsx` | On/off switch (`div` role switch + `HapticOverlay`): absolutely positioned knob (only `x` animates, stays vertically centered), even inset ring on the track, `toggle` sound + haptic |
| `segmented_switch.tsx` | Generic `SegmentedSwitch<Value>`: sunken track, labeled options (`div` role radio + `HapticOverlay`), raised ink thumb that slides (`useId` layoutId per instance); even shadows and cap-height-trimmed labels (`text-box`) for optical centering; used for VI / EN |
| `tab_bar.tsx` | Floating extruded dock (div tabs + `HapticOverlay`); `TabId` = streak (Journey), focus, rewards, settings with translated labels; ink pill slides between tabs (`layoutId`) |
| `screen.tsx` | Page frame: safe-area padding, optional mono `kicker` (with optional `onKickerTap`) + display `title`, left or center aligned |
| `ribbon.tsx` | Banner with folded notched tails; colors `blue`/`ink`/`flame`; pops in |
| `typewriter_text.tsx` | Types text character by character with soft `tick` sounds; each new character fades in from a warm accent glow to ink (no caret); an invisible copy reserves the final size so layout does not jump (the typed layer is 2 px wider each side so per-character spans never wrap a line early); restarts when `text` changes |
| `modal_card.tsx` | `ModalCard`: paper card that drops in over a dimmed backdrop (tap the backdrop to close). Portaled into `<body>` so no transformed parent can trap it, and placed near the top so the iPhone keyboard never covers its fields |
| `hold_button.tsx` | Press-and-hold to confirm (default 2 s): a fill grows while held, letting go cancels. Used for "give up"; a real `<button>` (no haptic overlay: a hold is not a tap) |
| `haptic_overlay.tsx` | Nearly invisible real `<input type="checkbox" switch>` stretched over a tap area, so the finger itself toggles a switch and iOS buzzes (newer iOS ignores programmatic clicks). Renders nothing when haptics are off or the target is disabled. Parent must be `position: relative` and not a `<button>` |
| `icons.tsx` | Inline SVG icons (flame, timer, chest, gear) using `currentColor` |

### Sound (`src/sound/`)
| File | Role |
|---|---|
| `sfx_engine.ts` | Web Audio synthesizer. Leaving the app (`visibilitychange` hidden / `pagehide`) closes the context and sets `navigator.audioSession.type` back to `auto`, so iOS stops listing the app as playing audio (Dynamic Island) when nothing plays; `setBackgroundPlaybackActive(true)` (for future music/podcasts) keeps it alive instead. `playSfx` is skipped while hidden so a delayed sound cannot reopen the session. `playSfx(name, loudness_scale = 1)` for `press`, `release`, `tab`, `toggle`, `chime`, `tick`, `whoosh`, `sparkle`, `crack`, `rise` (level-up charge: a pentatonic run that speeds up and gets louder), `burst` (boom + crack + major chord); `loudness_scale` > 1 for escalating alarms. Context lifecycle: every return from the background marks audio stale (the context was released, or a kept one can report "running" yet stay silent on iOS) and resumes a kept one; `unlockAudio()` rebuilds a fresh context only inside a real user gesture (`navigator.userActivation.isActive`), otherwise just resumes; a failed/timed-out resume (400 ms) also marks it stale. `isAudioStale()` tells the UI a tap is needed. Sets `navigator.audioSession.type = 'playback'` whenever a context is created, so sounds play with the silent switch on |
| `haptic_hack.ts` | `triggerHaptic()`: Vibration API only (Android), called from click handlers. iPhone haptics come from `HapticOverlay` |

### Stores (`src/stores/`)
| File | Role |
|---|---|
| `clock.ts` | Browser-side helpers: `getDayKeyAt(epoch_ms)` / `getTodayKey()` (device time zone), `detectDevice()` (`pointer: coarse` → phone), `createId()` |
| `settings_store.ts` | Zustand + persist (`mnm-settings`): `language`, `is_sound_enabled`, `sfx_volume`, `is_haptic_enabled`, `is_dev_mode` (+ `toggleDevMode`), `date_format` (+ `setDateFormat`), `theme: AppTheme` (`classic_3d` / `paper_ink` / `sketch`, default `DEFAULT_THEME` = `paper_ink`, + `setTheme`; chosen in Settings until themes become collection items). `ArtStyle` (`extruded` / `paper_ink`), `getArtStyle(theme)` (3D → extruded, others → paper + ink), `useArtStyle()`. Subscribes the sound/haptic engines and `<html>` `lang` + `data-theme` to every change |
| `progress_store.ts` | Zustand + persist (`mnm-progress`): `first_day_key`, `sessions` (SessionRecord history), `sport_check_ins`, `goal_schedule` (default 2, range 1–12), `sport_weekday_schedule` (default Mon + Thu), `celebrated_tier_index` (highest tier whose level-up was shown). Actions `addSession`, `setDailyGoal(goal, today)` (applies tomorrow), `checkInSport(check_in)` (ignored unless `canCheckInSport`), `setCelebratedTier`. Derived via core, never stored: `useDayRecords()` (memoized `DayRecord[]`, first day → today), `useTodayProgress()` → `{ today, done, goal, target, is_kept, sessions_to_keep, is_sport_day, sport_check_in }`, `useStreak()` → `StreakState`, `useGoalSetting()` → `{ today_goal, tomorrow_goal }`, `getTodayRecord()` |
| `focus_store.ts` | Zustand + persist (`mnm-focus`): `selected_length`, `session` (`FocusGuardState`), `clock_origin`, `time_scale` (1, or `DEV_TIME_SCALE` = 25). `getSessionNow()` = real time sped up by `time_scale`. Actions run the core state machine: `start(device, is_dev_mode)` (limit_scale = time_scale), `tick`, `appHidden`, `appVisible`, `answerCheck`, `giveUp`, `submitNote(note)`, `dismiss`, `recoverAfterReload` (phone: time closed counts as time away). Broken and completed sessions are written to `progress_store`. A `merge` step upgrades sessions saved without `limit_scale` |

### Features (`src/features/`)
| File | Role |
|---|---|
| `streak/streak_screen.tsx` | Journey tab (scrolls). Hero: translated tier name ("???" when locked), ribbon (streak count / passed / lock with unlock day), `Flame` (mystery when locked), typewriter words (locked: "keep the flame n more days"), progress counter + bar to next tier (labeled by level number, not name), `TierStrip` (the preview jumps back to the current tier whenever the tier changes). Below: `SportCheckIn` (sport days only), `StreakStats`, `StreakCalendar`, and in dev mode a preview `SportCheckIn` (when asked) + `DevJourneyPanel`. Dev overrides (fake streak, flame color, level-up replay, sport preview) live in local state and are never saved |
| `streak/paper_flame.tsx` | `PaperFlame({ tier_index, color_id, size, is_bursting, is_mystery })`: three-tongue silhouette as `layer_count` cut paper layers (outer = darkest shade, core = lightest, each slightly off-center with `paper-lift`) that pop up one by one; then a bold ink outline + thin core outline draw themselves (`pathLength`), plus a white cartoon shine on the lit side. Only after the flame settles (1.55 s) do flame-tip sparks start drifting up, one every 0.65 s. Built as stacked layers for 60 fps: one paper SVG, three ink SVGs (one per `INK_BOIL_FRAMES` filter) whose wrapper divs CSS flips by opacity 8 times a second (the "boil"), and a sway wrapper animated with a CSS transform; sparks and galaxy stars are small HTML-positioned SVGs animated with transform/opacity. Glow fades in and breathes; hue cycling for rainbow colors. `is_bursting` throws the layers apart and fades the ink; `is_mystery` uses blank paper + an inked "?" |
| `streak/low_poly_flame.tsx` | 3D theme flame, same props as `PaperFlame`: 20 shell + 5 core triangle facets with 4-shade lighting that fly in and assemble; `is_bursting` throws them apart; sway; floating shards and rising embers (`LOW_POLY_COUNTS` per tier); glow and stars from `TIER_EFFECTS`; `is_mystery` = charcoal silhouette + "?" |
| `streak/flame.tsx` | `Flame`: picks `LowPolyFlame` (3D theme) or `PaperFlame` from `useArtStyle()`; used by the Journey and level-up screens |
| `streak/flame_palettes.ts` | Colors and effects are separate. `TIER_COLORS[tier]` (shades, core, glow, shard colors, `is_hue_cycling`), `TIER_EFFECTS[tier]` (`layer_count` 3–6, `spark_count` 1–6, `glow_pulse`, `has_stars`; they grow with the tier), rare flame item colors (ice, toxic, shadow, gold 24K, aurora), `MYSTERY_COLORS` / `MYSTERY_EFFECTS` (blank paper, calm) for locked tiers. `getFlameColors(tier, color_id)` (no id / `flame_follow_tier` → tier colors, `flame_tier_N` → tier N colors), `getFlameEffects(tier)` |
| `streak/tier_strip.tsx` | Extruded strip of 9 mini flames (paper + ink: three-tongue shape with ink outline, dashed when locked; 3D: faceted outline; locked badges are labeled by level, not name) with a sliding marker; tap to show above |
| `focus/focus_screen.tsx` | Idle Focus tab (time digits swap with spring movement + `OPACITY_FADE`): `TimerDial` or `ExtrudedTimerDial` by art style (ratchet ticks on change), mono time, today's pips from `useTodayProgress()`, 25/50 selector (persisted), start button (starts a session; shows a DEV badge in dev mode). Kicker shows "session n / target" (target = goal, or 1 on a checked-in sport day), or "goal done" once the day is kept; pips follow the target; 5 taps on it toggle dev mode with a toast |
| `focus/timer_dial.tsx` | `TimerDial({ sweep_degrees })`: SVG kitchen timer in paper + ink, as five stacked layers so turning stays smooth: paper face + pink disc (static, `paper-lift`; hatched shadow circle only in the sketch theme via `sk-only`), the lighter wedge (the only SVG that redraws while the spring runs, clipped to the disc), ink outlines + 60 ticks (static `ink-rough`), the blue needle (an HTML layer rotated by the GPU), and the hub |
| `focus/extruded_timer_dial.tsx` | 3D theme dial, same props as `TimerDial`: CSS-built extruded cream ring with 60 ticks, pink disc with thickness, SVG wedge, blue needle in an unclipped layer with a fixed shadow |
| `focus/focus_session_layer.tsx` | Fixed full-screen layer while a session exists; runs `useFocusGuard` and `useWakeLock`; picks the view by status; plays the time-up chime (3 rings), crack + haptic on break, sparkle on completion |
| `focus/session_running.tsx` | Black running view: "tap to turn sound back on" pill while `isAudioStale()` (any tap on the view rebuilds audio), label (+ DEV chip), thin progress ring, big countdown, time-away budget (phone) or desktop check count, leave hint, hold-to-give-up; shows `PresenceCheck` when a check is open |
| `focus/presence_check.tsx` | "Still there?" over a solid accent screen with a pulsing flash, countdown in real seconds, big answer button; chime rings every 8 s, louder each time (0.6 → 2.2) |
| `focus/session_note.tsx` | "What did you do?" textarea (17 px so iOS doesn't zoom), live min-length hint, save button disabled until valid |
| `focus/session_done.tsx` | Celebration: today's pips (target) with the new one popping in, "flame kept today" ribbon when the day is kept, typewriter line (goal met / `sessions_to_keep` left), continue |
| `focus/session_broken.tsx` | `ShatteredDial` (or `ExtrudedShatteredDial` in the 3D theme), reason card with an icon per `BreakReason`, typewriter encouragement, retry (starts a new session) / back |
| `focus/shattered_dial.tsx` | The paper dial breaking: the pink paper disc tears into 7 shards along bent cracks from an off-center origin (shared edges, so it starts whole), each shard has `paper-lift` and a plain ink outline (moving parts carry no filter); shards burst out and drop with springs, the needle snaps and falls (an invisible hub-centered circle makes it rotate around the hub), inked debris triangles fly and fade; the paper face with `ink-rough` ticks stays intact |
| `focus/extruded_shattered_dial.tsx` | 3D theme broken dial: extruded ring stays, the pink disc splits into 7 thick shards (visible side band), needle snaps, debris |
| `focus/use_focus_guard.ts` | While running: 1 s tick interval, `visibilitychange` → hidden/visible, `pagehide` → hidden |
| `focus/use_wake_lock.ts` | Screen wake lock while active; re-requested whenever the page becomes visible; fails silently |
| `focus/format_time.ts` | `formatClock(seconds)` → `mm:ss` (rounded up) |
| `streak/sport_check_in.tsx` | Sport-day card: before the check-in a hint + accent button opening a `ModalCard` (5 activities with emoji, "what did you train?" line of at least 3 chars, cancel / check-in); after it, the activity, the note and either the "flame kept" ribbon or the sessions still needed. `is_preview` (dev): saving only closes the card |
| `streak/streak_stats.tsx` | Two tiles: best streak, and freezes as ice cubes (owned ones raised, empty slots sunken up to `getFreezeCap`) with "+1 in n days" or "full" |
| `streak/streak_calendar.tsx` | Month heatmap from `day_results`: Monday-first grid; raised flame tiles (kept), ice tiles with ❄ (frozen), sunken crossed-out numbers (missed), outlined tile (today), faint numbers outside history. Arrows page `MONTHS_AROUND_TODAY` (12) months back and forward, further back if history is older (the grid slides with direction-aware variants); away from this month the title becomes "← back to this month". Tapping a day shows date (`formatDayMonth` with the chosen format) · sessions · result (· workout). Legend |
| `streak/level_up_overlay.tsx` | `LevelUpOverlay({ level_up, color_id, onClose })`, portaled into `<body>`, z-index 70. Timeline: charge 1.15 s (old flame shakes and swells, `rise`); ready: the flame area is a tap target with a `HapticOverlay` (iPhones only buzz under a real finger) and a pulsing "tap the flame · n more" hint, each of `TAPS_TO_BURST` (3) taps jolts it (`useAnimate`), swells it and plays a growing `crack`; the last tap bursts (paper layers fly apart, white flash, `burst` + Android vibration, 0.52 s); reveal (new flame assembles, `sparkle`, sunburst rays in the new glow color, "Level up!" + tier name, ribbon "Level n · d days", typewriter words); the continue button appears 1.3 s later |
| `streak/level_up_gate.tsx` | Mounted in `App`: compares `useStreak().current_tier_index` with `celebrated_tier_index`; shows `LevelUpOverlay` when higher and no focus session is open, saves the tier on close; lowers the celebrated tier after a lost streak |
| `streak/dev_journey_panel.tsx` | Dev-mode tools: streak slider 0–`DEV_MAX_STREAK` (400), flame color swatches (default + chest flame colors from `REWARD_CATALOG`), "play level up", "try sport check-in", "use real streak" |
| `rewards/chest_screen.tsx` | 2.5D chest (`ChestArt`, or `ExtrudedChestArt` in the 3D theme) that floats and rattles when tapped (typewriter line changes after 3 taps), chest count ribbon, rarity teaser cards with drop rates. Epic: purple sweep, pulsing gem, sparkles. Legendary: rotating conic gold border (`@property --border-angle`), pulsing glow, gold sweep, spinning gem, gold gradient text, more sparkles |
| `rewards/chest_art.tsx` | 2.5D chest as flat paper faces (front, side, lid, bands, lock) under one `paper-lift` shadow, every face outlined in static `ink-rough` ink, lit-edge highlights |
| `rewards/extruded_chest_art.tsx` | 3D theme chest: flat-shaded SVG faces (front, side, lid, bands, lock) with lit-edge highlights |
| `settings/settings_screen.tsx` | Goal group (− / + stepper editing tomorrow's goal, caption shows today vs tomorrow when pending), General (VI / EN, DD/MM / MM/DD), Sound & haptics (sound, volume, haptic toggle), dev mode only: sound test buttons (incl. `rise`, `burst`) + haptic-only button, version |

Each `.tsx` with styles has a sibling `<name>.module.css` (CSS Modules); the focus session views share `focus/focus_session.module.css`.

### Tests (`tests/`)
| File | Role |
|---|---|
| `flame_tiers.test.ts` | Milestones, tier lookup for every boundary, next tier, progress ratio, level-up detection and celebrated-tier settling |
| `i18n_strings.test.ts` | English and Vietnamese have identical keys, every tier has a name + words in both languages, placeholder filling, every month / weekday / sport activity key exists |
| `day_key.test.ts` | 4 AM boundary, time zones, year/leap-year math, weekdays, scheduled values applying tomorrow |
| `day_records.test.ts` | Completed-session counting, sport weekdays, one record per day, per-day goals, end-to-end streak from raw history |
| `streak_engine.test.ts` | Kept-day rules (goal, sport day), freeze earning/spending, freeze caps by streak, resets, best streak, pending today |
| `session_rules.test.ts` | Presence-check planning, honest session to completion, leave-app limits (phone vs desktop, 25 vs 50 min), missed / late checks, clock rollback, dev `limit_scale`, give up |
| `calendar_month.test.ts` | Month keys and month math across years, days per month (leap years), Monday-first padding, 4-row February |
| `sport_rules.test.ts` | Check-in once and only on sport days, note length, `getDayTarget` and `getSessionsToKeep` on normal and sport days |
| `date_format.test.ts` | Day-first / month-first short dates, zero padding, default format |
| `gacha_engine.test.ts` | Config sums, catalog integrity + i18n names, soft/hard pity, 10,000-chest simulation, duplicates → shards, shard exchange, chests per kept day |

Each core test file also pins the numbers agreed in the plan, so an accidental edit to a rule fails a test.

## Empty folders reserved by the plan
`src/features/music/`, `src/features/onboarding/`, `public/audio/lofi/`, `public/audio/ambient/`.

## Data flow
- **Session:** Focus start → `focus_store.start` → core `startSession`. `useFocusGuard` feeds ticks and visibility events → core state machine → new `session`. On break or completion, `focus_store` writes a `SessionRecord` to `progress_store`.
- **Progress:** `progress_store` history → core `buildDayRecords` (`useDayRecords`) → `computeStreak` → Journey (streak, tier, freezes, calendar) and Focus/Done screens (today's done / goal / sessions to keep).
- **Sport day:** Journey `SportCheckIn` → `progress_store.checkInSport` → day record `sport_checked_in` → `isDayKept` needs only `SPORT_DAY_MIN_SESSIONS`.
- **Level up:** `useStreak().current_tier_index` vs stored `celebrated_tier_index` → `getLevelUp` → `LevelUpGate` shows `LevelUpOverlay` → closing it saves the tier.
- **Settings:** `settings_store` → subscription → `sfx_engine` / `haptic_hack`; `language` → `useT()` → every visible string; `date_format` → `formatDayMonth` in the calendar.
- **Flame visuals:** theme → `useArtStyle()` → `Flame` (`paper_flame` or `low_poly_flame`) ← tier index (+ optional color item id) via `getFlameColors` / `getFlameEffects`; `TIER_COLORS` → `tier_strip`. Ink and paper effects come from the shared `InkFilters` defs.
- **Theme:** `settings_store.theme` → `<html data-theme>` → `sketch_theme.css` restyles every element tagged with the `sk-*` classes.

## Conventions
- Variables `snake_case`, functions `camelCase`, components/types/enums `PascalCase`, constants `UPPER_SNAKE_CASE`.
- Files `snake_case`, including React component files (`tab_bar.tsx` exports `TabBar`). CSS Module class names are `snake_case`.
- Component props use `snake_case` fields (`is_selected`, `aria_label`); callback props are `camelCase` (`onChange`).
- Tap targets: `div` + `getPressableProps` + `<HapticOverlay />`, never `<button>` (except `HoldButton`).
- Framed UI (tiles, buttons, switches, pips, cells, ribbons, inputs) carries the global `sk-*` classes so the sketch theme can redraw it; pick the fill with `--sk-fill` in the component CSS. Illustrations use the `InkFilters` filters (`INK_BOIL_FRAMES` / `ink-rough` for ink, `paper-lift` for paper layers).
- Smoothness on iPhone: never animate an SVG filter or put a filter on something that moves every frame; draw filtered art once and move it as an HTML layer (transform/opacity, `will-change`), and give UI elements no SVG filters (the sketch theme uses pre-drawn images).
- Never animate opacity with a bouncy spring (it overshoots and brings ghosts back); pair springs with `OPACITY_FADE`.
- Zustand: select single values (or functions) per hook call; never return a new object from a selector (Zustand 5 would re-render forever).
- Allman braces; English code comments with aligned trailing `//` comments.
- All visible text comes from `src/i18n/strings.ts` via `useT()` (both `vi` and `en`); "VI"/"EN" and "DD/MM"/"MM/DD" labels and the "Tiếng Việt · English" caption are the only literals. Display and mono text is uppercased with CSS (`text-transform`), not in the source strings.
- Lint with ESLint + @stylistic; Prettier is not used.
