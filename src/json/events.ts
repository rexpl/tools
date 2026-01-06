type ClickListener = (e: MouseEvent) => void;
type ScrollListener = () => boolean;

export class Events {
    private readonly clickListeners: WeakMap<HTMLElement, ClickListener> = new WeakMap;
    private scrollListeners: ScrollListener[] = [];

    constructor(private readonly root: HTMLElement) {
        this.root.addEventListener('click', this.handleClick);
    }

    destroy(): void {
        this.root.removeEventListener('click', this.handleClick);
    }

    onClick(e: HTMLElement, handler: ClickListener) {
        this.clickListeners.set(e, handler);
    }

    notifyOnScrollIfNodeStillAlive(fn: ScrollListener) {
        this.scrollListeners.push(fn);
    }

    rootHasScrolled() {
        for (let i = this.scrollListeners.length - 1; i >= 0; i--) {
            const sl = this.scrollListeners[i]!;
            if (!sl()) {
                this.scrollListeners.splice(i, 1);
            }
        }
    }

    private handleClick = (event: MouseEvent) => {
        let target = event.target as HTMLElement | null;

        while (target && target !== this.root) {
            const handler = this.clickListeners.get(target);
            if (handler) {
                handler(event);
                return;
            }
            target = target.parentElement;
        }
    };
}