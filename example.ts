import pkg from "./package.json" assert { type: "json" };
import { logger, commander, setup } from "./index.js";

// Setup CLI using Commander
const program = commander.program(pkg);
const command = commander.run(program, pkg);

command.action(async (options: commander.RunOptions) => {
  // Setup sink for Block Emitter
  const emitter = await setup(options, pkg);

  // Stream Blocks
  emitter.on("anyMessage", (message, cursor, clock) => {
    logger.info(message);
    logger.info(cursor);
    logger.info(clock);
  });

  // Start streaming
  emitter.start();
})
program.parse();
