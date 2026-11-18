// Is the app running from the home screen, and if not, how can it get there?
// - ios:     Safari's Share → "Add to Home Screen" (no install prompt exists on iOS)
// - android: the browser's install prompt (one button) or its menu steps
// - null:    already installed, or a computer (nothing to suggest)
// On iOS the home screen app keeps its own storage, separate from Safari,
// so installing first matters there.
// The browser decides where the "add to home screen" item lives, so the
// steps are picked per browser (getInstallBrowser).

export type InstallPlatform = 'ios' | 'android' | null;

// iPhone: Safari, or another browser (Chrome, Edge, Firefox... all on Safari's engine)
// Android: Chrome, Edge, Samsung Internet, Firefox, or another one
export type InstallBrowser = 'safari' | 'ios_other' | 'chrome' | 'edge' | 'samsung' | 'firefox' | 'android_other';

interface InstallPromptEvent extends Event
{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred_prompt: InstallPromptEvent | null = null;

// Chromium browsers (Chrome, Edge, Samsung Internet) fire this early when the
// app can be installed; keep it for a one-tap install button
window.addEventListener('beforeinstallprompt', (event) =>
{
    event.preventDefault();
    deferred_prompt = event as InstallPromptEvent;
});

function isStandalone(): boolean
{
    const navigator_ios = navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches || navigator_ios.standalone === true;
}

export function getInstallPlatform(): InstallPlatform
{
    if (isStandalone())
    {
        return null;
    }
    const agent = navigator.userAgent;
    // iPadOS reports itself as a Mac, but with a touch screen
    if (/iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1))
    {
        return 'ios';
    }
    if (/Android/.test(agent))
    {
        return 'android';
    }
    return null;
}

// Order matters: Edge and Samsung Internet also say "Chrome" in their user agent
export function getInstallBrowser(platform: Exclude<InstallPlatform, null>): InstallBrowser
{
    const agent = navigator.userAgent;
    if (platform === 'ios')
    {
        return /CriOS|EdgiOS|FxiOS|OPiOS/.test(agent) ? 'ios_other' : 'safari';
    }
    if (/EdgA\//.test(agent))
    {
        return 'edge';
    }
    if (/SamsungBrowser/.test(agent))
    {
        return 'samsung';
    }
    if (/Firefox/.test(agent))
    {
        return 'firefox';
    }
    if (/Chrome\//.test(agent) && !/OPR|YaBrowser|CocCoc/.test(agent))
    {
        return 'chrome';
    }
    return 'android_other';
}

export function canPromptInstall(): boolean
{
    return deferred_prompt !== null;
}

// Shows Chrome's install dialog; true when the user accepted
export async function promptInstall(): Promise<boolean>
{
    if (!deferred_prompt)
    {
        return false;
    }
    const prompt_event = deferred_prompt;
    deferred_prompt = null;
    await prompt_event.prompt();
    const choice = await prompt_event.userChoice;
    return choice.outcome === 'accepted';
}
