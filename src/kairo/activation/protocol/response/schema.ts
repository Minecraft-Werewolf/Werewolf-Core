import { createValidator, hasOnlyKeys, isInteger, isObject } from "../../../utils/validate";

export type ActivationResponse = {
    readonly timestamp: number;
    readonly kairoId: string;
    readonly status: "success" | "failure";
    readonly action: "activate" | "deactivate";
    readonly reason?: string;
};

export const validateActivationResponse = createValidator<ActivationResponse>(
    "ActivationResponse",
    (value) =>
        isObject(value) &&
        hasOnlyKeys(value, ["timestamp", "kairoId", "status", "action", "reason"]) &&
        isInteger(value.timestamp, 0) &&
        typeof value.kairoId === "string" &&
        (value.status === "success" || value.status === "failure") &&
        (value.action === "activate" || value.action === "deactivate") &&
        (value.reason === undefined || typeof value.reason === "string"),
);
