import type { CSSProperties, ReactNode } from 'react';
import type { RewardItem } from '../../core/reward_catalog';
import type { ItemSlot } from '../../core/types';
import { useArtStyle } from '../../stores/active_theme';
import { densifyPolygon, ellipsePoints, samplePath, sketchOutline, SKETCH_INK } from '../../ui/sketch_draw';
import { BadgeIcon, PaletteIcon, SoundIcon, TimerIcon } from '../../ui/icons';
import { SketchBadgeIcon, SketchPaletteIcon, SketchSoundIcon, SketchTimerIcon } from '../../ui/sketch_icons';
import { getFlameColors } from '../streak/flame_palettes';
import { MiniFlame } from '../streak/mini_flame';
import styles from './item_preview.module.css';

// A small picture of an item for the Collection (card and detail sheet):
// - flame colors: a mini flame painted with that color
// - themes:       a swatch of the theme's paper, accent and ink
// - other slots:  the slot's icon on a disc in the item's own tint
// - not owned:    a "?" (dashed box in 3D, a scribbled ring in sketch)
// Plain vectors; the sketch lines are computed once at module load.

// Display tints per item (timer skins, sound packs, titles)
const ITEM_TINTS: Record<string, string> = {
    timer_classic: '#ff5a1f',
    timer_retro_lcd: '#6fae3a',
    timer_nixie: '#ff8a3d',
    timer_neon: '#ff3fa4',
    timer_hourglass: '#d9a441',
    sound_classic: '#ff5a1f',
    sound_mechanical: '#5b6b7f',
    sound_wood: '#b07a46',
    sound_retro: '#2fb59a',
    sound_wind_chime: '#5fb0dd',
    title_beginner: '#9c958a',
    title_night_owl: '#5a5fd6',
    title_early_bird: '#f0a500',
    title_cafe_warrior: '#8a5a3c',
    title_deadline_slayer: '#e0443c',
    title_focus_monk: '#3a9f73',
    title_exam_survivor: '#9a5bff',
};

interface ThemeSwatch
{
    paper: string;
    accent: string;
    ink: string;
}

// Preview colors per theme item
const THEME_SWATCHES: Record<string, ThemeSwatch> = {
    theme_classic: { paper: '#f2eee7', accent: '#ff5a1f', ink: '#141414' },
    theme_sketch: { paper: '#f6f1e6', accent: '#ff5a1f', ink: SKETCH_INK },
    theme_midnight: { paper: '#1d2238', accent: '#8fa3ff', ink: '#e9ecff' },
    theme_matcha: { paper: '#e3ead3', accent: '#5b8a3c', ink: '#24301b' },
    theme_sunset: { paper: '#ffe3cc', accent: '#ff6f59', ink: '#3d1f1a' },
    theme_ocean: { paper: '#d8eef4', accent: '#1f7fae', ink: '#0f2a38' },
};

const FALLBACK_TINT = '#9c958a';

// Hand-drawn lines for the sketch theme (preview viewBox 0 0 48 48)
const SKETCH_RING = sketchOutline(ellipsePoints(24, 24, 18.5, 18, 14), 0.7, 23, 4);
const SKETCH_DISC = sketchOutline(ellipsePoints(24, 24, 19, 18.5, 14), 0.6, 29, 3);
const SKETCH_CARD = sketchOutline(densifyPolygon(samplePath('M6 8 L42 7 L42.5 41 L5.5 41.5 Z'), 7), 0.6, 37, 3);
const SKETCH_LINES = 'M11 30.5 C16 29.6 21 30.4 27 29.8 M11 35.5 C15 35 18 35.6 21.5 35.2';
const SKETCH_SCRIBBLE = 'M30 12.5 C33.5 11 37 12.6 37 16 C37 19.6 32.8 21 30.4 19.2 C28.4 17.6 29.6 14.4 32.6 14.6';

function SlotGlyph(props: { slot: ItemSlot; is_sketch: boolean; size: number })
{
    const size = props.size;
    switch (props.slot)
    {
        case 'timer_skin':
            return props.is_sketch ? <SketchTimerIcon size={size} /> : <TimerIcon size={size} />;
        case 'sound_pack':
            return props.is_sketch ? <SketchSoundIcon size={size} /> : <SoundIcon size={size} />;
        case 'theme':
            return props.is_sketch ? <SketchPaletteIcon size={size} /> : <PaletteIcon size={size} />;
        default:
            return props.is_sketch ? <SketchBadgeIcon size={size} /> : <BadgeIcon size={size} />;
    }
}

function MysteryArt(props: { is_sketch: boolean })
{
    return (
        <svg viewBox="0 0 48 48" className={styles.art} aria-hidden="true">
            {props.is_sketch
                ? <path d={SKETCH_RING} fill="none" stroke="var(--color-ink-faint)" strokeWidth={2} strokeLinecap="round" />
                : <rect x="6" y="6" width="36" height="36" rx="10" fill="none" stroke="var(--color-ink-faint)" strokeWidth={2.5} strokeDasharray="5 4" />}
            <text x="24" y="31.5" textAnchor="middle" className={styles.mystery_mark}>?</text>
        </svg>
    );
}

function ThemeArt(props: { swatch: ThemeSwatch; is_sketch: boolean })
{
    const { paper, accent, ink } = props.swatch;
    if (props.is_sketch)
    {
        return (
            <svg viewBox="0 0 48 48" className={styles.art} aria-hidden="true">
                <path d={SKETCH_CARD} fill={paper} stroke={SKETCH_INK} strokeWidth={2} strokeLinejoin="round" />
                <path d={SKETCH_SCRIBBLE} fill="none" stroke={accent} strokeWidth={4} strokeLinecap="round" />
                <path d={SKETCH_LINES} fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 48 48" className={styles.art} aria-hidden="true">
            <rect x="6" y="10" width="36" height="34" rx="8" fill="rgba(0, 0, 0, 0.22)" />
            <rect x="6" y="6" width="36" height="34" rx="8" fill={paper} stroke="rgba(20, 20, 20, 0.12)" strokeWidth={1.5} />
            <circle cx="33" cy="15.5" r="5.5" fill={accent} />
            <rect x="11" y="26" width="17" height="3.5" rx="1.75" fill={ink} />
            <rect x="11" y="32" width="11" height="3.5" rx="1.75" fill={ink} opacity={0.55} />
        </svg>
    );
}

function DiscArt(props: { item: RewardItem; is_sketch: boolean; size: number })
{
    const tint = ITEM_TINTS[props.item.id] ?? FALLBACK_TINT;
    const glyph_size = Math.round(props.size * 0.48);
    if (props.is_sketch)
    {
        return (
            <span className={styles.disc_box}>
                <svg viewBox="0 0 48 48" className={styles.art} aria-hidden="true">
                    <path d={SKETCH_DISC} transform="translate(2 1.5)" fill={tint} opacity={0.75} />
                    <path d={SKETCH_DISC} fill="none" stroke={SKETCH_INK} strokeWidth={2} strokeLinecap="round" />
                </svg>
                <span className={styles.glyph} style={{ color: SKETCH_INK }}>
                    <SlotGlyph slot={props.item.slot} is_sketch size={glyph_size} />
                </span>
            </span>
        );
    }
    return (
        <span className={`${styles.disc_box} ${styles.disc}`} style={{ '--tint': tint } as CSSProperties}>
            <span className={styles.glyph}>
                <SlotGlyph slot={props.item.slot} is_sketch={false} size={glyph_size} />
            </span>
        </span>
    );
}

interface ItemPreviewProps
{
    item: RewardItem;
    is_owned: boolean;
    tier_index: number;           // the player's flame tier, for "follow tier" flames
    size: number;                 // px
}

export function ItemPreview(props: ItemPreviewProps)
{
    const is_sketch = useArtStyle() === 'sketch';
    const art_style = is_sketch ? 'sketch' : 'extruded';
    let art: ReactNode;
    if (!props.is_owned)
    {
        art = <MysteryArt is_sketch={is_sketch} />;
    }
    else if (props.item.slot === 'flame')
    {
        art = <MiniFlame colors={getFlameColors(props.tier_index, props.item.id)} art_style={art_style} className={styles.flame} />;
    }
    else if (props.item.slot === 'theme' && THEME_SWATCHES[props.item.id])
    {
        art = <ThemeArt swatch={THEME_SWATCHES[props.item.id]} is_sketch={is_sketch} />;
    }
    else
    {
        art = <DiscArt item={props.item} is_sketch={is_sketch} size={props.size} />;
    }
    return (
        <span className={styles.preview} style={{ width: props.size, height: props.size }}>
            {art}
        </span>
    );
}
