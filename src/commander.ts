import "dotenv/config";
import { Command, Option } from "commander";
import { DEFAULT_CURSOR_PATH, DEFAULT_INACTIVITY_SECONDS, DEFAULT_PARAMS, DEFAULT_VERBOSE, DEFAULT_HOSTNAME, DEFAULT_PORT, DEFAULT_METRICS_LABELS, DEFAULT_COLLECT_DEFAULT_METRICS, DEFAULT_START_BLOCK, DEFAULT_DELAY_BEFORE_START, DEFAULT_HEADERS, DEFAULT_PRODUCTION_MODE, DEFAULT_FINAL_BLOCKS_ONLY } from "./config.js";

import { list } from "./list.js";
import { logger } from "./logger.js";

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
    substreamsApiKey: string;
    substreamsApiToken: string; // Deprecated
    delayBeforeStart: number;
    cursorPath: string;
    httpCursorAuth: string;
    productionMode: string;
    inactivitySeconds: number;
    hostname: string;
    port: number;
    metricsLabels: string[];
    collectDefaultMetrics: string;
    headers: Headers;
    verbose: string;
    finalBlocksOnly: string;
}

export function program(pkg: Package) {
    const program = new Command();
    program.name(pkg.name).version(pkg.version, "-v, --version", `version for ${pkg.name}`);
    program.command("completion").description("Generate the autocompletion script for the specified shell");
    program.command("help").description("Display help for command");
    program.command("list")
        .showHelpAfterError()
        .description("List all compatible output modules for a given Substreams package")
        .argument("<spkg>", "URL or IPFS hash of Substreams package")
        .action(async spkg => {
            const modules = await list(spkg)
            logger.info('list', { modules })
            process.stdout.write(JSON.stringify(modules) + "\n")
        });
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

function handleHttpCursorAuth(value: string) {
    return btoa(value);
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
        .addOption(new Option("--substreams-api-key <string>", "API key for the Substream endpoint").env("SUBSTREAMS_API_KEY"))
        .addOption(new Option("--substreams-api-token <string>", "(DEPRECATED) API token for the Substream endpoint").hideHelp(true).env("SUBSTREAMS_API_TOKEN"))
        .addOption(new Option("--delay-before-start <int>", "Delay (ms) before starting Substreams").default(DEFAULT_DELAY_BEFORE_START).env("DELAY_BEFORE_START"))
        .addOption(new Option("--cursor-path <string>", "File path or URL to cursor lock file").default(DEFAULT_CURSOR_PATH).env("CURSOR_PATH"))
        .addOption(new Option("--http-cursor-auth <string>", "Basic auth credentials for http cursor (ex: username:password)").env("HTTP_CURSOR_AUTH").argParser(handleHttpCursorAuth))
        .addOption(new Option("--production-mode <boolean>", "Enable production mode, allows cached Substreams data if available").default(DEFAULT_PRODUCTION_MODE).env("PRODUCTION_MODE"))
        .addOption(new Option("--inactivity-seconds <int>", "If set, the sink will stop when inactive for over a certain amount of seconds").default(DEFAULT_INACTIVITY_SECONDS).env("INACTIVITY_SECONDS"))
        .addOption(new Option("--hostname <string>", "The process will listen on this hostname for any HTTP and Prometheus metrics requests").default(DEFAULT_HOSTNAME).env("HOSTNAME"))
        .addOption(new Option("--port <int>", "The process will listen on this port for any HTTP and Prometheus metrics requests").default(DEFAULT_PORT).env("PORT"))
        .addOption(new Option("--metrics-labels [string...]", "To apply generic labels to all default metrics (ex: --labels foo=bar)").default(DEFAULT_METRICS_LABELS).env("METRICS_LABELS").argParser(handleMetricsLabels))
        .addOption(new Option("--collect-default-metrics <boolean>", "Collect default metrics").default(DEFAULT_COLLECT_DEFAULT_METRICS).env("COLLECT_DEFAULT_METRICS"))
        .addOption(new Option("--headers [string...]", "Set headers that will be sent on every requests (ex: --headers X-HEADER=headerA)").default(DEFAULT_HEADERS).env("HEADERS").argParser(handleHeaders))
        .addOption(new Option("--final-blocks-only <boolean>", "Only process blocks that have pass finality, to prevent any reorg and undo signal by staying further away from the chain HEAD").default(DEFAULT_FINAL_BLOCKS_ONLY).env("FINAL_BLOCKS_ONLY"))
        .addOption(new Option("--verbose <boolean>", "Enable verbose logging").default(DEFAULT_VERBOSE).env("VERBOSE"));
}
