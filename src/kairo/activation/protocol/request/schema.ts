export type ActivationRequest = {
    readonly timestamp: number;
    readonly action: "activate" | "deactivate";
};
