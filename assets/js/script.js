/* ==========================================================================
   MART Global — core interactions (all pages)
   Classic script (no modules) so the prototype also runs from file://
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var MART = (window.MART = window.MART || {});

  var mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqDesktopNav = window.matchMedia('(min-width: 1280px)');
  var mqFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  MART.reducedMotion = function () { return mqReduced.matches; };
  MART.isDesktopNav = function () { return mqDesktopNav.matches; };
  MART.hasFinePointer = function () { return mqFinePointer.matches; };
  MART.hashHandlers = [];

  function toArray(list) { return Array.prototype.slice.call(list); }
  MART.toArray = toArray;

  /* ---------------------------------------------------------------------
     Shared rAF-throttled scroll + debounced resize hub
     --------------------------------------------------------------------- */
  var scrollFns = [];
  var resizeFns = [];
  var ticking = false;

  MART.onScroll = function (fn) { scrollFns.push(fn); };
  MART.onResize = function (fn) { resizeFns.push(fn); };

  function runScroll() {
    ticking = false;
    for (var i = 0; i < scrollFns.length; i++) scrollFns[i]();
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(runScroll);
    }
  }, { passive: true });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      for (var i = 0; i < resizeFns.length; i++) resizeFns[i]();
      runScroll();
    }, 120);
  });

  MART.headerOffset = function () {
    var v = parseFloat(window.getComputedStyle(doc).getPropertyValue('--header-h-compact'));
    return isNaN(v) ? 72 : v;
  };

  MART.scrollToEl = function (el, offset) {
    if (!el) return;
    var off = offset != null ? offset : MART.headerOffset() + 12;
    var y = el.getBoundingClientRect().top + window.pageYOffset - off;
    window.scrollTo({ top: Math.max(0, y), behavior: MART.reducedMotion() ? 'auto' : 'smooth' });
  };

  MART.lockScroll = function (lock) {
    var sbw = window.innerWidth - doc.clientWidth;
    if (lock) {
      doc.classList.add('is-locked');
      if (sbw > 0) doc.style.paddingRight = sbw + 'px';
    } else {
      doc.classList.remove('is-locked');
      doc.style.paddingRight = '';
    }
  };

  /* ---------------------------------------------------------------------
     Header: transparent over heroes, solid + compact after scroll
     --------------------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector('[data-header]');
    if (!header) return;
    var last = null;

    function syncSolid() {
      var solid = header.classList.contains('is-scrolled') || header.classList.contains('is-mega-open');
      header.classList.toggle('is-solid', solid);
    }
    MART.syncHeader = syncSolid;

    function update() {
      var scrolled = window.pageYOffset > 24;
      if (scrolled === last) return;
      last = scrolled;
      header.classList.toggle('is-scrolled', scrolled);
      header.classList.toggle('is-compact', scrolled);
      syncSolid();
    }
    MART.onScroll(update);
    update();
  }

  /* ---------------------------------------------------------------------
     Mega menus: hover intent on desktop, click/keyboard everywhere
     --------------------------------------------------------------------- */
  function initMegaMenu() {
    var header = document.querySelector('[data-header]');
    var triggers = toArray(document.querySelectorAll('[data-mega-trigger]'));
    var scrim = document.querySelector('[data-mega-scrim]');
    if (!header || !triggers.length) return;

    var current = null;
    var openTimer = null;
    var closeTimer = null;

    function panelOf(t) { return document.getElementById(t.getAttribute('aria-controls')); }

    function setOpen(t, open) {
      var panel = panelOf(t);
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.classList.toggle('is-open', open);
      if (open) panel.removeAttribute('inert');
      else panel.setAttribute('inert', '');
    }

    function open(t) {
      clearTimeout(closeTimer);
      if (current === t) return;
      if (current) setOpen(current, false);
      setOpen(t, true);
      current = t;
      header.classList.add('is-mega-open');
      if (scrim) scrim.classList.add('is-visible');
      if (MART.syncHeader) MART.syncHeader();
    }

    function close(returnFocus) {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      if (!current) return;
      var t = current;
      setOpen(t, false);
      current = null;
      header.classList.remove('is-mega-open');
      if (scrim) scrim.classList.remove('is-visible');
      if (MART.syncHeader) MART.syncHeader();
      if (returnFocus) t.focus();
    }
    MART.closeMega = close;

    triggers.forEach(function (t) {
      var item = t.parentElement;
      t.addEventListener('click', function (e) {
        e.preventDefault();
        if (current === t) close(false);
        else open(t);
      });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          open(t);
          var first = panelOf(t).querySelector('a[href]');
          if (first) setTimeout(function () { first.focus(); }, 30);
        }
      });
      item.addEventListener('mouseenter', function () {
        if (!MART.hasFinePointer() || !MART.isDesktopNav()) return;
        clearTimeout(closeTimer);
        clearTimeout(openTimer);
        openTimer = setTimeout(function () { open(t); }, current ? 0 : 110);
      });
      item.addEventListener('mouseleave', function () { clearTimeout(openTimer); });
    });

    // Hovering a plain nav item closes an open menu
    toArray(header.querySelectorAll('.nav-list > li')).forEach(function (li) {
      if (li.querySelector('[data-mega-trigger]')) return;
      li.addEventListener('mouseenter', function () {
        if (!MART.hasFinePointer() || !current) return;
        clearTimeout(openTimer);
        closeTimer = setTimeout(function () { close(false); }, 140);
      });
    });

    header.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
    header.addEventListener('mouseleave', function () {
      if (!MART.hasFinePointer()) return;
      clearTimeout(openTimer);
      if (current) closeTimer = setTimeout(function () { close(false); }, 260);
    });

    header.addEventListener('focusout', function (e) {
      if (current && e.relatedTarget && !header.contains(e.relatedTarget)) close(false);
    });
    if (scrim) scrim.addEventListener('click', function () { close(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && current) close(true);
    });
    document.addEventListener('click', function (e) {
      if (current && !header.contains(e.target)) close(false);
    });
    MART.onResize(function () { if (!MART.isDesktopNav()) close(false); });
  }

  /* ---------------------------------------------------------------------
     Full-screen mobile menu with focus trap + scroll lock
     --------------------------------------------------------------------- */
  function initMobileNav() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    var header = document.querySelector('[data-header]');
    var label = document.querySelector('[data-menu-label]');
    if (!toggle || !menu) return;
    var isOpen = false;

    function focusables() {
      return toArray(menu.querySelectorAll('a[href], button:not([disabled])')).filter(function (el) {
        return !el.closest('[inert]') && el.getClientRects().length > 0;
      });
    }

    function open() {
      isOpen = true;
      menu.removeAttribute('inert');
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      if (label) label.textContent = 'Close';
      if (header) header.classList.add('is-mobile-open');
      MART.lockScroll(true);
      setTimeout(function () {
        var f = focusables()[0];
        if (f) f.focus({ preventScroll: true });
      }, MART.reducedMotion() ? 0 : 320);
    }

    function close(restoreFocus) {
      if (!isOpen) return;
      isOpen = false;
      menu.classList.remove('is-open');
      menu.setAttribute('inert', '');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.removeAttribute('aria-label');
      if (label) label.textContent = 'Menu';
      if (header) header.classList.remove('is-mobile-open');
      MART.lockScroll(false);
      if (restoreFocus !== false) toggle.focus({ preventScroll: true });
    }
    MART.closeMobileMenu = close;

    toggle.addEventListener('click', function () {
      if (isOpen) close();
      else open();
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      var items = focusables();
      items.push(toggle);
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (items.indexOf(document.activeElement) === -1) {
        e.preventDefault();
        first.focus();
      }
    });

    toArray(menu.querySelectorAll('[data-m-acc]')).forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        panel.classList.toggle('is-open', !expanded);
        if (expanded) panel.setAttribute('inert', '');
        else panel.removeAttribute('inert');
      });
    });

    menu.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || a.hasAttribute('data-soon')) return;
      close(false);
    });

    MART.onResize(function () { if (isOpen && MART.isDesktopNav()) close(false); });
  }

  /* ---------------------------------------------------------------------
     Scroll reveals (IntersectionObserver)
     --------------------------------------------------------------------- */
  var REVEAL_SEL = '.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-mask, .reveal-lines, [data-inview]';

  function initScrollReveal() {
    toArray(document.querySelectorAll('.stagger-group')).forEach(function (group) {
      toArray(group.children).forEach(function (child, i) {
        if (!child.style.getPropertyValue('--ri')) child.style.setProperty('--ri', i);
      });
    });
    toArray(document.querySelectorAll('.reveal-lines')).forEach(function (h) {
      toArray(h.querySelectorAll('.line')).forEach(function (line, i) {
        if (!line.style.getPropertyValue('--l')) line.style.setProperty('--l', i);
      });
    });

    var els = toArray(document.querySelectorAll(REVEAL_SEL));

    if (MART.reducedMotion() || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-inview'); });
      MART.observeReveals = function (root) {
        toArray(root.querySelectorAll(REVEAL_SEL)).forEach(function (el) { el.classList.add('is-inview'); });
      };
      MART.resetReveals = function () {};
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    els.forEach(function (el) { io.observe(el); });

    MART.observeReveals = function (root) {
      toArray(root.querySelectorAll(REVEAL_SEL)).forEach(function (el) {
        if (!el.classList.contains('is-inview')) io.observe(el);
      });
    };
    MART.resetReveals = function (root) {
      toArray(root.querySelectorAll(REVEAL_SEL)).forEach(function (el) {
        el.classList.remove('is-inview');
        io.observe(el);
      });
    };
  }

  /* ---------------------------------------------------------------------
     Hero entrance (home + service page heroes)
     --------------------------------------------------------------------- */
  function initHeroEntrance() {
    var heroes = toArray(document.querySelectorAll('[data-hero]'));
    heroes.forEach(function (hero) {
      var img = hero.querySelector('img');
      var go = function () { hero.classList.add('is-ready'); };
      if (MART.reducedMotion()) { go(); return; }
      // Wait (briefly) for the hero image so the reveal never shows an empty frame
      if (img && !img.complete) {
        var done = false;
        var fire = function () { if (!done) { done = true; requestAnimationFrame(go); } };
        img.addEventListener('load', fire, { once: true });
        img.addEventListener('error', fire, { once: true });
        setTimeout(fire, 700);
      } else {
        requestAnimationFrame(function () { requestAnimationFrame(go); });
      }
    });
  }

  /* ---------------------------------------------------------------------
     Accordions (research capabilities etc.)
     --------------------------------------------------------------------- */
  function initAccordions() {
    toArray(document.querySelectorAll('[data-accordion]')).forEach(function (acc) {
      var single = acc.getAttribute('data-accordion') === 'single';
      var items = toArray(acc.querySelectorAll('.acc-item'));
      var triggers = [];

      function setState(item, open) {
        var btn = item.querySelector('.acc-trigger');
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        if (open) panel.removeAttribute('inert');
        else panel.setAttribute('inert', '');
      }

      items.forEach(function (item) {
        var btn = item.querySelector('.acc-trigger');
        triggers.push(btn);
        setState(item, item.classList.contains('is-open'));
        btn.addEventListener('click', function () {
          var willOpen = !item.classList.contains('is-open');
          if (single && willOpen) {
            items.forEach(function (other) { if (other !== item) setState(other, false); });
          }
          setState(item, willOpen);
        });
        btn.addEventListener('keydown', function (e) {
          var i = triggers.indexOf(btn);
          var next = null;
          if (e.key === 'ArrowDown') next = triggers[(i + 1) % triggers.length];
          else if (e.key === 'ArrowUp') next = triggers[(i - 1 + triggers.length) % triggers.length];
          else if (e.key === 'Home') next = triggers[0];
          else if (e.key === 'End') next = triggers[triggers.length - 1];
          if (next) {
            e.preventDefault();
            next.focus();
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Subtle parallax (desktop, fine pointer, motion allowed)
     --------------------------------------------------------------------- */
  function initParallax() {
    var els = toArray(document.querySelectorAll('[data-parallax]'));
    if (!els.length) return;
    var enabled = false;

    function check() {
      enabled = !MART.reducedMotion() && window.innerWidth >= 1024 && MART.hasFinePointer();
      if (!enabled) els.forEach(function (el) { el.style.transform = ''; });
    }

    function update() {
      if (!enabled) return;
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var host = el.parentElement;
        var r = host.getBoundingClientRect();
        if (r.height === 0 || r.bottom < -120 || r.top > vh + 120) return;
        var speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0.12;
        var offset = r.top + r.height / 2 - vh / 2;
        var y = Math.max(-50, Math.min(50, -offset * speed));
        el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      });
    }
    MART.updateParallax = update;

    check();
    MART.onResize(check);
    MART.onScroll(update);
    update();
  }

  /* ---------------------------------------------------------------------
     Scroll-linked progress tracks (timelines, impact flows, models)
     data-track="horizontal" | "vertical", steps marked with [data-step]
     --------------------------------------------------------------------- */
  function initTimelines() {
    var tracks = toArray(document.querySelectorAll('[data-track]'));
    if (!tracks.length) return;

    function update() {
      var vh = window.innerHeight;
      var wide = window.innerWidth >= 1024;
      tracks.forEach(function (track) {
        var r = track.getBoundingClientRect();
        if (r.height === 0) return;
        var steps = toArray(track.querySelectorAll('[data-step]'));
        var horizontal = track.getAttribute('data-track') === 'horizontal' && wide;
        var p;
        if (horizontal) {
          var start = vh * 0.88;
          var end = vh * 0.42;
          p = (start - r.top) / (start - end);
        } else {
          p = (vh * 0.62 - r.top) / r.height;
        }
        p = Math.max(0, Math.min(1, p));
        track.style.setProperty('--progress', p.toFixed(4));

        var activeIndex = -1;
        steps.forEach(function (step, i) {
          var on;
          if (horizontal) {
            var threshold = steps.length > 1 ? i / (steps.length - 1) : 0;
            on = p > 0 && p >= threshold - 0.02;
          } else {
            on = step.getBoundingClientRect().top < vh * 0.62;
          }
          step.classList.toggle('is-active', on);
          if (on) activeIndex = i;
        });

        if (track._lastIndex !== activeIndex) {
          track._lastIndex = activeIndex;
          var evt;
          try {
            evt = new CustomEvent('track:change', { detail: { index: activeIndex, total: steps.length } });
          } catch (err) {
            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent('track:change', false, false, { index: activeIndex, total: steps.length });
          }
          track.dispatchEvent(evt);
        }
      });
    }
    MART.updateTracks = update;
    MART.onScroll(update);
    MART.onResize(update);
    update();
  }

  /* ---------------------------------------------------------------------
     Images: fade in on load, graceful fallback on error
     --------------------------------------------------------------------- */
  function initImages() {
    toArray(document.querySelectorAll('img')).forEach(function (img) {
      function done() { img.classList.add('is-loaded'); }
      function fail() {
        img.classList.add('is-broken');
        var holder = img.closest('picture') ? img.closest('picture').parentElement : img.parentElement;
        if (holder) holder.classList.add('has-broken-img');
      }
      if (img.complete) {
        if (img.naturalWidth > 0) done();
        else if (img.getAttribute('src')) fail();
      }
      img.addEventListener('load', done);
      img.addEventListener('error', fail);
    });
  }

  /* ---------------------------------------------------------------------
     Toast + prototype links (pages planned for later phases)
     --------------------------------------------------------------------- */
  var toastTimer;
  MART.toast = function (message) {
    var el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 3600);
  };

  function initPrototypeLinks() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-soon]');
      if (!link) return;
      e.preventDefault();
      var msg = link.getAttribute('data-soon') || 'This page is part of the next design phase of the prototype.';
      MART.toast(msg);
    });
  }

  /* ---------------------------------------------------------------------
     Same-page anchors: smooth scroll with header offset, no URL churn
     --------------------------------------------------------------------- */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a[href]');
      if (!a || a.hasAttribute('data-soon') || a.target === '_blank') return;
      var url;
      try { url = new URL(a.getAttribute('href'), window.location.href); } catch (err) { return; }
      if (url.pathname !== window.location.pathname || !url.hash || url.hash === '#') return;

      var hash = url.hash;
      for (var i = 0; i < MART.hashHandlers.length; i++) {
        if (MART.hashHandlers[i](hash)) {
          e.preventDefault();
          if (MART.closeMega) MART.closeMega(false);
          return;
        }
      }

      if (hash === '#top') {
        e.preventDefault();
        if (MART.closeMega) MART.closeMega(false);
        window.scrollTo({ top: 0, behavior: MART.reducedMotion() ? 'auto' : 'smooth' });
        return;
      }
      var target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      if (MART.closeMega) MART.closeMega(false);
      MART.scrollToEl(target);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  initHeader();
  initMegaMenu();
  initMobileNav();
  initScrollReveal();
  initHeroEntrance();
  initAccordions();
  initParallax();
  initTimelines();
  initImages();
  initPrototypeLinks();
  initAnchors();
})();
