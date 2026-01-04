<script setup lang="ts">
import ToolHeaderHighlight from "~/components/tool-header-highlight.vue";
import ToolHeader from "~/components/tool-header.vue";
import FullHeightContainer from "~/components/ui/full-height-container.vue";
import SplitLayout from "~/components/ui/split-layout.vue";
import {ref, onMounted, nextTick} from "vue";
import {error} from "~~/src/toasts";

const jsonInput = ref<HTMLTextAreaElement>();
const fileInput = ref<HTMLInputElement>();

function focusInput() {
    nextTick(() => {
        jsonInput.value!.focus();
    });
}

onMounted(() => {
    focusInput();
});

const rawJson = ref('');
const fileName = ref<string | null>(null);

const jsonIsInvalid = ref(false);
const jsonInputIsLarge = ref(false);
const showJsonViewer = ref(false);
const isDraggingOver = ref(false);

const THRESHOLD_FOR_LARGE_INPUT = 100_000;
function onPaste(event: ClipboardEvent) {
    const pasted = event.clipboardData!.getData('text');
    if (pasted.length > THRESHOLD_FOR_LARGE_INPUT) {
        event.preventDefault();
        rawJson.value = pasted;
        showJsonViewer.value = true;
        jsonInputIsLarge.value = true;
    }
}

let timerId: number;
function onInput(e: InputEvent) {
    clearTimeout(timerId);
    if (e.inputType === 'insertFromPaste' || rawJson.value === '') {
        showJsonViewer.value = rawJson.value !== '';
        jsonIsInvalid.value = false;
    } else {
        timerId = window.setTimeout(() => {
            showJsonViewer.value = rawJson.value !== '';
            jsonIsInvalid.value = false;
        }, 350);
    }
}

async function readJsonFile(file: File) {
    if (file.type !== "application/json") {
        error(`Invalid file type (${file.type}).`);
        return;
    }
    rawJson.value = await file.text();
    fileName.value = file.name;
    showJsonViewer.value = true;
}

function onDrop(e: DragEvent) {
    isDraggingOver.value = false;
    if (e.dataTransfer !== null && 0 in e.dataTransfer.files) {
        readJsonFile(e.dataTransfer.files[0]);
    } else {
        error('Expected a file drop.');
    }
}

function onPick(e: Event) {
    const input = e.target! as HTMLInputElement;
    if (input.files !== null && 0 in input.files) {
        readJsonFile(input.files[0]);
    }
    input.value = ""; // allow picking the same file again
}

function clear(): void {
    rawJson.value = "";
    fileName.value = null;
    showJsonViewer.value = false;
    jsonInputIsLarge.value = false;
    jsonIsInvalid.value = false;
    focusInput();
}
</script>

<template>
    <ToolHeader description="Provides JSON decoding with structured viewing and search functionality.">
        Decode and Inspect <ToolHeaderHighlight title="JSON" /> Data
    </ToolHeader>

    <!-- without this causes hydration mismatches as the split layout uses local storage unavailable at build -->
    <ClientOnly>
        <FullHeightContainer
            @dragenter.prevent="isDraggingOver = true"
            @dragover.prevent="$event.dataTransfer.dropEffect = 'copy'"
            @dragleave.prevent="isDraggingOver = false"
            @drop.prevent="onDrop"
        >
            <SplitLayout
                v-if="!isDraggingOver"
                local-storage="layout:json"
                :initial-ratio="0.40"
            >
                <template #first>
                    <div
                        v-if="fileName !== null"
                        class="flex items-center justify-center flex-col space-y-4 h-full rounded-md bg-gray-50 dark:bg-gray-900 border"
                        :class="jsonIsInvalid ? 'border-red-600 focus:ring-red-600' : 'border-gray-200 dark:border-gray-800'"
                    >
                        <div class="flex flex-col items-center text-gray-600 dark:text-gray-300">
                            <span class="text-5xl mb-4"><i class="fa-regular fa-file"></i></span>
                            <span class="">{{ fileName }}</span>
                        </div>
                        <div class="flex space-x-8 items-center">
                            <button type="button" class="text-orange-600 hover:underline text-sm cursor-pointer" @click="clear">clear</button>
                            <div>
                                <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="onPick" />
                                <button type="button" class="text-orange-600 hover:underline text-sm cursor-pointer" @click="fileInput!.click()">change file</button>
                            </div>
                        </div>
                    </div>

                    <div
                        v-else-if="jsonInputIsLarge"
                        class="flex items-center justify-center flex-col space-y-4 h-full rounded-md bg-gray-50 dark:bg-gray-900 border"
                        :class="jsonIsInvalid ? 'border-red-600 focus:ring-red-600' : 'border-gray-200 dark:border-gray-800'"
                    >
                        <div class="flex flex-col items-center text-gray-600 dark:text-gray-300">
                            <span class="text-lg">Input hidden for performance</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap justify-center items-center gap-x-0.5 text-center">
                                <span class="whitespace-nowrap">Large JSON entered.</span>
                                <span class="whitespace-nowrap">Rendering the editor would impact performance.</span>
                            </span>
                        </div>
                        <div class="flex space-x-8 items-center">
                            <button type="button" class="text-orange-600 hover:underline text-sm cursor-pointer" @click="clear">clear</button>
                            <button type="button" class="text-orange-600 hover:underline text-sm cursor-pointer" @click="jsonInputIsLarge = false">show anyway</button>
                        </div>
                    </div>

                    <textarea
                        v-else
                        class="bg-gray-100 dark:bg-gray-900 border text-sm rounded-md  block w-full h-full p-3 shadow-xs"
                        :class="jsonIsInvalid ? 'border-red-600 focus:ring-red-600' : 'focus:ring-orange-600 focus:border-orange-600 border-gray-200 dark:border-gray-800'"
                        placeholder="Paste or enter JSON here"
                        v-model="rawJson"
                        @paste="onPaste"
                        @input="onInput"
                        ref="jsonInput"
                        data-testid="json-encoded-input"
                    ></textarea>
                </template>

                <template #second>
                    <div v-if="jsonIsInvalid" class="flex items-center justify-center flex-col space-y-4 h-full">
                        <div class="flex flex-col items-center text-red-600">
                            <svg class="w-6 h-6 mb-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                            </svg>
                            <span class="text-lg">Invalid JSON</span>
                            <span class="text-xs">The input can’t be parsed.</span>
                        </div>
                    </div>

                    <JsonViewer v-else-if="showJsonViewer" :json="rawJson" @invalid="jsonIsInvalid = $event" />

                    <div v-else class="flex items-center justify-center flex-col space-y-4 h-full">
                        <div class="flex flex-col items-center text-gray-600 dark:text-gray-300">
                            <span class="text-lg">No JSON to display</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">Paste JSON, drop a file, or choose one to get started.</span>
                        </div>
                        <div>
                            <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="onPick" />
                            <button type="button" class="text-orange-600 hover:underline text-sm cursor-pointer" @click="fileInput!.click()">choose file</button>
                        </div>
                    </div>
                </template>
            </SplitLayout>

            <div
                v-else
                class="flex items-center justify-center h-full rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
                <div class="flex flex-col items-center -mt-16 text-gray-600 dark:text-gray-300">
                    <span class="text-lg">Drop to open JSON</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">(stays in your browser)</span>
                </div>
            </div>
        </FullHeightContainer>
    </ClientOnly>
</template>

<style scoped>
textarea {
    resize: none;
}
</style>