// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {
        enabled: true,
    },

    css: [
        '/assets/css/main.css',
        'floating-vue/dist/style.css',
    ],

    app: {
        buildAssetsDir: '/build/'
    },

    vite: {
        plugins: [
            tailwindcss(),
        ],
        build: {
            assetsInlineLimit: 0,
        },
    },
})
