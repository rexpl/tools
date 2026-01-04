import type {JsonDataNode, JsonDataParentNode, Key, SearchResult} from "./nodes";
import {searchMatchesOnThisLevel, div, span, makeKey} from "./utils";

export const enum SimpleType {
    String,
    Number,
    Null,
    Boolean,
}

const HIGHLIGHT_BASE_CLASSES = Object.freeze(['text-white!', 'rounded']);
const IS_HIGHLIGHTED_CLASS = 'bg-orange-600';
const IS_NOT_HIGHLIGHTED_CLASS = 'bg-yellow-500';

export class SimpleNode<ParentKey extends Key> implements JsonDataNode<ParentKey>, SearchResult {
    private parent: JsonDataParentNode<ParentKey>;
    private keyInParent: ParentKey;

    private rendered: boolean = false;
    private highlighted: boolean = false;
    private matchesInSearch: boolean = false;

    private element: HTMLElement;

    constructor(
        private readonly value: string,
        private readonly type: SimpleType,
        private readonly key: Key | null,
    ) {}

    boot(parent: JsonDataParentNode<ParentKey>, keyInParent: ParentKey): void {
        this.parent = parent;
        this.keyInParent = keyInParent;
    }

    render(parent: HTMLElement) {
        this.rendered = true;
        const root = div(['flex', 'space-x-1', 'ms-4'], parent);
        makeKey(root, this.key);

        switch (this.type) {
            case SimpleType.String:
                this.element = span(['text-green-700', 'truncate', 'text-nowrap'], root);
                this.element.innerText = `"${this.value.replace(/\r?\n/g, '\\n')}"`;
                break;
            case SimpleType.Null:
            case SimpleType.Boolean:
                this.element = span(['text-orange-700'], root);
                this.element.innerText = this.value;
                break;
            case SimpleType.Number:
                this.element = span(['text-cyan-700'], root);
                this.element.innerText = this.value;
                break;
        }

        if (this.matchesInSearch) {
            this.element.classList.add(
                this.highlighted ? IS_HIGHLIGHTED_CLASS : IS_NOT_HIGHLIGHTED_CLASS,
                ...HIGHLIGHT_BASE_CLASSES,
            );
        }
    }

    destroy() {
        this.rendered = false;
        this.element.parentElement!.remove();
    }

    getElement(): HTMLElement {
        return this.element.parentElement!;
    }

    searchOnPath(
        query: string,
        address: string[],
        lastMatch: number,
        strictMatch: boolean,
        results: SearchResult[],
    ): boolean {
        if (
            searchMatchesOnThisLevel(address, lastMatch, this.key)
            // verify we are at the end of the searching path as we don't have children
            && address.length === lastMatch + 2
        ) {
            return this.searchValue(query, strictMatch, results);
        }

        return false;
    }

    searchValue(query: string, strictMatch: boolean, results: SearchResult[]): boolean {
        if (strictMatch) {
            this.matchesInSearch = this.value === query;
        } else {
            this.matchesInSearch = this.value.toLowerCase().includes(query);
        }

        if (this.matchesInSearch) {
            results.push(this);
        }

        if (this.rendered) {
            if (this.matchesInSearch) {
                this.element.classList.add(
                    this.highlighted ? IS_HIGHLIGHTED_CLASS : IS_NOT_HIGHLIGHTED_CLASS,
                    ...HIGHLIGHT_BASE_CLASSES,
                );
            } else {
                this.element.classList.remove(
                    IS_HIGHLIGHTED_CLASS, IS_NOT_HIGHLIGHTED_CLASS, ...HIGHLIGHT_BASE_CLASSES,
                );
            }
        }

        return this.matchesInSearch;
    }

    clearSearch(): void {
        this.highlighted = false;
        this.matchesInSearch = false;
    }

    highlight(highlight: boolean) {
        this.highlighted = highlight;
        if (this.rendered) {
            if (highlight) {
                this.element.classList.add(IS_HIGHLIGHTED_CLASS);
                this.element.classList.remove(IS_NOT_HIGHLIGHTED_CLASS);
            } else {
                this.element.classList.add(IS_NOT_HIGHLIGHTED_CLASS);
                this.element.classList.remove(IS_HIGHLIGHTED_CLASS);
            }
        }
    }

    getApproxScrollPosition(): number {
        return this.parent.getMyPositionInfo(this.keyInParent).yourStartPosition;
    }
}