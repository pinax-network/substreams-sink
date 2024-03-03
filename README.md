# [`Substreams`](https://substreams.streamingfast.io/) Sink CLI `Node.js`

[![Build Status](https://github.com/pinax-network/substreams-sink/actions/workflows/ci.yml/badge.svg)](https://github.com/pinax-network/substreams-sink/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/substreams-sink.svg)](https://badge.fury.io/js/substreams-sink)
![License](https://img.shields.io/github/license/pinax-network/substreams-sink)

> `substreams-sink` is the code template to build Substreams sinks in NodeJS. Sinks allows developers to pipe data extracted from a blockchain to a specified application.

## 📖 Documentation

<!-- ### https://www.npmjs.com/package/substreams-sink -->

### Further resources

- [**Substreams** documentation](https://substreams.streamingfast.io)
- [Subtreams sink project template Github repo](https://github.com/pinax-network/substreams-sink-template)

## Get Substreams API Key
- https://app.pinax.network
- https://app.streamingfast.io/

## 🚀 Quick start

### Installation

```bash
npm install substreams-sink
```

### Features

- [x] includes [Commander.js](https://github.com/tj/commander.js/) helper CLI
- [x] includes [tslog](https://github.com/fullstack-build/tslog) helper logger
- [x] handle reading/saving **Substreams** `cursor` from file or URL
- [x] reads config `.env` file
- [x] includes Prometheus metrics helpers

### CLI

```bash
Usage: substreams-sink run [options]

Substreams Sink

Options:
  -v, --version                        version for substreams-sink
  -e --substreams-endpoint <string>    Substreams gRPC endpoint to stream data from (env: SUBSTREAMS_ENDPOINT)
  --manifest <string>                  URL of Substreams package (env: MANIFEST)
  --module-name <string>               Name of the output module (declared in the manifest) (env: MODULE_NAME)
  -s --start-block <int>               Start block to stream from (defaults to -1, which means the initialBlock of the first module you are streaming) (default: "-1", env: START_BLOCK)
  -t --stop-block <int>                Stop block to end stream at, inclusively (env: STOP_BLOCK)
  -p, --params <string...>             Set a params for parameterizable modules. Can be specified multiple times. (ex: -p module1=valA -p module2=valX&valY) (default: [], env: PARAMS)
  --substreams-api-key <string>        API key for the Substream endpoint (env: SUBSTREAMS_API_KEY)
  --delay-before-start <int>           Delay (ms) before starting Substreams (default: 0, env: DELAY_BEFORE_START)
  --cursor <string>                    Cursor to stream from. Leave blank for no cursor
  --production-mode <boolean>          Enable production mode, allows cached Substreams data if available (choices: "true", "false", default: false, env: PRODUCTION_MODE)
  --final-blocks-only <boolean>        Only process blocks that have pass finality, to prevent any reorg and undo signal by staying further away from the chain HEAD (choices: "true", "false", default: false, env: FINAL_BLOCKS_ONLY)
  --inactivity-seconds <int>           If set, the sink will stop when inactive for over a certain amount of seconds (default: 300, env: INACTIVITY_SECONDS)
  --headers [string...]                Set headers that will be sent on every requests (ex: --headers X-HEADER=headerA) (default: {}, env: HEADERS)
  --plaintext <boolean>                Establish GRPC connection in plaintext (choices: "true", "false", default: false, env: PLAIN_TEXT)
  --verbose <boolean>                  Enable verbose logging (choices: "true", "false", default: false, env: VERBOSE)
  --hostname <string>                  The process will listen on this hostname for any HTTP and Prometheus metrics requests (default: "localhost", env: HOSTNAME)
  --port <int>                         The process will listen on this port for any HTTP and Prometheus metrics requests (default: 9102, env: PORT)
  --metrics-labels [string...]         To apply generic labels to all default metrics (ex: --labels foo=bar) (default: {}, env: METRICS_LABELS)
  --collect-default-metrics <boolean>  Collect default metrics (choices: "true", "false", default: false, env: COLLECT_DEFAULT_METRICS)
  -h, --help                           display help for command
```

### Example

**.env**

```env
# Get Substreams API Key
# https://app.pinax.network
# https://app.streamingfast.io/
SUBSTREAMS_API_KEY=...
SUBSTREAMS_ENDPOINT=https://eth.substreams.pinax.network:443

# SPKG
MANIFEST=https://github.com/pinax-network/substreams/releases/download/blocks-v0.1.0/blocks-v0.1.0.spkg
MODULE_NAME=map_blocks
START_BLOCK=1000000
STOP_BLOCK=1000020
```

**example.js**
```js
import { commander, setup, prometheus, http, logger, fileCursor } from "substreams-sink";

const pkg = {
  name: "substreams-sink",
  version: "0.0.1",
  description: "Substreams Sink long description",
}

// Setup CLI using Commander
const program = commander.program(pkg);
const command = commander.addRunOptions(program);
logger.setName(pkg.name);

// Setup CLI using Commander
const program = commander.program(pkg);
const command = commander.addRunOptions(program);
logger.setName(pkg.name);

// Custom Prometheus Counters
const customCounter = prometheus.registerCounter("custom_counter");

command.action(async options => {
  // Get cursor from file
  const cursor = fileCursor.readCursor("cursor.lock");

  // Setup sink for Block Emitter
  const { emitter } = await setup({...options, cursor});

  emitter.on("session", (session) => {
    console.log(session);
  });

  emitter.on("progress", (progress) => {
    console.log(progress);
  });

  // Stream Blocks
  emitter.on("anyMessage", (message, cursor, clock) => {
    customCounter?.inc(1);
    console.log(message);
    console.log(cursor);
    console.log(clock);
  });

  // Setup HTTP server & Prometheus metrics
  http.listen(options);

  // Save new cursor on each new block emitted
  fileCursor.onCursor(emitter, "cursor.lock");

  // Close HTTP server on close
  emitter.on("close", () => {
    http.server.close();
    console.log("✅ finished");
  })

  // Start the stream
  emitter.start();
})
program.parse();
```
