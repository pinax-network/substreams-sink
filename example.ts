import pkg from "./package.json" assert { type: "json" };
import { commander, setup, prometheus, http } from "./index.js";

// Setup CLI using Commander
const program = commander.program(pkg);
const command = commander.run(program, pkg);

// Custom Prometheus Counters
const customCounter = prometheus.registerCounter("custom_counter");

command.action(async (options: commander.RunOptions) => {
  // Setup sink for Block Emitter
  const {emitter} = await setup(options, pkg);

  // Stream Blocks
  emitter.on("anyMessage", (message, cursor, clock) => {
    customCounter?.inc(1);
    console.log(message);
    console.log(cursor);
    console.log(clock);
  });

  // Setup HTTP server & Prometheus metrics
  http.listen(options);

  // Start streaming
  emitter.start();
})