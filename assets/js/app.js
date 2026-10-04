/*!
 * Mounjaro KwikPen Rechner – Oberfläche
 * https://github.com/monkeydriven/mounjaro_calc
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 monkeydriven – vollständiger Lizenztext: siehe LICENSE.
 */

/**
 * ============================================================================
 *  app.js – verbindet Rechenkern (calc.js), Texte (i18n.js) und HTML
 * ============================================================================
 *
 *  Architektur in einem Satz:
 *    Ein einziges State-Objekt  →  derive() berechnet daraus alles  →
 *    render() schreibt das Ergebnis ins DOM.
 *
 *  ┌────────────┐  setState()  ┌──────────┐  derive()  ┌──────────┐  render()
 *  │  Eingaben  │ ───────────▶ │  state   │ ─────────▶ │  Modell  │ ─────────▶ DOM
 *  └────────────┘              └──────────┘            └──────────┘
 *        ▲                          │ persist()
 *        └──── URL / localStorage ◀─┘
 *
 *  Vorteile gegenüber der ersten Version:
 *  • Keine Felder mehr, die sich gegenseitig überschreiben: Es gibt genau
 *    EINEN führenden Eingabewert (Klicks, Dosis ODER Wochen), alles andere
 *    ist abgeleitet. Das verhindert Rundungs-Pingpong und Widersprüche.
 *  • Der Zustand steckt in der URL → Ergebnisse lassen sich als Link teilen
 *    und überleben ein Neuladen. Zusätzlich lokal gespeichert.
 *  • Fehler werfen keine Ausnahme ins Leere, sondern werden als verständliche
 *    Meldung direkt am Feld angezeigt (und vorgelesen).
 */
(function () {
  'use strict';

  const Calc = window.MounjaroCalc;
  const I18N = window.MounjaroI18n;

  /* --------------------------------------------------------------------------
   *  Abbruch mit verständlicher Meldung, falls ein Skript fehlt
   * ------------------------------------------------------------------------ */
  function showFatal(error) {
    const box = document.getElementById('fatal-error');
    if (box) {
      box.textContent = (I18N && I18N.de && I18N.de.fatalError) ||
        'Der Rechner konnte nicht geladen werden. / The calculator could not be loaded.';
      box.hidden = false;
    }
    if (error) console.error(error);
  }

  if (!Calc || !I18N) {
    showFatal(new Error('calc.js oder i18n.js wurde nicht geladen.'));
    return;
  }

  /* --------------------------------------------------------------------------
   *  Konfiguration
   * ------------------------------------------------------------------------ */

  /** Schlüssel für localStorage – muss zu theme-init.js passen. */
  const STORAGE_KEY = 'mounjaro-calc:v2';
  const SUPPORTED_LANGS = ['de', 'en'];
  const MODES = ['clicks', 'dose', 'weeks'];
  const THEMES = ['light', 'dark'];

  /** Schnellauswahl: Bruchteile der vollen Dosis bzw. feste Wochenzahlen. */
  const DOSE_FRACTIONS = [
    { label: '¼', share: 0.25 },
    { label: '½', share: 0.5 },
    { label: '¾', share: 0.75 },
    { label: null, share: 1 } // null → übersetztes "Voll"
  ];
  const WEEK_PRESETS = [5, 6, 8, 10, 12];

  /** Der Wochen-Schieberegler endet hier; per Tastatur geht mehr. */
  const WEEKS_SLIDER_MAX = 60;

  /** Ab dieser Breite stehen Schritte und Ergebnis nebeneinander. */
  const DESKTOP_QUERY = '(min-width: 960px)';

  const MAX_CLICKS = Calc.CLICKS_PER_FULL_DOSE;

  /** Standardzustand – entspricht der ursprünglichen Version (60 Klicks). */
  const DEFAULTS = Object.freeze({
    penId: '2.5',
    mode: 'clicks',
    value: String(MAX_CLICKS),
    customPriceEnabled: false,
    customPrice: '',
    clicksPerPen: String(Calc.DEFAULT_CLICKS_PER_PEN),
    lang: 'de',
    theme: null // null = Systemeinstellung folgen
  });

  /* --------------------------------------------------------------------------
   *  DOM-Referenzen (einmalig gesammelt)
   * ------------------------------------------------------------------------ */
  const $ = (id) => document.getElementById(id);
  const els = {
    root: document.documentElement,
    header: document.querySelector('.app-header'),
    metaDescription: document.querySelector('meta[name="description"]'),
    langButtons: Array.from(document.querySelectorAll('.lang-btn')),
    themeToggle: $('theme-toggle'),
    navLinks: Array.from(document.querySelectorAll('.nav-link')),
    sections: ['rechner', 'tabelle', 'methodik'].map($),

    penGrid: $('pen-grid'),
    modeRadios: Array.from(document.querySelectorAll('input[name="mode"]')),
    primaryLabel: $('primary-label'),
    primaryDesc: $('primary-desc'),
    primaryInput: $('primary-input'),
    primaryUnit: $('primary-unit'),
    primaryDec: $('primary-dec'),
    primaryInc: $('primary-inc'),
    primaryRange: $('primary-range'),
    rangeMin: $('range-min'),
    rangeMax: $('range-max'),
    rangeHint: $('primary-range-hint'),
    presets: $('presets'),
    primaryMsg: $('primary-msg'),

    listPrice: $('list-price'),
    customPriceEnabled: $('custom-price-enabled'),
    customPriceField: $('custom-price-field'),
    customPrice: $('custom-price'),
    customPriceMsg: $('custom-price-msg'),
    advanced: $('advanced'),
    clicksPerPen: $('clicks-per-pen'),
    clicksPerPenHint: $('clicks-per-pen-hint'),
    clicksPerPenMsg: $('clicks-per-pen-msg'),

    resultCard: $('ergebnis'),
    resultEmpty: $('result-empty'),
    resultBody: $('result-body'),
    resDose: $('res-dose'),
    resSub: $('res-sub'),
    resRing: $('res-ring'),
    resRingFill: $('res-ring-fill'),
    resRingValue: $('res-ring-value'),
    resWeeks: $('res-weeks'),
    resPensYear: $('res-pens-year'),
    resWeekCost: $('res-week-cost'),
    resMonthCost: $('res-month-cost'),
    resMgCost: $('res-mg-cost'),
    penBarCanvas: $('pen-bar-canvas'),
    penBarEnd: $('pen-bar-end'),
    penBarLegendDose: $('pen-bar-legend-dose'),
    penBarLegendRestItem: $('pen-bar-legend-rest-item'),
    resRemainder: $('res-remainder'),
    resSummary: $('res-summary'),
    copyLink: $('copy-link'),
    reset: $('reset'),

    tableScroll: $('table-scroll'),
    tableHead: $('dose-table-head'),
    tableBody: $('dose-table-body'),

    miniResult: $('mini-result'),
    miniResultText: $('mini-result-text'),
    toast: $('toast')
  };

  /* --------------------------------------------------------------------------
   *  Kleine Helfer
   * ------------------------------------------------------------------------ */
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const t = () => I18N[state.lang];
  const hasIssue = (res, code) => res.issues.some((i) => i.code === code);
  const hasError = (issues) => issues.some((i) => i.level === 'error');

  /** Übersetzung holen – Strings direkt, Funktionen mit Argumenten. */
  function tr(key, ...args) {
    const value = t()[key];
    return typeof value === 'function' ? value(...args) : value;
  }

  /** SVG-Element mit Attributen erzeugen. */
  function svgEl(tag, attrs) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach((k) => node.setAttribute(k, attrs[k]));
    return node;
  }

  /** Icon aus dem Sprite im HTML (<symbol id="i-…">). */
  function icon(name) {
    const svg = svgEl('svg', { class: 'icon', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(svgEl('use', { href: '#i-' + name }));
    return svg;
  }

  /** HTML-Element erzeugen, Text immer über textContent (kein innerHTML → kein XSS). */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** Funktion erst nach einer Pause ausführen (z. B. Speichern beim Tippen). */
  function debounce(fn, ms) {
    let timer = 0;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  /* --------------------------------------------------------------------------
   *  Zahlenformatierung (Intl, sprachabhängig, mit Cache)
   * ------------------------------------------------------------------------ */
  const formatterCache = new Map();

  function nf(options) {
    const key = t().locale + JSON.stringify(options);
    if (!formatterCache.has(key)) formatterCache.set(key, new Intl.NumberFormat(t().locale, options));
    return formatterCache.get(key);
  }

  /** Dosis in mg: mindestens 2, höchstens 3 Nachkommastellen ("2,50", "0,042"). */
  const fmtMg = (v) => nf({ minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(v);
  /** Wirkstärke/Eingabe: nur nötige Nachkommastellen ("2,5", "10"). */
  const fmtNum = (v) => nf({ maximumFractionDigits: 3 }).format(v);
  /** Wert für Eingabefelder: ohne Tausenderpunkte, damit er wieder lesbar ist. */
  const fmtInput = (v) => nf({ maximumFractionDigits: 3, useGrouping: false }).format(v);
  const fmtPriceInput = (v) => nf({ minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }).format(v);
  const fmtInt = (v) => nf({ maximumFractionDigits: 0 }).format(v);
  const fmtDec1 = (v) => nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
  const fmtPct = (v) => nf({ style: 'percent', maximumFractionDigits: 0 }).format(v);
  const fmtEur = (v) => nf({ style: 'currency', currency: 'EUR' }).format(v);

  /* --------------------------------------------------------------------------
   *  Speicherung: localStorage (robust gekapselt) und URL
   * ------------------------------------------------------------------------ */
  const storage = {
    read() {
      try {
        return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      } catch {
        return null; // gesperrt, voll oder kaputtes JSON → einfach ignorieren
      }
    },
    write(data) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* Privater Modus o. Ä. – der Rechner funktioniert trotzdem. */
      }
    }
  };

  /**
   * Fremde Daten (URL, localStorage) nie ungeprüft übernehmen:
   * nur bekannte Schlüssel, nur erlaubte Werte, begrenzte Länge.
   */
  function sanitize(input) {
    const out = {};
    if (!input || typeof input !== 'object') return out;
    const shortString = (v) => typeof v === 'string' && v.length <= 24;

    if (Calc.getPen(input.penId)) out.penId = String(input.penId);
    if (MODES.includes(input.mode)) out.mode = input.mode;
    if (shortString(input.value)) out.value = input.value;
    if (typeof input.customPriceEnabled === 'boolean') out.customPriceEnabled = input.customPriceEnabled;
    if (shortString(input.customPrice)) out.customPrice = input.customPrice;
    if (shortString(input.clicksPerPen)) out.clicksPerPen = input.clicksPerPen;
    if (SUPPORTED_LANGS.includes(input.lang)) out.lang = input.lang;
    if (THEMES.includes(input.theme) || input.theme === null) out.theme = input.theme;
    return out;
  }

  /** URL-Parameter → Zustand. Beispiel: ?pen=10&mode=dose&v=2.5&price=350 */
  function readUrl() {
    const out = {};
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return out;
    }
    if (params.has('pen')) out.penId = params.get('pen');
    if (params.has('mode')) out.mode = params.get('mode');
    if (params.has('v')) out.value = params.get('v');
    if (params.has('price')) {
      out.customPriceEnabled = true;
      out.customPrice = params.get('price');
    }
    if (params.has('total')) out.clicksPerPen = params.get('total');
    if (params.has('lang')) out.lang = params.get('lang');
    return sanitize(out);
  }

  /** Zustand → URL-Parameter (nur, was vom Standard abweicht bzw. nötig ist). */
  function buildQuery() {
    const params = new URLSearchParams();
    params.set('pen', state.penId);
    params.set('mode', state.mode);
    params.set('v', state.value.trim());
    if (state.customPriceEnabled && state.customPrice.trim()) params.set('price', state.customPrice.trim());
    if (state.clicksPerPen.trim() !== DEFAULTS.clicksPerPen) params.set('total', state.clicksPerPen.trim());
    return params.toString();
  }

  /** Teilbarer Link auf den aktuellen Stand (ohne Sprungmarke). */
  function shareUrl() {
    return window.location.href.split(/[?#]/)[0] + '?' + buildQuery();
  }

  function writeUrl() {
    try {
      const url = '?' + buildQuery() + window.location.hash;
      window.history.replaceState(null, '', url);
    } catch {
      /* Manche Browser verbieten das unter file:// – unkritisch. */
    }
  }

  const persist = debounce(() => {
    storage.write(state);
    writeUrl();
  }, 200);

  /** Startzustand: Standard ← gespeicherte Werte ← URL (URL gewinnt). */
  function loadInitialState() {
    const saved = sanitize(storage.read());
    const fromUrl = readUrl();
    const initial = Object.assign({}, DEFAULTS, saved, fromUrl);

    // Ohne gespeicherte Wahl: Browsersprache verwenden.
    if (!saved.lang && !fromUrl.lang) {
      const preferred = (navigator.languages && navigator.languages[0]) || navigator.language || 'de';
      initial.lang = /^de\b/i.test(preferred) ? 'de' : 'en';
    }
    return initial;
  }

  let state = loadInitialState();

  /* --------------------------------------------------------------------------
   *  Ableiten: aus dem Zustand alle Ergebnisse berechnen (keine DOM-Zugriffe)
   * ------------------------------------------------------------------------ */
  function derive(s) {
    const pen = Calc.getPen(s.penId) || Calc.PENS[0];
    const cpp = Calc.resolveClicksPerPen(s.clicksPerPen);
    const clicksPerPen = cpp.value !== null ? cpp.value : Calc.DEFAULT_CLICKS_PER_PEN;
    const input = Calc.resolveInput(s.mode, s.value, pen, clicksPerPen);
    const price = s.customPriceEnabled
      ? Calc.resolvePrice(s.customPrice)
      : { value: pen.price, issues: [] };

    const result = input.clicks !== null
      ? Calc.compute({ pen, clicks: input.clicks, clicksPerPen, penPrice: price.value })
      : null;

    return { pen, clicksPerPen, cppIssues: cpp.issues, input, price, result };
  }

  /* --------------------------------------------------------------------------
   *  Zustand ändern – der einzige Weg, um etwas an der Anzeige zu ändern
   * ------------------------------------------------------------------------ */
  function setState(patch) {
    const prev = state;
    state = Object.assign({}, state, patch);

    if (prev.lang !== state.lang) onLanguageChange();
    if (prev.theme !== state.theme) applyTheme();

    render();
    persist();
  }

  /** Neuen führenden Eingabewert setzen (z. B. aus Regler, Chips, Stepper). */
  function setValue(value) {
    setState({ value: String(value) });
  }

  /* --------------------------------------------------------------------------
   *  Sprache
   * ------------------------------------------------------------------------ */

  /** Alle statischen Texte (data-i18n / data-i18n-attr) übersetzen. */
  function applyTranslations() {
    const texts = t();
    els.root.lang = state.lang;
    document.title = texts.metaTitle;
    if (els.metaDescription) els.metaDescription.setAttribute('content', texts.metaDescription);

    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const value = texts[node.dataset.i18n];
      if (typeof value === 'string') node.textContent = value;
    });

    // Format: data-i18n-attr="aria-label:schluessel;title:anderer"
    document.querySelectorAll('[data-i18n-attr]').forEach((node) => {
      node.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (attr && typeof texts[key] === 'string') node.setAttribute(attr, texts[key]);
      });
    });

    els.langButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === state.lang));
    });

    els.clicksPerPenHint.textContent = tr('clicksPerPenHint', fmtInt(Calc.DEFAULT_CLICKS_PER_PEN));
    updateThemeLabel();
  }

  /**
   * Beim Sprachwechsel Zahlen in Eingabefeldern ins neue Format bringen
   * ("2,5" ↔ "2.5") und sprachabhängige Bausteine neu aufbauen.
   */
  function onLanguageChange() {
    const v = Calc.parseNumber(state.value);
    if (state.mode === 'dose' && !isNaN(v)) state.value = fmtInput(v);
    const p = Calc.parseNumber(state.customPrice);
    if (!isNaN(p)) state.customPrice = fmtPriceInput(p);

    applyTranslations();
    buildPenGrid();
    buildTable();
  }

  /* --------------------------------------------------------------------------
   *  Farbschema
   * ------------------------------------------------------------------------ */
  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function isDark() {
    if (state.theme) return state.theme === 'dark';
    return Boolean(darkQuery && darkQuery.matches);
  }

  function applyTheme() {
    if (state.theme) els.root.setAttribute('data-theme', state.theme);
    else els.root.removeAttribute('data-theme');
    updateThemeLabel();
  }

  /** Beschriftung nennt, was ein Klick BEWIRKT (nicht den Ist-Zustand). */
  function updateThemeLabel() {
    const label = isDark() ? t().themeToLight : t().themeToDark;
    els.themeToggle.setAttribute('aria-label', label);
    els.themeToggle.title = label;
  }

  /* --------------------------------------------------------------------------
   *  Aufbau dynamischer Bausteine
   * ------------------------------------------------------------------------ */

  /** Schritt 1: Pen-Karten aus den Daten im Rechenkern erzeugen. */
  function buildPenGrid() {
    const frag = document.createDocumentFragment();

    Calc.PENS.forEach((pen, index) => {
      const option = el('label', 'pen-option');

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'pen';
      radio.value = pen.id;
      option.appendChild(radio);

      const card = el('span', 'pen-card');
      const strength = el('span', 'pen-strength', fmtNum(pen.mg) + ' ');
      strength.appendChild(el('small', '', 'mg'));
      card.appendChild(strength);
      card.appendChild(el('span', 'pen-price', fmtEur(pen.price)));
      card.appendChild(el('span', 'pen-per-click', tr('penPerClick', fmtMg(Calc.doseFromClicks(1, pen)))));

      // Stufenanzeige 1–6: rein visuelle Orientierung, für Screenreader verborgen
      const level = el('span', 'pen-level');
      level.setAttribute('aria-hidden', 'true');
      Calc.PENS.forEach((_, i) => level.appendChild(el('span', i <= index ? 'is-on' : '')));
      card.appendChild(level);

      option.appendChild(card);

      const check = el('span', 'pen-check');
      check.setAttribute('aria-hidden', 'true');
      check.appendChild(icon('check'));
      option.appendChild(check);

      frag.appendChild(option);
    });

    els.penGrid.replaceChildren(frag);
  }

  /**
   * Dosis-Tabelle: 60 Zeilen × 6 Pens. Wird nur bei Sprachwechsel neu
   * gebaut; das Hervorheben passiert günstig über CSS-Klassen.
   */
  const tableIndex = { rows: [], cellsByPen: {}, headByPen: {} };

  function buildTable() {
    const head = document.createDocumentFragment();
    const corner = el('th', '', tr('thClicks'));
    corner.scope = 'col';
    head.appendChild(corner);

    tableIndex.rows = [];
    tableIndex.cellsByPen = {};
    tableIndex.headByPen = {};

    Calc.PENS.forEach((pen) => {
      const th = el('th', '', tr('thPen', fmtNum(pen.mg)));
      th.scope = 'col';
      th.dataset.pen = pen.id;
      head.appendChild(th);
      tableIndex.headByPen[pen.id] = th;
      tableIndex.cellsByPen[pen.id] = [];
    });

    const body = document.createDocumentFragment();
    for (let clicks = 1; clicks <= MAX_CLICKS; clicks++) {
      const row = el('tr');
      row.dataset.clicks = String(clicks);
      if (clicks % 15 === 0) row.classList.add('is-mark'); // ¼, ½, ¾, voll

      const th = el('th', '', fmtInt(clicks));
      th.scope = 'row';
      row.appendChild(th);

      Calc.PENS.forEach((pen) => {
        const td = el('td', '', fmtMg(Calc.doseFromClicks(clicks, pen)));
        td.dataset.pen = pen.id;
        row.appendChild(td);
        tableIndex.cellsByPen[pen.id].push(td);
      });

      body.appendChild(row);
      tableIndex.rows.push(row);
    }

    els.tableHead.replaceChildren(head);
    els.tableBody.replaceChildren(body);
    highlighted = { penId: null, clicks: null };
  }

  /* --------------------------------------------------------------------------
   *  Rendern
   * ------------------------------------------------------------------------ */
  let lastModel = null;

  function render() {
    const m = derive(state);
    lastModel = m;
    renderPenSelection(m);
    renderDoseStep(m);
    renderPriceStep(m);
    renderResult(m);
    renderTableHighlight(m);
    updateScrollUi();
  }

  /** Schritt 1: gewählten Pen markieren. */
  function renderPenSelection(m) {
    els.penGrid.querySelectorAll('input[name="pen"]').forEach((radio) => {
      radio.checked = radio.value === m.pen.id;
    });
  }

  /** Meldungen (Fehler/Hinweise) als Liste mit Icon ausgeben. */
  function renderMessages(container, messages) {
    const frag = document.createDocumentFragment();
    messages.forEach((msg) => {
      const row = el('p', 'msg ' + (msg.level === 'error' ? 'msg-error' : 'msg-info'));
      row.appendChild(icon(msg.level === 'error' ? 'alert' : 'info'));
      row.appendChild(el('span', '', msg.text));
      frag.appendChild(row);
    });
    container.replaceChildren(frag);
  }

  /** Issue-Codes aus calc.js in lesbare Sätze übersetzen. */
  function issueText(issueObj) {
    const p = issueObj.params;
    const isDose = issueObj.code.indexOf('dose') === 0;
    const formatted = {};
    Object.keys(p).forEach((k) => {
      const v = p[k];
      formatted[k] = isDose && ['min', 'max', 'target', 'actual'].includes(k) ? fmtNum(v) : fmtInt(v);
    });
    return tr('issue_' + issueObj.code, formatted);
  }

  const toMessages = (issues) => issues.map((i) => ({ level: i.level, text: issueText(i) }));

  /** Schritt 2: Eingabeart, Feld, Stepper, Regler und Schnellauswahl. */
  function renderDoseStep(m) {
    const mode = state.mode;
    const { pen, input, clicksPerPen } = m;
    const minW = Calc.minWeeks(clicksPerPen);
    const maxW = Calc.maxWeeks(clicksPerPen);

    els.modeRadios.forEach((radio) => { radio.checked = radio.value === mode; });

    // Beschriftung je Eingabeart
    const cfg = {
      clicks: { label: 'inputLabelClicks', desc: 'modeDescClicks', unit: 'unitClicks', inputMode: 'numeric' },
      dose: { label: 'inputLabelDose', desc: 'modeDescDose', unit: 'unitMg', inputMode: 'decimal' },
      weeks: { label: 'inputLabelWeeks', desc: 'modeDescWeeks', unit: 'unitWeeks', inputMode: 'numeric' }
    }[mode];

    els.primaryLabel.textContent = tr(cfg.label);
    els.primaryDesc.textContent = tr(cfg.desc);
    els.primaryUnit.textContent = tr(cfg.unit);
    els.primaryInput.inputMode = cfg.inputMode;

    // Eingabefeld nur überschreiben, wenn sich der Wert wirklich geändert hat
    // (sonst springt beim Tippen der Cursor ans Ende).
    if (els.primaryInput.value !== state.value) els.primaryInput.value = state.value;

    const invalid = hasError(input.issues);
    els.primaryInput.setAttribute('aria-invalid', String(invalid));
    els.primaryInput.parentElement.classList.toggle('is-invalid', invalid);
    renderMessages(els.primaryMsg, toMessages(input.issues));

    // Stepper-Grenzen
    if (mode === 'weeks') {
      const w = input.value;
      els.primaryDec.disabled = w !== null && w <= minW;
      els.primaryInc.disabled = w !== null && w >= maxW;
    } else {
      const c = input.clicks;
      const roundedDown = mode === 'dose' && hasIssue(input, 'doseRoundedDown');
      els.primaryDec.disabled = c !== null && c <= 1 && !roundedDown;
      els.primaryInc.disabled = c !== null && c >= MAX_CLICKS;
    }

    // Schieberegler: bei Klicks/Dosis auf Klick-Raster (1–60), damit nur
    // tatsächlich erreichbare Dosen wählbar sind; bei Wochen in Wochen.
    const range = els.primaryRange;
    let min;
    let max;
    let val;
    let valueText;
    if (mode === 'weeks') {
      min = minW;
      max = Math.max(minW + 1, Math.min(maxW, WEEKS_SLIDER_MAX));
      val = clamp(input.value !== null ? input.value : minW, min, max);
      valueText = tr('sliderValueWeeks', fmtInt(val));
      els.rangeMin.textContent = fmtInt(min);
      els.rangeMax.textContent = fmtInt(max);
      els.rangeHint.textContent = tr('rangeHint', fmtInt(minW), fmtInt(maxW), tr('unitWeeks'));
    } else {
      min = 1;
      max = MAX_CLICKS;
      val = input.clicks !== null ? input.clicks : MAX_CLICKS;
      if (mode === 'dose') {
        valueText = tr('sliderValueDose', fmtMg(Calc.doseFromClicks(val, pen)), fmtInt(val));
        els.rangeMin.textContent = fmtMg(Calc.doseFromClicks(1, pen)) + '\u00a0mg';
        els.rangeMax.textContent = fmtNum(pen.mg) + '\u00a0mg';
        els.rangeHint.textContent = tr('rangeHint', fmtMg(Calc.doseFromClicks(1, pen)), fmtNum(pen.mg), 'mg');
      } else {
        valueText = fmtInt(val) + '\u00a0' + tr('unitClicks');
        els.rangeMin.textContent = '1';
        els.rangeMax.textContent = fmtInt(MAX_CLICKS);
        els.rangeHint.textContent = tr('rangeHint', '1', fmtInt(MAX_CLICKS), tr('unitClicks'));
      }
    }
    range.min = String(min);
    range.max = String(max);
    range.value = String(val);
    range.setAttribute('aria-valuetext', valueText);
    range.setAttribute('aria-label', tr('sliderLabel', tr(cfg.label)));
    range.style.setProperty('--fill', ((val - min) / (max - min)) * 100 + '%');

    renderPresets(m);
  }

  /** Schnellauswahl-Chips passend zur Eingabeart. */
  function renderPresets(m) {
    const { pen, input, clicksPerPen } = m;
    const frag = document.createDocumentFragment();
    const noError = !hasError(input.issues);

    const addChip = (label, sub, value, pressed) => {
      const btn = el('button', 'preset');
      btn.type = 'button';
      btn.dataset.value = value;
      btn.setAttribute('aria-pressed', String(pressed));
      btn.appendChild(el('span', '', label));
      if (sub) btn.appendChild(el('small', '', sub));
      frag.appendChild(btn);
    };

    if (state.mode === 'weeks') {
      WEEK_PRESETS
        .filter((w) => w >= Calc.minWeeks(clicksPerPen) && w <= Calc.maxWeeks(clicksPerPen))
        .forEach((w) => addChip(tr('presetWeeks', fmtInt(w)), null, String(w), noError && input.value === w));
    } else {
      DOSE_FRACTIONS.forEach((f) => {
        const clicks = Math.round(MAX_CLICKS * f.share);
        const label = f.label || tr('presetFull');
        const pressed = noError && input.clicks === clicks && !hasIssue(input, 'doseRoundedDown');
        if (state.mode === 'clicks') {
          addChip(label, fmtInt(clicks), String(clicks), pressed);
        } else {
          const dose = Calc.doseFromClicks(clicks, pen);
          addChip(label, fmtNum(dose) + '\u00a0mg', fmtInput(dose), pressed);
        }
      });
    }
    els.presets.replaceChildren(frag);
  }

  /** Schritt 3: Preis und erweiterte Annahmen. */
  function renderPriceStep(m) {
    els.listPrice.textContent = fmtEur(m.pen.price);
    els.listPrice.classList.toggle('is-overridden', state.customPriceEnabled && m.price.value !== null);

    els.customPriceEnabled.checked = state.customPriceEnabled;
    els.customPriceField.hidden = !state.customPriceEnabled;
    if (els.customPrice.value !== state.customPrice) els.customPrice.value = state.customPrice;

    const priceIssues = state.customPriceEnabled ? m.price.issues : [];
    const priceInvalid = hasError(priceIssues);
    els.customPrice.setAttribute('aria-invalid', String(priceInvalid));
    els.customPrice.parentElement.classList.toggle('is-invalid', priceInvalid);
    renderMessages(els.customPriceMsg, toMessages(priceIssues));

    if (els.clicksPerPen.value !== state.clicksPerPen) els.clicksPerPen.value = state.clicksPerPen;
    const cppInvalid = hasError(m.cppIssues);
    els.clicksPerPen.setAttribute('aria-invalid', String(cppInvalid));
    els.clicksPerPen.parentElement.classList.toggle('is-invalid', cppInvalid);
    renderMessages(els.clicksPerPenMsg, toMessages(m.cppIssues));
  }

  /** Ergebnis-Karte. */
  function renderResult(m) {
    const r = m.result;
    els.resultEmpty.hidden = Boolean(r);
    els.resultBody.hidden = !r;
    els.copyLink.disabled = !r;
    if (!r) return;

    // Kopfzahl
    els.resDose.textContent = fmtMg(r.doseMg);
    els.resSub.textContent = tr('resultSub', fmtInt(r.clicks), fmtNum(m.pen.mg));

    // Ring: Anteil an der vollen Dosis
    const circumference = 2 * Math.PI * 50;
    els.resRingFill.style.strokeDasharray = String(circumference);
    els.resRingFill.style.strokeDashoffset = String(circumference * (1 - r.shareOfFullDose));
    els.resRingValue.textContent = fmtPct(r.shareOfFullDose);
    els.resRing.setAttribute('aria-label', tr('ringAria', fmtInt(r.shareOfFullDose * 100), fmtInt(r.clicks)));

    // Kennzahlen (bei fehlendem Preis gedämpft "Kein gültiger Preis")
    els.resWeeks.textContent = tr('kpiWeeksValue', fmtInt(r.dosesPerPen));
    els.resPensYear.textContent = r.pensPerYear !== null ? tr('kpiPensYear', fmtDec1(r.pensPerYear)) : '';
    setMoney(els.resWeekCost, r.pricePerDose);
    setMoney(els.resMonthCost, r.pricePerMonth);
    setMoney(els.resMgCost, r.pricePerMg);

    // Pen-Balken + Legende
    renderPenBar(r);
    els.penBarEnd.textContent = tr('penBarScaleEnd', fmtInt(r.clicksPerPen));
    els.penBarLegendDose.textContent = tr('penBarLegendDose', fmtInt(r.clicks));
    els.penBarLegendRestItem.hidden = r.remainderClicks === 0;

    // Rest-Hinweis
    const exact = r.remainderClicks === 0;
    els.resRemainder.className = 'notice ' + (exact ? 'notice-success' : '');
    els.resRemainder.replaceChildren(
      icon(exact ? 'check' : 'info'),
      el('span', '', exact
        ? tr('remainderNone')
        : tr('remainderSome', fmtInt(r.dosesPerPen), fmtInt(r.remainderClicks), fmtMg(r.remainderMg)))
    );

    // Zusammenfassung in einem Satz
    els.resSummary.textContent = tr('summaryText', {
      penMg: fmtNum(m.pen.mg),
      clicks: fmtInt(r.clicks),
      dose: fmtMg(r.doseMg),
      doses: fmtInt(r.dosesPerPen),
      weekCost: r.pricePerDose !== null ? fmtEur(r.pricePerDose) : '',
      monthCost: r.pricePerMonth !== null ? fmtEur(r.pricePerMonth) : ''
    });

    // Mobile Kurzanzeige
    els.miniResultText.replaceChildren(
      el('strong', '', fmtMg(r.doseMg) + '\u00a0mg'),
      el('span', '', ' · ' + tr('miniWeeks', fmtInt(r.dosesPerPen)) +
        (r.pricePerDose !== null ? ' · ' + fmtEur(r.pricePerDose) + tr('miniPerWeek') : ''))
    );
  }

  function setMoney(node, value) {
    const ok = value !== null;
    node.textContent = ok ? fmtEur(value) : tr('noPrice');
    node.classList.toggle('is-muted', !ok);
  }

  /**
   * Pen-Balken als SVG: Gesamtinhalt in Klicks, je Woche ein Segment,
   * ein eventueller Rest schraffiert. Gezeichnet in echten Pixeln, damit
   * Abstände (2 px) und Rundungen bei jeder Breite sauber aussehen.
   */
  function renderPenBar(r) {
    const host = els.penBarCanvas;
    const width = Math.max(160, Math.round(host.clientWidth || 360));
    const height = 28;
    const pxPerClick = width / r.clicksPerPen;
    const segWidth = r.clicks * pxPerClick;
    const segmented = segWidth >= 3;      // schmaler → als durchgehende Fläche
    const gap = segWidth >= 8 ? 2 : 0;    // 2 px Luft zwischen Segmenten
    const usedWidth = r.dosesPerPen * segWidth;
    const restWidth = r.remainderClicks * pxPerClick;

    const svg = svgEl('svg', {
      viewBox: `0 0 ${width} ${height}`,
      width: String(width),
      height: String(height),
      role: 'img',
      'aria-label': tr('penBarAria', fmtInt(r.dosesPerPen), fmtInt(r.clicks), fmtInt(r.remainderClicks))
    });

    // Schraffur für den Rest (45°-Linien) + abgerundete Außenkanten
    const defs = svgEl('defs');
    const pattern = svgEl('pattern', {
      id: 'rest-hatch', width: '6', height: '6',
      patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)'
    });
    pattern.appendChild(svgEl('rect', { class: 'pen-rest-bg', width: '6', height: '6' }));
    pattern.appendChild(svgEl('line', { class: 'pen-rest-line', x1: '0', y1: '0', x2: '0', y2: '6' }));
    defs.appendChild(pattern);
    const clip = svgEl('clipPath', { id: 'pen-bar-clip' });
    clip.appendChild(svgEl('rect', { width: String(width), height: String(height), rx: '6' }));
    defs.appendChild(clip);
    svg.appendChild(defs);

    const group = svgEl('g', { 'clip-path': 'url(#pen-bar-clip)' });

    if (segmented) {
      for (let i = 0; i < r.dosesPerPen; i++) {
        const isLast = i === r.dosesPerPen - 1 && r.remainderClicks === 0;
        const rect = svgEl('rect', {
          class: 'pen-seg' + (i % 2 ? ' is-alt' : ''),
          x: String(i * segWidth),
          y: '0',
          width: String(Math.max(1, segWidth - (isLast ? 0 : gap))),
          height: String(height),
          rx: gap ? '3' : '0'
        });
        const title = svgEl('title');
        title.textContent = tr('penBarSegment', fmtInt(i + 1), fmtInt(i * r.clicks + 1), fmtInt((i + 1) * r.clicks));
        rect.appendChild(title);
        group.appendChild(rect);
      }
    } else {
      const rect = svgEl('rect', { class: 'pen-seg', x: '0', y: '0', width: String(usedWidth), height: String(height) });
      const title = svgEl('title');
      title.textContent = tr('penBarAria', fmtInt(r.dosesPerPen), fmtInt(r.clicks), fmtInt(r.remainderClicks));
      rect.appendChild(title);
      group.appendChild(rect);
    }

    if (r.remainderClicks > 0) {
      const rest = svgEl('rect', {
        class: 'pen-rest', x: String(usedWidth), y: '0',
        width: String(restWidth), height: String(height), fill: 'url(#rest-hatch)'
      });
      const title = svgEl('title');
      title.textContent = tr('penBarRestTip', fmtInt(r.remainderClicks));
      rest.appendChild(title);
      group.appendChild(rest);
    }

    svg.appendChild(group);
    host.replaceChildren(svg);
  }

  /* --------------------------------------------------------------------------
   *  Dosis-Tabelle: Hervorhebung
   * ------------------------------------------------------------------------ */
  let highlighted = { penId: null, clicks: null };

  function renderTableHighlight(m) {
    const penId = m.pen.id;
    const clicks = m.result ? m.result.clicks : null;
    if (highlighted.penId === penId && highlighted.clicks === clicks) return;

    // Alte Markierung entfernen …
    if (highlighted.penId) {
      tableIndex.headByPen[highlighted.penId].classList.remove('is-col');
      tableIndex.cellsByPen[highlighted.penId].forEach((td) => td.classList.remove('is-col', 'is-current'));
    }
    if (highlighted.clicks) tableIndex.rows[highlighted.clicks - 1].classList.remove('is-row');

    // … und neue setzen
    tableIndex.headByPen[penId].classList.add('is-col');
    tableIndex.cellsByPen[penId].forEach((td) => td.classList.add('is-col'));
    if (clicks) {
      const row = tableIndex.rows[clicks - 1];
      row.classList.add('is-row');
      tableIndex.cellsByPen[penId][clicks - 1].classList.add('is-current');
      keepRowVisible(row);
    }
    highlighted = { penId, clicks };
  }

  /** Aktuelle Zeile im Scroll-Container sichtbar halten – ohne die Seite zu scrollen. */
  function keepRowVisible(row) {
    const box = els.tableScroll;
    const boxRect = box.getBoundingClientRect();
    if (!boxRect.height) return; // (noch) nicht sichtbar
    const headHeight = els.tableHead.getBoundingClientRect().height;
    const rowRect = row.getBoundingClientRect();
    const above = rowRect.top < boxRect.top + headHeight;
    const below = rowRect.bottom > boxRect.bottom;
    if (above || below) {
      box.scrollTop += rowRect.top - boxRect.top - headHeight - (boxRect.height - headHeight - rowRect.height) / 2;
    }
  }

  /* --------------------------------------------------------------------------
   *  Navigation: aktiver Abschnitt, Kopfhöhe, mobile Kurzanzeige
   * ------------------------------------------------------------------------ */
  const desktopQuery = window.matchMedia ? window.matchMedia(DESKTOP_QUERY) : { matches: true };
  let scrollFrame = 0;

  function onScroll() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      updateScrollUi();
    });
  }

  function updateScrollUi() {
    updateActiveNav();
    updateMiniResult();
  }

  /** Markiert in der Navigation den Abschnitt, der gerade gelesen wird. */
  function updateActiveNav() {
    const headerHeight = els.header.offsetHeight;
    const probe = headerHeight + window.innerHeight * 0.3;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

    let activeId = els.sections[0].id;
    els.sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= probe) activeId = section.id;
    });
    if (atBottom) activeId = els.sections[els.sections.length - 1].id;

    els.navLinks.forEach((link) => {
      if (link.dataset.nav === activeId) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  /**
   * Mobil: Liegt das Ergebnis noch unterhalb des sichtbaren Bereichs
   * (man arbeitet also gerade an den Schritten), erscheint unten eine
   * Kurzanzeige mit Sprung zum Ergebnis.
   */
  function updateMiniResult() {
    const card = els.resultCard.getBoundingClientRect();
    const show = !desktopQuery.matches && Boolean(lastModel && lastModel.result) &&
      card.top > window.innerHeight - 48;

    if (els.miniResult.hidden === !show) return;
    els.miniResult.hidden = !show;
    els.root.style.setProperty('--mini-h', show ? els.miniResult.offsetHeight + 'px' : '0px');
  }

  /** Echte Kopfhöhe an CSS weitergeben (für Sprungziele & mitlaufendes Ergebnis). */
  function syncHeaderHeight() {
    els.root.style.setProperty('--header-h', els.header.offsetHeight + 'px');
  }

  /* --------------------------------------------------------------------------
   *  Rückmeldungen (Toast)
   * ------------------------------------------------------------------------ */
  let toastTimer = 0;

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('is-visible'), 2800);
  }

  /* --------------------------------------------------------------------------
   *  Aktionen
   * ------------------------------------------------------------------------ */

  /** Eingabeart wechseln und den aktuellen Wert sinnvoll übertragen. */
  function switchMode(mode) {
    if (mode === state.mode) return;
    const r = lastModel && lastModel.result;
    let value;
    if (!r) value = mode === 'weeks' ? String(Calc.minWeeks(lastModel.clicksPerPen)) : DEFAULTS.value;
    else if (mode === 'clicks') value = String(r.clicks);
    else if (mode === 'dose') value = fmtInput(r.doseMg);
    else value = String(r.dosesPerPen);
    setState({ mode, value });
  }

  /** Stepper / Pfeiltasten: einen Schritt nach oben oder unten. */
  function step(direction) {
    const m = lastModel;
    if (state.mode === 'weeks') {
      const minW = Calc.minWeeks(m.clicksPerPen);
      const current = m.input.value !== null ? m.input.value : minW;
      setValue(clamp(current + direction, minW, Calc.maxWeeks(m.clicksPerPen)));
      return;
    }
    const current = m.input.clicks !== null ? m.input.clicks : 1;
    // War die Wunschdosis abgerundet, landet "−" zuerst auf dem abgerundeten Wert.
    const snapsDown = direction < 0 && hasIssue(m.input, 'doseRoundedDown');
    const next = clamp(snapsDown ? current : current + direction, 1, MAX_CLICKS);
    setValue(state.mode === 'clicks' ? next : fmtInput(Calc.doseFromClicks(next, m.pen)));
  }

  function onRangeInput() {
    const v = Number(els.primaryRange.value);
    if (state.mode === 'clicks' || state.mode === 'weeks') setValue(v);
    else setValue(fmtInput(Calc.doseFromClicks(v, lastModel.pen)));
  }

  function toggleCustomPrice(enabled) {
    const patch = { customPriceEnabled: enabled };
    // Beim Einschalten mit dem Richtpreis vorbelegen – statt mit einem leeren,
    // sofort "fehlerhaften" Feld zu starten.
    if (enabled && !state.customPrice.trim()) patch.customPrice = fmtPriceInput(lastModel.pen.price);
    setState(patch);
    if (enabled) els.customPrice.focus();
  }

  async function copyLink() {
    const url = shareUrl();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback für ältere Browser bzw. file://
        const area = el('textarea');
        area.value = url;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        if (!ok) throw new Error('execCommand fehlgeschlagen');
      }
      toast(tr('copyLinkDone'));
    } catch {
      toast(tr('copyLinkFailed'));
    }
  }

  function resetAll() {
    // Sprache und Farbschema bleiben – das sind Vorlieben, keine Eingaben.
    setState(Object.assign({}, DEFAULTS, { lang: state.lang, theme: state.theme }));
    els.advanced.open = false;
    toast(tr('resetDone'));
  }

  /** Klick in die Tabelle übernimmt Pen + Klickzahl in den Rechner. */
  function onTableClick(event) {
    const cell = event.target.closest('td[data-pen]');
    if (!cell) return;
    const clicks = Number(cell.parentElement.dataset.clicks);
    const pen = Calc.getPen(cell.dataset.pen);
    setState({ penId: pen.id, mode: 'clicks', value: String(clicks) });
    toast(tr('tableApplied', fmtNum(pen.mg), fmtInt(clicks)));
  }

  /* --------------------------------------------------------------------------
   *  Ereignisse verdrahten
   * ------------------------------------------------------------------------ */
  function bindEvents() {
    els.langButtons.forEach((btn) => {
      btn.addEventListener('click', () => setState({ lang: btn.dataset.lang }));
    });

    els.themeToggle.addEventListener('click', () => setState({ theme: isDark() ? 'light' : 'dark' }));
    if (darkQuery) {
      const onSchemeChange = () => updateThemeLabel();
      if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSchemeChange);
      else if (darkQuery.addListener) darkQuery.addListener(onSchemeChange); // ältere Safari
    }

    // Schritt 1
    els.penGrid.addEventListener('change', (e) => {
      if (e.target.name === 'pen') setState({ penId: e.target.value });
    });

    // Schritt 2
    els.modeRadios.forEach((radio) => {
      radio.addEventListener('change', () => { if (radio.checked) switchMode(radio.value); });
    });
    els.primaryInput.addEventListener('input', () => setState({ value: els.primaryInput.value }));
    els.primaryInput.addEventListener('keydown', (e) => {
      // Pfeiltasten wie bei einem Zahlenfeld
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        step(e.key === 'ArrowUp' ? 1 : -1);
      }
    });
    els.primaryDec.addEventListener('click', () => step(-1));
    els.primaryInc.addEventListener('click', () => step(1));
    els.primaryRange.addEventListener('input', onRangeInput);
    els.presets.addEventListener('click', (e) => {
      const chip = e.target.closest('.preset');
      if (chip) setValue(chip.dataset.value);
    });

    // Schritt 3
    els.customPriceEnabled.addEventListener('change', () => toggleCustomPrice(els.customPriceEnabled.checked));
    els.customPrice.addEventListener('input', () => setState({ customPrice: els.customPrice.value }));
    els.clicksPerPen.addEventListener('input', () => setState({ clicksPerPen: els.clicksPerPen.value }));

    // Ergebnis
    els.copyLink.addEventListener('click', copyLink);
    els.reset.addEventListener('click', resetAll);

    // Tabelle
    els.tableBody.addEventListener('click', onTableClick);

    // Scrollen & Größe
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', updateScrollUi);

    if ('ResizeObserver' in window) {
      new ResizeObserver(syncHeaderHeight).observe(els.header);
      // Pen-Balken bei Breitenänderung neu zeichnen (in Pixeln gerechnet)
      let lastWidth = 0;
      new ResizeObserver((entries) => {
        const w = Math.round(entries[0].contentRect.width);
        if (w !== lastWidth && lastModel && lastModel.result) {
          lastWidth = w;
          renderPenBar(lastModel.result);
        }
      }).observe(els.penBarCanvas);
    } else {
      window.addEventListener('resize', syncHeaderHeight);
    }
  }

  /* --------------------------------------------------------------------------
   *  Start
   * ------------------------------------------------------------------------ */
  function init() {
    applyTheme();
    applyTranslations();
    buildPenGrid();
    buildTable();
    bindEvents();
    syncHeaderHeight();

    // Abweichende Annahmen nicht verstecken
    if (state.clicksPerPen !== DEFAULTS.clicksPerPen) els.advanced.open = true;

    // Zahlen aus geteilten Links ins Format der Sprache bringen ("2.5" → "2,5")
    const v = Calc.parseNumber(state.value);
    if (state.mode === 'dose' && !isNaN(v)) state.value = fmtInput(v);
    const price = Calc.parseNumber(state.customPrice);
    if (!isNaN(price)) state.customPrice = fmtPriceInput(price);

    render();
    persist();
  }

  try {
    init();
  } catch (error) {
    showFatal(error);
  }
})();
