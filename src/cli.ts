import { Command } from "commander";

export interface RunOptions {
    startBlock?: string;
    stopBlock?: string;
    substreamsEndpoint: string;
    manifest?: string;
    spkg?: string;
    substreamsApiTokenEnvvar: string;
    substreamsApiToken?: string;
    delayBeforeStart?: string;
    cursorFile: string;
    productionMode: boolean;
    verbose: boolean;
    metricsListenAddress: string;
    metricsListenPort: number;
    metricsDisabled: boolean;
    chain?: string;
    params: string[];
    moduleName?: string;
}

// default substreams options
export const DEFAULT_SUBSTREAMS_API_TOKEN_ENV = "SUBSTREAMS_API_TOKEN";
export const DEFAULT_CURSOR_FILE = "cursor.lock";
export const DEFAULT_PRODUCTION_MODE = false;
export const DEFAULT_VERBOSE = false;
export const DEFAULT_PROMETHEUS_ADDRESS = "localhost";
export const DEFAULT_PROMETHEUS_PORT = 9102;
export const DEFAULT_METRICS_DISABLED = false;

interface Package {
    name: string;
    version: string;
    description: string;
}

export function program(pkg: Package) {
    const program = new Command();
    program.name(pkg.name).version(pkg.version, "-v, --version", `version for ${pkg.name}`);
    program.command("completion").description("Generate the autocompletion script for the specified shell");
    program.command("help").description("Display help for command");
    program.showHelpAfterError();
    return program;
}

export function option(program: Command, pkg: Package) {
    return program
        .showHelpAfterError()
        .description(pkg.description)
        .requiredOption("-e --substreams-endpoint <string>", "Substreams gRPC endpoint to stream data from")
        .requiredOption("--manifest <string>", "URL of Substreams package")
        .requiredOption("--module-name <string>", "Name of the output module (declared in the manifest)")
        .option("-p, --params <string...>", "Set a params for parameterizable modules. Can be specified multiple times. (ex: -p module1=valA -p module2=valX&valY)", [])
        .option("-s --start-block <int>", "Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming)")
        .option("-t --stop-block <int>", "Stop block to end stream at, inclusively")
        .option("--substreams-api-token <string>", "API token for the substream endpoint")
        .option("--substreams-api-token-envvar <string>", "Environnement variable name of the API token for the substream endpoint", DEFAULT_SUBSTREAMS_API_TOKEN_ENV)
        .option("--delay-before-start <int>", "[OPERATOR] Amount of time in milliseconds (ms) to wait before starting any internal processes, can be used to perform to maintenance on the pod before actually letting it starts", "0")
        .option("--cursor-file <string>", "cursor lock file", DEFAULT_CURSOR_FILE)
        .option("--production-mode", "Enable Production Mode, with high-speed parallel processing", DEFAULT_PRODUCTION_MODE)
        .option("--verbose", "Enable verbose logging", DEFAULT_VERBOSE)
        .option("--metrics-listen-address <string>", "The process will listen on this address for Prometheus metrics requests", DEFAULT_PROMETHEUS_ADDRESS)
        .option("--metrics-listen-port <int>", "The process will listen on this port for Prometheus metrics requests", String(DEFAULT_PROMETHEUS_PORT))
        .option("--metrics-disabled", "If set, will not send metrics to Prometheus", DEFAULT_METRICS_DISABLED);
}
