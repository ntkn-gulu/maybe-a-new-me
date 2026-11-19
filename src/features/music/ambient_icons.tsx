import type { ReactNode } from 'react';
import type { AmbientLayerId } from '../../core/ambient_mix';
import styles from './ambient_icons.module.css';

// A tiny scene for each ambient layer. Line art in currentColor, so it reads
// in every palette and in the sketch theme. While the layer plays, the scene
// moves (drops fall, the flame flickers, the train window passes): CSS animations of
// transform and opacity only, which phones run off the main thread.

interface AmbientIconProps
{
    layer: AmbientLayerId;
    is_playing: boolean;
    size?: number;
}

const CLOUD = 'M9 15.5h13.5a4.5 4.5 0 0 0 .4-9 6.5 6.5 0 0 0-12.4 1.6A3.8 3.8 0 0 0 9 15.5z';

const SCENES: Record<AmbientLayerId, ReactNode> = {
    rain: (
        <>
            <path d={CLOUD} />
            <g className={styles.fall}><path d="M11 19l-1 3M16.5 19l-1 3M22 19l-1 3" /></g>
            <g className={`${styles.fall} ${styles.late}`}><path d="M13.5 24l-1 3M19 24l-1 3" /></g>
        </>
    ),
    wind: (
        <>
            <g className={styles.drift}><path d="M4 11h15a3.5 3.5 0 1 0-3.5-3.5" /></g>
            <g className={`${styles.drift} ${styles.late}`}><path d="M4 17h21a3.5 3.5 0 1 1-3.5 3.5" /></g>
            <g className={styles.drift}><path d="M7 23h8" /></g>
        </>
    ),
    waves: (
        <>
            <g className={styles.swell}><path d="M-4 13c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3 3-3 6-3 3 3 6 3" /></g>
            <g className={`${styles.swell} ${styles.late}`}><path d="M-4 20c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3 3-3 6-3 3 3 6 3" /></g>
            <path d="M3 26.5h26" />
        </>
    ),
    campfire: (
        <>
            <g className={styles.flicker}><path d="M16 4.5c1.6 3.4 5.5 5.2 5.5 10a5.5 5.5 0 0 1-11 0c0-2.4 1.2-4 2.4-5.2.3 1.6 1 2.5 1.8 2.8-.6-3 .4-5.6 1.3-7.6z" /></g>
            <path d="M6 27l20-5M26 27L6 22" />
        </>
    ),
    brown_noise: (
        <>
            {[6, 11, 16, 21, 26].map((x, index) => (
                <path key={x} className={styles.bar} style={{ animationDelay: `${-index * 0.37}s` }} d={`M${x} 9v14`} />
            ))}
        </>
    ),
    night_field: (
        <>
            <path d="M21 5.5a7.5 7.5 0 1 0 5.5 11.5A9 9 0 0 1 21 5.5z" />
            <g className={styles.twinkle}><path d="M7 7v3M5.5 8.5h3" /></g>
            <g className={`${styles.twinkle} ${styles.late}`}><path d="M11 20v3M9.5 21.5h3" /></g>
            <path d="M4 27c4-2 8-2 12 0s8 2 12 0" />
        </>
    ),
    creek: (
        <>
            <path d="M12 21c0-3 3-5 6-5s5 2 5 5z" />
            <g className={styles.drift}><path d="M3 11h9M17 11h6" /></g>
            <g className={`${styles.drift} ${styles.late}`}><path d="M6 25h7M18 25h10" /></g>
        </>
    ),
    countryside: (
        <>
            <g className={styles.twinkle}><circle cx="23" cy="8" r="3" /></g>
            <path d="M3 22c4-5 8-5 12-1 4-4 9-5 14 0" />
            <g className={styles.drift}><path d="M5 11c1.5-1 3-1 4 0M11 8c1.2-.8 2.4-.8 3.2 0" /></g>
            <path d="M3 27h26" />
        </>
    ),
    cafe: (
        <>
            <path d="M6 14h16v6a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" />
            <path d="M22 16h1.5a3 3 0 0 1 0 6H21" />
            <g className={styles.steam}><path d="M11 10c-1-1.5 1-2.5 0-4M16 10c-1-1.5 1-2.5 0-4" /></g>
            <path d="M5 29h18" />
        </>
    ),
    thunderstorm: (
        <>
            <path d={CLOUD} />
            <g className={styles.flash}><path d="M17 16.5l-3 5.5h4l-3 6" /></g>
            <g className={styles.fall}><path d="M10 19l-1 3M23 19l-1 3" /></g>
        </>
    ),
    night_train: (
        <>
            <rect x="4" y="6" width="24" height="17" rx="4" />
            <g className={styles.pass}><path d="M9 11h4M19 15h5M11 18h3" /></g>
            <path d="M8 27l2-4M24 27l-2-4M4 27h24" />
        </>
    ),
};

export function AmbientIcon(props: AmbientIconProps)
{
    const size = props.size ?? 34;
    return (
        <svg
            className={props.is_playing ? `${styles.icon} ${styles.playing}` : styles.icon}
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {SCENES[props.layer]}
        </svg>
    );
}
