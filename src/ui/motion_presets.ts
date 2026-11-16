import type { Transition } from 'motion/react';

// Shared spring curves so every part of the app "feels" the same.

// Button press: quick and firm, tiny overshoot on release
export const SPRING_PRESS: Transition = { type: 'spring', stiffness: 900, damping: 30, mass: 0.6 };

// Elements sliding between positions (tab indicator, sheets)
export const SPRING_SLIDE: Transition = { type: 'spring', stiffness: 520, damping: 38 };

// Playful pop for things appearing (rewards, badges)
export const SPRING_POP: Transition = { type: 'spring', stiffness: 420, damping: 18 };
