import { readPackage } from "@substreams/manifest";
import { getModules } from "@substreams/core";

import { logger } from "./logger.js";

export async function list(url: string) {
    const spkg = await readPackage(url)
    const compatible = []

    for (const { name, output } of getModules(spkg)) {
        if (!output) continue;
        logger.info('module', { name, output })
        compatible.push(name)
    }

    return compatible
}