/*
 * Mounjaro KwikPen Rechner – Unit-Tests für den Rechenkern
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 monkeydriven
 *
 * Ausführen:  npm test   (bzw. `node --test tests/`)
 * Benötigt nur Node.js ≥ 18 – keine externen Abhängigkeiten.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Calc = require('../assets/js/calc.js');

const pen = (id) => Calc.getPen(id);
const T = Calc.DEFAULT_CLICKS_PER_PEN; // 300
const codes = (res) => res.issues.map((i) => i.code);

test('Pen-Daten: alle sechs Stärken mit Preis vorhanden', () => {
  assert.deepEqual(Calc.PENS.map((p) => p.id), ['2.5', '5', '7.5', '10', '12.5', '15']);
  for (const p of Calc.PENS) assert.ok(p.price > 0, `Preis für ${p.id} fehlt`);
  assert.equal(Calc.getPen('99'), null);
  assert.equal(Calc.getPen(10).mg, 10, 'IDs dürfen auch als Zahl kommen');
});

test('interpolate: Stützstellen, Zwischenwerte und Begrenzung', () => {
  const xs = [0, 30, 60];
  const ys = [0, 5, 10];
  assert.equal(Calc.interpolate(0, xs, ys), 0);
  assert.equal(Calc.interpolate(30, xs, ys), 5);
  assert.equal(Calc.interpolate(45, xs, ys), 7.5);
  assert.equal(Calc.interpolate(-5, xs, ys), 0, 'unterhalb → erster Wert');
  assert.equal(Calc.interpolate(99, xs, ys), 10, 'oberhalb → letzter Wert');
  assert.ok(Number.isNaN(Calc.interpolate(NaN, xs, ys)));
});

test('Klicks → Dosis entspricht den Werten der ursprünglichen Version', () => {
  assert.equal(Calc.doseFromClicks(60, pen('10')), 10);
  assert.equal(Calc.doseFromClicks(30, pen('10')), 5);
  assert.equal(Calc.doseFromClicks(15, pen('10')), 2.5);
  assert.equal(Calc.doseFromClicks(7, pen('7.5')), 0.875);
  assert.equal(Calc.doseFromClicks(0, pen('15')), 0);
});

test('Dosis → Klicks rundet ab und ist robust gegen Gleitkommafehler', () => {
  // 2.5 / 10 * 60 = 14.999999999999998 in JS – darf trotzdem 15 ergeben
  assert.equal(Calc.clicksFromDose(2.5, pen('10')), 15);
  assert.equal(Calc.clicksFromDose(0.875, pen('7.5')), 7);
  assert.equal(Calc.clicksFromDose(2.6, pen('10')), 15, 'zwischen zwei Klicks → abrunden');
  for (const p of Calc.PENS) {
    for (let c = 0; c <= 60; c++) {
      assert.equal(Calc.clicksFromDose(Calc.doseFromClicks(c, p), p), c, `Rundreise ${p.id} mg / ${c} Klicks`);
    }
  }
});

test('Dosen pro Pen und Rest', () => {
  assert.equal(Calc.dosesPerPen(60, T), 5);
  assert.equal(Calc.dosesPerPen(42, T), 7);
  assert.equal(Calc.dosesPerPen(1, T), 300);
  assert.equal(Calc.dosesPerPen(0, T), 0);
});

test('Wochen → Klicks: größte Klickzahl, die mindestens so lange reicht', () => {
  assert.equal(Calc.clicksForWeeks(5, T), 60);
  assert.equal(Calc.clicksForWeeks(7, T), 42);
  assert.equal(Calc.clicksForWeeks(19, T), 15);
  assert.equal(Calc.clicksForWeeks(4, T), 60, 'nie mehr als 60 Klicks');
  assert.equal(Calc.minWeeks(T), 5);
  assert.equal(Calc.minWeeks(310), 5, '310 Klicks: 60 Klicks reichen für 5 Wochen');
  assert.equal(Calc.maxWeeks(T), 300);
  // Eigenschaft: Das Ergebnis reicht immer mindestens für die Zielwochen
  for (let w = Calc.minWeeks(T); w <= Calc.maxWeeks(T); w++) {
    const c = Calc.clicksForWeeks(w, T);
    assert.ok(Calc.dosesPerPen(c, T) >= w, `${w} Wochen`);
    assert.ok(c === 60 || Calc.dosesPerPen(c + 1, T) < w, `${w} Wochen: Klickzahl ist maximal`);
  }
});

test('parseNumber akzeptiert Komma und Punkt, lehnt Unsinn ab', () => {
  assert.equal(Calc.parseNumber('2,5'), 2.5);
  assert.equal(Calc.parseNumber(' 2.5 '), 2.5);
  assert.equal(Calc.parseNumber('.5'), 0.5);
  assert.equal(Calc.parseNumber('10'), 10);
  assert.equal(Calc.parseNumber(7), 7);
  for (const bad of ['', 'abc', '1.234,5', '2,5,1', '1e3', 'NaN', null, undefined, Infinity]) {
    assert.ok(Number.isNaN(Calc.parseNumber(bad)), `"${bad}" muss ungültig sein`);
  }
});

test('resolveInput – Klicks', () => {
  const p = pen('10');
  assert.deepEqual(Calc.resolveInput('clicks', '15', p, T), { clicks: 15, value: 15, issues: [] });
  assert.deepEqual(codes(Calc.resolveInput('clicks', '', p, T)), ['empty']);
  assert.deepEqual(codes(Calc.resolveInput('clicks', 'x', p, T)), ['invalid']);

  const tooHigh = Calc.resolveInput('clicks', '75', p, T);
  assert.equal(tooHigh.clicks, 60);
  assert.deepEqual(codes(tooHigh), ['clicksTooHigh']);

  const tooLow = Calc.resolveInput('clicks', '0', p, T);
  assert.equal(tooLow.clicks, 1);
  assert.deepEqual(codes(tooLow), ['clicksTooLow']);

  const fraction = Calc.resolveInput('clicks', '12,7', p, T);
  assert.equal(fraction.clicks, 12);
  assert.deepEqual(codes(fraction), ['clicksNotInteger']);
});

test('resolveInput – Dosis', () => {
  const p = pen('10');
  assert.deepEqual(Calc.resolveInput('dose', '2,5', p, T), { clicks: 15, value: 2.5, issues: [] });

  const rounded = Calc.resolveInput('dose', '2.6', p, T);
  assert.equal(rounded.clicks, 15);
  assert.deepEqual(codes(rounded), ['doseRoundedDown']);
  assert.equal(rounded.issues[0].level, 'info');

  const tooHigh = Calc.resolveInput('dose', '12', p, T);
  assert.equal(tooHigh.clicks, 60);
  assert.deepEqual(codes(tooHigh), ['doseTooHigh']);

  const tooLow = Calc.resolveInput('dose', '0,01', pen('2.5'), T);
  assert.equal(tooLow.clicks, 1);
  assert.deepEqual(codes(tooLow), ['doseTooLow']);
});

test('resolveInput – Wochen', () => {
  const p = pen('5');
  assert.deepEqual(Calc.resolveInput('weeks', '10', p, T), { clicks: 30, value: 10, issues: [] });

  const exceeded = Calc.resolveInput('weeks', '19', p, T);
  assert.equal(exceeded.clicks, 15);
  assert.deepEqual(codes(exceeded), ['weeksExceeded']);
  assert.equal(exceeded.issues[0].params.doses, 20);

  const tooLow = Calc.resolveInput('weeks', '4', p, T);
  assert.equal(tooLow.clicks, 60);
  assert.deepEqual(codes(tooLow), ['weeksTooLow']);

  const tooHigh = Calc.resolveInput('weeks', '301', p, T);
  assert.equal(tooHigh.clicks, 1);
  assert.deepEqual(codes(tooHigh), ['weeksTooHigh']);

  assert.deepEqual(codes(Calc.resolveInput('weeks', '7,5', p, T)), ['weeksNotInteger']);
});

test('resolveInput – unbekannte Eingabeart wirft einen Fehler', () => {
  assert.throws(() => Calc.resolveInput('liters', '1', pen('5'), T));
});

test('Preis und Gesamtklicks werden geprüft', () => {
  assert.equal(Calc.resolvePrice('383,03').value, 383.03);
  assert.equal(Calc.resolvePrice('0').value, null);
  assert.equal(Calc.resolvePrice('-5').value, null);
  assert.equal(Calc.resolvePrice('99999').value, null);
  assert.equal(Calc.resolveClicksPerPen('300').value, 300);
  assert.equal(Calc.resolveClicksPerPen('59').value, null);
  assert.equal(Calc.resolveClicksPerPen('300,5').value, null);
});

test('compute: Kennzahlen am Beispiel 10-mg-Pen, 15 Klicks', () => {
  const r = Calc.compute({ pen: pen('10'), clicks: 15, clicksPerPen: T, penPrice: 383.03 });
  assert.equal(r.doseMg, 2.5);
  assert.equal(r.dosesPerPen, 20);
  assert.equal(r.remainderClicks, 0);
  assert.equal(r.shareOfFullDose, 0.25);
  assert.ok(Math.abs(r.pricePerDose - 19.1515) < 1e-9);
  assert.ok(Math.abs(r.pricePerMg - 7.6606) < 1e-9);
  assert.ok(Math.abs(r.pricePerMonth - 19.1515 * Calc.WEEKS_PER_MONTH) < 1e-9);
});

test('compute: Rest wird ausgewiesen, fehlender Preis ergibt null', () => {
  const r = Calc.compute({ pen: pen('7.5'), clicks: 42, clicksPerPen: T, penPrice: null });
  assert.equal(r.dosesPerPen, 7);
  assert.equal(r.remainderClicks, 6);
  assert.equal(r.remainderMg, 0.75);
  assert.equal(r.pricePerDose, null);
  assert.equal(r.pricePerMg, null);
  assert.equal(r.pricePerMonth, null);
});
