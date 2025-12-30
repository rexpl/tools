import {describe, expect, it, vi, beforeEach} from "vitest";
import {mount} from "@vue/test-utils";
import {testId} from "~~/tests/nuxt/_helpers";
import Base64 from "~/pages/base64.vue";

const errorToastMock = vi.fn();
vi.mock("~~/src/toasts", () => ({
    error: (...args: any[]) => errorToastMock(...args),
}));

describe('base64 page', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        errorToastMock.mockClear();
    });

    async function mountComponent() {
        const wrapper = mount(Base64);
        await wrapper.vm.$nextTick(); // let client only mount
        return wrapper;
    }

    it('should handle valid encoded input correctly', async () => {
        const wrapper = await mountComponent();

        await wrapper.get(testId('base64-encoded-input')).setValue('SGVsbG8gd29ybGQ=');

        expect(wrapper.find(testId('base64-encoded-input')).attributes()['aria-invalid']).toBe('false');
        expect(
            (wrapper.find(testId('base64-decoded-input')).element as HTMLTextAreaElement).value
        ).toBe('Hello world');

        expect(errorToastMock).not.toHaveBeenCalled();
    });

    it('should handle valid decoded input correctly', async () => {
        const wrapper = await mountComponent();

        await wrapper.get(testId('base64-decoded-input')).setValue('Hello world');

        expect(wrapper.find(testId('base64-decoded-input')).attributes()['aria-invalid']).toBe('false');
        expect(
            (wrapper.find(testId('base64-encoded-input')).element as HTMLTextAreaElement).value
        ).toBe('SGVsbG8gd29ybGQ=');

        expect(errorToastMock).not.toHaveBeenCalled();
    });

    it('should handle invalid encoded input correctly', async () => {
        const wrapper = await mountComponent();

        await wrapper.get(testId('base64-encoded-input')).setValue('SGVsbG8g29ybGQ=');
        expect(wrapper.find(testId('base64-encoded-input')).attributes()['aria-invalid']).toBe('true');

        expect(errorToastMock).not.toHaveBeenCalled();
        vi.runOnlyPendingTimers();
        expect(errorToastMock).toHaveBeenCalled();
    });

    it('should handle invalid decoded input correctly', async () => {
        const wrapper = await mountComponent();

        await wrapper.get(testId('base64-decoded-input')).setValue('😀');
        expect(wrapper.find(testId('base64-decoded-input')).attributes()['aria-invalid']).toBe('true');

        expect(errorToastMock).not.toHaveBeenCalled();
        vi.runOnlyPendingTimers();
        expect(errorToastMock).toHaveBeenCalled();
    });

    it('should cancel error toast if input is corrected', async () => {
        const wrapper = await mountComponent();

        await wrapper.get(testId('base64-encoded-input')).setValue('SGVsbG8g29ybGQ=');
        expect(errorToastMock).not.toHaveBeenCalled();

        await wrapper.get(testId('base64-encoded-input')).setValue('SGVsbG8gd29ybGQ=');

        vi.runOnlyPendingTimers();
        expect(errorToastMock).not.toHaveBeenCalled();
    });
});