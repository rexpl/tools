<script setup lang="ts">
import {fitsIn, IntSize, toBigInt, sizeLabels} from "~~/src/int";
import {watch, onMounted} from "vue";

const input = ref<string>('');

const validNumber = ref(true);
const bitSize = ref(0);
const valueFits = ref<Record<IntSize, boolean>>();

function normalizeIntegerString(raw: string): string {
    return raw.trim().replace(/(?<=\d)[\s\u00A0\u2009\u202F,.'’_]+(?=\d)/g, "");
}

watch(input, (value: string) => {
    if (value === '') {
        validNumber.value = true;
        bitSize.value = 0;
        return;
    }
    const big = toBigInt(
        normalizeIntegerString(value)
    );
    if (big === null) {
        validNumber.value = false;
        bitSize.value = 0;
        return;
    }
    validNumber.value = true;
    const result = fitsIn(big);
    bitSize.value = result.bitsNeeded;
    valueFits.value = result.fits;
});

const blocksOrder: IntSize[] = [
    IntSize.Int8, IntSize.Int16, IntSize.Int32, IntSize.Int64, IntSize.Int128,
    IntSize.UInt8, IntSize.UInt16, IntSize.UInt32, IntSize.UInt64, IntSize.UInt128,
];

const numberInput = ref<HTMLInputElement>();
onMounted(() => {
    numberInput.value?.focus();
});
</script>

<template>
    <div class="flex space-x-4 mb-6">
        <div class="grow-1">
            <input
                type="text"
                name="input"
                autocomplete="off"
                ref="numberInput"
                v-model="input"
                :class="validNumber ? 'border-gray-200 dark:border-gray-800 focus:ring-orange-600 focus:border-orange-600' : 'border-red-600 focus:ring-red-600'"
                class="w-full max-w-xl px-3 py-2.5 bg-gray-100 dark:bg-gray-900 border text-heading text-sm rounded-md shadow-xs"
                placeholder="Enter value here"
                data-testid="int-size-input"
            >
            <p v-if="!validNumber" class="mt-1.5 text-sm text-red-600" data-testid="int-size-input-invalid-label">Please enter a valid integer.</p>
            <p v-if="bitSize > 0" class="mt-1.5 text-sm" data-testid="int-size-input-valid-label">
                The entered value requires at least <span class="text-bold text-black dark:text-white"><span data-testid="int-size-input-size">{{ bitSize }}</span> bits</span>.
            </p>
            <p v-if="bitSize === 0 && validNumber" class="mt-1.5 text-sm" data-testid="int-size-input-label">Commas, dots and white spaces will be stripped for inspection.</p>
        </div>
    </div>

    <div class="grid grid-cols-5 gap-4 w-fit">
        <div
            v-for="intSize in blocksOrder"
            class="flex flex-col space-y-2 items-center w-40 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-xs p-4">
            <svg v-if="bitSize > 0 && valueFits![intSize]" class="w-10 h-10 p-1 text-green-600 bg-green-200 rounded-full" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/>
            </svg>
            <svg v-if="bitSize > 0 && !valueFits![intSize]" class="w-10 h-10 p-1 text-red-600 bg-red-200 rounded-full" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
            </svg>
            <svg v-if="bitSize === 0" class="w-10 h-10 p-1 text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-full" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.529 9.988a2.502 2.502 0 1 1 5 .191A2.441 2.441 0 0 1 12 12.582V14m0 4h.01"/>
            </svg>

            <span>{{ sizeLabels[intSize] }}</span>
        </div>
    </div>
</template>