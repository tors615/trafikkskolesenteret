/* Kommende kurs – henter kurs fra data/kurs.json og rendrer liste(r).
   Datakilde: TABS kursoversikt for Trafikkskolesenteret (skole-id 1535).
   Live-API (api.tabs.no/api/v2/courses?format=json&officeId=...) krever Referer-
   header og tillater ikke CORS fra annet domene – derfor bakes data i kurs.json
   og oppdateres manuelt, eller hentes via egen proxy når siden hostes. */
(function () {
  'use strict';
  var hosts = document.querySelectorAll('[data-kurs-list]');
  if (!hosts.length) return;

  var MND = ['JAN', 'FEB', 'MAR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DES'];
  var DAG = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'];
  var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var kr = function (n) { return Number(n).toLocaleString('nb-NO') + ' kr'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var parse = function (s) { var m = String(s).match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/); return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null; };

  // Primær: data lastet som <script src="data/kurs.js"> (window.JD_KURS) – virker på file:// og alle hoster.
  // Reserve: fetch av data/kurs.json (krever http-server).
  if (window.JD_KURS) {
    init(window.JD_KURS);
  } else {
    fetch('data/kurs.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(init)
      .catch(function () {
        hosts.forEach(function (h) { h.innerHTML = '<p class="ko-empty">Kursoversikten er midlertidig utilgjengelig. <a href="kontakt.html">Ta kontakt</a>, så hjelper vi deg.</p>'; });
      });
  }

  function init(data) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var kurs = (data.kurs || []).map(function (k) {
      return { k: k, start: parse(k.start), slutt: parse(k.slutt), avd: data.avdelinger[k.avdeling] };
    }).filter(function (x) { return x.start && x.avd && x.start >= today; })
      .sort(function (a, b) { return a.start - b.start; });

    hosts.forEach(function (host) {
      var mode = host.getAttribute('data-kurs-list');
      var limit = parseInt(host.getAttribute('data-limit') || '0', 10);
      if (mode === 'full') renderFull(host, kurs);
      else renderList(host, limit ? kurs.slice(0, limit) : kurs);
    });
  }

  function spots(p) {
    if (p === '3+' || (typeof p === 'number' && p > 3)) return 'Ledige plasser';
    if (typeof p === 'number' && p > 0) return p + (p === 1 ? ' plass igjen' : ' plasser igjen');
    return 'Fullt';
  }

  function card(x) {
    var d = x.start, k = x.k;
    var hasTime = (d.getHours() || d.getMinutes());
    var tid = DAG[d.getDay()] + ' ' + p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2) +
      (hasTime ? ' kl. ' + p2(d.getHours()) + '.' + p2(d.getMinutes()) +
        (x.slutt ? '–' + p2(x.slutt.getHours()) + '.' + p2(x.slutt.getMinutes()) : '') : '');
    var full = (k.plasser === 0);
    return '<article class="ko-card' + (full ? ' is-full' : '') + '">' +
      '<div class="ko-date"><b>' + d.getDate() + '</b><span>' + MND[d.getMonth()] + '</span></div>' +
      '<div class="ko-body">' +
        '<div class="ko-top"><span class="ko-tag">' + esc(k.klasse) + '</span><h3>' + esc(k.navn) + '</h3></div>' +
        '<p class="ko-meta">' + tid + ' · ' + esc(x.avd.navn) + '</p>' +
        '<p class="ko-meta ko-loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>' + esc(x.avd.sted) + '</p>' +
        '<div class="ko-foot"><span class="ko-price">' + kr(k.pris) + '</span><span class="ko-left">' + spots(k.plasser) + '</span>' +
          '<a class="btn btn--primary btn--sm" href="kontakt.html">Meld deg på' +
          '<span class="btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></span></a>' +
        '</div>' +
      '</div></article>';
  }

  function renderList(host, items) {
    host.innerHTML = items.length
      ? items.map(card).join('')
      : '<p class="ko-empty">Ingen kurs er lagt ut akkurat nå. <a href="kontakt.html">Ta kontakt</a>, så hjelper vi deg.</p>';
  }

  function renderFull(host, kurs) {
    // Utled avdelinger dynamisk fra kursene. Ved kun én avdeling dropper vi filterbaren.
    var seen = {}, avd = [];
    kurs.forEach(function (x) { var k = x.k.avdeling; if (!seen[k]) { seen[k] = 1; avd.push([k, x.avd.navn]); } });
    if (avd.length <= 1) { renderList(host, kurs); return; }
    var filters = [['alle', 'Alle']].concat(avd);
    var bar = '<div class="ko-filters" role="tablist" aria-label="Filtrer kurs">' + filters.map(function (f, i) {
      return '<button type="button" class="ko-chip' + (i === 0 ? ' is-on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>';
    }).join('') + '</div>';
    host.innerHTML = bar + '<div class="ko-grid" data-ko-grid></div>';
    var gridEl = host.querySelector('[data-ko-grid]');
    var draw = function (f) {
      renderList(gridEl, f === 'alle' ? kurs : kurs.filter(function (x) { return x.k.avdeling === f; }));
    };
    host.querySelectorAll('.ko-chip').forEach(function (b) {
      b.addEventListener('click', function () {
        host.querySelectorAll('.ko-chip').forEach(function (o) { o.classList.toggle('is-on', o === b); });
        draw(b.getAttribute('data-f'));
      });
    });
    draw('alle');
  }
})();
