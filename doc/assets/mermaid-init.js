/**
 * LCARdS MkDocs — Mermaid pan/zoom + fullscreen controls
 *
 * Material for MkDocs renders Mermaid natively — this script only adds
 * pan/zoom controls and a fullscreen modal to already-rendered SVGs.
 *
 * Hooks into Material's document$ observable so it runs after every
 * page load including SPA (instant) navigation.
 *
 * Requires: @panzoom/panzoom loaded before this script (via extra_javascript CDN entry).
 */
(function () {
  'use strict';

  /**
   * Attach pan/zoom controls to a single rendered Mermaid SVG.
   * The SVG is wrapped in .mpz-wrapper; 4 control buttons are added.
   * A fullscreen dialog is created for the enlarge button.
   *
   * @param {SVGElement} svg
   */
  function attachControls(svg) {
    // Guard: already processed
    if (svg.closest('.mpz-wrapper')) return;

    // The .mermaid container that Material rendered into
    var container = svg.parentElement;

    // ── Wrapper ──────────────────────────────────────────────────────────────
    var wrapper = document.createElement('div');
    wrapper.className = 'mpz-wrapper';

    container.insertBefore(wrapper, svg);
    wrapper.appendChild(svg);

    // ── Pan/zoom via @panzoom/panzoom ────────────────────────────────────────
    // Panzoom works on the SVG element directly; we contain it in the wrapper.
    var pz = null;
    if (window.Panzoom) {
      // Remove any fixed dimensions so panzoom can control the viewport
      svg.style.maxWidth  = 'none';
      svg.style.maxHeight = 'none';
      pz = window.Panzoom(svg, {
        maxScale:    8,
        minScale:    0.2,
        contain:     'outside',
        canvas:      true,
      });
      // Enable mouse-wheel zoom on the wrapper
      wrapper.addEventListener('wheel', function (e) {
        e.preventDefault();
        pz.zoomWithWheel(e);
      }, { passive: false });
    }

    // ── Controls overlay ─────────────────────────────────────────────────────
    var controls = document.createElement('div');
    controls.className = 'mpz-controls';

    function makeBtn(label, title, action) {
      var b = document.createElement('button');
      b.className  = 'mpz-btn';
      b.title      = title;
      b.setAttribute('aria-label', title);
      b.textContent = label;
      b.addEventListener('click', action);
      return b;
    }

    if (pz) {
      controls.appendChild(makeBtn('+',    'Zoom in',   function () { pz.zoomIn();  }));
      controls.appendChild(makeBtn('\u2212', 'Zoom out',  function () { pz.zoomOut(); }));
      controls.appendChild(makeBtn('\u2299', 'Reset',     function () { pz.reset();   }));
    }

    // ── Fullscreen / enlarge dialog ──────────────────────────────────────────
    var dialog = document.createElement('dialog');
    dialog.className = 'mpz-dialog';

    var dialogClose = document.createElement('button');
    dialogClose.className   = 'mpz-dialog-close';
    dialogClose.title       = 'Close';
    dialogClose.setAttribute('aria-label', 'Close fullscreen view');
    dialogClose.textContent = '\u2715';
    dialogClose.addEventListener('click', function () { dialog.close(); });

    var dialogContent = document.createElement('div');
    dialogContent.className = 'mpz-dialog-content';

    dialog.appendChild(dialogClose);
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);

    // Close on backdrop click
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    // Close on Escape (browsers do this natively for <dialog>, but be explicit)
    dialog.addEventListener('cancel', function () { dialog.close(); });

    controls.appendChild(makeBtn('\u2922', 'Fullscreen / enlarge', function () {
      // Clone the SVG so the original stays in the page
      dialogContent.innerHTML = '';
      var clone = svg.cloneNode(true);
      clone.style.cssText = 'width:100%;height:100%;max-width:none;max-height:none;';
      dialogContent.appendChild(clone);
      dialog.showModal();
    }));

    wrapper.appendChild(controls);
  }

  /**
   * Find all rendered Mermaid SVGs on the current page and attach controls.
   * Material renders Mermaid into: .mermaid > svg  (after fence_code_format rendering)
   * We poll briefly after document$ fires to let Mermaid finish its async render.
   */
  function processDiagrams() {
    // Mermaid renders asynchronously after Material triggers it.
    // Poll briefly (up to 3 s) for SVGs to appear.
    var attempts = 0;
    var maxAttempts = 30;  // 30 × 100 ms = 3 s

    function tryAttach() {
      var svgs = document.querySelectorAll('.mermaid svg');
      svgs.forEach(function (svg) {
        if (!svg.closest('.mpz-wrapper')) {
          attachControls(svg);
        }
      });
      attempts++;
      // Keep polling while there are unprocessed .mermaid elements without SVGs yet
      var pending = document.querySelectorAll('.mermaid:not(:empty)');
      var unprocessed = Array.from(pending).filter(function (el) {
        return !el.querySelector('svg') && !el.closest('.mpz-wrapper');
      });
      if (unprocessed.length > 0 && attempts < maxAttempts) {
        setTimeout(tryAttach, 100);
      }
    }

    // Small initial delay to let Mermaid's async render settle
    setTimeout(tryAttach, 150);
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  function setup() {
    if (window.document$ && typeof window.document$.subscribe === 'function') {
      // Material SPA: fires on every page including instant navigation
      window.document$.subscribe(function () {
        processDiagrams();
      });
    } else {
      // Fallback for non-Material or local static builds
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processDiagrams);
      } else {
        processDiagrams();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

})();
