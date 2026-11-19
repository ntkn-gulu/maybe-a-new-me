// The ambient sound mixer as plain data: which layers play and how loud.
// Pure functions that return a new mix (the store saves it). Each layer
// keeps its own level while switched off, so turning it back on brings
// the same volume back.

export type AmbientLayerId =
    | 'rain'
    | 'wind'
    | 'waves'
    | 'campfire'
    | 'brown_noise'
    | 'night_field'
    | 'creek'
    | 'countryside'
    | 'cafe'
    | 'thunderstorm'
    | 'night_train';

// Mixer order: the free set first, then the soundscapes from chests
export const AMBIENT_LAYERS: readonly AmbientLayerId[] = [
    'rain', 'wind', 'waves', 'campfire', 'brown_noise',
    'night_field', 'creek', 'countryside', 'cafe', 'thunderstorm', 'night_train',
];

// Everyone has these; the rest are soundscapes that drop from chests
export const FREE_AMBIENT_LAYERS: readonly AmbientLayerId[] = ['rain', 'wind', 'waves', 'campfire', 'brown_noise'];

export function isFreeLayer(layer: AmbientLayerId): boolean
{
    return FREE_AMBIENT_LAYERS.includes(layer);
}

// Most layers playing at once (each one is live audio work on the phone)
export const MAX_ACTIVE_LAYERS = 5;

// Level of a layer the first time it is switched on (0..1)
export const DEFAULT_LAYER_LEVEL = 0.6;

// Quietest a playing layer can be dragged to (lower is "off", not a level)
export const MIN_LAYER_LEVEL = 0.05;

// Volume drags click (sound + haptic) every time they cross one of these steps
export const LEVEL_DETENT_STEP = 0.1;

export interface AmbientMix
{
    active: AmbientLayerId[];                           // playing layers, in the order they were turned on
    levels: Partial<Record<AmbientLayerId, number>>;    // remembered level of every layer ever touched
}

export const EMPTY_MIX: AmbientMix = { active: [], levels: {} };

// Drop layers a saved mix may still name but the app no longer has
export function keepKnownLayers(mix: AmbientMix): AmbientMix
{
    const known = (layer: string): layer is AmbientLayerId => AMBIENT_LAYERS.includes(layer as AmbientLayerId);
    const levels: AmbientMix['levels'] = {};
    for (const [layer, level] of Object.entries(mix.levels))
    {
        if (known(layer))
        {
            levels[layer] = level;
        }
    }
    return { active: mix.active.filter(known), levels };
}

export function isLayerActive(mix: AmbientMix, layer: AmbientLayerId): boolean
{
    return mix.active.includes(layer);
}

export function getLayerLevel(mix: AmbientMix, layer: AmbientLayerId): number
{
    return mix.levels[layer] ?? DEFAULT_LAYER_LEVEL;
}

export function canAddLayer(mix: AmbientMix): boolean
{
    return mix.active.length < MAX_ACTIVE_LAYERS;
}

function clampLevel(level: number): number
{
    const rounded = Math.round(level * 100) / 100;
    return Math.min(1, Math.max(MIN_LAYER_LEVEL, rounded));
}

// Switch a layer on (at its remembered level) or off. Turning one on when
// the mixer is full changes nothing; the UI tells the user why.
export function toggleLayer(mix: AmbientMix, layer: AmbientLayerId): AmbientMix
{
    if (isLayerActive(mix, layer))
    {
        return { ...mix, active: mix.active.filter((id) => id !== layer) };
    }
    if (!canAddLayer(mix))
    {
        return mix;
    }
    return {
        active: [...mix.active, layer],
        levels: { ...mix.levels, [layer]: getLayerLevel(mix, layer) },
    };
}

export function setLayerLevel(mix: AmbientMix, layer: AmbientLayerId, level: number): AmbientMix
{
    return { ...mix, levels: { ...mix.levels, [layer]: clampLevel(level) } };
}

// Which detent a level sits in, to know when a drag crossed one
export function getLevelDetent(level: number): number
{
    return Math.floor(level / LEVEL_DETENT_STEP + 1e-6);
}

// Levels of the playing layers only: what the sound engine needs
export function getActiveLevels(mix: AmbientMix): Partial<Record<AmbientLayerId, number>>
{
    const levels: Partial<Record<AmbientLayerId, number>> = {};
    for (const layer of mix.active)
    {
        levels[layer] = getLayerLevel(mix, layer);
    }
    return levels;
}

// Ready-made mixes. A preset replaces what plays; levels of other layers are kept.
export type AmbientPresetId = 'rainy_window' | 'campfire_night' | 'seaside' | 'deep_focus' | 'storm_shelter' | 'night_express';

export interface AmbientPreset
{
    id: AmbientPresetId;
    layers: Partial<Record<AmbientLayerId, number>>;
}

export const AMBIENT_PRESETS: readonly AmbientPreset[] = [
    { id: 'rainy_window', layers: { rain: 0.7, wind: 0.25, brown_noise: 0.2 } },
    { id: 'campfire_night', layers: { campfire: 0.65, night_field: 0.5 } },
    { id: 'seaside', layers: { waves: 0.75, wind: 0.25 } },
    { id: 'deep_focus', layers: { brown_noise: 0.6, rain: 0.25 } },
    { id: 'storm_shelter', layers: { thunderstorm: 0.7, campfire: 0.4 } },
    { id: 'night_express', layers: { night_train: 0.75, rain: 0.3 } },
];

export function getPresetLayers(preset: AmbientPreset): AmbientLayerId[]
{
    return AMBIENT_LAYERS.filter((layer) => preset.layers[layer] !== undefined);
}

export function applyPreset(mix: AmbientMix, preset: AmbientPreset): AmbientMix
{
    return {
        active: getPresetLayers(preset).slice(0, MAX_ACTIVE_LAYERS),
        levels: { ...mix.levels, ...preset.layers },
    };
}

// True when exactly the preset's layers play at the preset's levels
export function isPresetApplied(mix: AmbientMix, preset: AmbientPreset): boolean
{
    const preset_layers = getPresetLayers(preset);
    if (preset_layers.length !== mix.active.length)
    {
        return false;
    }
    return preset_layers.every((layer) => isLayerActive(mix, layer) && getLayerLevel(mix, layer) === preset.layers[layer]);
}

// The ready-made mix playing exactly as it was picked (none once it was changed)
export function findAppliedPreset(mix: AmbientMix): AmbientPreset | null
{
    return AMBIENT_PRESETS.find((preset) => isPresetApplied(mix, preset)) ?? null;
}
