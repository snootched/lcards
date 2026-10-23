/**
 * `grid-floor` scene (lazy chunk): a perspective LCARS wireframe floor
 * scrolling toward the viewer, a scan line sweeping in from the horizon and a
 * slow camera drift.
 *
 * All motion is anime.js on three.js objects through the three adapter: the
 * floor's z loop, a timeline for the scan line (its mesh and its material
 * opacity), the camera rig's drift, and `utils.set()` for the `camera_height`
 * / `camera_tilt` keys. Seeked from the effect clock (ThreeSceneEffect).
 *
 * @module core/packs/backgrounds/webgl/scenes/grid-floor
 */
import {
  Scene, PerspectiveCamera, Group, BufferGeometry, Float32BufferAttribute, LineSegments,
  LineBasicMaterial, PlaneGeometry, Mesh, MeshBasicMaterial, AdditiveBlending, DoubleSide
} from 'three';
import { animate, createTimeline, utils } from 'animejs';
import { toColor, addDepthFade } from './scene-helpers.js';

const HALF_WIDTH = 40;
const LENGTH = 80;
/** Where the lines toward the horizon stop, in world z (just in front of the camera) */
const NEAR_CUT = -0.3;

/**
 * @param {{ params: Record<string, any>, colors: Record<string, Array<{ r: number, g: number, b: number, a: number }>> }} opts
 */
export function createScene({ params, colors }) {
  const spacing = Math.max(0.25, params.line_spacing ?? 2);

  const scene = new Scene();
  const rig = new Group();
  const camera = new PerspectiveCamera(60, 1, 0.1, LENGTH + 10);
  rig.add(camera);
  scene.add(rig);

  // Floor: lines along x and z on y = 0, one cell longer than shown so the
  // z loop over one cell is seamless. The lines toward the horizon never
  // reach behind the camera: their near ends are kept at NEAR_CUT every frame
  // (a line crossing the near plane vanished with the fade shader on SwiftShader).
  const points = [];
  let depthLines = 0;
  for (let x = -HALF_WIDTH; x <= HALF_WIDTH + 1e-6; x += spacing, depthLines++) points.push(x, 0, -LENGTH, x, 0, NEAR_CUT);
  for (let z = -LENGTH; z <= spacing + 1e-6; z += spacing) points.push(-HALF_WIDTH, 0, z, HALF_WIDTH, 0, z);
  const floorGeometry = new BufferGeometry();
  floorGeometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  const floorMaterial = new LineBasicMaterial({ color: 0xffffff, blending: AdditiveBlending });
  addDepthFade(floorMaterial, { camera, far: { value: LENGTH * 0.7 }, full: { value: LENGTH * 0.15 } });
  const floor = new LineSegments(floorGeometry, floorMaterial);
  scene.add(floor);

  // Scan line: a thin glowing band lying on the floor
  const scanGeometry = new PlaneGeometry(HALF_WIDTH * 2, spacing * 0.12);
  scanGeometry.rotateX(-Math.PI / 2);
  const scanMaterial = new MeshBasicMaterial({ color: 0xffffff, blending: AdditiveBlending, side: DoubleSide, opacity: 0 });
  addDepthFade(scanMaterial, { camera, far: { value: LENGTH }, full: { value: LENGTH * 0.4 } });
  const scan = new Mesh(scanGeometry, scanMaterial);
  scan.position.y = 0.01;
  scene.add(scan);

  // Motion, all through the adapter, paused: the effect clock seeks it
  const animations = [
    animate(floor, { z: [0, spacing], duration: 1600, ease: 'linear', loop: true, autoplay: false }),
    animate(rig, { x: [-1.2, 1.2], rotateZ: [-1.5, 1.5], duration: 14000, ease: 'inOutSine', loop: true, alternate: true, autoplay: false }),
    createTimeline({ loop: true, autoplay: false })
      .add(scan, { z: [-LENGTH * 0.9, -0.6], duration: 5200, ease: 'inQuad' }, 0)
      .add(scanMaterial, { opacity: [0, 1, 1, 0], duration: 5200, ease: 'linear' }, 0)
      .add({}, { duration: 1800 })
  ];

  /** @param {string} key @param {number} value */
  function setParam(key, value) {
    if (key === 'camera_height') utils.set(camera, { y: value });
    else if (key === 'camera_tilt') utils.set(camera, { rotateX: -value });
  }
  setParam('camera_height', params.camera_height ?? 1.6);
  setParam('camera_tilt', params.camera_tilt ?? 8);

  /** @param {Record<string, Array<{ r: number, g: number, b: number, a: number }>>} cols */
  function setColors(cols) {
    const line = cols.lines?.[0] ?? { r: 255, g: 153, b: 102, a: 1 };
    const band = cols.scan?.[0] ?? { r: 223, g: 225, b: 232, a: 1 };
    toColor(line, floorMaterial.color);
    floorMaterial.opacity = line.a ?? 1;
    toColor(band, scanMaterial.color);
  }
  setColors(colors);

  return {
    scene,
    camera,
    /** @param {number} t - effect clock in ms */
    seek(t) {
      for (const a of animations) a.seek(t);
      const nearZ = NEAR_CUT - floor.position.z;
      const position = floorGeometry.attributes.position;
      if (position.getZ(1) !== nearZ) {
        for (let k = 0; k < depthLines; k++) position.setZ(k * 2 + 1, nearZ);
        position.needsUpdate = true;
      }
    },
    /** @param {number} w @param {number} h */
    resize(w, h) {
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    },
    setParam,
    setColors,
    dispose() {
      animations.forEach((a) => a.cancel());
      floorGeometry.dispose();
      floorMaterial.dispose();
      scanGeometry.dispose();
      scanMaterial.dispose();
    }
  };
}
