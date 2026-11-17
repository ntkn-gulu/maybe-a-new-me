// Paper + ink artwork is "baked" into images: each picture is an SVG
// document turned into an <img> source. Safari draws an SVG image once and
// reuses the bitmap, so the filters inside it (paper shadows, ink wobble)
// cost nothing afterwards. Live inline SVG filters, by contrast, are
// recomputed whenever anything near them changes, which made the paper + ink
// themes stutter on iPhone. Animations then only move or fade finished images.

export const INK_COLOR = '#1f1c18';

// Three ink wobbles with different noise: boiling ink is baked once per seed
// and CSS flips between the images (see paper_flame.module.css)
export const BOIL_SEEDS = [1, 5, 9];

const BOIL_STRENGTH = 3.2;               // how far wobbly ink lines move, in SVG units
const PAPER_SHADOW_COLOR = '#3a2410';

// Soft drop shadow under a cut-out paper layer
export function paperLiftFilter(id: string): string
{
    return `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">`
        + `<feDropShadow dx="0" dy="3" stdDeviation="1.6" flood-color="${PAPER_SHADOW_COLOR}" flood-opacity="0.32"/>`
        + '</filter>';
}

// Hand-drawn wobble for ink lines
export function inkWobbleFilter(id: string, seed: number, strength: number = BOIL_STRENGTH): string
{
    return `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%">`
        + `<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="${seed}" result="noise"/>`
        + `<feDisplacementMap in="SourceGraphic" in2="noise" scale="${strength}" xChannelSelector="R" yChannelSelector="G"/>`
        + '</filter>';
}

// A complete SVG document as an <img> source
export function svgImage(view_box: string, content: string): string
{
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view_box}">${content}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}
