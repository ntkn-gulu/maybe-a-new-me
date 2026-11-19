// Small inline SVG icons (tab bar, collection slots). They use currentColor so the
// parent decides the color (dim when idle, accent when active).

interface IconProps
{
    size?: number;
}

const DEFAULT_ICON_SIZE = 26;

export function FlameIcon(props: IconProps)
{
    const size = props.size ?? DEFAULT_ICON_SIZE;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2c.8 2.9 4.3 4.9 4.3 9.2a4.3 4.3 0 0 1-8.6 0c0-2.1 1-3.5 2-4.6.2 1.4.9 2.2 1.6 2.4-.5-2.7.3-5.1.7-7z" />
            <path d="M12 21.5c-3.6 0-6.5-2.7-6.5-6.3 0-1.6.5-3 1.3-4.2-.1.5-.1.9-.1 1.4 0 3 2.4 5.4 5.3 5.4s5.3-2.4 5.3-5.4c0-.5 0-.9-.1-1.4.8 1.2 1.3 2.6 1.3 4.2 0 3.6-2.9 6.3-6.5 6.3z" opacity="0.55" />
        </svg>
    );
}

export function TimerIcon(props: IconProps)
{
    const size = props.size ?? DEFAULT_ICON_SIZE;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="13.5" r="7.5" />
            <path d="M12 13.5V9.5" />
            <path d="M9.5 2.5h5" />
            <path d="M18.5 6.5l1.3-1.3" />
        </svg>
    );
}

export function ChestIcon(props: IconProps)
{
    const size = props.size ?? DEFAULT_ICON_SIZE;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 10.5h17v8a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
            <path d="M3.5 10.5V9a5 5 0 0 1 5-5h7a5 5 0 0 1 5 5v1.5" />
            <rect x="10" y="9" width="4" height="4.5" rx="1" fill="currentColor" />
        </svg>
    );
}

export function GearIcon(props: IconProps)
{
    const size = props.size ?? DEFAULT_ICON_SIZE;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
    );
}

export function SoundIcon(props: IconProps)
{
    const size = props.size ?? DEFAULT_ICON_SIZE;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 9.5h3.5l4.5-4v13l-4.5-4H3.5z" fill="currentColor" />
            <path d="M15.5 9a4.2 4.2 0 0 1 0 6" />
            <path d="M18.3 6.3a8 8 0 0 1 0 11.4" />
        </svg>
    );
}

export function PaletteIcon(props: IconProps)
{
    const size = props.size ?? DEFAULT_ICON_SIZE;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-.9.7-1.5 1.7-1.5H17a3.5 3.5 0 0 0 3.5-3.6C20.5 6.9 16.7 3.5 12 3.5z" />
            <circle cx="7.8" cy="11" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="10.8" cy="7.4" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="15.3" cy="8" r="1.4" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function BadgeIcon(props: IconProps)
{
    const size = props.size ?? DEFAULT_ICON_SIZE;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8.6 13.6L7 21l5-2.6 5 2.6-1.6-7.4" />
            <circle cx="12" cy="9" r="5.5" />
            <circle cx="12" cy="9" r="2" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function HeadphonesIcon(props: IconProps)
{
    const size = props.size ?? DEFAULT_ICON_SIZE;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 15.5V12a8 8 0 0 1 16 0v3.5" />
            <rect x="3" y="14" width="4.5" height="7" rx="1.6" fill="currentColor" />
            <rect x="16.5" y="14" width="4.5" height="7" rx="1.6" fill="currentColor" />
        </svg>
    );
}
