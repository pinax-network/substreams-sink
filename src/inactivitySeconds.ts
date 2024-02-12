import type { BlockEmitter } from "@substreams/node";
import { setTimeout } from "timers/promises";
import { logger } from "./logger.js";

const CHECK_INACTIVITY_INTERVAL = 1000;

export function onInactivitySeconds(
    emitter: BlockEmitter,
    inactivitySeconds: number,
    hasStopBlock: boolean
) {
    let lastUpdate = now();
    let isFinished = false;
    let lastTotalBytesRead = 0n;
    let currentTotalBytesRead = 0n;

    async function checkInactivity() {
        // Refresh lastUpdate/lastTotalBytesRead if totalBytesRead is increasing
        if (currentTotalBytesRead > lastTotalBytesRead) {
            lastUpdate = now();
            lastTotalBytesRead = currentTotalBytesRead;
        }

        if (now() - lastUpdate > inactivitySeconds) {
            logger.error(
                `Process will exit due to inactivity for ${inactivitySeconds} seconds`
            );
            process.exit(1); // force quit
        }
        if (isFinished) return; // exit out of the loop
        await setTimeout(CHECK_INACTIVITY_INTERVAL);
        checkInactivity();
    }

    // Check clock events for inactivity after starting
    emitter.on("clock", (clock) => {
        lastUpdate = now();
        if (hasStopBlock && clock.number >= emitter.request.stopBlockNum - 1n) {
            isFinished = true;
        }
    });

    // Check progress events for inactivity after starting
    emitter.on("progress", (progress) => {
        if (progress.processedBytes) {
            currentTotalBytesRead = progress.processedBytes.totalBytesRead;
        }
    });

    checkInactivity();
}

export function now() {
    return Math.floor(new Date().getTime() / 1000); // in seconds
}
