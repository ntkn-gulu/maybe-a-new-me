import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { playSfx } from '../../sound/sfx_engine';
import { triggerHaptic } from '../../sound/haptic_hack';
import { HapticOverlay } from '../../ui/haptic_overlay';
import { OPACITY_FADE, SPRING_PRESS } from '../../ui/motion_presets';
import { useT } from '../../i18n/use_t';
import { useAmbientStore } from '../../stores/ambient_store';
import { toggleSoundRoom, useCurrentTrack, useMusicStore } from '../../stores/music_store';
import styles from './player_card.module.css';

// The player's control row (shuffle, previous, the ringed play key, next,
// volume) and the volume drawer it opens: one slider for the music, one
// for the ambience. Previous / next / shuffle rest faded while no music
// channel is on.

const ICONS = {
    previous: <path className={styles.fill} d="M6 5h2.5v14H6zM19 5.6v12.8a.8.8 0 0 1-1.2.7L9.6 12.7a.8.8 0 0 1 0-1.4l8.2-6.4a.8.8 0 0 1 1.2.7z" />,
    next: <path className={styles.fill} d="M15.5 5H18v14h-2.5zM5 5.6v12.8a.8.8 0 0 0 1.2.7l8.2-6.4a.8.8 0 0 0 0-1.4L6.2 4.9A.8.8 0 0 0 5 5.6z" />,
    play: <path className={styles.fill} d="M8.5 5.3v13.4a.8.8 0 0 0 1.2.7l10-6.7a.8.8 0 0 0 0-1.4l-10-6.7a.8.8 0 0 0-1.2.7z" />,
    pause: <path className={styles.fill} d="M6.5 5h3.8v14H6.5zM13.7 5h3.8v14h-3.8z" />,
    shuffle: <path d="M4 7h3.5c4.5 0 4.5 10 9 10H20M4 17h3.5c1.6 0 2.6-1.2 3.4-2.8M13.1 9.8C13.9 8.2 14.9 7 16.5 7H20M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5" />,
    sliders: <path d="M5 7h9M18 7h1M5 17h3M12 17h7M16 5v4M10 15v4" />,
    note: <path d="M9 17V6l10-2v11M9 17a2.5 2.5 0 1 1-2.5-2.5A2.5 2.5 0 0 1 9 17zM19 15a2.5 2.5 0 1 1-2.5-2.5A2.5 2.5 0 0 1 19 15z" />,
};

// The wave mark of the ambience (also used by the mix pill)
export const WAVE_ICON = <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />;

function IconButton(props: { label: string; is_on?: boolean; is_disabled?: boolean; onPress: () => void; children: ReactNode })
{
    const class_name = [styles.icon_button, props.is_on ? styles.icon_on : '', props.is_disabled ? styles.icon_disabled : ''].join(' ');
    return (
        <motion.div
            className={class_name}
            role="button"
            tabIndex={props.is_disabled ? -1 : 0}
            aria-label={props.label}
            aria-pressed={props.is_on}
            aria-disabled={props.is_disabled}
            onClick={() =>
            {
                if (props.is_disabled)
                {
                    return;
                }
                playSfx('tab');
                triggerHaptic();
                props.onPress();
            }}
            whileTap={props.is_disabled ? undefined : { scale: 0.82 }}
            transition={SPRING_PRESS}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">{props.children}</svg>
            {props.is_on && <span className={styles.on_dot} />}
            {!props.is_disabled && <HapticOverlay />}
        </motion.div>
    );
}

// An ink ring around the icon; the icon swaps with a little pop
function PlayButton(props: { is_playing: boolean; label: string })
{
    return (
        <motion.div
            className={`${styles.play_ring} sk-frame sk-round`}
            role="button"
            tabIndex={0}
            aria-label={props.label}
            onClick={() =>
            {
                triggerHaptic();
                toggleSoundRoom();
            }}
            onPointerDown={() => playSfx('press')}
            onPointerUp={() => playSfx('release')}
            whileTap={{ scale: 0.9, y: 3 }}
            transition={SPRING_PRESS}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.svg
                    key={props.is_playing ? 'pause' : 'play'}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0, transition: { type: 'spring', stiffness: 600, damping: 22, opacity: OPACITY_FADE } }}
                    exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.1 } }}
                >
                    {props.is_playing ? ICONS.pause : ICONS.play}
                </motion.svg>
            </AnimatePresence>
            <HapticOverlay />
        </motion.div>
    );
}

export function PlayerControls()
{
    const t = useT();
    const is_playing = useAmbientStore((state) => state.is_playing);
    const is_shuffle = useMusicStore((state) => state.is_shuffle);
    const is_volume_open = useMusicStore((state) => state.is_volume_open);
    const has_music = useCurrentTrack() !== null;
    const music = useMusicStore.getState();
    return (
        <div className={styles.controls}>
            <IconButton label={t('music_shuffle')} is_on={is_shuffle} is_disabled={!has_music} onPress={music.toggleShuffle}>{ICONS.shuffle}</IconButton>
            <IconButton label={t('music_previous')} is_disabled={!has_music} onPress={music.previousTrack}>{ICONS.previous}</IconButton>
            <PlayButton is_playing={is_playing} label={is_playing ? t('ambient_pause') : t('ambient_play')} />
            <IconButton label={t('music_next')} is_disabled={!has_music} onPress={() => music.nextTrack(true)}>{ICONS.next}</IconButton>
            <IconButton label={t('player_volume')} is_on={is_volume_open} onPress={music.toggleVolumeOpen}>{ICONS.sliders}</IconButton>
        </div>
    );
}

function VolumeRow(props: { icon: ReactNode; label: string; value: number; onChange: (value: number) => void })
{
    return (
        <label className={styles.volume_row}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{props.icon}</svg>
            <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={props.value}
                aria-label={props.label}
                onChange={(event) => props.onChange(Number(event.target.value))}
                onPointerUp={() => playSfx('tab')}
            />
        </label>
    );
}

export function VolumeDrawer()
{
    const t = useT();
    const is_open = useMusicStore((state) => state.is_volume_open);
    const music_volume = useMusicStore((state) => state.volume);
    const ambient_volume = useAmbientStore((state) => state.volume);
    return (
        <AnimatePresence initial={false}>
            {is_open && (
                <motion.div
                    className={styles.drawer}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                    <VolumeRow icon={ICONS.note} label={t('music_volume')} value={music_volume} onChange={useMusicStore.getState().setVolume} />
                    <VolumeRow icon={WAVE_ICON} label={t('ambient_volume')} value={ambient_volume} onChange={useAmbientStore.getState().setVolume} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
