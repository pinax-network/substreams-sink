import "dotenv/config";
import { Command, Option } from "commander";
import { DEFAULT_INACTIVITY_SECONDS, DEFAULT_PARAMS, DEFAULT_HOSTNAME, DEFAULT_PORT, DEFAULT_METRICS_LABELS, DEFAULT_START_BLOCK, DEFAULT_DELAY_BEFORE_START, DEFAULT_HEADERS } from "./config.js";

export interface Package {
    name?: string;
    version?: string;
    description?: string;
}

export interface RunOptions {
    substreamsEndpoint: string;
    manifest: string;
    moduleName: string;
    params: string[];
    startBlock: number | bigint | undefined;
    stopBlock: number | bigint | `+${number}` | undefined;
    substreamsApiKey: string;
    substreamsApiToken: string; // Deprecated
    delayBeforeStart: number;
    cursor: string;
    productionMode: boolean;
    inactivitySeconds: number;
    hostname: string;
    port: number;
    metricsLabels: string[];
    collectDefaultMetrics: boolean;
    headers: Headers;
    verbose: boolean;
    finalBlocksOnly: boolean;
    plaintext: boolean;
}

export function program(pkg?: Package) {
    const program = new Command();
    const name = pkg?.name ?? "substreams-sink";
    program.name(name);
    if ( pkg?.version ) program.version(pkg.version, "-v, --version", `version for ${name}`);
    if ( pkg?.description ) program.description(pkg.description);
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

export function run(program: Command, options: AddRunOptions = {}) {
    return addRunOptions(program.command("run"), options);
}

export function list(program: Command) {
    program.command("list")
        .showHelpAfterError()
        .description("List all compatible output modules for a given Substreams package")
        .argument("<spkg>", "URL or IPFS hash of Substreams package")
        .action(async spkg => {
            const modules = await list(spkg)
            process.stdout.write(JSON.stringify(modules) + "\n");
        });

    return program;
}

interface AddRunOptions {
    http?: boolean;
    metrics?: boolean;
}

function parseBoolean(value?: string) {
    if ( value !== undefined ) return value.toLocaleLowerCase() === "true";
    return false;
}

function addBoolean(flags: string, description: string, env: string) {
    return new Option(flags, description).default(false).env(env).choices(["true", "false"]).argParser(parseBoolean);
}

export function addRunOptions(program: Command, options: AddRunOptions = {}) {
    const command = program
        .showHelpAfterError()
        .addOption(new Option("-e --substreams-endpoint <string>", "Substreams gRPC endpoint to stream data from").makeOptionMandatory().env("SUBSTREAMS_ENDPOINT"))
        .addOption(new Option("--manifest <string>", "URL of Substreams package").makeOptionMandatory().env("MANIFEST"))
        .addOption(new Option("--module-name <string>", "Name of the output module (declared in the manifest)").makeOptionMandatory().env("MODULE_NAME"))
        .addOption(new Option("-s --start-block <int>", "Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming)").default(DEFAULT_START_BLOCK).env("START_BLOCK"))
        .addOption(new Option("-t --stop-block <int>", "Stop block to end stream at, inclusively").env("STOP_BLOCK"))
        .addOption(new Option("-p, --params <string...>", "Set a params for parameterizable modules. Can be specified multiple times. (ex: -p module1=valA -p module2=valX&valY)").default(DEFAULT_PARAMS).env("PARAMS")) // Make sure params are parsed correctly when using env
        .addOption(new Option("--substreams-api-key <string>", "API key for the Substream endpoint").env("SUBSTREAMS_API_KEY"))
        .addOption(new Option("--substreams-api-token <string>", "(DEPRECATED) API token for the Substream endpoint").hideHelp(true).env("SUBSTREAMS_API_TOKEN"))
        .addOption(new Option("--delay-before-start <int>", "Delay (ms) before starting Substreams").default(DEFAULT_DELAY_BEFORE_START).env("DELAY_BEFORE_START"))
        .addOption(new Option("--cursor <string>", "Cursor to stream from. Leave blank for no cursor"))
        .addOption(addBoolean("--production-mode <boolean>", "Enable production mode, allows cached Substreams data if available", "PRODUCTION_MODE"))
        .addOption(addBoolean("--final-blocks-only <boolean>", "Only process blocks that have pass finality, to prevent any reorg and undo signal by staying further away from the chain HEAD", "FINAL_BLOCKS_ONLY"))
        .addOption(new Option("--inactivity-seconds <int>", "If set, the sink will stop when inactive for over a certain amount of seconds").default(DEFAULT_INACTIVITY_SECONDS).env("INACTIVITY_SECONDS"))
        .addOption(new Option("--headers [string...]", "Set headers that will be sent on every requests (ex: --headers X-HEADER=headerA)").default(DEFAULT_HEADERS).env("HEADERS").argParser(handleHeaders))
        .addOption(addBoolean("--plaintext <boolean>", "Establish GRPC connection in plaintext", "PLAIN_TEXT"))
        .addOption(addBoolean("--verbose <boolean>", "Enable verbose logging", "VERBOSE"));

        // HTTP and Prometheus metrics options
        if ( options.http !== false ) {
            command
                .addOption(new Option("--hostname <string>", "The process will listen on this hostname for any HTTP and Prometheus metrics requests").default(DEFAULT_HOSTNAME).env("HOSTNAME"))
                .addOption(new Option("--port <int>", "The process will listen on this port for any HTTP and Prometheus metrics requests").default(DEFAULT_PORT).env("PORT"))
        }
        if ( options.metrics !== false ) {
            command
                .addOption(new Option("--metrics-labels [string...]", "To apply generic labels to all default metrics (ex: --labels foo=bar)").default(DEFAULT_METRICS_LABELS).env("METRICS_LABELS").argParser(handleMetricsLabels))
                .addOption(addBoolean("--collect-default-metrics <boolean>", "Collect default metrics", "COLLECT_DEFAULT_METRICS"));
        }
    return command;
}
