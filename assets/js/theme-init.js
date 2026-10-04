/*!
 * Mounjaro KwikPen Rechner – Farbschema-Initialisierung
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 monkeydriven – siehe LICENSE.
 *
 * Läuft absichtlich SYNCHRON im <head>, noch bevor die Seite gezeichnet
 * wird. So erscheint ein gespeichertes helles/dunkles Farbschema sofort,
 * ohne kurzes Aufblitzen des falschen Themes. Bewusst als eigene Datei
 * (statt Inline-Skript), damit die Content-Security-Policy streng bleiben
 * kann. Muss mit STORAGE_KEY in app.js übereinstimmen.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  try {
    var saved = JSON.parse(window.localStorage.getItem('mounjaro-calc:v2') || 'null');
    if (saved && (saved.theme === 'light' || saved.theme === 'dark')) {
      root.setAttribute('data-theme', saved.theme);
    }
    if (saved && saved.lang === 'en') root.lang = 'en';
  } catch {
    /* localStorage gesperrt (z. B. privater Modus) – Systemvorgabe gilt. */
  }
})();
