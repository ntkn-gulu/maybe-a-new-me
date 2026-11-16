// Experimental haptics for iPhone without a native app.
// iOS 18+ Safari gives a light haptic tick when an <input type="checkbox" switch>
// is toggled. Clicking a hidden label for such a switch during a user tap
// triggers that tick. Android/desktop simply ignore it.

let hidden_label: HTMLLabelElement | null = null;
let is_enabled = true;

function getHiddenLabel(): HTMLLabelElement
{
    if (!hidden_label)
    {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.setAttribute('switch', '');
        input.id = 'haptic-switch';

        hidden_label = document.createElement('label');
        hidden_label.htmlFor = input.id;
        hidden_label.setAttribute('aria-hidden', 'true');
        hidden_label.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;';
        hidden_label.appendChild(input);
        document.body.appendChild(hidden_label);
    }
    return hidden_label;
}

export function setHapticEnabled(enabled: boolean): void
{
    is_enabled = enabled;
}

// Must be called inside a user gesture handler (pointer/click), or iOS ignores it.
export function triggerHaptic(): void
{
    if (!is_enabled)
    {
        return;
    }
    // navigator.vibrate works on Android; iOS does not have it
    if ('vibrate' in navigator)
    {
        navigator.vibrate(8);
        return;
    }
    getHiddenLabel().click();
}
