import { authIssue } from "@substreams/core";

// Supports 48 characters long Pinax API key
export async function parseAuthorization(authorization: string, url?: string) {
    // issue token if includes server_ prefix or is 48 characters long
    if (authorization.includes("server_") || authorization.length === 48) {
        const { token } = await authIssue(authorization, url);
        return token;
    }

    // no action if Substreams API token is provided
    return authorization;
}