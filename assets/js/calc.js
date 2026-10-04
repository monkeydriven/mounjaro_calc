/*!
 * Mounjaro KwikPen Rechner – Rechenkern
 * https://github.com/monkeydriven/mounjaro_calc
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 monkeydriven – vollständiger Lizenztext: siehe LICENSE.
 */

/**
 * ============================================================================
 *  calc.js – reine Rechenlogik, komplett ohne DOM-Zugriff
 * ============================================================================
 *
 *  Warum ein eigenes Modul?
 *  ------------------------
 *  In der ersten Version waren Rechnen und Anzeigen eng verwoben (z. B. hat
 *  die Funktion "Klicks → Dosis" nebenbei Fehlermeldungen ein- und
 *  ausgeblendet). Das machte den Code schwer testbar und fehleranfällig.
 *
 *  Hier liegen jetzt ausschließlich "reine" Funktionen: gleiche Eingabe →
 *  gleiche Ausgabe, keine Seiteneffekte. Die Oberfläche (app.js) fragt nur
 *  noch Ergebnisse ab und entscheidet selbst, wie sie diese darstellt.
 *  Dadurch lässt sich jede Rechenregel mit `npm test` (Node.js) prüfen.
 *
 *  Fachliches Modell (Annahmen dieses Rechners)
 *  --------------------------------------------
 *  • 60 Klicks am Dosierknopf entsprechen der vollen Wirkstärke des Pens
 *    (z. B. 10 mg beim 10-mg-Pen).
 *  • Ein Pen enthält insgesamt 300 Klicks (anpassbar).
 *  • Eine Anwendung pro Woche – "Dosen pro Pen" = "Wochen pro Pen".
 *  • Zwischenwerte werden per linearer Interpolation zwischen festen
 *    Referenzpunkten (Lookup-Tabelle) berechnet.
 *
 *  Einbindung
 *  ----------
 *  UMD-Muster: Im Browser steht das Modul als `window.MounjaroCalc` bereit,
 *  in Node.js per `require('./calc.js')`. Bewusst KEIN ES-Modul, damit die
 *  Seite auch per Doppelklick (file://) ohne lokalen Server funktioniert.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;          // Node.js / Tests
  } else {
    root.MounjaroCalc = api;       // Browser (klassisches <script>)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* --------------------------------------------------------------------------
   *  Konstanten
   * ------------------------------------------------------------------------ */

  /** Klicks, die der vollen Wirkstärke eines Pens entsprechen. */
  var CLICKS_PER_FULL_DOSE = 60;

  /** Angenommener Gesamtinhalt eines Pens in Klicks (Standardwert). */
  var DEFAULT_CLICKS_PER_PEN = 300;

  /** Erlaubter Bereich für den anpassbaren Gesamtinhalt. */
  var CLICKS_PER_PEN_MIN = CLICKS_PER_FULL_DOSE; // mind. eine volle Dosis
  var CLICKS_PER_PEN_MAX = 600;

  /** Obergrenze für eigene Preise – schützt vor Tippfehlern wie 38303. */
  var PRICE_MAX = 10000;

  /** Durchschnittliche Wochen pro Jahr bzw. Monat (inkl. Schaltjahre). */
  var WEEKS_PER_YEAR = 365.25 / 7;          // ≈ 52,18
  var WEEKS_PER_MONTH = WEEKS_PER_YEAR / 12; // ≈ 4,35

  /**
   * Kleine Toleranz gegen Gleitkomma-Artefakte.
   * Beispiel: 2.5 / 10 * 60 ergibt in JavaScript 14.999999999999998 –
   * ohne Toleranz würde Math.floor daraus fälschlich 14 statt 15 machen.
   */
  var EPSILON = 1e-9;

  /* --------------------------------------------------------------------------
   *  Pen-Daten
   * ------------------------------------------------------------------------ */

  /**
   * Erzeugt die Lookup-Tabelle (Referenzpunkte) für eine Wirkstärke.
   *
   * Wie in der ursprünglichen Version: 0, 30 und 60 Klicks. Wer genauere
   * Messwerte hat, kann hier weitere Stützstellen ergänzen – die
   * Interpolation unten funktioniert mit beliebig vielen Punkten, solange
   * beide Achsen streng monoton steigen.
   *
   * @param {number} mg  Wirkstärke des Pens (volle Dosis) in mg
   * @returns {{clicks: number[], doses: number[]}}
   */
  function buildLookupTable(mg) {
    return Object.freeze({
      clicks: Object.freeze([0, CLICKS_PER_FULL_DOSE / 2, CLICKS_PER_FULL_DOSE]),
      doses: Object.freeze([0, mg / 2, mg])
    });
  }

  /** Hilfsfunktion: unveränderliches Pen-Objekt anlegen. */
  function definePen(id, mg, price) {
    return Object.freeze({ id: id, mg: mg, price: price, lookup: buildLookupTable(mg) });
  }

  /**
   * Alle verfügbaren Pens mit Richtpreisen in EUR (Stand der ursprünglichen
   * Version, ohne Gewähr). Die ID ist ein String, weil sie auch in der URL
   * und im localStorage verwendet wird.
   */
  var PENS = Object.freeze([
    definePen('2.5', 2.5, 206.02),
    definePen('5', 5, 276.83),
    definePen('7.5', 7.5, 383.03),
    definePen('10', 10, 383.03),
    definePen('12.5', 12.5, 489.23),
    definePen('15', 15, 489.23)
  ]);

  /**
   * Pen anhand seiner ID suchen.
   * @param {string|number} id
   * @returns {object|null}
   */
  function getPen(id) {
    var key = String(id);
    for (var i = 0; i < PENS.length; i++) {
      if (PENS[i].id === key) return PENS[i];
    }
    return null;
  }

  /* --------------------------------------------------------------------------
   *  Mathematische Grundfunktionen
   * ------------------------------------------------------------------------ */

  /**
   * Stückweise lineare Interpolation.
   *
   * Formel je Intervall:  y = y1 + (x − x1) · (y2 − y1) / (x2 − x1)
   *
   * Werte außerhalb der Tabelle werden auf den ersten bzw. letzten Punkt
   * begrenzt (statt – wie früher – stillschweigend 0 zurückzugeben).
   * Die Prüfung, ob ein Wert überhaupt erlaubt ist, übernimmt resolveInput().
   *
   * @param {number}   x   gesuchte Stelle
   * @param {number[]} xs  Stützstellen (streng monoton steigend)
   * @param {number[]} ys  zugehörige Werte
   * @returns {number}
   */
  function interpolate(x, xs, ys) {
    if (!isFiniteNumber(x)) return NaN;
    var last = xs.length - 1;
    if (x <= xs[0]) return ys[0];
    if (x >= xs[last]) return ys[last];

    for (var i = 0; i < last; i++) {
      if (x <= xs[i + 1]) {
        var x1 = xs[i];
        var x2 = xs[i + 1];
        return ys[i] + (x - x1) * (ys[i + 1] - ys[i]) / (x2 - x1);
      }
    }
    return ys[last]; // nicht erreichbar, aber defensiv
  }

  /** Klicks → Dosis in mg. */
  function doseFromClicks(clicks, pen) {
    return interpolate(clicks, pen.lookup.clicks, pen.lookup.doses);
  }

  /**
   * Dosis in mg → Klicks (ganzzahlig).
   *
   * Es wird bewusst ABGERUNDET: Die berechnete Klickzahl liefert nie mehr
   * Wirkstoff als die gewünschte Dosis. Bei einem Medikament ist das die
   * vorsichtigere Wahl.
   */
  function clicksFromDose(dose, pen) {
    var exact = interpolate(dose, pen.lookup.doses, pen.lookup.clicks);
    return Math.floor(exact + EPSILON);
  }

  /** Wie viele VOLLE Dosen (= Wochen) liefert ein Pen bei dieser Klickzahl? */
  function dosesPerPen(clicks, clicksPerPen) {
    if (!(clicks > 0)) return 0;
    return Math.floor(clicksPerPen / clicks + EPSILON);
  }

  /**
   * Wochen → Klicks.
   *
   * Gesucht ist die GRÖSSTE Klickzahl, mit der der Pen noch mindestens die
   * gewünschte Anzahl Wochen reicht: floor(Gesamtklicks / Wochen), jedoch
   * höchstens 60 Klicks (mehr lässt der Pen pro Anwendung nicht zu).
   *
   * Hinweis: Nicht jede Wochenzahl geht exakt auf. 19 Wochen ergeben z. B.
   * 15 Klicks – und 15 Klicks reichen sogar für 20 Wochen. Die Oberfläche
   * weist darauf hin (Issue "weeksExceeded").
   */
  function clicksForWeeks(weeks, clicksPerPen) {
    if (!(weeks > 0)) return 0;
    return Math.min(CLICKS_PER_FULL_DOSE, Math.floor(clicksPerPen / weeks + EPSILON));
  }

  /** Kleinste sinnvolle Wochenzahl = Dosen pro Pen bei 60 Klicks. */
  function minWeeks(clicksPerPen) {
    return Math.max(1, dosesPerPen(CLICKS_PER_FULL_DOSE, clicksPerPen));
  }

  /** Größte Wochenzahl = 1 Klick pro Woche. */
  function maxWeeks(clicksPerPen) {
    return clicksPerPen;
  }

  /* --------------------------------------------------------------------------
   *  Eingaben einlesen & prüfen
   * ------------------------------------------------------------------------ */

  function isFiniteNumber(n) {
    return typeof n === 'number' && isFinite(n);
  }

  /**
   * Zahl aus Benutzereingabe lesen – akzeptiert Komma UND Punkt als
   * Dezimaltrenner ("2,5" und "2.5"), damit deutsche Nutzer nicht an der
   * Browser-Lokalisierung von <input type="number"> scheitern.
   *
   * Tausendertrennzeichen werden absichtlich NICHT unterstützt; "1.234,5"
   * ist mehrdeutig und wird als ungültig gemeldet.
   *
   * @param {string|number} raw
   * @returns {number} Zahl oder NaN
   */
  function parseNumber(raw) {
    if (typeof raw === 'number') return isFiniteNumber(raw) ? raw : NaN;
    if (typeof raw !== 'string') return NaN;
    var s = raw.replace(/\s+/g, '').replace(',', '.');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }

  /** Hilfsfunktion zum Anlegen eines Hinweises/Fehlers. */
  function issue(code, level, params) {
    return { code: code, level: level, params: params || {} };
  }

  /**
   * Zentrale Eingabeprüfung für alle drei Eingabearten.
   *
   * Statt Fehler direkt anzuzeigen, liefert die Funktion eine Liste von
   * "Issues" (Code + Schweregrad + Parameter). Die Oberfläche übersetzt sie
   * in Texte. Ungültige Werte werden – wo sinnvoll – auf den erlaubten
   * Bereich begrenzt, damit trotzdem ein Ergebnis angezeigt werden kann.
   *
   * Schweregrade:
   *   "error" – Eingabe ist nicht zulässig (Feld wird rot markiert)
   *   "info"  – Eingabe ist zulässig, aber das Ergebnis weicht leicht ab
   *
   * @param {'clicks'|'dose'|'weeks'} mode  Eingabeart
   * @param {string|number} raw             Rohwert aus dem Eingabefeld
   * @param {object} pen                    Pen-Objekt aus PENS
   * @param {number} clicksPerPen           Gesamtklicks pro Pen
   * @returns {{clicks: (number|null), value: (number|null), issues: object[]}}
   *          clicks – ermittelte Klickzahl (null, wenn nicht berechenbar)
   *          value  – geprüfter Wert in der Einheit der Eingabeart
   */
  function resolveInput(mode, raw, pen, clicksPerPen) {
    var issues = [];

    if (raw === null || raw === undefined || String(raw).trim() === '') {
      return { clicks: null, value: null, issues: [issue('empty', 'error')] };
    }

    var n = parseNumber(raw);
    if (isNaN(n)) {
      return { clicks: null, value: null, issues: [issue('invalid', 'error')] };
    }

    var maxClicks = CLICKS_PER_FULL_DOSE;

    if (mode === 'clicks') {
      var c = n;
      if (!Number.isInteger(c)) {
        issues.push(issue('clicksNotInteger', 'error'));
        c = Math.floor(c);
      }
      if (c < 1) {
        issues.push(issue('clicksTooLow', 'error', { min: 1 }));
        c = 1;
      } else if (c > maxClicks) {
        issues.push(issue('clicksTooHigh', 'error', { max: maxClicks }));
        c = maxClicks;
      }
      return { clicks: c, value: c, issues: issues };
    }

    if (mode === 'dose') {
      var maxDose = doseFromClicks(maxClicks, pen);
      var minDose = doseFromClicks(1, pen);
      var d = n;

      if (d > maxDose + EPSILON) {
        issues.push(issue('doseTooHigh', 'error', { max: maxDose }));
        d = maxDose;
      }

      var dc = clicksFromDose(d, pen);
      if (dc < 1) {
        issues.push(issue('doseTooLow', 'error', { min: minDose }));
        dc = 1;
        d = minDose;
      } else {
        // Liegt die Wunschdosis zwischen zwei Klicks, wurde abgerundet.
        var actual = doseFromClicks(dc, pen);
        if (d - actual > 1e-6) {
          issues.push(issue('doseRoundedDown', 'info', { target: d, actual: actual, clicks: dc }));
        }
      }
      return { clicks: dc, value: d, issues: issues };
    }

    if (mode === 'weeks') {
      var minW = minWeeks(clicksPerPen);
      var maxW = maxWeeks(clicksPerPen);
      var w = n;

      if (!Number.isInteger(w)) {
        issues.push(issue('weeksNotInteger', 'error'));
        w = Math.floor(w);
      }
      if (w < minW) {
        issues.push(issue('weeksTooLow', 'error', { min: minW, maxClicks: maxClicks }));
        w = minW;
      } else if (w > maxW) {
        issues.push(issue('weeksTooHigh', 'error', { max: maxW }));
        w = maxW;
      }

      var wc = clicksForWeeks(w, clicksPerPen);
      var doses = dosesPerPen(wc, clicksPerPen);
      if (doses > w) {
        issues.push(issue('weeksExceeded', 'info', { target: w, doses: doses, clicks: wc }));
      }
      return { clicks: wc, value: w, issues: issues };
    }

    throw new Error('Unbekannte Eingabeart: ' + mode);
  }

  /**
   * Gesamtklicks pro Pen prüfen (erweiterte Einstellung).
   * @returns {{value: (number|null), issues: object[]}}
   */
  function resolveClicksPerPen(raw) {
    var n = parseNumber(raw);
    if (!Number.isInteger(n) || n < CLICKS_PER_PEN_MIN || n > CLICKS_PER_PEN_MAX) {
      return {
        value: null,
        issues: [issue('clicksPerPenInvalid', 'error', { min: CLICKS_PER_PEN_MIN, max: CLICKS_PER_PEN_MAX })]
      };
    }
    return { value: n, issues: [] };
  }

  /**
   * Eigenen Pen-Preis prüfen.
   * @returns {{value: (number|null), issues: object[]}}
   */
  function resolvePrice(raw) {
    var n = parseNumber(raw);
    if (!(n > 0) || n > PRICE_MAX) {
      return { value: null, issues: [issue('priceInvalid', 'error', { max: PRICE_MAX })] };
    }
    return { value: n, issues: [] };
  }

  /* --------------------------------------------------------------------------
   *  Ergebnis berechnen
   * ------------------------------------------------------------------------ */

  /**
   * Berechnet alle Kennzahlen für eine Klickzahl.
   *
   * Kostenlogik (wie in der ursprünglichen Version):
   *   Kosten pro Dosis = Pen-Preis ÷ volle Dosen pro Pen
   *   Kosten pro mg    = Kosten pro Dosis ÷ Dosis in mg
   * Ein ungenutzter Rest im Pen erhöht damit ehrlich die Kosten pro mg.
   *
   * @param {object} p
   * @param {object} p.pen            Pen-Objekt
   * @param {number} p.clicks         Klicks pro Anwendung (1–60)
   * @param {number} p.clicksPerPen   Gesamtklicks pro Pen
   * @param {number|null} p.penPrice  Preis in EUR (null = unbekannt)
   */
  function compute(p) {
    var pen = p.pen;
    var clicks = p.clicks;
    var total = p.clicksPerPen;
    var price = isFiniteNumber(p.penPrice) && p.penPrice > 0 ? p.penPrice : null;

    var doseMg = doseFromClicks(clicks, pen);
    var doses = dosesPerPen(clicks, total);
    var remainderClicks = total - doses * clicks;
    // Der Rest ist immer kleiner als die Klicks pro Dosis (≤ 60) und damit
    // direkt über die Lookup-Tabelle in mg umrechenbar.
    var remainderMg = doseFromClicks(remainderClicks, pen);

    var pricePerDose = price !== null && doses > 0 ? price / doses : null;
    var pricePerMg = pricePerDose !== null && doseMg > 0 ? pricePerDose / doseMg : null;

    return {
      clicks: clicks,
      clicksPerPen: total,
      doseMg: doseMg,
      fullDoseMg: doseFromClicks(CLICKS_PER_FULL_DOSE, pen),
      shareOfFullDose: clicks / CLICKS_PER_FULL_DOSE,
      dosesPerPen: doses,
      remainderClicks: remainderClicks,
      remainderMg: remainderMg,
      penPrice: price,
      pricePerDose: pricePerDose,
      pricePerMg: pricePerMg,
      pricePerMonth: pricePerDose !== null ? pricePerDose * WEEKS_PER_MONTH : null,
      pricePerYear: pricePerDose !== null ? pricePerDose * WEEKS_PER_YEAR : null,
      pensPerYear: doses > 0 ? WEEKS_PER_YEAR / doses : null
    };
  }

  /* --------------------------------------------------------------------------
   *  Öffentliche Schnittstelle
   * ------------------------------------------------------------------------ */
  return Object.freeze({
    CLICKS_PER_FULL_DOSE: CLICKS_PER_FULL_DOSE,
    DEFAULT_CLICKS_PER_PEN: DEFAULT_CLICKS_PER_PEN,
    CLICKS_PER_PEN_MIN: CLICKS_PER_PEN_MIN,
    CLICKS_PER_PEN_MAX: CLICKS_PER_PEN_MAX,
    PRICE_MAX: PRICE_MAX,
    WEEKS_PER_YEAR: WEEKS_PER_YEAR,
    WEEKS_PER_MONTH: WEEKS_PER_MONTH,
    PENS: PENS,
    getPen: getPen,
    buildLookupTable: buildLookupTable,
    interpolate: interpolate,
    doseFromClicks: doseFromClicks,
    clicksFromDose: clicksFromDose,
    dosesPerPen: dosesPerPen,
    clicksForWeeks: clicksForWeeks,
    minWeeks: minWeeks,
    maxWeeks: maxWeeks,
    parseNumber: parseNumber,
    resolveInput: resolveInput,
    resolveClicksPerPen: resolveClicksPerPen,
    resolvePrice: resolvePrice,
    compute: compute
  });
});
