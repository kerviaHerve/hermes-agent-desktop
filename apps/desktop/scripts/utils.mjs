import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Returns true only when this file is invoked by Node, not imported.
// Resolve aliases such as macOS /var -> /private/var before comparing paths.
/** @param {string} importMetaUrl @returns {boolean} */
export function isMain(importMetaUrl) {
    const entry = process.argv[1];
    if (entry === undefined) return false;
    try {
        return realpathSync(fileURLToPath(importMetaUrl)) === realpathSync(path.resolve(entry));
    } catch {
        return false;
    }
}
