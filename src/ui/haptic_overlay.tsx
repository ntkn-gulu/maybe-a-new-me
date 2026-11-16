import { useSettingsStore } from '../stores/settings_store';
import styles from './haptic_overlay.module.css';

// A real (but nearly invisible) iOS switch stretched over a tap area.
// iOS gives a haptic tick when the user's finger actually toggles a
// <input type="checkbox" switch>; clicking one from code does not work on
// newer iOS. So the finger lands on this switch, iOS buzzes, and the click
// still bubbles up to the parent's onClick as usual.
//
// The parent must be position: relative and must NOT be a <button>
// (use getPressableProps on a div instead).

// Safari 17.4+ renders <input type="checkbox" switch> as a switch.
// React 18 types don't know the attribute, so it is passed through a spread.
const SWITCH_ATTRIBUTE = { switch: '' } as Record<string, string>;

interface HapticOverlayProps
{
    is_disabled?: boolean;
}

export function HapticOverlay(props: HapticOverlayProps)
{
    const is_haptic_enabled = useSettingsStore((state) => state.is_haptic_enabled);
    if (!is_haptic_enabled || props.is_disabled)
    {
        return null;
    }
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
