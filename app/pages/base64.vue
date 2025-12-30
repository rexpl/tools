<script setup lang="ts">
import ToolHeader from "~/components/tool-header.vue";
import ToolHeaderHighlight from "~/components/tool-header-highlight.vue";
import SplitLayout from "~/components/ui/split-layout.vue";
import {watch, ref} from "vue";
import {baseUrl, makeTitle} from "~~/src/constants";
import logo from "~/assets/img/logo.png";
import {error} from "~~/src/toasts";

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

let fireIconTimerId: number;
const FIRE_ICON_DELAY = 250;

const invalidField = ref<'none' | 'base64' | 'raw'>('none');

const base64 = ref('');
function decodeBase64ToText(): void {
    window.clearTimeout(fireIconTimerId);
    invalidField.value = 'none';

    if (base64.value === '') {
        rawtext.value = '';
        return;
    }

    try {
        rawtext.value = window.atob(base64.value);
    } catch (_) {
        fireIconTimerId = window.setTimeout(() => { error('Invalid base 64 input.'); }, FIRE_ICON_DELAY);
        invalidField.value = 'base64';
    }
}

const base64Input = ref<HTMLInputElement>();
watch(base64Input, () => { // on mount not working idk why, maybe because of ClientOnly ?
    base64Input.value?.focus();
});

const rawtext = ref('');
function encodeTextToBase64(): void {
    window.clearTimeout(fireIconTimerId);
    invalidField.value = 'none';

    if (rawtext.value === '') {
        base64.value = '';
        return;
    }

    // can the input be invalid ...?
    // apparently yes: https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa#exceptions
    try {
        base64.value = window.btoa(rawtext.value);
    } catch (_) {
        fireIconTimerId = window.setTimeout(() => { error('Invalid text input.'); }, FIRE_ICON_DELAY);
        invalidField.value = 'raw';
    }
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
                    <div class="w-full h-full p-0.5">
                        <textarea
                            class="bg-gray-100 dark:bg-gray-900 border text-sm rounded-md  block w-full h-full p-3 shadow-xs"
                            :class="invalidField === 'base64' ? 'border-red-600 focus:ring-red-600' : 'focus:ring-orange-600 focus:border-orange-600 border-gray-200 dark:border-gray-800'"
                            placeholder="Base 64 data"
                            v-model="base64"
                            @input="decodeBase64ToText"
                            ref="base64Input"
                            data-testid="base64-encoded-input"
                            :aria-invalid="invalidField === 'base64'"
                        ></textarea>
                    </div>
                </template>
                <template #second>
                    <div class="w-full h-full p-0.5">
                        <textarea
                            class="bg-gray-100 dark:bg-gray-900 border text-sm rounded-md  block w-full h-full p-3 shadow-xs"
                            :class="invalidField === 'raw' ? 'border-red-600 focus:ring-red-600' : 'focus:ring-orange-600 focus:border-orange-600 border-gray-200 dark:border-gray-800'"
                            placeholder="Decoded data"
                            v-model="rawtext"
                            @input="encodeTextToBase64"
                            data-testid="base64-decoded-input"
                            :aria-invalid="invalidField === 'raw'"
                        ></textarea>
                    </div>
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