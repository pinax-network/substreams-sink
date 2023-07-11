import { Command } from "commander";
import { DEFAULT_CURSOR_FILE, DEFAULT_RESTART_INACTIVITY_SECONDS, DEFAULT_SUBSTREAMS_API_TOKEN_ENV, DEFAULT_HOSTNAME, DEFAULT_PORT, DEFAULT_METRICS_LABELS } from "./config.js";

export interface Package {
    name: string;
    version: string;
    description: string;
}

export interface RunOptions {
    substreamsEndpoint: string;
    manifest: string;
    moduleName: string;
    params?: string[];
    startBlock?: string;
    stopBlock?: string;
    substreamsApiToken?: string;
    substreamsApiTokenEnvvar?: string;
    delayBeforeStart?: number;
    cursorFile?: string;
    disableProductionMode?: boolean;
    restartInactivitySeconds?: number;
    hostname?: string;
    port?: number;
    metricsLabels?: string[];
    verbose?: boolean;
}

export function program(pkg: Package) {
    const program = new Command();
    program.name(pkg.name).version(pkg.version, "-v, --version", `version for ${pkg.name}`);
    program.command("completion").description("Generate the autocompletion script for the specified shell");
    program.command("help").description("Display help for command");
    program.showHelpAfterError();
    return program;
}

function handleMetricsLabels(value: string, previous: {}) {
    const params = new URLSearchParams(value);
    return { ...previous, ...Object.fromEntries(params) };
}

export function run(program: Command, pkg: Package) {
    return program.command("run")
        .showHelpAfterError()
        .description(pkg.description)
        .requiredOption("-e --substreams-endpoint <string>", "Substreams gRPC endpoint to stream data from")
        .requiredOption("--manifest <string>", "URL of Substreams package")
        .requiredOption("--module-name <string>", "Name of the output module (declared in the manifest)")
        .option("-s --start-block <int>", "Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming)")
        .option("-t --stop-block <int>", "Stop block to end stream at, inclusively")
        .option("-p, --params <string...>", "Set a params for parameterizable modules. Can be specified multiple times. (ex: -p module1=valA -p module2=valX&valY)")
        .option("--substreams-api-token <string>", "API token for the substream endpoint")
        .option("--substreams-api-token-envvar <string>", `Environnement variable name of the API token for the substream endpoint (ex: ${DEFAULT_SUBSTREAMS_API_TOKEN_ENV})`)
        .option("--delay-before-start <int>", "[OPERATOR] Amount of time in milliseconds (ms) to wait before starting any internal processes, can be used to perform to maintenance on the pod before actually letting it starts")
        .option("--cursor-file <string>", `cursor lock file (ex: ${DEFAULT_CURSOR_FILE})`)
        .option("--disable-production-mode", "Disable production mode, allows debugging modules logs, stops high-speed parallel processing")
        .option("--restart-inactivity-seconds <int>", `If set, the sink will restart when inactive for over a certain amount of seconds (ex: ${DEFAULT_RESTART_INACTIVITY_SECONDS})`)
        .option("--hostname <string>", `The process will listen on this hostname for any HTTP and Prometheus metrics requests (ex: ${DEFAULT_HOSTNAME})`)
        .option("--port <int>", `The process will listen on this port for any HTTP and Prometheus metrics requests (ex: ${DEFAULT_PORT})`)
        .option("--metrics-labels [string...]", "To apply generic labels to all default metrics (ex: --labels foo=bar)", handleMetricsLabels, DEFAULT_METRICS_LABELS)
        .option("--verbose", "Enable verbose logging")
}
