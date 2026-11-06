/* Liberty Power Park — prototype interactions */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- nav ---------- */
  function initNav() {
    var nav = $('.nav'), burger = $('.burger'), links = $('.nav-links');
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 40) nav.classList.add('solid'); else nav.classList.remove('solid');
    };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    if (burger) {
      burger.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('a', links).forEach(function (a) {
        a.addEventListener('click', function () { links.classList.remove('open'); burger.classList.remove('open'); });
      });
    }
  }

  /* ---------- reveal ---------- */
  function initReveal() {
    var els = $$('.rv');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    els.forEach(function (e, i) { e.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(e); });
  }

  /* ---------- counters ---------- */
  function initCounters() {
    var els = $$('[data-count]');
    if (!els.length) return;
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      var dur = 1400, t0 = null;
      if (reduce) { el.textContent = target.toFixed(dec); return; }
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- energise hero ---------- */
  function initEnergise() {
    var hero = $('.hero-svg');
    if (!hero) {
      if (reduce) { document.body.classList.add('lit'); }
      else { window.setTimeout(function () { document.body.classList.add('lit'); }, 240); }
      return;
    }
    var halls = $$('.e-hall', hero);
    var wire = $$('.e-wire path', hero);
    wire.forEach(function (p) {
      try { var L = p.getTotalLength(); p.style.setProperty('--len', L); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; } catch (e) {}
    });
    var play = function () {
      document.body.classList.remove('lit');
      halls.forEach(function (h) { h.style.transitionDelay = '0ms'; });
      // force reflow so the reset is committed before replaying
      void document.body.offsetWidth;
      halls.forEach(function (h, i) {
        var d = 380 + i * 105;
        h.style.transitionDelay = d + 'ms';
        h.style.transitionDuration = '520ms';
      });
      var plant = $('.e-plant', hero);
      if (plant) plant.style.transitionDelay = '120ms';
      wire.forEach(function (p) { p.style.transitionDelay = (1150) + 'ms'; });
      document.body.classList.add('lit');
    };
    if (reduce) { document.body.classList.add('lit'); }
    else { window.setTimeout(play, 260); }
    var btn = $('.replay');
    if (btn) btn.addEventListener('click', play);
  }

  /* ---------- load slider ---------- */
  function initLoad() {
    var range = $('#loadinput'), out = $('#load-mw'), line = $('#load-line'), halls = $$('.hall'), gens = $$('.gen i'), note = $('#load-note');
    if (!range) return;
    var HALL_MW = 51.5, GEN_MW = 45.8, MAX = 412;
    var paint = function () {
      var mw = parseInt(range.value, 10);
      var pct = (mw - 25) / (MAX - 25) * 100;
      range.style.setProperty('--fill', pct + '%');
      if (out) out.textContent = mw;
      var nh = Math.max(1, Math.ceil(mw / HALL_MW));
      var ng = Math.min(9, Math.max(1, Math.ceil(mw / GEN_MW)));
      halls.forEach(function (h, i) {
        h.classList.toggle('on', i < nh);
        h.classList.toggle('peak', i === nh - 1);
      });
      gens.forEach(function (g, i) { g.classList.toggle('on', i < ng); });
      if (line) line.textContent = nh + (nh === 1 ? ' hall' : ' halls') + ' · ' + ng + ' of 9 machines';
      if (note) {
        note.innerHTML = mw <= 51.5
          ? '<b>One hall.</b> Smallest unit we will lease — a single 51.5 MW hall on a shared plant.'
          : mw >= 400
          ? '<b>The whole campus.</b> All eight halls, all nine machines, no queue in the path.'
          : '<b>' + nh + ' halls.</b> ' + (412 - mw) + ' MW of the plant still available to the next tenant.';
      }
    };
    range.addEventListener('input', paint);
    paint();
  }

  /* ---------- scroll-drawn plan ---------- */
  function initPlan() {
    var shell = $('#plan');
    if (!shell) return;
    var halls = $$('.plan-hall', shell), labels = $$('.plan-label', shell), plant = $$('.plan-plant, .plan-unit', shell);
    var total = halls.length + labels.length + plant.length;
    var apply = function (n) {
      halls.forEach(function (h, i) { h.classList.toggle('in', i < n); });
      labels.forEach(function (h, i) { h.classList.toggle('in', i < n - halls.length + 1); });
      plant.forEach(function (h, i) { h.classList.toggle('in', i < n - halls.length - labels.length + 1); });
    };
    if (reduce) { apply(total); return; }
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = shell.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.86 - r.top) / (r.height * 0.92 + vh * 0.22);
      p = Math.max(0, Math.min(1, p));
      apply(Math.round(p * total));
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- latency map ---------- */
  var MARKETS = [
    { n: 'Philadelphia', d: 2.53, c: 2.7 },
    { n: 'New York', d: 2.61, c: 2.8 },
    { n: 'Ashburn', d: 3.55, c: 3.8 },
    { n: 'Pittsburgh', d: 3.63, c: 3.8 },
    { n: 'Boston', d: 5.18, c: 5.4 },
    { n: 'Chicago', d: 10.41, c: 11.0 }
  ];
  function initMap() {
    var shell = $('#reach');
    if (!shell) return;
    var svg = $('svg', shell);
    if (!svg) return;
    var arcs = $$('.arc', svg);
    var map = {};
    MARKETS.forEach(function (m) { map[m.n] = m; });
    // inject ms labels beneath each city label
    var labels = $$('text', svg);
    var msEls = [];
    labels.forEach(function (t) {
      var name = (t.textContent || '').trim();
      var key = null;
      Object.keys(map).forEach(function (k) { if (name.toUpperCase() === k.toUpperCase()) key = k; });
      if (!key) return;
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      el.setAttribute('x', t.getAttribute('x'));
      var dy = { 'New York': 34, 'Boston': 15 }[key] || 15;
      el.setAttribute('y', parseFloat(t.getAttribute('y')) + dy);
      el.setAttribute('text-anchor', t.getAttribute('text-anchor') || 'start');
      el.setAttribute('fill', '#C8F04A');
      el.setAttribute('font-family', 'IBM Plex Mono, monospace');
      el.setAttribute('font-size', '10.5');
      el.setAttribute('letter-spacing', '.06em');
      el.setAttribute('opacity', '0');
      el.setAttribute('class', 'ms-label');
      el.setAttribute('data-city', key);
      el.textContent = map[key].d.toFixed(2) + ' ms';
      t.parentNode.appendChild(el);
      msEls.push(el);
    });
    arcs.forEach(function (a) {
      try {
        var L = a.getTotalLength();
        a.setAttribute('stroke-dasharray', L);
        a.setAttribute('stroke-dashoffset', L);
        a.setAttribute('data-len', L);
      } catch (e) {}
    });
    var drawn = false;
    var draw = function () {
      if (drawn) return; drawn = true;
      arcs.forEach(function (a) {
        var city = a.getAttribute('data-city');
        var m = map[city];
        var delay = m ? (m.d - 2.5) * 420 : 300;
        delay = Math.max(0, delay);
        a.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(.35,0,.15,1) ' + delay + 'ms, opacity .6s ' + delay + 'ms';
        a.style.strokeDashoffset = '0';
      });
      msEls.forEach(function (el) {
        var m = map[el.getAttribute('data-city')];
        var delay = m ? (m.d - 2.5) * 420 + 900 : 900;
        el.style.transition = 'opacity .6s ease ' + Math.max(0, delay) + 'ms';
        el.setAttribute('opacity', '1');
      });
      shell.classList.add('drawn');
    };
    if (reduce) { draw(); }
    else if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { draw(); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(svg);
    } else { draw(); }

    // conservative toggle
    var tog = $('#lat-mode');
    var list = $$('#lat-list b');
    if (tog) {
      tog.addEventListener('click', function () {
        var cons = tog.getAttribute('aria-pressed') !== 'true';
        tog.setAttribute('aria-pressed', cons ? 'true' : 'false');
        tog.textContent = cons ? 'Conservative' : 'Design model';
        msEls.forEach(function (el) {
          var m = map[el.getAttribute('data-city')];
          el.textContent = (cons ? m.c : m.d).toFixed(2) + ' ms';
        });
        list.forEach(function (b) {
          var k = b.getAttribute('data-market');
          var m = map[k]; if (!m) return;
          var v = cons ? m.c : m.d;
          b.innerHTML = '<span class="cnt">' + v.toFixed(2) + '</span><i>ms</i>';
        });
      });
    }
  }

  /* ---------- ledger ---------- */
  function initLedger() {
    $$('.row-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.row');
        var body = $('.row-body', row);
        var open = row.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        body.style.maxHeight = open ? body.scrollHeight + 'px' : '0px';
      });
    });
  }

  /* ---------- ring ---------- */
  function initRing() {
    var ring = $('.ring .val');
    if (!ring) return;
    var c = parseFloat(getComputedStyle(ring).getPropertyValue('--c'));
    var pct = parseFloat(ring.getAttribute('data-pct') || '0.67');
    var go = function () { ring.style.strokeDashoffset = c * (1 - pct); };
    if (reduce) return go();
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { go(); io.disconnect(); } }); }, { threshold: 0.4 });
      io.observe(ring);
    } else go();
  }

  /* ---------- schedule progress ---------- */
  function initSched() {
    var s = $('.sched');
    if (!s) return;
    var go = function () {
      var r = s.getBoundingClientRect();
      var p = (window.innerHeight * 0.85 - r.top) / (r.height * 0.9);
      p = Math.max(0, Math.min(1, p));
      s.style.setProperty('--p', (p * 100) + '%');
    };
    if (reduce) { s.style.setProperty('--p', '100%'); return; }
    go();
    window.addEventListener('scroll', go, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav(); initReveal(); initCounters(); initEnergise(); initLoad();
    initPlan(); initMap(); initLedger(); initRing(); initSched();
  });
})();
