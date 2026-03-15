/**
 * Mermaid initialization for LCARdS docs.
 *
 * Requirements:
 *  - Works with Material's navigation.instant (SPA navigation)
 *  - Applies LCARdS dark palette as mermaid base theme
 *  - Re-initializes on theme toggle
 *
 * Approach: hook into Material's document$ observable which fires on every
 * page load including SPA navigations. Falls back to DOMContentLoaded if
 * Material JS isn't available (e.g. local static builds).
 */
(function () {
  var DARK_VARS = {
    primaryColor:        '#37a6d1',
    primaryTextColor:    '#dfe1e8',
    primaryBorderColor:  '#52596e',
    lineColor:           '#9ea5ba',
    secondaryColor:      '#2f3749',
    tertiaryColor:       '#1c3c55',
    background:          '#1e2229',
    nodeBorder:          '#37a6d1',
    clusterBkg:          '#2f3749',
    clusterBorder:       '#52596e',
    titleColor:          '#ff6753',
    edgeLabelBackground: '#2f3749',
    fontFamily:          '"Antonio", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize:            '14px'
  };

  function isDarkScheme() {
    return document.body &&
      document.body.getAttribute('data-md-color-scheme') === 'lcards-dark';
  }

  function initMermaid() {
    if (typeof mermaid === 'undefined') {
      // CDN not ready yet — retry shortly
      setTimeout(initMermaid, 100);
      return;
    }
    mermaid.initialize({
      startOnLoad: false,
      theme: isDarkScheme() ? 'base' : 'default',
      themeVariables: isDarkScheme() ? DARK_VARS : {}
    });
    // Only target unrendered divs. Mermaid sets data-processed="true" after
    // rendering — re-running on already-rendered SVG causes parse errors.
    mermaid.run({ querySelector: '.mermaid:not([data-processed])' });
  }

  function setup() {
    // Material for MkDocs exposes document$ — an Observable that fires on
    // every page including instant navigation page changes.
    if (window.document$ && typeof window.document$.subscribe === 'function') {
      window.document$.subscribe(function () {
        initMermaid();
      });
    } else {
      // Fallback: plain DOMContentLoaded (no instant nav)
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMermaid);
      } else {
        initMermaid();
      }
    }

    // Re-initialize when user toggles dark/light theme.
    // Must strip data-processed so mermaid re-renders with new theme vars.
    if (document.body) {
      new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.attributeName === 'data-md-color-scheme') {
            document.querySelectorAll('.mermaid[data-processed]').forEach(function (el) {
              el.removeAttribute('data-processed');
              // Restore original source — mermaid stores it in data-original-text
              if (el.getAttribute('data-original-text')) {
                el.innerHTML = el.getAttribute('data-original-text');
              }
            });
            initMermaid();
          }
        });
      }).observe(document.body, { attributes: true });
    }
  }

  // Delay setup until DOM is ready so document.body and document$ exist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
