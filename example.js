import pkg from "./package.json" assert { type: "json" };
import { commander, setup, prometheus, http, logger } from "./dist/index.js";

// Setup CLI using Commander
const program = commander.program(pkg);
const command = commander.run(program, pkg);
logger.setName(pkg.name);

// Custom Prometheus Counters
const customCounter = prometheus.registerCounter("custom_counter");

command.action(async options => {
  // Setup sink for Block Emitter
  const { emitter } = await setup(options);
  console.log("setup")

  // Stream Blocks
  emitter.on("anyMessage", (message, cursor, clock) => {
    customCounter?.inc(1);
    console.log(message);
    console.log(cursor);
    console.log(clock);
    process.exit()
  });

  // Setup HTTP server & Prometheus metrics
  http.listen(options);

  // Start streaming
  await emitter.start();
  http.server.close();
  console.log("✅ finished");
})
program.parse();