import type { SemVer } from "@kairo-js/properties";

type SemVerLike = {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
    readonly prerelease?: string;
    readonly build?: string;
};

type RangeNode = {
    readonly test: (version: SemVerLike) => boolean;
    readonly prereleaseBases: readonly SemVerLike[];
};

type SatisfiesOptions = {
    readonly includePrerelease?: boolean;
};

type ParsedVersion = SemVerLike & {
    readonly precision: 0 | 1 | 2 | 3;
};

export class SemVerUtils {
    static format(version: SemVer): string {
        let result = `${version.major}.${version.minor}.${version.patch}`;

        if (version.prerelease) {
            result += `-${version.prerelease}`;
        }

        if (version.build) {
            result += `+${version.build}`;
        }

        return result;
    }

    static compare(a: SemVer, b: SemVer): number {
        return compareVersion(a, b);
    }

    static rcompare(a: SemVer, b: SemVer): number {
        return compareVersion(b, a);
    }

    static satisfies(version: SemVer, range: string, options?: SatisfiesOptions): boolean {
        const node = parseRange(range);
        if (!node.test(version)) return false;

        if (
            version.prerelease !== undefined &&
            !options?.includePrerelease &&
            !node.prereleaseBases.some((base) => hasSameCore(version, base))
        ) {
            return false;
        }

        return true;
    }

    static equals(a: SemVer, b: SemVer): boolean {
        return this.compare(a, b) === 0;
    }

    static isPrerelease(version: SemVer): boolean {
        return version.prerelease !== undefined;
    }
}

function parseRange(range: string): RangeNode {
    const tokens = tokenize(range);
    if (tokens.length === 0) return anyNode();

    const parser = new RangeParser(tokens);
    const node = parser.parse();
    return node && parser.done() ? node : neverNode();
}

function tokenize(range: string): string[] {
    const tokens: string[] = [];

    for (let i = 0; i < range.length; ) {
        const char = range[i]!;
        if (/\s/.test(char)) {
            i++;
            continue;
        }

        if (char === "(" || char === ")" || char === "&") {
            tokens.push(char);
            i++;
            continue;
        }

        if (char === "|") {
            tokens.push("|");
            i += range[i + 1] === "|" ? 2 : 1;
            continue;
        }

        let end = i + 1;
        while (end < range.length && !/[\s()&|]/.test(range[end]!)) end++;
        tokens.push(range.slice(i, end));
        i = end;
    }

    return tokens;
}

class RangeParser {
    private index = 0;

    constructor(private readonly tokens: readonly string[]) {}

    parse(): RangeNode | undefined {
        return this.parseOr();
    }

    done(): boolean {
        return this.index >= this.tokens.length;
    }

    private parseOr(): RangeNode | undefined {
        let node = this.parseAnd();
        if (!node) return undefined;

        while (this.peek() === "|") {
            this.index++;
            const right = this.parseAnd();
            if (!right) return undefined;
            node = orNode(node, right);
        }

        return node;
    }

    private parseAnd(): RangeNode | undefined {
        let node = this.parsePrimary();
        if (!node) return undefined;

        while (true) {
            if (this.peek() === "&") {
                this.index++;
            } else if (!this.startsPrimary()) {
                break;
            }

            const right = this.parsePrimary();
            if (!right) return undefined;
            node = andNode(node, right);
        }

        return node;
    }

    private parsePrimary(): RangeNode | undefined {
        if (this.peek() === "(") {
            this.index++;
            const node = this.parseOr();
            if (!node || this.peek() !== ")") return undefined;
            this.index++;
            return node;
        }

        return this.parseComparator();
    }

    private parseComparator(): RangeNode | undefined {
        const token = this.next();
        if (!token || token === ")" || token === "&" || token === "|") return undefined;

        const split = splitComparator(token);
        const operator = split.operator;
        let versionText = split.version;

        if (versionText === "") {
            versionText = this.next() ?? "";
        }

        if (versionText === "") return undefined;
        return createComparator(operator, versionText);
    }

    private startsPrimary(): boolean {
        const token = this.peek();
        return token !== undefined && token !== ")" && token !== "&" && token !== "|";
    }

    private peek(): string | undefined {
        return this.tokens[this.index];
    }

    private next(): string | undefined {
        return this.tokens[this.index++];
    }
}

function splitComparator(token: string): { operator: string; version: string } {
    for (const operator of [">=", "<=", ">", "<", "=", "^", "~"]) {
        if (token === operator) return { operator, version: "" };
        if (token.startsWith(operator)) return { operator, version: token.slice(operator.length) };
    }

    return { operator: "", version: token };
}

function createComparator(operator: string, versionText: string): RangeNode {
    const version = parseVersion(versionText);
    if (!version) return neverNode();

    if (version.precision === 0) return anyNode();

    if (operator === "^") return caretNode(version);
    if (operator === "~") return tildeNode(version);

    if (operator === ">" || operator === ">=" || operator === "<" || operator === "<=") {
        return compareNode(operator, floorVersion(version), prereleaseBases(version));
    }

    if (version.precision < 3) return partialVersionNode(version);
    return compareNode("=", version, prereleaseBases(version));
}

function parseVersion(value: string): ParsedVersion | undefined {
    const match = /^(x|X|\*|\d+)(?:\.(x|X|\*|\d+))?(?:\.(x|X|\*|\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/.exec(
        value.trim(),
    );
    if (!match) return undefined;

    const major = parsePart(match[1]);
    const minor = parsePart(match[2]);
    const patch = parsePart(match[3]);

    if (major === undefined) return { major: 0, minor: 0, patch: 0, precision: 0 };
    if (minor === undefined) {
        return {
            major,
            minor: 0,
            patch: 0,
            precision: 1,
            ...(match[4] !== undefined ? { prerelease: match[4] } : {}),
            ...(match[5] !== undefined ? { build: match[5] } : {}),
        };
    }
    if (patch === undefined) {
        return {
            major,
            minor,
            patch: 0,
            precision: 2,
            ...(match[4] !== undefined ? { prerelease: match[4] } : {}),
            ...(match[5] !== undefined ? { build: match[5] } : {}),
        };
    }

    return {
        major,
        minor,
        patch,
        precision: 3,
        ...(match[4] !== undefined ? { prerelease: match[4] } : {}),
        ...(match[5] !== undefined ? { build: match[5] } : {}),
    };
}

function parsePart(value: string | undefined): number | undefined {
    if (value === undefined || value === "*" || value === "x" || value === "X") return undefined;
    return Number(value);
}

function partialVersionNode(version: ParsedVersion): RangeNode {
    const lower = floorVersion(version);
    const upper =
        version.precision === 1
            ? { major: version.major + 1, minor: 0, patch: 0 }
            : { major: version.major, minor: version.minor + 1, patch: 0 };

    return andNode(compareNode(">=", lower), compareNode("<", upper));
}

function caretNode(version: ParsedVersion): RangeNode {
    const lower = floorVersion(version);
    let upper: SemVerLike;

    if (version.major > 0) {
        upper = { major: version.major + 1, minor: 0, patch: 0 };
    } else if (version.minor > 0) {
        upper = { major: 0, minor: version.minor + 1, patch: 0 };
    } else {
        upper = { major: 0, minor: 0, patch: version.patch + 1 };
    }

    return andNode(compareNode(">=", lower, prereleaseBases(version)), compareNode("<", upper));
}

function tildeNode(version: ParsedVersion): RangeNode {
    const lower = floorVersion(version);
    const upper =
        version.precision <= 1
            ? { major: version.major + 1, minor: 0, patch: 0 }
            : { major: version.major, minor: version.minor + 1, patch: 0 };

    return andNode(compareNode(">=", lower, prereleaseBases(version)), compareNode("<", upper));
}

function floorVersion(version: ParsedVersion): SemVerLike {
    return {
        major: version.major,
        minor: version.minor,
        patch: version.patch,
        ...(version.prerelease !== undefined ? { prerelease: version.prerelease } : {}),
    };
}

function compareNode(
    operator: string,
    target: SemVerLike,
    prereleaseBases: readonly SemVerLike[] = [],
): RangeNode {
    return {
        test: (version) => {
            const compared = compareVersion(version, target);
            if (operator === ">") return compared > 0;
            if (operator === ">=") return compared >= 0;
            if (operator === "<") return compared < 0;
            if (operator === "<=") return compared <= 0;
            return compared === 0;
        },
        prereleaseBases,
    };
}

function anyNode(): RangeNode {
    return { test: () => true, prereleaseBases: [] };
}

function neverNode(): RangeNode {
    return { test: () => false, prereleaseBases: [] };
}

function andNode(left: RangeNode, right: RangeNode): RangeNode {
    return {
        test: (version) => left.test(version) && right.test(version),
        prereleaseBases: [...left.prereleaseBases, ...right.prereleaseBases],
    };
}

function orNode(left: RangeNode, right: RangeNode): RangeNode {
    return {
        test: (version) => left.test(version) || right.test(version),
        prereleaseBases: [...left.prereleaseBases, ...right.prereleaseBases],
    };
}

function prereleaseBases(version: SemVerLike): readonly SemVerLike[] {
    return version.prerelease === undefined ? [] : [version];
}

function hasSameCore(a: SemVerLike, b: SemVerLike): boolean {
    return a.major === b.major && a.minor === b.minor && a.patch === b.patch;
}

function compareVersion(a: SemVerLike, b: SemVerLike): number {
    return (
        compareNumber(a.major, b.major) ||
        compareNumber(a.minor, b.minor) ||
        compareNumber(a.patch, b.patch) ||
        comparePrerelease(a.prerelease, b.prerelease)
    );
}

function compareNumber(a: number, b: number): number {
    return a === b ? 0 : a > b ? 1 : -1;
}

function comparePrerelease(a: string | undefined, b: string | undefined): number {
    if (a === undefined && b === undefined) return 0;
    if (a === undefined) return 1;
    if (b === undefined) return -1;

    const left = a.split(".");
    const right = b.split(".");
    const length = Math.max(left.length, right.length);

    for (let i = 0; i < length; i++) {
        const leftPart = left[i];
        const rightPart = right[i];
        if (leftPart === undefined) return -1;
        if (rightPart === undefined) return 1;

        const compared = compareIdentifier(leftPart, rightPart);
        if (compared !== 0) return compared;
    }

    return 0;
}

function compareIdentifier(a: string, b: string): number {
    const aNumeric = /^[0-9]+$/.test(a);
    const bNumeric = /^[0-9]+$/.test(b);

    if (aNumeric && bNumeric) return compareNumber(Number(a), Number(b));
    if (aNumeric) return -1;
    if (bNumeric) return 1;
    return a === b ? 0 : a > b ? 1 : -1;
}
