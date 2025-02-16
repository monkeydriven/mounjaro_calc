# mounjaro_calc
DE: Webtool für Mounjaro Kwikpen-Dosierung, Wochen &amp; Preise. Bidirektionale Berechnungen (Klicks↔Dosis) via linearer Interpolation, inkl. Lookup-Matrix &amp; Zusammenfassung. EN: Web tool for Kwikpen dosage, weeks &amp; pricing. Bidirectional calculations (clicks↔dosage) with linear interpolation, including lookup matrix &amp; summary.

# Mounjaro Kwikpen Kalkulator

Dieses Projekt ist ein webbasiertes Tool zur Berechnung von Dosierung, Wochenanzahl und Preisinformationen für verschiedene Mounjaro Kwikpen-Dosierungen. Es wurde mit HTML, CSS und JavaScript umgesetzt und nutzt Lookup-Tabellen sowie lineare Interpolation, um bidirektionale Berechnungen durchzuführen. Das bedeutet, dass der Nutzer entweder die Anzahl der Klicks oder die gewünschte Dosis eingeben kann – in beiden Fällen werden die jeweils zugehörigen Werte (Dosis, Klicks, Wochen und Preise) automatisch aktualisiert.

## Funktionsweise und Architektur

### Lookup-Tabellen & Lineare Interpolation
Für jeden Kwikpen-Typ (z.B. 2,5mg, 5mg, 7,5mg, 10mg, 12,5mg, 15mg) existiert eine Lookup-Tabelle, die feste Referenzwerte enthält. In unserem Beispiel werden drei Punkte definiert:
- **0 Klicks** entsprechen **0 mg**
- **30 Klicks** entsprechen einem definierten Zwischenwert (z.B. 5 mg bei einem 10mg-Pen)
- **60 Klicks** entsprechen der maximalen Dosis des Pens (z.B. 10 mg bei einem 10mg-Pen)

Mittels linearer Interpolation (Formel:  
`y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)`) wird der exakte Dosiswert für eine beliebige Klickzahl zwischen den Referenzpunkten berechnet. Die Umkehrfunktion (Dosis → Klicks) wird auf ähnliche Weise umgesetzt.

### Bidirektionale Berechnung
- **Klicks → Dosis:** Wird die Anzahl der Klicks eingegeben, berechnet das Tool die entsprechende Dosis und die Anzahl der Wochen (unter Annahme, dass 300 Klicks pro Pen zur Verfügung stehen). Zusätzlich werden Preisinformationen wie der Preis pro Dosis und der Preis pro mg ermittelt.
- **Dosis → Klicks:** Gibt der Nutzer die Dosis ein, so wird die nötige Klickanzahl (mittels Invers-Interpolation) berechnet, sodass der richtige Wert herauskommt.
- **Wochen → Klicks:** Der Nutzer kann auch die Anzahl der Wochen (Dosen pro Pen) als ganze Zahl eingeben. Hierbei wird die Klickzahl ermittelt, indem `Klicks = floor(300 / Wochen)` berechnet wird.

### Fehlerbehandlung & Warnungen
- Überschreitet der Nutzer die maximal erlaubte Klickzahl (60 Klicks) oder eine Dosis, die über den in der Lookup-Tabelle definierten Maximalwert liegt, wird eine Fehlermeldung eingeblendet und der Wert auf das Maximum begrenzt.
- Zusätzlich wird geprüft, ob die Anzahl der Wochen als ganze Zahl eingegeben wurde. Sollte die Berechnung der Wochen (basierend auf der Klickzahl) nicht exakt aufgehen, gibt das Tool einen Warnhinweis aus, dass in der letzten Woche ggf. 60 Klicks benötigt werden, um den Pen vollständig zu entleeren.

### Preiskalkulation
Die Preisinformationen werden wie folgt ermittelt:
- **Pen Preis:** Der jeweilige Festpreis des Pens (z.B. 383,03 € für 10mg oder 489,23 € für 12,5mg/15mg).
- **Preis pro Dosis:** Berechnet, indem der Penpreis durch die Anzahl der Dosen pro Pen (bestimmt als `floor(300 / Klicks)`) geteilt wird.
- **Preis pro mg:** Ermittelt aus dem Penpreis geteilt durch die maximale Dosis (mg) des Pens.

### Benutzeroberfläche und Zusammenfassung
Die Webseite ist in zwei Spalten aufgeteilt:
- **Linke Spalte:** Enthält alle Eingabefelder (Pen-Auswahl, Klicks, Dosis, Wochen) und einen Reset-Button.
- **Rechte Spalte:** Zeigt die Preisinformationen an.
  
Unterhalb der beiden Spalten befindet sich ein Zusammenfassungsbereich. Hier wird eine kurze, aussagekräftige Beschreibung ausgegeben, die alle aktuellen Eingabewerte zusammenfasst – inklusive der berechneten Dosenanzahl, Wirkstoffmenge pro Woche und den entsprechenden Kosten. Zusätzlich wird die zugrundeliegende Lookup-Matrix in tabellarischer Form dargestellt.

## Installation & Nutzung

1. **Repository klonen oder herunterladen:**  
   Lade das Repository auf deinen Rechner.

2. **Lokale Ausführung:**  
   Öffne die HTML-Datei in einem Browser, um den Kalkulator lokal zu testen.

3. **Deployment auf GitHub Pages:**  
   - Lade den Code in ein öffentliches GitHub-Repository hoch.
   - Gehe in den Repository-Einstellungen zum Abschnitt „Pages“.
   - Wähle den Branch (z. B. `main`) und den Ordner (root) als Quelle.
   - GitHub Pages stellt dir dann eine URL zur Verfügung, unter der dein Projekt live erreichbar ist.

## Anpassungen & Erweiterungen

- **Lookup-Tabelle:**  
  Falls du andere Werte oder zusätzliche Referenzpunkte einfügen möchtest, kannst du die Lookup-Tabelle im JavaScript-Code anpassen.

- **Preisinformationen:**  
  Die Preiswerte sind als Konstanten definiert und können leicht geändert werden.

- **Fehlerbehandlung:**  
  Weitere Prüfungen oder Anpassungen können im Code vorgenommen werden, um spezielle Anwendungsfälle abzudecken.

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz
