// Haptics from code. Only the standard Vibration API (Android) works here:
// iOS ignores programmatic switch clicks, so iPhone haptics come from
// HapticOverlay (src/ui/haptic_overlay.tsx), a real switch under the finger.

let is_enabled = true;

const ANDROID_VIBRATE_MS = 10;

export function setHapticEnabled(enabled: boolean): void
{
    is_enabled = enabled;
}

// Call from a click handler (browsers only allow vibration after a user tap)
export function triggerHaptic(): void
{
    if (is_enabled && typeof navigator.vibrate === 'function')
    {
        navigator.vibrate(ANDROID_VIBRATE_MS);
    }
}
