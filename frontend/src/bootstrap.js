/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const savedToken = window.localStorage?.getItem('support_token');
const appBasePath = normalizeBasePath(import.meta.env.BASE_URL || '/');

if (savedToken) {
    window.axios.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
}

window.axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/api/login');

        if (error.response?.status === 401 && !isLoginRequest) {
            window.localStorage?.removeItem('support_token');
            window.localStorage?.removeItem('support_user');
            delete window.axios.defaults.headers.common.Authorization;

            if (!window.location.pathname.includes('/login')) {
                window.location.href = joinBasePath(appBasePath, 'login');
            }
        }

        return Promise.reject(error);
    },
);

function normalizeBasePath(path) {
    const normalized = `/${String(path || '/').replace(/^\/+|\/+$/g, '')}`;

    return normalized === '/' ? '/' : normalized;
}

function joinBasePath(base, path) {
    const normalizedPath = String(path || '').replace(/^\/+/, '');

    return base === '/' ? `/${normalizedPath}` : `${base}/${normalizedPath}`;
}

let echoPromise = null;

window.ensureEcho = async () => {
    if (!import.meta.env.VITE_PUSHER_APP_KEY) return null;
    if (window.Echo) return window.Echo;

    echoPromise ??= Promise.all([
        import('laravel-echo'),
        import('pusher-js'),
    ]).then(([{ default: Echo }, { default: Pusher }]) => {
        window.Pusher = Pusher;
        window.Echo = new Echo({
            broadcaster: 'pusher',
            key: import.meta.env.VITE_PUSHER_APP_KEY,
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
            wsHost: import.meta.env.VITE_PUSHER_HOST ? import.meta.env.VITE_PUSHER_HOST : `ws-${import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1'}.pusher.com`,
            wsPort: import.meta.env.VITE_PUSHER_PORT ?? 80,
            wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
            forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https',
            enabledTransports: ['ws', 'wss'],
        });

        return window.Echo;
    });

    return echoPromise;
};
