import { describe, it, expect } from "vitest";
import { FenwickTree } from "../../../src/json/fenwickTree";

describe("FenwickTree", () => {
    it("sum() matches naive prefix sums", () => {
        const vals = [10, 20, 5, 0, 7];
        const ft = new FenwickTree(vals);

        const naive = (i: number) => vals.slice(0, i).reduce((a, b) => a + b, 0);

        for (let i = 0; i <= vals.length; i++) {
            expect(ft.sum(i)).toBe(naive(i));
        }
        expect(ft.total()).toBe(naive(vals.length));
    });

    it("add() updates sums correctly", () => {
        const vals = [1, 1, 1];
        const ft = new FenwickTree(vals);

        ft.add(1, 5); // [1,6,1]
        expect(ft.sum(0)).toBe(0);
        expect(ft.sum(1)).toBe(1);
        expect(ft.sum(2)).toBe(7);
        expect(ft.sum(3)).toBe(8);
    });

    it("lowerBound clamps at edges", () => {
        const ft = new FenwickTree([10, 10, 10]);
        expect(ft.lowerBound(-1)).toBe(0);
        expect(ft.lowerBound(0)).toBe(0);
        expect(ft.lowerBound(29)).toBe(2); // last pixel in total=30
        expect(ft.lowerBound(30)).toBe(2); // clamped
        expect(ft.lowerBound(999)).toBe(2);
    });

    it("lowerBound finds the bucket containing target pixel", () => {
        // row ranges: [0..2), [2..7), [7..8)
        const ft = new FenwickTree([2, 5, 1]);
        expect(ft.lowerBound(0)).toBe(0);
        expect(ft.lowerBound(1)).toBe(0);
        expect(ft.lowerBound(2)).toBe(1);
        expect(ft.lowerBound(6)).toBe(1);
        expect(ft.lowerBound(7)).toBe(2);
    });
});