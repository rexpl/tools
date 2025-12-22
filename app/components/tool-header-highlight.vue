<script setup lang="ts">
defineProps<{ title: string; }>();
</script>

<template>
    <mark class="px-2 pb-0.5 text-white bg-orange-600 rounded-md">{{ title }}</mark>
</template>