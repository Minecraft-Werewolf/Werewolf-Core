import { createValidator, hasOnlyKeys, isInteger, isObject } from "../../utils/validate";

export type HookInvokeMessage = {
    readonly hookCorrelationId: string;
    readonly phase: "before" | "after" | "rollback";
    readonly targetAddonId: string;
    readonly apiName: string;
    readonly declarationSequence: number;
    readonly args: string;
    readonly result?: string;
    readonly rollbackData?: string;
    readonly callerAddonId: string;
    readonly callType: "send" | "request";
    readonly timestamp: number;
};

export type HookResponseMessage = {
    readonly hookCorrelationId: string;
    readonly outcome: "continue" | "cancel" | "cancel_with_result" | "failed";
    readonly modifiedArgs?: string;
    readonly cancelResult?: string;
    readonly rollbackData?: string;
    readonly modifiedResult?: string;
    readonly returnedArgs?: string;
    readonly error?: string;
    readonly timestamp: number;
};

export const validateHookResponseMessage = createValidator<HookResponseMessage>(
    "HookResponseMessage",
    (value) =>
        isObject(value) &&
        hasOnlyKeys(value, [
            "hookCorrelationId",
            "outcome",
            "modifiedArgs",
            "cancelResult",
            "rollbackData",
            "modifiedResult",
            "returnedArgs",
            "error",
            "timestamp",
        ]) &&
        typeof value.hookCorrelationId === "string" &&
        (value.outcome === "continue" ||
            value.outcome === "cancel" ||
            value.outcome === "cancel_with_result" ||
            value.outcome === "failed") &&
        (value.modifiedArgs === undefined || typeof value.modifiedArgs === "string") &&
        (value.cancelResult === undefined || typeof value.cancelResult === "string") &&
        (value.rollbackData === undefined || typeof value.rollbackData === "string") &&
        (value.modifiedResult === undefined || typeof value.modifiedResult === "string") &&
        (value.returnedArgs === undefined || typeof value.returnedArgs === "string") &&
        (value.error === undefined || typeof value.error === "string") &&
        isInteger(value.timestamp, 0),
);
