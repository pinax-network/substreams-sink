import { createRegistry, createRequest, applyParams } from "@substreams/core";
import { BlockEmitter, createDefaultTransport } from "@substreams/node";
import { readPackage } from "@substreams/manifest";
import { setTimeout } from "timers/promises";

import type { RunOptions } from "./commander.js";
import * as cursor from "./cursor.js";
import * as prometheus from "./prometheus.js";
import { logger } from "./logger.js";

export async function setup(options: RunOptions, pkg: { name: string }) {
    // Configure logging with TSLog
    const verbose = options.verbose;
    if (verbose) logger.enable();
    logger.setName(pkg.name);

    // Download Substream package
    const manifest = options.manifest;
    const substreamPackage = await readPackage(manifest);

    // auth API token
    // https://app.streamingfast.io/
    const token = options.substreamsApiToken;
    const baseUrl = options.substreamsEndpoint;

    // User parameters
    const outputModule = options.moduleName;
    const startBlockNum = options.startBlock as any;
    const stopBlockNum = options.stopBlock as any;
    const params = options.params;
    const cursorFile = options.cursorFile;
    const productionMode = !options.disableProductionMode;
    const delayBeforeStart = options.delayBeforeStart;
    const collectDefaultMetrics = options.collectDefaultMetrics;
    const metricsLabels = options.metricsLabels;

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
    if (collectDefaultMetrics) prometheus.collectDefaultMetrics(metricsLabels);
    prometheus.onPrometheusMetrics(emitter);

    // Save new cursor on each new block emitted
    cursor.onCursor(emitter, cursorFile);

    // Adds delay before using sink
    await setTimeout(delayBeforeStart);


    return emitter;
}