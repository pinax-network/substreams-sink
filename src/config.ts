import "dotenv/config";

// default options
export const DEFAULT_HOSTNAME = "localhost";
export const DEFAULT_PORT = 9102;
export const DEFAULT_SUBSTREAMS_API_TOKEN_ENV = "SUBSTREAMS_API_TOKEN";
export const DEFAULT_CURSOR_FILE = "cursor.lock";
export const DEFAULT_VERBOSE = false;
export const DEFAULT_RESTART_INACTIVITY_SECONDS = 60;
export const DEFAULT_PRODUCTION_MODE = true;
export const DEFAULT_DELAY_BEFORE_START = 0;
export const DEFAULT_METRICS_LABELS = {};

// optional
export const HOSTNAME = process.env.HOSTNAME ?? DEFAULT_HOSTNAME;
export const PORT = parseInt(process.env.PORT ?? String(DEFAULT_PORT));
export const VERBOSE = JSON.parse(process.env.VERBOSE ?? String(DEFAULT_VERBOSE)) as boolean;
export const PRODUCTION_MODE = JSON.parse(process.env.PRODUCTION_MODE ?? String(DEFAULT_PRODUCTION_MODE)) as boolean;
export const DELAY_BEFORE_START = parseInt(process.env.DELAY_BEFORE_START ?? String(DEFAULT_DELAY_BEFORE_START));
export const CURSOR_FILE = process.env.CURSOR_FILE ?? DEFAULT_CURSOR_FILE;
export const METRICS_LABELS = process.env.METRICS_LABELS ?? DEFAULT_METRICS_LABELS;
export const SUBSTREAMS_API_TOKEN = process.env.SUBSTREAMS_API_TOKEN;
export const SUBSTREAMS_API_TOKEN_ENVVAR = process.env.SUBSTREAMS_API_TOKEN_ENVVAR ?? DEFAULT_SUBSTREAMS_API_TOKEN_ENV;
export const SUBSTREAMS_ENDPOINT = process.env.SUBSTREAMS_ENDPOINT;
export const MANIFEST = process.env.MANIFEST;
export const MODULE_NAME = process.env.MODULE_NAME;
export const OUTPUT_MODULE = process.env.OUTPUT_MODULE; // fallback envvar for OUTPUT_MODULE
export const START_BLOCK = process.env.START_BLOCK;
export const STOP_BLOCK = process.env.STOP_BLOCK;
export const PARAMS = process.env.PARAMS;

// helpers
export function getToken(options: { substreamsApiToken?: string, substreamsApiTokenEnvvar?: string } = {}) {
    // CLI priority
    let token = options.substreamsApiToken;
    if (!token && options.substreamsApiTokenEnvvar) token = process.env[options.substreamsApiTokenEnvvar];

    // .env secondary
    if (!token) token = SUBSTREAMS_API_TOKEN;
    if (!token) token = process.env[SUBSTREAMS_API_TOKEN_ENVVAR];
    return token ?? ""; // allow to provide no token
}

export function getBaseUrl(options: { substreamsEndpoint?: string } = {}) {
    const baseUrl = options.substreamsEndpoint ?? SUBSTREAMS_ENDPOINT;
    if (!baseUrl) throw new Error("SUBSTREAMS_ENDPOINT is require");
    return baseUrl;
}

export function getManifest(options: { manifest?: string } = {}) {
    const manifest = options.manifest ?? MANIFEST;
    if (!manifest) throw new Error("MANIFEST is require");
    return manifest;
}

export function getModuleName(options: { moduleName?: string } = {}) {
    const moduleName = options.moduleName ?? MODULE_NAME ?? OUTPUT_MODULE;
    if (!moduleName) throw new Error("MODULE_NAME or OUTPUT_MODULE is required");
    return moduleName;
}

export function getStartBlock(options: { startBlock?: string } = {}): number | bigint | undefined {
    return options.startBlock ?? START_BLOCK ?? "-1" as any;
}

export function getStopBlock(options: { stopBlock?: string } = {}): number | bigint | `+${number}` | undefined {
    return options.stopBlock ?? STOP_BLOCK as any;
}

export function getCursorFile(options: { cursorFile?: string } = {}) {
    return options.cursorFile ?? CURSOR_FILE;
}

export function getVerbose(options: { verbose?: boolean } = {}) {
    return options.verbose ?? VERBOSE;
}

export function getParams(options: { params?: string[] } = {}) {
    return options.params ?? PARAMS?.split(",") ?? [];
}

export function getHostname(options: { hostname?: string } = {}) {
    return options.hostname ?? HOSTNAME;
}

export function getPort(options: { port?: number } = {}) {
    return options.port ?? PORT;
}

export function getMetricsLabels(options: { metricsLabels?: string[] } = {}) {
    return options.metricsLabels ?? METRICS_LABELS;
}

export function getProductionMode(options: { disableProductionMode?: boolean } = {}) {
    return options.disableProductionMode ?? PRODUCTION_MODE;
}

export function getDelayBeforeStart(options: { delayBeforeStart?: number } = {}) {
    return options.delayBeforeStart ?? DELAY_BEFORE_START;
}