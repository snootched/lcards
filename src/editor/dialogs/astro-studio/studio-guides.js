/**
 * @fileoverview The Astrometrics Studio's info guides: the overview (what a
 * scene, a system, objects, points and units are) and one per tab, each with
 * links to the docs. All closed by default.
 *
 * @module editor/dialogs/astro-studio/studio-guides
 */

import { html } from 'lit';
import { renderInfoGuide } from '../../components/shared/info-guide.js';
import { docsUrl, ASTRO_STUDIO_DOCS as D } from '../../utils/yaml-docs-links.js';
import '../../components/shared/lcards-astro-diagram.js';

/**
 * A row of docs links.
 * @param {Array<[string, string]>} links - [label, DOCS path]
 */
const links = (links) => html`
  <div class="info-guide-links">
    ${links.map(([label, path]) => html`<a href=${docsUrl(path)} target="_blank" rel="noopener">${label}</a>`)}
  </div>`;

/**
 * How a scene is built: the overview at the top of the Scene tab.
 * @param {{ open?: boolean }} [opts]
 */
export function overviewGuide({ open = false } = {}) {
  return renderInfoGuide({
    id: 'astro-overview',
    header: 'How an Astrometrics scene works',
    icon: 'mdi:telescope',
    open,
    body: html`
      <lcards-astro-diagram kind="scale"></lcards-astro-diagram>
      <ul>
        <li><b>Objects</b> are what is drawn: grids and sector maps, planets, rings and orbits, routes, nebulae, galaxies, ships and stations.</li>
        <li><b>Points</b> are named places. They carry labels and markers, and objects, routes and camera views name them by id. A point can stand on an object: a city on a planet, a cell of a sector map, a part of a ship.</li>
        <li><b>Units</b> are yours to pick. Positions, sizes and distances are all in scene units; name them (light years, au, km) when you use real numbers.</li>
        <li><b>Systems</b> hold their own points and objects in units of their own at a point of the scene: a galaxy in light years with a solar system in km inside it. Open one from its row in the Objects tab. The camera works in a system's units while it is near.</li>
        <li><b>Camera views</b> are named places to look from. Tap actions fly to them, and one is where the card starts.</li>
      </ul>
      <div class="info-guide-tip">Build in tab order: pick a starter, set the scene, add objects, put points on them, then capture views.</div>
      ${links([['The Astrometrics card', D.card], ['Scale and units', D.scale], ['Star systems', D.systems], ['The Studio', D.studio]])}
    `
  });
}

/** The Starters tab: scenes and parts, and what inserting does */
export function startersGuide() {
  return renderInfoGuide({
    id: 'astro-starters',
    header: 'About starters',
    icon: 'mdi:rocket-launch-outline',
    body: html`
      <lcards-astro-diagram kind="starters"></lcards-astro-diagram>
      <ul>
        <li><b>Scenes</b> are whole cards: points, objects, views, backdrop and labels. Use one to start over, or merge it into what is here.</li>
        <li><b>Parts</b> add one thing next to your scene, such as a planet with moons or an asteroid belt. Their ids start with the name you give, so the same part can go in twice.</li>
        <li><b>Try in the preview</b> shows a starter on the card without changing anything; <b>Keep</b> puts it in, <b>Discard</b> goes back. Its settings can still change while you try it.</li>
        <li>A starter is copied into your config: change anything afterwards, nothing refers back to it. <b>Undo</b> (Ctrl+Z, or the preview's toolbar) takes it out again, and Cancel leaves the card as it was.</li>
      </ul>
      ${links([['Every starter', D.starters]])}
    `
  });
}

/** The Scene tab's guide is the overview; this is the Objects tab's */
export function objectsGuide() {
  return renderInfoGuide({
    id: 'astro-objects',
    header: 'How objects work',
    icon: 'mdi:shape-outline',
    body: html`
      <lcards-astro-diagram kind="distance"></lcards-astro-diagram>
      <ul>
        <li><b>Add object</b> lists every type by what it is for. A new object gets an id and the keys its type needs.</li>
        <li>Every object takes a place (<code>at</code>: coordinates or a point), rotation, spin, opacity and visibility; the rest is its type's own.</li>
        <li><b>Distance</b> keys pick what shows from how far away (above), so a busy scene stays readable as you zoom.</li>
        <li>Some types come in shapes or patterns (a grid is a plane, disc, dome, sphere, cylinder or well). A form shows only the keys for the object's own shape.</li>
        <li>An object's form starts with its shape and size, then <b>Appearance</b> (colours, opacity, lines), <b>Position and motion</b>, <b>Visibility and distance</b> and <b>Actions and tags</b>.</li>
        <li>Points stand on objects by the object's <b>id</b>: give a planet or a grid an id to place points on it.</li>
        <li>A <b>system</b> holds its own points and objects in its own units. Open it from its row; the Points and Objects tabs then edit its lists.</li>
      </ul>
      ${links([['Which type for what', D.objectTypes], ['Distance', D.distance], ['Star systems', D.systems]])}
    `
  });
}

/** The Points tab */
export function pointsGuide() {
  return renderInfoGuide({
    id: 'astro-points',
    header: 'How points work',
    icon: 'mdi:map-marker-multiple',
    body: html`
      <lcards-astro-diagram kind="placement"></lcards-astro-diagram>
      <ul>
        <li>A point is placed once, in one form: coordinates (<code>xyz</code>), a distance and bearing on the plane (<code>polar</code>), latitude and longitude on a sphere, altitude and azimuth on a dome, a sector map cell, another point (<code>at</code>), the sun or moon, a real planet, or an entity's attributes.</li>
        <li><b>On the scene:</b> tap a point to open it, drag it to move it, or use <b>Place a point</b> in the toolbar to add one where you tap.</li>
        <li>A <b>label</b> and a <b>marker</b> make it show; a <b>style</b> picks the label size (title, major, minor, tiny or your own).</li>
        <li>An <b>entity</b> colours the label by state and can move the point.</li>
      </ul>
      ${links([['Placement forms', D.placement], ['Labels and styles', D.labels], ['Points', D.points]])}
    `
  });
}

/** The Camera tab */
export function cameraGuide() {
  return renderInfoGuide({
    id: 'astro-camera',
    header: 'How the camera works',
    icon: 'mdi:video-3d',
    body: html`
      <lcards-astro-diagram kind="camera"></lcards-astro-diagram>
      <ul>
        <li>A <b>view</b> is where the camera looks (a target point or coordinates) and from where (yaw, tilt, distance). Move the preview, then <b>Capture view</b>.</li>
        <li>The <b>start view</b> (the star) is where the card opens. Without views it frames the whole scene.</li>
        <li>A tap action with <code>action: fly-to</code> and a <code>view</code> flies there; a tour steps through views by an entity's state.</li>
        <li>Below the views: how people can move the camera (drag, zoom, buttons), its limits, auto-rotate and the fly-to speed.</li>
      </ul>
      ${links([['Camera and views', D.camera]])}
    `
  });
}
