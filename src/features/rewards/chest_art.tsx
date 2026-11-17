import { INK_COLOR, inkWobbleFilter, paperLiftFilter, svgImage } from '../../ui/ink_svg';

// 2.5D treasure chest in the paper + ink style: flat colored faces (front,
// side, lid) like cut paper, every face outlined in hand-drawn ink.
// Baked into one image when the module loads (see ink_svg.ts), so floating
// and rattling only move a finished picture. Animation is done by the parent.

const CHEST_COLORS = {
    body_front: '#ffb400',
    body_side: '#d98a00',
    lid_front: '#ffc93a',
    lid_side: '#e39a00',
    lid_top: '#ffdb6b',
    band_front: '#2a2a2a',
    band_side: '#141414',
    lock: '#ff4d6d',
};

const VIEW_BOX = '0 0 200 180';
const INK_SEED = 3;
const INK_STRENGTH = 2.6;

// Faces as [points, fill], back to front
const FACES: [string, string][] = [
    ['24,88 128,88 128,160 24,160', CHEST_COLORS.body_front],
    ['128,88 176,64 176,136 128,160', CHEST_COLORS.body_side],
    ['24,88 128,88 128,56 24,56', CHEST_COLORS.lid_front],
    ['128,88 176,64 176,32 128,56', CHEST_COLORS.lid_side],
    ['24,56 128,56 176,32 72,32', CHEST_COLORS.lid_top],
    ['66,56 86,56 86,160 66,160', CHEST_COLORS.band_front],
    ['72,32 92,32 86,56 66,56', CHEST_COLORS.band_side],
];

const LOCK_RECT = 'x="62" y="77" width="28" height="26" rx="5"';

const CHEST_IMAGE = svgImage(VIEW_BOX,
    `<defs>${paperLiftFilter('lift')}${inkWobbleFilter('ink', INK_SEED, INK_STRENGTH)}</defs>`
    // The whole chest as one paper cut-out, so it casts a single soft shadow
    + '<g filter="url(#lift)">'
    + FACES.map(([points, fill]) => `<polygon points="${points}" fill="${fill}"/>`).join('')
    + `<polygon points="128,92 176,68 176,76 128,100" fill="${CHEST_COLORS.band_side}" opacity="0.6"/>`
    + `<rect ${LOCK_RECT} fill="${CHEST_COLORS.lock}"/>`
    + '</g>'
    // Lit edges
    + '<polygon points="24,56 128,56 128,61 24,61" fill="#ffffff" opacity="0.35"/>'
    + '<polygon points="24,88 128,88 128,92 24,92" fill="#ffffff" opacity="0.25"/>'
    // Ink
    + `<g filter="url(#ink)" fill="none" stroke="${INK_COLOR}" stroke-width="2.6" stroke-linejoin="round">`
    + FACES.map(([points]) => `<polygon points="${points}"/>`).join('')
    + `<rect ${LOCK_RECT}/>`
    + `<circle cx="76" cy="87" r="3.5" fill="${INK_COLOR}" stroke="none"/>`
    + `<rect x="74.5" y="88" width="3" height="7" rx="1.5" fill="${INK_COLOR}" stroke="none"/>`
    + '</g>');

interface ChestArtProps
{
    size?: number;
}

export function ChestArt(props: ChestArtProps)
{
    const width = props.size ?? 200;
    return (
        <img
            src={CHEST_IMAGE}
            width={width}
            height={width * 0.9}
            alt=""
            draggable={false}
            style={{ display: 'block' }}
        />
    );
}
