import fetch from "node-fetch";
import type { BlockEmitter } from "@substreams/node";

export function onCursor(emitter: BlockEmitter, cursorPath: string) {
    emitter.on("cursor", async (cursor) => {
        await fetch(cursorPath, { method: "PUT", body: cursor });
    });
}

export async function readCursor(cursorPath: string, httpCursorAuth?: string) {
    const headers = httpCursorAuth ? { Authorization: `Basic ${httpCursorAuth}` } : undefined;
    const response = await fetch(cursorPath, { headers });

    if (!response.ok) {
        return "";
    }

    const data: any = await response.json();
    return data[0] && data[0].Value ? data[0].Value : "";
}
