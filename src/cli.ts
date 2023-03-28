#!/usr/bin/env node

import { Command } from "commander";
import pkg from "../package.json";
import {
    DEFAULT_CURSOR_FILE,
    DEFAULT_SUBSTREAMS_API_TOKEN_ENV,
    DEFAULT_OUTPUT_MODULE,
    DEFAULT_SUBSTREAMS_ENDPOINT,
} from "../index";

interface SinkCommandOption {
    flags: string;
    description?: string | undefined;
    defaultValue?: string | boolean | string[] | undefined;
}

export function createSinkCommand(commandName: string, description: string, customOptions: Array<SinkCommandOption>): Command {
    const program = new Command();

    program.name(commandName)
        .version(pkg.version, '-v, --version', `version for ${commandName}`);

    let runCommand: Command = program.command('run')
        .showHelpAfterError()
        .description(description)
        .argument('<spkg>', 'URL or IPFS hash of Substreams package')
        .option('-m --output-module <string>', 'Name of the output module (declared in the manifest)', DEFAULT_OUTPUT_MODULE)
        .option('-e --substreams-endpoint <string>', 'Substreams gRPC endpoint to stream data from', DEFAULT_SUBSTREAMS_ENDPOINT)
        .option('-s --start-block <int>', 'Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming)')
        .option('-t --stop-block <string>', 'Stop block to end stream at, inclusively')
        .option('--substreams-api-token <string>', 'API token for the substream endpoint')
        .option('--substreams-api-token-envvar <string>', 'Environnement variable name of the API token for the substream endpoint', DEFAULT_SUBSTREAMS_API_TOKEN_ENV)
        .option('--delay-before-start <int>', '[OPERATOR] Amount of time in milliseconds (ms) to wait before starting any internal processes, can be used to perform to maintenance on the pod before actually letting it starts', '0')
        .option('--cursor-file <string>', 'cursor lock file', DEFAULT_CURSOR_FILE);

    program.command('completion').description('Generate the autocompletion script for the specified shell');
    program.command('help').description('Display help for command');
    program.showHelpAfterError();

    customOptions.forEach(option => {
        runCommand.option(option.flags, option.description, option.defaultValue);
    });

    program.parse();

    return program;
}

const program: Command = createSinkCommand('substreams-sink-rabbitmq',
    'Push data from a Substreams `Messages` map output to a messaging social platform.',
    [
        {
            flags: '-U --username <string>',
            description: 'RabbitMQ username.',
            defaultValue: 'guest',
        },
        {
            flags: '-P --password <string>',
            description: 'RabbitMQ password.',
            defaultValue: 'guest',
        },
        {
            flags: '-p --port <int>',
            description: 'Listens on port number.',
            defaultValue: '5672',
        },
        {
            flags: '-a --address <string>',
            description: 'Address to use.',
            defaultValue: 'localhost',
        }
    ],
);

program.action((options: { port?: string } = {}) => {
    const port = options.port ?? '5672';
    console.log(port);
});