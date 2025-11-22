/* eslint-env node */
/* global process */
import fs from 'node:fs';
import path from 'node:path';

function parseLine(line) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) return null;

    let value = match[2] || '';
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
        value = value.slice(1, -1);
    }
    return { key: match[1], value };
}

export function config(options = {}) {
    const envPath = options.path || '.env';
    const resolvedPath = path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);

    if (!fs.existsSync(resolvedPath)) {
        return { parsed: {} };
    }

    const fileContent = fs.readFileSync(resolvedPath, { encoding: options.encoding || 'utf8' });
    const parsed = {};

    fileContent.split(/\r?\n/).forEach(line => {
        const result = parseLine(line);
        if (result) {
            parsed[result.key] = result.value;
            if (!Object.prototype.hasOwnProperty.call(process.env, result.key)) {
                process.env[result.key] = result.value;
            }
        }
    });

    return { parsed };
}

export default { config };
