import { createRegistry, createRequest, applyParams, createModuleHashHex, parseAuthorization } from "@substreams/core";
import { BlockEmitter, createDefaultTransport } from "@substreams/node";
import { readPackage } from "@substreams/manifest";
import { setTimeout } from "timers/promises";

import type { RunOptions } from "./commander.js";
import * as cursor from "./cursor.js";
import * as prometheus from "./prometheus.js";
import { logger } from "./logger.js";

export async function setup(options: RunOptions, pkg: { name: string }) {
    // Configure logging with TSLog
    if (options.verbose) logger.enable();
    logger.setName(pkg.name);

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
    const cursorFile = options.cursorFile;
    const productionMode = !options.disableProductionMode;

    // Apply params
    if (params.length && substreamPackage.modules) {
        applyParams(params, substreamPackage.modules.modules);
    }

    // Connect Transport
    const startCursor = cursor.readCursor(cursorFile);
    const registry = createRegistry(substreamPackage);
    const transport = createDefaultTransport(baseUrl, token, registry);
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
    cursor.onCursor(emitter, cursorFile);

    // Adds delay before using sink
    await setTimeout(options.delayBeforeStart);

    return { emitter, substreamPackage, moduleHash, startCursor };
}