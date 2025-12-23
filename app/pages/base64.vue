<script setup lang="ts">
import ToolHeader from "~/components/tool-header.vue";
import ToolHeaderHighlight from "~/components/tool-header-highlight.vue";
import SplitLayout from "~/components/ui/split-layout.vue";
import {onMounted} from "vue";
import {baseUrl, makeTitle} from "~~/src/constants";
import logo from "~/assets/img/logo.png";

const title = 'Base 64';
const description = 'Provides basic base 64 encoding/decoding with live editing.';

const pageTitle = makeTitle(title);
useSeoMeta({
    title: pageTitle,
});

if (import.meta.server) {
    useSeoMeta({
        description: description,
        ogTitle: pageTitle,
        ogDescription: description,
        ogImage: baseUrl(logo),
        ogUrl: baseUrl(`/base64`),
        ogType: 'website',
        ogSiteName: pageTitle,
        twitterCard: 'summary_large_image',
        twitterTitle: pageTitle,
        twitterDescription: description,
        twitterImage: baseUrl(logo),
    });
}

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
    <ToolHeader :description="description">
        Encode/Decode <ToolHeaderHighlight :title="title" /> Data
    </ToolHeader>

    <!-- without this causes hydration mismatches as the split layout uses local storage unavailable at build -->
    <ClientOnly>
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
    </ClientOnly>
</template>

<style scoped>
textarea {
    resize: none;
}
</style>