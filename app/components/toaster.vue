<script setup lang="ts">
import {dismissToast, toasts} from "~~/src/toasts";
</script>

<template>
    <TransitionGroup name="toast" tag="div" class="fixed right-4 bottom-4 flex flex-col gap-2 z-[999]">
        <div
            v-for="t in toasts"
            :key="t.id"
            :data-testid="`toast-${t.id}`"
            :data-test-toast-type="t.type"
            class="flex items-center w-sm px-4 py-2 text-body bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-200 dark:border-gray-800">
            <svg
                v-if="t.type === 'success'"
                class="w-5 h-5 text-green-600"
                xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/>
            </svg>
            <svg
                v-if="t.type === 'error'"
                class="w-5 h-5 text-red-600"
                xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
            </svg>

            <div class="ms-2.5 text-sm border-s border-s-gray-200 dark:border-s-gray-800 ps-3.5">{{ t.message }}</div>

            <button
                type="button"
                @click="dismissToast(t.id)"
                class="ms-auto flex items-center justify-center font-medium text-sm h-8 w-8 cursor-pointer hover:opacity-70">
                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/></svg>
            </button>
        </div>
    </TransitionGroup>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition:
        opacity 0.25s ease,
        transform 0.25s ease;
}

.toast-enter-from {
    opacity: 0;
    transform: translateY(8px);
}

.toast-leave-to {
    opacity: 0;
    transform: translateY(8px);
}

.toast-move {
    transition: transform 0.25s ease;
}
</style>