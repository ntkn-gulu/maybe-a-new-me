import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the app from /<repo-name>/, local dev serves it from /
const REPO_BASE_PATH = '/maybe-a-new-me/';
const APP_BACKGROUND = '#0b0b0d';

export default defineConfig(({ command }) => ({
    base: command === 'build' ? REPO_BASE_PATH : '/',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/icon.svg'],
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
