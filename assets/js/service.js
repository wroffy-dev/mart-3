/* ==========================================================================
   MART Global — service page interactions
   Six principles, research framework, ecosystem diagram, model counter.
   ========================================================================== */
(function () {
  'use strict';

  var MART = window.MART || {};
  var toArray = MART.toArray || function (l) { return Array.prototype.slice.call(l); };

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function onMediaChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  /* ---------------------------------------------------------------------
     Six principles — desktop: rows + changing stage; mobile: accordion
     --------------------------------------------------------------------- */
  function initServicePrinciples() {
    var root = document.querySelector('[data-principles]');
    if (!root) return;

    var items = toArray(root.querySelectorAll('.pr-item'));
    var triggers = items.map(function (item) { return item.querySelector('.pr-item__trigger'); });
    var indicator = root.querySelector('.pr__indicator');
    var counter = root.querySelector('[data-pr-current]');
    var mqDesktop = window.matchMedia('(min-width: 1024px)');
    var hoverTimer = null;
    var active = 0;

    items.forEach(function (item, i) { if (item.classList.contains('is-active')) active = i; });

    function panelOf(i) { return document.getElementById(triggers[i].getAttribute('aria-controls')); }

    function placeIndicator() {
      if (!indicator || !mqDesktop.matches) return;
      var t = triggers[active];
      if (!t) return;
      root.style.setProperty('--ind-y', t.offsetTop + 'px');
      root.style.setProperty('--ind-h', t.offsetHeight + 'px');
    }

    function apply(openIndex) {
      items.forEach(function (item, j) {
        var on = j === openIndex;
        item.classList.toggle('is-active', on);
        triggers[j].setAttribute('aria-expanded', on ? 'true' : 'false');
        var panel = panelOf(j);
        if (on) panel.removeAttribute('inert');
        else panel.setAttribute('inert', '');
      });
    }

    function setActive(i) {
      active = i;
      apply(i);
      if (counter) counter.textContent = pad(i + 1);
      placeIndicator();
    }

    function toggleMobile(i) {
      var willOpen = !items[i].classList.contains('is-active');
      apply(willOpen ? i : -1);
      if (willOpen) active = i;
    }

    triggers.forEach(function (trigger, i) {
      trigger.addEventListener('click', function () {
        if (mqDesktop.matches) setActive(i);
        else toggleMobile(i);
      });
      trigger.addEventListener('mouseenter', function () {
        if (!mqDesktop.matches || !(MART.hasFinePointer && MART.hasFinePointer())) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { setActive(i); }, 90);
      });
      trigger.addEventListener('mouseleave', function () { clearTimeout(hoverTimer); });
      trigger.addEventListener('focus', function () {
        if (mqDesktop.matches && active !== i) setActive(i);
      });
      trigger.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown') next = (i + 1) % triggers.length;
        else if (e.key === 'ArrowUp') next = (i - 1 + triggers.length) % triggers.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = triggers.length - 1;
        if (next !== null) {
          e.preventDefault();
          triggers[next].focus();
        }
      });
    });

    function sync() {
      if (mqDesktop.matches) setActive(active);
      else apply(active);
    }

    onMediaChange(mqDesktop, sync);
    if (MART.onResize) MART.onResize(placeIndicator);
    window.addEventListener('load', placeIndicator);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeIndicator);
    sync();
  }

  /* ---------------------------------------------------------------------
     Research framework — hovering a quadrant activates its connector
     --------------------------------------------------------------------- */
  function initFramework() {
    toArray(document.querySelectorAll('[data-framework]')).forEach(function (fw) {
      toArray(fw.querySelectorAll('[data-quadrant]')).forEach(function (panel) {
        var q = panel.getAttribute('data-quadrant');
        panel.addEventListener('mouseenter', function () { fw.setAttribute('data-active', q); });
        panel.addEventListener('mouseleave', function () { fw.removeAttribute('data-active'); });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Ecosystem — legend highlights the matching ring
     --------------------------------------------------------------------- */
  function initEcosystem() {
    var diagram = document.querySelector('[data-eco]');
    var legend = document.querySelector('[data-eco-legend]');
    if (!diagram || !legend) return;
    var parts = toArray(diagram.querySelectorAll('[data-ring]'));
    var rows = toArray(legend.querySelectorAll('[data-ring]'));

    function highlight(n) {
      if (n) diagram.setAttribute('data-active', n);
      else diagram.removeAttribute('data-active');
      parts.forEach(function (el) { el.classList.toggle('is-active', !!n && el.getAttribute('data-ring') === n); });
      rows.forEach(function (row) { row.classList.toggle('is-active', !!n && row.getAttribute('data-ring') === n); });
    }

    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function () { highlight(row.getAttribute('data-ring')); });
      row.addEventListener('mouseleave', function () { highlight(null); });
    });
  }

  /* ---------------------------------------------------------------------
     Implementation model — sticky counter follows the active step
     --------------------------------------------------------------------- */
  function initModelCounter() {
    var track = document.querySelector('[data-model]');
    if (!track) return;
    var current = document.querySelector('[data-model-current]');
    var label = document.querySelector('[data-model-label]');
    var steps = toArray(track.querySelectorAll('[data-step]'));

    function render(i) {
      i = Math.max(0, Math.min(steps.length - 1, i));
      if (current) current.textContent = pad(i + 1);
      if (label) label.textContent = steps[i].querySelector('.model-step__title').textContent;
    }

    track.addEventListener('track:change', function (e) { render(e.detail.index); });
    var initial = 0;
    steps.forEach(function (s, i) { if (s.classList.contains('is-active')) initial = i; });
    render(initial);
  }

  initServicePrinciples();
  initFramework();
  initEcosystem();
  initModelCounter();
})();
