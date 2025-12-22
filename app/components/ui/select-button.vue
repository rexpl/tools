<script setup lang="ts">
type Option = {
    label: string;
    value: string | number;
};

const props = defineProps<{
    modelValue: Option["value"];
    options: Option[];
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: Option["value"]): void;
}>();

function select(value: Option["value"]) {
    emit("update:modelValue", value);
}

function isSelected(value: Option["value"]) {
    return props.modelValue === value;
}
</script>

<template>
    <div
        class="inline-flex overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900 p-1 shadow-sm space-x-0.5"
        role="group"
    >
        <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="relative px-2 text-sm rounded-sm font-medium transition cursor-pointer
             focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600/60
             focus-visible:ring-offset-2
             focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950"
            :class="[
                !isSelected(option.value) && 'text-gray-600 dark:text-gray-100 hover:text-gray-500 dark:hover:bg-gray-900/60',
                isSelected(option.value) && 'bg-orange-600 text-white shadow-sm'
            ]"
            :aria-pressed="isSelected(option.value)"
            @click="select(option.value)"
        >
            <span
                v-if="isSelected(option.value)"
                class="pointer-events-none absolute inset-0 bg-gray-100 dark:bg-gray-900 opacity-10"
            />
            <span class="relative z-10">{{ option.label }}</span>
        </button>
    </div>
</template>