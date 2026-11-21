/**
 * Source scanning for guard tests: find lines in src/ that match a pattern,
 * so a consolidated helper (one colour grammar, one resolver) stays the only
 * implementation.
 *
 *   const hits = findInSource(/resolveCssVariable\(.*\.resolve\(/, { allow: ['resolve-color.js'] });
 *   assert.deepEqual(hits, []);
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function files(dir) {
    return readdirSync(dir).flatMap(name => {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) return files(p);
        return p.endsWith('.js') ? [p] : [];
    });
}

/** Code only: comments blanked (documentation may mention the patterns); line numbers kept. */
const code = (text) => text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

/**
 * @param {RegExp} pattern - Tested against each code line
 * @param {Object} [options]
 * @param {string[]} [options.roots=['src']]
 * @param {string[]} [options.allow=[]] - Path suffixes that may match
 * @returns {string[]} `path:line` for every match
 */
export function findInSource(pattern, { roots = ['src'], allow = [] } = {}) {
    return roots.flatMap(files)
        .map(p => relative('.', p).replace(/\\/g, '/'))
        .filter(path => !allow.some(a => path.endsWith(a)))
        .flatMap(path => code(readFileSync(path, 'utf8')).split('\n')
            .flatMap((line, i) => (pattern.test(line) ? [`${path}:${i + 1}`] : [])));
}
