import { createRegistry, createRequest, applyParams } from "@substreams/core";
import { BlockEmitter, createDefaultTransport } from "@substreams/node";
import { readPackage } from "@substreams/manifest";
import type { RunOptions } from "./commander.js";
import * as cursor from "./cursor.js";
import * as config from "./config.js";
import * as prometheus from "./prometheus.js";
import { logger } from "./logger.js";

export async function setup(options: RunOptions, pkg: { name: string }) {
    // Configure logging with TSLog
    const verbose = config.getVerbose(options);
    if (verbose) logger.enable();
    logger.setName(pkg.name);

    // Download Substream package
    const manifest = config.getManifest(options);
    const substreamPackage = await readPackage(manifest);

    // auth API token
    // https://app.streamingfast.io/
    const token = config.getToken(options);
    const baseUrl = config.getBaseUrl(options);

    // User parameters
    const outputModule = config.getModuleName(options);
    const startBlockNum = config.getStartBlock(options);
    const stopBlockNum = config.getStopBlock(options);
    const params = config.getParams(options);
    const cursorFile = config.getCursorFile(options);
    const productionMode = config.getProductionMode(options);

    // Apply params
    if (params.length && substreamPackage.modules) {
        applyParams(params, substreamPackage.modules.modules);
    }

    // Connect Transport
    const registry = createRegistry(substreamPackage);
    const transport = createDefaultTransport(baseUrl, token, registry);
    const request = createRequest({
        substreamPackage,
        outputModule,
        startBlockNum,
        stopBlockNum,
        productionMode,
        startCursor: cursor.readCursor(cursorFile),
    });

    // Substreams Block Emitter
    const emitter = new BlockEmitter(transport, request, registry);

    // Handle Prometheus Metrics
    prometheus.onPrometheusMetrics(emitter);

    // Save new cursor on each new block emitted
    cursor.onCursor(emitter, cursorFile);

    return emitter;
}