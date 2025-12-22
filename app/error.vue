<script lang="ts" setup>
import type { NuxtError } from '#app'
import Toaster from "~/components/toaster.vue";

const props = defineProps({
    error: Object as () => NuxtError,
});
</script>

<template>
    <NuxtLayout>
        <div class="w-full flex justify-center mt-40">
            <div class="text-center">
                <h1 class="text-bold text-6xl">{{ props.error.statusCode }}</h1>
                <h2 class="text-bold text-4xl">{{ props.error.statusMessage }}</h2>
            </div>
        </div>
    </NuxtLayout>
    <Toaster />
</template>