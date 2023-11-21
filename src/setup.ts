import { createRegistry, createRequest, createModuleHashHex, parseAuthorization } from "@substreams/core";
import { BlockEmitter, createDefaultTransport } from "@substreams/node";
import { readPackage } from "@substreams/manifest";
import { setTimeout } from "timers/promises";
import type { RunOptions } from "./commander.js";
import * as fileCursor from "./cursor/fileCursor.js";
import * as httpCursor from "./cursor/httpCursor.js";
import * as prometheus from "./prometheus.js";
import { logger } from "./logger.js";
import { onInactivitySeconds } from "./inactivitySeconds.js";
import { applyParams } from "./applyParams.js";
import { health } from "./health.js";

export async function setup(options: RunOptions) {
    // Configure logging with TSLog
    if (String(options.verbose) === "true") logger.enable();

    // Download Substream package
    const manifest = options.manifest;
    const substreamPackage = await readPackage(manifest);
    if (!substreamPackage.modules) throw new Error("No modules found in substream package");

    // auth API token
    // https://app.streamingfast.io/
    const token = await parseAuthorization(options.substreamsApiToken, options.authIssueUrl);
    let baseUrl = options.substreamsEndpoint;

    // append https if not present
    if ( baseUrl.match(/http/) === null ) {
        baseUrl = `https://${baseUrl}`;
    }

    // User parameters
    const outputModule = options.moduleName;
    const startBlockNum = options.startBlock as any;
    const stopBlockNum = options.stopBlock as any;
    const params = options.params;
    const headers = options.headers;
    const cursorPath = options.cursorPath;
    const httpCursorAuth = options.httpCursorAuth;
    const productionMode = String(options.productionMode) === "true";
    const finalBlocksOnly = String(options.finalBlocksOnly) === "true";

    // Adding default headers
    headers.set("User-Agent", "substreams-sink");

    // Health check
    health();

    // Apply params
    if (params.length && substreamPackage.modules) {
        applyParams(params, substreamPackage.modules.modules);
    }

    // Cursor
    const cursor = cursorPath.startsWith("http") ? httpCursor : fileCursor;

    // Connect Transport
    const startCursor = await cursor.readCursor(cursorPath, httpCursorAuth);
    const registry = createRegistry(substreamPackage);
    const transport = createDefaultTransport(baseUrl, token, registry, headers);
    const request = createRequest({
        substreamPackage,
        outputModule,
        startBlockNum,
        stopBlockNum,
        productionMode,
        startCursor,
        finalBlocksOnly,
    });

    // Substreams Block Emitter
    const emitter = new BlockEmitter(transport, request, registry);

    // Module hash
    const moduleHash = await createModuleHashHex(substreamPackage.modules, outputModule);

    // Handle Prometheus Metrics
    if (String(options.collectDefaultMetrics) === "true") {
        prometheus.client.collectDefaultMetrics({ labels: options.metricsLabels });
    }
    prometheus.handleManifest(emitter, moduleHash, options);
    prometheus.onPrometheusMetrics(emitter);

    // Save new cursor on each new block emitted
    cursor.onCursor(emitter, cursorPath);

    // Adds delay before using sink
    await setTimeout(options.delayBeforeStart);

    // Stop on inactivity
    onInactivitySeconds(emitter, options.inactivitySeconds, stopBlockNum !== undefined);

    return { emitter, substreamPackage, moduleHash, startCursor };
}