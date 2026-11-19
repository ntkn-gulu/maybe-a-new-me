import { describe, expect, it } from 'vitest';
import {
    AMBIENT_PRESETS,
    DEFAULT_LAYER_LEVEL,
    EMPTY_MIX,
    MAX_ACTIVE_LAYERS,
    MIN_LAYER_LEVEL,
    AMBIENT_LAYERS,
    applyPreset,
    getActiveLevels,
    getLayerLevel,
    getLevelDetent,
    isPresetApplied,
    keepKnownLayers,
    setLayerLevel,
    toggleLayer,
    type AmbientMix,
} from '../src/core/ambient_mix';

describe('ambient mix', () =>
{
    it('turns a layer on at the default level and off again', () =>
    {
        const on = toggleLayer(EMPTY_MIX, 'rain');
        expect(on.active).toEqual(['rain']);
        expect(getLayerLevel(on, 'rain')).toBe(DEFAULT_LAYER_LEVEL);
        expect(toggleLayer(on, 'rain').active).toEqual([]);
    });

    it('remembers the level of a layer that was switched off', () =>
    {
        let mix = toggleLayer(EMPTY_MIX, 'wind');
        mix = setLayerLevel(mix, 'wind', 0.3);
        mix = toggleLayer(toggleLayer(mix, 'wind'), 'wind');
        expect(getLayerLevel(mix, 'wind')).toBe(0.3);
    });

    it('keeps levels between the minimum and 1', () =>
    {
        expect(getLayerLevel(setLayerLevel(EMPTY_MIX, 'rain', 0), 'rain')).toBe(MIN_LAYER_LEVEL);
        expect(getLayerLevel(setLayerLevel(EMPTY_MIX, 'rain', 1.4), 'rain')).toBe(1);
    });

    it('refuses a layer when the mixer is full', () =>
    {
        let mix = EMPTY_MIX;
        for (const layer of AMBIENT_LAYERS.slice(0, MAX_ACTIVE_LAYERS))
        {
            mix = toggleLayer(mix, layer);
        }
        const extra = AMBIENT_LAYERS[MAX_ACTIVE_LAYERS];
        expect(toggleLayer(mix, extra)).toBe(mix);
    });

    it('gives the engine only the playing layers', () =>
    {
        let mix = toggleLayer(toggleLayer(EMPTY_MIX, 'rain'), 'waves');
        mix = toggleLayer(setLayerLevel(mix, 'waves', 0.4), 'waves');
        expect(getActiveLevels(mix)).toEqual({ rain: DEFAULT_LAYER_LEVEL });
    });

    it('applies a preset and knows when it is still exact', () =>
    {
        const preset = AMBIENT_PRESETS[0];
        const mix = applyPreset(toggleLayer(EMPTY_MIX, 'creek'), preset);
        expect(mix.active).not.toContain('creek');
        expect(isPresetApplied(mix, preset)).toBe(true);
        expect(isPresetApplied(setLayerLevel(mix, mix.active[0], 0.11), preset)).toBe(false);
    });

    it('every preset fits in the mixer', () =>
    {
        for (const preset of AMBIENT_PRESETS)
        {
            expect(Object.keys(preset.layers).length).toBeLessThanOrEqual(MAX_ACTIVE_LAYERS);
        }
    });

    it('drops layers a saved mix names but the app no longer has', () =>
    {
        const saved = { active: ['rain', 'singing_bowls'], levels: { rain: 0.4, singing_bowls: 0.9 } } as unknown as AmbientMix;
        expect(keepKnownLayers(saved)).toEqual({ active: ['rain'], levels: { rain: 0.4 } });
    });

    it('finds the volume detent of a level', () =>
    {
        expect(getLevelDetent(0.05)).toBe(0);
        expect(getLevelDetent(0.3)).toBe(3);
        expect(getLevelDetent(1)).toBe(10);
    });
});
