import type { BlockEmitter } from "@substreams/node";
import { setTimeout } from "timers/promises";
import { logger } from "./logger.js";

const CHECK_INACTIVITY_INTERVAL = 1000;

export function onRestartInactivitySeconds(emitter: BlockEmitter, restartInactivitySeconds: number) {
    let lastUpdate = now();
    let isFinished = false;

    async function checkInactivity() {
        if (now() - lastUpdate > restartInactivitySeconds) {
            logger.error(`Restarting due to inactivity for ${restartInactivitySeconds} seconds`);
            process.exit(1); // force quit
        }
        if (isFinished) return; // exit out of the loop
        await setTimeout(CHECK_INACTIVITY_INTERVAL);
        checkInactivity();
    }
    emitter.on("cursor", (_, clock) => {
        lastUpdate = now();
        if (clock.number >= emitter.request.stopBlockNum - 1n) {
            isFinished = true;
        };
    });
    checkInactivity();
}

export function now() {
    return Math.floor(new Date().getTime() / 1000); // in seconds
}
