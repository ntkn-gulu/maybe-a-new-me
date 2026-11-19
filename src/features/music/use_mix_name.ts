import { findAppliedPreset } from '../../core/ambient_mix';
import { useT } from '../../i18n/use_t';
import { ambientLayerKey, ambientPresetKey } from '../../i18n/strings';
import { useAmbientStore } from '../../stores/ambient_store';
import { useCurrentTrack } from '../../stores/music_store';

// The picked mix by name, playing or not: a ready-made mix's name while it
// is exactly as picked ("Deep focus"), otherwise its sounds ("Rain · Night
// train"); empty when nothing is picked
export function useMixLabel(): string
{
    const t = useT();
    const mix = useAmbientStore((state) => state.mix);
    const preset = findAppliedPreset(mix);
    return preset ? t(ambientPresetKey(preset.id)) : mix.active.map((layer) => t(ambientLayerKey(layer))).join(' · ');
}

// What the players call the mix that plays: its label, or "paused" /
// "nothing picked yet" when silent
export function useMixName(): string
{
    const t = useT();
    const label = useMixLabel();
    const is_playing = useAmbientStore((state) => state.is_playing);
    if (!label)
    {
        return t('ambient_nothing');
    }
    return is_playing ? label : t('ambient_paused');
}

// The mini player's line: the track while music plays, then the mix
// ("Winter Blues · Deep focus"); just the mix without music
export function useNowPlayingName(): string
{
    const mix_name = useMixName();
    const track = useCurrentTrack();
    const is_playing = useAmbientStore((state) => state.is_playing);
    const has_mix = useAmbientStore((state) => state.mix.active.length > 0);
    if (!track || !is_playing)
    {
        return mix_name;
    }
    return has_mix ? `${track.title} · ${mix_name}` : track.title;
}
