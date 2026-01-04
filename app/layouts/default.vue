<script setup lang="ts">
import { ref, onMounted } from "vue";
import MenuItem from "~/components/menu/menu-item.vue";

import faviconIco from "~/assets/img/favicon.ico";
import favicon32 from "~/assets/img/favicon-32x32.png";
import favicon16 from "~/assets/img/favicon-16x16.png";
import appleTouch from "~/assets/img/apple-touch-icon.png";

const STORAGE_KEY = "theme";
const dark = ref(false);

function applyTheme(isDark: boolean, updateValue: boolean = true): void {
    document.documentElement.classList.toggle("dark", isDark);
    if (updateValue) {
        dark.value = isDark;
    }
}

function getInitialTheme(): boolean {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    return saved === "dark";
}

onMounted(() => {
    applyTheme(getInitialTheme());

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (localStorage.getItem(STORAGE_KEY) !== null) {
            return;
        }
        applyTheme(e.matches);
    });
});

function toggleDarkMode(): void {
    localStorage.setItem(STORAGE_KEY, dark.value ? "dark" : "light");
    applyTheme(dark.value, false);
}

useHead({
    bodyAttrs: {
        class: 'bg-white text-gray-700 dark:bg-gray-950 dark:text-gray-100'
    },
    script: [
        {
            src: 'https://kit.fontawesome.com/30258cf383.js',
            crossorigin: 'anonymous',
            referrerpolicy: 'no-referrer',
        },
    ],
    link: [
        {
            rel: 'icon', type: 'image/x-icon', href: faviconIco,
        },
        {
            rel: 'icon', type: 'image/png', sizes: '32x32', href: favicon32,
        },
        {
            rel: 'icon', type: 'image/png', sizes: '16x16', href: favicon16,
        },
        {
            rel: 'apple-touch-icon', sizes: '180x180', href: appleTouch,
        },
    ],
});
</script>

<template>
    <aside class="fixed top-0 left-0 z-40 w-56 h-full" aria-label="Sidebar">
        <div class="h-full overflow-y-auto bg-gray-100 dark:bg-gray-900 text-gray-600 border-e border-gray-200 dark:border-gray-800 shadow-xs flex flex-col">
            <ul class="space-y-2 font-medium flex-1 overflow-y-auto p-2">
                <li>
                    <img src="/assets/img/logo.png" alt="Logo">
                </li>
                <li>
                    <MenuItem title="Int Size" url="/int">
                        <svg class="w-5 h-5 transition duration-75" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                    </MenuItem>
                </li>
                <li>
                    <MenuItem title="JSON" url="/json">
                        <svg class="w-5 h-5 transition duration-75" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="24" height="24">
                            <text stroke="currentColor" fill="currentColor" style="font-family: Arial, sans-serif; font-style: italic; white-space: pre;" x="-0.497" y="19.785" transform="matrix(2.485522, 0, 0, 2.626584, 5.677594, -5.214329)">{..}</text>
                        </svg>
                    </MenuItem>
                </li>
                <li>
                    <MenuItem title="Base 64" url="/base64">
                        <svg class="w-5 h-5 transition duration-75" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                            <text x="-0.497" y="19.785" stroke="currentColor" fill="currentColor" style="font-style: italic">64</text>
                        </svg>
                    </MenuItem>
                </li>
            </ul>

            <div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
                <label for="theme-selector" class="flex items-center cursor-pointer border-r border-gray-200 dark:border-gray-800 p-4">
                    <svg id="theme-toggle-light-icon" class="w-5 h-5" :class="dark ? '' : 'text-orange-600'" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
                    </svg>
                    <input id="theme-selector" type="checkbox" v-model="dark" class="sr-only peer" @change="toggleDarkMode">
                    <span class="relative mx-3 w-9 h-5 bg-gray-200 dark:bg-gray-950 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-buffer after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-400 dark:after:bg-gray-900 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></span>
                    <svg id="theme-toggle-dark-icon" class="w-5 h-5" :class="dark ? 'text-orange-600' : ''" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                    </svg>
                </label>
                <a class="flex items-center justify-center p-4 w-full" href="https://github.com/rexpl/tools" target="_blank" rel="noopener noreferrer">
                    <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.393 6.17 10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418c.504.095.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621.317.044.62.163.885.346.266.183.487.426.647.71.135.253.318.476.538.655a2.079 2.079 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37-2.219-.259-4.554-1.138-4.554-5.07a4.022 4.022 0 0 1 1.031-2.75 3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05.37.858.406 1.828.101 2.713a4.017 4.017 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.471 2.471 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814 0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421 10.473 10.473 0 0 0 1.313-6.948 10.32 10.32 0 0 0-3.39-6.165A9.847 9.847 0 0 0 12.007 2Z" clip-rule="evenodd"/>
                    </svg>
                    <svg class="w-3 h-3 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <g transform="rotate(-45 12 12)">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5m14 0-4 4m4-4-4-4"/>
                        </g>
                    </svg>
                </a>
            </div>
        </div>
    </aside>

    <main class="p-4 ml-56" data-testid="__root__">
        <slot />
    </main>
</template>