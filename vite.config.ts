import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load environment variables from .env.local
    const env = loadEnv(mode, '.', '');
    const isStrictFastRefresh = env.FAST_REFRESH_STRICT === 'true';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: {
          overlay: !isStrictFastRefresh,
          onError: () => {
            if (!isStrictFastRefresh) {
              window.location.reload();
            }
          }
        }
      },
      plugins: [
        react()
      ],
      // Note: VITE_ prefixed variables are automatically exposed by Vite
      // We define these for backwards compatibility with process.env usage
      define: {
        'process.env.FAST_REFRESH_STRICT': JSON.stringify(env.FAST_REFRESH_STRICT)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
