# Architecture — Maybe A New Me

> Map of the code as it is now. Plan and game rules: `maybe_a_new_me_ke_hoach.md`. Build phases: `maybe_a_new_me_playbook.md`.

## Current state
App shell with 4 tabs, a tactile design system (3D buttons, switches, synthesized sounds, experimental iOS haptics) and PWA setup. Focus, Streak and Rewards screens show layout/empty states only; game logic (`src/core/`) is not written yet.

## Tooling (project root)
| File | Role |
|---|---|
| `package.json` | Scripts: `dev`, `build` (type-check + Vite build), `preview`, `test` (Vitest), `lint` (ESLint) |
| `vite.config.ts` | React plugin, PWA manifest + service worker (vite-plugin-pwa, auto update), base path `/maybe-a-new-me/` for builds (GitHub Pages), Vitest config (`tests/**/*.test.ts`) |
| `tsconfig.json` | Strict TypeScript, bundler resolution, no emit (Vite compiles) |
| `eslint.config.js` | typescript-eslint + @stylistic (Allman braces, 4-space indent, semicolons, single quotes) + react-hooks |
| `.vscode/settings.json` | Disables format-on-save/Prettier, fixes ESLint issues on explicit save action |
| `index.html` | Entry page with iOS standalone/status-bar meta tags and `viewport-fit=cover` |
| `public/icons/icon.svg` | App icon (flame) used by favicon and manifest |
| `CLAUDE.md` | Master context for Claude Code |

## Source files
| File | Role |
|---|---|
| `src/main.tsx` | Mounts `App`, loads global CSS, initializes the settings store, unlocks audio on the first pointer down |
| `src/app.tsx` | Holds `active_tab` state (no router), animates screen transitions, renders `TabBar` |
| `src/styles/tokens.css` | Design tokens as CSS variables: colors, accent (flame), button face/side colors, radii, shadows, fonts, safe-area insets |
| `src/styles/global.css` | Reset, dark body, no text selection / tap highlight / overscroll, reduced-motion support |
| `src/ui/motion_presets.ts` | Shared spring transitions: `SPRING_PRESS`, `SPRING_SLIDE`, `SPRING_POP` |
| `src/ui/tactile_button.tsx` | 3D button: face sinks into base on press (Motion spring), `press`/`release` sounds + haptic; variants `accent`/`neutral`, sizes `sm`/`md`/`lg`, latched `is_selected` state |
| `src/ui/toggle_switch.tsx` | On/off switch with spring knob, `toggle` sound + haptic |
| `src/ui/tab_bar.tsx` | Fixed bottom tab bar (`TabId`: streak, focus, rewards, settings) with sliding highlight pill (`layoutId`) |
| `src/ui/screen.tsx` | Page frame: safe-area padding, title/subtitle, space for the tab bar |
| `src/ui/icons.tsx` | Inline SVG icons (flame, timer, chest, gear) using `currentColor` |
| `src/sound/sfx_engine.ts` | Web Audio synthesizer. `playSfx(name)` for `press`, `release`, `tab`, `toggle`, `chime`; `unlockAudio()`; volume/enable setters. Sets `navigator.audioSession.type = 'playback'` so sounds play with the silent switch on |
| `src/sound/haptic_hack.ts` | `triggerHaptic()`: `navigator.vibrate` on Android; on iOS 18+ clicks a hidden `<input type="checkbox" switch>` label to get a system haptic tick |
| `src/stores/settings_store.ts` | Zustand + persist (`mnm-settings`): `is_sound_enabled`, `sfx_volume`, `is_haptic_enabled`. Subscribes the sound/haptic engines to every change |
| `src/features/focus/focus_screen.tsx` | Dial with minute ticks, animated time label, 25/50 selector, start button (plays chime; timer not implemented) |
| `src/features/streak/streak_screen.tsx` | Flickering ember SVG, streak count (static 0), next-tier hint |
| `src/features/rewards/chest_screen.tsx` | Empty state with wobbling chest |
| `src/features/settings/settings_screen.tsx` | Sound toggle, volume slider, haptic toggle, sound preview buttons, version |

Each `.tsx` with styles has a sibling `<name>.module.css` (CSS Modules).

## Empty folders reserved by the plan
`src/core/`, `src/features/music/`, `src/features/onboarding/`, `public/audio/lofi/`, `public/audio/ambient/`, `tests/`.

## Data flow
`settings_store` (persisted in localStorage) → subscription → `sfx_engine` / `haptic_hack` module state. UI components call `playSfx()` / `triggerHaptic()` directly; they never read sound settings themselves.

## Conventions
- Variables `snake_case`, functions `camelCase`, components/types/enums `PascalCase`, constants `UPPER_SNAKE_CASE`.
- Files `snake_case`, including React component files (`tab_bar.tsx` exports `TabBar`). CSS Module class names are `snake_case`.
- Component props use `snake_case` fields (`is_selected`, `aria_label`); callback props are `camelCase` (`onChange`).
- Allman braces; English code comments with aligned trailing `//` comments.
- Lint with ESLint + @stylistic; Prettier is not used.
