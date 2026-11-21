/**
 * @fileoverview Shared documentation-site link constants.
 *
 * Single source of truth for the hosted VitePress docs site base URL and
 * per-page paths, used by every editor that links out to a doc page
 * (animation/filter/background-animation info guides). Built with
 * utils/docs-url.js, so they follow this build's docs channel.
 *
 * @module editor/components/shared/docs-links
 */

import { docsBase, docsUrl, DOCS } from '../../../utils/docs-url.js';

export const DOCS_BASE_URL = docsBase();

export const ANIMATION_PRESET_DOCS_URL = docsUrl(DOCS.animationPresets);
export const FILTER_TYPE_DOCS_URL = docsUrl(DOCS.filterTypes);
export const BACKGROUND_PRESET_DOCS_URL = docsUrl(DOCS.backgroundPresets);
export const ROUTING_CONCEPTS_DOCS_URL = docsUrl(DOCS.msdRoutingConcepts);
