import styles from './haptic_overlay.module.css';

// A real (but invisible) iOS switch stretched over a tap area.
// iOS gives a haptic tick when the user's finger actually toggles a
// <input type="checkbox" switch>; clicking one from code no longer works on
// newer iOS. So the finger lands on this switch, iOS buzzes, and the click
// still bubbles up to the parent's onClick as usual.
//
// The parent must be position: relative and must NOT be a <button>
// (an input inside a button does not receive the tap in every browser).

// Safari 17.4+ renders <input type="checkbox" switch> as a switch.
// React 18 types don't know the attribute, so it is passed through a spread.
const SWITCH_ATTRIBUTE = { switch: '' } as Record<string, string>;

export function HapticOverlay()
{
    return (
        <input
            type="checkbox"
            {...SWITCH_ATTRIBUTE}
            className={styles.overlay}
            tabIndex={-1}
            aria-hidden="true"
        />
    );
}
