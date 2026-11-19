import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { playSfx } from '../../sound/sfx_engine';
import { triggerHaptic } from '../../sound/haptic_hack';
import { SPRING_PRESS } from '../../ui/motion_presets';
import { useArtStyle } from '../../stores/active_theme';
import { ExtrudedTurntable } from './extruded_turntable';
import { SketchCassette } from './sketch_cassette';
import { useSpin } from './use_spin';
import styles from './record_deck.module.css';

// The Sound room's player object, and its biggest play key: a tap anywhere
// on it plays or pauses. 3D theme: a turntable whose tonearm swings onto
// the record, lands with a soft crackle, then the record spins up; pausing
// lifts the arm and the record coasts to a stop. Sketch theme: a cassette
// whose reels do the same.
// No HapticOverlay: the deck sits in a scrolling page (a swipe that starts
// on an iOS switch would not scroll).

interface RecordDeckProps
{
    is_playing: boolean;
    aria_label: string;
    onToggle: () => void;
}

// How long the tonearm takes to reach the record (record_deck.module.css .arm)
const ARM_SWING_MS = 560;

export function RecordDeck(props: RecordDeckProps)
{
    const art_style = useArtStyle();
    const is_sketch = art_style === 'sketch';
    const spin_delay = is_sketch ? 120 : ARM_SWING_MS;
    const rotate = useSpin(props.is_playing, spin_delay);
    const was_playing = useRef(props.is_playing);

    // The needle lands (or the tape engages) a moment after playing starts;
    // stopping lifts it. Also when playing starts from a preset or a tile.
    useEffect(() =>
    {
        const was = was_playing.current;
        was_playing.current = props.is_playing;
        if (props.is_playing && !was)
        {
            const timer = window.setTimeout(() => playSfx('needle'), spin_delay);
            return () => window.clearTimeout(timer);
        }
        if (!props.is_playing && was)
        {
            playSfx('lift');
        }
    }, [props.is_playing, spin_delay]);

    function toggle(): void
    {
        triggerHaptic();
        props.onToggle();
    }

    return (
        <motion.div
            className={styles.deck}
            role="button"
            tabIndex={0}
            aria-label={props.aria_label}
            aria-pressed={props.is_playing}
            onClick={toggle}
            onKeyDown={(event) =>
            {
                if (event.key === 'Enter' || event.key === ' ')
                {
                    event.preventDefault();
                    toggle();
                }
            }}
            whileTap={{ scale: 0.97, y: 3 }}
            transition={SPRING_PRESS}
        >
            {is_sketch
                ? <SketchCassette rotate={rotate} is_powered={props.is_playing} />
                : <ExtrudedTurntable rotate={rotate} is_arm_down={props.is_playing} is_powered={props.is_playing} />}
        </motion.div>
    );
}
