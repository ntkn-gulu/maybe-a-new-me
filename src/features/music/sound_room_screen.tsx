import { useEffect, useState } from 'react';
import {
    AMBIENT_LAYERS,
    AMBIENT_PRESETS,
    MAX_ACTIVE_LAYERS,
    getLayerLevel,
    isFreeLayer,
    isLayerActive,
    isPresetApplied,
    type AmbientLayerId,
} from '../../core/ambient_mix';
import { Screen } from '../../ui/screen';
import { TactileButton } from '../../ui/tactile_button';
import { playSfx } from '../../sound/sfx_engine';
import { prewarmLayer } from '../../sound/ambient_layers';
import { useT } from '../../i18n/use_t';
import { ambientPresetKey } from '../../i18n/strings';
import { useAmbientStore } from '../../stores/ambient_store';
import { AmbientTile } from './ambient_tile';
import { RecordDeck } from './record_deck';
import { useMixName } from './use_mix_name';
import styles from './sound_room_screen.module.css';

// Sound room, the Focus tab's sub-page: the player card (the record deck,
// which is also the big play key, then a small play key, what plays and
// the volume), ready-made mixes and the mixer grid.

// Get sounds ready ahead, after the page has slid in, one at a time with
// gaps, so a later tap on a tile does not wait
const PREWARM_START_MS = 700;
const PREWARM_GAP_MS = 140;

// How long the "mixer is full" warning stays
const FULL_WARNING_MS = 2600;

function PlayGlyph(props: { is_playing: boolean })
{
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {props.is_playing
                ? <path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" />
                : <path d="M8 4.8v14.4a.8.8 0 0 0 1.2.7l11-7.2a.8.8 0 0 0 0-1.4l-11-7.2A.8.8 0 0 0 8 4.8z" />}
        </svg>
    );
}

export function SoundRoomScreen()
{
    const t = useT();
    const mix = useAmbientStore((state) => state.mix);
    const volume = useAmbientStore((state) => state.volume);
    const is_playing = useAmbientStore((state) => state.is_playing);
    const toggleLayer = useAmbientStore((state) => state.toggleLayer);
    const setLayerLevel = useAmbientStore((state) => state.setLayerLevel);
    const applyPreset = useAmbientStore((state) => state.applyPreset);
    const togglePlaying = useAmbientStore((state) => state.togglePlaying);
    const setVolume = useAmbientStore((state) => state.setVolume);
    const [is_full_warning, setIsFullWarning] = useState(false);
    const status = useMixName();

    useEffect(() =>
    {
        // Every synthesized layer, and the recordings of the saved mix (others download on their first tap)
        const active = useAmbientStore.getState().mix.active;
        const order = [...new Set([...active, ...AMBIENT_LAYERS])];
        const timers = order.map((layer, index) =>
            window.setTimeout(() => prewarmLayer(layer, active.includes(layer)), PREWARM_START_MS + index * PREWARM_GAP_MS));
        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, []);

    useEffect(() =>
    {
        if (!is_full_warning)
        {
            return;
        }
        const timer = window.setTimeout(() => setIsFullWarning(false), FULL_WARNING_MS);
        return () => window.clearTimeout(timer);
    }, [is_full_warning]);

    function toggleTile(layer: AmbientLayerId): boolean
    {
        const before = useAmbientStore.getState().mix;
        toggleLayer(layer);
        const changed = useAmbientStore.getState().mix !== before;
        setIsFullWarning(!changed);
        return changed;
    }


    return (
        <Screen kicker={t('sound_room_kicker')} title={t('sound_room_title')}>
            <div className={`${styles.player_card} sk-frame`}>
                <RecordDeck
                    is_playing={is_playing}
                    aria_label={is_playing ? t('ambient_pause') : t('ambient_play')}
                    onToggle={togglePlaying}
                />
                <div className={styles.player}>
                    <TactileButton size="md" variant="accent" onClick={togglePlaying} aria_label={is_playing ? t('ambient_pause') : t('ambient_play')}>
                        <PlayGlyph is_playing={is_playing} />
                    </TactileButton>
                    <div className={styles.player_text}>
                        <span className="mono_label">{is_playing ? t('ambient_pause') : t('ambient_play')}</span>
                        <span className={styles.status}>{status}</span>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={volume}
                            className={styles.volume}
                            aria-label={t('ambient_volume')}
                            onChange={(event) => setVolume(Number(event.target.value))}
                            onPointerUp={() => playSfx('tab')}
                        />
                    </div>
                </div>
            </div>

            <h2 className={`mono_label ${styles.section_label}`}>{t('ambient_presets')}</h2>
            <div className={styles.presets}>
                {AMBIENT_PRESETS.map((preset) => (
                    <TactileButton
                        key={preset.id}
                        size="sm"
                        is_full_width
                        is_selected={is_playing && isPresetApplied(mix, preset)}
                        onClick={() => applyPreset(preset)}
                    >
                        {t(ambientPresetKey(preset.id))}
                    </TactileButton>
                ))}
            </div>

            <h2 className={`mono_label ${styles.section_label}`}>{t('ambient_mixer')}</h2>
            <p className={is_full_warning ? `${styles.hint} ${styles.hint_alert}` : styles.hint} role={is_full_warning ? 'alert' : undefined}>
                {is_full_warning ? t('ambient_full', { n: MAX_ACTIVE_LAYERS }) : t('ambient_mixer_hint')}
            </p>
            <div className={styles.grid}>
                {AMBIENT_LAYERS.map((layer) => (
                    <AmbientTile
                        key={layer}
                        layer={layer}
                        is_active={isLayerActive(mix, layer)}
                        is_playing={is_playing && isLayerActive(mix, layer)}
                        level={getLayerLevel(mix, layer)}
                        is_from_chests={!isFreeLayer(layer)}
                        onToggle={() => toggleTile(layer)}
                        onLevel={(level) => setLayerLevel(layer, level)}
                    />
                ))}
            </div>
        </Screen>
    );
}
