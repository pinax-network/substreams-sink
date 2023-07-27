import fetch from "node-fetch";
import type { BlockEmitter } from "@substreams/node";

export function onCursor(emitter: BlockEmitter, cursorPath: string) {
    emitter.on("cursor", async (cursor) => {
        await fetch(cursorPath, { method: "PUT", body: cursor });
    });
}

export async function readCursor(cursorPath: string) {
    const response = await fetch(cursorPath);

    if (!response.ok) {
        return "";
    }

    const data: any = await response.json();
    return data[0] && data[0].Value ? data[0].Value : "";
}
