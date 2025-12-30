import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import IntSizeChecker from "~/components/int/int-size-checker.vue";
import IntSizeTable from "~/components/int/int-size-table.vue";
import {formatBigInt, integerSizes, IntSize, sizeLabels} from "~~/src/int";
import {testId} from "~~/tests/nuxt/_helpers";

describe('int size page', () => {
    describe('int size checker', () => {
        it('invalid label appears with invalid input', async () => {
            const wrapper = mount(IntSizeChecker);

            expect(wrapper.find('[data-testid="int-size-input-invalid-label"]').exists()).toBe(false);

            await wrapper.get('[data-testid="int-size-input"]').setValue('invalid number');
            await wrapper.vm.$nextTick();

            expect(wrapper.find('[data-testid="int-size-input-invalid-label"]').exists()).toBe(true);
        });

        it('input label disappears with valid input', async () => {
            const wrapper = mount(IntSizeChecker);

            expect(wrapper.find('[data-testid="int-size-input-label"]').exists()).toBe(true);

            await wrapper.get('[data-testid="int-size-input"]').setValue('42');
            await wrapper.vm.$nextTick();

            expect(wrapper.find('[data-testid="int-size-input-label"]').exists()).toBe(false);
        });

        it('valid label appears with valid input', async () => {
            const wrapper = mount(IntSizeChecker);

            expect(wrapper.find('[data-testid="int-size-input-valid-label"]').exists()).toBe(false);

            await wrapper.get('[data-testid="int-size-input"]').setValue('42');
            await wrapper.vm.$nextTick();

            expect(wrapper.find('[data-testid="int-size-input-valid-label"]').exists()).toBe(true);
        });

        it('bit count is correct', async () => {
            const wrapper = mount(IntSizeChecker);

            await wrapper.get('[data-testid="int-size-input"]').setValue('32767');
            await wrapper.vm.$nextTick();

            expect(wrapper.get('[data-testid="int-size-input-size"]').text()).toBe('15');
        });
    });

    describe('integer size table', () => {
        const size = IntSize.Int32; // tests will run on this size

        it('renders the size table correctly', async () => {
            const wrapper = mount(IntSizeTable);

            expect(wrapper.find(testId(`int-size-table-cell-label-${size}`)).text()).toBe(sizeLabels[size]);
            expect(wrapper.find(testId(`int-size-table-cell-min-${size}`)).exists()).toBe(true);
            expect(wrapper.find(testId(`int-size-table-cell-max-${size}`)).exists()).toBe(true);
        });

        it('defaults to the user locale formatting', async () => {
            const wrapper = mount(IntSizeTable);

            expect(wrapper.find(testId('int-size-table-format-locale')).attributes()['aria-pressed']).toBe('true');
        });

        it('it renders user locale properly', async () => {
            const wrapper = mount(IntSizeTable);

            await wrapper.find(testId('int-size-table-format-locale')).trigger('click');

            const [min, max] = integerSizes[size];

            expect(wrapper.find(testId(`int-size-table-cell-min-${size}`)).text()).toBe(formatBigInt(min));
            expect(wrapper.find(testId(`int-size-table-cell-max-${size}`)).text()).toBe(formatBigInt(max));
        });

        it('it renders raw integers without locale information', async () => {
            const wrapper = mount(IntSizeTable);

            await wrapper.find(testId('int-size-table-format-raw')).trigger('click');

            const [min, max] = integerSizes[size];

            expect(wrapper.find(testId(`int-size-table-cell-min-${size}`)).text()).toBe(min.toString());
            expect(wrapper.find(testId(`int-size-table-cell-max-${size}`)).text()).toBe(max.toString());
        });
    });
});