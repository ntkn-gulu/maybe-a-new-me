import { useEffect, useState } from 'react';
import { playSfx } from '../sound/sfx_engine';
import styles from './typewriter_text.module.css';

// Types text out one character at a time with soft key ticks,
// like the narration lines in a journey. Restarts when `text` changes.

interface TypewriterTextProps
{
    text: string;
    is_sound_on?: boolean;
    start_delay_ms?: number;
}

const CHAR_INTERVAL_MS = 34;
const TICK_EVERY_N_CHARS = 2;     // a tick on every char sounds too busy

export function TypewriterText(props: TypewriterTextProps)
{
    const [visible_count, setVisibleCount] = useState(0);
    const is_sound_on = props.is_sound_on ?? true;
    const start_delay_ms = props.start_delay_ms ?? 0;

    useEffect(() =>
    {
        setVisibleCount(0);
        let count = 0;
        let interval_id = 0;

        const start_id = window.setTimeout(() =>
        {
            interval_id = window.setInterval(() =>
            {
                count += 1;
                setVisibleCount(count);
                const typed_char = props.text[count - 1];
                if (is_sound_on && typed_char !== ' ' && typed_char !== '\n' && count % TICK_EVERY_N_CHARS === 0)
                {
                    playSfx('tick');
                }
                if (count >= props.text.length)
                {
                    window.clearInterval(interval_id);
                }
            }, CHAR_INTERVAL_MS);
        }, start_delay_ms);

        return () =>
        {
            window.clearTimeout(start_id);
            window.clearInterval(interval_id);
        };
    }, [props.text, is_sound_on, start_delay_ms]);

    const is_done = visible_count >= props.text.length;

    return (
        <p className={styles.text} aria-label={props.text}>
            {/* Invisible full text reserves the final size, so layout never jumps */}
            <span className={styles.ghost} aria-hidden="true">{props.text}</span>
            <span className={styles.typed} aria-hidden="true">
                {props.text.slice(0, visible_count)}
                {/* Caret only while typing; it disappears once the line is complete */}
                {!is_done && <span className={styles.caret} />}
            </span>
        </p>
    );
}
