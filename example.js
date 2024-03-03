import { commander, setup, prometheus, http, logger, fileCursor } from "./dist/index.js";

const pkg = {
  name: "substreams-sink",
  version: "0.0.1",
  description: "Substreams Sink long description",
}

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