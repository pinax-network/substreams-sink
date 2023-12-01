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
    const text = await response.text();

    /**
     * Consul KV
     * https://developer.hashicorp.com/consul/api-docs/kv
     *
     * @example
     * [{"Value":"n-5SB30M-16YouthlRFszqWwLpcyB1JpXQPsLRNL1..."}]
     */
    try {
        const data = JSON.parse(text) as { Value: string }[];
        if ( data.length ) {
            const value = data[0]?.Value;
            if ( value ) return value;
        }
    /**
     * Simple HTTP text response
     *
     * @example
     * n-5SB30M-16YouthlRFszqWwLpcyB1JpXQPsLRNL1...
     */
    } catch (error) {
        if ( text ) return text;
    }
    return "";
}
