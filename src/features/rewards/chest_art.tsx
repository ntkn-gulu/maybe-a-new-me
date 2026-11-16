// Chunky 2.5D treasure chest drawn with flat-shaded SVG faces
// (front, side, lid). Purely visual; animation is done by the parent.

const CHEST_COLORS = {
    body_front: '#ffb400',
    body_side: '#d98a00',
    lid_front: '#ffc93a',
    lid_side: '#e39a00',
    lid_top: '#ffdb6b',
    band_front: '#2a2a2a',
    band_side: '#141414',
    lock: '#ff4d6d',
    lock_side: '#c42a48',
};

interface ChestArtProps
{
    size?: number;
}

export function ChestArt(props: ChestArtProps)
{
    const width = props.size ?? 200;
    return (
        <svg width={width} height={width * 0.9} viewBox="0 0 200 180" aria-hidden="true">
            {/* Body */}
            <polygon points="24,88 128,88 128,160 24,160" fill={CHEST_COLORS.body_front} />
            <polygon points="128,88 176,64 176,136 128,160" fill={CHEST_COLORS.body_side} />

            {/* Lid */}
            <polygon points="24,88 128,88 128,56 24,56" fill={CHEST_COLORS.lid_front} />
            <polygon points="128,88 176,64 176,32 128,56" fill={CHEST_COLORS.lid_side} />
            <polygon points="24,56 128,56 176,32 72,32" fill={CHEST_COLORS.lid_top} />

            {/* Metal bands */}
            <polygon points="66,56 86,56 86,160 66,160" fill={CHEST_COLORS.band_front} />
            <polygon points="72,32 92,32 86,56 66,56" fill={CHEST_COLORS.band_side} />
            <polygon points="128,92 176,68 176,76 128,100" fill={CHEST_COLORS.band_side} opacity="0.6" />

            {/* Lock */}
            <rect x="62" y="80" width="28" height="26" rx="5" fill={CHEST_COLORS.lock_side} />
            <rect x="62" y="77" width="28" height="25" rx="5" fill={CHEST_COLORS.lock} />
            <circle cx="76" cy="87" r="3.5" fill={CHEST_COLORS.band_front} />
            <rect x="74.5" y="88" width="3" height="7" rx="1.5" fill={CHEST_COLORS.band_front} />

            {/* Highlights on lit edges */}
            <polygon points="24,56 128,56 128,60 24,60" fill="#ffffff" opacity="0.35" />
            <polygon points="24,88 128,88 128,92 24,92" fill="#ffffff" opacity="0.25" />
        </svg>
    );
}
