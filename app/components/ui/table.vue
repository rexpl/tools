<script lang="ts" setup>
defineProps<{ headers: string[]; }>();
</script>

<template>
    <div class="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
        <table class="min-w-full text-sm">
            <thead class="bg-gray-100 dark:bg-gray-800">
            <tr>
                <th v-for="header in headers" class="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-200">{{ header }}</th>
            </tr>
            </thead>
            <tbody class="bg-gray-50 dark:bg-gray-900">
            <slot />
            </tbody>
        </table>
    </div>
</template>