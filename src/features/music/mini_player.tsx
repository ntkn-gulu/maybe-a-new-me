import type { MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getPressableProps } from '../../ui/pressable';
import { HapticOverlay } from '../../ui/haptic_overlay';
import { OPACITY_FADE, SPRING_POP } from '../../ui/motion_presets';
import { playSfx } from '../../sound/sfx_engine';
import { useT } from '../../i18n/use_t';
import { useAmbientStore } from '../../stores/ambient_store';
import { useSpin } from './use_spin';
import { useMixName } from './use_mix_name';
import styles from './mini_player.module.css';

// A small "now playing" bar riding on the tab bar while the ambient mix is
// on (or paused, until dismissed): a little spinning record, what plays,
// play / pause, and a close button once paused. A tap on the bar opens the
// Sound room. The app hides it on the Sound room page itself.

interface MiniPlayerProps
{
    onOpen: () => void;
}

function MiniRecord(props: { is_playing: boolean })
{
    const rotate = useSpin(props.is_playing);
    return (
        <motion.svg className={styles.record} viewBox="0 0 32 32" style={{ rotate }} aria-hidden="true">
            <circle cx="16" cy="16" r="15" fill="#151515" />
            <circle cx="16" cy="16" r="11" fill="none" stroke="#2c2c2c" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="6" fill="var(--color-accent)" />
            <path d="M13 13.5h6" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
        </motion.svg>
    );
}

export function MiniPlayer(props: MiniPlayerProps)
{
    const t = useT();
    const is_open = useAmbientStore((state) => state.is_player_open);
    const is_playing = useAmbientStore((state) => state.is_playing);
    const togglePlaying = useAmbientStore((state) => state.togglePlaying);
    const dismiss = useAmbientStore((state) => state.dismiss);

    // Buttons inside the bar must not also open the Sound room
    function onButton(action: () => void): (event: MouseEvent) => void
    {
        return (event) =>
        {
            event.stopPropagation();
            playSfx('tab');
            action();
        };
    }

    const status = useMixName();

    return (
        <AnimatePresence>
            {is_open && (
                <motion.div
                    className={`${styles.bar} sk-frame`}
                    {...getPressableProps(props.onOpen)}
                    aria-label={t('mini_player_open')}
                    initial={{ y: 16, scale: 0.94, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1, transition: { ...SPRING_POP, opacity: OPACITY_FADE } }}
                    exit={{ y: 12, scale: 0.96, opacity: 0, transition: { duration: 0.16 } }}
                    whileTap={{ scale: 0.97 }}
                >
                    <MiniRecord is_playing={is_playing} />
                    <span className={styles.text}>
                        <span className={`mono_label ${styles.kicker}`}>{t('sound_room_kicker')}</span>
                        <span className={styles.status}>{status}</span>
                    </span>
                    <span className={styles.buttons}>
                        {!is_playing && (
                            <span
                                className={`${styles.button} sk-frame sk-round`}
                                role="button"
                                tabIndex={0}
                                aria-label={t('mini_player_close')}
                                onClick={onButton(dismiss)}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
                                <HapticOverlay />
                            </span>
                        )}
                        <span
                            className={`${styles.button} ${styles.play} sk-frame sk-round`}
                            role="button"
                            tabIndex={0}
                            aria-label={is_playing ? t('ambient_pause') : t('ambient_play')}
                            onClick={onButton(togglePlaying)}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                {is_playing
                                    ? <path className={styles.fill} d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
                                    : <path className={styles.fill} d="M8.5 5.3v13.4a.8.8 0 0 0 1.2.7l10-6.7a.8.8 0 0 0 0-1.4l-10-6.7a.8.8 0 0 0-1.2.7z" />}
                            </svg>
                            <HapticOverlay />
                        </span>
                    </span>
                    <HapticOverlay />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
