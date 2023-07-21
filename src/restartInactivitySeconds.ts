import type { BlockEmitter } from "@substreams/node";
import { setTimeout } from "timers/promises";
import { logger } from "./logger.js";

const CHECK_INACTIVITY_INTERVAL = 1000;

export function onRestartInactivitySeconds(emitter: BlockEmitter, restartInactivitySeconds: number) {
    let lastUpdate = now();
    let isStarted = false;

    async function checkInactivity() {
        if (now() - lastUpdate > restartInactivitySeconds) {
            if (!isStarted) return;
            logger.error(`Restarting due to inactivity for ${restartInactivitySeconds} seconds`);
            process.exit(1);
        }
        await setTimeout(CHECK_INACTIVITY_INTERVAL);
        checkInactivity();
    }

    emitter.on("cursor", () => {
        isStarted = true;
        lastUpdate = now();
    });
    checkInactivity();
}

export function now() {
    return Math.floor(new Date().getTime() / 1000); // in seconds
}
