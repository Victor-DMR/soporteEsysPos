/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    blue: '#0067b1',
                    blueDark: '#004f8d',
                    green: '#43a929',
                    ink: '#202833',
                    soft: '#eef7fd',
                },
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                soft: '0 18px 60px -28px rgba(15, 23, 42, 0.35)',
            },
        },
    },
    plugins: [],
};
