import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const backendUrl = (env.API_PROXY_TARGET || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const publicBasePath = env.VITE_PUBLIC_BASE_PATH || '/';

    return {
        base: publicBasePath,
        plugins: [react()],
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        react: ['react', 'react-dom', 'react-router-dom'],
                        motion: ['framer-motion'],
                        realtime: ['laravel-echo', 'pusher-js'],
                        ui: ['lucide-react', 'sonner'],
                    },
                },
            },
        },
        server: {
            host: '0.0.0.0',
            port: 5173,
            proxy: {
                '/api': backendUrl,
                '/storage': backendUrl,
            },
        },
    };
});
