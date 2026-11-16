// Experimental haptics for iPhone without a native app.
// iOS 18+ Safari plays a light system haptic when an
// <input type="checkbox" switch> is toggled. Clicking a throwaway label
// that wraps such a switch triggers it (same trick as the ios-haptics library).
//
// IMPORTANT: browsers only allow this inside a real user activation.
// On touch screens that means a `click` / `pointerup` / `touchend` handler,
// NOT `pointerdown` (pointerdown only counts for mouse). Call triggerHaptic()
// from onClick.

let is_enabled = true;

const ANDROID_VIBRATE_MS = 10;

export function setHapticEnabled(enabled: boolean): void
{
    is_enabled = enabled;
}

export function triggerHaptic(): void
{
    if (!is_enabled)
    {
        return;
    }

    // Android (and some desktops) support the standard Vibration API
    if (typeof navigator.vibrate === 'function')
    {
        navigator.vibrate(ANDROID_VIBRATE_MS);
        return;
    }

    try
    {
        const label = document.createElement('label');
        label.setAttribute('aria-hidden', 'true');
        label.style.display = 'none';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.setAttribute('switch', '');
        label.appendChild(input);

        // A fresh element each time: iOS only ticks when the switch state changes
        document.head.appendChild(label);
        label.click();
        document.head.removeChild(label);
    }
    catch
    {
        // Haptics are a nice-to-have; never break a tap because of them
    }
}
