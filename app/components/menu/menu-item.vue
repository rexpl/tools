<script setup lang="ts">
defineProps<{ url: string; title: string }>();
</script>

<template>
    <NuxtLink
        :href="url"
        exact-active-class="bg-gray-200 dark:bg-gray-800 text-orange-600"
        class="flex items-center px-2 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-orange-600 rounded-md">
        <slot />
        <span class="ms-3">{{ title }}</span>
    </NuxtLink>
</template>