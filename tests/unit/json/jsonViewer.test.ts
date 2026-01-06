import { describe, it, expect } from "vitest";
import { JsonData } from "../../../src/json/jsonData";

function makeViewer(json: any) {
    const root = document.createElement("div");
    root.style.height = `300px`;
    root.style.overflow = "auto";
    document.body.appendChild(root);

    const jd = new JsonData(json);
    jd.init(root);

    return { root, jd };
}

function clickOpenButton(nodeEl: Element) {
    const btn = nodeEl.querySelector("button") as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    btn!.click();
}

function getTopLevelOpenable(root: Element): Element {
    const top =
        root.querySelector('[data-json-node="object-node"]') ??
        root.querySelector('[data-json-node="lazy-object-node"]');
    expect(top).not.toBeNull();
    return top!;
}

function clickFirstOpenable(root: Element) {
    return clickOpenButton(
        getTopLevelOpenable(root)
    );
}

describe('json viewer search', () => {
    it('adds data-json-search=match on matches and removes it when clearing', () => {
        const { root, jd } = makeViewer({ a: 'hello', b: 'world' });

        jd.search('hello');
        expect(
            root.querySelectorAll('[data-json-node="value-node"][data-json-search="match"]').length,
        ).toBe(1);

        jd.search(''); // clear
        expect(root.querySelectorAll('[data-json-search="match"]').length).toBe(0);
    });

    it('supports strict and non-strict value search', () => {
        const { root, jd } = makeViewer({ a: 'Hello', b: 'world' });

        jd.search('hello'); // non-strict -> lowercase match
        expect(root.querySelectorAll('[data-json-search="match"]').length).toBe(1);

        jd.search('=hello'); // strict -> should NOT match "Hello"
        expect(root.querySelectorAll('[data-json-search="match"]').length).toBe(0);

        jd.search('=Hello'); // strict -> match
        expect(root.querySelectorAll('[data-json-search="match"]').length).toBe(1);
    });

    it('value search (non-path) opens ancestors so the match becomes renderable', () => {
        const { root, jd } = makeViewer({ a: { b: { c: 'needle' } } });

        jd.search('needle');

        const match = root.querySelector(
            '[data-json-node="value-node"][data-json-search="match"]',
        );
        expect(match).not.toBeNull();
        expect(match!.textContent).toContain('needle');
    });
});

describe('json viewer path search', () => {
    it('supports \'*\' matching a single path segment', () => {
        const { root, jd } = makeViewer({
            a: { b: { c: 'needle' } },
            x: { y: { c: 'nope' } },
        });

        // * matches "b" here, so only a.b.c should match
        jd.search('a.*.c=needle');

        const matches = root.querySelectorAll(
            '[data-json-node="value-node"][data-json-search="match"]',
        );
        expect(matches.length).toBe(1);
        expect(matches[0]!.textContent).toContain("needle");
    });

    it('supports \'*\' at the root level segment', () => {
        const { root, jd } = makeViewer({
            a: { b: { c: 'needle' } },
            x: { b: { c: 'needle' } },
        });

        jd.search('*.b.c=needle');

        const matches = root.querySelectorAll(
            '[data-json-node="value-node"][data-json-search="match"]',
        );
        expect(matches.length).toBe(2);
    });

    it('does not match if the path is longer than the actual leaf path', () => {
        const { root, jd } = makeViewer({ a: { b: { c: 'needle' } } });

        jd.search('a.b.c.d=needle');

        const matches = root.querySelectorAll('[data-json-search="match"]');
        expect(matches.length).toBe(0);
    });

    it('path search supports strict matching with ==', () => {
        const { root, jd } = makeViewer({ a: { b: { c: 'Needle' } } });

        jd.search('a.b.c==needle'); // strict: should NOT match "Needle"
        expect(root.querySelectorAll('[data-json-search="match"]').length).toBe(0);

        jd.search('a.b.c==Needle'); // strict: should match
        expect(root.querySelectorAll('[data-json-search="match"]').length).toBe(1);
    });
});

describe('json viewer open/close behavior during search', () => {
    it('path search opens ancestors so the match becomes renderable', () => {
        const { root, jd } = makeViewer({ a: { b: { c: 'needle' } } });

        jd.search('a.b.c=needle');

        const match = root.querySelector(
            '[data-json-node="value-node"][data-json-search="match"]',
        );
        expect(match).not.toBeNull();
        expect(match!.textContent).toContain('needle');
    });

    it('keeps user-opened nodes open after search is cleared', () => {
        const { root, jd } = makeViewer({ a: { b: { c: 'needle' } }, z: 1 });

        // user click
        clickFirstOpenable(root);

        // trigger search which should open a, b and c
        jd.search('a.b.c=needle');
        expect(root.querySelectorAll('[data-json-search="match"]').length).toBe(1);

        // clear search
        jd.search('');

        // we assert z is still rendered
        expect(root.querySelectorAll('[data-json-node="value-node"][data-json-value-type="number"]').length).toBeGreaterThan(0);
    });

    it('closes nodes that were only opened by search once search is cleared', () => {
        const { root, jd } = makeViewer({ a: { b: { c: 'needle' } }, other: { k: 1 } });

        // no user clicks, but search should open some nodes
        jd.search('a.b.c=needle');
        expect(root.querySelectorAll('[data-json-search="match"]').length).toBe(1);

        // clear search, search opened nodes should close and their children should be removed from the dom
        jd.search('');

        expect(root.querySelectorAll('[data-json-search="match"]').length).toBe(0);

        // we expect that "needle" is no longer present in the dom because the branch should collapse
        expect(root.textContent).not.toContain('needle');
    });
});

// some nodes uses requestAnimationFrame on scroll, so we need to await a frame
function flushRaf(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe('json viewer virtualization (root)', () => {
    it('renders a root-node container', () => {
        const { root } = makeViewer([1, 2, 3]);
        expect(root.querySelector('[data-json-node="root-node"]')).not.toBeNull();
    });

    it('mounts only a window of value-nodes for a huge top-level array', () => {
        const big = Array.from({ length: 10000 }, (_, i) => `v${i}`);
        const { root } = makeViewer(big);

        // value nodes mounted anywhere in the viewer.
        const mounted = root.querySelectorAll('[data-json-node="value-node"]').length;

        // Should be far below 10k due to root virtualization.
        expect(mounted).toBeGreaterThan(0);
        expect(mounted).toBeLessThan(2000);
    });

    it('scrolling changes which root value-nodes are mounted', async () => {
        const big = Array.from({ length: 10000 }, (_, i) => `v${i}`);
        const { root } = makeViewer(big);

        const firstBefore = root.querySelector('[data-json-node="value-node"]')?.textContent ?? "";

        root.scrollTop = 12000;
        root.dispatchEvent(new Event('scroll'));
        await flushRaf();

        const firstAfter = root.querySelector('[data-json-node="value-node"]')?.textContent ?? "";

        expect(firstAfter).not.toBe(firstBefore);
    });

    it('unmounts offscreen nodes (dom stays bounded after repeated scrolls)', async () => {
        const big = Array.from({ length: 20000 }, (_, i) => `v${i}`);
        const { root } = makeViewer(big);

        const countAt = async (scrollTop: number) => {
            root.scrollTop = scrollTop;
            root.dispatchEvent(new Event('scroll'));
            await flushRaf();
            return root.querySelectorAll('[data-json-node="value-node"]').length;
        };

        const c1 = await countAt(0);
        const c2 = await countAt(15000);
        const c3 = await countAt(30000);
        const c4 = await countAt(0);

        expect(Math.min(c1, c2, c3, c4)).toBeGreaterThan(0);
        expect(Math.max(c1, c2, c3, c4)).toBeLessThan(3000);
    });
});

describe('json viewer virtualization (child nodes)', () => {
    it('uses object-node (non-lazy) for small arrays', async () => {
        const smallArr = Array.from({ length: 20 }, (_, i) => `s${i}`);
        const { root } = makeViewer({ array: smallArr });

        const arrNode = root.querySelector(
            '[data-json-node="object-node"][data-json-object-type="array"]',
        ) as HTMLElement | null;

        expect(arrNode).not.toBeNull();

        // Open the array
        const btn = arrNode!.querySelector("button") as HTMLButtonElement;
        btn.click();
        await flushRaf();

        const values = arrNode!.querySelectorAll('[data-json-node="value-node"]');
        expect(values.length).toBe(20);
    });

    it('uses lazy-object-node for large arrays', async () => {
        const bigArr = Array.from({ length: 2000 }, (_, i) => `b${i}`);
        const { root } = makeViewer({ array: bigArr });

        const lazyArrNode = root.querySelector(
            '[data-json-node="lazy-object-node"][data-json-object-type="array"]',
        ) as HTMLElement | null;

        expect(lazyArrNode).not.toBeNull();

        // Open the array
        const btn = lazyArrNode!.querySelector("button") as HTMLButtonElement;
        btn.click();
        await flushRaf();

        const values = lazyArrNode!.querySelectorAll('[data-json-node="value-node"]');
        expect(values.length).toBeGreaterThan(0);
        expect(values.length).toBeLessThan(2000);
    });

    it('lazy-object-node changes mounted children after scroll', async () => {
        const bigArr = Array.from({ length: 3000 }, (_, i) => `b${i}`);
        const { root } = makeViewer({ array: bigArr });

        const lazyArrNode = root.querySelector(
            '[data-json-node="lazy-object-node"][data-json-object-type="array"]',
        ) as HTMLElement;

        expect(lazyArrNode).not.toBeNull();

        // Open the array
        lazyArrNode!.querySelector("button")!.click();
        await flushRaf();

        const firstBefore =
            lazyArrNode!.querySelector('[data-json-node="value-node"]')?.textContent ?? "";

        root.scrollTop = 12000;
        root.dispatchEvent(new Event('scroll'));
        await flushRaf();

        const firstAfter =
            lazyArrNode!.querySelector('[data-json-node="value-node"]')?.textContent ?? "";

        expect(firstAfter).not.toBe(firstBefore);
    });
});