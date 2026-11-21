/**
 * glb-meshopt.mjs: compresses a GLB's buffer views with EXT_meshopt_compression
 * (lossless: vertex attributes, animation samplers and triangle indices as
 * they are, no quantisation or filters). Used by `make-ships.mjs
 * --meshopt` to write the test fixture that exercises the model chunk's
 * meshopt decoder.
 *
 * The encoder comes from the `meshoptimizer` package (a dev dependency of
 * @types/three; this script is only run by hand).
 */
import { MeshoptEncoder } from 'meshoptimizer';

const EXT = 'EXT_meshopt_compression';
const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

/** @param {Buffer} glb */
function readGlb(glb) {
  if (glb.readUInt32LE(0) !== GLB_MAGIC) throw new Error('not a GLB');
  let off = 12;
  let json = null;
  let bin = null;
  while (off < glb.length) {
    const len = glb.readUInt32LE(off);
    const type = glb.readUInt32LE(off + 4);
    const data = glb.subarray(off + 8, off + 8 + len);
    if (type === JSON_CHUNK) json = JSON.parse(data.toString('utf8'));
    else if (type === BIN_CHUNK) bin = data;
    off += 8 + len;
  }
  return { json, bin };
}

/** @param {any} json @param {Buffer} bin */
function writeGlb(json, bin) {
  const pad = (/** @type {Buffer} */ b, fill) => (b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - (b.length % 4), fill)]) : b);
  const j = pad(Buffer.from(JSON.stringify(json), 'utf8'), 0x20);
  const b = pad(bin, 0);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + j.length + 8 + b.length, 8);
  const chunk = (/** @type {Buffer} */ data, type) => {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(data.length, 0);
    h.writeUInt32LE(type, 4);
    return Buffer.concat([h, data]);
  };
  return Buffer.concat([header, chunk(j, JSON_CHUNK), chunk(b, BIN_CHUNK)]);
}

const COMPONENT_SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const TYPE_COUNT = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

/**
 * @param {Buffer} glb
 * @returns {Promise<Buffer>}
 */
export async function meshoptCompress(glb) {
  await MeshoptEncoder.ready;
  const { json, bin } = readGlb(glb);
  if (!json || !bin) throw new Error('GLB without JSON or BIN chunk');
  const indexViews = new Set();
  for (const mesh of json.meshes ?? []) for (const prim of mesh.primitives) if (prim.indices !== undefined && (prim.mode ?? 4) === 4) indexViews.add(json.accessors[prim.indices].bufferView);

  /** @type {Map<number, any>} one accessor per view (the exporter writes one) */
  const viewAccessor = new Map();
  for (const a of json.accessors) if (a.bufferView !== undefined) viewAccessor.set(a.bufferView, a);

  const parts = [];
  let size = 0;
  json.bufferViews.forEach((/** @type {any} */ view, /** @type {number} */ i) => {
    const acc = viewAccessor.get(i);
    if (!acc || view.buffer !== 0) return;
    const elem = COMPONENT_SIZE[acc.componentType] * TYPE_COUNT[acc.type];
    const stride = view.byteStride ?? elem;
    const tri = indexViews.has(i);
    // the codec wants strides of 4 (attributes) or 2 / 4 (indices)
    if (tri ? stride !== 2 && stride !== 4 : stride % 4 !== 0) return;
    const count = tri ? acc.count : view.byteLength / stride;
    const src = new Uint8Array(bin.buffer, bin.byteOffset + (view.byteOffset ?? 0), count * stride);
    const out = MeshoptEncoder.encodeGltfBuffer(src, count, stride, tri ? 'TRIANGLES' : 'ATTRIBUTES');
    const offset = size;
    parts.push(Buffer.from(out));
    size += out.length;
    const padding = (4 - (size % 4)) % 4;
    if (padding) { parts.push(Buffer.alloc(padding)); size += padding; }
    view.extensions = { ...(view.extensions ?? {}), [EXT]: { buffer: 0, byteOffset: offset, byteLength: out.length, byteStride: stride, count, mode: tri ? 'TRIANGLES' : 'ATTRIBUTES' } };
    view.buffer = 1;
  });

  // Views left uncompressed keep their bytes in the BIN chunk (after the compressed ones)
  const kept = [];
  json.bufferViews.forEach((/** @type {any} */ view) => {
    if (view.buffer !== 0) return;
    const data = bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    view.byteOffset = size;
    kept.push(data);
    size += data.length;
    const padding = (4 - (size % 4)) % 4;
    if (padding) { kept.push(Buffer.alloc(padding)); size += padding; }
  });

  // Buffer 0 is the BIN chunk (compressed data); buffer 1 the fallback, never loaded
  json.buffers = [{ byteLength: size }, { byteLength: json.buffers[0].byteLength, extensions: { [EXT]: { fallback: true } } }];
  json.extensionsUsed = [...new Set([...(json.extensionsUsed ?? []), EXT])];
  json.extensionsRequired = [...new Set([...(json.extensionsRequired ?? []), EXT])];
  return writeGlb(json, Buffer.concat([...parts, ...kept]));
}
