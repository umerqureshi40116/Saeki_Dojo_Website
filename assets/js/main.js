/* ============================================================
   SAEKI DOJO — interaction layer (vanilla JS, no dependencies)
   Modules run only if their markup exists on the page.
   ============================================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Entrance animations must not play behind the preloader, so anything that
     animates on first paint waits for the curtain to lift. */
  var TOUCH = window.matchMedia('(hover:none)').matches;
  // Phones feel slow far sooner than desktops, so the deliberate pauses
  // that read as polish on a laptop are cut roughly in half here.
  var DWELL = TOUCH ? 420 : 900;
  var DELAY_SCALE = TOUCH ? 0.45 : 1;

  var readyQueue = [];
  function onReady(fn) {
    if (document.documentElement.classList.contains('is-ready')) fn();
    else readyQueue.push(fn);
  }
  function flushReady() {
    document.documentElement.classList.add('is-ready');
    while (readyQueue.length) readyQueue.shift()();
  }

  /* ---------- 0. SPLIT HEADLINES (must run before reveal observes them) ---------- */
  (function split() {
    $$('.split').forEach(function (el) {
      if (el.dataset.splitDone) return;
      var raw = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = raw.map(function (line, i) {
        return '<span class="line" style="transition-delay:' + (i * 110) + 'ms">' +
               '<span style="transition-delay:' + (i * 110) + 'ms">' + line.trim() + '</span></span>';
      }).join('');
      el.dataset.splitDone = '1';
    });
  })();

  /* ---------- 1. PRELOADER ---------- */
  (function preloader() {
    var pre = $('#preloader');
    if (!pre) return;
    var bar = $('.pre__bar i', pre);
    var pct = 0;
    var tick = setInterval(function () {
      pct = Math.min(100, pct + Math.random() * 22);
      if (bar) bar.style.width = pct + '%';
      if (pct >= 100) clearInterval(tick);
    }, 130);

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      clearInterval(tick);
      if (bar) bar.style.width = '100%';
      setTimeout(function () {
        pre.classList.add('is-done');
        document.body.classList.remove('is-locked');
        flushReady();
      }, REDUCED ? 0 : 420);
    }

    document.body.classList.add('is-locked');
    if (document.readyState === 'complete') { setTimeout(finish, REDUCED ? 0 : DWELL); }
    else { window.addEventListener('load', function () { setTimeout(finish, REDUCED ? 0 : DWELL); }); }
    // hard safety net so the page never stays hidden
    setTimeout(finish, TOUCH ? 2600 : 4500);
  })();

  /* ---------- 2. SCROLL REVEAL ---------- */
  (function reveal() {
    var items = $$('[data-reveal], .media-reveal, .split, .tl');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || REDUCED) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    onReady(function () {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          var delay = parseInt(el.getAttribute('data-delay') || '0', 10) * DELAY_SCALE;
          setTimeout(function () { el.classList.add('is-in'); }, delay);
          io.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      items.forEach(function (el) { io.observe(el); });
    });
  })();

  /* ---------- 4. HEADER: stick / hide on scroll ---------- */
  (function header() {
    var h = $('.header');
    if (!h) return;
    var last = 0;
    function onScroll() {
      var y = window.pageYOffset;
      h.classList.toggle('is-stuck', y > 40);
      if (y > 400 && y > last && !document.body.classList.contains('is-locked')) h.classList.add('is-hidden');
      else h.classList.remove('is-hidden');
      last = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ---------- 5. MOBILE NAV ---------- */
  (function mobileNav() {
    var burger = $('.burger'), mnav = $('.mnav');
    if (!burger || !mnav) return;
    var links = $$('.mnav__list a', mnav);
    links.forEach(function (a, i) { a.style.transitionDelay = (120 + i * 60) + 'ms'; });

    function toggle(open) {
      burger.classList.toggle('is-open', open);
      mnav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('is-locked', open);
    }
    burger.addEventListener('click', function () { toggle(!mnav.classList.contains('is-open')); });
    links.forEach(function (a) { a.addEventListener('click', function () { toggle(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('is-open')) toggle(false);
    });
  })();

  /* ---------- 6. SCROLL PROGRESS + BACK TO TOP ---------- */
  (function progress() {
    var bar = $('#progress'), top = $('#toTop');
    if (!bar && !top) return;
    function onScroll() {
      var d = document.documentElement;
      var max = d.scrollHeight - d.clientHeight;
      var p = max > 0 ? window.pageYOffset / max : 0;
      if (bar) bar.style.transform = 'scaleX(' + p + ')';
      if (top) top.classList.toggle('is-on', window.pageYOffset > 700);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    if (top) top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    });
    onScroll();
  })();

  /* ---------- 7. CUSTOM CURSOR + MAGNETIC BUTTONS ---------- */
  (function cursor() {
    if (REDUCED || window.matchMedia('(pointer:coarse)').matches) return;
    var ring = $('.cursor'), dot = $('.cursor-dot');
    if (!ring || !dot) return;
    var mx = -100, my = -100, rx = -100, ry = -100;

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();

    $$('a, button, .gal__item, .card, input, textarea, select').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-hover'); });
    });

    // magnetic pull on primary buttons
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + x * 0.22 + 'px,' + y * 0.32 + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  })();

  /* ---------- 8. HERO SLIDESHOW (+ optional video) ---------- */
  (function hero() {
    var media = $('.hero__media');
    if (!media) return;
    var video = $('video', media);
    var slides = $$('.hero__slide', media);
    var timer = null;

    // The Ken Burns stack is the default. If a real video file is present at
    // assets/video/hero.mp4 it fades in on canplay and takes over; if the file
    // is missing the video simply never becomes visible.
    if (video) {
      video.addEventListener('canplay', function () {
        video.classList.add('is-ready');
        clearInterval(timer);
      });
      video.addEventListener('error', function () { video.classList.remove('is-ready'); });
    }

    if (!slides.length) return;
    var i = 0;
    slides[0].classList.add('is-active');
    if (REDUCED || slides.length < 2) return;
    timer = setInterval(function () {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, 6500);
  })();

  /* ---------- 9. PARALLAX ---------- */
  (function parallax() {
    var items = $$('[data-parallax]');
    if (!items.length || REDUCED) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.12;
        var offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = 'translate3d(0,' + (-offset).toFixed(2) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- 10. COUNT-UP STATS ---------- */
  (function counters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;
    if (!('IntersectionObserver' in window) || REDUCED) {
      nums.forEach(function (n) { n.textContent = n.getAttribute('data-count'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var dur = 1700, t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  })();

  /* ---------- 11. TIMELINE PROGRESS LINE ---------- */
  (function timeline() {
    var line = $('.timeline'), prog = $('.timeline__prog');
    if (!line || !prog) return;
    function update() {
      var r = line.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.65 - r.top) / r.height;
      prog.style.height = Math.max(0, Math.min(1, p)) * 100 + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- 12. TABS ---------- */
  (function tabs() {
    $$('[data-tabs]').forEach(function (wrap) {
      var btns = $$('.tab', wrap);
      var ink = $('.tabs__ink', wrap);
      if (!btns.length) return;

      function moveInk(btn) {
        if (!ink) return;
        ink.style.width = btn.offsetWidth + 'px';
        ink.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
      }
      function select(btn) {
        btns.forEach(function (b) {
          var on = b === btn;
          b.setAttribute('aria-selected', on ? 'true' : 'false');
          var p = document.getElementById(b.getAttribute('aria-controls'));
          if (p) p.hidden = !on;
        });
        moveInk(btn);
      }
      btns.forEach(function (b) { b.addEventListener('click', function () { select(b); }); });
      var active = btns.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || btns[0];
      select(active);
      window.addEventListener('resize', function () {
        var cur = btns.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0];
        if (cur) moveInk(cur);
      });
      window.addEventListener('load', function () { moveInk(active); });
    });
  })();

  /* ---------- 13. PRICING TOGGLE (monthly / yearly) ---------- */
  (function pricing() {
    var wrap = $('[data-pricing]');
    if (!wrap) return;
    var btns = $$('.toggle button', wrap);
    var ink = $('.toggle__ink', wrap);
    var amounts = $$('[data-monthly]', wrap);

    function moveInk(btn) {
      if (!ink) return;
      ink.style.width = btn.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + (btn.offsetLeft - ink.offsetLeft) + 'px)';
    }
    function apply(mode, btn) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      moveInk(btn);
      amounts.forEach(function (el) {
        var val = el.getAttribute(mode === 'yearly' ? 'data-yearly' : 'data-monthly');
        var per = el.parentElement.querySelector('.price__per');
        el.classList.add('is-rolling');
        setTimeout(function () {
          var num = el.querySelector('.num');
          if (num) num.textContent = val;
          if (per) per.textContent = mode === 'yearly' ? 'per year · CAD' : 'per month · CAD';
          el.classList.remove('is-rolling');
        }, 260);
      });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-mode'), b); });
    });
    var start = btns[0];
    if (start) { moveInk(start); window.addEventListener('load', function () { moveInk(start); }); }
    window.addEventListener('resize', function () {
      var cur = btns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
      if (cur) moveInk(cur);
    });
  })();

  /* ---------- 14. ACCORDION ---------- */
  (function accordion() {
    $$('.acc').forEach(function (acc) {
      var items = $$('.acc__item', acc);
      items.forEach(function (item) {
        var btn = $('.acc__btn', item);
        var panel = $('.acc__panel', item);
        if (!btn || !panel) return;
        btn.addEventListener('click', function () {
          var open = btn.getAttribute('aria-expanded') === 'true';
          items.forEach(function (other) {
            var ob = $('.acc__btn', other), op = $('.acc__panel', other);
            if (ob && op) { ob.setAttribute('aria-expanded', 'false'); op.style.height = '0px'; }
          });
          if (!open) {
            btn.setAttribute('aria-expanded', 'true');
            panel.style.height = panel.firstElementChild.offsetHeight + 'px';
          }
        });
      });
    });
  })();

  /* ---------- 15. GALLERY FILTER + LIGHTBOX ---------- */
  (function gallery() {
    var gal = $('.gal');
    if (!gal) return;
    var items = $$('.gal__item', gal);

    $$('.filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.filter').forEach(function (b) { b.classList.remove('is-on'); });
        btn.classList.add('is-on');
        var key = btn.getAttribute('data-filter');
        items.forEach(function (it) {
          var match = key === 'all' || (it.getAttribute('data-cat') || '').indexOf(key) > -1;
          it.classList.toggle('is-hidden', !match);
        });
      });
    });

    var box = $('.lbox');
    if (!box) return;
    var img = $('img', box), cap = $('.lbox__cap', box);
    var idx = 0;

    function visible() { return items.filter(function (i) { return !i.classList.contains('is-hidden'); }); }
    function show(n) {
      var list = visible();
      if (!list.length) return;
      idx = (n + list.length) % list.length;
      var src = list[idx].getAttribute('data-full') || $('img', list[idx]).src;
      img.src = src;
      img.alt = $('img', list[idx]).alt;
      cap.textContent = list[idx].getAttribute('data-cap') || '';
    }
    function open(el) { show(visible().indexOf(el)); box.classList.add('is-open'); document.body.classList.add('is-locked'); }
    function close() { box.classList.remove('is-open'); document.body.classList.remove('is-locked'); }

    items.forEach(function (it) { it.addEventListener('click', function () { open(it); }); });
    $('.lbox__close', box).addEventListener('click', close);
    $('.lbox__next', box).addEventListener('click', function () { show(idx + 1); });
    $('.lbox__prev', box).addEventListener('click', function () { show(idx - 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
  })();

  /* ---------- 16. TESTIMONIAL SLIDER ---------- */
  (function slider() {
    $$('[data-slider]').forEach(function (root) {
      var track = $('.slider__track', root);
      var slides = $$('.slider__slide', root);
      var dotsWrap = $('.slider__dots', root);
      if (!track || slides.length < 2) return;
      var i = 0, timer;

      slides.forEach(function (_, n) {
        var d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('aria-label', 'Go to testimonial ' + (n + 1));
        d.addEventListener('click', function () { go(n); restart(); });
        dotsWrap.appendChild(d);
      });
      var dots = $$('button', dotsWrap);

      function go(n) {
        i = (n + slides.length) % slides.length;
        track.style.transform = 'translateX(' + (-i * 100) + '%)';
        dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
      }
      function restart() { clearInterval(timer); if (!REDUCED) timer = setInterval(function () { go(i + 1); }, 6000); }
      go(0); restart();
      root.addEventListener('mouseenter', function () { clearInterval(timer); });
      root.addEventListener('mouseleave', restart);
    });
  })();

  /* ---------- 17. FORMS: floating labels + validation ---------- */
  (function forms() {
    $$('.field select, .field input, .field textarea').forEach(function (el) {
      function sync() { el.closest('.field').classList.toggle('is-filled', !!el.value); }
      el.addEventListener('change', sync);
      el.addEventListener('blur', sync);
      sync();
    });

    $$('form[data-validate]').forEach(function (form) {
      var ok = $('.form__ok', form);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var valid = true;
        $$('[required]', form).forEach(function (el) {
          var field = el.closest('.field');
          var good = el.type === 'email'
            ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim())
            : el.value.trim().length > 0;
          field.classList.toggle('is-error', !good);
          if (!good) valid = false;
        });
        if (!valid) return;
        var btn = $('button[type="submit"]', form);
        var lbl = btn && btn.querySelector('span');
        var original = lbl ? lbl.textContent : '';
        var fail = $('.form__fail', form);
        if (fail) fail.classList.remove('is-on');
        if (btn) { btn.disabled = true; if (lbl) lbl.textContent = 'Sending…'; }

        function succeed() {
          form.reset();
          $$('.field', form).forEach(function (f) { f.classList.remove('is-filled', 'is-error'); });
          if (ok) ok.classList.add('is-on');
          if (btn) { btn.disabled = false; if (lbl) lbl.textContent = original; }
        }
        function stumble() {
          if (fail) fail.classList.add('is-on');
          if (btn) { btn.disabled = false; if (lbl) lbl.textContent = original; }
        }

        // A real endpoint in action="" (Formspree, Netlify, Basin…) is POSTed for
        // real. With no endpoint configured the form stays in demo mode.
        var endpoint = form.getAttribute('action');
        if (endpoint && endpoint.indexOf('YOUR_FORM_ID') === -1) {
          fetch(endpoint, {
            method: 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' }
          }).then(function (r) { r.ok ? succeed() : stumble(); }).catch(stumble);
        } else {
          setTimeout(succeed, 900);
        }
      });
    });
  })();

  /* ---------- 18. PAGE TRANSITION CURTAIN ---------- */
  (function transitions() {
    // On touch the 480ms curtain reads as lag rather than polish, so taps
    // navigate immediately instead.
    if (REDUCED || window.matchMedia('(hover:none)').matches) return;
    var curtain = $('#curtain');
    if (!curtain) return;
    $$('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank' ||
          /^(https?:|mailto:|tel:)/.test(href)) return;
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        curtain.classList.add('is-out');
        setTimeout(function () { window.location.href = href; }, 480);
      });
    });
  })();

  /* ---------- 19. ACTIVE SECTION HIGHLIGHT (in-page anchors) ---------- */
  (function spy() {
    var links = $$('.nav__link[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (l) {
      var t = document.querySelector(l.getAttribute('href'));
      if (t) map[t.id] = l;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          if (map[e.target.id]) map[e.target.id].setAttribute('aria-current', 'page');
        }
      });
    }, { threshold: 0.35 });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  })();

  /* ---------- 20. YEAR STAMP ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
