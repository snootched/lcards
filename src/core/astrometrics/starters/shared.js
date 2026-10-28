/**
 * A part's centre param as a point reference: a point id stays; coordinates
 * get an anchor point of the part's own (`centre`, prefixed with the rest).
 * @param {string | number[]} centre
 * @returns {{ ref: string, points: any[] }}
 */
export function centreRef(centre) {
  if (typeof centre === 'string' && centre) return { ref: centre, points: [] };
  const xyz = Array.isArray(centre) && centre.length === 3 ? centre.map(Number) : [0, 0, 0];
  return { ref: 'centre', points: [{ id: 'centre', xyz }] };
}
