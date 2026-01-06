import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { testId } from "~~/tests/nuxt/_helpers";
import JsonPage from "~/pages/json.vue";
import JsonViewer from "~/components/json/json-viewer.vue";

describe("json page", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    async function mountComponent() {
        const wrapper = mount(JsonPage);
        await wrapper.vm.$nextTick(); // let ClientOnly mount
        return wrapper;
    }

    it('starts in empty state', async () => {
        const wrapper = await mountComponent();
        expect(wrapper.find(testId('json-empty-state')).exists()).toBe(true);
    });

    it('shows viewer when valid JSON is entered', async () => {
        const wrapper = await mountComponent();

        const input = wrapper.get(testId('json-encoded-input'));
        await input.setValue('{"a":1}');
        await input.trigger('input');

        vi.runOnlyPendingTimers(); // input is debounced
        await wrapper.vm.$nextTick();

        expect(wrapper.find(testId('json-viewer')).exists()).toBe(true);
        expect(wrapper.find(testId('json-invalid-state')).exists()).toBe(false);
    });

    it('hides textarea and shows large input state when pasting huge JSON', async () => {
        const wrapper = await mountComponent();

        const huge = 'x'.repeat(100_001); // just above limit, quite sensible
        const textarea = wrapper.get(testId('json-encoded-input'));

        await textarea.trigger("paste", {
            clipboardData: { getData: () => huge },
            preventDefault: vi.fn(),
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.find(testId('json-large-input-state')).exists()).toBe(true);
    });
});

const initMock = vi.fn();
const destroyMock = vi.fn();
const searchMock = vi.fn();

vi.mock("~~/src/json/jsonData", () => {
    return {
        JsonData: class {
            static makeSafe(raw: string) {
                if (raw === "INVALID") return null;
                return new (this as any)();
            }
            init = initMock;
            destroy = destroyMock;
            search = searchMock;
        },
    };
});

describe("JsonViewer component", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        initMock.mockClear();
        destroyMock.mockClear();
        searchMock.mockClear();
    });

    it('emits invalid=true when JSON is invalid', async () => {
        const wrapper = mount(JsonViewer, { props: { json: 'INVALID' } });
        await wrapper.vm.$nextTick();

        const ev = wrapper.emitted('invalid');
        expect(ev).toBeTruthy();
        expect(ev![0]![0]).toBe(true);
    });

    it('emits invalid=false and initializes viewer when JSON is valid', async () => {
        const wrapper = mount(JsonViewer, { props: { json: '{"a":1}' } });
        await wrapper.vm.$nextTick();

        const ev = wrapper.emitted('invalid');
        expect(ev).toBeTruthy();
        expect(ev![0]![0]).toBe(false);

        await wrapper.vm.$nextTick();
        expect(initMock).toHaveBeenCalled();
    });

    it("debounces search and calls data.search", async () => {
        searchMock.mockReturnValue([]);

        const wrapper = mount(JsonViewer, { props: { json: '{"a":"needle"}' } });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        await wrapper.get(testId('json-viewer-search-input')).setValue('needle');

        expect(searchMock).not.toHaveBeenCalled();
        vi.runOnlyPendingTimers();
        expect(searchMock).toHaveBeenCalled();
    });
});