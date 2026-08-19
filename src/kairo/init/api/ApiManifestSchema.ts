import {
    createValidator,
    hasOnlyKeys,
    isInteger,
    isObject,
    isStringArray,
} from "../../utils/validate";

export type ApiManifestMessage = {
    readonly kairoId: string;
    readonly apis: readonly { readonly name: string }[];
    readonly hooks: readonly ApiManifestHookEntry[];
    readonly eventSubscriptions?: readonly {
        readonly emitterAddonId: string;
        readonly eventName: string;
    }[];
    readonly timestamp: number;
};

export type ApiManifest = Pick<ApiManifestMessage, "apis" | "hooks" | "eventSubscriptions">;

export type ApiManifestHookEntry = {
    readonly targetAddonId: string;
    readonly apiName: string;
    readonly priority: number;
    readonly phases: readonly string[];
    readonly declarationSequence: number;
    readonly hasRollback: boolean;
};

export const validateApiManifestMessage = createValidator<ApiManifestMessage>(
    "ApiManifestMessage",
    (value) =>
        isObject(value) &&
        hasOnlyKeys(value, ["kairoId", "apis", "hooks", "eventSubscriptions", "timestamp"]) &&
        typeof value.kairoId === "string" &&
        Array.isArray(value.apis) &&
        value.apis.every(
            (entry) =>
                isObject(entry) && hasOnlyKeys(entry, ["name"]) && typeof entry.name === "string",
        ) &&
        Array.isArray(value.hooks) &&
        value.hooks.every(isApiManifestHookEntry) &&
        (value.eventSubscriptions === undefined ||
            (Array.isArray(value.eventSubscriptions) &&
                value.eventSubscriptions.every(
                    (entry) =>
                        isObject(entry) &&
                        hasOnlyKeys(entry, ["emitterAddonId", "eventName"]) &&
                        typeof entry.emitterAddonId === "string" &&
                        typeof entry.eventName === "string",
                ))) &&
        isInteger(value.timestamp, 0),
);

function isApiManifestHookEntry(value: unknown): value is ApiManifestHookEntry {
    return (
        isObject(value) &&
        hasOnlyKeys(value, [
            "targetAddonId",
            "apiName",
            "priority",
            "phases",
            "declarationSequence",
            "hasRollback",
        ]) &&
        typeof value.targetAddonId === "string" &&
        typeof value.apiName === "string" &&
        isInteger(value.priority, -2147483648, 2147483647) &&
        isStringArray(value.phases) &&
        isInteger(value.declarationSequence, 0) &&
        typeof value.hasRollback === "boolean"
    );
}
