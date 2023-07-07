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
- [x] handle reading/saving **Substreams** `cursor.lock` file
- [x] reads config `.env` file
- [x] includes Prometheus metrics helpers

### CLI

```bash
Usage: substreams-sink run [options]

Substreams sink module

Options:
  -e --substreams-endpoint <string>       Substreams gRPC endpoint to stream data from
  --manifest <string>                     URL of Substreams package
  --module-name <string>                  Name of the output module (declared in the manifest)
  -s --start-block <int>                  Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming)
  -t --stop-block <int>                   Stop block to end stream at, inclusively
  -p, --params <string...>                Set a params for parameterizable modules. Can be specified multiple times. (ex: -p module1=valA -p module2=valX&valY)
  --substreams-api-token <string>         API token for the substream endpoint
  --substreams-api-token-envvar <string>  Environnement variable name of the API token for the substream endpoint (ex: SUBSTREAMS_API_TOKEN)
  --delay-before-start <int>              [OPERATOR] Amount of time in milliseconds (ms) to wait before starting any internal processes, can be used to perform to maintenance on the pod before actually letting it starts
  --cursor-file <string>                  cursor lock file (ex: cursor.lock)
  --disable-production-mode               Disable production mode, allows debugging modules logs, stops high-speed parallel processing
  --restart-inactivity-seconds <int>      If set, the sink will restart when inactive for over a certain amount of seconds (ex: 60)
  --hostname <string>                     The process will listen on this hostname for any HTTP and Prometheus metrics requests (ex: localhost)
  --port <int>                            The process will listen on this port for any HTTP and Prometheus metrics requests (ex: 9102)
  --verbose                               Enable verbose logging
  -h, --help                              display help for command
```

### Example

```js
import pkg from "./package.json" assert { type: "json" };
import { commander, setup, prometheus } from "./index.js";
import { listen } from "./src/http";

// Setup CLI using Commander
const program = commander.program(pkg);
const command = commander.run(program, pkg);

// Custom Prometheus Counters
const customCounter = prometheus.registerCounter("custom_counter");

command.action(async (options: commander.RunOptions) => {
  // Setup sink for Block Emitter
  const emitter = await setup(options, pkg);

  // Stream Blocks
  emitter.on("anyMessage", (message, cursor, clock) => {
    customCounter?.inc(1);
    console.log(message);
    console.log(cursor);
    console.log(clock);
  });

  // Setup HTTP server & Prometheus metrics
  listen(options);

  // Start streaming
  emitter.start();
})
```
