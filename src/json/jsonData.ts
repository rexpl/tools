import type {JsonDataBaseNode, SearchResult} from "./nodes";
import {Events} from "./events";
import {toNode} from "./utils";

export class JsonData {
    private readonly rootNode: JsonDataBaseNode;
    private element: HTMLElement;
    private events: Events;

    constructor(data: unknown) {
        this.rootNode = toNode(data, null);
    }

    init(root: HTMLElement): void {
        this.element = root;
        this.events = new Events(root);

        this.rootNode.render(root, this.events, 0);
    }

    search(query: string): SearchResult[] {
        const results: SearchResult[] = [];

        if (query === '') {
            this.rootNode.clearSearch();
        } else if (query.startsWith('=') || !query.includes('=')) {
            let strict = false;
            if (query.startsWith('=')) {
                query = query.substring(1);
                strict = true;
            } else {
                query = query.toLowerCase();
            }

            this.rootNode.searchValue(query, strict, results, this.events);
        } else {
            const strict = query.includes('==');
            let [fullAddress, searchTerm] = query.split(strict ? '==' : '=', 2);
            if (!strict) {
                searchTerm = searchTerm!.toLowerCase();
            }

            this.rootNode.searchOnPath(
                searchTerm!, fullAddress!.split('.'), -1, strict, results, this.events
            );
        }

        return results;
    }

    destroy(): void {
        this.element.innerHTML = '';
        this.events.destroy();
    }

    static makeSafe(raw: string): JsonData | null {
        let data: unknown;

        try {
            data = JSON.parse(raw.trim());
        } catch (_) {
            return null;
        }

        return new JsonData(data);
    }
}