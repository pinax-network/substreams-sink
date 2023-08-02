import "dotenv/config";
import { Command, Option } from "commander";
import { DEFAULT_CURSOR_PATH, DEFAULT_RESTART_INACTIVITY_SECONDS, DEFAULT_PARAMS, DEFAULT_SUBSTREAMS_API_TOKEN, DEFAULT_AUTH_ISSUE_URL, DEFAULT_VERBOSE, DEFAULT_HOSTNAME, DEFAULT_PORT, DEFAULT_METRICS_LABELS, DEFAULT_COLLECT_DEFAULT_METRICS, DEFAULT_DISABLE_PRODUCTION_MODE, DEFAULT_START_BLOCK, DEFAULT_DELAY_BEFORE_START, DEFAULT_HEADERS } from "./config.js";

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
    authIssueUrl: string;
    delayBeforeStart: number;
    cursorPath: string;
    disableProductionMode: boolean;
    restartInactivitySeconds: number;
    hostname: string;
    port: number;
    metricsLabels: string[];
    collectDefaultMetrics: boolean;
    headers: Headers;
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

function handleHeaders(value: string, previous: Headers) {
    const params = new URLSearchParams(value);

    let headers = new Headers();

    previous.forEach((value, header) => {
        headers.append(header, value);
    });

    for (const [key, value] of params) {
        headers.append(key, value);
    }

    return headers;
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
        .addOption(new Option("--substreams-api-token <string>", "API token for the substream endpoint or API key if '--auth-issue-url' is specified").default(DEFAULT_SUBSTREAMS_API_TOKEN).env("SUBSTREAMS_API_TOKEN"))
        .addOption(new Option("--auth-issue-url <string>", "URL used to issue a token").default(DEFAULT_AUTH_ISSUE_URL).env("AUTH_ISSUE_URL"))
        .addOption(new Option("--delay-before-start <int>", "Delay (ms) before starting Substreams").default(DEFAULT_DELAY_BEFORE_START).env("DELAY_BEFORE_START"))
        .addOption(new Option("--cursor-path <string>", "File path or URL to cursor lock file").default(DEFAULT_CURSOR_PATH).env("CURSOR_PATH"))
        .addOption(new Option("--disable-production-mode", "Disable production mode, allows debugging modules logs, stops high-speed parallel processing").default(DEFAULT_DISABLE_PRODUCTION_MODE).env("DISABLE_PRODUCTION_MODE"))
        .addOption(new Option("--restart-inactivity-seconds <int>", "If set, the sink will restart when inactive for over a certain amount of seconds").default(DEFAULT_RESTART_INACTIVITY_SECONDS).env("RESTART_INACTIVITY_SECONDS"))
        .addOption(new Option("--hostname <string>", "The process will listen on this hostname for any HTTP and Prometheus metrics requests").default(DEFAULT_HOSTNAME).env("HOSTNAME"))
        .addOption(new Option("--port <int>", "The process will listen on this port for any HTTP and Prometheus metrics requests").default(DEFAULT_PORT).env("PORT"))
        .addOption(new Option("--metrics-labels [string...]", "To apply generic labels to all default metrics (ex: --labels foo=bar)").default(DEFAULT_METRICS_LABELS).env("METRICS_LABELS").argParser(handleMetricsLabels))
        .addOption(new Option("--collect-default-metrics <boolean>", "Collect default metrics").default(DEFAULT_COLLECT_DEFAULT_METRICS).env("COLLECT_DEFAULT_METRICS"))
        .addOption(new Option("--headers [string...]", "Set headers that will be sent on every requests (ex: --headers X-HEADER=headerA)").default(DEFAULT_HEADERS).env("HEADERS").argParser(handleHeaders))
        .addOption(new Option("--verbose", "Enable verbose logging").default(DEFAULT_VERBOSE).env("VERBOSE"));
}
