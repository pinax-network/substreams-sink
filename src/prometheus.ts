import client, { Counter, Gauge } from "prom-client";
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

function registerCounter(name: string, help = "help", labelNames: string[] = []) {
    try {
        register.registerMetric(new Counter({ name, help, labelNames }));
    } catch (e) {
        //
    }
}

function registerGauge(name: string, help = "help", labelNames: string[] = []) {
    try {
        register.registerMetric(new Gauge({ name, help, labelNames }));
    } catch (e) {
        //
    }
}

// Register Counters
registerCounter("substreams_sink_message_size_bytes", "The number of total bytes of message received from the Substreams backend");
registerCounter("substreams_sink_error", "The error count we encountered when interacting with Substreams for which we had to restart the connection loop");
registerCounter("substreams_sink_data_message", "The number of data message received");
registerCounter("substreams_sink_data_message_size_bytes", "The total size of in bytes of all data message received");
registerCounter("substreams_sink_undo_message", "The number of block undo message received");
registerCounter("substreams_sink_unknown_message", "The number of unknown message received");
registerCounter("substreams_sink_progress_message", "The number of progress message received", ["module"]);

// Register Gauges
registerGauge("substreams_sink_backprocessing_completion", "Determines if backprocessing is completed, which is if we receive a first data message");
registerGauge("substreams_sink_progress_message_last_end_block", "Latest progress reported processed range end block for each module, usually increments but due scheduling could make that fluctuates up/down", ["module"]);

const substreamsSinkMessageSizeBytes = register.getSingleMetric("substreams_sink_message_size_bytes") as Counter;
const substreamsSinkError = register.getSingleMetric("substreams_sink_error") as Counter;
const substreamsSinkDataMessage = register.getSingleMetric("substreams_sink_data_message") as Counter;
const substreamsSinkDataMessageSizeBytes = register.getSingleMetric("substreams_sink_data_message_size_bytes") as Counter;
const substreamsSinkUndoMessage = register.getSingleMetric("substreams_sink_undo_message") as Counter;
const substreamsSinkUnknownMessage = register.getSingleMetric("substreams_sink_unknown_message") as Counter;
const substreamsSinkProgressMessage = register.getSingleMetric("substreams_sink_progress_message") as Counter;

const substreamsSinkBackprocessingCompletion = register.getSingleMetric("substreams_sink_backprocessing_completion") as Gauge;
const substreamsSinkProgressMessageLastEndBlock = register.getSingleMetric("substreams_sink_progress_message_last_end_block") as Gauge;

export async function updateMetrics(message: any) { }

export async function listen(port: number, address: string) {
    return new Promise(resolve => {
        server.listen(port, address, () => {
            logger.info("prometheus server", { address, port });
            resolve(true);
        });
    })
}