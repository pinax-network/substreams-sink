import { readPackage } from "@substreams/manifest";
import { getModules } from "@substreams/core";

export async function list(url: string) {
    const spkg = await readPackage(url)
    const compatible = []

    for (const { name, output } of getModules(spkg)) {
        if (!output) continue;
        console.log('module', { name, output })
        compatible.push(name)
    }

    return compatible
}