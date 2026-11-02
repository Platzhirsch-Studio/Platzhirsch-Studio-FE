# Bildquellen – Küche / Küchengeräte

Grundlage: Inhaber-Entscheidung Nr. 24 vom 31.10.2026 (Platzhirsch ist Händler von Gaggenau, Miele, V-ZUG, BORA,
Liebherr und Quooker; Herstellerbilder dürfen verwendet werden). Herstellerbilder **unverändert**: kein Beschnitt,
kein Filter, keine Retusche. Bearbeitung nur technisch: auf höchstens 2400 px lange Kante verkleinert und als JPEG
(Qualität 88) neu gespeichert, wo nötig (Liebherr von WebP nach JPEG umgewandelt). Gaggenau und
Quooker: Originaldatei unverändert übernommen (nicht neu kodiert). **Stand 31.10.2026:** alle drei Dateien einheitlich als WebP (Qualität 82) mit höchstens 1600 px langer Kante gespeichert (`tools/images/optimize-katalog.mjs`, Motiv unverändert); Angaben unten beschreiben die Originalfassung. Je Marke höchstens ein Bild. Einsatz auf `/kuechengeraete` je Markenkarte (Daten: `src/lib/kueche/geraete.js`, Feld `image`): Auslieferung über `next/image`, `object-contain`, Rahmen folgt dem Bildformat, `data-pin-nopin="true"`, Bildnachweis „Bild: <Marke>“ unter dem Bild.

Heruntergeladen am **31.10.2026**, nur von den offiziellen Herstellerseiten bzw. deren eigenem Bild-CDN (normale,
öffentliche Bild-URLs, keine Umgehung von Schutzmaßnahmen).

| Datei | Marke | Motiv | Original-URL | Fundstelle (Seite) | Datum |
|---|---|---|---|---|---|
| `gaggenau-backofen-marmorwand.webp` | Gaggenau | Einbau-Backofen (Edelstahlrahmen, Ringregler) flächenbündig in einer frei stehenden grünen Marmorwand, Betonraum | https://media3.bsh-group.com/Images/2400x/26397436_GG-Global-homepage-expressive-oven-key-visual-stage-vp1.jpg (Seite lädt dieselbe Datei als WebP in Breitenstufen; CDN liefert Originalgröße 1875 × 1410 px, keine Zuschnitt-Variante) | https://www.gaggenau.com/de/de (Startseite, Bühne „expressive oven“) | 2026-10-31 |
| `liebherr-einbau-kuehl-gefrierkombinationen.webp` | Liebherr | Drei Einbau-Kühl-Gefrierkombinationen (ICBNbi 7663, ICBNci 5663, ICBNdi 5163) mit geöffneten Türen in einer Schrankwand | https://www-assets.liebherr.com/media/bu-media/lhbu-hau/global/home-appliances/xl-and-xxl-appliances/comparison-xl-xxl-icbnbi7663-icbnci5663-icbndi5163-liebherr-stage-169.webp (ohne Breitensuffix `_w1920` der Seite, 1920 × 1080 px; WebP → JPEG) | https://www.liebherr.com/de-at/gefrier-kuehlschraenke/hausgeraete-2224569 (Hausgeräte-Startseite, Weiterleitung von https://home.liebherr.com/) | 2026-10-31 |
| `quooker-fusion-round-edelstahl.webp` | Quooker | Armatur Fusion Round in Edelstahl an einer Kücheninsel mit Holzarbeitsplatte | https://images.eu.ctfassets.net/vmooolt7lvvp/3IQr9qNXuH6MgjHDgvNG00/079de9399f819765c516791e944da5da/3038_Fusion_Round_Stainless_Steel_AWO_Chilled_No_model__11_.jpg (Originaldatei ohne die Zuschnitt-Parameter `w`/`h` der Seite, 1680 × 1260 px) | https://www.quooker.at/ (Startseite) | 2026-10-31 |


## Nicht belegt / leer

| Marke | Grund |
|---|---|
| Miele | https://www.miele.at/ und https://www.miele.de/ liefern bei normalem Abruf HTTP 403 (Bot-Schutz-Ersatzseite „Miele & Cie. KG“ ohne Inhalte). Nicht umgangen. Inhaber: Bild beim Hersteller/Pressebereich anfordern und unter `public/Images/Kueche/` ablegen, mit Herkunft. |
| BORA | https://www.bora.com/de-at/ und https://www.bora.com/ zeigen eine Cloudflare-Challenge („Just a moment…“, HTTP 403). Nicht umgangen. Inhaber: Bild beim Hersteller/Pressebereich anfordern und unter `public/Images/Kueche/` ablegen, mit Herkunft. |
| V-ZUG | Bewusst NICHT eingesetzt (Datei entfernt). Das Bild-CDN von V-ZUG (assets.vzug.com) liefert nur feste Seitenverhältnisse (16:9, 16:6, 5:4, 4:3, 1:1, 4:5, 9:16), keine Original-Variante – ein Zuschnitt gegenüber der Masterdatei ist nicht auszuschließen, „unverändert“ also nicht gesichert. Kandidat (Teaser Kochfeld auf https://www.vzug.com/at/de/, 31.10.2026): https://assets.vzug.com/hcms/v2.3/entity/mediaPicture/194358/media/MDAxOTQzNTgvMC9GMjMwNTJCOTkxODlGREFGQTZDNjFBQTdBNDU3MkNCMTUwNzAyQ0Q4/16x9_3840/direct/Mood-wide-kitchen-cooktop-V6000-I906-fullflex-pearl-005.jpg.jpg – Originaldatei beim Hersteller anfordern. |
