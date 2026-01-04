import type {JsonDataNode, JsonDataParentNode, Key, PositionInfo, SearchResult} from "./nodes";
import {ROW_HEIGHT_PX, LAZY_RENDERING_OVERSCAN_PX} from "./nodes";
import type {Events} from "./events";
import {button, div, idiomatic, span, makeKey, searchMatchesOnThisLevel} from "./utils";
import {FenwickTree} from "./fenwickTree";

export class LazyObjectNode<
    NodeKey extends Key,
    ParentKey extends Key,
> implements JsonDataNode<ParentKey>, JsonDataParentNode<number> {
    private parent: JsonDataParentNode<ParentKey>;
    private keyInParent: ParentKey;

    private readonly keysToIndex = new Map<NodeKey, number>();
    private readonly nodes: JsonDataNode<number>[];

    private isOpenedByUser: boolean = false;
    private isOpen: boolean;

    private baseOfNodeIsRendered: boolean = false;

    private rootElement: HTMLElement;
    private caret: HTMLElement;
    private closingBraceOpen: HTMLElement;
    private closingBraceClose: HTMLElement;

    private nextDepth: number;
    private childRoot: HTMLDivElement;
    private renderNode: HTMLDivElement;
    private renderedStart = 0;
    private renderedEnd = 0;
    private mounted = new Set<number>();

    private heightMaybeChanging: boolean = false;
    private readonly heights: number[];
    private totalHeightPx: number;
    private readonly fenwickTree: FenwickTree;

    constructor(
        nodes: Map<NodeKey, JsonDataNode>,
        private readonly isArray: boolean,
        private readonly key: Key,
    ) {
        this.nodes = new Array(nodes.size);
        this.heights = new Array(nodes.size);

        let i = 0;
        for (const [key, node] of nodes) {
            this.heights[i] = ROW_HEIGHT_PX;
            this.nodes[i] = node;
            this.keysToIndex.set(key, i);

            node.boot(this, i);
            i++;
        }

        this.totalHeightPx = this.heights.length * ROW_HEIGHT_PX;
        this.fenwickTree = new FenwickTree(this.heights);
    }

    boot(parent: JsonDataParentNode<ParentKey>, keyInParent: ParentKey): void {
        this.parent = parent;
        this.keyInParent = keyInParent;
    }

    render(parent: HTMLElement, events: Events, depth: number): void {
        this.baseOfNodeIsRendered = true;
        this.rootElement = div([], parent);

        const collapseButton = button(['flex', 'space-x-1', 'items-center', 'cursor-pointer'], this.rootElement);
        events.onClick(collapseButton, () => {
            if (this.isOpen) {
                this.close(true, true);
            } else {
                this.open(events, true, true);
            }
        });

        this.caret = idiomatic(['fa-solid', 'fa-caret-right', 'w-3!', 'text-gray-400'], collapseButton,);

        makeKey(collapseButton, this.key);
        span([], collapseButton).innerText = this.isArray ? '[' : '{';

        this.nextDepth = depth + 1;
        this.childRoot = div(
            ['ms-4', 'border-l', 'border-gray-200', 'dark:border-gray-700', 'hidden', 'relative'],
            this.rootElement,
        );
        this.childRoot.style.height = `${this.totalHeightPx}px`;


        this.closingBraceOpen = div(['ms-4', 'hidden'], this.rootElement);
        this.closingBraceOpen.innerText = this.isArray ? ']' : '}';

        this.closingBraceClose = span([], collapseButton);
        this.closingBraceClose.innerText = this.isArray ? '... ]' : '... }';

        if (this.isOpenedByUser) {
            this.open(events, false, true);
        }
    }

    destroy(): void {
        this.baseOfNodeIsRendered = false;
        this.rootElement.remove();
    }

    getElement(): HTMLElement {
        return this.rootElement;
    }

    private open(events: Events, fromClick: boolean, render: boolean): void {
        if (render) {
            this.renderNode = div(
                ['absolute', 'left-2', 'right-0', 'top-0', 'will-change-transform'],
                this.childRoot,
            );

            try {
                this.heightMaybeChanging = true;
                this.renderedStart = this.renderedEnd = 0;
                this.performRendering(events);
            } finally {
                this.heightMaybeChanging = false;
            }

            events.notifyOnScrollIfNodeStillAlive(() => {
                if (!this.isOpen) {
                    return false;
                }
                this.performRendering(events);
                return true;
            });

            this.caret.classList.toggle('rotate-90');
            this.childRoot.classList.toggle('hidden');
            this.closingBraceOpen.classList.toggle('hidden');
            this.closingBraceClose.classList.toggle('hidden');
        }

        this.isOpen = true;
        if (fromClick) {
            this.isOpenedByUser = true;
        }

        this.dispatchHeightUpdated();
    }

    private performRendering(events: Events): void {
        const position = this.parent.getMyPositionInfo(this.keyInParent);

        const viewportTop = Math.max(position.rootScrollTop, position.yourStartPosition);
        // might overshoot due to viewport top not 100% of the time being the top but is not a big problem
        const viewportBottom = viewportTop + position.rootViewportHeight;

        // Compute target render band with overscan
        const targetTop = Math.max(0, viewportTop - LAZY_RENDERING_OVERSCAN_PX);
        const targetBottom = Math.min(
            this.totalHeightPx,
            Math.max(viewportBottom + LAZY_RENDERING_OVERSCAN_PX, targetTop + LAZY_RENDERING_OVERSCAN_PX),
        );

        // Map pixels to indices
        let start = this.fenwickTree.lowerBound(targetTop);
        let end = Math.min(this.nodes.length - 1, this.fenwickTree.lowerBound(targetBottom)) + 1;

        start = Math.max(0, Math.min(start, this.nodes.length - 1));
        end = Math.max(start + 1, Math.min(end, this.nodes.length));

        const startOffset = this.fenwickTree.sum(start);
        this.renderNode.style.transform = `translateY(${startOffset}px)`;

        // render range unchanged, do nothing
        if (start === this.renderedStart && end === this.renderedEnd) {
            return;
        }

        let i = 0;
        const wanted = new Array<number>(end - start);
        for (let j = start; j < end; j++) {
            wanted[i++] = j;
        }

        // we remove unwanted nodes
        for (const index of this.mounted) {
            if (index < start || index > end) {
                this.nodes[index]!.destroy();
                this.mounted.delete(index);
            }
        }

        // we create the new needed nodes
        const elements: HTMLElement[] = [];
        for (const index of wanted) {
            const node = this.nodes[index]!;
            if (!this.mounted.has(index)) {
                node.render(this.renderNode, events, this.nextDepth);
                this.mounted.add(index);
            }
            elements.push(node.getElement());
        }

        // we order the nodes, while trying to keep focus on them
        let cursor: ChildNode | null = this.renderNode.firstChild;
        for (const el of elements) {
            if (el === cursor) {
                cursor = cursor.nextSibling;
                continue;
            }
            this.renderNode.insertBefore(el, cursor);
        }

        this.renderedStart = start;
        this.renderedEnd = end;
    }

    private close(fromClick: boolean, render: boolean): void {
        if (render) {
            this.childRoot.innerHTML = '';

            this.caret.classList.toggle('rotate-90');
            this.childRoot.classList.toggle('hidden');
            this.closingBraceOpen.classList.toggle('hidden');
            this.closingBraceClose.classList.toggle('hidden');
        }

        this.isOpen = false;
        if (fromClick) {
            this.isOpenedByUser = false;
        }

        this.dispatchHeightUpdated();
    }

    getMyPositionInfo(key: number): PositionInfo {
        const position = this.parent.getMyPositionInfo(this.keyInParent);
        position.yourStartPosition = position.yourStartPosition + this.fenwickTree.sum(key);
        return position;
    }

    childHeightUpdated(key: number, newHeight: number): void {
        const oldHeight = this.heights[key]!;
        this.totalHeightPx -= oldHeight;
        this.heights[key] = newHeight;
        this.totalHeightPx += newHeight;

        this.fenwickTree.add(key, newHeight - oldHeight);

        if (!this.heightMaybeChanging) {
            this.dispatchHeightUpdated();
        }
    }

    private dispatchHeightUpdated(): void {
        if (this.isOpen) {
            // height of child rows + open/close braces
            this.parent.childHeightUpdated(this.keyInParent, this.totalHeightPx + ROW_HEIGHT_PX * 2);
        } else {
            // single row to show open node button
            this.parent.childHeightUpdated(this.keyInParent, ROW_HEIGHT_PX);
        }
    }

    searchOnPath(
        query: string,
        address: string[],
        lastMatch: number,
        strictMatch: boolean,
        results: SearchResult[],
        events: Events,
    ): boolean {
        if (searchMatchesOnThisLevel(address, lastMatch, this.key)) {
            lastMatch++;
        } else {
            lastMatch = -1;
        }

        let any = false;
        try {
            this.heightMaybeChanging = true;
            for (const node of this.nodes) {
                if (node.searchOnPath(query, address, lastMatch, strictMatch, results, events)) {
                    any = true;
                }
            }
        } finally {
            this.heightMaybeChanging = false;
        }

        return this.exitSearchFromNode(any, events);
    }

    searchValue(query: string, strictMatch: boolean, results: SearchResult[], events: Events): boolean {
        let any = false;
        try {
            this.heightMaybeChanging = true;
            for (const node of this.nodes) {
                if (node.searchValue(query, strictMatch, results, events)) {
                    any = true;
                }
            }
        } finally {
            this.heightMaybeChanging = false;
        }

        return this.exitSearchFromNode(any, events);
    }

    private exitSearchFromNode(any: boolean, events: Events): boolean {
        if (any && !this.isOpen) {
            this.open(events, false, this.baseOfNodeIsRendered);
        } else if (!any && this.isOpen && !this.isOpenedByUser) {
            this.close(false, this.baseOfNodeIsRendered);
        }

        return any;
    }

    clearSearch() {
        try {
            this.heightMaybeChanging = true;
            for (const node of this.nodes) {
                node.clearSearch();
            }
        } finally {
            this.heightMaybeChanging = false;
        }

        if (this.isOpen && !this.isOpenedByUser) {
            this.close(false, this.baseOfNodeIsRendered);
        }
    }
}