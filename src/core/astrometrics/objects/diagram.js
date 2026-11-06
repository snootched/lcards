/**
 * Diagram forms: an object's LCARS wireframe for the card's diagram look
 * (looks.js). The wireframe is a part shown in the diagram look only
 * (`diagramOnly`), and the object's body a part shown in the realistic and
 * mixed looks (`realistic`), so the mixed look stays as the object always
 * drew. The runtime crossfades the parts when the look changes; an object
 * with a `look` of its own keeps itself whole.
 *
 * The wireframe draws with the lines rings and paths use (FatLine: a width
 * in px), in the object's own colour, so its colour bindings and alert
 * modes reach it (recolor.js).
 *
 * @module core/astrometrics/objects/diagram
 */
import { Group, Quaternion } from 'three';
import { FatLine } from '../lines.js';

/** A diagram line's width, px */
export const DIAGRAM_WIDTH = 1.5;

/**
 * A group for an object's body (its realistic part). The look shows and
 * hides the group, so whatever the body shows or hides inside it (a rock
 * swapped for a dot far away) is left to the object.
 * @param {string} [name]
 */
export function bodyGroup(name = 'body') {
  const g = new Group();
  g.name = name;
  return g;
}

/**
 * Add a diagram form to a built object: a line of `runs` (flat
 * [x, y, z, ...] lists in `parent`'s space), hidden until the diagram look
 * shows it, and `body` as the realistic part.
 * @param {import('./common.js').BuiltObject} out
 * @param {{ runs: number[][], color: number[], body: import('three').Object3D[], parent?: import('three').Object3D, width?: number, opacity?: number, facing?: boolean }} o
 *   facing: the line turns to face the camera (drawn in its x-y plane)
 * @returns {FatLine}
 */
export function addDiagram(out, { runs, color, body, parent = out.node, width = DIAGRAM_WIDTH, opacity = 1, facing = false }) {
  const line = new FatLine([], { color, width, opacity: opacity * (color[3] ?? 1), dash: null, additive: false, tube: false });
  line.setRuns(runs);
  const obj = line.object;
  obj.name = 'diagram';
  obj.renderOrder = 2;
  // the look shows it (distance-fade.js scaleNodes, for each render)
  obj.visible = false;
  if (facing) faceCamera(obj);
  parent.add(obj);
  out.lines.push(line);
  const parts = out.lookParts ?? {};
  out.lookParts = {
    ...parts,
    diagramOnly: [...(parts.diagramOnly ?? []), obj],
    realistic: [...(parts.realistic ?? []), ...body]
  };
  return line;
}

/**
 * New runs for a diagram line, keeping it shown or hidden as it was: the
 * look decides that as it draws (FatLine.setRuns would show it).
 * @param {FatLine} line
 * @param {number[][]} runs
 */
export function redrawDiagram(line, runs) {
  const shown = line.object.visible;
  line.setRuns(runs);
  line.object.visible = shown && runs.length > 0;
}

/**
 * Turn a node to face the camera as it draws (its x-y plane to the screen).
 * @param {import('three').Object3D} obj
 */
function faceCamera(obj) {
  const parentQ = new Quaternion();
  obj.onBeforeRender = (_r, _s, camera) => {
    obj.parent?.getWorldQuaternion(parentQ);
    obj.quaternion.copy(parentQ.invert().multiply(camera.quaternion));
    obj.updateMatrixWorld();
  };
}

/**
 * A circle in the x-y plane (for a facing line), as one closed run.
 * @param {number} r
 * @param {number} [n]
 * @returns {number[]}
 */
export function circleXY(r, n = 64) {
  const run = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    run.push(r * Math.cos(t), r * Math.sin(t), 0);
  }
  return run;
}

/**
 * A circle in the x-z plane (flat, round the y axis) at height y.
 * @param {number} r
 * @param {number} [y]
 * @param {number} [n]
 * @returns {number[]}
 */
export function circleXZ(r, y = 0, n = 128) {
  const run = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    run.push(r * Math.sin(t), y, -r * Math.cos(t));
  }
  return run;
}

/**
 * The edges of a geometry as two-point runs (EdgesGeometry: edges where the
 * faces meet at more than `angle` degrees), scaled.
 * @param {import('three').BufferGeometry} edges - an EdgesGeometry
 * @param {number} [scale]
 * @returns {number[][]}
 */
export function edgeRuns(edges, scale = 1) {
  const p = /** @type {any} */ (edges.getAttribute('position')).array;
  const runs = [];
  for (let i = 0; i + 5 < p.length; i += 6) runs.push([p[i] * scale, p[i + 1] * scale, p[i + 2] * scale, p[i + 3] * scale, p[i + 4] * scale, p[i + 5] * scale]);
  return runs;
}
