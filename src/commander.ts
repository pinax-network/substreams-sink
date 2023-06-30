import { Command } from "commander";
import { DEFAULT_CURSOR_FILE, DEFAULT_RESTART_INACTIVITY_SECONDS, DEFAULT_SUBSTREAMS_API_TOKEN_ENV } from "./config.js";

export interface Package {
    name: string;
    version: string;
    description: string;
}

export interface RunOptions {
    substreamsEndpoint?: string;
    manifest?: string;
    moduleName?: string;
    params?: string[];
    startBlock?: string;
    stopBlock?: string;
    substreamsApiToken?: string;
    substreamsApiTokenEnvvar?: string;
    delayBeforeStart?: number;
    cursorFile?: string;
    disableProductionMode?: boolean;
    verbose?: boolean;
    autoRestart?: boolean;
    restartInactivitySeconds?: number;
}

export function program(pkg: Package) {
    const program = new Command();
    program.name(pkg.name).version(pkg.version, "-v, --version", `version for ${pkg.name}`);
    program.command("completion").description("Generate the autocompletion script for the specified shell");
    program.command("help").description("Display help for command");
    program.showHelpAfterError();
    return program;
}

export function run(program: Command, pkg: Package) {
    return program.command("run")
        .showHelpAfterError()
        .description(pkg.description)
        .option("-e --substreams-endpoint <string>", "Substreams gRPC endpoint to stream data from")
        .option("--manifest <string>", "URL of Substreams package")
        .option("--module-name <string>", "Name of the output module (declared in the manifest)")
        .option("-s --start-block <int>", "Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming)")
        .option("-t --stop-block <int>", "Stop block to end stream at, inclusively")
        .option("-p, --params <string...>", "Set a params for parameterizable modules. Can be specified multiple times. (ex: -p module1=valA -p module2=valX&valY)")
        .option("--substreams-api-token <string>", "API token for the substream endpoint")
        .option("--substreams-api-token-envvar <string>", `Environnement variable name of the API token for the substream endpoint (ex: ${DEFAULT_SUBSTREAMS_API_TOKEN_ENV})`)
        .option("--delay-before-start <int>", "[OPERATOR] Amount of time in milliseconds (ms) to wait before starting any internal processes, can be used to perform to maintenance on the pod before actually letting it starts")
        .option("--cursor-file <string>", `cursor lock file (ex: ${DEFAULT_CURSOR_FILE})`)
        .option("--disable-production-mode", "Disable production mode, allows debugging modules logs, stops high-speed parallel processing")
        .option("--restart-inactivity-seconds <int>", `If set, the sink will restart when inactive for over a certain amount of seconds (ex: ${DEFAULT_RESTART_INACTIVITY_SECONDS})`)
        .option("--verbose", "Enable verbose logging")
}