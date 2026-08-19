export type RegistrationResult = {
    readonly kairoId: string;
    readonly success: boolean;
    readonly reason?: string;
    readonly timestamp: number;
};
