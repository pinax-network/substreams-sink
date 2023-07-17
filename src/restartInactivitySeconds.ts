import type { BlockEmitter } from "@substreams/node";
import { logger } from "./logger.js";

export function onRestartInactivitySeconds(emitter: BlockEmitter, restartInactivitySeconds: number) {
    let lastUpdate = now();
    emitter.on("cursor", () => {
        const dif = Math.abs(now() - lastUpdate);
        if (dif > restartInactivitySeconds) {
            logger.error(`Restarting due to inactivity for ${dif} seconds`);
            process.exit(1);
        }
        lastUpdate = now();
    });
}

export function now() {
    return Math.floor(new Date().getTime() / 1000); // in seconds
}
