import type { BlockEmitter } from "@substreams/node";
import { setTimeout } from "timers/promises";
import { logger } from "./logger.js";

const CHECK_INACTIVITY_INTERVAL = 1000;

export function onRestartInactivitySeconds(emitter: BlockEmitter, restartInactivitySeconds: number) {
    let lastUpdate = now();
    let isStarted = false;
    let isFinished = false;

    async function checkInactivity() {
        if (now() - lastUpdate > restartInactivitySeconds) {
            if (!isStarted) return;
            logger.error(`Restarting due to inactivity for ${restartInactivitySeconds} seconds`);
            process.exit(1);
        }
        if (isFinished) return;
        await setTimeout(CHECK_INACTIVITY_INTERVAL);
        checkInactivity();
    }

    emitter.on("cursor", () => {
        isStarted = true;
        lastUpdate = now();
    });

    emitter.on("block", (block) => {
        if (block.clock?.number === emitter.request.stopBlockNum - 1n) {
            isFinished = true;
        };
    });
    checkInactivity();
}

export function now() {
    return Math.floor(new Date().getTime() / 1000); // in seconds
}
