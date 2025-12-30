import { describe, it, expect } from "vitest";
import {fitsIn, integerSizes, IntSize, toBigInt} from "../../src/int";

describe("toBigInt", () => {
    it("returns bigint unchanged", () => {
        expect(toBigInt(123n)).toBe(123n);
        expect(toBigInt(-5n)).toBe(-5n);
    });

    it("converts safe integers (number) to bigint", () => {
        expect(toBigInt(0)).toBe(0n);
        expect(toBigInt(42)).toBe(42n);
        expect(toBigInt(-42)).toBe(-42n);
        expect(toBigInt(Number.MAX_SAFE_INTEGER)).toBe(BigInt(Number.MAX_SAFE_INTEGER));
        expect(toBigInt(Number.MIN_SAFE_INTEGER)).toBe(BigInt(Number.MIN_SAFE_INTEGER));
    });

    it("rejects non-integer numbers, NaN, Infinity, and unsafe integers", () => {
        expect(toBigInt(NaN)).toBeNull();
        expect(toBigInt(Infinity)).toBeNull();
        expect(toBigInt(-Infinity)).toBeNull();
        expect(toBigInt(1.5)).toBeNull();
        expect(toBigInt(9007199254740992)).toBeNull(); // MAX_SAFE_INTEGER + 1
        expect(toBigInt(-9007199254740992)).toBeNull();
    });

    it("parses integer strings (with trimming and optional sign)", () => {
        expect(toBigInt("0")).toBe(0n);
        expect(toBigInt("  123  ")).toBe(123n);
        expect(toBigInt("+123")).toBe(123n);
        expect(toBigInt("-123")).toBe(-123n);
        expect(toBigInt("00012")).toBe(12n);
        expect(toBigInt("-00012")).toBe(-12n);
    });

    it("rejects non-integer strings", () => {
        expect(toBigInt("")).toBeNull();
        expect(toBigInt("   ")).toBeNull();
        expect(toBigInt("12.3")).toBeNull();
        expect(toBigInt("1e3")).toBeNull();
        expect(toBigInt("0x10")).toBeNull();
        expect(toBigInt("123abc")).toBeNull();
        expect(toBigInt("--1")).toBeNull();
        expect(toBigInt("+-1")).toBeNull();
    });

    it("returns null for other types", () => {
        expect(toBigInt(null)).toBeNull();
        expect(toBigInt(undefined)).toBeNull();
        expect(toBigInt({})).toBeNull();
        expect(toBigInt([])).toBeNull();
        expect(toBigInt(true)).toBeNull();
    });
});

describe("fitsIn", () => {
    it("handles boundary values correctly (example: Int8/UInt8)", () => {
        const [i8min, i8max] = integerSizes[IntSize.Int8];
        const [u8min, u8max] = integerSizes[IntSize.UInt8];

        expect(fitsIn(i8min).fits[IntSize.Int8]).toBe(true);
        expect(fitsIn(i8max).fits[IntSize.Int8]).toBe(true);
        expect(fitsIn(i8min - 1n).fits[IntSize.Int8]).toBe(false);
        expect(fitsIn(i8max + 1n).fits[IntSize.Int8]).toBe(false);

        expect(fitsIn(u8min).fits[IntSize.UInt8]).toBe(true);
        expect(fitsIn(u8max).fits[IntSize.UInt8]).toBe(true);
        expect(fitsIn(u8min - 1n).fits[IntSize.UInt8]).toBe(false); // -1 doesn't fit unsigned
        expect(fitsIn(u8max + 1n).fits[IntSize.UInt8]).toBe(false);
    });

    it("bitsNeeded is correct for some small positives", () => {
        expect(fitsIn(0n).bitsNeeded).toBe(1);
        expect(fitsIn(1n).bitsNeeded).toBe(1);
        expect(fitsIn(2n).bitsNeeded).toBe(2);
        expect(fitsIn(3n).bitsNeeded).toBe(2);
        expect(fitsIn(4n).bitsNeeded).toBe(3);
        expect(fitsIn(7n).bitsNeeded).toBe(3);
        expect(fitsIn(8n).bitsNeeded).toBe(4);
    });

    it("bitsNeeded is correct for some negatives (two's-complement style ranges)", () => {
        // For 1-bit signed, range is [-1, 0]
        expect(fitsIn(-1n).bitsNeeded).toBe(1);
        // For 2-bit signed, range is [-2, 1]
        expect(fitsIn(-2n).bitsNeeded).toBe(2);
        expect(fitsIn(-3n).bitsNeeded).toBe(3); // needs 3 bits: [-4,3]
        expect(fitsIn(-4n).bitsNeeded).toBe(3);
    });

    it("is monotonic-ish: if it fits in Int8 it must fit in Int16, etc. (spot check)", () => {
        const v = 100n;
        const r = fitsIn(v).fits;
        expect(r[IntSize.Int8]).toBe(true);
        expect(r[IntSize.Int16]).toBe(true);
        expect(r[IntSize.Int32]).toBe(true);
    });
});