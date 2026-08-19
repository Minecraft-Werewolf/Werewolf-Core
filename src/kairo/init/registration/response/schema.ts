import type { KairoRegistry } from "@kairo-js/router";
import {
    createValidator,
    hasOnlyKeys,
    isInteger,
    isKairoRegistry,
    isObject,
} from "../../../utils/validate";

export type RegistrationResponse = {
    readonly kairoRegistry: KairoRegistry;
    readonly timestamp: number;
};

export const validateRegistrationResponse = createValidator<RegistrationResponse>(
    "RegistrationResponse",
    (value) =>
        isObject(value) &&
        hasOnlyKeys(value, ["kairoRegistry", "timestamp"]) &&
        isKairoRegistry(value.kairoRegistry) &&
        isInteger(value.timestamp, 0),
);
