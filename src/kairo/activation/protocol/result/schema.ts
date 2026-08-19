export type ActivationResult = {
    readonly kairoId: string;
    readonly status: "success" | "failure" | "timeout";
    readonly action: "activate" | "deactivate";
    readonly reason?: string;
};
