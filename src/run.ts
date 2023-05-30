import * as fs from "node:fs";
import { BlockScopedData, Clock, Substreams } from "substreams";
import dotenv from "dotenv";
import { DEFAULT_SUBSTREAMS_ENDPOINT, DEFAULT_SUBSTREAMS_API_TOKEN_ENV, DEFAULT_CURSOR_FILE, DEFAULT_PRODUCTION_MODE, DEFAULT_VERBOSE, DEFAULT_PROMETHEUS_ADDRESS, DEFAULT_PROMETHEUS_PORT, DEFAULT_METRICS_DISABLED as DEFAULT_METRICS_DISABLED } from "./constants.js";
import { logger } from "./logger.js";
import { listen, updateBlockDataMetrics, updateClockMetrics } from "./prometheus.js";
dotenv.config();

export interface RunOptions {
    startBlock?: string,
    stopBlock?: string,
    substreamsEndpoint?: string,
    substreamsApiTokenEnvvar?: string,
    substreamsApiToken?: string,
    delayBeforeStart?: string,
    cursorFile?: string,
    startCursor?: string,
    productionMode?: boolean,
    verbose?: boolean,
    metricsListenAddress?: string,
    metricsListenPort?: number,
    metricsDisabled?: boolean,
    params?: string[],
}

export function run(spkg: Uint8Array, outputModule: string, options: RunOptions = {}) {
    // Substreams options
    const substreamsEndpoint = options.substreamsEndpoint ?? DEFAULT_SUBSTREAMS_ENDPOINT;
    const substreams_api_token_envvar = options.substreamsApiTokenEnvvar ?? DEFAULT_SUBSTREAMS_API_TOKEN_ENV;
    const substreams_api_token = options.substreamsApiToken ?? process ? process.env[substreams_api_token_envvar] : '';
    const cursorFile = options.cursorFile ?? DEFAULT_CURSOR_FILE;
    const productionMode = options.productionMode ?? DEFAULT_PRODUCTION_MODE;
    const verbose = options.verbose ?? DEFAULT_VERBOSE;

    // Prometheus Metrics
    const metricsListenAddress = options.metricsListenAddress ?? DEFAULT_PROMETHEUS_ADDRESS;
    const metricsListenPort = options.metricsListenPort ?? DEFAULT_PROMETHEUS_PORT;
    const metricsDisabled = options.metricsDisabled ?? DEFAULT_METRICS_DISABLED;

    if (!metricsDisabled) listen(metricsListenPort, metricsListenAddress);

    // Logger options
    if (verbose) logger.silent = false;

    // Required
    if (!outputModule) throw new Error('[output-module] is required');
    if (!substreams_api_token) throw new Error('[substreams-api-token] is required');

    // read cursor file
    let startCursor = fs.existsSync(cursorFile) ? fs.readFileSync(cursorFile, 'utf8') : "";
    logger.info("run", { startCursor, outputModule, options });

    // Initialize Substreams
    const substreams = new Substreams(spkg, outputModule, {
        host: substreamsEndpoint,
        startBlockNum: options.startBlock,
        stopBlockNum: options.stopBlock,
        startCursor,
        authorization: substreams_api_token,
        productionMode,
    });

    // inject params
    for (const param of options?.params ?? []) {
        const parts = param.split("=")
        const moduleName = parts[0]
        const value = param.replace(`${moduleName}=`, "");
        logger.info("param", { moduleName, value });
        substreams.param(value, moduleName);
    }

    substreams.on("cursor", cursor => {
        if (options.cursorFile) {
            fs.writeFileSync(options.cursorFile, cursor);
        }
    });

    // Metrics
    if (!metricsDisabled) {
        substreams.on("clock", (clock: Clock) => {
            updateClockMetrics(clock);
        });
        substreams.on("block", (block: BlockScopedData) => {
            updateBlockDataMetrics(block);
        });
        // substreams.on("progress", (progress: ModulesProgress) => { });
        // substreams.on("undo", (undo: BlockUndoSignal) => { });
    }

    return substreams;
}
