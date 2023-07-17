import type { BlockEmitter } from "@substreams/node";
import { logger } from "./logger.js";

export function onRestartInactivitySeconds(emitter: BlockEmitter, restartInactivitySeconds: number) {
    let lastUpdate = now();
    emitter.on("cursor", () => {
        if (now() - lastUpdate > restartInactivitySeconds) {
            logger.error(`Restarting due to inactivity for ${restartInactivitySeconds} seconds`);
            process.exit(1);
        }
        lastUpdate = now();
    });
}

export function now() {
    return Math.floor(new Date().getTime() / 1000); // in seconds
}
