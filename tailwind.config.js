/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                forest: {
                    50: '#f2fcf5',
                    100: '#e1f8e8',
                    200: '#c3efd3',
                    300: '#94e0b5',
                    400: '#5cc791',
                    500: '#34ab73',
                    600: '#258a5c',
                    700: '#1e6e4b',
                    800: '#1b573e',
                    900: '#174835',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
