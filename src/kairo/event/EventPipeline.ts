import type { KairoRuntime } from "../../minecraft/KairoRuntime";
import type { KairoWorldState } from "../activation/types/world";
import { AddonState } from "../activation/types/state";
import type { KairoRegistryWithManifest } from "../KairoRegistryIndex";
import type { Disposable } from "@kairo-js/router";
import { safeJsonParse } from "../utils/json";
import { createValidator, hasOnlyKeys, isInteger, isObject } from "../utils/validate";

type EventEmitMessage = {
    readonly emitterAddonId: string;
    readonly eventName: string;
    readonly payload: string;
    readonly timestamp: number;
};

const validateEventEmitMessage = createValidator<EventEmitMessage>(
    "EventEmitMessage",
    (value) =>
        isObject(value) &&
        hasOnlyKeys(value, ["emitterAddonId", "eventName", "payload", "timestamp"]) &&
        typeof value.emitterAddonId === "string" &&
        typeof value.eventName === "string" &&
        typeof value.payload === "string" &&
        isInteger(value.timestamp, 0),
);

export class EventPipeline implements Disposable {
    private readonly routingTable = new Map<string, Map<string, string[]>>();
    private world?: KairoWorldState;
    private receiver?: Disposable;
    private disposed = false;

    constructor(private readonly runtime: KairoRuntime) {}

    initialize(registries: readonly KairoRegistryWithManifest[]): void {
        for (const { registry, manifest } of registries) {
            for (const sub of manifest.eventSubscriptions ?? []) {
                let byName = this.routingTable.get(sub.emitterAddonId);
                if (!byName) {
                    byName = new Map();
                    this.routingTable.set(sub.emitterAddonId, byName);
                }
                const subs = byName.get(sub.eventName) ?? [];
                subs.push(registry.kairoId);
                byName.set(sub.eventName, subs);
            }
        }

        this.receiver = this.runtime.receive((id, message) => {
            if (id !== "kairo:event-emit") return;
            this.handleEmit(message);
        });
    }

    setWorld(world: KairoWorldState): void {
        this.world = world;
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.receiver?.dispose();
        this.receiver = undefined;
    }

    private handleEmit(rawMessage: string): void {
        const world = this.world;
        if (!world) return;

        let msg: EventEmitMessage;
        try {
            const parsed = safeJsonParse(rawMessage, () => new Error("parse failed"));
            if (!validateEventEmitMessage(parsed)) return;
            msg = parsed;
        } catch {
            return;
        }

        const subscribers = this.routingTable.get(msg.emitterAddonId)?.get(msg.eventName) ?? [];

        for (const subscriberKairoId of subscribers) {
            const rt = world.runtimes.get(subscriberKairoId);
            if (rt?.state !== AddonState.ACTIVE) continue;

            try {
                this.runtime.send(`${subscriberKairoId}:event-deliver`, rawMessage);
            } catch {}
        }
    }
}
