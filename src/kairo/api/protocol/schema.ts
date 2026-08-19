import { createValidator, hasOnlyKeys, isInteger, isObject } from "../../utils/validate";

export type ApiCall = {
    readonly type: "send" | "request";
    readonly correlationId: string;
    readonly targetAddonId: string;
    readonly callerAddonId?: string;
    readonly apiName: string;
    readonly args: string;
    readonly timeout?: number;
    readonly timestamp: number;
};

export type ApiInvoke = {
    readonly type: "send" | "request";
    readonly correlationId: string;
    readonly callerAddonId: string;
    readonly apiName: string;
    readonly args: string;
    readonly timestamp: number;
};

export type ApiHandlerResponse = {
    readonly correlationId: string;
    readonly success: boolean;
    readonly result?: string;
    readonly error?: string;
    readonly timestamp: number;
};

export type ApiResultErrorType =
    | "API_NOT_FOUND"
    | "BEFORE_HOOK_EXECUTION"
    | "AFTER_HOOK_EXECUTION"
    | "HANDLER_EXECUTION"
    | "TIMEOUT"
    | "PROTOCOL_ERROR"
    | "HOST_SWITCHING";

export type ApiResult = {
    readonly correlationId: string;
    readonly success: boolean;
    readonly result?: string;
    readonly canceled?: true;
    readonly reason?: string;
    readonly errorType?: ApiResultErrorType;
    readonly error?: string;
    readonly timestamp: number;
};

const apiResultErrorTypes = new Set<ApiResultErrorType>([
    "API_NOT_FOUND",
    "BEFORE_HOOK_EXECUTION",
    "AFTER_HOOK_EXECUTION",
    "HANDLER_EXECUTION",
    "TIMEOUT",
    "PROTOCOL_ERROR",
    "HOST_SWITCHING",
]);

export const validateApiCall = createValidator<ApiCall>(
    "ApiCall",
    (value) =>
        isObject(value) &&
        hasOnlyKeys(value, [
            "type",
            "correlationId",
            "targetAddonId",
            "callerAddonId",
            "apiName",
            "args",
            "timeout",
            "timestamp",
        ]) &&
        (value.type === "send" || value.type === "request") &&
        typeof value.correlationId === "string" &&
        typeof value.targetAddonId === "string" &&
        (value.callerAddonId === undefined || typeof value.callerAddonId === "string") &&
        typeof value.apiName === "string" &&
        typeof value.args === "string" &&
        (value.timeout === undefined || isInteger(value.timeout, 1)) &&
        isInteger(value.timestamp, 0),
);

export const validateApiHandlerResponse = createValidator<ApiHandlerResponse>(
    "ApiHandlerResponse",
    (value) =>
        isObject(value) &&
        hasOnlyKeys(value, ["correlationId", "success", "result", "error", "timestamp"]) &&
        typeof value.correlationId === "string" &&
        typeof value.success === "boolean" &&
        (value.result === undefined || typeof value.result === "string") &&
        (value.error === undefined || typeof value.error === "string") &&
        isInteger(value.timestamp, 0),
);

export const validateApiResult = createValidator<ApiResult>(
    "ApiResult",
    (value) =>
        isObject(value) &&
        hasOnlyKeys(value, [
            "correlationId",
            "success",
            "result",
            "canceled",
            "reason",
            "errorType",
            "error",
            "timestamp",
        ]) &&
        typeof value.correlationId === "string" &&
        typeof value.success === "boolean" &&
        (value.result === undefined || typeof value.result === "string") &&
        (value.canceled === undefined || value.canceled === true) &&
        (value.reason === undefined || typeof value.reason === "string") &&
        (value.errorType === undefined ||
            apiResultErrorTypes.has(value.errorType as ApiResultErrorType)) &&
        (value.error === undefined || typeof value.error === "string") &&
        isInteger(value.timestamp, 0),
);
