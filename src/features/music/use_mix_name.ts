import { findAppliedPreset } from '../../core/ambient_mix';
import { useT } from '../../i18n/use_t';
import { ambientLayerKey, ambientPresetKey } from '../../i18n/strings';
import { useAmbientStore } from '../../stores/ambient_store';

// What the players call the mix that plays: the name of a ready-made mix
// while it plays exactly as picked ("Deep focus"), otherwise its sounds
// ("Rain · Night train"); "paused" / "nothing picked yet" when silent
export function useMixName(): string
{
    const t = useT();
    const mix = useAmbientStore((state) => state.mix);
    const is_playing = useAmbientStore((state) => state.is_playing);
    if (mix.active.length === 0)
    {
        return t('ambient_nothing');
    }
    if (!is_playing)
    {
        return t('ambient_paused');
    }
    const preset = findAppliedPreset(mix);
    return preset ? t(ambientPresetKey(preset.id)) : mix.active.map((layer) => t(ambientLayerKey(layer))).join(' · ');
}
