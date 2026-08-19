export type RegistrationRequest = {
    readonly approvals: readonly string[];
    readonly rejects: readonly string[];
    readonly timestamp: number;
};
