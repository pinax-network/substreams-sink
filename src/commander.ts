import "dotenv/config";
import { Command, Option } from "commander";
import { DEFAULT_CURSOR_FILE, DEFAULT_RESTART_INACTIVITY_SECONDS, DEFAULT_PARAMS, DEFAULT_SUBSTREAMS_API_TOKEN, DEFAULT_VERBOSE, DEFAULT_HOSTNAME, DEFAULT_PORT, DEFAULT_METRICS_LABELS, DEFAULT_COLLECT_DEFAULT_METRICS, DEFAULT_PRODUCTION_MODE, DEFAULT_START_BLOCK, DEFAULT_DELAY_BEFORE_START } from "./config.js";

export interface Package {
    name: string;
    version: string;
    description: string;
}

export interface RunOptions {
    substreamsEndpoint: string;
    manifest: string;
    moduleName: string;
    params: string[];
    startBlock: string;
    stopBlock: string;
    substreamsApiToken: string;
    delayBeforeStart: number;
    cursorFile: string;
    disableProductionMode: boolean;
    restartInactivitySeconds: number;
    hostname: string;
    port: number;
    metricsLabels: string[];
    collectDefaultMetrics: boolean;
    verbose: boolean;
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
        .addOption(new Option("-e --substreams-endpoint <string>", "Substreams gRPC endpoint to stream data from").makeOptionMandatory().env("SUBSTREAMS_ENDPOINT"))
        .addOption(new Option("--manifest <string>", "URL of Substreams package").makeOptionMandatory().env("MANIFEST"))
        .addOption(new Option("--module-name <string>", "Name of the output module (declared in the manifest)").makeOptionMandatory().env("MODULE_NAME"))
        .addOption(new Option("-s --start-block <int>", "Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming)").default(DEFAULT_START_BLOCK).env("START_BLOCK"))
        .addOption(new Option("-t --stop-block <int>", "Stop block to end stream at, inclusively").env("STOP_BLOCK"))
        .addOption(new Option("-p, --params <string...>", "Set a params for parameterizable modules. Can be specified multiple times. (ex: -p module1=valA -p module2=valX&valY)").default(DEFAULT_PARAMS).env("PARAMS")) // Make sure params are parsed correctly when using env
        .addOption(new Option("--substreams-api-token <string>", "API token for the substream endpoint").default(DEFAULT_SUBSTREAMS_API_TOKEN).env("SUBSTREAMS_API_TOKEN"))
        .addOption(new Option("--delay-before-start <int>", "[OPERATOR] Amount of time in milliseconds (ms) to wait before starting any internal processes, can be used to perform to maintenance on the pod before actually letting it starts").default(DEFAULT_DELAY_BEFORE_START).env("DELAY_BEFORE_START"))
        .addOption(new Option("--cursor-file <string>", "Cursor lock file").default(DEFAULT_CURSOR_FILE).env("CURSOR_FILE"))
        .addOption(new Option("--disable-production-mode", "Disable production mode, allows debugging modules logs, stops high-speed parallel processing").default(DEFAULT_PRODUCTION_MODE).env("PRODUCTION_MODE"))
        .addOption(new Option("--restart-inactivity-seconds <int>", "If set, the sink will restart when inactive for over a certain amount of seconds").default(DEFAULT_RESTART_INACTIVITY_SECONDS).env("RESTART_INACTIVITY_SECONDS"))
        .addOption(new Option("--hostname <string>", "The process will listen on this hostname for any HTTP and Prometheus metrics requests").default(DEFAULT_HOSTNAME).env("HOSTNAME"))
        .addOption(new Option("--port <int>", "The process will listen on this port for any HTTP and Prometheus metrics requests").default(DEFAULT_PORT).env("PORT"))
        .addOption(new Option("--metrics-labels [string...]", "To apply generic labels to all default metrics (ex: --labels foo=bar)").default(DEFAULT_METRICS_LABELS).env("METRICS_LABELS").argParser(handleMetricsLabels))
        .addOption(new Option("--collect-default-metrics <boolean>", "Collect default metrics").default(DEFAULT_COLLECT_DEFAULT_METRICS).env("COLLECT_DEFAULT_METRICS"))
        .addOption(new Option("--verbose", "Enable verbose logging").default(DEFAULT_VERBOSE).env("VERBOSE"));
}
