/**
 * next-version.js - the next LCARdS version (scheme YYYY.MM.SEQ[-dev.N], the sequence
 * resets to 0 on each new month). Used by scripts/bump-version.js; pure, so it is tested
 * (tests/core/next-version.test.js).
 */

/** @param {string} base @returns {number[] | null} */
const parts = (base) => (/^\d{4}\.\d{2}\.\d+$/.test(base) ? base.split('.').map(Number) : null);

/** @param {number[]} a @param {number[]} b @returns {number} */
const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/**
 * @param {string} current - package.json's version
 * @param {{ dev?: boolean, target?: string, now?: Date }} [opts]
 *   dev: a dev build (-dev.N); target: the base to move to (YYYY.MM.SEQ), e.g. the next
 *   release's 2026.12.0 straight after 2026.11.0 ships, still in November
 * @returns {string}
 */
export function nextVersion(current, { dev = false, target, now = new Date() } = {}) {
    const hyphen = current.indexOf('-');
    const base = hyphen === -1 ? current : current.slice(0, hyphen);
    const suffix = hyphen === -1 ? null : current.slice(hyphen + 1);
    const cur = parts(base);
    if (!cur) throw new Error(`Expected version in YYYY.MM.SEQ form, got "${base}" (from "${current}")`);
    const devN = suffix ? /^dev\.(\d+)$/.exec(suffix) : null;

    if (target !== undefined) {
        const t = parts(target);
        if (!t) throw new Error(`Target must be YYYY.MM.SEQ (e.g. 2026.12.0), got "${target}"`);
        const order = compare(t, cur);
        // the same base only while on its dev builds: then it is the usual bump
        if (order < 0 || (order === 0 && !suffix)) {
            throw new Error(`Target ${target} is not after the current version ${current}`);
        }
        if (order > 0) return dev ? `${target}-dev.1` : target;
    }

    // advance SEQ within the current month, reset to 0 across a month rollover
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const nextBase = cur[0] === y && cur[1] === m ? `${base.slice(0, 7)}.${cur[2] + 1}` : `${y}.${String(m).padStart(2, '0')}.0`;

    if (dev) {
        if (devN) return `${base}-dev.${Number(devN[1]) + 1}`;
        if (suffix) return `${base}-dev.1`; // an old-style suffix (-dev3): dev.1 on the same base
        return `${nextBase}-dev.1`;
    }
    return suffix ? base : nextBase;
}
