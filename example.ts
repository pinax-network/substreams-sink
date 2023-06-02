import { download, createHash } from "substreams";
import { cli, run, logger, RunOptions } from "./";

const pkg = {
    name: 'substreams-sink-rabbitmq',
    version: '0.1.0',
    description: 'Substreams data to RabbitMQ',
}
logger.settings.name = pkg.name;

const program = cli.program(pkg);
const command = cli.run(program, pkg);
command.option('-U --username <string>', 'RabbitMQ username.', 'guest');
command.option('-P --password <string>', 'RabbitMQ password.', 'guest');
command.option('-p --port <int>', 'Listens on port number.', '5672');
command.option('-a --address <string>', 'RabbitMQ address to connect.', 'localhost');
command.action(action);
program.parse();

interface ActionOptions extends RunOptions {
    address: string;
    port: number;
    username: string;
    password: string;
}

async function action(manifest: string, moduleName: string, options: ActionOptions) {
    // Download Substreams (or read from local file system)
    const spkg = await download(manifest);
    const hash = createHash(spkg);
    logger.info("download", { manifest, hash });

    // Handle custom Sink Options
    const { address, port, username, password } = options;
    const rabbitmq = `amqp://${username}:${password}@${address}:${port}`;
    logger.info("connect", { rabbitmq });

    // Run Substreams
    const substreams = run(spkg, moduleName, options);
    substreams.on("anyMessage", message => {
        // Handle message
        logger.info("anyMessage", message);
    })
    substreams.start(options.delayBeforeStart);
}

