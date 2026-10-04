/*!
 * Mounjaro KwikPen Rechner – Übersetzungen
 * https://github.com/monkeydriven/mounjaro_calc
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 monkeydriven – vollständiger Lizenztext: siehe LICENSE.
 */

/**
 * ============================================================================
 *  i18n.js – alle sichtbaren Texte an einem Ort (Deutsch / Englisch)
 * ============================================================================
 *
 *  • Statische Texte sind einfache Strings. Im HTML werden sie über
 *    `data-i18n="schluessel"` (Textinhalt) bzw.
 *    `data-i18n-attr="aria-label:schluessel"` (Attribute) eingebunden.
 *  • Dynamische Texte sind Funktionen. Sie bekommen BEREITS FORMATIERTE
 *    Werte (z. B. "2,50" oder "19,15 €"), damit die Zahlenformatierung
 *    zentral in app.js über Intl.NumberFormat passiert.
 *  • `locale` steuert Zahlen- und Währungsformat.
 *
 *  Neue Sprache hinzufügen: Block kopieren, übersetzen, in app.js unter
 *  SUPPORTED_LANGS eintragen und im Header einen Button ergänzen.
 */
(function (root) {
  'use strict';

  var de = {
    locale: 'de-DE',

    /* Seite & Kopfbereich */
    metaTitle: 'Mounjaro KwikPen Rechner – Klicks, Dosis, Wochen & Kosten',
    metaDescription: 'Kostenloser Rechner für den Mounjaro KwikPen: Klicks in mg umrechnen, Reichweite in Wochen und Kosten pro Woche bzw. mg ermitteln.',
    skipLink: 'Zum Rechner springen',
    brandName: 'KwikPen Rechner',
    navLabel: 'Seitennavigation',
    navCalc: 'Rechner',
    navTable: 'Dosis-Tabelle',
    navHow: 'So funktioniert’s',
    langLabel: 'Sprache wählen',
    themeToDark: 'Dunkles Farbschema aktivieren',
    themeToLight: 'Helles Farbschema aktivieren',

    /* Einleitung */
    heroTitle: 'Mounjaro KwikPen Rechner',
    heroLead: 'In drei Schritten von der Klickzahl zur Dosis – inklusive Reichweite des Pens und Kosten pro Woche.',
    heroBadgePrivacy: 'Kein Tracking',
    heroBadgeOffline: 'Läuft komplett im Browser',

    /* Schritt 1 */
    step1Title: 'Pen wählen',
    step1Hint: 'Wirkstärke laut Rezept bzw. Packung.',
    penLegend: 'Wirkstärke des KwikPen',
    penPerClick: function (mg) { return '≈\u00a0' + mg + '\u00a0mg/Klick'; },

    /* Schritt 2 */
    step2Title: 'Dosierung festlegen',
    step2Hint: 'Wähle, was du kennst – der Rest wird berechnet.',
    modeLegend: 'Eingabe über',
    modeClicks: 'Klicks',
    modeDose: 'Dosis',
    modeWeeks: 'Wochen',
    modeDescClicks: 'Wie viele Klicks drehst du pro Anwendung?',
    modeDescDose: 'Welche Dosis in mg möchtest du pro Woche anwenden?',
    modeDescWeeks: 'Wie viele Wochen soll ein Pen mindestens reichen?',
    inputLabelClicks: 'Klicks pro Anwendung',
    inputLabelDose: 'Dosis pro Woche',
    inputLabelWeeks: 'Wochen pro Pen',
    unitClicks: 'Klicks',
    unitMg: 'mg',
    unitWeeks: 'Wochen',
    decrease: 'Wert verringern',
    increase: 'Wert erhöhen',
    sliderLabel: function (label) { return label + ' (Schieberegler)'; },
    rangeHint: function (min, max, unit) { return 'Bereich: ' + min + ' – ' + max + ' ' + unit; },
    presetsLabel: 'Schnellauswahl',
    presetFull: 'Voll',
    presetWeeks: function (n) { return n + ' Wo.'; },
    sliderValueDose: function (mg, clicks) { return mg + '\u00a0mg (' + clicks + '\u00a0Klicks)'; },
    sliderValueWeeks: function (weeks) { return weeks + '\u00a0Wochen'; },

    /* Meldungen zur Eingabe (Codes aus calc.js) */
    issue_empty: 'Bitte einen Wert eingeben.',
    issue_invalid: 'Bitte eine gültige Zahl eingeben (z. B. 2,5).',
    issue_clicksNotInteger: 'Nur ganze Klicks sind möglich – es wird mit dem abgerundeten Wert gerechnet.',
    issue_clicksTooLow: function (p) { return 'Mindestens ' + p.min + '\u00a0Klick pro Anwendung.'; },
    issue_clicksTooHigh: function (p) { return 'Maximal ' + p.max + '\u00a0Klicks pro Anwendung (= volle Pen-Dosis). Es wird mit ' + p.max + ' gerechnet.'; },
    issue_doseTooHigh: function (p) { return 'Mit diesem Pen sind höchstens ' + p.max + '\u00a0mg pro Anwendung möglich. Es wird mit ' + p.max + '\u00a0mg gerechnet.'; },
    issue_doseTooLow: function (p) { return 'Kleinste mögliche Dosis mit diesem Pen: ' + p.min + '\u00a0mg (1 Klick).'; },
    issue_doseRoundedDown: function (p) { return p.target + '\u00a0mg ist mit ganzen Klicks nicht exakt möglich. Sicherheitshalber abgerundet auf ' + p.clicks + '\u00a0Klicks = ' + p.actual + '\u00a0mg.'; },
    issue_weeksNotInteger: 'Bitte nur ganze Wochen angeben – es wird mit dem abgerundeten Wert gerechnet.',
    issue_weeksTooLow: function (p) { return 'Mindestens ' + p.min + '\u00a0Wochen – mehr als ' + p.maxClicks + '\u00a0Klicks pro Anwendung sind nicht möglich.'; },
    issue_weeksTooHigh: function (p) { return 'Höchstens ' + p.max + '\u00a0Wochen (1 Klick pro Woche).'; },
    issue_weeksExceeded: function (p) { return 'Genau ' + p.target + '\u00a0Wochen gehen nicht auf: Mit ' + p.clicks + '\u00a0Klicks reicht der Pen sogar für ' + p.doses + '\u00a0Wochen.'; },
    issue_priceInvalid: function (p) { return 'Bitte einen Preis zwischen 0 und ' + p.max + ' € eingeben.'; },
    issue_clicksPerPenInvalid: function (p) { return 'Bitte eine ganze Zahl zwischen ' + p.min + ' und ' + p.max + ' eingeben.'; },

    /* Schritt 3 */
    step3Title: 'Preis & Annahmen',
    step3Hint: 'Optional – nur nötig, wenn dein Preis abweicht.',
    listPrice: 'Richtpreis pro Pen',
    listPriceNote: 'Richtwerte ohne Gewähr – Apothekenpreise können abweichen.',
    customPriceToggle: 'Eigenen Preis verwenden',
    customPriceLabel: 'Dein Pen-Preis',
    advancedSummary: 'Erweiterte Annahmen',
    clicksPerPenLabel: 'Klicks pro Pen (gesamt)',
    clicksPerPenHint: function (def) { return 'Standard: ' + def + '\u00a0Klicks. Nur ändern, wenn du es genauer weißt.'; },

    /* Ergebnis */
    resultTitle: 'Ergebnis',
    resultPerWeek: 'pro Woche',
    resultSub: function (clicks, penMg) { return clicks + '\u00a0Klicks · KwikPen\u00a0' + penMg + '\u00a0mg'; },
    ringCaption: 'der vollen Dosis',
    ringAria: function (pct, clicks) { return pct + ' % der vollen Dosis (' + clicks + ' von 60 Klicks)'; },
    kpiWeeks: 'Reicht für',
    kpiWeeksValue: function (n) { return n + (n === '1' ? '\u00a0Woche' : '\u00a0Wochen'); },
    kpiWeekCost: 'Kosten pro Woche',
    kpiMonthCost: 'Kosten pro Monat',
    kpiMonthNote: '≈\u00a04,35\u00a0Wochen',
    kpiMgCost: 'Kosten pro mg',
    kpiPensYear: function (n) { return '≈\u00a0' + n + '\u00a0Pens pro Jahr'; },
    noPrice: 'Kein gültiger Preis',
    penBarTitle: 'So teilt sich der Pen auf',
    penBarLegendDose: function (clicks) { return '1 Segment = 1 Woche (' + clicks + '\u00a0Klicks)'; },
    penBarLegendRest: 'Rest',
    penBarScaleEnd: function (total) { return total + '\u00a0Klicks'; },
    penBarAria: function (doses, clicks, rest) { return doses + ' Dosen zu je ' + clicks + '\u00a0Klicks, Rest ' + rest + '\u00a0Klicks'; },
    penBarSegment: function (i, from, to) { return 'Woche ' + i + ': Klick ' + from + '–' + to; },
    penBarRestTip: function (rest) { return 'Rest: ' + rest + '\u00a0Klicks'; },
    remainderNone: 'Geht exakt auf – es bleibt kein Rest im Pen.',
    remainderSome: function (doses, rest, restMg) { return 'Nach ' + doses + ' vollen Dosen bleiben ' + rest + '\u00a0Klicks (≈\u00a0' + restMg + '\u00a0mg) im Pen – zu wenig für eine weitere Dosis.'; },
    summaryTitle: 'Zusammenfassung',
    summaryText: function (v) {
      var text = 'Mit dem KwikPen ' + v.penMg + '\u00a0mg und ' + v.clicks + '\u00a0Klicks pro Anwendung nimmst du ' +
        v.dose + '\u00a0mg pro Woche. Ein Pen reicht damit für ' + v.doses + '\u00a0Wochen';
      return text + (v.weekCost ? ', das kostet etwa ' + v.weekCost + ' pro Woche bzw. ' + v.monthCost + ' pro Monat.' : '.');
    },
    resultEmpty: 'Gib in Schritt 2 einen gültigen Wert ein, um dein Ergebnis zu sehen.',
    copyLink: 'Link kopieren',
    copyLinkDone: 'Link in die Zwischenablage kopiert.',
    copyLinkFailed: 'Kopieren nicht möglich – bitte den Link aus der Adresszeile kopieren.',
    reset: 'Zurücksetzen',
    resetDone: 'Alle Eingaben wurden zurückgesetzt.',
    miniDetails: 'Details',
    miniPerWeek: '/Woche',
    miniWeeks: function (n) { return n + ' Wo.'; },

    /* Hinweis */
    disclaimerTitle: 'Wichtiger Hinweis',
    disclaimerText: 'Dieser Rechner ist ein privates, unabhängiges Hilfsmittel ohne Anspruch auf Vollständigkeit oder Richtigkeit und ersetzt keine ärztliche oder pharmazeutische Beratung. Das Abmessen von Teildosen über einzelne Klicks ist in der Gebrauchsanweisung des Herstellers nicht vorgesehen. Maßgeblich sind stets die Packungsbeilage und die ärztlich verordnete Dosierung. Die Nutzung erfolgt auf eigene Verantwortung.',

    /* Dosis-Tabelle */
    tableTitle: 'Dosis-Tabelle',
    tableLead: 'Dosis in mg für jede Klickzahl und alle Pen-Stärken. Dein Pen und deine Klickzahl sind hervorgehoben.',
    tableTip: 'Tipp: Tippe auf einen Wert, um ihn in den Rechner zu übernehmen.',
    tableCaption: 'Dosis in mg nach Klickzahl (Zeilen) und Wirkstärke des Pens (Spalten)',
    thClicks: 'Klicks',
    thPen: function (mg) { return mg + '\u00a0mg'; },
    tableApplied: function (mg, clicks) { return 'Übernommen: KwikPen\u00a0' + mg + '\u00a0mg mit ' + clicks + '\u00a0Klicks.'; },
    tableJumpBack: 'Zum Ergebnis',

    /* So funktioniert's */
    howTitle: 'So funktioniert’s',
    howLead: 'Transparente Rechenwege – damit du jedes Ergebnis nachvollziehen kannst.',
    how1Title: '60 Klicks = volle Dosis',
    how1Text: 'Der Dosierknopf des KwikPen rastet in Klicks ein. Der Rechner nimmt an, dass 60 Klicks der vollen Wirkstärke entsprechen – beim 10-mg-Pen also 10 mg.',
    how2Title: 'Lineare Interpolation',
    how2Text: 'Zwischenwerte werden aus Referenzpunkten (0, 30 und 60 Klicks) berechnet. Die Umrechnung Dosis → Klicks rundet immer ab, damit nie mehr als die gewünschte Dosis herauskommt.',
    how3Title: 'Reichweite des Pens',
    how3Text: 'Angenommen werden 300 Klicks pro Pen und eine Anwendung pro Woche. Volle Wochen = abgerundet (300 ÷ Klicks); ein Rest wird separat ausgewiesen. Den Gesamtinhalt kannst du unter „Erweiterte Annahmen“ anpassen.',
    how4Title: 'Kosten',
    how4Text: 'Kosten pro Woche = Pen-Preis ÷ volle Wochen. Kosten pro mg = Kosten pro Woche ÷ Dosis. Ein ungenutzter Rest ist damit ehrlich eingepreist. Monatswerte beruhen auf durchschnittlich 4,35 Wochen.',
    formulaLabel: 'Formel',

    /* Fußzeile */
    footerLicense: 'MIT-Lizenz',
    footerSource: 'Quellcode auf GitHub',
    footerSupport: 'Buy me a click',
    footerNewTab: '(öffnet in neuem Tab)',
    footerPrivacy: 'Keine Cookies, kein Tracking, keine externen Skripte. Deine Eingaben werden nur lokal in deinem Browser gespeichert.',
    footerTrademark: 'Mounjaro® und KwikPen® sind Marken von Eli Lilly and Company. Dieses Projekt ist unabhängig und steht in keiner Verbindung zu Eli Lilly and Company.',

    /* Fehlerfall */
    fatalError: 'Der Rechner konnte nicht geladen werden. Bitte lade die Seite neu.'
  };

  var en = {
    locale: 'en-GB',

    metaTitle: 'Mounjaro KwikPen Calculator – clicks, dose, weeks & cost',
    metaDescription: 'Free calculator for the Mounjaro KwikPen: convert clicks to mg and work out how long a pen lasts and what it costs per week or per mg.',
    skipLink: 'Skip to calculator',
    brandName: 'KwikPen Calculator',
    navLabel: 'Page navigation',
    navCalc: 'Calculator',
    navTable: 'Dose table',
    navHow: 'How it works',
    langLabel: 'Choose language',
    themeToDark: 'Switch to dark theme',
    themeToLight: 'Switch to light theme',

    heroTitle: 'Mounjaro KwikPen Calculator',
    heroLead: 'Three steps from click count to dose – including how long your pen lasts and what it costs per week.',
    heroBadgePrivacy: 'No tracking',
    heroBadgeOffline: 'Runs entirely in your browser',

    step1Title: 'Choose your pen',
    step1Hint: 'Strength as prescribed or printed on the pack.',
    penLegend: 'KwikPen strength',
    penPerClick: function (mg) { return '≈\u00a0' + mg + '\u00a0mg/click'; },

    step2Title: 'Set your dose',
    step2Hint: 'Pick what you know – everything else is calculated.',
    modeLegend: 'Enter by',
    modeClicks: 'Clicks',
    modeDose: 'Dose',
    modeWeeks: 'Weeks',
    modeDescClicks: 'How many clicks do you dial per injection?',
    modeDescDose: 'Which dose in mg do you want per week?',
    modeDescWeeks: 'How many weeks should one pen last at least?',
    inputLabelClicks: 'Clicks per injection',
    inputLabelDose: 'Dose per week',
    inputLabelWeeks: 'Weeks per pen',
    unitClicks: 'clicks',
    unitMg: 'mg',
    unitWeeks: 'weeks',
    decrease: 'Decrease value',
    increase: 'Increase value',
    sliderLabel: function (label) { return label + ' (slider)'; },
    rangeHint: function (min, max, unit) { return 'Range: ' + min + ' – ' + max + ' ' + unit; },
    presetsLabel: 'Quick picks',
    presetFull: 'Full',
    presetWeeks: function (n) { return n + '\u00a0wk'; },
    sliderValueDose: function (mg, clicks) { return mg + '\u00a0mg (' + clicks + '\u00a0clicks)'; },
    sliderValueWeeks: function (weeks) { return weeks + '\u00a0weeks'; },

    issue_empty: 'Please enter a value.',
    issue_invalid: 'Please enter a valid number (e.g. 2.5).',
    issue_clicksNotInteger: 'Only whole clicks are possible – the rounded-down value is used.',
    issue_clicksTooLow: function (p) { return 'At least ' + p.min + '\u00a0click per injection.'; },
    issue_clicksTooHigh: function (p) { return 'At most ' + p.max + '\u00a0clicks per injection (= full pen dose). Calculating with ' + p.max + '.'; },
    issue_doseTooHigh: function (p) { return 'This pen delivers at most ' + p.max + '\u00a0mg per injection. Calculating with ' + p.max + '\u00a0mg.'; },
    issue_doseTooLow: function (p) { return 'Smallest possible dose with this pen: ' + p.min + '\u00a0mg (1 click).'; },
    issue_doseRoundedDown: function (p) { return p.target + '\u00a0mg cannot be reached exactly with whole clicks. To be safe it was rounded down to ' + p.clicks + '\u00a0clicks = ' + p.actual + '\u00a0mg.'; },
    issue_weeksNotInteger: 'Please enter whole weeks only – the rounded-down value is used.',
    issue_weeksTooLow: function (p) { return 'At least ' + p.min + '\u00a0weeks – more than ' + p.maxClicks + '\u00a0clicks per injection are not possible.'; },
    issue_weeksTooHigh: function (p) { return 'At most ' + p.max + '\u00a0weeks (1 click per week).'; },
    issue_weeksExceeded: function (p) { return 'Exactly ' + p.target + '\u00a0weeks is not possible: with ' + p.clicks + '\u00a0clicks the pen even lasts ' + p.doses + '\u00a0weeks.'; },
    issue_priceInvalid: function (p) { return 'Please enter a price between 0 and ' + p.max + ' €.'; },
    issue_clicksPerPenInvalid: function (p) { return 'Please enter a whole number between ' + p.min + ' and ' + p.max + '.'; },

    step3Title: 'Price & assumptions',
    step3Hint: 'Optional – only needed if your price differs.',
    listPrice: 'Reference price per pen',
    listPriceNote: 'Reference values without guarantee – pharmacy prices may differ.',
    customPriceToggle: 'Use my own price',
    customPriceLabel: 'Your pen price',
    advancedSummary: 'Advanced assumptions',
    clicksPerPenLabel: 'Clicks per pen (total)',
    clicksPerPenHint: function (def) { return 'Default: ' + def + '\u00a0clicks. Only change this if you know better.'; },

    resultTitle: 'Your result',
    resultPerWeek: 'per week',
    resultSub: function (clicks, penMg) { return clicks + '\u00a0clicks · KwikPen\u00a0' + penMg + '\u00a0mg'; },
    ringCaption: 'of the full dose',
    ringAria: function (pct, clicks) { return pct + ' % of the full dose (' + clicks + ' of 60 clicks)'; },
    kpiWeeks: 'Lasts',
    kpiWeeksValue: function (n) { return n + (n === '1' ? '\u00a0week' : '\u00a0weeks'); },
    kpiWeekCost: 'Cost per week',
    kpiMonthCost: 'Cost per month',
    kpiMonthNote: '≈\u00a04.35\u00a0weeks',
    kpiMgCost: 'Cost per mg',
    kpiPensYear: function (n) { return '≈\u00a0' + n + '\u00a0pens per year'; },
    noPrice: 'No valid price',
    penBarTitle: 'How the pen is divided',
    penBarLegendDose: function (clicks) { return '1 segment = 1 week (' + clicks + '\u00a0clicks)'; },
    penBarLegendRest: 'Remainder',
    penBarScaleEnd: function (total) { return total + '\u00a0clicks'; },
    penBarAria: function (doses, clicks, rest) { return doses + ' doses of ' + clicks + '\u00a0clicks each, remainder ' + rest + '\u00a0clicks'; },
    penBarSegment: function (i, from, to) { return 'Week ' + i + ': click ' + from + '–' + to; },
    penBarRestTip: function (rest) { return 'Remainder: ' + rest + '\u00a0clicks'; },
    remainderNone: 'Divides evenly – nothing is left in the pen.',
    remainderSome: function (doses, rest, restMg) { return 'After ' + doses + ' full doses, ' + rest + '\u00a0clicks (≈\u00a0' + restMg + '\u00a0mg) remain in the pen – not enough for another dose.'; },
    summaryTitle: 'Summary',
    summaryText: function (v) {
      var text = 'With the KwikPen ' + v.penMg + '\u00a0mg at ' + v.clicks + '\u00a0clicks per injection you take ' +
        v.dose + '\u00a0mg per week. One pen lasts ' + v.doses + '\u00a0weeks';
      return text + (v.weekCost ? ', which costs about ' + v.weekCost + ' per week or ' + v.monthCost + ' per month.' : '.');
    },
    resultEmpty: 'Enter a valid value in step 2 to see your result.',
    copyLink: 'Copy link',
    copyLinkDone: 'Link copied to clipboard.',
    copyLinkFailed: 'Copying failed – please copy the link from the address bar.',
    reset: 'Reset',
    resetDone: 'All inputs have been reset.',
    miniDetails: 'Details',
    miniPerWeek: '/week',
    miniWeeks: function (n) { return n + '\u00a0wk'; },

    disclaimerTitle: 'Important notice',
    disclaimerText: 'This calculator is a private, independent tool. It makes no claim to completeness or accuracy and does not replace medical or pharmaceutical advice. Measuring partial doses by individual clicks is not part of the manufacturer’s instructions for use. The package leaflet and the dose prescribed by your doctor always take precedence. Use at your own risk.',

    tableTitle: 'Dose table',
    tableLead: 'Dose in mg for every click count and all pen strengths. Your pen and click count are highlighted.',
    tableTip: 'Tip: tap a value to load it into the calculator.',
    tableCaption: 'Dose in mg by click count (rows) and pen strength (columns)',
    thClicks: 'Clicks',
    thPen: function (mg) { return mg + '\u00a0mg'; },
    tableApplied: function (mg, clicks) { return 'Loaded: KwikPen\u00a0' + mg + '\u00a0mg at ' + clicks + '\u00a0clicks.'; },
    tableJumpBack: 'Go to result',

    howTitle: 'How it works',
    howLead: 'Transparent calculations – so you can follow every result.',
    how1Title: '60 clicks = full dose',
    how1Text: 'The KwikPen dose knob turns in clicks. The calculator assumes that 60 clicks equal the full strength of the pen – 10 mg for the 10 mg pen.',
    how2Title: 'Linear interpolation',
    how2Text: 'Values in between are calculated from reference points (0, 30 and 60 clicks). Converting dose → clicks always rounds down, so you never get more than the requested dose.',
    how3Title: 'How long a pen lasts',
    how3Text: 'The calculator assumes 300 clicks per pen and one injection per week. Full weeks = 300 ÷ clicks, rounded down; any remainder is shown separately. You can change the total under “Advanced assumptions”.',
    how4Title: 'Cost',
    how4Text: 'Cost per week = pen price ÷ full weeks. Cost per mg = cost per week ÷ dose, so any unused remainder is priced in honestly. Monthly values use an average of 4.35 weeks.',
    formulaLabel: 'Formula',

    footerLicense: 'MIT License',
    footerSource: 'Source code on GitHub',
    footerSupport: 'Buy me a click',
    footerNewTab: '(opens in a new tab)',
    footerPrivacy: 'No cookies, no tracking, no external scripts. Your inputs are only stored locally in your browser.',
    footerTrademark: 'Mounjaro® and KwikPen® are trademarks of Eli Lilly and Company. This project is independent and not affiliated with Eli Lilly and Company.',

    fatalError: 'The calculator could not be loaded. Please reload the page.'
  };

  root.MounjaroI18n = Object.freeze({ de: de, en: en });
})(typeof self !== 'undefined' ? self : this);
