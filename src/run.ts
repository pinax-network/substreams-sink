import * as fs from "node:fs";
import { Substreams } from "substreams";
import dotenv from "dotenv";
import { DEFAULT_SUBSTREAMS_ENDPOINT, DEFAULT_SUBSTREAMS_API_TOKEN_ENV, DEFAULT_CURSOR_FILE, DEFAULT_PRODUCTION_MODE, DEFAULT_VERBOSE, DEFAULT_PROMETHEUS_ADDRESS, DEFAULT_PROMETHEUS_PORT } from "./constants.js";
import { logger } from "./logger.js";
import { listen } from "./prometheus.js";
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
}

export function run(spkg: Uint8Array, outputModule: string, options: RunOptions = {}) {
    // Substreams options
    const substreamsEndpoint = options.substreamsEndpoint ?? DEFAULT_SUBSTREAMS_ENDPOINT;
    const substreams_api_token_envvar = options.substreamsApiTokenEnvvar ?? DEFAULT_SUBSTREAMS_API_TOKEN_ENV;
    const substreams_api_token = options.substreamsApiToken ?? process ? process.env[substreams_api_token_envvar] : '';
    const cursorFile = options.cursorFile ?? DEFAULT_CURSOR_FILE;
    const productionMode = options.productionMode ?? DEFAULT_PRODUCTION_MODE;
    const verbose = options.verbose ?? DEFAULT_VERBOSE;

    let metricsListenAddress = options.metricsListenAddress;
    let metricsListenPort = options.metricsListenPort;

    // Prometheus options
    if (metricsListenAddress && !metricsListenPort) {
        metricsListenPort = DEFAULT_PROMETHEUS_PORT;
    } else if (!metricsListenAddress && metricsListenPort) {
        metricsListenAddress = DEFAULT_PROMETHEUS_ADDRESS;
    } else if (metricsListenAddress && metricsListenPort) {
        listen(metricsListenPort, metricsListenAddress);
    }

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

    substreams.on("cursor", cursor => {
        if (options.cursorFile) {
            fs.writeFileSync(options.cursorFile, cursor);
        }
    });

    // Metrics 
    if (metricsListenAddress && metricsListenPort) {
        substreams.on("anyMessage", message => {
            // Update metrics
        });
    }

    return substreams;
}
