import * as fs from "node:fs";
import { BlockEmitter, createDefaultTransport } from "@substreams/node";
import type { BlockScopedData, Package } from "@substreams/core/proto";
import { applyParams, createRegistry, createRequest, } from "@substreams/core";
import dotenv from "dotenv";

import {
    DEFAULT_SUBSTREAMS_API_TOKEN_ENV,
    DEFAULT_CURSOR_FILE,
    DEFAULT_PRODUCTION_MODE,
    DEFAULT_VERBOSE,
    DEFAULT_PROMETHEUS_ADDRESS,
    DEFAULT_PROMETHEUS_PORT,
    DEFAULT_METRICS_DISABLED as DEFAULT_METRICS_DISABLED,
    type RunOptions,
} from "./cli.js";
import { logger } from "./logger.js";
import { listen, updateBlockDataMetrics, updateClockMetrics } from "./prometheus.js";

dotenv.config();

export function run(substreamPackage: Package, options: RunOptions) {
    if (!substreamPackage.modules) throw new Error("Unable to create Substream Package");

    // Required
    const substreamsEndpoint = options.substreamsEndpoint;
    const moduleName = options.moduleName;

    // Auth
    const substreamsApiTokenEnvvar = options.substreamsApiTokenEnvvar ?? DEFAULT_SUBSTREAMS_API_TOKEN_ENV;
    const substreamsApiToken = options.substreamsApiToken ?? process ? process.env[substreamsApiTokenEnvvar] : '';
    if (!substreamsApiToken) throw new Error('[substreams-api-token] is required');

    // Read cursor file
    const cursorFile = options.cursorFile ?? DEFAULT_CURSOR_FILE;
    let startCursor = fs.existsSync(cursorFile) ? fs.readFileSync(cursorFile, 'utf8') : "";

    // Optional
    const startBlock = options.startBlock;
    const stopBlock = options.stopBlock;
    const productionMode = options.productionMode ?? DEFAULT_PRODUCTION_MODE;

    // Logger options
    const verbose = options.verbose ?? DEFAULT_VERBOSE;
    if (verbose) logger.enable();

    // Prometheus Metrics
    const metricsListenAddress = options.metricsListenAddress ?? DEFAULT_PROMETHEUS_ADDRESS;
    const metricsListenPort = options.metricsListenPort ?? DEFAULT_PROMETHEUS_PORT;
    const metricsDisabled = options.metricsDisabled ?? DEFAULT_METRICS_DISABLED;
    if (!metricsDisabled) listen(metricsListenPort, metricsListenAddress);

    // Apply params
    if (options.params.length) applyParams(options.params, substreamPackage.modules.modules);

    // Connect Transport
    const registry = createRegistry(substreamPackage);
    const transport = createDefaultTransport(substreamsEndpoint, substreamsApiToken, registry);
    const request = createRequest({
        substreamPackage,
        outputModule: moduleName!,
        startBlockNum: startBlock ?? '-1' as any,
        stopBlockNum: stopBlock as any,
        productionMode: productionMode,
        startCursor,
    });

    // Block Emitter
    const emitter = new BlockEmitter(transport, request, registry);

    // Metrics
    if (!metricsDisabled) {
        emitter.on("block", (block: BlockScopedData) => {
            updateBlockDataMetrics(block);
            if (block.clock) updateClockMetrics(block.clock);
        });
    }

    return emitter;
}
