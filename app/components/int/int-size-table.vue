<script setup lang="ts">
import {formatBigInt, integerSizes, IntSize, sizeLabels} from "~~/src/int";
import {onMounted, watch} from "vue";
import SelectButton from "~/components/ui/select-button.vue";
import Table from "~/components/ui/table.vue";
import TableRow from "~/components/ui/table-row.vue";
import TableCell from "~/components/ui/table-cell.vue";

const tableSizeOrder: IntSize[] = [
    IntSize.Int8, IntSize.UInt8,
    IntSize.Int16, IntSize.UInt16,
    IntSize.Int32, IntSize.UInt32,
    IntSize.Int64, IntSize.UInt64,
    IntSize.Int128, IntSize.UInt128,
];

type SizeRow = { size: IntSize; label: string; min: string; max: string };
function formatAllSizes(localeAware: boolean): SizeRow[] {
    const format = (value: bigint) => localeAware ? formatBigInt(value) : value.toString();
    return tableSizeOrder.map((size) => {
        const [min, max] = integerSizes[size];
        return { size, label: sizeLabels[size], min: format(min), max:  format(max) };
    });
}

const rows = ref<SizeRow[]>(formatAllSizes(false));

const localeAware = ref("locale");
const localeAwareOptions = [
    { label: "Locale Aware", value: "locale" },
    { label: "Raw Number", value: "raw" },
];

onMounted(() => {
    rows.value = formatAllSizes(true);
});
watch(localeAware, (value: string) => {
    rows.value = formatAllSizes(value !== 'raw');
});
</script>

<template>
    <div class="flex space-x-4 items-center mb-2">
        <h2 class="text-3xl font-bold text-black dark:text-white">Integer Min/Max Values</h2>
        <SelectButton v-model="localeAware" :options="localeAwareOptions" />
    </div>
    <div class="w-[1050px]">
        <Table :headers="['Type', 'Min', 'Max']" >
            <TableRow v-for="r in rows" :key="r.label">
                <TableCell :first="true">{{ r.label }}</TableCell>
                <TableCell>
                    <CopyValueOnclick :value="r.min">{{ r.min }}</CopyValueOnclick>
                </TableCell>
                <TableCell>
                    <CopyValueOnclick :value="r.max">{{ r.max }}</CopyValueOnclick>
                </TableCell>
            </TableRow>
        </Table>
    </div>
</template>