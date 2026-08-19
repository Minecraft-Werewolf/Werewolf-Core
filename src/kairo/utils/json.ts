export function safeJsonParse(message: string, error: () => Error): unknown {
    try {
        return JSON.parse(message);
    } catch {
        throw error();
    }
}
