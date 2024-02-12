import type { BlockEmitter } from "@substreams/node";
import { setTimeout } from "timers/promises";
import { logger } from "./logger.js";
import { substreams_sink_progress_message } from "./prometheus.js";

const CHECK_INACTIVITY_INTERVAL = 1000;

export function onInactivitySeconds(emitter: BlockEmitter, inactivitySeconds: number, hasStopBlock: boolean) {
    let lastUpdate = now();
    let isFinished = false;

    async function checkInactivity() {
        if (now() - lastUpdate > inactivitySeconds) {
            logger.error(`Process will exit due to inactivity for ${inactivitySeconds} seconds`);
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

    emitter.on("close", error => {
        if ( error ) {
            console.error(error);
            process.exit(1); // force quit
        }
        lastUpdate = now();
        isFinished = true;
    });

    emitter.on("fatalError", error => {
        console.error(error);
        process.exit(1); // force quit
    });

    // Check progress events for inactivity after starting
    emitter.on("progress", (progress) => {
        const totalBytesRead = Number(progress.processedBytes?.totalBytesRead ?? 0);
        if (totalBytesRead > 0) {
            lastUpdate = now();
            substreams_sink_progress_message?.inc(totalBytesRead);
        }
    });

    checkInactivity();
}

export function now() {
    return Math.floor(new Date().getTime() / 1000); // in seconds
}
