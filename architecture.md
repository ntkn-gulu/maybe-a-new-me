# Architecture — Maybe A New Me

> Map of the code as it is now.

## Current state
App shell with 4 tabs and a tactile design system in a light "warm paper + extruded objects" style: 3D buttons, switches, ribbons, typewriter text, synthesized sounds, experimental iOS haptics. All UI text is bilingual (Vietnamese / English) with a switch in Settings. The Journey tab shows a low-poly flame for all 9 tiers (preview by tapping the tier strip). Focus and Rewards show layout/teasers only. Streak data is not stored yet (shown as 0). `src/core/` holds the flame tier thresholds.

## Tooling (project root)
| File | Role |
|---|---|
| `package.json` | Scripts: `dev`, `build` (type-check + Vite build), `preview`, `test` (Vitest), `lint` (ESLint) |
| `vite.config.ts` | React plugin; PWA manifest + service worker (auto update, precaches js/css/html/svg/png/woff2; PNG + SVG manifest icons); base path `/maybe-a-new-me/` for builds (GitHub Pages); Vitest config (`tests/**/*.test.ts`) |
| `tsconfig.json` | Strict TypeScript, bundler resolution, no emit (Vite compiles) |
| `eslint.config.js` | typescript-eslint + @stylistic (Allman braces, 4-space indent, semicolons, single quotes) + react-hooks |
| `index.html` | Entry page with iOS standalone meta tags, `apple-touch-icon`, light theme color, `viewport-fit=cover` |
| `public/icons/icon.svg` | App icon: low-poly flame (Xích Hỏa palette) on cream, used as favicon and manifest icon |
| `public/icons/apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | PNG renders of the same icon (iOS home screen needs PNG; 192/512 for the manifest). Generated from the flame facet coordinates with Windows System.Drawing |
| `.github/workflows/deploy.yml` | On push to `main`: `npm ci`, `npm test`, `npm run build`, publish `dist/` to GitHub Pages |
| `.gitignore` | Ignores build output plus local-only files that never go to GitHub: `CLAUDE.md` (AI context), the plan and playbook notes, `.vscode/` |

## Source files

### Core (pure TypeScript, no React / browser APIs)
| File | Role |
|---|---|
| `src/core/flame_tiers.ts` | `FLAME_TIERS` (9 tiers: `index`, `min_days`), `getTierForStreak()`, `getNextTier()`, `getTierProgress()` → `{ current, next, days_into_tier, days_to_next, ratio }`. Tier names/words live in i18n |

### i18n (`src/i18n/`)
| File | Role |
|---|---|
| `strings.ts` | `Language` (`vi` / `en`), `STRINGS` tables (Vietnamese defines `StringKey`, English must match), `translate(language, key, params)` fills `{name}` placeholders, `tierNameKey()` / `tierWordsKey()` build `tier_<index>_name/_words` keys |
| `use_t.ts` | `useT()` hook: returns `t(key, params)` bound to `settings_store.language`; components re-render when it changes |

### App shell
| File | Role |
|---|---|
| `src/main.tsx` | Mounts `App`; imports bundled fonts (Space Grotesk 500/700, Space Mono 400/700, all with Vietnamese subset) and global CSS; initializes the settings store; unlocks audio on the first `pointerdown` / `touchend` / `click` (touch screens only grant user activation on touchend/click) |
| `src/app.tsx` | Holds `active_tab` state (no router), animates screen transitions, renders `TabBar` |

### Styles
| File | Role |
|---|---|
| `src/styles/tokens.css` | CSS variables: paper/ink colors, tile face/side colors, flat palette (flame, pink, cyan, yellow, blue, lilac), accent, button colors, rarity colors, radii, shadows, fonts (`--font-display`, `--font-ui`, `--font-mono`), layout sizes |
| `src/styles/global.css` | Reset, paper background, no text selection / tap highlight / overscroll, global `.mono_label` class, reduced-motion support |

### Design system (`src/ui/`)
| File | Role |
|---|---|
| `motion_presets.ts` | Shared springs: `SPRING_PRESS`, `SPRING_SLIDE`, `SPRING_POP` |
| `tactile_button.tsx` | Extruded button: face sinks into its side band on press (spring), `press`/`release` sounds on pointer down/up, haptic on click. Variants `accent`/`neutral`/`ink`, sizes `sm`/`md`/`lg` (`lg` is uppercase display text), latched `is_selected` (ink face) |
| `toggle_switch.tsx` | On/off switch: absolutely positioned knob (only `x` animates, so it stays vertically centered), even inset ring on the track, `toggle` sound + haptic |
| `segmented_switch.tsx` | Generic `SegmentedSwitch<Value>`: sunken track with labeled options and a raised ink thumb that slides (`useId` layoutId per instance); shadows even on all sides and labels trimmed to cap height (`text-box`) so text is optically centered; used for VI / EN |
| `tab_bar.tsx` | Floating extruded dock; `TabId` = streak (Journey), focus, rewards, settings with translated labels; ink pill slides between tabs (`layoutId`) |
| `screen.tsx` | Page frame: safe-area padding, optional mono `kicker` + display `title`, left or center aligned |
| `ribbon.tsx` | Banner with folded notched tails; colors `blue`/`ink`/`flame`; pops in |
| `typewriter_text.tsx` | Types text character by character with soft `tick` sounds and a caret shown only while typing; reserves final size so layout does not jump; restarts when `text` changes |
| `icons.tsx` | Inline SVG icons (flame, timer, chest, gear) using `currentColor` |

### Sound (`src/sound/`)
| File | Role |
|---|---|
| `sfx_engine.ts` | Web Audio synthesizer. `playSfx(name)` for `press`, `release`, `tab`, `toggle`, `chime`, `tick`, `whoosh`, `sparkle`; `unlockAudio()`; volume/enable setters. Sets `navigator.audioSession.type = 'playback'` so sounds play with the silent switch on |
| `haptic_hack.ts` | `triggerHaptic()`: `navigator.vibrate` on Android; on iOS 18+ creates a hidden label wrapping `<input type="checkbox" switch>` in `<head>`, clicks it, removes it (system haptic tick). Must be called from a click handler (user activation) |

### Stores (`src/stores/`)
| File | Role |
|---|---|
| `settings_store.ts` | Zustand + persist (`mnm-settings`): `language`, `is_sound_enabled`, `sfx_volume`, `is_haptic_enabled`. Subscribes the sound/haptic engines and `<html lang>` to every change |

### Features (`src/features/`)
| File | Role |
|---|---|
| `streak/streak_screen.tsx` | Journey tab: translated tier name (display font), ribbon (streak count / "Đã đi qua" / lock with unlock day), `LowPolyFlame`, typewriter words, progress counter + bar to next tier, `TierStrip`. Uses `getTierProgress()` with a demo streak of 0 |
| `streak/low_poly_flame.tsx` | SVG flame of 20 shell facets + 5 core facets with 4-shade lighting; facets fly in and assemble on mount / tier change; whole flame sways; floating triangle shards; glow + ground shadow; `rainbow` (hue rotation) and `galaxy` (twinkling stars) effects |
| `streak/flame_palettes.ts` | `FLAME_PALETTES[tier_index]`: facet shades, core colors, glow, shard colors, effect |
| `streak/tier_strip.tsx` | Extruded strip of 9 mini flame badges (colored when reached, outlined when locked) with sliding marker; tap to preview |
| `focus/focus_screen.tsx` | Kitchen-timer dial: extruded cream ring with 60 ticks, pink disc clipping an SVG pie-slice wedge (`wedgePath()`, radius larger than the disc so no rim shows) for the session length, blue needle in an unclipped layer whose drop shadow stays fixed while it rotates (spring-driven, ratchet `tick` sounds on change); big mono time; daily goal pips; 25/50 selector; start button (plays chime, timer not implemented) |
| `rewards/chest_screen.tsx` | 2.5D chest that floats and rattles when tapped (typewriter line changes after 3 taps), chest count ribbon, rarity teaser cards with drop rates. Epic: purple light sweep, pulsing gem, sparkles. Legendary: rotating conic gold border (`@property --border-angle`), pulsing glow, gold sweep, spinning gem, shiny gradient text (deep golds for contrast), more sparkles. Card content is layered above the sweep |
| `rewards/chest_art.tsx` | Flat-shaded SVG chest (front, side, lid, bands, lock) |
| `settings/settings_screen.tsx` | General group (VI / EN language switch), sound toggle, volume slider, haptic toggle, sound preview buttons + a haptic-only test button, version |

Each `.tsx` with styles has a sibling `<name>.module.css` (CSS Modules).

### Tests (`tests/`)
| File | Role |
|---|---|
| `flame_tiers.test.ts` | Milestones, tier lookup for every boundary, next tier, progress ratio |
| `i18n_strings.test.ts` | English and Vietnamese have identical keys, every tier has a name + words in both languages, placeholder filling |

## Empty folders reserved by the plan
`src/features/music/`, `src/features/onboarding/`, `public/audio/lofi/`, `public/audio/ambient/`.

## Data flow
- `settings_store` (persisted in localStorage) → subscription → `sfx_engine` / `haptic_hack` module state. UI components call `playSfx()` / `triggerHaptic()` directly; they never read sound settings themselves.
- `core/flame_tiers` → `streak_screen` (tier + progress) → `low_poly_flame` / `tier_strip` (look up `FLAME_PALETTES` by tier index).
- `settings_store.language` → `useT()` → every component's visible text.

## Conventions
- Variables `snake_case`, functions `camelCase`, components/types/enums `PascalCase`, constants `UPPER_SNAKE_CASE`.
- Files `snake_case`, including React component files (`tab_bar.tsx` exports `TabBar`). CSS Module class names are `snake_case`.
- Component props use `snake_case` fields (`is_selected`, `aria_label`); callback props are `camelCase` (`onChange`).
- Allman braces; English code comments with aligned trailing `//` comments.
- All visible text comes from `src/i18n/strings.ts` via `useT()` (both `vi` and `en`); "VI"/"EN" labels and the "Tiếng Việt · English" caption are the only literals. Display and mono text is uppercased with CSS (`text-transform`), not in the source strings.
- Lint with ESLint + @stylistic; Prettier is not used.
