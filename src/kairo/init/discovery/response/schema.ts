import { createValidator, hasOnlyKeys, isInteger, isObject } from "../../../utils/validate";

export type DiscoveryResponse = {
    readonly kairoId: string;
    readonly timestamp: number;
};

export const validateDiscoveryResponse = createValidator<DiscoveryResponse>(
    "DiscoveryResponse",
    (value) =>
        isObject(value) &&
        hasOnlyKeys(value, ["kairoId", "timestamp"]) &&
        typeof value.kairoId === "string" &&
        isInteger(value.timestamp, 0),
);
