import { createRegistry, createRequest, createModuleHashHex } from "@substreams/core";
import { createNodeTransport } from "@substreams/node/createNodeTransport";
import { BlockEmitter } from "@substreams/node";
import { readPackage } from "@substreams/manifest";
import { setTimeout } from "timers/promises";
import type { RunOptions } from "./commander.js";
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

    // Substreams endpoint
    let baseUrl = options.substreamsEndpoint;
    const token = options.substreamsApiKey ?? options.substreamsApiToken;
    if ( token.includes(".")) throw new Error("JWT token is not longer supported, please use Substreams API key instead");

    // append https if not present
    if (baseUrl.match(/http/) === null) {
        baseUrl = `https://${baseUrl}`;
    }

    // User parameters
    const outputModule = options.moduleName;
    const startBlockNum = options.startBlock as any;
    const stopBlockNum = options.stopBlock as any;
    const params = options.params;
    const headers = options.headers;
    const startCursor = options.cursor;
    const productionMode = String(options.productionMode) === "true";
    const finalBlocksOnly = String(options.finalBlocksOnly) === "true";

    // Adding default headers
    headers.set("X-User-Agent", "substreams-sink");

    // Health check
    health();

    // Apply params
    if (params.length && substreamPackage.modules) {
        applyParams(params, substreamPackage.modules.modules);
    }

    // Connect Transport
    const registry = createRegistry(substreamPackage);
    const transport = createNodeTransport(baseUrl, token, registry, headers);
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

    // Adds delay before using sink
    await setTimeout(options.delayBeforeStart);

    // Stop on inactivity
    onInactivitySeconds(emitter, options.inactivitySeconds, stopBlockNum !== undefined);

    return { emitter, substreamPackage, moduleHash };
}