<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { vTooltip } from "floating-vue";

type Props = {
    localStorage: string | null;
    initialRatio?: number;
    minPx?: number;
};

const props = withDefaults(defineProps<Props>(), {
    localStorage: null,
    initialRatio: 0.5,
    minPx: 80,
});

const savedRawSettings = props.localStorage !== null && typeof localStorage !== "undefined"
    ? localStorage.getItem(props.localStorage)
    : null;

let savedSettings: { horizontal: boolean; ratio: number; } | null = null;
if (savedRawSettings !== null) {
    savedSettings = JSON.parse(savedRawSettings);
}

const rootEl = ref<HTMLElement | null>(null);
const dragging = ref(false);
const ratio = ref(clamp(savedSettings?.ratio ?? props.initialRatio, 0, 1));

function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v));
}

function getRect() {
    const el = rootEl.value;
    if (!el) return null;
    return el.getBoundingClientRect();
}

let pointerId: number | null = null;
let dragHandleEl: HTMLElement | null = null;

let dragPending: boolean = false;

let downX = 0;
let downY = 0;
const DRAG_THRESHOLD_PX = 4;

let clientX: number = 0;
let clientY: number = 0;
let dragStartRatio: number = 0;
let totalDragAxisPixels: number = 0;

function onPointerDown(e: PointerEvent) {
    // Only left click / primary pointer (optional, but avoids weird right-click drags).
    if (e.button !== 0) {
        return;
    }

    const rect = getRect();
    if (!rect) {
        return;
    }

    // Capture the pointer on the handle so moves keep flowing to us.
    pointerId = e.pointerId;
    dragHandleEl = e.currentTarget as HTMLElement;

    // Mark dragging active (shows overlay in template).
    dragPending = true;
    downX = e.clientX;
    downY = e.clientY;

    // Cache drag start info.
    clientX = e.clientX;
    clientY = e.clientY;
    dragStartRatio = ratio.value;
    totalDragAxisPixels = horizontal.value ? rect.height : rect.width;

    // Set cursor globally for nicer UX and to avoid accidental text selection.
    document.documentElement.style.cursor = horizontal.value ? "row-resize" : "col-resize";

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
}

function onPointerMove(e: PointerEvent) {
    if (dragPending) {
        const dx = Math.abs(e.clientX - downX);
        const dy = Math.abs(e.clientY - downY);
        if (Math.max(dx, dy) < DRAG_THRESHOLD_PX) {
            return;
        }

        dragging.value = true;
        dragPending = false;

        dragHandleEl!.setPointerCapture(pointerId!);
    }

    // Prevent scrolling on touch devices while dragging.
    e.preventDefault();

    const total = totalDragAxisPixels;
    if (total <= 0) {
        return;
    }

    // How far have we moved since the drag started (in the axis that matters)?
    const deltaPx = horizontal.value ? (e.clientY - clientY) : (e.clientX - clientX);
    const deltaRatio = deltaPx / total;
    let nextRatio = dragStartRatio + deltaRatio;

    const min = props.minPx;

    const minRatio = min / total;
    const maxRatio = 1 - min / total;

    nextRatio = clamp(nextRatio, minRatio, maxRatio);
    nextRatio = clamp(nextRatio, 0, 1);

    ratio.value = nextRatio;
    saveSettings();
}


function onPointerUp() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);

    if (!dragging.value) {
        return;
    }

    dragHandleEl!.releasePointerCapture(pointerId!);
    dragHandleEl = null;

    dragging.value = false;
    pointerId = null;

    document.documentElement.style.cursor = "";
}

// Clean up in case component is destroyed mid-drag.
onBeforeUnmount(() => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    document.documentElement.style.cursor = "";
});

const firstStyle = computed(() => ({ flexBasis: `${ratio.value * 100}%`, flexGrow: "0", flexShrink: "0" }));
const secondStyle = computed(() => ({ flexBasis: `${(1 - ratio.value) * 100}%`, flexGrow: "1", flexShrink: "1" }));

const horizontal = ref(savedSettings?.horizontal ?? false);
function changeOrientation(): void {
    horizontal.value = !horizontal.value;
    saveSettings();
}

function saveSettings(): void {
    if (props.localStorage !== null) {
        localStorage.setItem(props.localStorage, JSON.stringify({
            version: 1,
            horizontal: horizontal.value,
            ratio: ratio.value,
        }));
    }
}
</script>

<template>
    <div
        ref="rootEl"
        class="relative w-full h-full overflow-hidden flex"
        :class="[
            horizontal ? 'flex-col' : 'flex-row',
            dragging ? 'select-none' : 'select-text'
        ]"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
    >
        <div class="min-w-0 min-h-0 overflow-auto" :style="firstStyle">
            <div class="w-full h-full p-0.5">
                <slot name="first" />
            </div>
        </div>

        <div
            class="shrink-0 group rounded-full p-2"
            :class="horizontal ? 'h-[18px] cursor-row-resize' : 'w-[18px] cursor-col-resize'"
            @pointerdown="onPointerDown"
            @dblclick="changeOrientation"
            v-tooltip="{
                content: 'Double-click to change split orientation',
                placement: horizontal ? 'bottom' : 'right',
                delay: { show: 500, hide: 0 },
                disabled: dragging,
            }"
        >
            <div class="w-full h-full bg-slate-300 dark:bg-slate-500 group-hover:bg-slate-500 dark:group-hover:bg-slate-300 transition-colors" />
        </div>

        <div
            class="min-w-0 min-h-0 overflow-auto flex-1"
            :style="secondStyle"
        >
            <div class="w-full h-full p-0.5">
                <slot name="second" />
            </div>
        </div>

        <div
            v-if="dragging"
            class="absolute inset-0 z-20"
            :class="horizontal ? 'cursor-row-resize' : 'cursor-col-resize'"
        />
    </div>
</template>