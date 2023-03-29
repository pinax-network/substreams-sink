import { cli, run, logger, RunOptions } from "../";

const pkg = {
    name: 'substreams-sink-rabbitmq',
    version: '0.1.0',
    description: 'Substreams data to RabbitMQ',
}
logger.defaultMeta = { service: pkg.name };

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
    const substreams = await run(manifest, moduleName, options);
    const { address, port, username, password } = options;
    const rabbitmq = `amqp://${username}:${password}@${address}:${port}`;
    logger.info("connect", {rabbitmq});

    substreams.on("anyMessage", message => {
        logger.info("anyMessage", message);
    })
    substreams.start();
}

