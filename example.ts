import pkg from "./package.json" assert { type: "json" };
import { createRegistry, createRequest, fetchSubstream } from "@substreams/core";
import { BlockEmitter, createDefaultTransport } from "@substreams/node";
import { prometheus, logger, commander, cursor, config } from "./index.js";

// Setup CLI using Commander
const program = commander.program(pkg);
const command = commander.run(program, pkg);

command.action(async (options: commander.RunOptions) => {
  // auth API token
  // https://app.streamingfast.io/
  const token = config.getToken(options);
  const baseUrl = config.getBaseUrl(options);

  // User parameters
  const manifest = config.getManifest(options);
  const outputModule = config.getModuleName(options);
  const startBlockNum = config.getStartBlock(options);
  const stopBlockNum = config.getStopBlock(options);
  const cursorFile = config.getCursorFile(options);
  const verbose = config.getVerbose(options);

  // Configure logging with TSLog
  logger.setName(pkg.name);
  if ( verbose ) logger.enable();

  // Read Substream
  const substreamPackage = await fetchSubstream(manifest);

  // Connect Transport
  const registry = createRegistry(substreamPackage);
  const transport = createDefaultTransport(baseUrl, token, registry);
  const request = createRequest({
    substreamPackage,
    outputModule,
    startBlockNum,
    stopBlockNum,
    productionMode: true,
    startCursor: cursor.readCursor(cursorFile),
  });

  // Substreams Block Emitter
  const emitter = new BlockEmitter(transport, request, registry);

  // Stream Blocks
  emitter.on("anyMessage", (message, cursor, clock) => {
    logger.info(message);
    logger.info(cursor);
    logger.info(clock);
  });
  // Handle Prometheus Metrics
  prometheus.onPrometheusMetrics(emitter);

  // Save new cursor on each new block emitted
  cursor.onCursor(emitter, cursorFile);

  // Start streaming
  emitter.start();
})

program.parse();
