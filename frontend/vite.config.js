import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, '.', '');
    var apiProxyTarget = env.OLEP_API_PROXY_TARGET;
    return {
        plugins: [react()],
        build: {
            outDir: 'dist',
            emptyOutDir: true,
        },
        server: {
            host: '127.0.0.1',
            port: 4173,
            strictPort: true,
            proxy: apiProxyTarget
                ? {
                    '/api': {
                        target: apiProxyTarget,
                        changeOrigin: true,
                    },
                }
                : undefined,
        },
    };
});
