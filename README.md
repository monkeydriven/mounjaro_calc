# mounjaro_calc

DE: Webtool für die Mounjaro KwikPen-Dosierung, Wochen & Preise. Bidirektionale Berechnungen (Klicks ↔ Dosis ↔ Wochen) via linearer Interpolation, inkl. Dosis-Tabelle & Zusammenfassung.
EN: Web tool for KwikPen dosage, weeks & pricing. Bidirectional calculations (clicks ↔ dose ↔ weeks) with linear interpolation, including a dose table & summary.

# Mounjaro KwikPen Rechner

Ein webbasiertes Tool, das für alle Mounjaro KwikPen-Stärken (2,5 – 15 mg) Dosis, Reichweite in Wochen und Kosten berechnet. Es läuft komplett im Browser – ohne Server, ohne Tracking und ohne externe Abhängigkeiten.

> **Wichtiger Hinweis:** Der Rechner ist ein privates, unabhängiges Hilfsmittel und ersetzt keine ärztliche oder pharmazeutische Beratung. Das Abmessen von Teildosen über einzelne Klicks ist in der Gebrauchsanweisung des Herstellers nicht vorgesehen. Maßgeblich sind stets die Packungsbeilage und die ärztlich verordnete Dosierung.

## Bedienung in drei Schritten

1. **Pen wählen** – Wirkstärke als Karte auswählen (inkl. Richtpreis und mg pro Klick).
2. **Dosierung festlegen** – Eingabe wahlweise über **Klicks**, **Dosis (mg)** oder **Wochen pro Pen**. Es gibt immer genau *einen* führenden Wert; alles andere wird abgeleitet. Eingabe per Feld, Plus/Minus, Pfeiltasten, Schieberegler oder Schnellauswahl (¼, ½, ¾, voll).
3. **Preis & Annahmen** – optional eigener Pen-Preis und (unter „Erweiterte Annahmen“) die Gesamtklicks pro Pen.

Das **Ergebnis** zeigt die Dosis pro Woche, den Anteil an der vollen Dosis, die Reichweite, Kosten pro Woche/Monat/mg, eine Grafik der Pen-Aufteilung und einen eventuellen Rest. Auf großen Bildschirmen läuft es beim Scrollen mit, auf dem Smartphone erscheint unten eine Kurzanzeige.

Weitere Bereiche, erreichbar über die Navigation im Kopf:

- **Dosis-Tabelle** – Dosis in mg für 1–60 Klicks und alle sechs Pens; Auswahl hervorgehoben, Klick auf einen Wert übernimmt ihn in den Rechner.
- **So funktioniert’s** – alle Rechenwege transparent erklärt.

Außerdem: Deutsch/Englisch, helles/dunkles Farbschema, **teilbare Links** (der aktuelle Stand steckt in der URL, z. B. `?pen=10&mode=dose&v=2.5`) und lokale Speicherung der Eingaben.

## Rechenmodell

| Annahme | Wert |
|---|---|
| Klicks für die volle Dosis eines Pens | 60 |
| Gesamtklicks pro Pen | 300 (anpassbar) |
| Anwendungen | 1 pro Woche |

- **Klicks → Dosis:** lineare Interpolation über eine Lookup-Tabelle mit den Referenzpunkten 0 / 30 / 60 Klicks:
  `y = y₁ + (x − x₁) · (y₂ − y₁) / (x₂ − x₁)`
- **Dosis → Klicks:** Umkehrung derselben Tabelle, **immer abgerundet** – so kommt nie mehr als die gewünschte Dosis heraus. Liegt die Wunschdosis zwischen zwei Klicks, weist der Rechner darauf hin.
- **Wochen → Klicks:** größte Klickzahl, mit der der Pen noch mindestens so lange reicht: `min(60, floor(300 / Wochen))`. Geht eine Wochenzahl nicht exakt auf (z. B. 19 Wochen → 15 Klicks → reicht sogar 20 Wochen), wird das angezeigt.
- **Reichweite:** `floor(300 / Klicks)` volle Wochen; ein Rest wird in Klicks und mg ausgewiesen.
- **Kosten:** pro Woche = Pen-Preis ÷ volle Wochen, pro mg = Kosten pro Woche ÷ Dosis, pro Monat = Kosten pro Woche × 4,35.

Ungültige Eingaben (z. B. mehr als 60 Klicks, mehr als die Pen-Stärke, keine ganze Woche) werden direkt am Feld erklärt; wo sinnvoll wird mit dem nächsten gültigen Wert weitergerechnet.

## Projektstruktur

```
index.html            Seitenstruktur (semantisches HTML, Icon-Sprite)
assets/css/styles.css Design-Tokens (hell/dunkel), Layout, Komponenten
assets/js/calc.js     Rechenkern – reine Funktionen, ohne DOM, testbar
assets/js/i18n.js     Alle Texte (Deutsch/Englisch)
assets/js/app.js      Oberfläche: Zustand → Berechnung → Anzeige
assets/js/theme-init.js  Setzt das gespeicherte Farbschema vor dem ersten Rendern
assets/img/favicon.svg   Logo/Favicon
tests/calc.test.js    Unit-Tests für den Rechenkern
```

**Architektur:** Ein einziges Zustandsobjekt ist die Quelle der Wahrheit. `derive()` berechnet daraus über `calc.js` alle Werte, `render()` schreibt sie ins DOM. Dadurch können sich Felder nicht mehr gegenseitig überschreiben, und jede Rechenregel ist ohne Browser testbar.

## Installation & Nutzung

1. **Lokal:** Repository herunterladen und `index.html` per Doppelklick im Browser öffnen – es ist kein Server und kein Build-Schritt nötig.
2. **GitHub Pages:** In den Repository-Einstellungen unter „Pages“ den Branch (z. B. `main`) und den Ordner `/ (root)` wählen.
3. **Tests** (optional, Node.js ≥ 18, keine Abhängigkeiten):
   ```bash
   npm test
   ```

## Anpassungen

- **Preise & Pens:** `PENS` in `assets/js/calc.js`.
- **Referenzpunkte der Interpolation:** `buildLookupTable()` in `assets/js/calc.js` (beliebig viele, streng monoton steigende Punkte möglich).
- **Gesamtklicks pro Pen:** Standard `DEFAULT_CLICKS_PER_PEN` in `calc.js`, für Nutzer zusätzlich in der Oberfläche einstellbar.
- **Texte & Übersetzungen:** `assets/js/i18n.js`.
- **Farben:** Design-Tokens am Anfang von `assets/css/styles.css`.

## Barrierefreiheit & Datenschutz

- Semantisches HTML, echte Formular-Elemente (Radio-Gruppen, Schalter), Sprunglink, sichtbarer Tastaturfokus, vorgelesene Meldungen (`aria-live`), Kontraste nach WCAG 2.1 AA, Unterstützung für reduzierte Bewegung und den Windows-Kontrastmodus.
- Keine Cookies, kein Tracking, keine CDNs, Web-Fonts oder Fremd-Skripte. Eine strenge Content-Security-Policy erlaubt nur eigene Dateien. Eingaben werden ausschließlich lokal im Browser (`localStorage`) gespeichert.
- Der „Buy me a click“-Button ist ein einfacher Link – Daten fließen erst, wenn man ihn anklickt.

## Lizenz

Dieses Projekt steht unter der **MIT-Lizenz** – siehe [LICENSE](LICENSE). Jede Quelldatei trägt einen `SPDX-License-Identifier: MIT`-Kopf mit dem Copyright-Hinweis; bei Weitergabe oder Änderungen müssen Lizenztext und Copyright-Hinweis erhalten bleiben.

Es sind **keine Komponenten Dritter** enthalten: Schriften sind Systemschriften, alle Icons und das Logo wurden für dieses Projekt selbst gezeichnet.

Mounjaro® und KwikPen® sind Marken von Eli Lilly and Company. Dieses Projekt ist unabhängig und steht in keiner Verbindung zu Eli Lilly and Company.
