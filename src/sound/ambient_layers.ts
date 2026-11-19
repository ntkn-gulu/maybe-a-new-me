import { createSeededRandom } from '../core/rng';
import type { AmbientLayerId } from '../core/ambient_mix';
import { addDrift, addLoop, addNoise, getCachedBuffer, prewarmNoise, type LayerKit } from './ambient_kit';
import { renderCrackles } from './ambient_tracks';
import { isFileLayer, loadAmbientFile } from './ambient_files';

// How each ambient layer is built. Nature and places are field recordings
// (ambient_files.ts); three layers that synthesis does well stay in code:
// wind (moving filtered noise), campfire crackles and brown noise. Levels
// inside a recipe balance its own parts; the mixer level sits on top.
// A recipe may be async (a file to download first); the engine fades the
// layer in once it resolves.

export type AmbientRecipe = (kit: LayerKit) => void | Promise<void>;

function getCrackles(): AudioBuffer
{
    return getCachedBuffer('crackles', () => renderCrackles(createSeededRandom(401)));
}

function buildWind(kit: LayerKit): void
{
    // Two gusting bands, left and right, each moving on its own
    for (const [pan, speed] of [[-0.7, 0.05], [0.7, 0.068]])
    {
        const band = addNoise(kit, 'pink', 0.5, [{ type: 'bandpass', hz: 420, q: 0.9 }], pan);
        addDrift(kit, band.filters[0].frequency, 260, speed);
        addDrift(kit, band.gain.gain, 0.32, speed * 1.2);
    }
    const rumble = addNoise(kit, 'brown', 0.4, [{ type: 'lowpass', hz: 160 }]);
    addDrift(kit, rumble.gain.gain, 0.2, 0.04);
    // A faint whistle through a gap that comes and goes
    const whistle = addNoise(kit, 'white', 0.045, [{ type: 'bandpass', hz: 1150, q: 18 }]);
    addDrift(kit, whistle.filters[0].frequency, 350, 0.03);
    addDrift(kit, whistle.gain.gain, 0.04, 0.05);
}

function buildCampfire(kit: LayerKit): void
{
    addLoop(kit, getCrackles(), 1.8);
}

function buildBrownNoise(kit: LayerKit): void
{
    const bed = addNoise(kit, 'brown', 0.5, [{ type: 'lowpass', hz: 1000 }]);
    addDrift(kit, bed.filters[0].frequency, 200, 0.02);
}

// A recorded layer: its loop, at a level that sits well next to the others
function fileRecipe(layer: AmbientLayerId, gain: number): AmbientRecipe
{
    return async (kit) =>
    {
        const buffer = await loadAmbientFile(layer);
        if (!kit.is_stopped)
        {
            addLoop(kit, buffer, gain);
        }
    };
}

export const AMBIENT_RECIPES: Record<AmbientLayerId, AmbientRecipe> = {
    rain: fileRecipe('rain', 1.4),
    wind: buildWind,
    waves: fileRecipe('waves', 1.4),
    campfire: buildCampfire,
    brown_noise: buildBrownNoise,
    night_field: fileRecipe('night_field', 1.2),
    creek: fileRecipe('creek', 1.3),
    countryside: fileRecipe('countryside', 1.2),
    cafe: fileRecipe('cafe', 1.2),
    thunderstorm: fileRecipe('thunderstorm', 1.6),
    night_train: fileRecipe('night_train', 1.6),
};

// Get a layer ready ahead of a tap: synthesized loops are rendered (up to
// ~20 ms each); recorded ones are downloaded and decoded only when asked
// for, since that costs data on a phone plan
export function prewarmLayer(layer: AmbientLayerId, may_download: boolean): void
{
    prewarmNoise();
    if (layer === 'campfire')
    {
        getCrackles();
    }
    if (may_download && isFileLayer(layer))
    {
        void loadAmbientFile(layer).catch(() => undefined);
    }
}
