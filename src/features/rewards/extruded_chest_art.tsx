// The 3D theme's chest (the sketch theme uses SketchChestArt).
// Chunky 2.5D treasure chest drawn with flat-shaded SVG faces (front, side,
// lid), plus the small things that make it read as a real chest: plank
// grooves, a lid lip and seam with a shadow under it, iron corner caps and a base rim,
// rivets on the band, a lock plate with a shine and a glint on the lid.
// Flat polygons only (no filters or gradients), drawn once; animation is
// done by the parent.

const CHEST_COLORS = {
    body_front: '#ffb400',
    body_side: '#d98a00',
    lid_front: '#ffc93a',
    lid_side: '#e39a00',
    lid_top: '#ffdb6b',
    groove: '#b86f00',
    groove_side: '#9c5c00',
    band_front: '#2a2a2a',
    band_side: '#141414',
    rivet: '#6a6a6a',
    lock: '#ff4d6d',
    lock_side: '#c42a48',
    shine: '#ffffff',
};

// The lid's depth goes back by this much (the side face's slant)
const DEPTH_X = 48;
const DEPTH_Y = -24;

// Rivets down the front band, kept clear of the lock
const BAND_RIVETS_Y = [63, 118, 134, 150];

// Plank lines on the lid top, as a fraction of its depth
const LID_PLANKS = [1 / 3, 2 / 3];

interface ExtrudedChestArtProps
{
    size?: number;
}

// A strip across the whole front face at height y (h tall), continued along the side face
function grooveAt(y: number, h: number): { front: string; side: string }
{
    return {
        front: `24,${y} 128,${y} 128,${y + h} 24,${y + h}`,
        side: `128,${y} 176,${y + DEPTH_Y} 176,${y + DEPTH_Y + h} 128,${y + h}`,
    };
}

export function ExtrudedChestArt(props: ExtrudedChestArtProps)
{
    const width = props.size ?? 200;
    const body_grooves = [grooveAt(112, 2.5), grooveAt(136, 2.5)];
    const lid_groove = grooveAt(71, 2);
    return (
        <svg width={width} height={width * 0.9} viewBox="0 0 200 180" aria-hidden="true">
            {/* Body */}
            <polygon points="24,88 128,88 128,160 24,160" fill={CHEST_COLORS.body_front} />
            <polygon points="128,88 176,64 176,136 128,160" fill={CHEST_COLORS.body_side} />

            {/* Planks of the body */}
            {body_grooves.map((groove) => (
                <g key={groove.front}>
                    <polygon points={groove.front} fill={CHEST_COLORS.groove} opacity="0.55" />
                    <polygon points={groove.side} fill={CHEST_COLORS.groove_side} opacity="0.55" />
                </g>
            ))}

            {/* Base rim: an iron strip around the bottom */}
            <polygon points="24,153 128,153 128,160 24,160" fill={CHEST_COLORS.band_front} />
            <polygon points="128,153 176,129 176,136 128,160" fill={CHEST_COLORS.band_side} />

            {/* Shadow the lid lip throws on the body */}
            <polygon points="24,88 128,88 128,95 24,95" fill={CHEST_COLORS.groove} opacity="0.45" />
            <polygon points="128,88 176,64 176,71 128,95" fill={CHEST_COLORS.groove_side} opacity="0.45" />

            {/* Lid */}
            <polygon points="24,88 128,88 128,56 24,56" fill={CHEST_COLORS.lid_front} />
            <polygon points="128,88 176,64 176,32 128,56" fill={CHEST_COLORS.lid_side} />
            <polygon points="24,56 128,56 176,32 72,32" fill={CHEST_COLORS.lid_top} />

            {/* Planks of the lid: one across the front, two across the top */}
            <polygon points={lid_groove.front} fill={CHEST_COLORS.groove} opacity="0.45" />
            <polygon points={lid_groove.side} fill={CHEST_COLORS.groove_side} opacity="0.45" />
            {LID_PLANKS.map((depth) =>
            {
                const x = 24 + DEPTH_X * depth;
                const y = 56 + DEPTH_Y * depth;
                return <polygon key={depth} points={`${x},${y} ${x + 104},${y} ${x + 104},${y + 1.8} ${x},${y + 1.8}`} fill={CHEST_COLORS.groove} opacity="0.35" />;
            })}

            {/* Lid lip: a lit edge along the bottom of the lid */}
            <polygon points="24,84 128,84 128,88 24,88" fill={CHEST_COLORS.lid_side} />
            <polygon points="128,84 176,60 176,64 128,88" fill={CHEST_COLORS.groove_side} opacity="0.6" />

            {/* The seam where the lid closes on the body */}
            <polygon points="24,87 128,87 128,90 24,90" fill={CHEST_COLORS.band_front} opacity="0.8" />
            <polygon points="128,87 176,63 176,66 128,90" fill={CHEST_COLORS.band_side} opacity="0.8" />

            {/* Iron corner caps on the front corners of the lid and the body */}
            <polygon points="24,56 37,56 24,69" fill={CHEST_COLORS.band_front} />
            <polygon points="115,56 128,56 128,69" fill={CHEST_COLORS.band_front} />
            <polygon points="24,140 24,153 37,153" fill={CHEST_COLORS.band_front} />
            <polygon points="128,140 128,153 115,153" fill={CHEST_COLORS.band_front} />

            {/* Metal bands */}
            <polygon points="66,56 86,56 86,160 66,160" fill={CHEST_COLORS.band_front} />
            {/* Over the lid top the band runs straight back, along the lid's depth */}
            <polygon points="66,56 86,56 134,32 114,32" fill={CHEST_COLORS.band_side} />
            <polygon points="128,92 176,68 176,76 128,100" fill={CHEST_COLORS.band_side} opacity="0.6" />

            {/* Rivets: a dot with a tiny lit top */}
            {BAND_RIVETS_Y.map((y) => (
                <g key={y}>
                    <circle cx="76" cy={y} r="2.6" fill={CHEST_COLORS.rivet} />
                    <circle cx="75.3" cy={y - 0.8} r="0.9" fill={CHEST_COLORS.shine} opacity="0.7" />
                </g>
            ))}

            {/* Lock: an iron plate, the red lock with its side, the keyhole */}
            <rect x="58" y="74" width="36" height="35" rx="7" fill={CHEST_COLORS.band_side} />
            <rect x="62" y="80" width="28" height="26" rx="5" fill={CHEST_COLORS.lock_side} />
            <rect x="62" y="77" width="28" height="25" rx="5" fill={CHEST_COLORS.lock} />
            <rect x="65" y="79.5" width="11" height="3" rx="1.5" fill={CHEST_COLORS.shine} opacity="0.45" />
            <circle cx="76" cy="87" r="3.5" fill={CHEST_COLORS.band_front} />
            <rect x="74.5" y="88" width="3" height="7" rx="1.5" fill={CHEST_COLORS.band_front} />

            {/* Highlights on lit edges */}
            <polygon points="24,56 128,56 128,60 24,60" fill={CHEST_COLORS.shine} opacity="0.35" />
            <polygon points="72,32 176,32 172,34 76,34" fill={CHEST_COLORS.shine} opacity="0.4" />

            {/* A small four-point glint on the lid */}
            <path d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z" fill={CHEST_COLORS.shine} opacity="0.85" transform="translate(54 46) scale(0.8)" />
        </svg>
    );
}
