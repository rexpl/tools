import type {JsonDataBaseNode, JsonDataNode, Key} from "./nodes";
import {SimpleNode, SimpleType} from "./simpleNode";
import {ObjectNode} from "./objectNode";

export function toNode(data: any, key: null): JsonDataBaseNode;
export function toNode(data: any, key: Key): JsonDataNode;
export function toNode(data: any, key: Key | null): JsonDataNode|JsonDataBaseNode {
    switch (typeof data) {
        case "string":
            return new SimpleNode(data, SimpleType.String, key);
        case "number":
            return new SimpleNode(data.toString(), SimpleType.Number, key);
        case "object":
            if (data === null) {
                return new SimpleNode('null', SimpleType.Null, key);
            } else if (Array.isArray(data)) {
                return ObjectNode.fromArray(data, key);
            } else {
                return ObjectNode.fromObject(data, key);
            }
        case "boolean":
            return new SimpleNode(data ? 'true' : 'false', SimpleType.Boolean, key);
        default:
            throw new Error(`Unsupported json data type: "${typeof data}"`);
    }
}

export function searchMatchesOnThisLevel(address: string[], lastMatch: number, key: Key | null): boolean {
    const keyToCheck = lastMatch + 1;
    if (keyToCheck in address) {
        if (typeof key === 'number') {
            key = key.toString();
        }

        const thisNodePossibleAddress = address[keyToCheck];
        return thisNodePossibleAddress === '*' || thisNodePossibleAddress === key;
    }

    return false;
}

function element<T extends HTMLElement>(type: string, classes: string[], parent: HTMLElement | null): T {
    const e = document.createElement(type);

    if (classes.length > 0) {
        e.classList.add(...classes);
    }
    if (parent !== null) {
        parent.appendChild(e);
    }

    return e as T;
}

export function div(classes: string[] = [], parent: HTMLElement | null = null): HTMLDivElement {
    return element('div', classes, parent);
}

export function span(classes: string[] = [], parent: HTMLElement | null = null): HTMLSpanElement {
    return element('span', classes, parent);
}

export function button(classes: string[] = [], parent: HTMLElement | null = null): HTMLButtonElement {
    return element('button', classes, parent);
}

export function idiomatic(classes: string[], parent: HTMLElement | null = null): HTMLElement {
    return element('i', classes, parent);
}

export function makeKey(parent: HTMLElement, key: Key | null): void {
    if (key !== null) {
        if (typeof key === 'string') {
            span(['text-blue-700'], parent).innerHTML = `"${key}":`;
        } else {
            span(['text-purple-700'], parent).innerHTML = `${key.toString()}:`;
        }
    }
}