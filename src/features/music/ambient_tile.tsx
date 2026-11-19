import { useRef, useState, type PointerEvent } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { getLevelDetent, type AmbientLayerId } from '../../core/ambient_mix';
import { playSfx } from '../../sound/sfx_engine';
import { triggerHaptic } from '../../sound/haptic_hack';
import { ChestIcon } from '../../ui/icons';
import { SPRING_PRESS } from '../../ui/motion_presets';
import { useT } from '../../i18n/use_t';
import { ambientLayerKey } from '../../i18n/strings';
import { AmbientIcon } from './ambient_icons';
import styles from './ambient_tile.module.css';

// One sound in the mixer. A tap switches it on or off; a sideways drag on a
// playing tile sets its volume, clicking at every 10% like a dial with
// detents. Vertical swipes are left to the page, so the grid still scrolls.
// No HapticOverlay here: a swipe starting on an iOS switch would move the
// switch instead of scrolling (same as the Collection cards).

interface AmbientTileProps
{
    layer: AmbientLayerId;
    is_active: boolean;
    is_playing: boolean;            // active and the mix is not paused
    level: number;
    is_from_chests: boolean;
    onToggle: () => boolean;        // false when the mixer was full
    onLevel: (level: number) => void;
}

// Finger travel before a touch counts as a drag rather than a tap
const DRAG_START_PX = 8;

// Share of the tile width that moves the level from 0 to 1
const DRAG_FULL_RANGE = 1.1;

interface DragStart
{
    x: number;
    y: number;
    level: number;
    width: number;
    is_dragging: boolean;
    is_scrolling: boolean;
}

export function AmbientTile(props: AmbientTileProps)
{
    const t = useT();
    const shake = useAnimationControls();
    const drag = useRef<DragStart | null>(null);
    const last_detent = useRef(getLevelDetent(props.level));
    const [is_pressed, setIsPressed] = useState(false);
    const name = t(ambientLayerKey(props.layer));

    function handlePointerDown(event: PointerEvent<HTMLDivElement>): void
    {
        drag.current = {
            x: event.clientX,
            y: event.clientY,
            level: props.level,
            width: event.currentTarget.getBoundingClientRect().width,
            is_dragging: false,
            is_scrolling: false,
        };
        last_detent.current = getLevelDetent(props.level);
        setIsPressed(true);
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>): void
    {
        const start = drag.current;
        if (!start || start.is_scrolling)
        {
            return;
        }
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (!start.is_dragging)
        {
            if (Math.abs(dy) > DRAG_START_PX && Math.abs(dy) > Math.abs(dx))
            {
                start.is_scrolling = true;          // the page scrolls; this touch is not a tap
                setIsPressed(false);
                return;
            }
            if (!props.is_active || Math.abs(dx) < DRAG_START_PX)
            {
                return;
            }
            start.is_dragging = true;
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        const level = start.level + dx / (start.width * DRAG_FULL_RANGE);
        props.onLevel(level);
        const detent = getLevelDetent(Math.min(1, Math.max(0, level)));
        if (detent !== last_detent.current)
        {
            last_detent.current = detent;
            playSfx('tick');
            triggerHaptic();
        }
    }

    function handlePointerUp(): void
    {
        const start = drag.current;
        drag.current = null;
        setIsPressed(false);
        if (!start || start.is_dragging || start.is_scrolling)
        {
            return;
        }
        if (props.onToggle())
        {
            playSfx('toggle');
            triggerHaptic();
            return;
        }
        playSfx('release');
        void shake.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.36 } });
    }

    function handlePointerCancel(): void
    {
        drag.current = null;
        setIsPressed(false);
    }

    const class_name = [
        styles.tile,
        props.is_active ? styles.active : '',
        'sk-frame',
    ].join(' ');

    return (
        <motion.div animate={shake}>
            <motion.div
                className={class_name}
                role="switch"
                aria-checked={props.is_active}
                aria-label={props.is_active ? t('ambient_level', { name, n: Math.round(props.level * 100) }) : name}
                tabIndex={0}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onKeyDown={(event) =>
                {
                    if (event.key === 'Enter' || event.key === ' ')
                    {
                        event.preventDefault();
                        props.onToggle();
                    }
                }}
                animate={{ y: is_pressed ? 4 : 0, scale: is_pressed ? 0.98 : 1 }}
                transition={SPRING_PRESS}
            >
                {props.is_from_chests && (
                    <span className={styles.chest_mark} title={t('ambient_from_chests')}>
                        <ChestIcon size={12} />
                    </span>
                )}
                <AmbientIcon layer={props.layer} is_playing={props.is_playing} />
                <span className={styles.name}>{name}</span>
                <span className={styles.level_track}>
                    <motion.span
                        className={styles.level_fill}
                        initial={false}
                        animate={{ scaleX: props.is_active ? props.level : 0 }}
                        transition={{ type: 'tween', duration: 0.08 }}
                    />
                </span>
            </motion.div>
        </motion.div>
    );
}
