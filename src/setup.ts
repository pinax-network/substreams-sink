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
    if (options.verbose) logger.enable();

    // Download Substream package
    const manifest = options.manifest;
    const substreamPackage = await readPackage(manifest);
    if (!substreamPackage.modules) throw new Error("No modules found in substream package");

    // Substreams endpoint
    let baseUrl = options.substreamsEndpoint;
    const token = options.substreamsApiKey ?? options.substreamsApiToken;
    if ( token?.includes(".")) throw new Error("JWT token is not longer supported, please use Substreams API key instead");

    // User parameters
    const startBlockNum = options.startBlock as any;
    const stopBlockNum = options.stopBlock;
    const { moduleName: outputModule, cursor: startCursor } = options; // renamed otions
    const { params, headers, productionMode, finalBlocksOnly, plaintext } = options;

    // append https/http if not present
    if (!baseUrl.startsWith("http")) {
        baseUrl = `${plaintext ? "http" : "https"}://${baseUrl}`;
    }
    if ( plaintext && baseUrl.startsWith("https")) {
        throw new Error("--plaintext mode is not supported with https");
    }

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