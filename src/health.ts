import type { IncomingMessage, ServerResponse } from "http";

import * as prometheus from "./prometheus.js";
import * as http from "./http.js";

export function health() {
    http.server.on("request", async (req, res) => {
        if (!req.url) return;
        try {
            if (req.method == "GET") {
                if (req.url === "/health") {
                    const messages = await getSingleMetric("substreams_sink_data_message")
                    if (messages) return toText(res, "OK");
                    return toText(res, "no messages received yet", 503);
                }
            }
        } catch (err: any) {
            res.statusCode = 400;
            return res.end(err.message);
        }
    });
}

async function getSingleMetric(name: string) {
    const metric = prometheus.registry.getSingleMetric(name);
    const get = await metric?.get();
    return get?.values[0].value;
}

function toText(res: ServerResponse<IncomingMessage>, data: any, status = 200) {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(data);
}