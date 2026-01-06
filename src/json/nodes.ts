import type {Events} from "./events";

export const ROW_HEIGHT_PX = 20;
export const NODE_CAN_BENEFIT_FROM_LAZY_RENDERING = 250;
export const LAZY_RENDERING_OVERSCAN_PX = 300;

export type Key = string | number;
export interface SearchResult {
    highlight(highlight: boolean): void;
    getApproxScrollPosition(): number;
}

export interface JsonDataBaseNode {
    render(parent: HTMLElement, events: Events, depth: number): void;
    searchOnPath(
        query: string,
        address: string[],
        lastMatch: number,
        strictMatch: boolean,
        results: SearchResult[],
        events: Events,
    ): boolean;
    searchValue(query: string, strictMatch: boolean, results: SearchResult[], events: Events): boolean;
    clearSearch(): void;
}

export interface JsonDataNode<ParentKey extends Key = Key> extends JsonDataBaseNode {
    boot(parent: JsonDataParentNode<ParentKey>, keyInParent: ParentKey): void;
    destroy(): void;
    getElement(): HTMLElement;
}

export interface PositionInfo {
    rootViewportHeight: number;
    rootScrollTop: number;
    yourStartPosition: number;
}

export interface JsonDataParentNode<ParentKey extends Key> {
    getMyPositionInfo(key: ParentKey): PositionInfo;
    childHeightUpdated(key: ParentKey, newHeight: number): void;
}