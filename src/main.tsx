import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { unlockAudio } from './sound/sfx_engine';
import './stores/settings_store';
import './styles/global.css';

// iOS only allows audio after a real user gesture: unlock on the first touch.
window.addEventListener('pointerdown', unlockAudio, { once: true });

// The service worker is registered automatically by vite-plugin-pwa (registerType: autoUpdate).
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
