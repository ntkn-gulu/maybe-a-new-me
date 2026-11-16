import type { Transition } from 'motion/react';

// Shared spring curves so every part of the app "feels" the same.

// Button press: quick and firm, tiny overshoot on release
export const SPRING_PRESS: Transition = { type: 'spring', stiffness: 900, damping: 30, mass: 0.6 };

// Elements sliding between positions (tab indicator, sheets)
export const SPRING_SLIDE: Transition = { type: 'spring', stiffness: 520, damping: 38 };

// Playful pop for things appearing (rewards, badges).
// Use it for position/scale only, never opacity: it overshoots.
export const SPRING_POP: Transition = { type: 'spring', stiffness: 420, damping: 18 };

// Plain fade to pair with springs (opacity must not bounce)
export const OPACITY_FADE: Transition = { duration: 0.16, ease: 'easeOut' };
