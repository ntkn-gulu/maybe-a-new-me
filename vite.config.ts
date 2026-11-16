import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the app from /<repo-name>/, local dev serves it from /
const REPO_BASE_PATH = '/maybe-a-new-me/';
const APP_BACKGROUND = '#f2eee7';

export default defineConfig(({ command }) => ({
    base: command === 'build' ? REPO_BASE_PATH : '/',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            // Precache fonts too, so the app looks right offline
            workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
            includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
            manifest: {
                name: 'Maybe A New Me',
                short_name: 'New Me',
                description: 'Pomodoro, streak lửa và phần thưởng — giữ thói quen mỗi ngày.',
                lang: 'vi',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '.',
                scope: '.',
                theme_color: APP_BACKGROUND,
                background_color: APP_BACKGROUND,
                icons: [
                    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
                ],
            },
        }),
    ],
    test: {
        include: ['tests/**/*.test.ts'],
        passWithNoTests: true,
    },
}));
