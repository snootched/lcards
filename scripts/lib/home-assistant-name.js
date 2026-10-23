/**
 * House style for user-facing text: write "Home Assistant" in full, never the
 * bare abbreviation "HA" (HA frontend user-facing-text guidance, adopted
 * 2026-10-22). Names that merely contain it stay: HA-LCARS (a theme), HACS,
 * HA_TOKEN, `--ha-*` variables, `ha-*` element tags.
 *
 * Shared by scripts/check-doc-ha-name.js (docs, in the build) and
 * tests/docs/home-assistant-name.test.js (schemas, integration strings).
 */

/** Bare "HA": not HA-LCARS, not an upper-case tag name such as HA-DIALOG or HA-*. "HA-native" counts. */
export const BARE_HA = /\bHA\b(?!-LCARS)(?!-[A-Z*])/;

// Spans inside a prose line that are code or markup, not text.
const PROTECTED = /`[^`\n]*`|\]\([^)\n]*\)|<[^>\n]*>|\{#[^}\n]*\}|https?:\/\/\S+/g;

/** True when a plain string (a schema description, an action description) uses bare "HA". */
export function hasBareHa(text) {
    return BARE_HA.test(String(text ?? '').replace(PROTECTED, ' '));
}

/**
 * Lines of a markdown page whose prose uses bare "HA". Skips code fences except
 * their `#` comments, inline code, link targets, HTML tags and frontmatter other
 * than title/description.
 * @param {string} markdown
 * @returns {{ line: number, text: string }[]}
 */
export function bareHaLines(markdown) {
    const hits = [];
    let fence = null;
    let frontmatter = false;
    markdown.split('\n').forEach((line, i) => {
        const trimmed = line.trimStart();
        let prose = null;
        if (i === 0 && line === '---') { frontmatter = true; return; }
        if (frontmatter) {
            if (line === '---') frontmatter = false;
            else if (/^(title|description):/.test(line)) prose = line;
        } else if (fence) {
            if (trimmed.startsWith(fence)) fence = null;
            else prose = line.match(/(?:^|\s)#\s.*$/)?.[0] ?? null;
        } else {
            const open = trimmed.match(/^(`{3,}|~{3,})/);
            if (open) fence = open[1];
            else prose = line;
        }
        if (prose !== null && hasBareHa(prose)) hits.push({ line: i + 1, text: line.trim() });
    });
    return hits;
}
