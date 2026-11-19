import { useRef } from 'react';
import { useAnimationFrame, useMotionValue, useReducedMotion, type MotionValue } from 'motion/react';

// A turning record (or cassette reels) with a little inertia: it speeds up
// to 33⅓ rpm in about half a second when playing starts, and coasts down
// for a second and a half when it stops, the way a real platter does.
// `start_delay_ms` holds the start back (the tonearm first has to land).
// Returns a rotation in degrees for a motion `style={{ rotate }}`.

const RPM = 100 / 3;
const DEGREES_PER_SECOND = RPM * 6;
const SPIN_UP_SECONDS = 0.5;
const SPIN_DOWN_SECONDS = 1.5;

export function useSpin(is_playing: boolean, start_delay_ms = 0, speed_scale = 1): MotionValue<number>
{
    const rotate = useMotionValue(0);
    const speed = useRef(0);                           // degrees per second right now
    const playing_since = useRef<number | null>(null); // frame time when playing started
    const is_reduced = useReducedMotion();

    useAnimationFrame((time, delta) =>
    {
        if (!is_playing)
        {
            playing_since.current = null;
        }
        else if (playing_since.current === null)
        {
            playing_since.current = time;
        }
        const has_started = playing_since.current !== null && time - playing_since.current >= start_delay_ms;
        const target = has_started && !is_reduced ? DEGREES_PER_SECOND * speed_scale : 0;
        if (speed.current === target && target === 0)
        {
            return;
        }
        const seconds = Math.min(delta, 100) / 1000;  // a long pause (hidden tab) must not jump
        const ramp = target > speed.current ? SPIN_UP_SECONDS : SPIN_DOWN_SECONDS;
        const step = (DEGREES_PER_SECOND * speed_scale / ramp) * seconds;
        speed.current = target > speed.current
            ? Math.min(target, speed.current + step)
            : Math.max(target, speed.current - step);
        rotate.set((rotate.get() + speed.current * seconds) % 360);
    });

    return rotate;
}
