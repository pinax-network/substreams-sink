import { Command } from "commander";
import {
    DEFAULT_CURSOR_FILE,
    DEFAULT_PRODUCTION_MODE,
    DEFAULT_PROMETHEUS_ADDRESS,
    DEFAULT_PROMETHEUS_PORT,
    DEFAULT_SUBSTREAMS_API_TOKEN_ENV,
    DEFAULT_SUBSTREAMS_ENDPOINT,
    DEFAULT_VERBOSE,
} from "../src/constants.js";

interface Package {
    name: string;
    version: string;
    description: string;
}

//  run: (spkg: string, outputModule: string, options: RunOptions) => any
export function program(pkg: Package) {
    const program = new Command();
    program.name(pkg.name)
        .version(pkg.version, '-v, --version', `version for ${pkg.name}`);

    program.command('completion').description('Generate the autocompletion script for the specified shell');
    program.command('help').description('Display help for command');
    program.showHelpAfterError();
    return program;
}

export function run(program: Command, pkg: Package) {
    return program.command('run')
        .showHelpAfterError()
        .description(pkg.description)
        .argument('[<manifest>]', 'URL or IPFS hash of Substreams package')
        .argument('<module_name>', 'Name of the output module (declared in the manifest)')
        .option('-e --substreams-endpoint <string>', 'Substreams gRPC endpoint to stream data from', DEFAULT_SUBSTREAMS_ENDPOINT)
        .option('-s --start-block <int>', 'Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming)')
        .option('-t --stop-block <string>', 'Stop block to end stream at, inclusively')
        .option('--substreams-api-token <string>', 'API token for the substream endpoint')
        .option('--substreams-api-token-envvar <string>', 'Environnement variable name of the API token for the substream endpoint', DEFAULT_SUBSTREAMS_API_TOKEN_ENV)
        .option('--delay-before-start <int>', '[OPERATOR] Amount of time in milliseconds (ms) to wait before starting any internal processes, can be used to perform to maintenance on the pod before actually letting it starts', '0')
        .option('--cursor-file <string>', 'cursor lock file', DEFAULT_CURSOR_FILE)
        .option('--production-mode', 'Enable Production Mode, with high-speed parallel processing', DEFAULT_PRODUCTION_MODE)
        .option('--verbose', 'Enable verbose logging', DEFAULT_VERBOSE)
        .option('--metrics-listen-address', 'If non-empty, the process will listen on this address for Prometheus metrics requests', DEFAULT_PROMETHEUS_ADDRESS)
        .option('--metrics-listen-port', 'If non-empty, the process will listen on this port for Prometheus metrics requests', DEFAULT_PROMETHEUS_PORT.toString())
        .option('-p, --params <string...>', 'Set a params for parameterizable modules. Can be specified multiple times. Ex: -p module1=valA -p module2=valX&valY', [])
}
