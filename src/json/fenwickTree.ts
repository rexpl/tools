/** Fenwick tree (Binary Indexed Tree) for dynamic prefix sums. made by GPT */
export class FenwickTree {
    private readonly n: number;
    private readonly bit: number[];

    constructor(values: number[]) {
        this.n = values.length;
        this.bit = new Array(this.n + 1).fill(0);
        for (let i = 0; i < values.length; i++) {
            this.add(i, values[i]!);
        }
    }

    /** Add delta to index i (0-based). */
    add(i: number, delta: number): void {
        for (let x = i + 1; x <= this.n; x += x & -x) {
            this.bit[x]! += delta;
        }
    }

    /** Sum of [0..i) (i from 0..n). */
    sum(i: number): number {
        let s = 0;
        for (let x = i; x > 0; x -= x & -x) {
            s += this.bit[x]!;
        }
        return s;
    }

    total(): number {
        return this.sum(this.n);
    }

    /**
     * Find smallest index idx such that prefixSum(idx+1) > target.
     * Equivalent: returns the item index that contains pixel "target".
     * target is 0-based pixel offset into the list (0..total-1).
     */
    lowerBound(target: number): number {
        // Clamp target into [0, total-1] to avoid returning n.
        if (target <= 0) {
            return 0;
        }
        const total = this.total();
        if (target >= total) {
            return Math.max(0, this.n - 1);
        }

        let idx = 0;
        // largest power of two >= n
        let bitMask = 1;
        while (bitMask << 1 <= this.n) bitMask <<= 1;

        // We want largest idx such that prefixSum(idx) <= target, then answer is idx
        // This variant assumes bit[] stores partial sums, standard Fenwick lower bound.
        for (let step = bitMask; step !== 0; step >>= 1) {
            const next = idx + step;
            if (next <= this.n && this.bit[next]! <= target) {
                target -= this.bit[next]!;
                idx = next;
            }
        }
        // idx is in [0..n-1] (because we clamped target < total)
        return Math.min(idx, this.n - 1);
    }
}