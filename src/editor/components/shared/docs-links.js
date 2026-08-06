/**
 * @fileoverview Shared documentation-site link constants.
 *
 * Single source of truth for the hosted VitePress docs site base URL and
 * per-page paths, used by every editor that links out to a doc page
 * (animation/filter/background-animation info guides). Sourced from
 * lcards-vars.js's project_url rather than re-declared per editor, so
 * there's exactly one canonical URL string in the whole bundle.
 *
 * @module editor/components/shared/docs-links
 */

import { project_url } from '../../../lcards-vars.js';

export const DOCS_BASE_URL = project_url;

export const ANIMATION_PRESET_DOCS_URL = `${DOCS_BASE_URL}/core/animations/preset-reference.html`;
export const FILTER_TYPE_DOCS_URL = `${DOCS_BASE_URL}/cards/msd/base-svg-filters.html`;
export const BACKGROUND_PRESET_DOCS_URL = `${DOCS_BASE_URL}/core/effects/background-animations/preset-reference.html`;
export const ROUTING_CONCEPTS_DOCS_URL = `${DOCS_BASE_URL}/cards/msd/routing-concepts.html`;
