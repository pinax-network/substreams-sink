import fs from "fs";
import type { BlockEmitter } from "@substreams/node";

export function onCursor(emitter: BlockEmitter, cursorFile: string) {
    emitter.on("cursor", (cursor) => {
        fs.writeFileSync(cursorFile, cursor, "utf-8");
    });
}

export function readCursor(cursorFile: string) {
    return fs.existsSync(cursorFile) ? fs.readFileSync(cursorFile, 'utf8') : "";
}
