<script setup lang="ts">
import { JsonData } from "~~/src/json/jsonData";
import { ref, nextTick, watch, computed, onBeforeUnmount, onMounted } from "vue";
import type {SearchResult} from "~~/src/json/nodes";

const props = defineProps<{ json: string }>();
const emit = defineEmits<{ (e: "invalid", value: boolean): void }>();

const search = ref("");
const element = ref<HTMLElement>();

let data: JsonData | null = null;

const matches = ref<SearchResult[]>([]);
const matchIndex = ref<number | null>(0);

function clampIndex(i: number, len: number) {
    if (len <= 0) {
        return 0;
    }
    return ((i % len) + len) % len;
}

function scrollToMatch(i: number) {
    const scroller = element.value!;
    const list = matches.value;
    if (!list.length) return;

    // unhighlight previous
    if (matchIndex.value !== null) {
        list[matchIndex.value]!.highlight(false);
    }

    matchIndex.value = clampIndex(i, list.length);
    const target = list[matchIndex.value]!;
    target.highlight(true);

    const y = target.getApproxScrollPosition();

    const viewTop = scroller.scrollTop + 20;
    const viewBottom = scroller.scrollTop + scroller.clientHeight - 20;

    // already in viewport?
    if (y >= viewTop && y <= viewBottom) {
        return;
    }

    scroller.scrollTo({ top: Math.max(0, y - 100) });
}

function nextMatch() {
    if (matches.value.length > 0) {
        scrollToMatch(matchIndex.value! + 1);
    }
}
function prevMatch() {
    if (matches.value.length > 0) {
        scrollToMatch(matchIndex.value! - 1);
    }
}

function runSearch() {
    matches.value = data!.search(search.value);
    matchIndex.value = null;

    if (matches.value.length > 0) {
        scrollToMatch(0);
    }
}

let timerId: number;
function startSearching() {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(runSearch, 200);
}

onBeforeUnmount(() => {
    window.clearTimeout(timerId);
    data?.destroy();
});

const isInvalid = computed(() => {
    data?.destroy();

    search.value = "";
    matches.value = [];
    matchIndex.value = null;

    data = JsonData.makeSafe(props.json);
    if (data === null) {
        return true;
    }

    nextTick().then(() => {
        data?.init(element.value!);
    });

    return false;
});

watch(isInvalid, (val) => emit("invalid", val), { immediate: true });

// Keyboard behavior like browser find: Enter / Shift+Enter
function onSearchKeydown(e: KeyboardEvent) {
    stopPlaceholderExampleLoop();
    if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        nextMatch();
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        prevMatch();
    } else if (e.key === "Escape") {
        search.value = "";
        runSearch();
    }
}

const placeholder = ref("Search…");
let placeholderLoopRunning = true;
let placeholderTimers: number[] = [];
const placeholderExamples = [
    `"John Doe" = values contain`,
    `"=John Doe" = values exact match`,
    `"name=John Doe" = key + value contain`,
    `"name==John Doe" = key + value exact match`,
    `"comments.2.user.id=123" = path contains`,
    `"comments.*.user.id=123" = wildcard path contains`,
    `"comments.*.user.id==123" = wildcard path exact match`,
];

function stopPlaceholderExampleLoop() {
    if (!placeholderLoopRunning) {
        return;
    }

    for (const id of placeholderTimers) {
        window.clearTimeout(id);
    }
    placeholder.value = "Search…";
    placeholderLoopRunning = false;
    placeholderTimers = [];
}

function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    placeholderTimers.push(id);
}

function startPlaceholderExampleLoop() {
    let idx = Math.floor(Math.random() * (placeholderExamples.length + 1));

    const runOne = () => {
        if (!placeholderLoopRunning) {
            return;
        }

        const text = placeholderExamples[idx % placeholderExamples.length]!;
        idx++;

        const cycleStart = performance.now();

        placeholder.value = "";
        let i = 0;

        const typeNext = () => {
            if (!placeholderLoopRunning) {
                return;
            }

            if (i < text.length) {
                placeholder.value += text[i++];
                schedule(typeNext, 45);
            } else {
                // finished typing; wait the remaining time
                const elapsed = performance.now() - cycleStart;
                const remaining = Math.max(0, 5000 - elapsed); // 5s
                schedule(runOne, remaining);
            }
        };

        schedule(typeNext, 250);
    };

    runOne();
}

onMounted(() => startPlaceholderExampleLoop());
onBeforeUnmount(() => {
    stopPlaceholderExampleLoop();
});
</script>

<template>
    <div class="flex flex-col space-y-2 h-full">
        <div class="flex space-x-2">
            <div class="relative w-full">
                <input
                    type="text"
                    name="filter"
                    autocomplete="off"
                    v-model="search"
                    @input="startSearching"
                    @keydown="onSearchKeydown"
                    class="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full rounded-md p-2 pr-24 text-sm focus:ring-orange-600 focus:border-orange-600"
                    :placeholder="placeholder"
                />

                <div class="absolute inset-y-0 right-2 flex items-center space-x-1 select-none" v-if="search !== ''">
                    <span class="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                        {{ matches.length > 0 ? `${matchIndex! + 1} / ${matches.length}` : "0 / 0" }}
                    </span>

                    <button
                        type="button"
                        class="py-1 px-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-40 cursor-pointer"
                        :disabled="matches.length === 0"
                        @click="prevMatch"
                        title="Previous (Arrow Up)"
                    ><i class="fa-solid fa-angle-up fa-sm"></i></button>

                    <button
                        type="button"
                        class="py-1 px-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-40 cursor-pointer"
                        :disabled="matches.length === 0"
                        @click="nextMatch"
                        title="Next (Arrow Down)"
                    ><i class="fa-solid fa-angle-down fa-sm"></i></button>
                </div>
            </div>
        </div>

        <div
            ref="element"
            style="overflow-anchor: none;"
            class="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm rounded-md min-w-0 min-h-0 overflow-auto grow-1"
        ></div>
    </div>
</template>