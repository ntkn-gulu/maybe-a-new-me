import type { KeyboardEvent } from 'react';

// Props that make a <div> behave like a button (click, Enter, Space, focus).
// Tap targets are divs instead of <button>s so they can hold a HapticOverlay:
// an <input> inside a <button> does not reliably receive the finger.

type PressableRole = 'button' | 'switch' | 'radio' | 'tab';

export interface PressableProps
{
    role: PressableRole;
    tabIndex: number;
    'aria-disabled'?: boolean;
    onClick?: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

export function getPressableProps(onActivate: () => void, is_disabled = false, role: PressableRole = 'button'): PressableProps
{
    return {
        role,
        tabIndex: is_disabled ? -1 : 0,
        'aria-disabled': is_disabled || undefined,
        onClick: is_disabled ? undefined : onActivate,
        onKeyDown: (event) =>
        {
            if (is_disabled || (event.key !== 'Enter' && event.key !== ' '))
            {
                return;
            }
            event.preventDefault();       // stop Space from scrolling the page
            onActivate();
        },
    };
}
