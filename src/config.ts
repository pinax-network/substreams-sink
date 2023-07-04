import "dotenv/config";

// default options
export const DEFAULT_HOSTNAME = "localhost";
export const DEFAULT_PORT = 9102;
export const DEFAULT_SUBSTREAMS_API_TOKEN_ENV = "SUBSTREAMS_API_TOKEN";
export const DEFAULT_CURSOR_FILE = "cursor.lock";
export const DEFAULT_VERBOSE = false;
export const DEFAULT_RESTART_INACTIVITY_SECONDS = 60;
export const DEFAULT_DISABLE_PRODUCTION_MODE = false;
export const DEFAULT_DELAY_BEFORE_START = 0;
export const DEFAULT_SUBSTREAMS_ENDPOINT = "https://mainnet.eth.streamingfast.io:443";

// optional
export const HOSTNAME = process.env.HOSTNAME ?? DEFAULT_HOSTNAME;
export const PORT = parseInt(process.env.PORT ?? String(DEFAULT_PORT));
export const VERBOSE = JSON.parse(process.env.VERBOSE ?? String(DEFAULT_VERBOSE)) as boolean;
export const DISABLE_PRODUCTION_MODE = JSON.parse(process.env.DISABLE_PRODUCTION_MODE ?? String(DEFAULT_DISABLE_PRODUCTION_MODE)) as boolean;
export const DELAY_BEFORE_START = parseInt(process.env.DELAY_BEFORE_START ?? String(DEFAULT_DELAY_BEFORE_START));
export const CURSOR_FILE = process.env.CURSOR_FILE ?? DEFAULT_CURSOR_FILE;
export const SUBSTREAMS_API_TOKEN = process.env.SUBSTREAMS_API_TOKEN;
export const SUBSTREAMS_API_TOKEN_ENVVAR = process.env.SUBSTREAMS_API_TOKEN_ENVVAR ?? DEFAULT_SUBSTREAMS_API_TOKEN_ENV;
export const SUBSTREAMS_ENDPOINT = process.env.SUBSTREAMS_ENDPOINT ?? DEFAULT_SUBSTREAMS_ENDPOINT;
export const MANIFEST = process.env.MANIFEST;
export const MODULE_NAME = process.env.MODULE_NAME;
export const OUTPUT_MODULE = process.env.OUTPUT_MODULE; // fallback envvar for OUTPUT_MODULE
export const START_BLOCK = process.env.START_BLOCK;
export const STOP_BLOCK = process.env.STOP_BLOCK;
export const PARAMS = process.env.PARAMS;

// helpers
export function getToken(options: { substreamsApiToken?: string, substreamsApiTokenEnvvar?: string } = {}) {
    const substreamsApiTokenEnvvar = options.substreamsApiTokenEnvvar ?? SUBSTREAMS_API_TOKEN_ENVVAR;
    const token = options.substreamsApiToken ?? SUBSTREAMS_API_TOKEN ?? process.env[substreamsApiTokenEnvvar || ""];
    if (!token) throw new Error("SUBSTREAMS_API_TOKEN is require");
    return token;
}

export function getBaseUrl(options: { substreamsEndpoint?: string } = {}) {
    return options.substreamsEndpoint ?? SUBSTREAMS_ENDPOINT;
}

export function getManifest(options: { manifest?: string } = {}) {
    const manifest = options.manifest ?? MANIFEST;
    if (!manifest) throw new Error("MANIFEST is require");
    return manifest;
}

export function getModuleName(options: { moduleName?: string } = {}) {
    const moduleName = options.moduleName ?? MODULE_NAME ?? OUTPUT_MODULE;
    if (!moduleName) throw new Error("MODULE_NAME or OUTPUT_MODULE is require");
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