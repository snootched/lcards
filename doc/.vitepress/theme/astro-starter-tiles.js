/**
 * The heading slug VitePress gives a starter's title on the Starters page
 * (lower case, punctuation dropped, spaces to hyphens), for tile links.
 * @param {string} title
 * @returns {string}
 */
export function starterSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}
