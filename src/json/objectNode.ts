import type {JsonDataNode, JsonDataBaseNode, JsonDataParentNode, Key, PositionInfo, SearchResult} from "./nodes";
import {ROW_HEIGHT_PX, NODE_CAN_BENEFIT_FROM_LAZY_RENDERING} from "./nodes";
import type {Events} from "./events";
import {RootNode} from "./rootNode";
import {LazyObjectNode} from "./lazyObjectNode";
import {FenwickTree} from "./fenwickTree";
import {searchMatchesOnThisLevel, toNode, button, div, span, idiomatic, makeKey} from "./utils";

export class ObjectNode<
    NodeKey extends Key,
    ParentKey extends Key,
> implements JsonDataNode<ParentKey>, JsonDataParentNode<NodeKey> {
    private parent: JsonDataParentNode<ParentKey>;
    private keyInParent: ParentKey;

    private isOpenedByUser: boolean = false;
    private isOpen: boolean;

    private baseOfNodeIsRendered: boolean = false;

    private rootElement: HTMLElement;
    private caret: HTMLElement;
    private closingBraceOpen: HTMLElement;
    private closingBraceClose: HTMLElement;

    private nextDepth: number;
    private childRoot: HTMLDivElement;

    private heightMaybeChanging: boolean = false;
    private readonly heights = new Map<NodeKey, number>();
    private totalHeightPx: number;
    private fenwickTree: FenwickTree | null = null;
    private readonly heightsToFenwickTreeIndex = new Map<NodeKey, number>();

    constructor(
        private readonly nodes: Map<NodeKey, JsonDataNode>,
        private readonly isArray: boolean,
        private readonly key: Key,
    ) {
        for (const [key, node] of this.nodes) {
            this.heights.set(key, ROW_HEIGHT_PX);
            node.boot(this, key);
        }

        this.totalHeightPx = this.heights.size * ROW_HEIGHT_PX;
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

        this.caret = idiomatic(['fa-solid', 'fa-caret-right', 'w-3!', 'text-gray-400'], collapseButton);

        makeKey(collapseButton, this.key);
        span([], collapseButton).innerText = this.isArray ? '[' : '{';

        this.nextDepth = depth + 1;
        this.childRoot = div(['ps-2', 'ms-4', 'border-l', 'border-gray-200', 'dark:border-gray-700'], this.rootElement);

        this.closingBraceOpen = div(['ms-4', 'hidden'], this.rootElement);
        this.closingBraceOpen.innerText = this.isArray ? ']' : '}';

        this.closingBraceClose = span([], collapseButton);
        this.closingBraceClose.innerText = this.isArray ? '... ]' : '... }';

        if (this.isOpen) {
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
            try {
                this.heightMaybeChanging = true;
                for (const [, node] of this.nodes) {
                    node.render(this.childRoot, events, this.nextDepth);
                }
            } finally {
                this.heightMaybeChanging = false;
            }

            this.caret.classList.toggle('rotate-90');
            this.closingBraceOpen.classList.toggle('hidden');
            this.closingBraceClose.classList.toggle('hidden');
        }

        this.isOpen = true;
        if (fromClick) {
            this.isOpenedByUser = true;
        }

        this.dispatchHeight();
    }

    private close(fromClick: boolean, render: boolean): void {
        if (render) {
            this.childRoot.innerHTML = '';

            this.caret.classList.toggle('rotate-90');
            this.closingBraceOpen.classList.toggle('hidden');
            this.closingBraceClose.classList.toggle('hidden');
        }

        this.isOpen = false;
        if (fromClick) {
            this.isOpenedByUser = false;
        }

        this.dispatchHeight();
    }

    getMyPositionInfo(key: NodeKey): PositionInfo {
        // we don't create a fenwick tree if we don't have children with virtual rendering
        if (this.fenwickTree === null) {
            let i = 0;
            const heights: number[] = [];
            for (const [key] of this.nodes) {
                this.heightsToFenwickTreeIndex.set(key, i++);
                heights.push(this.heights.get(key)!);
            }
            this.fenwickTree = new FenwickTree(heights);
        }

        const position = this.parent.getMyPositionInfo(this.keyInParent);

        const fenwickIndex = this.heightsToFenwickTreeIndex.get(key)!;
        position.yourStartPosition = position.yourStartPosition + this.fenwickTree.sum(fenwickIndex) + ROW_HEIGHT_PX;

        return position;
    }

    childHeightUpdated(key: NodeKey, newHeight: number): void {
        const oldHeight = this.heights.get(key)!;
        this.totalHeightPx -= oldHeight;
        this.heights.set(key, newHeight);
        this.totalHeightPx += newHeight;

        // we update the fenwick tree if we have one (i.e, one of our children is lazy rendering)
        if (this.fenwickTree !== null) {
            const fenwickIndex = this.heightsToFenwickTreeIndex.get(key)!;
            this.fenwickTree.add(fenwickIndex, newHeight - oldHeight);
        }
        // if we are not in a render we update the parents that we updated our height else the rendered will
        // dispatch the height at the end of the render.
        if (!this.heightMaybeChanging) {
            this.dispatchHeight();
        }
    }

    private dispatchHeight(): void {
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
            for (const [, node] of this.nodes) {
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
            for (const [, node] of this.nodes) {
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
            for (const [, node] of this.nodes) {
                node.clearSearch();
            }
        } finally {
            this.heightMaybeChanging = false;
        }

        if (this.isOpen && !this.isOpenedByUser) {
            this.close(false, this.baseOfNodeIsRendered);
        }
    }

    static fromArray(data: unknown[], key: Key | null): JsonDataNode | JsonDataBaseNode {
        const nodes: Map<number, JsonDataNode> = new Map;

        let i = 0;
        for (const value of data) {
            nodes.set(i, toNode(value, i));
            i++;
        }

        if (key === null) {
            return new RootNode(nodes);
        }

        return nodes.size > NODE_CAN_BENEFIT_FROM_LAZY_RENDERING
            ? new LazyObjectNode(nodes, true, key)
            : new ObjectNode(nodes, true, key);
    }

    static fromObject(data: Record<string, unknown>, key: Key | null): JsonDataNode | JsonDataBaseNode {
        const nodes: Map<string, JsonDataNode> = new Map;

        for (const key in data) {
            nodes.set(key, toNode(data[key], key));
        }

        if (key === null) {
            return new RootNode(nodes);
        }

        return nodes.size > NODE_CAN_BENEFIT_FROM_LAZY_RENDERING
            ? new LazyObjectNode(nodes, false, key)
            : new ObjectNode(nodes, false, key);
    }
}