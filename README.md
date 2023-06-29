# [`Substreams`](https://substreams.streamingfast.io/) Sink CLI `Node.js`

[![Build Status](https://github.com/pinax-network/substreams-sink/actions/workflows/ci.yml/badge.svg)](https://github.com/pinax-network/substreams-sink/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/substreams-sink.svg)](https://badge.fury.io/js/substreams-sink)
![License](https://img.shields.io/github/license/pinax-network/substreams-sink)

> `substreams-sink` is the code template to build Substreams sinks in NodeJS. Sinks allows developers to pipe data extracted from a blockchain to a specified application.

## 📖 Documentation

<!-- ### https://www.npmjs.com/package/substreams-sink -->

### Further resources

- [**Substreams** documentation](https://substreams.streamingfast.io)

## 🚀 Quick start

### Installation

```bash
npm install substreams-sink
```

### Features

- [x] includes [Commander.js](https://github.com/tj/commander.js/) helper CLI
- [x] includes [tslog](https://github.com/fullstack-build/tslog) helper logger
- [x] includes **Substreams** `init()` and `start()` helper methods & `RunOptions` interface
- [x] handle reading/saving **Substreams** `cursor.lock` file
- [x] reads `SUBSTREAMS_API_TOKEN` from `.env` file
- [x] includes `--verbose` flag
- [x] includes `--production-mode` flag
- [x] includes `--auto-restart` flag
- [x] Prometheus metrics

### CLI

```bash
Usage: substreams-sink run [options]

Substreams sink CLI module

Options:
  -e --substreams-endpoint <string>       Substreams gRPC endpoint to stream data from
  --manifest <string>                     URL of Substreams package
  --module-name <string>                  Name of the output module (declared in the manifest)
  -p, --params <string...>                Set a params for parameterizable modules. Can be specified multiple times. (ex: -p module1=valA -p module2=valX&valY) (default: [])
  -s --start-block <int>                  Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming)
  -t --stop-block <int>                   Stop block to end stream at, inclusively
  --substreams-api-token <string>         API token for the substream endpoint
  --substreams-api-token-envvar <string>  Environnement variable name of the API token for the substream endpoint (default: "SUBSTREAMS_API_TOKEN")
  --delay-before-start <int>              [OPERATOR] Amount of time in milliseconds (ms) to wait before starting any internal processes, can be used to perform to maintenance on the pod before actually letting it starts
  --cursor-file <string>                  cursor lock file (default: "cursor.lock")
  --production-mode                       Enable Production Mode, with high-speed parallel processing (default: true)
  --verbose                               Enable verbose logging (default: false)
  --metrics-listen-address <string>       The process will listen on this address for Prometheus metrics requests (default: "localhost")
  --metrics-listen-port <int>             The process will listen on this port for Prometheus metrics requests (default: "9102")
  --metrics-disabled                      If set, will not send metrics to Prometheus (default: false)
  --auto-restart                          If set, the sink will restart on error (default: false)
  -h, --help                              display help for command
```

### Example

```js
import { fetchSubstream } from "@substreams/core";
import { init, start, logger, cli } from "substreams-sink";

import pkg from "./package.json" assert { type: "json" };

const program = cli.program(pkg);
const command = cli.option(program, pkg);

logger.setName(pkg.name);
export { logger };

// Custom user options interface
interface ActionOptions extends cli.RunOptions {
    customOption: any
    // ...
}

export async function action(options: ActionOptions) {
    const spkg = await fetchSubstream(options.manifest!);

    // Get command options
    const { customOption } = options;

    // Run substreams
    const substreams = run(spkg, options);

    substreams.on("anyMessage", async (messages: any) => {
      // Sink logic here
    });

    await start(substreams, options);
}
```
