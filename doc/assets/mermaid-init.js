/**
 * LCARdS MkDocs — Mermaid initialisation with svg-pan-zoom
 *
 * Loads Mermaid + svg-pan-zoom from CDN, renders all .mermaid divs,
 * then wraps each rendered SVG in a pan/zoom container with
 * GitHub-style inline controls (zoom in / zoom out / reset / fit).
 *
 * Hooks:
 *  - Material document$ observable (instant navigation / SPA)
 *  - Fallback: DOMContentLoaded for non-instant builds
 *  - MutationObserver on body[data-md-color-scheme] for theme toggle re-render
 */
(function () {
  'use strict';

  var MERMAID_CDN    = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
  var SVGPANZOOM_CDN = 'https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js';

  /* ------------------------------------------------------------------
     LCARdS palette — dark scheme mermaid theme variables
     ------------------------------------------------------------------ */
  var DARK_THEME_VARS = {
    darkMode:             true,
    background:           '#0d1117',
    mainBkg:              '#1c3c55',
    nodeBorder:           '#37a6d1',
    clusterBkg:           '#2f3749',
    clusterBorder:        '#52596e',
    titleColor:           '#dfe1e8',
    edgeLabelBackground:  '#2f3749',
    lineColor:            '#37a6d1',
    primaryColor:         '#1c3c55',
    primaryTextColor:     '#dfe1e8',
    primaryBorderColor:   '#37a6d1',
    secondaryColor:       '#2f3749',
    tertiaryColor:        '#002241',
    tertiaryTextColor:    '#dfe1e8',
    // Sequence diagrams
    actorBkg:             '#1c3c55',
    actorBorder:          '#37a6d1',
    actorTextColor:       '#dfe1e8',
    actorLineColor:       '#6d748c',
    signalColor:          '#ff6753',
    signalTextColor:      '#dfe1e8',
    // Git graph
    git0:                 '#ff6753',
    git1:                 '#37a6d1',
    git2:                 '#00eeee',
    git3:                 '#f9ef97',
    gitBranchLabel0:      '#dfe1e8',
    gitBranchLabel1:      '#dfe1e8',
    // Fonts
    fontFamily:           '"Antonio", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize:             '14px'
  };

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */

  /** Returns true when the lcards-dark scheme is active */
  function isDark() {
    return document.body &&
      document.body.getAttribute('data-md-color-scheme') === 'lcards-dark';
  }

  /** Dynamically load a script once; returns a Promise */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Failed to load: ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* ------------------------------------------------------------------
     Pan/zoom wrapper
     ------------------------------------------------------------------ */

  /**
   * Wrap a rendered SVG element with GitHub-style pan/zoom controls.
   * The original .mermaid div is replaced by a .mermaid-panzoom-wrapper
   * that contains the SVG plus the control overlay.
   *
   * @param {SVGElement} svgEl   - The rendered SVG element
   * @param {string}     source  - Original mermaid source (for re-render on theme switch)
   */
  function applyPanZoom(svgEl, source) {
    var wrapper = document.createElement('div');
    wrapper.className = 'mermaid-panzoom-wrapper';
    // Store original source so theme toggle can re-render
    wrapper.dataset.mermaidSource = source || '';

    var controls = document.createElement('div');
    controls.className = 'mermaid-panzoom-controls';
    controls.setAttribute('aria-label', 'Diagram controls');
    controls.innerHTML =
      '<button class="mpz-btn" data-action="zoom-in"  title="Zoom in"  aria-label="Zoom in">+</button>'  +
      '<button class="mpz-btn" data-action="zoom-out" title="Zoom out" aria-label="Zoom out">\u2212</button>' +
      '<button class="mpz-btn" data-action="reset"    title="Reset"    aria-label="Reset">\u2299</button>'    +
      '<button class="mpz-btn" data-action="fit"      title="Fit"      aria-label="Fit to view">\u2922</button>';

    // Insert wrapper before the SVG's current parent position
    svgEl.parentNode.insertBefore(wrapper, svgEl);
    wrapper.appendChild(svgEl);
    wrapper.appendChild(controls);

    // Give the SVG dimensions that svg-pan-zoom needs
    svgEl.style.display = 'block';
    svgEl.style.width   = '100%';
    if (!svgEl.style.height) {
      svgEl.style.height = 'auto';
    }

    var pz;
    try {
      pz = window.svgPanZoom(svgEl, {
        zoomEnabled:              true,
        controlIconsEnabled:      false,
        fit:                      true,
        center:                   true,
        minZoom:                  0.2,
        maxZoom:                  15,
        zoomScaleSensitivity:     0.3,
        mouseWheelZoomEnabled:    true,
        dblClickZoomEnabled:      true,
        preventMouseEventsDefault: true
      });
    } catch (e) {
      // svg-pan-zoom failed (e.g. zero-size SVG) — leave diagram as-is
      console.warn('[LCARdS Docs] svg-pan-zoom init failed:', e);
      return;
    }

    controls.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn || !pz) return;
      switch (btn.dataset.action) {
        case 'zoom-in':  pz.zoomIn();            break;
        case 'zoom-out': pz.zoomOut();           break;
        case 'reset':    pz.reset();             break;
        case 'fit':      pz.fit(); pz.center();  break;
      }
    });
  }

  /* ------------------------------------------------------------------
     Main render pass
     ------------------------------------------------------------------ */

  var _renderInProgress = false;
  var _diagramCounter = 0;

  /**
   * Find all unrendered .mermaid divs, render them with Mermaid,
   * then apply svg-pan-zoom controls to each resulting SVG.
   */
  function renderDiagrams() {
    if (_renderInProgress) return;

    var nodes = Array.from(document.querySelectorAll('.mermaid:not([data-pz-done])'));
    if (!nodes.length) return;

    _renderInProgress = true;

    loadScript(MERMAID_CDN)
      .then(function () { return loadScript(SVGPANZOOM_CDN); })
      .then(function () {
        window.mermaid.initialize({
          startOnLoad:   false,
          securityLevel: 'loose',
          theme:         isDark() ? 'base' : 'default',
          themeVariables: isDark() ? DARK_THEME_VARS : {}
        });

        var promises = nodes.map(function (node, i) {
          // HTML-decode innerHTML to preserve newlines (textContent collapses whitespace in <div>)
          var ta = document.createElement('textarea');
          ta.innerHTML = node.innerHTML;
          var source = ta.value.trim();
          // Save decoded source before mermaid clobbers innerHTML
          node.dataset.mermaidOriginal = source;
          var id = 'lcards-mermaid-' + (++_diagramCounter);
          return window.mermaid.render(id, source)
            .then(function (result) {
              node.innerHTML = result.svg;
              node.dataset.pzDone = 'true';
              node.setAttribute('data-pz-done', 'true');
              var svgEl = node.querySelector('svg');
              if (svgEl) {
                applyPanZoom(svgEl, source);
              }
            })
            .catch(function (err) {
              console.warn('[LCARdS Docs] Mermaid render error for diagram ' + i + ':', err);
              node.setAttribute('data-pz-done', 'error');
            });
        });

        return Promise.all(promises);
      })
      .catch(function (err) {
        console.error('[LCARdS Docs] Failed to load Mermaid or svg-pan-zoom:', err);
      })
      .finally(function () {
        _renderInProgress = false;
      });
  }

  /* ------------------------------------------------------------------
     Theme toggle — re-render all diagrams with new theme
     ------------------------------------------------------------------ */

  function reRenderAll() {
    // Tear down pan/zoom wrappers and restore bare .mermaid divs
    document.querySelectorAll('.mermaid-panzoom-wrapper').forEach(function (wrapper) {
      var source = wrapper.dataset.mermaidSource || '';
      var replacement = document.createElement('div');
      replacement.className = 'mermaid';
      replacement.textContent = source;
      wrapper.parentNode.insertBefore(replacement, wrapper);
      wrapper.parentNode.removeChild(wrapper);
    });
    // Also reset any .mermaid nodes that were rendered but not wrapped
    document.querySelectorAll('.mermaid[data-pz-done]').forEach(function (el) {
      var source = el.dataset.mermaidOriginal;
      if (!source) {
        var ta = document.createElement('textarea');
        ta.innerHTML = el.innerHTML;
        source = ta.value.trim();
      }
      el.removeAttribute('data-pz-done');
      el.textContent = source;
    });
    renderDiagrams();
  }

  /* ------------------------------------------------------------------
     Bootstrap
     ------------------------------------------------------------------ */

  function setup() {
    // Material instant-navigation hook
    if (window.document$ && typeof window.document$.subscribe === 'function') {
      window.document$.subscribe(function () {
        renderDiagrams();
      });
    } else {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderDiagrams);
      } else {
        renderDiagrams();
      }
    }

    // Re-render on dark/light toggle
    if (document.body) {
      new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.attributeName === 'data-md-color-scheme') {
            reRenderAll();
          }
        });
      }).observe(document.body, { attributes: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

})();
