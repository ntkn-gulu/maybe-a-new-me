import { AnimatePresence, motion } from 'motion/react';
import { getPlayableChannels, type MusicChannelId } from '../../core/music_queue';
import { SegmentedSwitch } from '../../ui/segmented_switch';
import { OPACITY_FADE } from '../../ui/motion_presets';
import { useT } from '../../i18n/use_t';
import type { StringKey } from '../../i18n/strings';
import { useAmbientStore } from '../../stores/ambient_store';
import { toggleSoundRoom, useCurrentTrack, useMusicStore } from '../../stores/music_store';
import { RecordDeck } from './record_deck';
import { MarqueeText } from './marquee_text';
import { Waveform } from './waveform';
import { PlayerControls, VolumeDrawer, WAVE_ICON } from './player_controls';
import { useMixLabel } from './use_mix_name';
import styles from './player_card.module.css';

// The Sound room's player card. The record player (sketch: the cassette)
// sits beside the music channel switch and the title; under them the track
// as a waveform to scrub, the control row and the volume drawer.
// Without a music channel the title is the ambience mix.

type ChannelChoice = MusicChannelId | 'off';

const CHANNEL_LABEL_KEYS: Record<MusicChannelId, StringKey> = {
    lofi: 'music_channel_lofi',
    jazz: 'music_channel_jazz',
};

export function PlayerCard()
{
    const t = useT();
    const is_playing = useAmbientStore((state) => state.is_playing);
    const channel = useMusicStore((state) => state.channel);
    const track = useCurrentTrack();
    const mix_label = useMixLabel();

    const options = [
        { value: 'off' as ChannelChoice, label: t('music_off') },
        ...getPlayableChannels().map((item) => ({ value: item.id as ChannelChoice, label: t(CHANNEL_LABEL_KEYS[item.id]) })),
    ];
    const title = track ? track.title : mix_label || t('ambient_nothing');
    const subtitle = track ? track.artist : t('ambient_label');

    return (
        <div className={`${styles.card} sk-frame`}>
            <div className={styles.head}>
                <div className={styles.art}>
                    <RecordDeck
                        is_playing={is_playing}
                        label_color={channel === 'jazz' ? 'var(--color-blue)' : 'var(--color-accent)'}
                        aria_label={is_playing ? t('ambient_pause') : t('ambient_play')}
                        onToggle={toggleSoundRoom}
                    />
                </div>
                <div className={styles.head_text}>
                    <SegmentedSwitch<ChannelChoice>
                        options={options}
                        value={channel ?? 'off'}
                        onChange={(value) => useMusicStore.getState().setChannel(value === 'off' ? null : value)}
                        aria_label={t('music_channel')}
                    />
                    <div className={styles.title_block}>
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.div
                                key={title}
                                className={styles.title_slot}
                                initial={{ y: 14, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -14, opacity: 0 }}
                                transition={OPACITY_FADE}
                            >
                                <MarqueeText text={title} className={styles.title} />
                            </motion.div>
                        </AnimatePresence>
                        <span className={styles.subtitle}>{subtitle}</span>
                        {track && mix_label && (
                            <span className={`${styles.mix_pill} sk-frame sk-flat sk-pill`}>
                                <svg viewBox="0 0 24 24" aria-hidden="true">{WAVE_ICON}</svg>
                                <MarqueeText text={mix_label} />
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {track && <Waveform track_id={track.id} is_playing={is_playing} />}
            <PlayerControls />
            <VolumeDrawer />
        </div>
    );
}
