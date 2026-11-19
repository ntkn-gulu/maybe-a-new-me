import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { createSeededRandom } from '../../core/rng';
import { formatClock } from '../focus/format_time';
import { getMusicPosition, seekMusic } from '../../sound/music_engine';
import { playSfx } from '../../sound/sfx_engine';
import styles from './player_card.module.css';

// The track as a waveform you can scrub: bars made from the track's id (the
// same shape every time, calm at the ends, livelier in the middle) with a
// faint reflection under them. Played bars turn ink, the bar under the
// playhead glows in the accent and breathes while music plays. A tap or a
// drag seeks; the time pair sits underneath.

interface WaveformProps
{
    track_id: string;
    is_playing: boolean;
}

const WAVE_BARS = 52;
const POSITION_POLL_MS = 250;

// Bar heights (0.15..1) from the track id
function waveHeights(track_id: string): number[]
{
    let seed = 0;
    for (const char of track_id)
    {
        seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
    }
    const random = createSeededRandom(seed);
    const raw = Array.from({ length: WAVE_BARS }, (_, index) =>
    {
        const shape = Math.sin((index / (WAVE_BARS - 1)) * Math.PI);
        return 0.15 + 0.85 * Math.pow(shape, 0.6) * (0.25 + 0.75 * random());
    });
    // Light smoothing: neighbors pull a little, so it reads as sound, not noise
    return raw.map((value, index) => value * 0.6 + ((raw[index - 1] ?? value) + (raw[index + 1] ?? value)) * 0.2);
}

// Where the playing track is, read a few times a second
function usePlaybackPosition(track_id: string, is_playing: boolean): { time: number; duration: number } | null
{
    const [position, setPosition] = useState(getMusicPosition());
    useEffect(() =>
    {
        const timer = window.setInterval(() => setPosition(getMusicPosition()), POSITION_POLL_MS);
        return () => window.clearInterval(timer);
    }, [track_id, is_playing]);
    return position;
}

export function Waveform(props: WaveformProps)
{
    const position = usePlaybackPosition(props.track_id, props.is_playing);
    const [preview, setPreview] = useState<number | null>(null);     // where a drag would seek to (0..1)
    const box = useRef<HTMLDivElement>(null);
    const heights = waveHeights(props.track_id);

    function fractionAt(event: PointerEvent<HTMLDivElement>): number
    {
        const rect = (box.current as HTMLDivElement).getBoundingClientRect();
        return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    }

    function release(): void
    {
        if (preview !== null && position)
        {
            seekMusic(preview * position.duration);
            playSfx('tick');
        }
        setPreview(null);
    }

    const played = preview ?? (position ? position.time / position.duration : 0);
    const playhead = Math.floor(played * WAVE_BARS);
    return (
        <div className={styles.progress}>
            <div
                ref={box}
                className={styles.wave_hit}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(played * 100)}
                onPointerDown={(event) =>
                {
                    if (position)
                    {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setPreview(fractionAt(event));
                    }
                }}
                onPointerMove={(event) => preview !== null && setPreview(fractionAt(event))}
                onPointerUp={release}
                onPointerCancel={() => setPreview(null)}
            >
                <svg className={styles.wave} viewBox={`0 0 ${WAVE_BARS * 6} 64`} preserveAspectRatio="none" aria-hidden="true">
                    {heights.map((height, index) =>
                    {
                        const is_head = index === playhead && props.is_playing;
                        const class_name = [styles.wave_bar, index < playhead ? styles.wave_played : '', is_head ? styles.wave_head : ''].join(' ');
                        return (
                            <g key={index} className={class_name}>
                                <rect x={index * 6 + 1} y={40 - height * 38} width="3.6" height={height * 38} rx="1.8" />
                                <rect className={styles.wave_mirror} x={index * 6 + 1} y="42" width="3.6" height={height * 16} rx="1.8" />
                            </g>
                        );
                    })}
                </svg>
            </div>
            <div className={styles.times}>
                <span>{formatClock(position ? played * position.duration : 0)}</span>
                <span>{position ? formatClock(position.duration) : '--:--'}</span>
            </div>
        </div>
    );
}
