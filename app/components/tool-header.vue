<script setup lang="ts">
defineProps<{ description: string; }>();
</script>

<template>
    <div class="mb-8">
        <h1 class="mb-2 text-4xl font-bold text-black dark:text-white">
            <slot />
        </h1>
        <p class="text-base font-normal text-gray-500 dark:text-gray-400">{{ description }}</p>
    </div>
</template>