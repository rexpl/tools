import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {mount} from "@vue/test-utils";
import {nextTick} from "vue";
import DefaultLayout from "~/layouts/default.vue";

// --- matchMedia stub helper (supports addEventListener("change")) made by chat gpt, no clue what it does :)
function createMatchMedia(initialMatches: boolean) {
    let matches = initialMatches;
    const listeners = new Set<(e: MediaQueryListEvent) => void>();

    return {
        get matches() {
            return matches;
        },
        media: "(prefers-color-scheme: dark)",
        addEventListener: vi.fn((event: string, cb: any) => {
            if (event === "change") listeners.add(cb);
        }),
        removeEventListener: vi.fn((event: string, cb: any) => {
            if (event === "change") listeners.delete(cb);
        }),
        // for older APIs if you ever use them:
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatch(next: boolean) {
            matches = next;
            const evt = {matches: next} as MediaQueryListEvent;
            listeners.forEach((cb) => cb(evt));
        },
    };
}

describe("Default layout dark mode", () => {
    let mql: ReturnType<typeof createMatchMedia>;

    beforeEach(() => {
        // clean slate for each test
        document.documentElement.className = "";
        localStorage.clear();

        // default OS preference: light
        mql = createMatchMedia(false);
        vi.stubGlobal("matchMedia", vi.fn(() => mql));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    function mountLayout() {
        return mount(DefaultLayout, {
            global: {
                stubs: {
                    MenuItem: { template: "<div><slot /></div>", props: ["title", "url"] },
                },
            },
            slots: {
                default: "<div>page</div>",
            },
        });
    }

    it('applies saved "dark" theme on mount', async () => {
        localStorage.setItem('theme', 'dark');

        mountLayout();
        await nextTick();

        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it("uses prefers-color-scheme when no saved theme exists", async () => {
        // OS is light by default in beforeEach
        mountLayout();
        await nextTick();

        expect(document.documentElement.classList.contains('dark')).toBe(false);

        // now simulate OS = dark (and no saved theme)
        document.documentElement.className = "";
        localStorage.clear();
        mql = createMatchMedia(true);
        (globalThis.matchMedia as any).mockImplementation(() => mql);

        mountLayout();
        await nextTick();

        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it("reacts to OS theme changes only when user hasn't chosen a theme", async () => {
        mountLayout();
        await nextTick();

        expect(document.documentElement.classList.contains('dark')).toBe(false);

        // OS switches to dark
        mql.dispatch(true);
        await nextTick();

        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('ignores OS theme changes when user has a saved theme', async () => {
        localStorage.setItem('theme', 'light');

        mountLayout();
        await nextTick();

        expect(document.documentElement.classList.contains('dark')).toBe(false);

        // OS tries to switch to dark, but saved theme exists => ignore
        mql.dispatch(true);
        await nextTick();

        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('toggle writes localStorage and updates the dark class', async () => {
        const wrapper = mountLayout();
        await nextTick();

        const checkbox = wrapper.get('#theme-selector');

        // turn ON dark mode (Vue updates v-model then calls @change)
        await checkbox.setValue(true);
        await nextTick();

        // NOTE: your code currently stores 'dark' when dark.value is true,
        // but your toggleDarkMode logic uses: dark.value ? 'dark' : 'light'
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        // turn OFF dark mode
        await checkbox.setValue(false);
        await nextTick();

        expect(localStorage.getItem('theme')).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});