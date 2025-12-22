export const enum IntSize {
    Int8,
    UInt8,
    Int16,
    UInt16,
    Int32,
    UInt32,
    Int64,
    UInt64,
    Int128,
    UInt128,
}

function signed(bits: bigint): [bigint, bigint] {
    return [
        -(1n << (bits - 1n)),
        (1n << (bits - 1n)) - 1n,
    ];
}

function unsigned(bits: bigint): [bigint, bigint] {
    return [
        0n,
        (1n << bits) - 1n,
    ];
}

export const integerSizes: Record<IntSize, [bigint, bigint]> = {
    [IntSize.Int8]: signed(8n),
    [IntSize.UInt8]: unsigned(8n),
    [IntSize.Int16]: signed(16n),
    [IntSize.UInt16]: unsigned(16n),
    [IntSize.Int32]: signed(32n),
    [IntSize.UInt32]: unsigned(32n),
    [IntSize.Int64]: signed(64n),
    [IntSize.UInt64]: unsigned(64n),
    [IntSize.Int128]: signed(128n),
    [IntSize.UInt128]: unsigned(128n),
};

export const sizeLabels: Record<IntSize, string> = {
    [IntSize.Int8]: "Int8",
    [IntSize.UInt8]: "UInt8",
    [IntSize.Int16]: "Int16",
    [IntSize.UInt16]: "UInt16",
    [IntSize.Int32]: "Int32",
    [IntSize.UInt32]: "UInt32",
    [IntSize.Int64]: "Int64",
    [IntSize.UInt64]: "UInt64",
    [IntSize.Int128]: "Int128",
    [IntSize.UInt128]: "UInt128",
};

export function toBigInt(value: any): bigint | null {
    if (typeof value === "bigint") {
        return value;
    }

    if (typeof value === "number") {
        if (!Number.isFinite(value) || !Number.isInteger(value)) {
            return null;
        }
        if (!Number.isSafeInteger(value)) {
            return null;
        }
        return BigInt(value);
    }

    if (typeof value === "string") {
        const s = value.trim();
        if (!/^[+-]?\d+$/.test(s)) {
            return null;
        }
        try {
            return BigInt(s);
        } catch {
            return null;
        }
    }

    return null;
}

function bitsNeededForValue(v: bigint): number {
    if (v >= 0n) {
        if (v === 0n) {
            return 1;
        }
        let bits = 0;
        let x = v;
        while (x > 0n) {
            x >>= 1n;
            bits++;
        }
        return bits;
    }

    let k = 1;
    while (true) {
        const bits = BigInt(k);
        const min = -(1n << (bits - 1n));
        const max = (1n << (bits - 1n)) - 1n;
        if (v >= min && v <= max) {
            return k;
        }
        k++;
    }
}

export type FitsInResult = {
    bitsNeeded: number;
    fits: Record<IntSize, boolean>;
};

export function fitsIn(value: bigint): FitsInResult {
    const result: FitsInResult = {
        bitsNeeded: bitsNeededForValue(value),
        fits: {} as Record<IntSize, boolean>,
    };

    for (const intSize in integerSizes) {
        const size = intSize as unknown as IntSize;
        const [min, max] = integerSizes[size];

        result.fits[size] = value >= min && value <= max;
    }

    return result;
}

// made by chatgpt, works!
export function formatBigInt(value: bigint): string {
    const locale = getRuntimeLocale()

    // Keep sign, format absolute digits
    const isNegative = value < 0n
    const digits = (isNegative ? -value : value).toString()

    const { groupSep, primaryGroup, secondaryGroup } = getGroupingInfo(locale)

    const grouped = applyGrouping(digits, groupSep, primaryGroup, secondaryGroup)
    return isNegative ? `-${grouped}` : grouped
}

function getRuntimeLocale(): string {
    // Nuxt: server has no navigator
    if (typeof navigator === "undefined") return "en-US"
    return navigator.language || "en-US"
}

function getGroupingInfo(locale: string): {
    groupSep: string
    primaryGroup: number
    secondaryGroup: number
} {
    const nf = new Intl.NumberFormat(locale)

    // Use a sample that reveals grouping + separator
    const sample = 1234567890
    const parts = nf.formatToParts(sample)

    // Separator (defaults to comma if we can't infer)
    const groupSep = parts.find(p => p.type === "group")?.value ?? ","

    // Infer group sizes by looking at digit runs between separators, from right to left
    const integerDigits = parts
        .filter(p => p.type === "integer" || p.type === "group")
        .map(p => p)

    const groupSizes: number[] = []
    let currentDigits = 0

    for (let i = integerDigits.length - 1; i >= 0; i--) {
        const p = integerDigits[i]
        if (p!.type === "integer") {
            currentDigits += p!.value.length
        } else if (p!.type === "group") {
            groupSizes.push(currentDigits)
            currentDigits = 0
        }
    }
    // leftmost run (may be shorter, but still informative)
    groupSizes.push(currentDigits)

    // From right: primary is first pushed (rightmost group size)
    const primaryGroup = groupSizes[0] || 3
    // Secondary is next one (used by locales like hi-IN). If absent, same as primary.
    const secondaryGroup = groupSizes[1] || primaryGroup

    return { groupSep, primaryGroup, secondaryGroup }
}

function applyGrouping(
    digits: string,
    sep: string,
    primary: number,
    secondary: number
): string {
    if (digits.length <= primary) return digits

    let i = digits.length
    const chunks: string[] = []

    // Rightmost group (primary)
    chunks.unshift(digits.slice(Math.max(0, i - primary), i))
    i -= primary

    // Remaining groups (secondary repeating)
    while (i > 0) {
        const size = secondary
        chunks.unshift(digits.slice(Math.max(0, i - size), i))
        i -= size
    }

    return chunks.join(sep)
}