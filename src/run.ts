import fs from "node:fs";
import { download, Substreams } from "substreams";
import dotenv from "dotenv";
import { DEFAULT_SUBSTREAMS_ENDPOINT, DEFAULT_SUBSTREAMS_API_TOKEN_ENV, DEFAULT_CURSOR_FILE } from "./constants";
dotenv.config();

export interface RunOptions {
    startBlock?: string,
    stopBlock?: string,
    substreamsEndpoint?: string,
    substreamsApiTokenEnvvar?: string,
    substreamsApiToken?: string,
    delayBeforeStart?: string,
    cursorFile?: string,
    startCursor?: string,
}

export async function run(manifest: string, outputModule: string, options: RunOptions = {}) {
    // Substreams options
    const substreamsEndpoint = options.substreamsEndpoint ?? DEFAULT_SUBSTREAMS_ENDPOINT;
    const substreams_api_token_envvar = options.substreamsApiTokenEnvvar ?? DEFAULT_SUBSTREAMS_API_TOKEN_ENV;
    const substreams_api_token = options.substreamsApiToken ?? process ? process.env[substreams_api_token_envvar] : '';
    const cursorFile = options.cursorFile ?? DEFAULT_CURSOR_FILE;

    // Required
    if (!outputModule) throw new Error('[output-module] is required');
    if (!substreams_api_token) throw new Error('[substreams-api-token] is required');

    const spkg = await download(manifest);

    // read cursor file
    let startCursor = fs.existsSync(cursorFile) ? fs.readFileSync(cursorFile, 'utf8') : "";

    // Initialize Substreams
    const substreams = new Substreams(spkg, outputModule, {
        host: substreamsEndpoint,
        startBlockNum: options.startBlock,
        stopBlockNum: options.stopBlock,
        startCursor,
        authorization: substreams_api_token,
        productionMode: true,
    });

    substreams.on("cursor", cursor => {
        if ( options.cursorFile ) {
            fs.writeFileSync(options.cursorFile, cursor);
        }
    })
    return substreams;
}
