import client from "prom-client";
import http from "node:http";
import { logger } from "../index.js";

// Prometheus Exporter
export const register = new client.Registry();

// Create a local server to serve Prometheus gauges
export const server = http.createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': register.contentType });
    res.end(await register.metrics());
});

// Metrics
/*
    substreams_sink_message_size_bytes: Counter
    substreams_sink_error: Counter
    substreams_sink_data_message: Counter
    substreams_sink_data_message_size_bytes: Counter
    substreams_sink_progress_message: CounterVec
    substreams_sink_progress_message_last_end_block: GaugeVec
    substreams_sink_undo_message: Counter
    substreams_sink_unknown_message: Counter
    substreams_sink_backprocessing_completion: Gauge
*/

export async function updateMetrics(message: any) {

}

export async function listen(port: number, address: string) {
    return new Promise(resolve => {
        server.listen(port, address, () => {
            logger.info("prometheus server", { address, port });
            resolve(true);
        });
    })
}