# [`Substreams`](https://substreams.streamingfast.io/) Sink CLI `Node.js`

[<img alt="github" src="" height="20">](https://github.com/pinax-network/substreams-sink)
[<img alt="npm" src="" height="20">](https://www.npmjs.com/package/substreams-sink)
[<img alt="GitHub Workflow Status" src="" height="20">](https://github.com/pinax-network/substreams-sink/actions?query=branch%3Amain)

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
- [x] includes [Winston](https://github.com/winstonjs/winston) helper logger 
- [x] includes **Substreams** `run()` helper method & `RunOptions` interface
- [x] handle reading/saving **Substreams** `cursor.lock` file
- [x] reads `SUBSTREAMS_API_TOKEN` from `.env` file

### Example

```js
import { cli, run, logger, RunOptions } from "substreams-sink";

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
```