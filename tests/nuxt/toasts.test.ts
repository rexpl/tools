import {beforeEach, describe, it, expect, afterEach, vi} from "vitest";
import {mount} from "@vue/test-utils";
import * as toastMod from "~~/src/toasts";
import Toaster from "~/components/toaster.vue";
import {testId} from "./_helpers";

describe('toasts', () => {
    function mountComponent() {
        return mount(Toaster, {
            global: {
                stubs: {
                    TransitionGroup: {
                        template: `<div><slot /></div>`,
                    },
                },
            },
        });
    }

    beforeEach(() => {
        vi.useFakeTimers();
        toastMod.toasts.value = [];

        // In some test envs crypto may not exist; ensure it's available + controllable
        if (!globalThis.crypto) {
            vi.stubGlobal("crypto", { randomUUID: vi.fn() });
        }
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        toastMod.toasts.value = [];
    });

    it('renders nothing when there are no toasts', () => {
        const wrapper = mountComponent();
        expect(wrapper.findAll(`[data-testid^="toast-"]`)).toHaveLength(0);
    });

    it('renders a success toast', async () => {
        toastMod.toasts.value = [
            { id: 's1', message: 'Saved!', type: 'success', timeoutId: 123 },
        ];

        const wrapper = mountComponent();
        await wrapper.vm.$nextTick();

        const toast = wrapper.get(testId('toast-s1'));
        expect(toast.attributes('data-test-toast-type')).toBe('success');
        expect(toast.text()).toContain('Saved!');
    });

    it('renders an error toast', async () => {
        toastMod.toasts.value = [
            { id: 'e1', message: 'Nope.', type: 'error', timeoutId: 456 },
        ];

        const wrapper = mountComponent();
        await wrapper.vm.$nextTick();

        const toast = wrapper.get(`[data-testid="toast-e1"]`);
        expect(toast.attributes('data-test-toast-type')).toBe('error');
        expect(toast.text()).toContain('Nope.');
    });

    it('dismiss button calls dismissToast, removes the toast, and clears the timeout', async () => {
        toastMod.toasts.value = [
            { id: 'a', message: 'A', type: 'success', timeoutId: 111 },
            { id: 'b', message: 'B', type: 'error', timeoutId: 222 },
        ];

        const dismissSpy = vi.spyOn(toastMod, 'dismissToast');
        const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

        const wrapper = mountComponent();
        await wrapper.vm.$nextTick();

        expect(wrapper.find(testId('toast-a')).exists()).toBe(true);

        const toastA = wrapper.get(testId('toast-a'));
        await toastA.get('button').trigger('click');
        await wrapper.vm.$nextTick();

        expect(dismissSpy).toHaveBeenCalledTimes(1);
        expect(dismissSpy).toHaveBeenCalledWith("a");

        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
        expect(clearTimeoutSpy).toHaveBeenCalledWith(111);

        expect(wrapper.find(testId('toast-a')).exists()).toBe(false);
        expect(wrapper.find(testId('toast-b')).exists()).toBe(true);
    });

    it('auto-dismisses after X ms when using success()', async () => {
        const randomUUID = vi.spyOn(globalThis.crypto, 'randomUUID' as any)
            ?? vi.spyOn((globalThis as any).crypto, 'randomUUID');

        randomUUID.mockReturnValueOnce('auto1');

        toastMod.success('Hello');
        const wrapper = mountComponent();
        await wrapper.vm.$nextTick();

        expect(wrapper.find(testId('toast-auto1')).exists()).toBe(true);

        vi.runOnlyPendingTimers();
        await wrapper.vm.$nextTick();

        expect(wrapper.find(testId('toast-auto1')).exists()).toBe(false);
    });
});