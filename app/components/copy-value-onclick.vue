<script setup lang="ts">
import {copyValueToClipboard} from "~~/src/copy";

const props = defineProps<{ value: string; }>();

const enum CopyStats {
    Available,
    Loading,
    Done,
    Error,
}
const status = ref<CopyStats>(CopyStats.Available);

async function copy() {
    if (status.value !== CopyStats.Available) {
        return;
    }

    status.value = CopyStats.Loading;
    const success = await copyValueToClipboard(props.value);
    if (success) {
        status.value = CopyStats.Done;
    } else {
        status.value = CopyStats.Error;
    }

    setTimeout(() => {
        status.value = CopyStats.Available;
    }, 1000);
}
</script>

<template>
    <button @click="copy" class="flex items-center space-x-1.5 group cursor-pointer">
        <div>
            <slot />
        </div>
        <div class="hidden group-hover:block">
            <svg v-if="status === CopyStats.Available" class="w-4 h-4 text-gray-400 dark:text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z"/>
            </svg>
            <svg v-if="status === CopyStats.Error" class="w-4 h-4 text-red-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
            </svg>
            <svg v-if="status === CopyStats.Done" class="w-4 h-4 text-green-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/>
            </svg>
        </div>
    </button>
</template>