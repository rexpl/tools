<script setup lang="ts">
defineProps<{ first?: boolean; }>();
</script>

<template>
    <td
        class="px-4 py-2"
        :class="first ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-800 dark:text-gray-200'"
    >
        <slot />
    </td>
</template>