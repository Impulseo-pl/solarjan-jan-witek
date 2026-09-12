/* =========================================================================
   SOLARJAN — interakcje
   preloader · siatka energii · reveal · nav · przepływ prądu · kalkulator
   ========================================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- PRELOADER */
  (function preloader() {
    var pl = $('#preloader');
    if (!pl) return;
    document.body.classList.add('is-loading');

    var logo = $('.pl-logo', pl);
    var bar = $('.pl-bar b', pl);
    var pct = $('#pl-pct', pl);
    var rays = $('.pl-rays', pl);

    if (rays) {
      for (var r = 0; r < 14; r++) {
        var s = document.createElement('span');
        s.style.setProperty('--rot', (r * (360 / 14)) + 'deg');
        s.style.animationDelay = (r * 0.11) + 's';
        rays.appendChild(s);
      }
    }

    var p = 0, done = false;
    var set = function (v) {
      p = Math.min(100, v);
      var s = p.toFixed(0) + '%';
      if (logo) logo.style.setProperty('--p', s);
      if (bar) bar.style.setProperty('--p', s);
      if (pct) pct.textContent = p.toFixed(0).padStart(2, '0');
    };

    var tick = setInterval(function () {
      set(p + (p < 65 ? 3.5 + Math.random() * 5 : 1.4 + Math.random() * 2.4));
      if (p >= 99) { clearInterval(tick); }
    }, 90);

    var finish = function () {
      if (done) return; done = true;
      clearInterval(tick);
      set(100);
      setTimeout(function () {
        var f = $('.pl-flash');
        if (f && !reduce) {
          f.classList.add('go');
          setTimeout(function () { if (f.parentNode) f.remove(); }, 900);
        } else if (f) { f.remove(); }
        pl.classList.add('done');
        document.body.classList.remove('is-loading');
        document.body.classList.add('ready');
        setTimeout(function () { pl.remove(); }, 900);
      }, 480);
    };

    var minTime = reduce ? 200 : 1900;
    var start = Date.now();
    var go = function () { setTimeout(finish, Math.max(0, minTime - (Date.now() - start))); };
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go);
    setTimeout(finish, 6000); // bezpiecznik
  })();

  /* ------------------------------------------------------ SIATKA ENERGII (tło) */
  (function energyGrid() {
    var cv = $('#grid-canvas');
    if (!cv || reduce) return;
    var ctx = cv.getContext('2d');
    var w, h, dpr, lines = [], raf;

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lines = [];
      var n = w < 760 ? 7 : 14;
      for (var i = 0; i < n; i++) {
        var horiz = Math.random() > 0.42;
        lines.push({
          horiz: horiz,
          pos: Math.random() * (horiz ? h : w),
          t: Math.random(),
          speed: 0.0013 + Math.random() * 0.0026,
          len: 0.07 + Math.random() * 0.13,
          amber: Math.random() > 0.45
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < lines.length; i++) {
        var l = lines[i];
        l.t += l.speed;
        if (l.t > 1 + l.len) l.t = -l.len;
        var a = l.t, b = l.t + l.len;
        var x1, y1, x2, y2;
        if (l.horiz) { y1 = y2 = l.pos; x1 = a * w; x2 = b * w; }
        else { x1 = x2 = l.pos; y1 = a * h; y2 = b * h; }
        var g = ctx.createLinearGradient(x1, y1, x2, y2);
        var c = l.amber ? '255,179,2' : '77,225,255';
        g.addColorStop(0, 'rgba(' + c + ',0)');
        g.addColorStop(0.5, 'rgba(' + c + ',0.42)');
        g.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    }

    build(); draw();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(build, 200);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(draw);
    });
  })();

  /* ------------------------------------------------------------------- NAV */
  (function nav() {
    var n = $('.nav');
    var burger = $('.burger');
    if (n) {
      var onScroll = function () { n.classList.toggle('stuck', window.scrollY > 24); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    if (burger) {
      burger.addEventListener('click', function () {
        document.body.classList.toggle('menu-open');
        burger.setAttribute('aria-expanded', document.body.classList.contains('menu-open'));
      });
      $$('.nav-links a').forEach(function (a) {
        a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
      });
    }
  })();

  /* ---------------------------------------------------------------- REVEAL */
  (function reveal() {
    var els = $$('[data-rv]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || reduce) {
      els.forEach(function (e) { e.classList.add('in'); }); return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var d = parseFloat(en.target.getAttribute('data-rv')) || 0;
        en.target.style.transitionDelay = d + 'ms';
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ------------------------------------------------------- PANELE W HERO */
  (function panels() {
    var grid = $('.roof-grid');
    if (!grid) return;
    for (var i = 0; i < 16; i++) {
      var p = document.createElement('div');
      p.className = 'panel';
      p.style.animationDelay = (0.9 + i * 0.055) + 's';
      p.style.setProperty('--i', i);
      grid.appendChild(p);
    }
  })();

  /* --------------------------------------------------------- PRZEPŁYW PRĄDU */
  (function flow() {
    var box = $('#flow');
    if (!box) return;
    var btns = $$('.flow-switch button', box);
    var svg = $('.flow-svg', box);
    if (!svg) return;

    var set = function (mode) {
      svg.setAttribute('data-mode', mode);
      btns.forEach(function (b) { b.classList.toggle('on', b.dataset.mode === mode); });
      $$('[data-only]', svg).forEach(function (el) {
        var show = el.getAttribute('data-only').split(' ').indexOf(mode) > -1;
        el.style.opacity = show ? '1' : '0.12';
      });
    };
    btns.forEach(function (b) {
      b.addEventListener('click', function () { set(b.dataset.mode); });
    });
    set('dzien');

    // animowane impulsy po przewodach
    $$('.flow-live', svg).forEach(function (path, i) {
      if (reduce) { path.style.strokeDasharray = 'none'; path.style.opacity = '.5'; return; }
      var len = 0;
      try { len = path.getTotalLength(); } catch (e) { len = 300; }
      path.style.strokeDasharray = '16 ' + Math.max(90, len);
      var dur = (1.5 + (i % 3) * 0.45);
      path.animate(
        [{ strokeDashoffset: len + 16 }, { strokeDashoffset: 0 }],
        { duration: dur * 1000, iterations: Infinity, delay: i * 260, easing: 'linear' }
      );
    });
  })();

  /* ------------------------------------------------------------ KALKULATOR */
  (function calc() {
    var box = $('#kalkulator');
    if (!box) return;

    var range = $('#bill', box);
    var billOut = $('#bill-val', box);
    var tgl = $('#with-bat', box);
    var elSave = $('#r-save', box);
    var elPower = $('#r-power', box);
    var elProd = $('#r-prod', box);
    var elCost = $('#r-cost', box);
    var elBack = $('#r-back', box);
    var elMonth = $('#r-month', box);
    var barNow = $('#bar-now', box);
    var barAft = $('#bar-after', box);
    var barNowV = $('#bar-now-v', box);
    var barAftV = $('#bar-after-v', box);
    if (!range) return;

    // założenia (poglądowe, opisane pod kalkulatorem)
    var PRICE = 1.00;      // zł/kWh brutto razem z dystrybucją
    var YIELD = 1000;      // kWh rocznie z 1 kWp w naszym rejonie
    var EXPORT = 0.40;     // zł/kWh — rozliczenie nadwyżek (net-billing)
    var SELF_PV = 0.30;    // autokonsumpcja bez magazynu
    var SELF_BAT = 0.75;   // autokonsumpcja z magazynem
    var COST_KWP = 4500;   // zł brutto za 1 kWp
    var COST_KWH = 3800;   // zł brutto za 1 kWh pojemności magazynu
    var FIXED = 300;       // zł rocznie — opłaty stałe, których fotowoltaika nie zbija

    var fmt = function (n) { return Math.round(n).toLocaleString('pl-PL'); };

    function compute() {
      var bill = +range.value;
      var bat = tgl.classList.contains('on');

      var useYear = (bill * 12) / PRICE;                       // kWh/rok
      var kwp = Math.min(20, Math.max(3, Math.round((useYear / YIELD) * 2) / 2));
      var prod = kwp * YIELD;
      var self = bat ? SELF_BAT : SELF_PV;
      var covered = Math.min(useYear, prod * self);
      var surplus = Math.max(0, prod - covered);
      var save = covered * PRICE + surplus * EXPORT;
      save = Math.min(save, Math.max(0, bill * 12 - FIXED));   // opłat stałych PV nie zbija
      var capacity = bat ? Math.max(5, Math.round(kwp * 0.8)) : 0;
      var cost = kwp * COST_KWP + capacity * COST_KWH;
      var back = cost / save;

      animate(elSave, save);
      elPower.textContent = kwp.toFixed(1).replace('.', ',') + ' kWp';
      elProd.textContent = fmt(prod) + ' kWh';
      elCost.textContent = fmt(cost) + ' zł';
      elBack.textContent = back.toFixed(1).replace('.', ',') + ' roku';
      elMonth.textContent = fmt(save / 12) + ' zł';

      var nowYear = bill * 12;
      var afterYear = Math.max(0, nowYear - save);
      barNow.style.setProperty('--w', '100%');
      barAft.style.setProperty('--w', Math.max(6, (afterYear / nowYear) * 100) + '%');
      barNowV.textContent = fmt(nowYear) + ' zł';
      barAftV.textContent = fmt(afterYear) + ' zł';

      billOut.textContent = fmt(bill) + ' zł';
      range.style.setProperty('--fill', ((bill - range.min) / (range.max - range.min)) * 100 + '%');
    }

    var raf;
    function animate(el, target) {
      if (reduce) { el.textContent = fmt(target); return; }
      var from = parseFloat((el.textContent || '0').replace(/\s| /g, '').replace(',', '.')) || 0;
      var t0 = performance.now();
      cancelAnimationFrame(el._raf);
      var step = function (t) {
        var k = Math.min(1, (t - t0) / 600);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(from + (target - from) * e);
        if (k < 1) el._raf = requestAnimationFrame(step);
      };
      el._raf = requestAnimationFrame(step);
    }

    range.addEventListener('input', compute);
    tgl.addEventListener('click', function () {
      tgl.classList.toggle('on');
      tgl.setAttribute('aria-pressed', tgl.classList.contains('on'));
      compute();
    });
    compute();
  })();

  /* ----------------------------------------------------------------- PROCES */
  (function steps() {
    var wrap = $('.steps');
    if (!wrap) return;
    var items = $$('.step', wrap);
    var onScroll = function () {
      var r = wrap.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.72 - r.top) / r.height;
      wrap.style.setProperty('--prog', Math.max(0, Math.min(1, p)) * 100 + '%');
      items.forEach(function (it) {
        var ir = it.getBoundingClientRect();
        it.classList.toggle('lit', ir.top < vh * 0.72);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* -------------------------------------------------------------------- FAQ */
  (function faq() {
    $$('.q').forEach(function (q) {
      var head = $('.q-head', q);
      var body = $('.q-body', q);
      if (!head || !body) return;
      head.addEventListener('click', function () {
        var open = q.classList.contains('open');
        $$('.q.open').forEach(function (o) {
          o.classList.remove('open');
          $('.q-body', o).style.maxHeight = null;
          $('.q-head', o).setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          q.classList.add('open');
          body.style.maxHeight = body.scrollHeight + 'px';
          head.setAttribute('aria-expanded', 'true');
        }
      });
    });
  })();

  /* ------------------------------------------------------------- FORMULARZ */
  (function form() {
    var f = $('#kontakt-form');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = $('#form-ok', f.parentNode);
      var d = new FormData(f);
      var body = 'Imie: ' + (d.get('imie') || '') + '\nTelefon: ' + (d.get('tel') || '') +
        '\nZakres: ' + (d.get('zakres') || '') + '\nRachunek: ' + (d.get('rachunek') || '') +
        '\n\n' + (d.get('wiadomosc') || '');
      window.location.href = 'mailto:jan@solarjan.pl?subject=' +
        encodeURIComponent('Zapytanie ze strony — ' + (d.get('zakres') || 'wycena')) +
        '&body=' + encodeURIComponent(body);
      if (ok) ok.hidden = false;
    });
  })();

  /* ------------------------------------------------------------ ROK W STOPCE */
  $$('.year').forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();
