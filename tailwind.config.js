/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                indigo: {
                    50: 'rgba(var(--color-primary-rgb, 79, 70, 229), 0.05)',
                    100: 'rgba(var(--color-primary-rgb, 79, 70, 229), 0.1)',
                    200: 'rgba(var(--color-primary-rgb, 79, 70, 229), 0.2)',
                    300: 'rgba(var(--color-primary-rgb, 79, 70, 229), 0.3)',
                    400: 'rgba(var(--color-primary-rgb, 79, 70, 229), 0.4)',
                    500: 'rgba(var(--color-primary-rgb, 79, 70, 229), 0.8)',
                    600: 'rgba(var(--color-primary-rgb, 79, 70, 229), 1)',
                    700: 'rgba(var(--color-primary-rgb, 79, 70, 229), 1)',
                    800: 'rgba(var(--color-primary-rgb, 79, 70, 229), 1)',
                    900: 'rgba(var(--color-primary-rgb, 79, 70, 229), 1)',
                },
                orange: {
                    50: 'rgba(var(--color-secondary-rgb, 249, 115, 22), 0.05)',
                    100: 'rgba(var(--color-secondary-rgb, 249, 115, 22), 0.1)',
                    200: 'rgba(var(--color-secondary-rgb, 249, 115, 22), 0.2)',
                    300: 'rgba(var(--color-secondary-rgb, 249, 115, 22), 0.3)',
                    400: 'rgba(var(--color-secondary-rgb, 249, 115, 22), 0.4)',
                    500: 'rgba(var(--color-secondary-rgb, 249, 115, 22), 1)',
                    600: 'rgba(var(--color-secondary-rgb, 249, 115, 22), 1)',
                    700: 'rgba(var(--color-secondary-rgb, 249, 115, 22), 1)',
                }
            }
        },
    },
    plugins: [],
}
