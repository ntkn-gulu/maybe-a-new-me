import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { unlockAudio } from './sound/sfx_engine';
import './stores/settings_store';
import { useFocusStore } from './stores/focus_store';

// Fonts are bundled (not loaded from Google) so the PWA works offline.
// Each file includes the Vietnamese subset.
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './styles/global.css';

// iOS only allows audio after a real user activation. On touch screens that is
// touchend/click (not pointerdown), so listen to all of them; unlocking twice is harmless.
const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'click'] as const;
for (const event_name of UNLOCK_EVENTS)
{
    window.addEventListener(event_name, unlockAudio, { once: true });
}

// A session that was running when the app closed is judged now (time closed = time away)
useFocusStore.getState().recoverAfterReload();

// The service worker is registered automatically by vite-plugin-pwa (registerType: autoUpdate).
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
