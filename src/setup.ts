import { createRegistry, createRequest, createModuleHashHex, parseAuthorization } from "@substreams/core";
import { BlockEmitter, createDefaultTransport } from "@substreams/node";
import { readPackage } from "@substreams/manifest";
import { setTimeout } from "timers/promises";

import type { RunOptions } from "./commander.js";
import * as fileCursor from "./cursor/fileCursor.js";
import * as httpCursor from "./cursor/httpCursor.js";
import * as prometheus from "./prometheus.js";
import { logger } from "./logger.js";
import { onRestartInactivitySeconds } from "./restartInactivitySeconds.js";
import { applyParams } from "./applyParams.js";

export async function setup(options: RunOptions) {
    // Configure logging with TSLog
    if (options.verbose) logger.enable();

    // Download Substream package
    const manifest = options.manifest;
    const substreamPackage = await readPackage(manifest);
    if (!substreamPackage.modules) throw new Error("No modules found in substream package");

    // auth API token
    // https://app.streamingfast.io/
    const token = await parseAuthorization(options.substreamsApiToken, options.authIssueUrl);
    const baseUrl = options.substreamsEndpoint;

    // User parameters
    const outputModule = options.moduleName;
    const startBlockNum = options.startBlock as any;
    const stopBlockNum = options.stopBlock as any;
    const params = options.params;
    const headers = options.headers;
    const cursorPath = options.cursorPath;
    const productionMode = !options.disableProductionMode;

    // Adding default headers
    headers.set("User-Agent", "substreams-sink");

    // Apply params
    if (params.length && substreamPackage.modules) {
        applyParams(params, substreamPackage.modules.modules);
    }

    // Cursor
    const cursor = cursorPath.startsWith("http") ? httpCursor : fileCursor;

    // Connect Transport
    const startCursor = await cursor.readCursor(cursorPath);
    const registry = createRegistry(substreamPackage);
    const transport = createDefaultTransport(baseUrl, token, registry, headers);
    const request = createRequest({
        substreamPackage,
        outputModule,
        startBlockNum,
        stopBlockNum,
        productionMode,
        startCursor,
    });

    // Substreams Block Emitter
    const emitter = new BlockEmitter(transport, request, registry);

    // Module hash
    const moduleHash = await createModuleHashHex(substreamPackage.modules, outputModule);

    // Handle Prometheus Metrics
    if (options.collectDefaultMetrics) {
        prometheus.client.collectDefaultMetrics({ labels: options.metricsLabels });
    }
    prometheus.handleManifest(emitter, moduleHash, options);
    prometheus.onPrometheusMetrics(emitter);

    // Save new cursor on each new block emitted
    cursor.onCursor(emitter, cursorPath);

    // Adds delay before using sink
    await setTimeout(options.delayBeforeStart);

    // Restart on inactivity
    // only activate once first cursor is received
    emitter.once("cursor", () => {
        onRestartInactivitySeconds(emitter, options.restartInactivitySeconds);
    });

    return { emitter, substreamPackage, moduleHash, startCursor };
}