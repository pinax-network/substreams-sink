import http from "node:http";
import { logger } from "./logger.js";
import { registry } from "./prometheus.js";
import type { RunOptions } from "./commander.js";

// Create a local server to serve Prometheus metrics
export const server = http.createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': registry.contentType });
    res.end(await registry.metrics());
});

export async function listen(options: RunOptions) {
    const hostname = options.hostname;
    const port = options.port;
    return new Promise(resolve => {
        server.listen(port, hostname, () => {
            logger.info("prometheus server", { hostname, port });
            resolve(true);
        });
    })
}