import type { SemVer } from "@kairo-js/properties";
import type { KairoRegistry } from "@kairo-js/router";

export interface ValidateFunction<T> {
    (value: unknown): value is T;
    errors?: readonly string[];
}

export function createValidator<T>(
    name: string,
    check: (value: unknown) => boolean,
): ValidateFunction<T> {
    const validate: ValidateFunction<T> = (value: unknown): value is T => {
        const success = check(value);
        validate.errors = success ? undefined : [`: expected ${name}`];
        return success;
    };
    return validate;
}

export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
    return Object.keys(value).every((key) => keys.includes(key));
}

export function isInteger(value: unknown, min?: number, max?: number): value is number {
    return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        (min === undefined || value >= min) &&
        (max === undefined || value <= max)
    );
}

export function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isStringRecord(value: unknown): value is Record<string, string> {
    return isObject(value) && Object.values(value).every((item) => typeof item === "string");
}

export function isSemVer(value: unknown): value is SemVer {
    return (
        isObject(value) &&
        typeof value.major === "number" &&
        typeof value.minor === "number" &&
        typeof value.patch === "number" &&
        (value.prerelease === undefined || typeof value.prerelease === "string") &&
        (value.build === undefined || typeof value.build === "string")
    );
}

export function isKairoRegistry(value: unknown): value is KairoRegistry {
    if (!isObject(value)) return false;
    const metadata = value.metadata;

    return (
        typeof value.kairoId === "string" &&
        typeof value.addonId === "string" &&
        typeof value.name === "string" &&
        typeof value.description === "string" &&
        isSemVer(value.version) &&
        isObject(metadata) &&
        isStringArray(metadata.authors) &&
        (metadata.url === undefined || typeof metadata.url === "string") &&
        (metadata.license === undefined || typeof metadata.license === "string") &&
        isStringRecord(value.dependencies) &&
        isStringRecord(value.optionalDependencies) &&
        isStringArray(value.tags)
    );
}
