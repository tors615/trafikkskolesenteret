/* Thor Trafikk — interaksjoner (vanilla, ingen avhengigheter) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var kr = function (n) { return Math.round(n).toLocaleString('nb-NO') + ' kr'; };

  /* ---------- Nav: solid når toppområdet er forbi ---------- */
  var nav = document.querySelector('.nav');
  var sentinel = document.querySelector('[data-nav-sentinel]');
  if (nav && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-solid', !entries[0].isIntersecting);
    }, { rootMargin: '-76px 0px 0px 0px' }).observe(sentinel);
  } else if (nav) {
    nav.classList.add('is-solid');
  }

  /* ---------- Mobilmeny ---------- */
  var burger = document.querySelector('.nav__burger');
  var menu = document.querySelector('.mobile-menu');
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Desktop dropdown (klikk/tastatur, hover styres av CSS) ---------- */
  document.querySelectorAll('.has-dd').forEach(function (dd) {
    var btn = dd.querySelector('.dd__btn');
    var panel = dd.querySelector('.dd__panel');
    if (!btn || !panel) return;
    btn.setAttribute('aria-expanded', 'false');
    var toggle = function (open) {
      panel.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    btn.addEventListener('click', function (e) { e.preventDefault(); toggle(!panel.classList.contains('is-open')); });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) toggle(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) toggle(false); });
  });

  /* ---------- Scroll-reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- Tall som teller opp ---------- */
  var counters = document.querySelectorAll('[data-count]');
  var formatNum = function (val, decimals) { return val.toFixed(decimals).replace('.', ','); };
  var runCount = function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = prefix + formatNum(target, decimals) + suffix; return; }
    var start = performance.now(), dur = 1400;
    var tick = function (now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + formatNum(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + formatNum(target, decimals) + suffix;
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    if (reduce || !('IntersectionObserver' in window)) { counters.forEach(runCount); }
    else {
      var co = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); obs.unobserve(en.target); } });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }

  /* ---------- FAQ: én åpen om gangen + filter + dyplenke ---------- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq details'));
  faqItems.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) faqItems.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
  // åpne dyplenket spørsmål (#sporsmal-...)
  if (location.hash.length > 1) {
    var target = document.getElementById(location.hash.slice(1));
    if (target && target.tagName === 'DETAILS') { target.open = true; }
  }
  var faqFilter = document.querySelector('[data-faq-filter]');
  if (faqFilter) {
    var groups = Array.prototype.slice.call(document.querySelectorAll('.faq__group'));
    var emptyMsg = document.querySelector('.faq__empty');
    faqFilter.addEventListener('input', function () {
      var q = faqFilter.value.trim().toLowerCase();
      var anyVisible = false;
      faqItems.forEach(function (d) {
        var text = d.textContent.toLowerCase();
        var show = !q || text.indexOf(q) !== -1;
        d.hidden = !show;
        if (show) anyVisible = true;
      });
      groups.forEach(function (g) {
        var visible = g.querySelectorAll('.faq details:not([hidden])').length > 0;
        g.hidden = !visible;
      });
      if (emptyMsg) emptyMsg.classList.toggle('show', !anyVisible);
    });
  }

  /* ---------- Skjema (demo: trenger ekte endepunkt før lansering) ---------- */
  var form = document.querySelector('[data-lead-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form__status');
      if (status) {
        status.classList.add('is-ok');
        status.textContent = 'Takk! Vi har mottatt påmeldingen din og tar kontakt så snart vi kan for å avtale oppstart.';
        status.setAttribute('role', 'status');
      }
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        if (el.type !== 'submit' && el.type !== 'checkbox' && el.type !== 'radio') el.value = '';
      });
    });
  }

  /* ---------- Pris-estimator ---------- */
  var calc = document.querySelector('[data-calc]');
  if (calc) {
    var P = { time: 960, trinn: 2300, risiko: 3760, bane: 5940, veg: 9660, leiebil: 3100, forerprove: 0 };
    var S = { step: 1, gear: 'manuell', timer: 10, leiebil: true, forerprove: false, obl: { trinn: true, risiko: true, bane: true, veg: true } };
    var MAX = 5, MINT = 0, MAXT = 40;
    var OBL = [['trinn', P.trinn, 'Trinnvurdering trinn 2 og 3'], ['risiko', P.risiko, 'Bilkjøringens risiko (4.1.1 + 4.1.4)'], ['bane', P.bane, 'Sikkerhetskurs på øvingsbane'], ['veg', P.veg, 'Sikkerhetskurs på veg (4.1.2 + 4.1.3)']];
    var q = function (s) { return calc.querySelector(s); };
    var steps = calc.querySelectorAll('[data-cstep]');
    var cnum = q('[data-cnum]'), cbar = q('[data-cbar]'), cback = q('[data-cback]'), cnext = q('[data-cnext]');
    var ctotal = q('[data-ctotal]'), ctotal2 = q('[data-ctotal2]'), cbreak = q('[data-cbreak]'), timerVal = q('#c-timer-val');
    var bline = function (label, val) { return '<li><span>' + label + '</span><b>' + kr(val) + '</b></li>'; };
    var compute = function () {
      var grunn = 0; OBL.forEach(function (o) { if (S.obl[o[0]]) grunn += o[1]; });
      var timerSum = S.timer * P.time, leie = S.leiebil ? P.leiebil : 0, fp = S.forerprove ? P.forerprove : 0;
      return { grunn: grunn, timerSum: timerSum, leie: leie, fp: fp, total: grunn + timerSum + leie + fp };
    };
    var render = function () {
      var t = compute();
      // "Din pris så langt": tar bare med det du har valgt fram til nåværende steg
      var grunn = S.step >= 2 ? t.grunn : 0;
      var timerSum = S.step >= 3 ? t.timerSum : 0;
      var leie = S.step >= 4 ? t.leie : 0;
      var fp = S.step >= 4 ? t.fp : 0;
      var sofar = grunn + timerSum + leie + fp;
      if (ctotal) ctotal.textContent = kr(sofar);
      if (ctotal2) ctotal2.textContent = kr(t.total);
      if (timerVal) timerVal.textContent = S.timer;
      if (cbreak) {
        var l = '';
        if (grunn > 0) l += bline('Obligatorisk grunnpakke', grunn);
        if (S.step >= 3 && timerSum > 0) l += bline(S.timer + ' kjøretimer', timerSum);
        if (leie) l += bline('Leiebil', leie);
        if (fp) l += bline('Førerprøve', fp);
        cbreak.innerHTML = l;
      }
    };
    var show = function (n) {
      S.step = n;
      steps.forEach(function (s) { s.hidden = (+s.getAttribute('data-cstep') !== n); });
      if (cnum) cnum.textContent = n;
      if (cbar) cbar.style.width = (n / MAX * 100) + '%';
      if (cback) cback.hidden = n === 1;
      if (cnext) cnext.hidden = n === MAX;
      render();
    };
    if (cnext) cnext.addEventListener('click', function () { if (S.step < MAX) show(S.step + 1); });
    if (cback) cback.addEventListener('click', function () { if (S.step > 1) show(S.step - 1); });
    var creset = q('[data-creset]'); if (creset) creset.addEventListener('click', function () { show(1); });
    calc.querySelectorAll('[data-gear]').forEach(function (b) {
      b.addEventListener('click', function () {
        S.gear = b.getAttribute('data-gear');
        calc.querySelectorAll('[data-gear]').forEach(function (o) { var on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        S.timer = S.gear === 'automat' ? 8 : 10; render();
      });
    });
    OBL.forEach(function (o) { var el = q('#c-' + o[0]); if (el) el.addEventListener('change', function () { S.obl[o[0]] = el.checked; render(); }); });
    var mn = q('#c-minus'), pl = q('#c-plus');
    if (mn) mn.addEventListener('click', function () { S.timer = Math.max(MINT, S.timer - 1); render(); });
    if (pl) pl.addEventListener('click', function () { S.timer = Math.min(MAXT, S.timer + 1); render(); });
    var cl = q('#c-leiebil'); if (cl) cl.addEventListener('change', function () { S.leiebil = cl.checked; render(); });
    var cf = q('#c-forerprove'); if (cf) cf.addEventListener('change', function () { S.forerprove = cf.checked; render(); });
    show(1);
  }

  /* ---------- Teoriquiz ---------- */
  var quiz = document.querySelector('[data-quiz]');
  if (quiz) {
    var loadQuestions = function (cb) {
      var inline = document.getElementById('quiz-data');
      if (inline) { try { cb(JSON.parse(inline.textContent)); return; } catch (e) {} }
      if (window.fetch) {
        fetch('data/quiz.json').then(function (r) { return r.json(); })
          .then(function (d) { cb(d.questions || d); })
          .catch(function () { cb(null); });
      } else { cb(null); }
    };

    loadQuestions(function (questions) {
      if (!questions || !questions.length) { quiz.style.display = 'none'; return; }
      // bruk maks 6 spørsmål i widgeten
      questions = questions.slice(0, parseInt(quiz.getAttribute('data-limit') || '6', 10));
      var total = questions.length;
      var i = 0, score = 0, answered = false;
      var bar = quiz.querySelector('.quiz__bar i');
      var count = quiz.querySelector('.quiz__count');
      var qEl = quiz.querySelector('.quiz__q');
      var optsEl = quiz.querySelector('.quiz__opts');
      var fb = quiz.querySelector('.quiz__feedback');
      var actions = quiz.querySelector('.quiz__actions');
      var stage = quiz.querySelector('.quiz__stage');
      var result = quiz.querySelector('.quiz__result');

      var render = function () {
        answered = false;
        var q = questions[i];
        if (count) count.textContent = 'Spørsmål ' + (i + 1) + ' av ' + total;
        if (bar) bar.style.width = (i / total * 100) + '%';
        if (qEl) qEl.textContent = q.question;
        if (fb) { fb.classList.remove('show'); fb.innerHTML = ''; }
        if (actions) actions.innerHTML = '';
        optsEl.innerHTML = '';
        q.options.forEach(function (opt, idx) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'quiz__opt';
          b.innerHTML = '<span class="mark">' + String.fromCharCode(65 + idx) + '</span><span>' + opt + '</span>';
          b.addEventListener('click', function () { choose(idx, b); });
          optsEl.appendChild(b);
        });
      };

      var choose = function (idx, btn) {
        if (answered) return;
        answered = true;
        var q = questions[i];
        var buttons = optsEl.querySelectorAll('.quiz__opt');
        buttons.forEach(function (b, k) {
          b.disabled = true;
          if (k === q.answer) b.classList.add('is-correct');
        });
        if (idx === q.answer) { score++; }
        else { btn.classList.add('is-wrong'); }
        if (fb) {
          fb.innerHTML = '<b>' + (idx === q.answer ? 'Riktig! ' : 'Riktig svar: ' + String.fromCharCode(65 + q.answer) + '. ') + '</b>' + (q.explain || '');
          fb.classList.add('show');
        }
        if (bar) bar.style.width = ((i + 1) / total * 100) + '%';
        var next = document.createElement('button');
        next.type = 'button';
        next.className = 'btn btn--primary';
        var last = i === total - 1;
        next.innerHTML = (last ? 'Se resultat' : 'Neste spørsmål') + '<span class="btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
        next.addEventListener('click', function () { if (last) finish(); else { i++; render(); } });
        if (actions) actions.appendChild(next);
      };

      var finish = function () {
        if (stage) stage.hidden = true;
        if (bar) bar.style.width = '100%';
        if (count) count.textContent = 'Ferdig';
        var pct = Math.round(score / total * 100);
        var msg = pct >= 80 ? 'Sterkt! Du er godt på vei mot teoriprøven.' : pct >= 50 ? 'Bra start — litt mer øving, så sitter det.' : 'Helt normalt før du har øvd. Et teorikurs hos oss gjør susen.';
        if (result) {
          result.hidden = false;
          result.innerHTML = '<div class="quiz__score">' + score + ' / ' + total + '</div>' +
            '<p>' + msg + ' Vil du øve mer og ta teorien trygt? Vi kjører teorikurs i Molde.</p>' +
            '<div class="btn-row" style="justify-content:center">' +
            '<a class="btn btn--primary" href="teorikurs.html">Les om teorikurs<span class="btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></span></a>' +
            '<button type="button" class="btn btn--ghost" data-quiz-restart>Prøv igjen<span class="btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></span></button>' +
            '</div>';
          var rb = result.querySelector('[data-quiz-restart]');
          if (rb) rb.addEventListener('click', function () { i = 0; score = 0; result.hidden = true; if (stage) stage.hidden = false; render(); });
        }
      };

      render();
    });
  }

  /* ---------- TikTok: klikk for å spille av (lett facade → smooth scroll) ---------- */
  var ttScreen = document.querySelector('[data-tiktok]');
  if (ttScreen) {
    var poster = ttScreen.querySelector('.iphone__poster');
    if (poster) {
      poster.addEventListener('click', function () {
        var id = ttScreen.getAttribute('data-tiktok');
        var ifr = document.createElement('iframe');
        ifr.className = 'iphone__video';
        ifr.src = 'https://www.tiktok.com/player/v1/' + id + '?autoplay=1&rel=0&description=0&music_info=0&native_context_menu=0&closed_caption=0';
        ifr.title = 'Thor Trafikk på TikTok – @trafikkthor';
        ifr.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
        ifr.setAttribute('allowfullscreen', '');
        poster.replaceWith(ifr);
      });
    }
  }

  /* ---------- Pakke-karusell (dra/scroll med mus + jevn autoscroll) ---------- */
  document.querySelectorAll('[data-pkg-track]').forEach(function (track) {
    var wrap = track.closest('.pkg-carousel');
    if (!wrap) return;
    var cards = Array.prototype.slice.call(track.querySelectorAll('.pkg'));
    var loopOK = cards.length > 2;
    // Klon settet én gang for sømløs løkke – brukes av både autoscroll og dra
    if (loopOK) cards.forEach(function (c) { var cl = c.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); cl.tabIndex = -1; track.appendChild(cl); });

    var loopW = 0, measure = function () { loopW = track.scrollWidth / 2; };
    measure(); requestAnimationFrame(measure);
    window.addEventListener('resize', measure);

    var pos = 0, paused = false;
    var wrapNow = function () {
      if (!loopOK || loopW <= 0) return;
      if (track.scrollLeft >= loopW) track.scrollLeft -= loopW;
      else if (track.scrollLeft < 0) track.scrollLeft += loopW;
    };

    // hover pauser autoscroll
    wrap.addEventListener('mouseenter', function () { paused = true; });
    wrap.addEventListener('mouseleave', function () { pos = track.scrollLeft; paused = false; });

    // dra med mus / penn
    var dragging = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return; // touch bruker native sveiping (ikke blokker vertikal scroll)
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; paused = true; moved = false;
      startX = e.clientX; startScroll = track.scrollLeft;
      track.classList.add('is-grabbing');
      try { track.setPointerCapture(e.pointerId); } catch (_) {}
    });
    track.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
      wrapNow();
    });
    var endDrag = function (e) {
      if (!dragging) return;
      dragging = false; track.classList.remove('is-grabbing');
      try { track.releasePointerCapture(e.pointerId); } catch (_) {}
      pos = track.scrollLeft;
      setTimeout(function () { if (!wrap.matches(':hover')) paused = false; }, 500);
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    // hindre at et «dra» avslutter som et klikk på kortet
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

    // hjul / touch synkroniserer pos så autoscroll fortsetter pent
    track.addEventListener('scroll', function () { if (paused) { wrapNow(); pos = track.scrollLeft; } }, { passive: true });
    var wheelT;
    track.addEventListener('wheel', function () { paused = true; clearTimeout(wheelT); wheelT = setTimeout(function () { pos = track.scrollLeft; paused = false; }, 700); }, { passive: true });
    track.addEventListener('touchstart', function () { paused = true; }, { passive: true });
    track.addEventListener('touchend', function () { pos = track.scrollLeft; setTimeout(function () { paused = false; }, 800); });

    // jevn autoscroll (cachet bredde – ingen reflow per frame)
    if (!reduce && loopOK) {
      var SPEED = 0.6;
      var tick = function () {
        if (!paused) { pos += SPEED; if (loopW > 0 && pos >= loopW) pos -= loopW; track.scrollLeft = pos; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(function () { track.scrollLeft = 0; pos = 0; measure(); requestAnimationFrame(tick); });
    }
  });

  /* ---------- Pris-faner (kompakt pakkeoversikt) ---------- */
  var ptabs = document.querySelector('[data-pkg-tabs]');
  if (ptabs) {
    var pchips = Array.prototype.slice.call(ptabs.querySelectorAll('[data-tab]'));
    var ppanels = Array.prototype.slice.call(document.querySelectorAll('[data-pkg-panel]'));
    var activate = function (key, scroll) {
      var hit = false;
      pchips.forEach(function (c) { var on = c.getAttribute('data-tab') === key; c.classList.toggle('is-on', on); c.setAttribute('aria-selected', on ? 'true' : 'false'); if (on) hit = true; });
      ppanels.forEach(function (p) { p.hidden = p.getAttribute('data-pkg-panel') !== key; });
      if (hit && scroll) { var pk = document.getElementById('pakker'); if (pk) pk.scrollIntoView(); }
      return hit;
    };
    pchips.forEach(function (c) { c.addEventListener('click', function () { activate(c.getAttribute('data-tab'), false); }); });
    if (!activate((location.hash || '').replace('#', ''), true)) activate(pchips[0].getAttribute('data-tab'), false);
  }

  /* ---------- År i footer ---------- */
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
