"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function normalizeValue(rawValue) {
    const trimmed = rawValue.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}
function loadEnv() {
    const envPath = (0, node_path_1.resolve)(process.cwd(), '.env');
    if (!(0, node_fs_1.existsSync)(envPath)) {
        return;
    }
    const contents = (0, node_fs_1.readFileSync)(envPath, 'utf8');
    for (const rawLine of contents.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
            continue;
        }
        const equalsIndex = line.indexOf('=');
        if (equalsIndex === -1) {
            continue;
        }
        const key = line.slice(0, equalsIndex).trim();
        const value = normalizeValue(line.slice(equalsIndex + 1));
        if (!key || process.env[key] !== undefined) {
            continue;
        }
        process.env[key] = value;
    }
}
//# sourceMappingURL=load-env.js.map