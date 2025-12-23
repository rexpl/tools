<script setup lang="ts">
import ToolHeader from "~/components/tool-header.vue";
import ToolHeaderHighlight from "~/components/tool-header-highlight.vue";
import SplitLayout from "~/components/ui/split-layout.vue";

const horizontal = ref(false);

const base64 = ref('');
const rawtext = ref('');

const base64Input = ref<HTMLInputElement>();
onMounted(() => {
    base64Input.value?.focus();
});

function decode(value: string): string {
    return window.atob(value);
}
function encode(value: string): string {
    return window.btoa(value);
}
</script>

<template>
    <ToolHeader description="Provides basic base 64 encoding/decoding with live editing.">
        Encode/Decode <ToolHeaderHighlight title="Base 64" /> Data
    </ToolHeader>

    <div class="w-full h-[calc(100vh-137px)]">
        <SplitLayout local-storage="layout:base64" :initial-ratio="0.40">
            <template #first>
                <textarea id="message" rows="4" class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-heading text-sm rounded-md focus:ring-0 block w-full h-full p-3 shadow-xs"
                          placeholder="Base 64 data" v-model="base64" @input="rawtext = decode(base64)" ref="base64Input"></textarea>
            </template>
            <template #second>
                <textarea id="message" rows="4" class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-heading text-sm rounded-md focus:ring-0 block w-full h-full p-3 shadow-xs"
                          placeholder="Decoded data" v-model="rawtext" @input="base64 = encode(rawtext)"></textarea>
            </template>
        </SplitLayout>
    </div>
</template>

<style scoped>
textarea {
    resize: none;
}
</style>