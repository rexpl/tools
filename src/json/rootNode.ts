import type {JsonDataNode, JsonDataBaseNode, JsonDataParentNode, Key, PositionInfo, SearchResult} from "./nodes";
import {ROW_HEIGHT_PX, LAZY_RENDERING_OVERSCAN_PX} from "./nodes";
import {Events} from "./events";
import {div} from "./utils";
import {FenwickTree} from "./fenwickTree";

export class RootNode implements JsonDataBaseNode, JsonDataParentNode<number> {
    private renderQueuedJobId: number;
    private events: Events;

    private readonly nodes: JsonDataNode[];

    private readonly heights: number[] = [];
    private readonly fenwick: FenwickTree;
    private totalHeightPx = 0;

    private parentElement: HTMLElement;
    private rootNode: HTMLDivElement;
    private renderNode: HTMLDivElement;

    private renderedStart = 0;
    private renderedEnd = 0;
    private mounted = new Set<number>();

    constructor(nodes: Map<Key, JsonDataNode>) {
        this.nodes = new Array(nodes.size);
        this.heights = new Array(nodes.size);

        let i = 0;
        for (const [, node] of nodes) {
            this.nodes[i] = node;
            this.heights[i] = ROW_HEIGHT_PX;
            node.boot(this, i);
            i++;
        }

        this.fenwick = new FenwickTree(this.heights);
        this.totalHeightPx = this.fenwick.total();
    }

    render(parent: HTMLElement, events: Events): void {
        this.parentElement = parent;
        this.events = events;

        this.rootNode = div(['relative'], parent);
        this.rootNode.style.height = `${this.totalHeightPx}px`;

        this.renderNode = div(['absolute', 'left-0', 'right-0', 'top-0', 'will-change-transform'], this.rootNode);
        this.renderNode.style.transform = 'translateY(0px)';

        parent.addEventListener('scroll', () => {
            this.queueRendering();
        });

        this.performRendering();
    }

    private queueRendering(): void {
        cancelAnimationFrame(this.renderQueuedJobId);
        this.renderQueuedJobId = requestAnimationFrame(() => {
            this.performRendering();
            this.events.rootHasScrolled();
        });
    }

    private performRendering(): void {
        const viewportHeight = this.parentElement.clientHeight;
        const viewportTop = this.parentElement.scrollTop;
        const viewportBottom = viewportTop + viewportHeight;

        // Compute target render band with overscan
        const targetTop = Math.max(0, viewportTop - LAZY_RENDERING_OVERSCAN_PX);
        const targetBottom = Math.min(
            this.totalHeightPx,
            Math.max(viewportBottom + LAZY_RENDERING_OVERSCAN_PX, targetTop + LAZY_RENDERING_OVERSCAN_PX),
        );

        // Map pixels to indices
        let start = this.fenwick.lowerBound(targetTop);
        let end = Math.min(this.nodes.length - 1, this.fenwick.lowerBound(targetBottom)) + 1;

        start = Math.max(0, Math.min(start, this.nodes.length - 1));
        end = Math.max(start + 1, Math.min(end, this.nodes.length));

        const startOffset = this.fenwick.sum(start);
        this.renderNode.style.transform = `translateY(${startOffset}px)`;

        // render range unchanged, do nothing
        if (start === this.renderedStart && end === this.renderedEnd) {
            return;
        }

        const wanted = new Set<number>();
        for (let i = start; i < end; i++) {
            wanted.add(i);
        }

        // we remove unwanted nodes
        for (const index of this.mounted) {
            if (!wanted.has(index)) {
                this.nodes[index]!.destroy();
            }
        }

        // we create the new needed nodes
        const elements: HTMLElement[] = [];
        for (const index of wanted) {
            const node = this.nodes[index]!;
            if (!this.mounted.has(index)) {
                node.render(this.renderNode, this.events, 1);
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

        this.mounted = wanted;
        this.renderedStart = start;
        this.renderedEnd = end;
    }

    getMyPositionInfo(key: number): PositionInfo {
        return {
            rootViewportHeight: this.parentElement.clientHeight,
            rootScrollTop: this.parentElement.scrollTop,
            yourStartPosition: this.fenwick.sum(key),
        };
    }

    childHeightUpdated(key: number, newHeight: number) {
        const old = this.heights[key]!;
        this.heights[key] = newHeight;

        this.fenwick.add(key, newHeight - old);

        this.totalHeightPx = this.fenwick.total();
        this.rootNode.style.height = `${this.totalHeightPx}px`;

        this.queueRendering();
    }

    searchOnPath(
        query: string,
        address: string[],
        lastMatch: number,
        strictMatch: boolean,
        results: SearchResult[],
        events: Events,
    ): boolean {
        let any = false;
        for (const node of this.nodes) {
            if (node.searchOnPath(query, address, lastMatch, strictMatch, results, events)) {
                any = true;
            }
        }
        return any;
    }

    searchValue(query: string, strictMatch: boolean, results: SearchResult[], events: Events): boolean {
        let any = false;
        for (const node of this.nodes) {
            if (node.searchValue(query, strictMatch, results, events)) {
                any = true;
            }
        }
        return any;
    }

    clearSearch() {
        for (const node of this.nodes) {
            node.clearSearch();
        }
    }
}