/* ==========================================================================
   MART Global — homepage interactions
   Experience switcher (Corporate / Social), hover previews, focus chips,
   expanding social capability panels.
   ========================================================================== */
(function () {
  'use strict';

  var MART = window.MART || {};
  var toArray = MART.toArray || function (l) { return Array.prototype.slice.call(l); };
  var STORAGE_KEY = 'martExperience';
  var SWITCH_MS = 420;

  /* ---------------------------------------------------------------------
     Experience switcher
     --------------------------------------------------------------------- */
  function initExperienceSwitcher() {
    var section = document.querySelector('[data-selector-section]');
    var root = document.querySelector('[data-experience-root]');
    if (!section || !root) return;

    var grid = section.querySelector('[data-selector]');
    var connector = section.querySelector('[data-connector]');
    var foot = connector ? connector.parentElement : null;
    var status = root.querySelector('[data-experience-status]');
    var choices = toArray(grid.querySelectorAll('[data-choice]'));
    var panels = {};
    toArray(root.querySelectorAll('[data-panel]')).forEach(function (p) {
      panels[p.getAttribute('data-panel')] = p;
    });

    var LABELS = { corporate: 'Corporate Solutions', social: 'Social Solutions' };
    var activeExperience = null;
    var busy = false;

    function store(name) {
      try { window.sessionStorage.setItem(STORAGE_KEY, name); } catch (e) { /* storage unavailable */ }
    }
    function restore() {
      try { return window.sessionStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function positionConnector() {
      if (!activeExperience || !connector || !foot) return;
      var card = grid.querySelector('[data-choice="' + activeExperience + '"]');
      var fr = foot.getBoundingClientRect();
      var x;
      if (window.innerWidth < 768) {
        x = fr.width / 2;
      } else {
        var cr = card.getBoundingClientRect();
        x = cr.left + cr.width / 2 - fr.left;
      }
      connector.style.setProperty('--x', Math.round(x) + 'px');
    }

    function setSelector(name) {
      section.classList.toggle('has-active', !!name);
      section.setAttribute('data-active', name || '');
      choices.forEach(function (choice) {
        var on = choice.getAttribute('data-choice') === name;
        choice.classList.toggle('is-active', on);
        var btn = choice.querySelector('[data-select]');
        if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      positionConnector();
    }

    function scrollToExperience() {
      MART.scrollToEl(foot || root, MART.headerOffset() - 4);
    }

    function show(name, opts) {
      opts = opts || {};
      if (!panels[name] || busy) return;
      if (name === activeExperience) {
        if (opts.scroll) scrollToExperience();
        return;
      }

      busy = true;
      var prev = activeExperience ? panels[activeExperience] : null;
      var next = panels[name];
      var instant = !!opts.instant || MART.reducedMotion();

      activeExperience = name;
      setSelector(name);
      store(name);
      if (status) status.textContent = LABELS[name] + ' are now shown below the selector.';

      function swap() {
        if (prev) {
          prev.hidden = true;
          prev.classList.remove('is-leaving', 'is-entered');
          if (MART.resetReveals) MART.resetReveals(prev);
        }
        next.hidden = false;
        if (!instant) {
          next.classList.add('is-entering');
          void next.offsetWidth; // commit the hidden state before fading in
          next.classList.remove('is-entering');
          next.classList.add('is-entered');
        }
        if (MART.observeReveals) MART.observeReveals(next);
        root.style.minHeight = '';
        section.classList.remove('is-switching');
        positionConnector();
        if (MART.updateTracks) MART.updateTracks();
        if (MART.updateParallax) MART.updateParallax();
        if (opts.focus) {
          var heading = next.querySelector('[data-experience-heading]');
          if (heading) heading.focus({ preventScroll: true });
        }
        busy = false;
      }

      if (prev && !instant) {
        // Lock the height so the page never jumps while content cross-fades
        root.style.minHeight = root.offsetHeight + 'px';
        section.classList.add('is-switching');
        prev.classList.add('is-leaving');
        if (opts.scroll) scrollToExperience();
        setTimeout(swap, SWITCH_MS);
      } else {
        swap();
        if (opts.scroll) setTimeout(scrollToExperience, instant ? 0 : 360);
      }
    }
    MART.showExperience = show;

    choices.forEach(function (choice) {
      var btn = choice.querySelector('[data-select]');
      if (!btn) return;
      btn.addEventListener('click', function () {
        show(choice.getAttribute('data-choice'), { scroll: true, focus: true });
      });
    });

    // Deep links: #corporate, #social, #focus, #projects
    var HASHES = {
      '#corporate': ['corporate', null],
      '#social': ['social', null],
      '#focus': ['corporate', 'corp-focus'],
      '#projects': ['corporate', 'corp-work']
    };

    function handleHash(hash) {
      var entry = HASHES[hash];
      if (!entry) return false;
      if (MART.closeMobileMenu) MART.closeMobileMenu(false);
      var name = entry[0];
      var targetId = entry[1];
      var switching = name !== activeExperience;
      if (!targetId) {
        if (switching) show(name, { scroll: true, focus: true });
        else scrollToExperience();
        return true;
      }
      if (switching) show(name, { scroll: false });
      setTimeout(function () {
        var t = document.getElementById(targetId);
        if (t) MART.scrollToEl(t);
      }, switching && activeExperience !== null ? SWITCH_MS + 40 : 40);
      return true;
    }
    MART.hashHandlers.push(handleHash);

    window.addEventListener('hashchange', function () { handleHash(window.location.hash); });
    MART.onResize(positionConnector);

    // Restore: deep link first, then the session's previous choice
    var initialHash = window.location.hash;
    if (HASHES[initialHash]) {
      var entry = HASHES[initialHash];
      show(entry[0], { instant: true });
      window.requestAnimationFrame(function () {
        setTimeout(function () {
          var target = entry[1] ? document.getElementById(entry[1]) : (foot || root);
          MART.scrollToEl(target, entry[1] ? undefined : MART.headerOffset() - 4);
        }, 60);
      });
    } else {
      var saved = restore();
      if (saved && panels[saved]) show(saved, { instant: true });
    }
  }

  /* ---------------------------------------------------------------------
     Service rows: cursor-following contextual image preview (desktop only)
     --------------------------------------------------------------------- */
  function initHoverPreview() {
    var lists = toArray(document.querySelectorAll('[data-hover-preview]'));
    if (!lists.length) return;

    var preview = document.createElement('div');
    preview.className = 'hover-preview';
    preview.setAttribute('aria-hidden', 'true');
    var inner = document.createElement('div');
    inner.className = 'hover-preview__inner';
    preview.appendChild(inner);
    document.body.appendChild(preview);

    var images = {};
    var loaded = false;
    var x = 0, y = 0, tx = 0, ty = 0;
    var raf = null;
    var visible = false;
    var currentSrc = null;
    var W = 280, H = 196, GAP = 28;

    function enabled() {
      return MART.hasFinePointer() && window.innerWidth >= 1024;
    }

    function ensureImages() {
      if (loaded) return;
      loaded = true;
      lists.forEach(function (list) {
        toArray(list.querySelectorAll('[data-preview]')).forEach(function (link) {
          var src = link.getAttribute('data-preview');
          if (images[src]) return;
          var img = new Image();
          img.decoding = 'async';
          img.alt = '';
          img.src = src;
          inner.appendChild(img);
          images[src] = img;
        });
      });
    }

    // Float the preview above the cursor (like a tooltip) so the hovered
    // row stays readable; flip below when there is no room under the header.
    function place() {
      var px = Math.min(tx + GAP, window.innerWidth - W - 16);
      var py = ty - H - GAP;
      if (py < MART.headerOffset() + 12) py = ty + GAP;
      return [px, py];
    }

    function loop() {
      var target = place();
      x += (target[0] - x) * 0.2;
      y += (target[1] - y) * 0.2;
      preview.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      if (visible && (Math.abs(target[0] - x) > 0.4 || Math.abs(target[1] - y) > 0.4)) {
        raf = window.requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    function setCurrent(src) {
      currentSrc = src;
      Object.keys(images).forEach(function (key) {
        images[key].classList.toggle('is-current', key === src);
      });
    }

    function showPreview(e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        var start = place();
        x = start[0];
        y = start[1];
        preview.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      }
      visible = true;
      preview.classList.add('is-visible');
      if (!raf) raf = window.requestAnimationFrame(loop);
    }

    function hidePreview() {
      visible = false;
      preview.classList.remove('is-visible');
    }

    // Driven by pointermove (not pointerenter) so the preview reappears
    // after a scroll, when the cursor is already inside a row.
    lists.forEach(function (list) {
      list.addEventListener('pointerenter', function () { if (enabled()) ensureImages(); });
      list.addEventListener('pointerleave', hidePreview);
      list.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !enabled()) return;
        var link = e.target.closest('[data-preview]');
        if (!link) {
          if (visible) hidePreview();
          return;
        }
        ensureImages();
        var src = link.getAttribute('data-preview');
        if (src !== currentSrc) setCurrent(src);
        if (!visible) {
          showPreview(e);
          return;
        }
        tx = e.clientX;
        ty = e.clientY;
        if (!raf) raf = window.requestAnimationFrame(loop);
      });
    });
    window.addEventListener('scroll', function () { if (visible) hidePreview(); }, { passive: true });
  }

  /* ---------------------------------------------------------------------
     Focus area chips: typography-led selector with a detail line
     --------------------------------------------------------------------- */
  function initFocusChips() {
    toArray(document.querySelectorAll('[data-focus]')).forEach(function (wrap) {
      var chips = toArray(wrap.querySelectorAll('.chip'));
      var detail = wrap.querySelector('.focus__detail');
      var num = wrap.querySelector('[data-focus-num]');
      var title = wrap.querySelector('[data-focus-title]');
      var text = wrap.querySelector('[data-focus-text]');
      var current = 0;
      var timer = null;

      function select(i) {
        if (i === current) return;
        current = i;
        chips.forEach(function (chip, j) { chip.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
        detail.classList.add('is-changing');
        clearTimeout(timer);
        timer = setTimeout(function () {
          num.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
          title.textContent = chips[i].textContent.trim();
          text.textContent = chips[i].getAttribute('data-detail');
          detail.classList.remove('is-changing');
        }, MART.reducedMotion() ? 0 : 200);
      }

      chips.forEach(function (chip, i) {
        chip.addEventListener('click', function () { select(i); });
        chip.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') select(i); });
        chip.addEventListener('focus', function () { select(i); });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Social capability panels: expand on hover / focus / first tap
     --------------------------------------------------------------------- */
  function initServicePanels() {
    toArray(document.querySelectorAll('[data-xpanels]')).forEach(function (wrap) {
      var panels = toArray(wrap.querySelectorAll('.xpanel'));
      function wide() { return window.innerWidth >= 1024; }
      function activate(panel) {
        panels.forEach(function (p) { p.classList.toggle('is-active', p === panel); });
      }
      panels.forEach(function (panel) {
        var link = panel.querySelector('.xpanel__link');
        panel.addEventListener('pointerenter', function (e) {
          if (e.pointerType === 'mouse' && wide()) activate(panel);
        });
        panel.addEventListener('focusin', function () { if (wide()) activate(panel); });
        link.addEventListener('click', function (e) {
          if (wide() && !panel.classList.contains('is-active')) {
            e.preventDefault();
            e.stopPropagation();
            activate(panel);
          }
        });
      });
    });
  }

  initExperienceSwitcher();
  initHoverPreview();
  initFocusChips();
  initServicePanels();
})();
