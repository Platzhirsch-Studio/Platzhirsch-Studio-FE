// src/lib/katalog/marken/dornbracht.js – Dornbracht (Aloys F. Dornbracht GmbH & Co. KG, Iserlohn)
// Stand 31.10.2026, Inhaber-Entscheidungen Nr. 21 und 25.
//
// Quellen: nur die offizielle Herstellerseite dornbracht.com (/de-at/, Österreich),
// frei abrufbar mit normalen HTTP-Abrufen: Sitemap /de-at/sitemap.de-at.xml,
// Serienübersichten /designserien/badserien/, /spa-serien/, /kuechenserien/,
// Produktkategorien unter /bad/ und /kueche/, Projektserien unter /professional/.
// Ein Eintrag je Serie bzw. je serienunabhängiger Produktfamilie; Ausführungen,
// Oberflächen und Varianten als Merkmal + Link zum Hersteller.
// Vollständigkeits-Check: qa-screenshots/wellness/produkte/vollstaendigkeit-dornbracht.md
//
// Bilder: Original vom Dornbracht-CDN media.cdn.dornbracht.com, ganzes Motiv
// (Bild-URL der Seite ohne den crop:-Parameter, fit-in 2400 px), unverändert;
// Dateien einheitlich ≤ 1600 px lange Kante, WebP q82 (tools/images/optimize-katalog.mjs).
// Quelle je Bild: Abschnitt „Katalog Dornbracht“ in docs/bildquellen/QUELLEN.md.
//
// Bewusst NICHT übernommen (nur Inhalte, keine Produkte):
//   - Wirk- und Gesundheitsaussagen der Spa-Seiten (Durchblutung, Abwehrkräfte,
//     Regeneration, Stressabbau, „Hydrotherapie“, „gesundheitsfördernd“, Zitate von
//     Spa-/TCM-Experten) – Spa-Produkte sind nur technisch beschrieben,
//   - Werbe-Absolute („einzigartig“, „perfekt“, „Ikone“, „höchste Manufakturqualität“),
//   - Angaben zu Konditionen/Preissegment der Projektserien.
//
// Küchenarmaturen und Küchenbecken: KUECHE_VORBEREITET (bereich "kueche"), seit K2
// (Welt je Produkt) in PRODUKTE mit welt "kuechengeraete".

const STAND = "2026-10-31";
const DA = "https://www.dornbracht.com/de-at/";
const T = (de, en, fr, it) => Object.freeze({ de, en, fr, it });
const mass = (key, wert) => Object.freeze({ key, wert });

/** Bilder: Datei-Schlüssel → [Breite, Höhe, Original-URL] (echte Pixel, mit sharp geprüft). */
const IMG = Object.freeze({
  "aquahalo-1": [1600, 1098, "https://media.cdn.dornbracht.com/v/xzCfFAco/fit-in:2400x10000/quality:85/Dornbracht_Showers_AQUAHALO_all-jets_ROW_01.jpg"],
  "aquahalo-2": [1600, 1199, "https://media.cdn.dornbracht.com/v/L6FxqzW9/fit-in:2400x10000/quality:85/Dornbracht_Showers_AQUAHALO_ACR_Close-Up_02-gecropped-quer.jpg"],
  "aquamoon-1": [1600, 1199, "https://media.cdn.dornbracht.com/v/vGZ5mWPL/fit-in:2400x10000/quality:85/Aquamoon_05.jpg"],
  "aquamoon-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/KGjp6Js9/fit-in:2400x10000/quality:85/image.jpg"],
  "bad-accessoires-1": [1198, 1600, "https://media.cdn.dornbracht.com/v/gD5h3NNt/fit-in:2400x10000/quality:85/man_b_048_V1.jpg"],
  "bad-accessoires-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/bO4IASuu/fit-in:2400x10000/quality:85/83060892-99PA.jpg"],
  "big-rain-1": [1600, 1600, "https://media.cdn.dornbracht.com/v/iLJXibXd/fit-in:2400x10000/quality:85/image.jpg"],
  "brausegarnituren-1": [1029, 1600, "https://media.cdn.dornbracht.com/v/qDG8bN5Y/fit-in:2400x10000/quality:85/Meta.02_084_V2.jpg"],
  "brausegarnituren-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/4nrzdMNi/fit-in:2400x10000/quality:85/image.jpg"],
  "cl-1-1": [1200, 1600, "https://media.cdn.dornbracht.com/v/gszLaJmc/fit-in:2400x10000/quality:85/CL.1_Platinum_01.jpg"],
  "cl-1-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/kgsjVyCG/fit-in:2400x10000/quality:85/image.jpg"],
  "comfort-shower-1": [1600, 1029, "https://media.cdn.dornbracht.com/v/OipA0Zur/fit-in:2400x10000/quality:85/Comfort_Shower_01_752_V1.jpg"],
  "comfort-shower-2": [1600, 1029, "https://media.cdn.dornbracht.com/v/4krmsaQe/fit-in:2400x10000/quality:85/Comfort_Shower_01_334_V1.jpg"],
  "coya-1": [1600, 1600, "https://media.cdn.dornbracht.com/v/fsTTLl8t/fit-in:2400x10000/quality:85/COYA_STILL_03_V2-2_DIGI.jpg"],
  "coya-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/GZkQRzL0/fit-in:2400x10000/quality:85/image.jpg"],
  "cyo-1": [1600, 1233, "https://media.cdn.dornbracht.com/v/Yh3qiSJY/fit-in:2400x10000/quality:85/CYO_Durabrass_01_V1.jpg"],
  "cyo-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/ByaKQ1h3/fit-in:2400x10000/quality:85/image.jpg"],
  "drueckerplatten-wc-1": [1600, 1600, "https://media.cdn.dornbracht.com/v/GbhdnMC7/fit-in:2400x10000/quality:85/12660979-93PA.jpg"],
  "drueckerplatten-wc-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/jVJiDdR3/fit-in:2400x10000/quality:85/image.jpg"],
  "duschsysteme-1": [1600, 1199, "https://media.cdn.dornbracht.com/v/LEgClMTO/fit-in:2400x10000/quality:85/TARA_Brushed-Champagne_Perfect-Match_1.jpg"],
  "duschsysteme-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/9QQehTyN/fit-in:2400x10000/quality:85/image.jpg"],
  "edition-pro-1": [1600, 1200, "https://media.cdn.dornbracht.com/v/dgmhhgSc/fit-in:2400x10000/quality:85/Dornbracht_Edition-Pro_Chrom_1.jpg"],
  "edition-pro-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/TyjxwL3q/fit-in:2400x10000/quality:85/image.jpg"],
  "elio-1": [1600, 1221, "https://media.cdn.dornbracht.com/v/wSGq8WtN/fit-in:2400x10000/quality:85/ELIO_Chrome_matte_01_V2.jpg"],
  "elio-2": [1600, 1055, "https://media.cdn.dornbracht.com/v/BwAOMgMO/fit-in:2400x10000/quality:85/33840790_Brause_cmyk.jpg"],
  "eno-1": [1600, 1221, "https://media.cdn.dornbracht.com/v/cbDjVVHk/fit-in:2400x10000/quality:85/ENO_Chrome_01_V1-1.jpg"],
  "eno-2": [1198, 1600, "https://media.cdn.dornbracht.com/v/wa4xvjyu/fit-in:2400x10000/quality:85/eno_ehm_ex_122.jpg"],
  "handbrausen-1": [1198, 1600, "https://media.cdn.dornbracht.com/v/SP0DKZ9H/fit-in:2400x10000/quality:85/white_306_V2.jpg"],
  "handbrausen-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/VQGN5vZr/fit-in:2400x10000/quality:85/image.jpg"],
  "handtuchwaermer-1": [1600, 1600, "https://media.cdn.dornbracht.com/v/UxFu9Uqh/fit-in:2400x10000/quality:85/ST1004002979-46_PA.jpg"],
  "handtuchwaermer-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/95e11NZZ/fit-in:2400x10000/quality:85/image.jpg"],
  "horizontal-shower-1": [1600, 1029, "https://media.cdn.dornbracht.com/v/DUpa3MOS/fit-in:2400x10000/quality:85/Dusche_186_V16_oModel_4c_V1.jpg"],
  "horizontal-shower-2": [1600, 1029, "https://media.cdn.dornbracht.com/v/O119EcIT/fit-in:2400x10000/quality:85/CloseUp__121_V2_CMYK.jpg"],
  "imo-1": [1600, 1233, "https://media.cdn.dornbracht.com/v/YhNfHqtF/fit-in:2400x10000/quality:85/IMO_new_Chrome_01_V1.jpg"],
  "imo-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/gIKdPgqc/fit-in:2400x10000/quality:85/image.jpg"],
  "kopfbrausen-1": [1154, 1600, "https://media.cdn.dornbracht.com/v/WKO9dYSy/fit-in:2400x10000/quality:85/Meta.02_182.jpg"],
  "kopfbrausen-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/izhUpbmk/fit-in:2400x10000/quality:85/image.jpg"],
  "kuechenspuelen-1": [1600, 900, "https://media.cdn.dornbracht.com/v/hUsZQ7ur/fit-in:2400x10000/quality:85/Double-Sink_Brushed-Stainless-Steel_02.jpg"],
  "kuechenspuelen-2": [1600, 1335, "https://media.cdn.dornbracht.com/v/pFUfRNlm/fit-in:2400x10000/quality:85/image.jpg"],
  "leg-shower-1": [1600, 1029, "https://media.cdn.dornbracht.com/v/8qtFi3iT/fit-in:2400x10000/quality:85/Comfort_Shower_01_281_V1.jpg"],
  "leg-shower-2": [1222, 1600, "https://media.cdn.dornbracht.com/v/f21IBuTd/fit-in:2400x10000/quality:85/Comfort_Shower_01_558_V2.jpg"],
  "lichtspiegel-1": [1600, 1600, "https://media.cdn.dornbracht.com/v/WiF112ob/fit-in:2400x10000/quality:85/83150980-33_PA.jpg"],
  "lichtspiegel-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/GEjqCvx7/fit-in:2400x10000/quality:85/image.jpg"],
  "lisse-1": [1200, 1600, "https://media.cdn.dornbracht.com/v/pzP5WxeG/fit-in:2400x10000/quality:85/LISS%C3%89_Black_03.jpg"],
  "lisse-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/aJLJHCRY/fit-in:2400x10000/quality:85/image.jpg"],
  "lot-1": [1600, 1172, "https://media.cdn.dornbracht.com/v/MakELvWR/fit-in:2400x10000/quality:85/LOT_DPM_01_V1.jpg"],
  "lot-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/ldcJJ1HX/fit-in:2400x10000/quality:85/image.jpg"],
  "lulu-1": [1600, 1573, "https://media.cdn.dornbracht.com/v/RqWfnZau/fit-in:2400x10000/quality:85/LULU_Chrome_01.jpg"],
  "lulu-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/LBNGKtMt/fit-in:2400x10000/quality:85/image.jpg"],
  "lyv-1": [1600, 1600, "https://media.cdn.dornbracht.com/v/rrMBgk7o/fit-in:2400x10000/quality:85/Dornbracht-LYV-Brushed-Nickel.jpg"],
  "lyv-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/4OOnQike/fit-in:2400x10000/quality:85/image.jpg"],
  "madison-1": [1600, 1232, "https://media.cdn.dornbracht.com/v/8ipEDHH7/fit-in:2400x10000/quality:85/MADISON_Durabrass_01_V2.jpg"],
  "madison-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/yuWBEoE5/fit-in:2400x10000/quality:85/image.jpg"],
  "mem-1": [1600, 1252, "https://media.cdn.dornbracht.com/v/i31MZyfD/fit-in:2400x10000/quality:85/MEM_Champagne_01_V1.jpg"],
  "mem-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/PR6cTiz5/fit-in:2400x10000/quality:85/image.jpg"],
  "mem-kueche-1": [1600, 1164, "https://media.cdn.dornbracht.com/v/ocokJtwT/fit-in:2400x10000/quality:85/MEM_Champagne_01_V1.jpg"],
  "mem-kueche-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/SbiDbpi2/fit-in:2400x10000/quality:85/image.jpg"],
  "meta-1": [1600, 1200, "https://media.cdn.dornbracht.com/v/0y5liLFm/fit-in:2400x10000/quality:85/META_Chrome_02_V2.jpg"],
  "meta-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/T3Qxoy30/fit-in:2400x10000/quality:85/image.jpg"],
  "meta-square-1": [1600, 1220, "https://media.cdn.dornbracht.com/v/Rg9FVOaz/fit-in:2400x10000/quality:85/META-_SQUARE_Brushed_Champagne_01_V1.jpg"],
  "meta-square-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/rebzEl4B/fit-in:2400x10000/quality:85/image.jpg"],
  "piur-1": [1600, 1600, "https://media.cdn.dornbracht.com/v/Y1J9HqN0/fit-in:2400x10000/quality:85/Dornbracht-PIUR-Chrom-.jpg"],
  "piur-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/V3D8SDeM/fit-in:2400x10000/quality:85/image.jpg"],
  "rainsky-m-1": [1600, 1020, "https://media.cdn.dornbracht.com/v/jauBAVs7/fit-in:2400x10000/quality:85/JF_DB_PS_RainSky_0002-39L.jpg"],
  "regenbrausen-1": [1600, 1209, "https://media.cdn.dornbracht.com/v/CfnGFi1j/fit-in:2400x10000/quality:85/Dornbracht_Rain-Showers_4.jpg"],
  "regenbrausen-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/PDbybqVZ/fit-in:2400x10000/quality:85/image.jpg"],
  "seitenbrausen-1": [1600, 1280, "https://media.cdn.dornbracht.com/v/QJuV0KvU/fit-in:2400x10000/quality:85/Dornbracht_Shower-Competence_LULU_11_V1.jpg"],
  "seitenbrausen-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/qotaNCoS/fit-in:2400x10000/quality:85/image.jpg"],
  "serenity-sky-1": [1200, 1600, "https://media.cdn.dornbracht.com/v/cMKS2AWu/fit-in:2400x10000/quality:85/Dornbracht_Showers_SERENITY-SKY%2B_PR_FR_Close-Up_01.jpg"],
  "serenity-sky-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/L9O11JBw/fit-in:2400x10000/quality:85/image.jpg"],
  "sync-1": [1600, 1126, "https://media.cdn.dornbracht.com/v/BBOKfaeg/fit-in:2400x10000/quality:85/SYNC_Black-matte_01_V1.jpg"],
  "sync-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/XQKYkUAI/fit-in:2400x10000/quality:85/image.jpg"],
  "tara-1": [1600, 1262, "https://media.cdn.dornbracht.com/v/Eos9BWx5/fit-in:2400x10000/quality:85/TARA_Champagne_01_V1.jpg"],
  "tara-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/QKc3sBrc/fit-in:2400x10000/quality:85/image.jpg"],
  "tara-kueche-1": [1600, 1600, "https://media.cdn.dornbracht.com/v/UXJYMwQF/fit-in:2400x10000/quality:85/image.jpg"],
  "tara-kueche-2": [1235, 1600, "https://media.cdn.dornbracht.com/v/0AuTkSRK/fit-in:2400x10000/quality:85/TARA_Durabrass_01_V1.jpg"],
  "tara-ultra-1": [1600, 1221, "https://media.cdn.dornbracht.com/v/jWeW3cSF/fit-in:2400x10000/quality:85/TARA-ULTRA_Dark-Chrome_01_V1.jpg"],
  "tara-ultra-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/uHDuAjmo/fit-in:2400x10000/quality:85/image.jpg"],
  "touchfree-1": [1440, 845, "https://media.cdn.dornbracht.com/v/ATGZ8jYz/fit-in:2400x10000/quality:85/Dornbracht-luxury-bathroom-faucets-touchfree-infrared-header.jpg"],
  "touchfree-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/s5mAZpeT/fit-in:2400x10000/quality:85/image.jpg"],
  "vaia-1": [1600, 1260, "https://media.cdn.dornbracht.com/v/9SRLJ3GT/fit-in:2400x10000/quality:85/VAIA_Dark-Platinum_01_V1.jpg"],
  "vaia-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/mDlyOKtW/fit-in:2400x10000/quality:85/image.jpg"],
  "vaia-kueche-1": [1600, 1179, "https://media.cdn.dornbracht.com/v/lhiH8Xrj/fit-in:2400x10000/quality:85/VAIA_Brushed_Platinum_02.jpg"],
  "vaia-kueche-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/97zHdmdN/fit-in:2400x10000/quality:85/image.jpg"],
  "vertical-shower-1": [1600, 1137, "https://media.cdn.dornbracht.com/v/npaID2xB/fit-in:2400x10000/quality:85/LifeSpa_25_V1.jpg"],
  "vertical-shower-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/sKsrDFct/fit-in:2400x10000/quality:85/28765980-85_1_35085970_1_36514979-00_1_35085970_1_36513979-00_1_36512979-00_1_27838979-00_1_PA.jpg"],
  "water-modules-1": [1201, 1600, "https://media.cdn.dornbracht.com/v/1jBd5JXn/fit-in:2400x10000/quality:85/JF_DB_PS_WaterFall_0044-39L.jpg"],
  "water-modules-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/OOsEUzIf/fit-in:2400x10000/quality:85/image.jpg"],
  "xtool-1": [1600, 1600, "https://media.cdn.dornbracht.com/v/9101LRr7/fit-in:2400x10000/quality:85/image.jpg"],
  "xtool-2": [617, 450, "https://media.cdn.dornbracht.com/v/TU7DsJvC/fit-in:2400x10000/quality:85/image.jpg"],
  "yamou-1": [1600, 847, "https://media.cdn.dornbracht.com/v/9HpGnYjP/fit-in:2400x10000/quality:85/YAMOU_Chrome_01.jpg"],
  "yamou-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/xFYdKYFN/fit-in:2400x10000/quality:85/image.jpg"],
  "yarre-1": [1600, 847, "https://media.cdn.dornbracht.com/v/0tyW7MbZ/fit-in:2400x10000/quality:85/YARRE_Chrome_01.jpg"],
  "yarre-2": [1600, 1600, "https://media.cdn.dornbracht.com/v/hWJHmFBD/fit-in:2400x10000/quality:85/image.jpg"],
  "coya-3": [1600, 1600, "https://media.cdn.dornbracht.com/v/qoOuIqiG/fit-in:2400x10000/quality:85/COYA_Totale_Projektion_V2.jpg"],
  "cyo-3": [1143, 1600, "https://media.cdn.dornbracht.com/v/DfvVmrKf/fit-in:2400x10000/quality:85/CYO_Architecture_Metropolitan_03_V1.jpg"],
  "mem-3": [1141, 1600, "https://media.cdn.dornbracht.com/v/pg213Yee/fit-in:2400x10000/quality:85/MEM_Set1_038_V2.jpg"],
  "vaia-3": [1600, 1161, "https://media.cdn.dornbracht.com/v/oyH8F8kz/fit-in:2400x10000/quality:85/VAIA_Dark-Platinum_16_V1.jpg"],
  "tara-3": [1600, 1162, "https://media.cdn.dornbracht.com/v/F8YH3Fdl/fit-in:2400x10000/quality:85/TARA_Champagne_05.jpg"],
  "cl-1-3": [1600, 1029, "https://media.cdn.dornbracht.com/v/iUP9jBqH/fit-in:2400x10000/quality:85/CL1_Set2_002_027.jpg"],
  "madison-3": [1200, 771, "https://media.cdn.dornbracht.com/v/yCgbewSG/fit-in:2400x10000/quality:85/Dornbracht-Madison-Platinum-Bathroom-Inspiration-5.jpg"],
  "meta-3": [1600, 1147, "https://media.cdn.dornbracht.com/v/l5ENEGth/fit-in:2400x10000/quality:85/META_Black_04.jpg"],
  "imo-3": [1600, 900, "https://media.cdn.dornbracht.com/v/xOOYe9LA/fit-in:2400x10000/quality:85/IMO_Brushed-Dark-Platinum_Premium-Bathroom_1.jpg"],
  "lisse-3": [1600, 1029, "https://media.cdn.dornbracht.com/v/Bg6MKhpX/fit-in:2400x10000/quality:85/Lisse_4_185_V1.jpg"],
  "lulu-3": [1600, 1185, "https://media.cdn.dornbracht.com/v/lrg4561o/fit-in:2400x10000/quality:85/LULU_Waschtisch_Chrom.jpg"],
  "serenity-sky-3": [1600, 686, "https://media.cdn.dornbracht.com/v/5n4AFXxh/fit-in:2400x10000/quality:85/Collagen_Slider_SeS_1.jpg"],
  "yamou-3": [1600, 1407, "https://media.cdn.dornbracht.com/v/xFD2d18b/fit-in:2400x10000/quality:85/Dornbracht-YAMOU_03.jpg"],
  "yarre-3": [1600, 1407, "https://media.cdn.dornbracht.com/v/IiOn1bk6/fit-in:2400x10000/quality:85/Dornbracht-YARRE_06_v4.jpg"],
  "vaia-kueche-3": [1600, 1067, "https://media.cdn.dornbracht.com/v/xgrxVwp6/fit-in:2400x10000/quality:85/VAIA_Potfiller_Durabrass_06.jpg"],
  "meta-square-3": [1600, 900, "https://media.cdn.dornbracht.com/v/38fUSbkZ/fit-in:2400x10000/quality:85/META_SQUARE_MATTE_BLACK_01.jpg"],
  "tara-ultra-3": [1600, 1067, "https://media.cdn.dornbracht.com/v/0ZVDoNFU/fit-in:2400x10000/quality:85/TARA_ULTRA_POTFILLER_DARK_CHROME_EDITORIAL_01.jpg"],
  "mem-kueche-3": [1600, 900, "https://media.cdn.dornbracht.com/v/pZ44392U/fit-in:2400x10000/quality:85/MEM-_Brushed_Platinum_01.jpg"],
  "sync-3": [1600, 900, "https://media.cdn.dornbracht.com/v/kekcvExp/fit-in:2400x10000/quality:85/SYNC_Dark-Chrome_02.jpg"],
  "tara-kueche-3": [1600, 900, "https://media.cdn.dornbracht.com/v/RD59iS7e/fit-in:2400x10000/quality:85/TARA_Durabrass_02.jpg"],
  "lot-3": [1600, 1011, "https://media.cdn.dornbracht.com/v/KAtOx2KZ/fit-in:2400x10000/quality:85/Lot_Dark-Platinum-matt_01.jpg"],
});

/** Bild-Pfad zu einem Schlüssel aus IMG. */
const src = (key) => `/Images/Wellness/produkte/dornbracht/dornbracht-${key}.webp`;
/** Bild-Objekt; typ: "freisteller" (Produkt im Studio), "ambiente" (Raumbild), "detail" (Nahaufnahme). */
const b = (key, typ, alt) =>
  Object.freeze({
    src: src(key),
    width: IMG[key][0],
    height: IMG[key][1],
    alt,
    quelleUrl: IMG[key][2],
    abgerufen: STAND,
    typ,
  });

/**
 * Oberflächen in vier Sprachen + Dornbracht-Oberflächencode. Die Codes stehen
 * auf dornbracht.com an den Oberflächen-Musterbildern der Serienseiten (z. B.
 * „00_polished chrome“, „06_platinum matt“, „28_brushed Durabrass“, „99_dark
 * platinum matt“) und passen zu den Artikelnummern (z. B. 83 060 892-99).
 */
const OF = {
  chrom: ["Chrom", "Chrome", "Chrome", "Cromo", "00"],
  chromGeb: ["Chrom gebürstet", "Brushed Chrome", "Chrome brossé", "Cromo spazzolato", "93"],
  platin: ["Platin", "Platinum", "Platine", "Platino", "08"],
  platinGeb: ["Platin gebürstet", "Brushed Platinum", "Platine brossé", "Platino spazzolato", "06"],
  champagne: ["Champagne (22kt Gold)", "Champagne (22ct gold)", "Champagne (or 22 carats)", "Champagne (oro 22 carati)", "47"],
  champagneGeb: ["Champagne gebürstet (22kt Gold)", "Brushed Champagne (22ct gold)", "Champagne brossé (or 22 carats)", "Champagne spazzolato (oro 22 carati)", "46"],
  messing: ["Messing (23kt Gold)", "Brass (23ct gold)", "Laiton (or 23 carats)", "Ottone (oro 23 carati)", "09"],
  messingGeb: ["Messing gebürstet (23kt Gold)", "Brushed Brass (23ct gold)", "Laiton brossé (or 23 carats)", "Ottone spazzolato (oro 23 carati)", "28"],
  darkBrassGeb: ["Dark Brass gebürstet (PVD)", "Brushed Dark Brass (PVD)", "Dark Brass brossé (PVD)", "Dark Brass spazzolato (PVD)", "39"],
  bronzeGeb: ["Bronze gebürstet (PVD)", "Brushed Bronze (PVD)", "Bronze brossé (PVD)", "Bronzo spazzolato (PVD)", "42"],
  darkBronzeGeb: ["Dark Bronze gebürstet (PVD)", "Brushed Dark Bronze (PVD)", "Dark Bronze brossé (PVD)", "Dark Bronze spazzolato (PVD)", "43"],
  darkChrome: ["Dark Chrome", "Dark Chrome", "Dark Chrome", "Dark Chrome", "19"],
  darkPlatinumGeb: ["Dark Platinum gebürstet", "Brushed Dark Platinum", "Dark Platinum brossé", "Dark Platinum spazzolato", "99"],
  schwarzMatt: ["Schwarz matt", "Matt Black", "Noir mat", "Nero opaco", "33"],
  weissMatt: ["Weiß matt", "Matt White", "Blanc mat", "Bianco opaco", "10"],
  lightGold: ["Light Gold (PVD)", "Light Gold (PVD)", "Light Gold (PVD)", "Light Gold (PVD)", "26"],
  lightGoldGeb: ["Light Gold gebürstet (PVD)", "Brushed Light Gold (PVD)", "Light Gold brossé (PVD)", "Light Gold spazzolato (PVD)", "27"],
  goldGeb: ["Gold gebürstet (PVD)", "Brushed Gold (PVD)", "Or brossé (PVD)", "Oro spazzolato (PVD)", "37"],
  rot: ["Rot", "Red", "Rouge", "Rosso", "29"],
  orange: ["Orange", "Orange", "Orange", "Arancione", "30"],
  edelstahlGeb: ["Edelstahl gebürstet", "Brushed Stainless Steel", "Inox brossé", "Acciaio inox spazzolato", "86"],
  edelstahlFinishGeb: ["Edelstahl Finish gebürstet", "Brushed stainless steel finish", "Finition inox brossée", "Finitura acciaio inox spazzolato", "70"],
  softBlack: ["Soft Black", "Soft Black", "Soft Black", "Soft Black", "69"],
  platinBi: ["Platin / Platin gebürstet (Dreilochbatterie)", "Platinum / Brushed Platinum (three-hole mixer)", "Platine / Platine brossé (mélangeur trois trous)", "Platino / Platino spazzolato (miscelatore a tre fori)", "36"],
  messingBi: ["Messing / Messing gebürstet (23kt Gold, Dreilochbatterie)", "Brass / Brushed Brass (23ct gold, three-hole mixer)", "Laiton / Laiton brossé (or 23 carats, mélangeur trois trous)", "Ottone / Ottone spazzolato (oro 23 carati, miscelatore a tre fori)", "38"],
};
const kebab = (s) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
const G = (de, en, fr, it) => T(de, en, fr, it);
/** Konfigurator-Gruppe aus [id, name] (name: Text4 oder sprachneutral). */
const gruppe = (name, optionen) =>
  Object.freeze({ gruppe: name, optionen: Object.freeze(optionen.map(([id, n, extra]) => Object.freeze({ id, name: n, ...(extra || {}) }))) });
/** Oberflächen als Konfigurator-Gruppe; Chrom = Standard, optional mit Chrom-Produktbild. */
const oberflaechen = (keys, chromBild) =>
  gruppe(
    G("Oberfläche", "Finish", "Finition", "Finitura"),
    keys.map((k) => [
      kebab(k),
      T(OF[k][0], OF[k][1], OF[k][2], OF[k][3]),
      { code: OF[k][4], ...(k === "chrom" ? { standard: true, ...(chromBild ? { bilder: Object.freeze([src(chromBild)]) } : {}) } : {}) },
    ])
  );

/** Einsatzbereiche einer Serie. */
const AB = {
  waschtisch: ["Waschtisch", "Washbasin", "Lavabo", "Lavabo"],
  wanne: ["Wanne", "Bath", "Baignoire", "Vasca"],
  dusche: ["Dusche", "Shower", "Douche", "Doccia"],
  bidet: ["Bidet", "Bidet", "Bidet", "Bidet"],
  accessoires: ["Accessoires", "Accessories", "Accessoires", "Accessori"],
};
const anwendung = (...keys) => gruppe(G("Einsatzbereich", "Application", "Application", "Applicazione"), keys.map((k) => [k, T(...AB[k])]));
const GRIFF = G("Griff", "Handle", "Poignée", "Maniglia");
const AUSF = G("Ausführung", "Version", "Version", "Versione");
const FUNKTION = G("Funktion", "Function", "Fonction", "Funzione");
const GROESSE = G("Größe", "Size", "Taille", "Misura");
const z = (...slugs) => Object.freeze(slugs.map((s) => Object.freeze({ slug: `dornbracht-${s}` })));

const touchfreeVariante = T(
  "Auch als berührungslose TOUCHFREE-Waschtischarmatur erhältlich",
  "Also available as a touch-free TOUCHFREE basin mixer",
  "Également disponible en mitigeur de lavabo sans contact TOUCHFREE",
  "Disponibile anche come miscelatore per lavabo senza contatto TOUCHFREE"
);

const produkt = (p) =>
  Object.freeze({
    marke: "dornbracht",
    stand: STAND,
    ...p,
    merkmale: Object.freeze(p.merkmale),
    bilder: Object.freeze(p.bilder),
    quellen: Object.freeze(p.quellen),
  });

const U = {
  badserien: `${DA}designserien/badserien/`,
  spaserien: `${DA}designserien/spa-serien/`,
  kuechenserien: `${DA}designserien/kuechenserien/`,
  bidet: `${DA}bad/bidetarmaturen/`,
  accessoires: `${DA}bad/accessoires/`,
  touchfree: `${DA}bad/inhalt/touchfree`,
  spaDuschen: `${DA}bad/duschen/spa-duschen`,
  projektserien: `${DA}professional/projektserien`,
  upThermostate: `${DA}bad/unterputzkoerper/unterputz-thermostate`,
  piurLyv: `${DA}professional/inhalt/piur-lyv`,
};

/** @type {import("../schema.js").KatalogMarke} */
export const MARKE = Object.freeze({
  slug: "dornbracht",
  name: "Dornbracht",
  welt: "bad-wellness",
  herstellerUrl: "https://www.dornbracht.com/de-de/",
  // Händlersatz nur über den Claim-Guard (dealerStatement); hier nur der Schalter.
  dealer: true,
  stand: STAND,
  // Küchenarmaturen/-becken (KUECHE_VORBEREITET) – Link erscheint, sobald die Zielkategorie Produkte hat.
  querverweise: Object.freeze([Object.freeze({ welt: "kuechengeraete", kategorie: "armatur" }), Object.freeze({ welt: "kuechengeraete", kategorie: "spuele" })]),
  // Raumszenen („Ganze Räume ansehen“) – nur Produkte, die im Bild erkennbar sind.
  looks: Object.freeze([
    Object.freeze({ id: "coya-bad", titel: T("Bad mit COYA", "Bathroom with COYA", "Salle de bains avec COYA", "Bagno con COYA"), bild: b("coya-3", "ambiente", T("Dornbracht COYA im Bad: Waschplatz in einem Raum mit Baum-Wandbild, runder Spiegel und Teppich", "Dornbracht COYA in the bathroom: washstand in a room with a tree mural, round mirror and rug", "Dornbracht COYA dans la salle de bains : coin lavabo dans une pièce à fresque d’arbre, miroir rond et tapis", "Dornbracht COYA in bagno: zona lavabo in un ambiente con murale ad albero, specchio tondo e tappeto")), produkte: Object.freeze(["dornbracht-coya"]) }),
    Object.freeze({ id: "mem-dusche", titel: T("Dusche mit MEM und Regenbrause", "Shower with MEM and rain shower", "Douche avec MEM et douche pluie", "Doccia con MEM e soffione"), bild: b("mem-3", "ambiente", T("Dornbracht MEM in der Dusche: Regenbrause, Bedienelemente und Handbrause an einer Travertinwand", "Dornbracht MEM in the shower: rain shower, controls and hand shower on a travertine wall", "Dornbracht MEM en douche : douche pluie, commandes et douchette sur un mur en travertin", "Dornbracht MEM in doccia: soffione, comandi e doccetta su una parete in travertino")), produkte: Object.freeze(["dornbracht-mem", "dornbracht-regenbrausen", "dornbracht-handbrausen"]) }),
    Object.freeze({ id: "vaia-waschplatz", titel: T("Waschplatz mit VAIA", "Washstand with VAIA", "Coin lavabo avec VAIA", "Zona lavabo con VAIA"), bild: b("vaia-3", "ambiente", T("Dornbracht VAIA im Bad: Einlocharmatur mit Kreuzgriff in dunkler Oberfläche an einem Waschtisch", "Dornbracht VAIA in the bathroom: single-hole tap with cross handle in a dark finish at a washbasin", "Dornbracht VAIA dans la salle de bains : robinet monotrou à croisillon, finition sombre, sur un lavabo", "Dornbracht VAIA in bagno: rubinetto monoforo con maniglia a croce in finitura scura su un lavabo")), produkte: Object.freeze(["dornbracht-vaia"]) }),
    Object.freeze({ id: "tara-champagne", titel: T("TARA in Champagne am Waschtisch", "TARA in Champagne at the washbasin", "TARA Champagne au lavabo", "TARA in Champagne al lavabo"), bild: b("tara-3", "ambiente", T("Dornbracht TARA im Bad: Dreilochbatterie in Champagne an einem Steinwaschtisch vor grüner Wand", "Dornbracht TARA in the bathroom: three-hole mixer in Champagne at a stone washbasin against a green wall", "Dornbracht TARA dans la salle de bains : mélangeur trois trous Champagne sur un lavabo en pierre devant un mur vert", "Dornbracht TARA in bagno: miscelatore a tre fori in Champagne su un lavabo in pietra davanti a una parete verde")), produkte: Object.freeze(["dornbracht-tara"]) }),
    Object.freeze({ id: "tara-dusche-champagne", titel: T("Bad mit TARA und Duschsystem in Champagne gebürstet", "Bathroom with TARA and shower system in Brushed Champagne", "Salle de bains avec TARA et système de douche Champagne brossé", "Bagno con TARA e sistema doccia in Champagne spazzolato"), bild: b("duschsysteme-1", "ambiente", T("Dornbracht Duschsystem in einem Bad mit grüner Marmorwand, Armaturen in Champagne gebürstet", "Dornbracht shower system in a bathroom with green marble wall, fittings in Brushed Champagne", "Système de douche Dornbracht dans une salle de bains au mur de marbre vert, robinetterie Champagne brossé", "Sistema doccia Dornbracht in un bagno con parete in marmo verde, rubinetteria Champagne spazzolato")), produkte: Object.freeze(["dornbracht-tara", "dornbracht-duschsysteme"]) }),
    Object.freeze({ id: "imo-premium-bad", titel: T("Helles Bad mit IMO", "Light bathroom with IMO", "Salle de bains claire avec IMO", "Bagno chiaro con IMO"), bild: b("imo-3", "ambiente", T("Dornbracht IMO im Bad: helles Bad in Salbeigrün mit Waschtisch, freistehender Wanne und Dusche", "Dornbracht IMO in the bathroom: light sage-green bathroom with washbasin, freestanding bath and shower", "Dornbracht IMO dans la salle de bains : salle de bains vert sauge avec lavabo, baignoire îlot et douche", "Dornbracht IMO in bagno: bagno verde salvia con lavabo, vasca freestanding e doccia")), produkte: Object.freeze(["dornbracht-imo"]) }),
    Object.freeze({ id: "meta-schwarz", titel: T("META in Schwarz matt am Waschtisch", "META in matt black at the washbasin", "META noir mat au lavabo", "META nero opaco al lavabo"), bild: b("meta-3", "ambiente", T("Dornbracht META im Bad: Waschtischarmatur in Schwarz matt an einem hellen Waschtisch mit Unterbaubecken", "Dornbracht META in the bathroom: basin mixer in matt black at a light vanity with undermount basin", "Dornbracht META dans la salle de bains : mitigeur noir mat sur un plan clair à vasque sous plan", "Dornbracht META in bagno: miscelatore nero opaco su un piano chiaro con lavabo sottopiano")), produkte: Object.freeze(["dornbracht-meta"]) }),
    Object.freeze({ id: "lulu-waschtisch", titel: T("LULU am Aufsatzbecken", "LULU at a countertop basin", "LULU sur vasque à poser", "LULU su lavabo d’appoggio"), bild: b("lulu-3", "ambiente", T("Dornbracht LULU im Bad: Waschtischarmatur in Chrom auf einem Aufsatzbecken mit roter Ablage", "Dornbracht LULU in the bathroom: basin mixer in chrome on a countertop basin with red shelf", "Dornbracht LULU dans la salle de bains : mitigeur chromé sur vasque à poser avec tablette rouge", "Dornbracht LULU in bagno: miscelatore cromato su lavabo d’appoggio con mensola rossa")), produkte: Object.freeze(["dornbracht-lulu"]) }),
    Object.freeze({ id: "cl-1-wanne", titel: T("Badewanne mit CL.1", "Bathtub with CL.1", "Baignoire avec CL.1", "Vasca con CL.1"), bild: b("cl-1-3", "ambiente", T("Dornbracht CL.1 an der Wanne: Wannenarmatur mit Sprayface, Wasser fällt in die gefüllte Badewanne", "Dornbracht CL.1 at the bath: bath mixer with sprayface, water falling into the filled bathtub", "Dornbracht CL.1 sur la baignoire : mélangeur avec sprayface, l’eau tombe dans la baignoire remplie", "Dornbracht CL.1 sulla vasca: miscelatore con sprayface, l’acqua cade nella vasca piena")), produkte: Object.freeze(["dornbracht-cl-1"]) }),
    Object.freeze({ id: "aquahalo-spa", titel: T("Spa-Bad mit AQUAHALO", "Spa bathroom with AQUAHALO", "Salle de bains spa avec AQUAHALO", "Bagno spa con AQUAHALO"), bild: b("aquahalo-1", "ambiente", T("Dornbracht AQUAHALO: ringförmige Duschskulptur mit allen Strahlarten in einem runden, holzvertäfelten Bad", "Dornbracht AQUAHALO: ring-shaped shower sculpture with all spray types in a round, wood-panelled bathroom", "Dornbracht AQUAHALO : sculpture de douche annulaire, tous jets actifs, dans une salle de bains ronde lambrissée", "Dornbracht AQUAHALO: scultura doccia ad anello con tutti i getti in un bagno rotondo rivestito in legno")), produkte: Object.freeze(["dornbracht-aquahalo"]) }),
    Object.freeze({ id: "serenity-sky-bad", titel: T("Offenes Bad mit SERENITY SKY", "Open bathroom with SERENITY SKY", "Salle de bains ouverte avec SERENITY SKY", "Bagno aperto con SERENITY SKY"), bild: b("serenity-sky-3", "ambiente", T("Dornbracht SERENITY SKY: Dusche mit Deckenpaneel in einem begrünten, offenen Bad, Collage", "Dornbracht SERENITY SKY: shower with ceiling panel in a green, open bathroom, collage", "Dornbracht SERENITY SKY : douche à panneau de plafond dans une salle de bains ouverte et végétalisée, collage", "Dornbracht SERENITY SKY: doccia con pannello a soffitto in un bagno aperto e verde, collage")), produkte: Object.freeze(["dornbracht-serenity-sky"]) }),
    Object.freeze({ id: "comfort-shower-bank", titel: T("Begehbare Dusche mit Bank: COMFORT SHOWER", "Walk-in shower with bench: COMFORT SHOWER", "Douche à l’italienne avec banc : COMFORT SHOWER", "Doccia walk-in con panca: COMFORT SHOWER"), bild: b("comfort-shower-1", "ambiente", T("Dornbracht COMFORT SHOWER: begehbare Dusche mit Steinbank, Person sitzend unter der Regendusche", "Dornbracht COMFORT SHOWER: walk-in shower with stone bench, person seated beneath the rain shower", "Dornbracht COMFORT SHOWER : douche à l’italienne avec banc en pierre, personne assise sous la douche pluie", "Dornbracht COMFORT SHOWER: doccia walk-in con panca in pietra, persona seduta sotto il soffione")), produkte: Object.freeze(["dornbracht-comfort-shower"]) }),
  ]),
});

/** Bad & Wellness (Welt der Marke). @type {import("../schema.js").KatalogProdukt[]} */
const BAD_WELLNESS = Object.freeze([
  // ------------------------------------------------------------ Bad-Armaturen (Designserien)
  produkt({
    slug: "dornbracht-coya",
    bereich: "bad",
    kategorie: "armatur",
    name: "COYA",
    kurz: T(
      "Armaturenserie, deren Auslauf, Rosette und Griff einer gemeinsamen Grundform zwischen Kreis und Quadrat folgen, dem „Squircle“. Entworfen von Sieger Design, mit Produkten für Waschtisch, Wanne und Dusche.",
      "Tap series whose spout, rosette and handle share one basic form between circle and square, the “squircle”. Designed by Sieger Design, with products for washbasin, bath and shower.",
      "Série de robinetterie dont le bec, la rosace et la poignée suivent une même forme entre cercle et carré, le « squircle ». Dessinée par Sieger Design, avec des produits pour lavabo, baignoire et douche.",
      "Serie di rubinetteria in cui bocca, rosetta e maniglia seguono una forma comune tra cerchio e quadrato, lo “squircle”. Disegnata da Sieger Design, con prodotti per lavabo, vasca e doccia."
    ),
    merkmale: [
      T(
        "Gewölbte, ergonomisch geformte Griffe; über Dornbracht Atelier mit Edelstein-Inlays (z. B. Amazonit, Sodalith, Aventurin)",
        "Domed, ergonomically shaped handles; gemstone inlays (e.g. amazonite, sodalite, aventurine) via Dornbracht Atelier",
        "Poignées bombées et ergonomiques ; incrustations de pierres (p. ex. amazonite, sodalite, aventurine) via Dornbracht Atelier",
        "Maniglie bombate ed ergonomiche; intarsi in pietra (ad es. amazzonite, sodalite, avventurina) tramite Dornbracht Atelier"
      ),
      T(
        "Atelier Edition THE KNOT mit skulpturalen Griffen, gestaltet mit dem Designstudio AB Concept",
        "Atelier Edition THE KNOT with sculptural handles, created with the design studio AB Concept",
        "Atelier Edition THE KNOT aux poignées sculpturales, conçue avec le studio de design AB Concept",
        "Atelier Edition THE KNOT con maniglie scultoree, realizzata con lo studio di design AB Concept"
      ),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "platinGeb", "messingGeb", "bronzeGeb", "darkBronzeGeb", "darkChrome", "darkPlatinumGeb"], "coya-2"),
      anwendung("waschtisch", "wanne", "dusche", "bidet", "accessoires"),
    ]),
    zubehoer: z("bad-accessoires", "brausegarnituren", "duschsysteme", "regenbrausen", "kopfbrausen"),
    bilder: [
      b("coya-1", "freisteller", T("Dornbracht COYA: Waschtisch-Dreilochbatterie mit gewölbten Griffen in goldfarbener Oberfläche vor hellem Hintergrund", "Dornbracht COYA: three-hole basin mixer with domed handles in a gold-coloured finish against a light background", "Dornbracht COYA : mélangeur de lavabo trois trous à poignées bombées, finition dorée sur fond clair", "Dornbracht COYA: miscelatore per lavabo a tre fori con maniglie bombate in finitura dorata su sfondo chiaro")),
      b("coya-2", "freisteller", T("Dornbracht COYA: Waschtisch-Einhandbatterie in Chrom, Produktfoto auf weißem Grund", "Dornbracht COYA: single-lever basin mixer in chrome, product shot on white", "Dornbracht COYA : mitigeur de lavabo chromé, photo produit sur fond blanc", "Dornbracht COYA: miscelatore monocomando per lavabo cromato, foto prodotto su fondo bianco")),
      b("coya-3", "ambiente", T("Dornbracht COYA im Bad: Waschplatz in einem Raum mit Baum-Wandbild, runder Spiegel und Teppich", "Dornbracht COYA in the bathroom: washstand in a room with a tree mural, round mirror and rug", "Dornbracht COYA dans la salle de bains : coin lavabo dans une pièce à fresque d’arbre, miroir rond et tapis", "Dornbracht COYA in bagno: zona lavabo in un ambiente con murale ad albero, specchio tondo e tappeto")),
    ],
    herstellerUrl: `${U.badserien}coya`,
    quellen: [`${U.badserien}coya`, U.bidet, U.accessoires],
  }),
  produkt({
    slug: "dornbracht-cyo",
    bereich: "bad",
    kategorie: "armatur",
    name: "CYO",
    kurz: T(
      "Armaturenserie mit neu interpretiertem C-Auslauf und kreisrunden Griffen, Design: Sieger Design. Griffeinsätze und Armatur lassen sich in verschiedenen Oberflächen kombinieren.",
      "Tap series with a reinterpreted C-shaped spout and circular handles, design: Sieger Design. Handle inserts and tap body can be combined in different finishes.",
      "Série de robinetterie au bec en C réinterprété et aux poignées circulaires, design : Sieger Design. Inserts de poignée et corps se combinent dans différentes finitions.",
      "Serie di rubinetteria con bocca a C reinterpretata e maniglie circolari, design: Sieger Design. Inserti delle maniglie e corpo si combinano in diverse finiture."
    ),
    merkmale: [
      T(
        "Griffeinsätze u. a. in Naturstein: Nero Marquina poliert, Bianco Carrara C, Verde Guatemala",
        "Handle inserts including natural stone: Nero Marquina polished, Bianco Carrara C, Verde Guatemala",
        "Inserts de poignée notamment en pierre naturelle : Nero Marquina poli, Bianco Carrara C, Verde Guatemala",
        "Inserti delle maniglie anche in pietra naturale: Nero Marquina lucido, Bianco Carrara C, Verde Guatemala"
      ),
      T(
        "Dreilochbatterie auch bi-struktural: Platin / Platin gebürstet und Messing / Messing gebürstet (23kt Gold)",
        "Three-hole mixer also in bi-structural finishes: Platinum / Brushed Platinum and Brass / Brushed Brass (23ct gold)",
        "Mélangeur trois trous aussi en finition bi-structurelle : Platine / Platine brossé et Laiton / Laiton brossé (or 23 carats)",
        "Miscelatore a tre fori anche in finitura bi-strutturale: Platino / Platino spazzolato e Ottone / Ottone spazzolato (oro 23 carati)"
      ),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "platinGeb", "messingGeb", "darkPlatinumGeb"], "cyo-2"),
      anwendung("waschtisch", "wanne", "dusche"),
      gruppe(G("Griffeinsatz", "Handle insert", "Insert de poignée", "Inserto maniglia"), [["nero-marquina", T("Naturstein Nero Marquina, poliert", "Natural stone Nero Marquina, polished", "Pierre naturelle Nero Marquina, polie", "Pietra naturale Nero Marquina, lucida")], ["bianco-carrara-c", T("Naturstein Bianco Carrara C", "Natural stone Bianco Carrara C", "Pierre naturelle Bianco Carrara C", "Pietra naturale Bianco Carrara C")], ["verde-guatemala", T("Naturstein Verde Guatemala", "Natural stone Verde Guatemala", "Pierre naturelle Verde Guatemala", "Pietra naturale Verde Guatemala")]]),
    ]),
    zubehoer: z("xtool"),
    bilder: [
      b("cyo-1", "freisteller", T("Dornbracht CYO: Dreilochbatterie mit C-Auslauf in goldfarbener Oberfläche am Wannenrand", "Dornbracht CYO: three-hole mixer with C-shaped spout in a gold-coloured finish on a bath rim", "Dornbracht CYO : mélangeur trois trous à bec en C, finition dorée, sur un bord de baignoire", "Dornbracht CYO: miscelatore a tre fori con bocca a C in finitura dorata sul bordo vasca")),
      b("cyo-2", "freisteller", T("Dornbracht CYO: Waschtisch-Einhandbatterie in Chrom, Produktfoto", "Dornbracht CYO: single-lever basin mixer in chrome, product shot", "Dornbracht CYO : mitigeur de lavabo chromé, photo produit", "Dornbracht CYO: miscelatore monocomando per lavabo cromato, foto prodotto")),
      b("cyo-3", "ambiente", T("Dornbracht CYO: Waschtischarmatur in Messing auf grünem Marmor vor einer Stadtsilhouette bei Abendlicht", "Dornbracht CYO: basin tap in brass on green marble against a city skyline at dusk", "Dornbracht CYO : robinet de lavabo en laiton sur marbre vert devant une silhouette urbaine au crépuscule", "Dornbracht CYO: rubinetto per lavabo in ottone su marmo verde davanti a uno skyline al tramonto")),
    ],
    herstellerUrl: `${U.badserien}cyo`,
    quellen: [`${U.badserien}cyo`],
  }),
  produkt({
    slug: "dornbracht-mem",
    bereich: "bad",
    kategorie: "armatur",
    name: "MEM",
    kurz: T(
      "Reduzierte Armaturenserie mit bogenförmiger Kontur und flachem, breitem Auslauf; ein integrierter Luftsprudler formt bei allen Waschtischarmaturen einen weichen Strahl. Lösungen von der Dreiloch- bis zur Einhandbatterie, stehend oder an der Wand.",
      "Reduced tap series with an arched contour and a flat, wide spout; an integrated aerator gives all basin taps a soft jet. Solutions from three-hole to single-lever mixers, deck- or wall-mounted.",
      "Série de robinetterie épurée au profil en arc et au bec plat et large ; un aérateur intégré donne un jet doux à toute la robinetterie de lavabo. Du mélangeur trois trous au mitigeur, sur plage ou mural.",
      "Serie di rubinetteria essenziale con profilo ad arco e bocca piatta e larga; un aeratore integrato crea un getto morbido in tutti i rubinetti per lavabo. Dal miscelatore a tre fori al monocomando, da piano o a parete."
    ),
    merkmale: [
      T(
        "Griffvarianten, u. a. mit Hammerschlag-Struktur; Lösungen auch für kleine Waschtische",
        "Handle variants, including a hammered texture; solutions for small washbasins too",
        "Variantes de poignées, notamment à structure martelée ; solutions aussi pour petits lavabos",
        "Varianti di maniglie, anche con struttura martellata; soluzioni anche per lavabi piccoli"
      ),
      T(
        "In der Dusche u. a. mit Regenbrause oder Schwallauslauf kombinierbar",
        "In the shower it can be combined with a rain shower or a cascade spout, among others",
        "En douche, combinable notamment avec une douche pluie ou un bec cascade",
        "In doccia abbinabile, tra l’altro, a soffione a pioggia o bocca a cascata"
      ),
      T(
        "Kollaborationen mit Glass Design und Nature Squared (Details aus Glas bzw. Naturmaterialien)",
        "Collaborations with Glass Design and Nature Squared (details in glass or natural materials)",
        "Collaborations avec Glass Design et Nature Squared (détails en verre ou en matériaux naturels)",
        "Collaborazioni con Glass Design e Nature Squared (dettagli in vetro o materiali naturali)"
      ),
      touchfreeVariante,
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "platin", "platinGeb", "messingGeb", "champagne", "champagneGeb", "darkPlatinumGeb", "darkBronzeGeb", "darkChrome"], "mem-2"),
      anwendung("waschtisch", "wanne", "dusche"),
    ]),
    zubehoer: z("regenbrausen", "touchfree"),
    bilder: [
      b("mem-1", "freisteller", T("Dornbracht MEM: Waschtisch-Dreilochbatterie mit bogenförmigem Auslauf in Champagne am Beckenrand mit Wasserfläche", "Dornbracht MEM: three-hole basin mixer with arched spout in Champagne on a basin rim with water surface", "Dornbracht MEM : mélangeur de lavabo trois trous à bec en arc, finition Champagne, au bord d’un bassin", "Dornbracht MEM: miscelatore per lavabo a tre fori con bocca ad arco in Champagne sul bordo di una vasca d’acqua")),
      b("mem-2", "freisteller", T("Dornbracht MEM: Waschtisch-Einhandbatterie in Chrom, Produktfoto", "Dornbracht MEM: single-lever basin mixer in chrome, product shot", "Dornbracht MEM : mitigeur de lavabo chromé, photo produit", "Dornbracht MEM: miscelatore monocomando per lavabo cromato, foto prodotto")),
      b("mem-3", "ambiente", T("Dornbracht MEM in der Dusche: Regenbrause, Bedienelemente und Handbrause an einer Travertinwand", "Dornbracht MEM in the shower: rain shower, controls and hand shower on a travertine wall", "Dornbracht MEM en douche : douche pluie, commandes et douchette sur un mur en travertin", "Dornbracht MEM in doccia: soffione, comandi e doccetta su una parete in travertino")),
    ],
    herstellerUrl: `${U.badserien}mem`,
    quellen: [`${U.badserien}mem`, `${U.kuechenserien}mem`, U.touchfree],
  }),
  produkt({
    slug: "dornbracht-vaia",
    bereich: "bad",
    kategorie: "armatur",
    name: "VAIA",
    kurz: T(
      "Armaturenserie mit weichen Radien, feiner Silhouette und filigranem, offenem Auslauf, die klassische und zeitgenössische Elemente verbindet. Design: Sieger Design; Armaturen und Accessoires für Waschtisch, Dusche, Wanne und Bidet.",
      "Tap series with soft radii, a fine silhouette and a delicate, open spout that combines classic and contemporary elements. Design: Sieger Design; taps and accessories for washbasin, shower, bath and bidet.",
      "Série de robinetterie aux rayons doux, à la silhouette fine et au bec ouvert et délicat, entre classique et contemporain. Design : Sieger Design ; robinetterie et accessoires pour lavabo, douche, baignoire et bidet.",
      "Serie di rubinetteria con raggi morbidi, silhouette sottile e bocca aperta e filigranata, tra classico e contemporaneo. Design: Sieger Design; rubinetteria e accessori per lavabo, doccia, vasca e bidet."
    ),
    merkmale: [
      T("Wahlweise mit Kreuz- oder Hebelgriffen; Lösungen auch für kleine Waschtische", "Choice of cross or lever handles; solutions for small washbasins too", "Au choix poignées croisillon ou leviers ; solutions aussi pour petits lavabos", "A scelta con maniglie a croce o a leva; soluzioni anche per lavabi piccoli"),
      touchfreeVariante,
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "platin", "platinGeb", "champagne", "champagneGeb", "messingGeb", "darkBrassGeb", "bronzeGeb", "darkBronzeGeb", "darkPlatinumGeb", "darkChrome"], "vaia-2"),
      anwendung("waschtisch", "dusche", "wanne", "bidet", "accessoires"),
      gruppe(GRIFF, [["kreuzgriff", T("Kreuzgriff", "Cross handle", "Croisillon", "Maniglia a croce")], ["hebelgriff", T("Hebelgriff", "Lever handle", "Levier", "Maniglia a leva")]]),
    ]),
    zubehoer: z("bad-accessoires", "brausegarnituren", "duschsysteme", "xtool", "touchfree"),
    bilder: [
      b("vaia-1", "freisteller", T("Dornbracht VAIA: Waschtisch-Dreilochbatterie mit Kreuzgriffen in dunkler Oberfläche vor farbigem Hintergrund", "Dornbracht VAIA: three-hole basin mixer with cross handles in a dark finish against a coloured background", "Dornbracht VAIA : mélangeur de lavabo trois trous à croisillons, finition sombre sur fond coloré", "Dornbracht VAIA: miscelatore per lavabo a tre fori con maniglie a croce in finitura scura su sfondo colorato")),
      b("vaia-2", "freisteller", T("Dornbracht VAIA: Waschtisch-Dreilochbatterie in Chrom, Produktfoto", "Dornbracht VAIA: three-hole basin mixer in chrome, product shot", "Dornbracht VAIA : mélangeur de lavabo trois trous chromé, photo produit", "Dornbracht VAIA: miscelatore per lavabo a tre fori cromato, foto prodotto")),
      b("vaia-3", "ambiente", T("Dornbracht VAIA im Bad: Einlocharmatur mit Kreuzgriff in dunkler Oberfläche an einem Waschtisch", "Dornbracht VAIA in the bathroom: single-hole tap with cross handle in a dark finish at a washbasin", "Dornbracht VAIA dans la salle de bains : robinet monotrou à croisillon, finition sombre, sur un lavabo", "Dornbracht VAIA in bagno: rubinetto monoforo con maniglia a croce in finitura scura su un lavabo")),
    ],
    herstellerUrl: `${U.badserien}vaia`,
    quellen: [`${U.badserien}vaia`, U.bidet, U.touchfree],
  }),
  produkt({
    slug: "dornbracht-tara",
    bereich: "bad",
    kategorie: "armatur",
    name: "TARA",
    kurz: T(
      "Armaturenserie aus Rundauslauf und Kreuzgriffen, deren Proportionen laut Hersteller dem Goldenen Schnitt folgen. Design: Sieger Design; auch als Hebelvariante und mit Strukturgriffen erhältlich.",
      "Tap series made of a round spout and cross handles whose proportions, according to the manufacturer, follow the golden ratio. Design: Sieger Design; also available with levers and textured handles.",
      "Série de robinetterie associant bec rond et croisillons, dont les proportions suivent selon le fabricant le nombre d’or. Design : Sieger Design ; existe aussi avec leviers et poignées structurées.",
      "Serie di rubinetteria con bocca tonda e maniglie a croce, le cui proporzioni secondo il produttore seguono la sezione aurea. Design: Sieger Design; disponibile anche con leve e maniglie strutturate."
    ),
    merkmale: [
      T("Hebelvariante für alle Waschtischarmaturen und -typen, auch mit Strukturgriffen", "Lever version for all basin taps and types, also with textured handles", "Version à levier pour tous les types de robinetterie de lavabo, aussi avec poignées structurées", "Versione a leva per tutti i tipi di rubinetteria per lavabo, anche con maniglie strutturate"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "platin", "platinGeb", "champagne", "champagneGeb", "messingGeb", "darkBrassGeb", "bronzeGeb", "darkBronzeGeb", "darkChrome", "darkPlatinumGeb", "schwarzMatt"], "tara-2"),
      anwendung("waschtisch", "wanne", "dusche", "bidet", "accessoires"),
      gruppe(GRIFF, [["kreuzgriff", T("Kreuzgriff", "Cross handle", "Croisillon", "Maniglia a croce")], ["hebelgriff", T("Hebelgriff", "Lever handle", "Levier", "Maniglia a leva")], ["strukturgriff", T("Hebel mit Strukturgriff", "Lever with textured handle", "Levier à poignée structurée", "Leva con maniglia strutturata")]]),
    ]),
    zubehoer: z("bad-accessoires", "brausegarnituren", "duschsysteme"),
    bilder: [
      b("tara-1", "freisteller", T("Dornbracht TARA: Waschtischarmatur mit Rundauslauf und Kreuzgriffen in Champagne am Beckenrand", "Dornbracht TARA: basin tap with round spout and cross handles in Champagne on a basin rim", "Dornbracht TARA : robinet de lavabo à bec rond et croisillons, finition Champagne, au bord d’une vasque", "Dornbracht TARA: rubinetto per lavabo con bocca tonda e maniglie a croce in Champagne sul bordo del lavabo")),
      b("tara-2", "freisteller", T("Dornbracht TARA: Waschtisch-Einhandbatterie in Chrom, Produktfoto", "Dornbracht TARA: single-lever basin mixer in chrome, product shot", "Dornbracht TARA : mitigeur de lavabo chromé, photo produit", "Dornbracht TARA: miscelatore monocomando per lavabo cromato, foto prodotto")),
      b("tara-3", "ambiente", T("Dornbracht TARA im Bad: Dreilochbatterie in Champagne an einem Steinwaschtisch vor grüner Wand", "Dornbracht TARA in the bathroom: three-hole mixer in Champagne at a stone washbasin against a green wall", "Dornbracht TARA dans la salle de bains : mélangeur trois trous Champagne sur un lavabo en pierre devant un mur vert", "Dornbracht TARA in bagno: miscelatore a tre fori in Champagne su un lavabo in pietra davanti a una parete verde")),
    ],
    herstellerUrl: `${U.badserien}tara`,
    quellen: [`${U.badserien}tara`, U.bidet, U.accessoires],
  }),
  produkt({
    slug: "dornbracht-cl-1",
    bereich: "bad",
    kategorie: "armatur",
    name: "CL.1",
    kurz: T(
      "Armaturenserie mit Mix aus Texturen und Oberflächen, kombinierbar mit glatten oder strukturierten Griffen. Design: Sieger Design; am Waschtisch mit eigenem Sprayface aus 40 weichen Einzelstrahlen.",
      "Tap series mixing textures and finishes, combinable with smooth or textured handles. Design: Sieger Design; at the washbasin with its own sprayface of 40 soft individual jets.",
      "Série de robinetterie mêlant textures et finitions, combinable avec des poignées lisses ou structurées. Design : Sieger Design ; au lavabo, sprayface propre de 40 jets individuels doux.",
      "Serie di rubinetteria che unisce texture e finiture, abbinabile a maniglie lisce o strutturate. Design: Sieger Design; al lavabo con sprayface dedicato da 40 getti singoli morbidi."
    ),
    merkmale: [
      T("Waschtisch: Einhandbatterie stehend oder an der Wand, Dreilochbatterie", "Washbasin: single-lever mixer deck- or wall-mounted, three-hole mixer", "Lavabo : mitigeur sur plage ou mural, mélangeur trois trous", "Lavabo: monocomando da piano o a parete, miscelatore a tre fori"),
      T("Wannen-Fünflochbatterie mit Sprayface aus 55 Einzelstrahlen", "Five-hole bath mixer with a sprayface of 55 individual jets", "Mélangeur de baignoire cinq trous avec sprayface de 55 jets individuels", "Miscelatore per vasca a cinque fori con sprayface da 55 getti singoli"),
      T("Griffe glatt oder strukturiert", "Smooth or textured handles", "Poignées lisses ou structurées", "Maniglie lisce o strutturate"),
      touchfreeVariante,
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "platinGeb", "darkPlatinumGeb"], "cl-1-2"),
      anwendung("waschtisch", "dusche", "wanne", "accessoires"),
      gruppe(GRIFF, [["glatt", T("Glatt", "Smooth", "Lisse", "Liscia")], ["strukturiert", T("Strukturiert", "Textured", "Structurée", "Strutturata")]]),
    ]),
    zubehoer: z("bad-accessoires", "touchfree"),
    bilder: [
      b("cl-1-1", "freisteller", T("Dornbracht CL.1: Waschtisch-Dreilochbatterie in Platin vor farbigem Verlauf", "Dornbracht CL.1: three-hole basin mixer in platinum against a coloured gradient", "Dornbracht CL.1 : mélangeur de lavabo trois trous en platine sur dégradé coloré", "Dornbracht CL.1: miscelatore per lavabo a tre fori in platino su sfumatura colorata")),
      b("cl-1-2", "freisteller", T("Dornbracht CL.1: Waschtisch-Dreilochbatterie in Chrom, Produktfoto", "Dornbracht CL.1: three-hole basin mixer in chrome, product shot", "Dornbracht CL.1 : mélangeur de lavabo trois trous chromé, photo produit", "Dornbracht CL.1: miscelatore per lavabo a tre fori cromato, foto prodotto")),
      b("cl-1-3", "ambiente", T("Dornbracht CL.1 an der Wanne: Wannenarmatur mit Sprayface, Wasser fällt in die gefüllte Badewanne", "Dornbracht CL.1 at the bath: bath mixer with sprayface, water falling into the filled bathtub", "Dornbracht CL.1 sur la baignoire : mélangeur avec sprayface, l’eau tombe dans la baignoire remplie", "Dornbracht CL.1 sulla vasca: miscelatore con sprayface, l’acqua cade nella vasca piena")),
    ],
    herstellerUrl: `${U.badserien}cl-1`,
    quellen: [`${U.badserien}cl-1`, U.accessoires],
  }),
  produkt({
    slug: "dornbracht-madison",
    bereich: "bad",
    kategorie: "armatur",
    name: "MADISON",
    kurz: T(
      "Klassisch-historische Armaturenserie mit Sechskant-Auslauf und Porzellanplättchen in den detailreichen Griffen, mit Anklängen an Art déco. Produkte für Waschtisch, Wanne und Dusche, Dreilochbatterie mit Kreuz- oder Hebelgriffen.",
      "Classic, historically inspired tap series with a hexagonal spout and porcelain inlays in the detailed handles, with Art Deco references. Products for washbasin, bath and shower; three-hole mixer with cross or lever handles.",
      "Série de robinetterie d’inspiration historique, au bec hexagonal et aux pastilles de porcelaine dans les poignées travaillées, aux accents Art déco. Produits pour lavabo, baignoire et douche ; mélangeur trois trous à croisillons ou leviers.",
      "Serie di rubinetteria di ispirazione storica con bocca esagonale e placchette in porcellana nelle maniglie ricche di dettagli, con richiami Art déco. Prodotti per lavabo, vasca e doccia; miscelatore a tre fori con maniglie a croce o a leva."
    ),
    merkmale: [
      T("Dreilochbatterie stehend oder an der Wand", "Three-hole mixer deck- or wall-mounted", "Mélangeur trois trous sur plage ou mural", "Miscelatore a tre fori da piano o a parete"),
      T(
        "Wanne: u. a. Vierlochbatterie für Wannenrandmontage, freistehende Zweilochbatterie mit sichtbaren Standrohren",
        "Bath: including a four-hole mixer for rim mounting and a freestanding two-hole mixer with visible standpipes",
        "Baignoire : notamment mélangeur quatre trous sur gorge et mélangeur deux trous sur colonnes apparentes",
        "Vasca: tra l’altro miscelatore a quattro fori per bordo vasca e miscelatore a due fori freestanding con colonne a vista"
      ),
    ],
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "platin", "platinGeb", "messing", "messingGeb", "darkBronzeGeb", "darkPlatinumGeb"], "madison-2"),
      anwendung("waschtisch", "wanne", "dusche", "bidet", "accessoires"),
      gruppe(G("Griff (Dreilochbatterie)", "Handle (three-hole mixer)", "Poignée (mélangeur trois trous)", "Maniglia (miscelatore a tre fori)"), [["kreuzgriff", T("Kreuzgriff", "Cross handle", "Croisillon", "Maniglia a croce")], ["hebelgriff", T("Hebelgriff", "Lever handle", "Levier", "Maniglia a leva")]]),
    ]),
    zubehoer: z("bad-accessoires", "brausegarnituren", "duschsysteme", "regenbrausen", "kopfbrausen", "handbrausen"),
    bilder: [
      b("madison-1", "freisteller", T("Dornbracht MADISON: Dreilochbatterie mit Kreuzgriffen in goldfarbener Oberfläche am Beckenrand", "Dornbracht MADISON: three-hole mixer with cross handles in a gold-coloured finish on a basin rim", "Dornbracht MADISON : mélangeur trois trous à croisillons, finition dorée, au bord d’une vasque", "Dornbracht MADISON: miscelatore a tre fori con maniglie a croce in finitura dorata sul bordo del lavabo")),
      b("madison-2", "freisteller", T("Dornbracht MADISON: Waschtisch-Dreilochbatterie in Chrom, Produktfoto", "Dornbracht MADISON: three-hole basin mixer in chrome, product shot", "Dornbracht MADISON : mélangeur de lavabo trois trous chromé, photo produit", "Dornbracht MADISON: miscelatore per lavabo a tre fori cromato, foto prodotto")),
      b("madison-3", "ambiente", T("Dornbracht MADISON im Bad: Waschtisch mit Dreilochbatterie und Duschbereich mit Regenbrause, Collage", "Dornbracht MADISON in the bathroom: washbasin with three-hole mixer and shower area with rain shower, collage", "Dornbracht MADISON dans la salle de bains : lavabo avec mélangeur trois trous et douche avec douche pluie, collage", "Dornbracht MADISON in bagno: lavabo con miscelatore a tre fori e zona doccia con soffione, collage")),
    ],
    herstellerUrl: `${U.badserien}madison`,
    quellen: [`${U.badserien}madison`, U.bidet, U.accessoires],
  }),
  produkt({
    slug: "dornbracht-meta",
    bereich: "bad",
    kategorie: "armatur",
    name: "META",
    kurz: T(
      "Minimalistische Armaturenserie auf Basis eines Zylinders: Hebel und schlanker Auslauf sind im 90-Grad-Winkel am Armaturenkörper angebunden. Design: Sieger Design; neben Metalloberflächen auch in Farben wie Rot und Orange.",
      "Minimalist tap series based on a cylinder: lever and slim spout join the body at a 90-degree angle. Design: Sieger Design; besides metal finishes also in colours such as red and orange.",
      "Série de robinetterie minimaliste fondée sur le cylindre : levier et bec fin sont fixés au corps à 90 degrés. Design : Sieger Design ; outre les finitions métal, aussi en couleurs comme rouge et orange.",
      "Serie di rubinetteria minimalista basata sul cilindro: leva e bocca sottile sono collegate al corpo a 90 gradi. Design: Sieger Design; oltre alle finiture metalliche anche in colori come rosso e arancione."
    ),
    merkmale: [
      T(
        "Varianten u. a. mit erhöhtem Standfuß, mit Standrohr, freistehend, META Slim und Kaltwasser-Standventil; kleinere Ausladungen für Gästebäder",
        "Variants including raised base, standpipe, freestanding, META Slim and cold-water pillar tap; shorter projections for guest bathrooms",
        "Variantes notamment sur socle surélevé, sur colonne, sur pied, META Slim et robinet eau froide ; saillies réduites pour salles d’eau d’invités",
        "Varianti tra cui con base rialzata, con colonna, freestanding, META Slim e rubinetto acqua fredda; sporgenze ridotte per bagni ospiti"
      ),
      T("Sonderoberfläche Peach über Dornbracht Atelier für ausgewählte Artikel", "Special finish Peach via Dornbracht Atelier for selected items", "Finition spéciale Peach via Dornbracht Atelier pour certains articles", "Finitura speciale Peach tramite Dornbracht Atelier per articoli selezionati"),
      touchfreeVariante,
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "platin", "platinGeb", "lightGold", "lightGoldGeb", "goldGeb", "darkBrassGeb", "bronzeGeb", "darkBronzeGeb", "darkChrome", "darkPlatinumGeb", "schwarzMatt", "rot", "orange"], "meta-2"),
      anwendung("waschtisch", "dusche", "wanne", "bidet"),
    ]),
    zubehoer: z("bad-accessoires", "touchfree"),
    bilder: [
      b("meta-1", "freisteller", T("Dornbracht META: Waschtisch-Einhandbatterie mit zylindrischem Körper vor farbigem Verlauf", "Dornbracht META: single-lever basin mixer with cylindrical body against a coloured gradient", "Dornbracht META : mitigeur de lavabo au corps cylindrique sur dégradé coloré", "Dornbracht META: miscelatore monocomando per lavabo con corpo cilindrico su sfumatura colorata")),
      b("meta-2", "freisteller", T("Dornbracht META: Waschtisch-Einhandbatterie in Chrom, Produktfoto", "Dornbracht META: single-lever basin mixer in chrome, product shot", "Dornbracht META : mitigeur de lavabo chromé, photo produit", "Dornbracht META: miscelatore monocomando per lavabo cromato, foto prodotto")),
      b("meta-3", "ambiente", T("Dornbracht META im Bad: Waschtischarmatur in Schwarz matt an einem hellen Waschtisch mit Unterbaubecken", "Dornbracht META in the bathroom: basin mixer in matt black at a light vanity with undermount basin", "Dornbracht META dans la salle de bains : mitigeur noir mat sur un plan clair à vasque sous plan", "Dornbracht META in bagno: miscelatore nero opaco su un piano chiaro con lavabo sottopiano")),
    ],
    herstellerUrl: `${U.badserien}meta`,
    quellen: [`${U.badserien}meta`, U.bidet, U.touchfree],
  }),
  produkt({
    slug: "dornbracht-imo",
    bereich: "bad",
    kategorie: "armatur",
    name: "IMO",
    kurz: T(
      "Armaturenserie, die runde und eckige Formen verbindet, mit überarbeiteten, reduzierten Proportionen. Design: Sieger Design; Lösungen für Waschtisch, Dusche und Wanne sowie abgestimmte Accessoires.",
      "Tap series combining round and square forms, with refined, reduced proportions. Design: Sieger Design; solutions for washbasin, shower and bath plus matching accessories.",
      "Série de robinetterie associant formes rondes et carrées, aux proportions affinées et épurées. Design : Sieger Design ; solutions pour lavabo, douche et baignoire et accessoires assortis.",
      "Serie di rubinetteria che unisce forme tonde e squadrate, con proporzioni affinate e ridotte. Design: Sieger Design; soluzioni per lavabo, doccia e vasca e accessori coordinati."
    ),
    merkmale: [
      T("Varianten u. a. mit erhöhtem Standfuß, mit hohem Auslauf und mit frei platziertem Griff seitlich am Waschtisch", "Variants including raised base, high spout and a freely positioned handle beside the basin", "Variantes notamment sur socle surélevé, à bec haut et à poignée placée librement à côté du lavabo", "Varianti tra cui con base rialzata, bocca alta e maniglia posizionabile liberamente accanto al lavabo"),
      touchfreeVariante,
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "platinGeb", "lightGoldGeb", "goldGeb", "darkChrome", "darkPlatinumGeb", "schwarzMatt"], "imo-2"),
      anwendung("waschtisch", "dusche", "wanne", "bidet", "accessoires"),
    ]),
    zubehoer: z("bad-accessoires", "touchfree"),
    bilder: [
      b("imo-1", "freisteller", T("Dornbracht IMO: Waschtisch-Einhandbatterie in Chrom vor farbigem Verlauf am Beckenrand", "Dornbracht IMO: single-lever basin mixer in chrome against a coloured gradient on a basin rim", "Dornbracht IMO : mitigeur de lavabo chromé sur dégradé coloré, au bord d’une vasque", "Dornbracht IMO: miscelatore monocomando per lavabo cromato su sfumatura colorata sul bordo del lavabo")),
      b("imo-2", "freisteller", T("Dornbracht IMO: Waschtisch-Einhandbatterie in Chrom, Produktfoto", "Dornbracht IMO: single-lever basin mixer in chrome, product shot", "Dornbracht IMO : mitigeur de lavabo chromé, photo produit", "Dornbracht IMO: miscelatore monocomando per lavabo cromato, foto prodotto")),
      b("imo-3", "ambiente", T("Dornbracht IMO im Bad: helles Bad in Salbeigrün mit Waschtisch, freistehender Wanne und Dusche", "Dornbracht IMO in the bathroom: light sage-green bathroom with washbasin, freestanding bath and shower", "Dornbracht IMO dans la salle de bains : salle de bains vert sauge avec lavabo, baignoire îlot et douche", "Dornbracht IMO in bagno: bagno verde salvia con lavabo, vasca freestanding e doccia")),
    ],
    herstellerUrl: `${U.badserien}imo`,
    quellen: [`${U.badserien}imo`, U.bidet, U.touchfree],
  }),
  produkt({
    slug: "dornbracht-lisse",
    bereich: "bad",
    kategorie: "armatur",
    name: "LISSÉ",
    kurz: T(
      "Armaturenserie mit klarer Silhouette, weichen Radien und filigranem, konisch zulaufendem Hebel. Design: Sieger Design; ein eigener Bedienmechanismus sorgt für eine weiche, leichtgängige Hebelbewegung.",
      "Tap series with a clear silhouette, soft radii and a slender, tapered lever. Design: Sieger Design; a dedicated mechanism gives the lever a soft, smooth movement.",
      "Série de robinetterie à la silhouette nette, aux rayons doux et au levier fin et conique. Design : Sieger Design ; un mécanisme propre assure un mouvement de levier doux et léger.",
      "Serie di rubinetteria dalla silhouette netta, con raggi morbidi e leva sottile e rastremata. Design: Sieger Design; un meccanismo dedicato rende il movimento della leva morbido e scorrevole."
    ),
    merkmale: [
      T("Einhebelmischer, mit erhöhtem Standfuß oder als Dreilochbatterie; Wanne u. a. mit Dreiloch-Einhandbatterie für Wannenrandmontage", "Single-lever mixer, with raised base or as three-hole mixer; bath including a three-hole single-lever mixer for rim mounting", "Mitigeur, sur socle surélevé ou mélangeur trois trous ; baignoire notamment avec mitigeur trois trous sur gorge", "Monocomando, con base rialzata o a tre fori; vasca tra l’altro con monocomando a tre fori per bordo vasca"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "platinGeb", "lightGold", "lightGoldGeb", "bronzeGeb", "darkPlatinumGeb", "schwarzMatt"], "lisse-2"),
      anwendung("waschtisch", "dusche", "wanne"),
    ]),
    bilder: [
      b("lisse-1", "freisteller", T("Dornbracht LISSÉ: Waschtisch-Einhandbatterie in Schwarz matt mit gelb-orangem Hebel vor rosa Hintergrund", "Dornbracht LISSÉ: single-lever basin mixer in matt black with a yellow-orange lever against a pink background", "Dornbracht LISSÉ : mitigeur de lavabo noir mat à levier jaune-orange, sur fond rose", "Dornbracht LISSÉ: miscelatore monocomando per lavabo nero opaco con leva giallo-arancio su sfondo rosa")),
      b("lisse-2", "freisteller", T("Dornbracht LISSÉ: Waschtisch-Einhandbatterie in Chrom, Produktfoto", "Dornbracht LISSÉ: single-lever basin mixer in chrome, product shot", "Dornbracht LISSÉ : mitigeur de lavabo chromé, photo produit", "Dornbracht LISSÉ: miscelatore monocomando per lavabo cromato, foto prodotto")),
      b("lisse-3", "ambiente", T("Dornbracht LISSÉ im Bad: Waschtischarmaturen an einem breiten Waschtisch vor einer Lamellenwand", "Dornbracht LISSÉ in the bathroom: basin mixers at a wide vanity in front of a slatted wall", "Dornbracht LISSÉ dans la salle de bains : mitigeurs sur un large plan devant un mur à lamelles", "Dornbracht LISSÉ in bagno: miscelatori su un ampio piano davanti a una parete a lamelle")),
    ],
    herstellerUrl: `${U.badserien}lisse`,
    quellen: [`${U.badserien}lisse`],
  }),
  produkt({
    slug: "dornbracht-lulu",
    bereich: "bad",
    kategorie: "armatur",
    name: "LULU",
    kurz: T(
      "Grafische Armaturenserie: ein kompakter, rechteckiger Körper mit abgerundeten Kanten trifft auf einen filigranen Hebel. Design: Sieger Design; mit passender eckiger Regenbrause für die Dusche.",
      "Graphic tap series: a compact rectangular body with rounded edges meets a slender lever. Design: Sieger Design; with a matching square rain shower.",
      "Série de robinetterie graphique : un corps rectangulaire compact aux arêtes arrondies et un levier fin. Design : Sieger Design ; avec douche pluie carrée assortie.",
      "Serie di rubinetteria grafica: un corpo rettangolare compatto con spigoli arrotondati e una leva sottile. Design: Sieger Design; con soffione a pioggia squadrato abbinato."
    ),
    merkmale: [
      T("Waschtisch: Dreilochbatterie oder Einhebelmischer; Regenbrause mit Wandanbindung 300 × 240 mm", "Washbasin: three-hole or single-lever mixer; wall-mounted rain shower 300 × 240 mm", "Lavabo : mélangeur trois trous ou mitigeur ; douche pluie murale 300 × 240 mm", "Lavabo: miscelatore a tre fori o monocomando; soffione a pioggia a parete 300 × 240 mm"),
      T("Wanne: u. a. freistehende Wannen-Einhandbatterie mit Schlauchbrausegarnitur, Vierlochbatterie für Wannenrandmontage", "Bath: including a freestanding single-lever bath mixer with hand shower set and a four-hole rim-mounted mixer", "Baignoire : notamment mitigeur sur pied avec garniture de douchette et mélangeur quatre trous sur gorge", "Vasca: tra l’altro monocomando freestanding con set doccetta e miscelatore a quattro fori per bordo vasca"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "platinGeb"], "lulu-2"),
      anwendung("waschtisch", "dusche", "wanne"),
    ]),
    zubehoer: z("regenbrausen", "kopfbrausen", "brausegarnituren"),
    bilder: [
      b("lulu-1", "freisteller", T("Dornbracht LULU: Waschtisch-Einhandbatterie mit rechteckigem Körper vor farbigem Verlauf", "Dornbracht LULU: single-lever basin mixer with rectangular body against a coloured gradient", "Dornbracht LULU : mitigeur de lavabo au corps rectangulaire sur dégradé coloré", "Dornbracht LULU: miscelatore monocomando per lavabo con corpo rettangolare su sfumatura colorata")),
      b("lulu-2", "freisteller", T("Dornbracht LULU: Waschtisch-Einhandbatterie in Chrom, Produktfoto", "Dornbracht LULU: single-lever basin mixer in chrome, product shot", "Dornbracht LULU : mitigeur de lavabo chromé, photo produit", "Dornbracht LULU: miscelatore monocomando per lavabo cromato, foto prodotto")),
      b("lulu-3", "ambiente", T("Dornbracht LULU im Bad: Waschtischarmatur in Chrom auf einem Aufsatzbecken mit roter Ablage", "Dornbracht LULU in the bathroom: basin mixer in chrome on a countertop basin with red shelf", "Dornbracht LULU dans la salle de bains : mitigeur chromé sur vasque à poser avec tablette rouge", "Dornbracht LULU in bagno: miscelatore cromato su lavabo d’appoggio con mensola rossa")),
    ],
    herstellerUrl: `${U.badserien}lulu`,
    quellen: [`${U.badserien}lulu`],
  }),
  produkt({
    slug: "dornbracht-touchfree",
    bereich: "bad",
    kategorie: "armatur",
    name: "TOUCHFREE",
    kurz: T(
      "Berührungslose Waschtischarmatur mit Infrarot- oder Radar-Technologie, laut Hersteller für den gehobenen halböffentlichen Bereich wie für private Bäder. Erhältlich im Design verschiedener Dornbracht-Serien.",
      "Touch-free basin tap with infrared or radar technology, intended by the manufacturer for upscale semi-public spaces as well as private bathrooms. Available in the design of several Dornbracht series.",
      "Robinet de lavabo sans contact à technologie infrarouge ou radar, destiné selon le fabricant aux espaces semi-publics haut de gamme comme aux salles de bains privées. Disponible dans le design de plusieurs séries Dornbracht.",
      "Rubinetto per lavabo senza contatto con tecnologia a infrarossi o radar, pensato dal produttore per ambienti semipubblici di livello e per bagni privati. Disponibile nel design di diverse serie Dornbracht."
    ),
    merkmale: [
      T("Designs u. a. MEM, VAIA, META, IMO, CL.1", "Designs including MEM, VAIA, META, IMO, CL.1", "Designs notamment MEM, VAIA, META, IMO, CL.1", "Design tra cui MEM, VAIA, META, IMO, CL.1"),
      T(
        "Infrared: Funktionstyp 1 mit direkter Temperaturregulierung per Drehgriff, Funktionstyp 2 mit Unter-Tisch-Steuerungseinheit",
        "Infrared: function type 1 with direct temperature control via rotary handle, type 2 with an under-counter control unit",
        "Infrared : type 1 avec réglage direct de la température par poignée rotative, type 2 avec unité de commande sous plan",
        "Infrared: tipo 1 con regolazione diretta della temperatura tramite manopola, tipo 2 con unità di controllo sotto il piano"
      ),
      T(
        "Infrared: thermische Desinfektion aller Komponenten und Reinigungsfunktion; Betrieb mit Batterie oder Stromanschluss",
        "Infrared: thermal disinfection of all components and cleaning function; battery or mains operation",
        "Infrared : désinfection thermique de tous les composants et fonction nettoyage ; fonctionnement sur pile ou secteur",
        "Infrared: disinfezione termica di tutti i componenti e funzione di pulizia; funzionamento a batteria o a rete"
      ),
    ],
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "platin", "messing", "platinGeb", "messingGeb", "chromGeb", "darkPlatinumGeb", "schwarzMatt", "weissMatt"], "touchfree-2"),
      gruppe(G("Technologie", "Technology", "Technologie", "Tecnologia"), [["infrarot", T("Infrarot", "Infrared", "Infrarouge", "Infrarossi")], ["radar", T("Radar", "Radar", "Radar", "Radar")]]),
      gruppe(G("Funktionstyp (Infrared)", "Function type (Infrared)", "Type de fonction (Infrared)", "Tipo di funzione (Infrared)"), [["typ-1", T("Typ 1: Temperatur per Drehgriff", "Type 1: temperature via rotary handle", "Type 1 : température par poignée rotative", "Tipo 1: temperatura tramite manopola")], ["typ-2", T("Typ 2: Unter-Tisch-Steuerungseinheit", "Type 2: under-counter control unit", "Type 2 : unité de commande sous plan", "Tipo 2: unità di controllo sotto il piano")]]),
      gruppe(G("Design", "Design", "Design", "Design"), [["mem", "MEM"], ["vaia", "VAIA"], ["meta", "META"], ["imo", "IMO"], ["cl-1", "CL.1"]]),
    ]),
    bilder: [
      b("touchfree-1", "ambiente", T("Dornbracht TOUCHFREE: Hände unter einer berührungslosen Waschtischarmatur in Schwarz", "Dornbracht TOUCHFREE: hands beneath a touch-free basin tap in black", "Dornbracht TOUCHFREE : mains sous un robinet de lavabo sans contact noir", "Dornbracht TOUCHFREE: mani sotto un rubinetto per lavabo senza contatto nero")),
      b("touchfree-2", "freisteller", T("Dornbracht TOUCHFREE im MEM-Design: berührungslose Waschtischarmatur in Chrom mit Sensor, Produktfoto", "Dornbracht TOUCHFREE in MEM design: touch-free basin tap in chrome with sensor, product shot", "Dornbracht TOUCHFREE au design MEM : robinet de lavabo sans contact chromé avec capteur, photo produit", "Dornbracht TOUCHFREE in design MEM: rubinetto per lavabo senza contatto cromato con sensore, foto prodotto")),
    ],
    herstellerUrl: U.touchfree,
    quellen: [U.touchfree],
  }),
  produkt({
    slug: "dornbracht-edition-pro",
    bereich: "bad",
    kategorie: "armatur",
    name: "EDITION PRO",
    kurz: T(
      "Projektserie mit kuratiertem Sortiment für Bad und Dusche, geprägt von reduzierten Formen und Volumen. In drei Oberflächen: Chrom, Chrom gebürstet und Schwarz matt.",
      "Project series with a curated range for bathroom and shower, defined by reduced forms and volumes. In three finishes: chrome, brushed chrome and matt black.",
      "Série projet à la gamme sélectionnée pour salle de bains et douche, marquée par des formes et volumes épurés. En trois finitions : chrome, chrome brossé et noir mat.",
      "Serie per progetti con gamma selezionata per bagno e doccia, caratterizzata da forme e volumi ridotti. In tre finiture: cromo, cromo spazzolato e nero opaco."
    ),
    merkmale: [
      T(
        "Waschtisch-Einhandbatterie, Wand-Einhandbatterie, Brause- und Wannen-Thermostat für Wandmontage, Showerpipe mit Brause-Thermostat 300 mm, Schlauchbrause- und Duschgarnitur, Regenbrause 220 mm",
        "Single-lever basin mixer, wall-mounted mixer, wall-mounted shower and bath thermostats, shower pipe with thermostat 300 mm, hand shower and shower sets, rain shower 220 mm",
        "Mitigeur de lavabo, mitigeur mural, thermostats douche et bain muraux, colonne de douche thermostatique 300 mm, garnitures de douchette et de douche, douche pluie 220 mm",
        "Monocomando per lavabo, monocomando a parete, termostati doccia e vasca a parete, colonna doccia termostatica 300 mm, set doccetta e doccia, soffione a pioggia 220 mm"
      ),
      T("Fünf Jahre Garantie laut Hersteller (Garantiebedingungen beachten)", "Five-year guarantee according to the manufacturer (see guarantee terms)", "Garantie de cinq ans selon le fabricant (voir conditions)", "Garanzia di cinque anni secondo il produttore (vedi condizioni)"),
    ],
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "schwarzMatt"], "edition-pro-2"),
    ]),
    bilder: [
      b("edition-pro-1", "ambiente", T("Dornbracht EDITION PRO: Waschtischarmaturen in Chrom in einem Hotelbad mit Doppelwaschtisch", "Dornbracht EDITION PRO: basin taps in chrome in a hotel bathroom with double vanity", "Dornbracht EDITION PRO : robinets de lavabo chromés dans une salle de bains d’hôtel à double vasque", "Dornbracht EDITION PRO: rubinetti per lavabo cromati in un bagno d’hotel con doppio lavabo")),
      b("edition-pro-2", "freisteller", T("Dornbracht EDITION PRO: Waschtisch-Einhandbatterie in Chrom, Produktfoto", "Dornbracht EDITION PRO: single-lever basin mixer in chrome, product shot", "Dornbracht EDITION PRO : mitigeur de lavabo chromé, photo produit", "Dornbracht EDITION PRO: miscelatore monocomando per lavabo cromato, foto prodotto")),
    ],
    herstellerUrl: `${DA}professional/inhalt/edition-pro`,
    quellen: [`${DA}professional/inhalt/edition-pro`, U.projektserien],
  }),
  produkt({
    slug: "dornbracht-yamou",
    bereich: "bad",
    kategorie: "armatur",
    name: "DORNBRACHT YAMOU",
    kurz: T(
      "Projektserie mit sanft fließender Kontur und abgerundetem Design, gestaltet von Sieger Design. Waschtischarmaturen und Duschlösungen mit Thermostat, in Chrom und Soft Black.",
      "Project series with a softly flowing contour and rounded design, created by Sieger Design. Basin taps and shower solutions with thermostat, in chrome and Soft Black.",
      "Série projet au contour fluide et au design arrondi, conçue par Sieger Design. Robinetterie de lavabo et solutions de douche thermostatiques, en chrome et Soft Black.",
      "Serie per progetti dal profilo fluido e dal design arrotondato, firmata Sieger Design. Rubinetteria per lavabo e soluzioni doccia con termostato, in cromo e Soft Black."
    ),
    merkmale: [
      T(
        "Waschtisch-Einhandbatterie, mit erhöhtem Standfuß, Dreilochbatterie, Wand-Einhandbatterie; Showerpipe mit Brause-Thermostat 220 mm, Regenbrause 220 mm, Brause-Thermostat für Wandmontage",
        "Single-lever basin mixer, with raised base, three-hole mixer, wall-mounted mixer; shower pipe with thermostat 220 mm, rain shower 220 mm, wall-mounted shower thermostat",
        "Mitigeur de lavabo, sur socle surélevé, mélangeur trois trous, mitigeur mural ; colonne de douche thermostatique 220 mm, douche pluie 220 mm, thermostat de douche mural",
        "Monocomando per lavabo, con base rialzata, miscelatore a tre fori, monocomando a parete; colonna doccia termostatica 220 mm, soffione a pioggia 220 mm, termostato doccia a parete"
      ),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "softBlack"], "yamou-2"),
    ]),
    bilder: [
      b("yamou-1", "freisteller", T("DORNBRACHT YAMOU: Waschtisch-Einhandbatterie in Chrom vor hellem Farbverlauf", "DORNBRACHT YAMOU: single-lever basin mixer in chrome against a light colour gradient", "DORNBRACHT YAMOU : mitigeur de lavabo chromé sur dégradé clair", "DORNBRACHT YAMOU: miscelatore monocomando per lavabo cromato su sfumatura chiara")),
      b("yamou-2", "freisteller", T("DORNBRACHT YAMOU: Waschtisch-Einhandbatterie in Chrom, Produktfoto", "DORNBRACHT YAMOU: single-lever basin mixer in chrome, product shot", "DORNBRACHT YAMOU : mitigeur de lavabo chromé, photo produit", "DORNBRACHT YAMOU: miscelatore monocomando per lavabo cromato, foto prodotto")),
      b("yamou-3", "ambiente", T("DORNBRACHT YAMOU im Hotelbad: Waschtisch aus Stein vor grüner Lamellenwand", "DORNBRACHT YAMOU in a hotel bathroom: stone washbasin in front of a green slatted wall", "DORNBRACHT YAMOU dans une salle de bains d’hôtel : lavabo en pierre devant un mur à lamelles vert", "DORNBRACHT YAMOU in un bagno d’hotel: lavabo in pietra davanti a una parete a lamelle verde")),
    ],
    herstellerUrl: `${DA}professional/inhalt/yamou`,
    quellen: [`${DA}professional/inhalt/yamou`, U.projektserien],
  }),
  produkt({
    slug: "dornbracht-yarre",
    bereich: "bad",
    kategorie: "armatur",
    name: "DORNBRACHT YARRE",
    kurz: T(
      "Projektserie mit markanter, geradliniger Formgebung, gestaltet von Sieger Design. Duscharmaturen und Thermostate als Aufputz- und Unterputzvariante, in Chrom und Soft Black.",
      "Project series with a distinctive, linear design, created by Sieger Design. Shower taps and thermostats in exposed and concealed versions, in chrome and Soft Black.",
      "Série projet aux lignes droites affirmées, conçue par Sieger Design. Robinetterie de douche et thermostats en versions apparente et encastrée, en chrome et Soft Black.",
      "Serie per progetti dalle linee rette e decise, firmata Sieger Design. Rubinetteria doccia e termostati in versione esterna e incasso, in cromo e Soft Black."
    ),
    merkmale: [
      T(
        "Waschtisch-Einhandbatterie, mit erhöhtem Standfuß, Dreilochbatterie, Wand-Einhandbatterie; Showerpipe mit Brause-Thermostat 220 mm, Brause-Thermostat für Wandmontage",
        "Single-lever basin mixer, with raised base, three-hole mixer, wall-mounted mixer; shower pipe with thermostat 220 mm, wall-mounted shower thermostat",
        "Mitigeur de lavabo, sur socle surélevé, mélangeur trois trous, mitigeur mural ; colonne de douche thermostatique 220 mm, thermostat de douche mural",
        "Monocomando per lavabo, con base rialzata, miscelatore a tre fori, monocomando a parete; colonna doccia termostatica 220 mm, termostato doccia a parete"
      ),
      T("Duscharmaturen laut Hersteller mit bis zu 44 % weniger Wasserverbrauch", "Shower taps with up to 44 % lower water consumption according to the manufacturer", "Robinetterie de douche avec jusqu’à 44 % de consommation d’eau en moins selon le fabricant", "Rubinetteria doccia con consumo d’acqua ridotto fino al 44 % secondo il produttore"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "softBlack"], "yarre-2"),
    ]),
    bilder: [
      b("yarre-1", "freisteller", T("DORNBRACHT YARRE: Waschtisch-Einhandbatterie in Chrom vor hellem Farbverlauf", "DORNBRACHT YARRE: single-lever basin mixer in chrome against a light colour gradient", "DORNBRACHT YARRE : mitigeur de lavabo chromé sur dégradé clair", "DORNBRACHT YARRE: miscelatore monocomando per lavabo cromato su sfumatura chiara")),
      b("yarre-2", "freisteller", T("DORNBRACHT YARRE: Waschtisch-Einhandbatterie in Chrom, Produktfoto", "DORNBRACHT YARRE: single-lever basin mixer in chrome, product shot", "DORNBRACHT YARRE : mitigeur de lavabo chromé, photo produit", "DORNBRACHT YARRE: miscelatore monocomando per lavabo cromato, foto prodotto")),
      b("yarre-3", "ambiente", T("DORNBRACHT YARRE im Hotelbad: Steinwaschtisch mit Armatur vor Holzwand und Stadtblick", "DORNBRACHT YARRE in a hotel bathroom: stone washbasin with tap in front of a wooden wall and city view", "DORNBRACHT YARRE dans une salle de bains d’hôtel : lavabo en pierre et robinet devant un mur en bois avec vue sur la ville", "DORNBRACHT YARRE in un bagno d’hotel: lavabo in pietra con rubinetto davanti a una parete in legno e vista città")),
    ],
    herstellerUrl: `${DA}professional/inhalt/yarre`,
    quellen: [`${DA}professional/inhalt/yarre`, U.projektserien],
  }),
  produkt({
    slug: "dornbracht-xtool",
    bereich: "bad",
    kategorie: "armatur",
    name: "xTOOL",
    kurz: T(
      "Unterputz-Thermostatsystem zur Steuerung von Duschen mit beliebig vielen Auslassstellen, mit Bedienelementen im Design und in den Oberflächen der Dornbracht-Serien. Laut Hersteller einheitliche Einbautiefen, kürzbare Bauschutzhauben und Kombination mit dem Schienensystem xGRID.",
      "Concealed thermostat system for controlling showers with any number of outlets, with controls in the design and finishes of the Dornbracht series. According to the manufacturer: uniform installation depths, shortenable protective covers and combination with the xGRID rail system.",
      "Système thermostatique encastré pour piloter des douches à nombre illimité de sorties, avec commandes au design et aux finitions des séries Dornbracht. Selon le fabricant : profondeurs d’encastrement uniformes, capots de protection recoupables, compatible avec le système de rails xGRID.",
      "Sistema termostatico a incasso per comandare docce con un numero qualsiasi di uscite, con comandi nel design e nelle finiture delle serie Dornbracht. Secondo il produttore: profondità di installazione uniformi, calotte di protezione accorciabili e abbinamento al sistema a binari xGRID."
    ),
    merkmale: [
      T("UP-Thermostatmodule ohne Mengenregulierung sowie mit 1, 2 oder 3 Ventilen", "Concealed thermostat modules without volume control and with 1, 2 or 3 valves", "Modules thermostatiques encastrés sans réglage de débit et avec 1, 2 ou 3 robinets", "Moduli termostatici a incasso senza regolazione di portata e con 1, 2 o 3 valvole"),
      T("Steuert u. a. AQUAHALO, RAINSKY M und LEG SHOWER (Temperatur und Wassermenge)", "Controls AQUAHALO, RAINSKY M and LEG SHOWER, among others (temperature and water volume)", "Pilote notamment AQUAHALO, RAINSKY M et LEG SHOWER (température et débit)", "Comanda tra l’altro AQUAHALO, RAINSKY M e LEG SHOWER (temperatura e portata)"),
      T("Bedienelemente u. a. im Design von VAIA und CYO", "Controls including VAIA and CYO designs", "Commandes notamment au design VAIA et CYO", "Comandi tra l’altro nel design VAIA e CYO"),
    ],
    ausfuehrungen: Object.freeze([
      gruppe(G("Thermostatmodul", "Thermostat module", "Module thermostatique", "Modulo termostatico"), [["ohne-mengenregulierung", T("Ohne Mengenregulierung", "Without volume control", "Sans réglage de débit", "Senza regolazione di portata")], ["1-ventil", T("Mit 1 Ventil", "With 1 valve", "Avec 1 robinet", "Con 1 valvola")], ["2-ventile", T("Mit 2 Ventilen", "With 2 valves", "Avec 2 robinets", "Con 2 valvole")], ["3-ventile", T("Mit 3 Ventilen", "With 3 valves", "Avec 3 robinets", "Con 3 valvole")]]),
    ]),
    bilder: [
      b("xtool-1", "freisteller", T("Dornbracht xTOOL: UP-Thermostat-Bedienelement mit runder Rosette in Champagne, Produktfoto", "Dornbracht xTOOL: concealed thermostat control with round rosette in Champagne, product shot", "Dornbracht xTOOL : commande de thermostat encastré à rosace ronde, finition Champagne, photo produit", "Dornbracht xTOOL: comando termostatico a incasso con rosetta tonda in Champagne, foto prodotto")),
      b("xtool-2", "freisteller", T("Dornbracht xTOOL: UP-Thermostatmodul (Unterputzkörper mit Bauschutzhaube), Produktfoto", "Dornbracht xTOOL: concealed thermostat module (rough-in body with protective cover), product shot", "Dornbracht xTOOL : module thermostatique encastré (corps d’encastrement avec capot), photo produit", "Dornbracht xTOOL: modulo termostatico a incasso (corpo da incasso con calotta), foto prodotto")),
    ],
    herstellerUrl: U.upThermostate,
    quellen: [U.upThermostate, `${DA}bad/inhalt/unterputzkoerper`, `${U.spaserien}aquahalo`, `${U.spaserien}rainsky-m`, `${U.spaserien}leg-shower`, `${U.badserien}cyo`],
  }),

  // ------------------------------------------------------------ Spa-Serien (Erlebnisduschen)
  produkt({
    slug: "dornbracht-aquahalo",
    bereich: "bad",
    kategorie: "erlebnisdusche",
    name: "AQUAHALO",
    kurz: T(
      "Erlebnisdusche als ringförmige Wasserskulptur, laut Hersteller inspiriert von einem klassizistischen Kristallkronleuchter; Produktdesign: Michael Neumayr. Drei Strahlarten, darunter ein Licht- und Wasserspot.",
      "Experience shower in the form of a ring-shaped water sculpture, according to the manufacturer inspired by a neoclassical crystal chandelier; product design: Michael Neumayr. Three spray types, including a light and water spot.",
      "Douche expérience en forme de sculpture d’eau annulaire, inspirée selon le fabricant d’un lustre en cristal néoclassique ; design produit : Michael Neumayr. Trois types de jet, dont un spot lumière et eau.",
      "Doccia emozionale a forma di scultura d’acqua ad anello, ispirata secondo il produttore a un lampadario di cristallo neoclassico; design di prodotto: Michael Neumayr. Tre tipi di getto, tra cui uno spot di luce e acqua."
    ),
    merkmale: [
      "AQUACIRCLE RAIN · TEMPEST RAIN · DIAMOND RAIN",
      T("Regenpaneel; Ansteuerung über ein passendes xTOOL-Bedienelement", "Rain panel; controlled via a matching xTOOL control", "Panneau de pluie ; commande par un élément xTOOL adapté", "Pannello pioggia; comando tramite un elemento xTOOL abbinato"),
    ],
    designer: "Michael Neumayr",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "platinGeb", "champagne", "champagneGeb", "schwarzMatt"]),
    ]),
    zubehoer: z("xtool"),
    bilder: [
      b("aquahalo-1", "ambiente", T("Dornbracht AQUAHALO: ringförmige Duschskulptur mit allen Strahlarten in einem runden, holzvertäfelten Bad", "Dornbracht AQUAHALO: ring-shaped shower sculpture with all spray types in a round, wood-panelled bathroom", "Dornbracht AQUAHALO : sculpture de douche annulaire, tous jets actifs, dans une salle de bains ronde lambrissée", "Dornbracht AQUAHALO: scultura doccia ad anello con tutti i getti in un bagno rotondo rivestito in legno")),
      b("aquahalo-2", "detail", T("Dornbracht AQUAHALO: Nahaufnahme der Kopfbrause mit fallendem Wasser", "Dornbracht AQUAHALO: close-up of the overhead shower with falling water", "Dornbracht AQUAHALO : gros plan de la douche de tête avec l’eau qui tombe", "Dornbracht AQUAHALO: primo piano del soffione con acqua che cade")),
    ],
    herstellerUrl: `${U.spaserien}aquahalo`,
    quellen: [`${U.spaserien}aquahalo`, U.spaDuschen],
  }),
  produkt({
    slug: "dornbracht-serenity-sky",
    bereich: "bad",
    kategorie: "erlebnisdusche",
    name: "SERENITY SKY",
    kurz: T(
      "Regenpaneel für den deckenbündigen Einbau ohne sichtbare Verschraubungen, gestaltet von Sieger Design. SERENITY SKY bietet zwei, SERENITY SKY+ fünf Strahlarten, jeweils optional mit Lichtfuge in Farblicht.",
      "Rain panel for flush ceiling installation without visible screws, created by Sieger Design. SERENITY SKY offers two spray types, SERENITY SKY+ five, each optionally with a coloured light joint.",
      "Panneau de pluie à encastrer au ras du plafond sans vis apparentes, conçu par Sieger Design. SERENITY SKY offre deux types de jet, SERENITY SKY+ cinq, chacun avec joint lumineux coloré en option.",
      "Pannello pioggia per installazione a filo soffitto senza viti a vista, firmato Sieger Design. SERENITY SKY offre due tipi di getto, SERENITY SKY+ cinque, entrambi con fuga luminosa a colori opzionale."
    ),
    merkmale: [
      "PURIFY RAIN · FULL RAIN · AQUAPRESSURE FLOW · LAMINAR FLOW · COOL MIST",
      T("Ausführungen: SERENITY SKY (2 Strahlarten) und SERENITY SKY+ (5 Strahlarten), je mit oder ohne Licht", "Versions: SERENITY SKY (2 spray types) and SERENITY SKY+ (5 spray types), each with or without light", "Versions : SERENITY SKY (2 types de jet) et SERENITY SKY+ (5 types de jet), avec ou sans lumière", "Versioni: SERENITY SKY (2 tipi di getto) e SERENITY SKY+ (5 tipi di getto), con o senza luce"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "edelstahlGeb", "champagne", "champagneGeb", "darkChrome", "darkPlatinumGeb", "bronzeGeb"], "serenity-sky-2"),
      gruppe(AUSF, [["serenity-sky", T("SERENITY SKY (2 Strahlarten)", "SERENITY SKY (2 spray types)", "SERENITY SKY (2 types de jet)", "SERENITY SKY (2 tipi di getto)")], ["serenity-sky-plus", T("SERENITY SKY+ (5 Strahlarten)", "SERENITY SKY+ (5 spray types)", "SERENITY SKY+ (5 types de jet)", "SERENITY SKY+ (5 tipi di getto)")]]),
      gruppe(G("Licht", "Light", "Lumière", "Luce"), [["ohne-licht", T("Ohne Licht", "Without light", "Sans lumière", "Senza luce")], ["mit-licht", T("Mit Lichtfuge (Farblicht)", "With light joint (coloured light)", "Avec joint lumineux (lumière colorée)", "Con fuga luminosa (luce colorata)")]]),
    ]),
    bilder: [
      b("serenity-sky-1", "detail", T("Dornbracht SERENITY SKY: deckenbündiges Regenpaneel mit Lichtfuge und fallendem Regen, Nahaufnahme", "Dornbracht SERENITY SKY: flush ceiling rain panel with light joint and falling rain, close-up", "Dornbracht SERENITY SKY : panneau de pluie affleurant avec joint lumineux et pluie, gros plan", "Dornbracht SERENITY SKY: pannello pioggia a filo soffitto con fuga luminosa e pioggia, primo piano")),
      b("serenity-sky-2", "freisteller", T("Dornbracht SERENITY SKY: Regenpaneel für Deckeneinbau in Chrom, Produktfoto", "Dornbracht SERENITY SKY: ceiling-mounted rain panel in chrome, product shot", "Dornbracht SERENITY SKY : panneau de pluie encastré au plafond, chromé, photo produit", "Dornbracht SERENITY SKY: pannello pioggia a incasso a soffitto cromato, foto prodotto")),
      b("serenity-sky-3", "ambiente", T("Dornbracht SERENITY SKY: Dusche mit Deckenpaneel in einem begrünten, offenen Bad, Collage", "Dornbracht SERENITY SKY: shower with ceiling panel in a green, open bathroom, collage", "Dornbracht SERENITY SKY : douche à panneau de plafond dans une salle de bains ouverte et végétalisée, collage", "Dornbracht SERENITY SKY: doccia con pannello a soffitto in un bagno aperto e verde, collage")),
    ],
    herstellerUrl: `${U.spaserien}serenity-sky`,
    quellen: [`${U.spaserien}serenity-sky`],
  }),
  produkt({
    slug: "dornbracht-aquamoon",
    bereich: "bad",
    kategorie: "erlebnisdusche",
    name: "AQUAMOON",
    kurz: T(
      "In die Decke eingelassene Kuppel mit verborgenem Lichtband, aus der je nach Ausführung bis zu vier Strahlarten fallen; Produktdesign: Michael Neumayr. Erhältlich als RAINMOON, AQUAMOON und AQUAMOON EMBRACE.",
      "Dome recessed into the ceiling with a hidden light band, delivering up to four spray types depending on the version; product design: Michael Neumayr. Available as RAINMOON, AQUAMOON and AQUAMOON EMBRACE.",
      "Coupole encastrée dans le plafond avec bandeau lumineux dissimulé, offrant jusqu’à quatre types de jet selon la version ; design produit : Michael Neumayr. Disponible en RAINMOON, AQUAMOON et AQUAMOON EMBRACE.",
      "Cupola incassata nel soffitto con fascia luminosa nascosta, da cui scendono fino a quattro tipi di getto a seconda della versione; design di prodotto: Michael Neumayr. Disponibile come RAINMOON, AQUAMOON e AQUAMOON EMBRACE."
    ),
    merkmale: [
      T("RAINMOON: TEMPEST RAIN und AQUACIRCLE RAIN mit Lichtfunktion", "RAINMOON: TEMPEST RAIN and AQUACIRCLE RAIN with light function", "RAINMOON : TEMPEST RAIN et AQUACIRCLE RAIN avec fonction lumière", "RAINMOON: TEMPEST RAIN e AQUACIRCLE RAIN con funzione luce"),
      T("AQUAMOON: zusätzlich QUEEN'S COLLAR CASCADE; AQUAMOON EMBRACE: zusätzlich EMBRACE CASCADE", "AQUAMOON: additionally QUEEN'S COLLAR CASCADE; AQUAMOON EMBRACE: additionally EMBRACE CASCADE", "AQUAMOON : en plus QUEEN'S COLLAR CASCADE ; AQUAMOON EMBRACE : en plus EMBRACE CASCADE", "AQUAMOON: in più QUEEN'S COLLAR CASCADE; AQUAMOON EMBRACE: in più EMBRACE CASCADE"),
      T("Regenpaneele in Weiß matt, je nach Ausführung mit Farblicht", "Rain panels in matt white, with coloured light depending on the version", "Panneaux de pluie blanc mat, avec lumière colorée selon la version", "Pannelli pioggia bianco opaco, con luce colorata a seconda della versione"),
    ],
    designer: "Michael Neumayr",
    ausfuehrungen: Object.freeze([
      gruppe(AUSF, [["rainmoon", "RAINMOON"], ["aquamoon", "AQUAMOON"], ["aquamoon-embrace", "AQUAMOON EMBRACE"]]),
    ]),
    bilder: [
      b("aquamoon-1", "ambiente", T("Dornbracht AQUAMOON: Frau unter der beleuchteten Deckenkuppel mit fallendem Wasser", "Dornbracht AQUAMOON: woman beneath the illuminated ceiling dome with falling water", "Dornbracht AQUAMOON : femme sous la coupole éclairée avec l’eau qui tombe", "Dornbracht AQUAMOON: donna sotto la cupola illuminata con acqua che cade")),
      b("aquamoon-2", "freisteller", T("Dornbracht AQUAMOON: Regenpaneel in Weiß matt, Produktfoto", "Dornbracht AQUAMOON: rain panel in matt white, product shot", "Dornbracht AQUAMOON : panneau de pluie blanc mat, photo produit", "Dornbracht AQUAMOON: pannello pioggia bianco opaco, foto prodotto")),
    ],
    herstellerUrl: `${U.spaserien}aquamoon`,
    quellen: [`${U.spaserien}aquamoon`, `${U.spaserien}rainmoon`, U.spaDuschen],
  }),
  produkt({
    slug: "dornbracht-horizontal-shower",
    bereich: "bad",
    kategorie: "erlebnisdusche",
    name: "HORIZONTAL SHOWER",
    kurz: T(
      "Liegedusche, bei der das Wasser aus sechs WATER BARS drucklos auf den Körper fällt – auf dem Bauch oder auf dem Rücken liegend. In zwei Ausführungen erhältlich.",
      "Lying shower in which water falls without pressure from six WATER BARS onto the body, lying on the front or back. Available in two versions.",
      "Douche allongée où l’eau tombe sans pression de six WATER BARS sur le corps, allongé sur le ventre ou sur le dos. Disponible en deux versions.",
      "Doccia da sdraiati in cui l’acqua cade senza pressione da sei WATER BARS sul corpo, a pancia in giù o in su. Disponibile in due versioni."
    ),
    merkmale: [
      T("Ausführungen: Nacken- und Rückenmassage; hot & cold (gezielte Temperaturwechsel)", "Versions: neck and back massage; hot & cold (targeted temperature changes)", "Versions : massage nuque et dos ; hot & cold (alternance de températures ciblée)", "Versioni: massaggio collo e schiena; hot & cold (alternanza di temperatura mirata)"),
      "6 × WATER BAR",
    ],
    ausfuehrungen: Object.freeze([
      gruppe(AUSF, [["nacken-ruecken", T("Nacken- und Rückenmassage", "Neck and back massage", "Massage nuque et dos", "Massaggio collo e schiena")], ["hot-cold", "hot & cold"]]),
    ]),
    bilder: [
      b("horizontal-shower-1", "ambiente", T("Dornbracht HORIZONTAL SHOWER: Liegefläche mit sechs WATER BARS in einem dunklen Spa-Raum", "Dornbracht HORIZONTAL SHOWER: lying surface with six WATER BARS in a dark spa room", "Dornbracht HORIZONTAL SHOWER : surface allongée avec six WATER BARS dans un espace spa sombre", "Dornbracht HORIZONTAL SHOWER: piano da sdraiati con sei WATER BARS in una zona spa scura")),
      b("horizontal-shower-2", "detail", T("Dornbracht HORIZONTAL SHOWER: Wasser fällt aus den WATER BARS auf eine liegende Person, Detail", "Dornbracht HORIZONTAL SHOWER: water falls from the WATER BARS onto a reclining person, detail", "Dornbracht HORIZONTAL SHOWER : l’eau tombe des WATER BARS sur une personne allongée, détail", "Dornbracht HORIZONTAL SHOWER: l’acqua cade dalle WATER BARS su una persona sdraiata, dettaglio")),
    ],
    herstellerUrl: `${U.spaserien}horizontal-shower`,
    quellen: [`${U.spaserien}horizontal-shower`],
  }),
  produkt({
    slug: "dornbracht-comfort-shower",
    bereich: "bad",
    kategorie: "erlebnisdusche",
    name: "COMFORT SHOWER",
    kurz: T(
      "Begehbare Dusche mit Bank, deren Strahlarten und Auslassstellen sich im Sitzen per Knopfdruck wählen lassen. Kombiniert die Regendusche JUSTRAIN mit dem Schwallauslauf WATERSHEET; drei Ausführungen.",
      "Walk-in shower with bench whose spray types and outlets can be selected at the push of a button while seated. Combines the JUSTRAIN rain shower with the WATERSHEET cascade spout; three versions.",
      "Douche à l’italienne avec banc, dont les types de jet et sorties se sélectionnent assis par simple pression. Associe la douche pluie JUSTRAIN et le bec cascade WATERSHEET ; trois versions.",
      "Doccia walk-in con panca, i cui tipi di getto e uscite si selezionano da seduti premendo un pulsante. Abbina il soffione JUSTRAIN alla bocca a cascata WATERSHEET; tre versioni."
    ),
    merkmale: [
      T("Ausführungen: Nackenmassage; Nacken- und Rückenmassage (zusätzlich zwei WATERBARS); hot & cold (zusätzlich Gießrohr und unterschiedliche Temperatureinstellungen)", "Versions: neck massage; neck and back massage (two additional WATERBARS); hot & cold (additional pouring spout and different temperature settings)", "Versions : massage nuque ; massage nuque et dos (deux WATERBARS en plus) ; hot & cold (bec verseur et réglages de température en plus)", "Versioni: massaggio collo; massaggio collo e schiena (due WATERBARS in più); hot & cold (in più getto a tubo e diverse impostazioni di temperatura)"),
      "JUSTRAIN · WATERSHEET · WATERBAR",
    ],
    ausfuehrungen: Object.freeze([
      gruppe(AUSF, [["nacken", T("Nackenmassage", "Neck massage", "Massage nuque", "Massaggio collo")], ["nacken-ruecken", T("Nacken- und Rückenmassage", "Neck and back massage", "Massage nuque et dos", "Massaggio collo e schiena")], ["hot-cold", "hot & cold"]]),
    ]),
    zubehoer: z("water-modules"),
    bilder: [
      b("comfort-shower-1", "ambiente", T("Dornbracht COMFORT SHOWER: begehbare Dusche mit Steinbank, Person sitzend unter der Regendusche", "Dornbracht COMFORT SHOWER: walk-in shower with stone bench, person seated beneath the rain shower", "Dornbracht COMFORT SHOWER : douche à l’italienne avec banc en pierre, personne assise sous la douche pluie", "Dornbracht COMFORT SHOWER: doccia walk-in con panca in pietra, persona seduta sotto il soffione")),
      b("comfort-shower-2", "ambiente", T("Dornbracht COMFORT SHOWER: Person auf der Bank nutzt die Handbrause am Bein", "Dornbracht COMFORT SHOWER: person on the bench using the hand shower on the leg", "Dornbracht COMFORT SHOWER : personne sur le banc utilisant la douchette sur la jambe", "Dornbracht COMFORT SHOWER: persona sulla panca che usa la doccetta sulla gamba")),
    ],
    herstellerUrl: `${U.spaserien}comfort-shower`,
    quellen: [`${U.spaserien}comfort-shower`],
  }),
  produkt({
    slug: "dornbracht-leg-shower",
    bereich: "bad",
    kategorie: "erlebnisdusche",
    name: "LEG SHOWER",
    kurz: T(
      "Beindusche mit vier WATER BARS, die in der Dusche auf Unterschenkelhöhe angebracht werden. Temperatur und Wassermenge werden über das Dornbracht xTOOL gesteuert.",
      "Leg shower with four WATER BARS mounted in the shower at lower-leg height. Temperature and water volume are controlled via the Dornbracht xTOOL.",
      "Douche pour les jambes avec quatre WATER BARS montées à hauteur des mollets. Température et débit se règlent via le xTOOL Dornbracht.",
      "Doccia per le gambe con quattro WATER BARS montate in doccia all’altezza dei polpacci. Temperatura e portata si regolano tramite il Dornbracht xTOOL."
    ),
    merkmale: ["4 × WATER BAR", T("Steuerung über xTOOL", "Controlled via xTOOL", "Commande par xTOOL", "Comando tramite xTOOL")],
    zubehoer: z("xtool"),
    bilder: [
      b("leg-shower-1", "ambiente", T("Dornbracht LEG SHOWER: Dusche mit Steinbank und WATER BARS auf Unterschenkelhöhe", "Dornbracht LEG SHOWER: shower with stone bench and WATER BARS at lower-leg height", "Dornbracht LEG SHOWER : douche avec banc en pierre et WATER BARS à hauteur des mollets", "Dornbracht LEG SHOWER: doccia con panca in pietra e WATER BARS all’altezza dei polpacci")),
      b("leg-shower-2", "ambiente", T("Dornbracht LEG SHOWER: Person in der Dusche, Wasser aus den WATER BARS an den Beinen", "Dornbracht LEG SHOWER: person in the shower, water from the WATER BARS on the legs", "Dornbracht LEG SHOWER : personne dans la douche, eau des WATER BARS sur les jambes", "Dornbracht LEG SHOWER: persona in doccia, acqua dalle WATER BARS sulle gambe")),
    ],
    herstellerUrl: `${U.spaserien}leg-shower`,
    quellen: [`${U.spaserien}leg-shower`],
  }),
  produkt({
    slug: "dornbracht-vertical-shower",
    bereich: "bad",
    kategorie: "erlebnisdusche",
    name: "VERTICAL SHOWER",
    kurz: T(
      "Massagedusche, die die Regendusche JUST RAIN mit verschiedenen Massagemodulen kombiniert. In drei Ausführungen von der Nacken- bis zur Rückenmassage erhältlich.",
      "Massage shower combining the JUST RAIN rain shower with various massage modules. Available in three versions, from neck to back massage.",
      "Douche massante associant la douche pluie JUST RAIN à différents modules de massage. Disponible en trois versions, du massage de la nuque à celui du dos.",
      "Doccia massaggio che abbina il soffione JUST RAIN a diversi moduli massaggio. Disponibile in tre versioni, dal massaggio del collo a quello della schiena."
    ),
    merkmale: [
      T("Ausführungen: Nackenmassage (WATER CURVE); Nacken- und Rückenmassage (zusätzlich WATER FANS); hot & cold (zusätzlich Gießrohr und unterschiedliche Temperatureinstellungen)", "Versions: neck massage (WATER CURVE); neck and back massage (additional WATER FANS); hot & cold (additional pouring spout and different temperature settings)", "Versions : massage nuque (WATER CURVE) ; massage nuque et dos (WATER FANS en plus) ; hot & cold (bec verseur et réglages de température en plus)", "Versioni: massaggio collo (WATER CURVE); massaggio collo e schiena (in più WATER FANS); hot & cold (in più getto a tubo e diverse impostazioni di temperatura)"),
      "JUST RAIN · WATER CURVE · WATER FAN",
    ],
    ausfuehrungen: Object.freeze([
      gruppe(AUSF, [["nacken", T("Nackenmassage", "Neck massage", "Massage nuque", "Massaggio collo")], ["nacken-ruecken", T("Nacken- und Rückenmassage", "Neck and back massage", "Massage nuque et dos", "Massaggio collo e schiena")], ["hot-cold", "hot & cold"]]),
    ]),
    zubehoer: z("water-modules"),
    bilder: [
      b("vertical-shower-1", "ambiente", T("Dornbracht VERTICAL SHOWER: Frau in einer Dusche mit Regenbrause und Massagemodulen", "Dornbracht VERTICAL SHOWER: woman in a shower with rain shower and massage modules", "Dornbracht VERTICAL SHOWER : femme dans une douche avec douche pluie et modules de massage", "Dornbracht VERTICAL SHOWER: donna in una doccia con soffione e moduli massaggio")),
      b("vertical-shower-2", "freisteller", T("Dornbracht VERTICAL SHOWER: Kombination aus Regenbrause, Massagemodulen und Handbrause, Produktfoto", "Dornbracht VERTICAL SHOWER: combination of rain shower, massage modules and hand shower, product shot", "Dornbracht VERTICAL SHOWER : combinaison douche pluie, modules de massage et douchette, photo produit", "Dornbracht VERTICAL SHOWER: combinazione di soffione, moduli massaggio e doccetta, foto prodotto")),
    ],
    herstellerUrl: `${U.spaserien}vertical-shower`,
    quellen: [`${U.spaserien}vertical-shower`],
  }),
  produkt({
    slug: "dornbracht-rainsky-m",
    bereich: "bad",
    kategorie: "erlebnisdusche",
    name: "RAINSKY M",
    kurz: T(
      "Großflächiges Regenpaneel mit separaten Düsenfeldern für Kopfbrause, Körperbrause und Regenvorhang. Über die xTOOL-Steuerung lassen sich die drei Regenarten einzeln oder kombiniert wählen und die Temperatur gradgenau regeln.",
      "Large rain panel with separate nozzle fields for head shower, body shower and rain curtain. Via the xTOOL control the three rain types can be selected individually or combined and the temperature set to the degree.",
      "Grand panneau de pluie avec champs de buses séparés pour douche de tête, douche corporelle et rideau de pluie. Le xTOOL permet de choisir les trois pluies seules ou combinées et de régler la température au degré près.",
      "Ampio pannello pioggia con campi di ugelli separati per soffione testa, getto corpo e cortina di pioggia. Con il comando xTOOL le tre piogge si selezionano singolarmente o insieme e la temperatura si regola al grado."
    ),
    merkmale: [T("Kopfbrause · Körperbrause · Regenvorhang", "Head shower · body shower · rain curtain", "Douche de tête · douche corporelle · rideau de pluie", "Soffione testa · getto corpo · cortina di pioggia"), T("Steuerung über xTOOL", "Controlled via xTOOL", "Commande par xTOOL", "Comando tramite xTOOL")],
    zubehoer: z("xtool"),
    bilder: [b("rainsky-m-1", "detail", T("Dornbracht RAINSKY M: großflächiges Regenpaneel an der Decke mit Regenvorhang vor dunklem Hintergrund", "Dornbracht RAINSKY M: large ceiling rain panel with rain curtain against a dark background", "Dornbracht RAINSKY M : grand panneau de pluie au plafond avec rideau de pluie sur fond sombre", "Dornbracht RAINSKY M: ampio pannello pioggia a soffitto con cortina di pioggia su sfondo scuro"))],
    herstellerUrl: `${U.spaserien}rainsky-m`,
    quellen: [`${U.spaserien}rainsky-m`],
  }),
  produkt({
    slug: "dornbracht-water-modules",
    bereich: "bad",
    kategorie: "erlebnisdusche",
    name: "WATER MODULES",
    kurz: T(
      "Module zur Erweiterung jeder Dornbracht-Duschlösung: Schwallausläufe, Gießrohr, Kneipp-Schlauch und Seitenbrausen mit Massagestrahl. Sie unterscheiden sich vor allem in der Art der Wasserdarreichung.",
      "Modules for extending any Dornbracht shower solution: cascade spouts, pouring spout, Kneipp hose and side sprays with massage jet. They differ mainly in how the water is delivered.",
      "Modules pour compléter toute solution de douche Dornbracht : becs cascade, bec verseur, flexible Kneipp et jets latéraux massants. Ils se distinguent surtout par la façon dont l’eau est délivrée.",
      "Moduli per ampliare qualsiasi soluzione doccia Dornbracht: bocche a cascata, getto a tubo, tubo Kneipp e getti laterali con getto massaggio. Si distinguono soprattutto per il modo di erogare l’acqua."
    ),
    merkmale: [
      T("Schwallausläufe für Wandmontage: WATER FALL, WATER FALL mit Einzelstrahlen, WATER SHEET", "Wall-mounted cascade spouts: WATER FALL, WATER FALL with individual jets, WATER SHEET", "Becs cascade muraux : WATER FALL, WATER FALL à jets individuels, WATER SHEET", "Bocche a cascata a parete: WATER FALL, WATER FALL a getti singoli, WATER SHEET"),
      T("UP-Seitenbrausen: WATER POINTS, WATER BAR, WATER CURVE, WATER FAN horizontal, WATER FAN vertical", "Concealed side sprays: WATER POINTS, WATER BAR, WATER CURVE, WATER FAN horizontal, WATER FAN vertical", "Jets latéraux encastrés : WATER POINTS, WATER BAR, WATER CURVE, WATER FAN horizontal, WATER FAN vertical", "Getti laterali a incasso: WATER POINTS, WATER BAR, WATER CURVE, WATER FAN horizontal, WATER FAN vertical"),
      T("Gießrohr mit Abdeckplatte; WATER TUBE Kneipp-Schlauch 2000 mm (weiß oder schwarz) mit Wandanschlussbögen", "Pouring spout with cover plate; WATER TUBE Kneipp hose 2000 mm (white or black) with wall elbows", "Bec verseur avec plaque ; flexible Kneipp WATER TUBE 2000 mm (blanc ou noir) avec coudes muraux", "Getto a tubo con placca; tubo Kneipp WATER TUBE 2000 mm (bianco o nero) con raccordi a parete"),
    ],
    bilder: [
      b("water-modules-1", "detail", T("Dornbracht WATER MODULES: Schwallauslauf WATER FALL, Wasser fällt auf Schulter und Nacken eines Mannes", "Dornbracht WATER MODULES: WATER FALL cascade spout, water falling on a man’s shoulder and neck", "Dornbracht WATER MODULES : bec cascade WATER FALL, l’eau tombe sur l’épaule et la nuque d’un homme", "Dornbracht WATER MODULES: bocca a cascata WATER FALL, l’acqua cade su spalla e collo di un uomo")),
      b("water-modules-2", "freisteller", T("Dornbracht WATER CURVE: UP-Seitenbrause in Chrom, Produktfoto", "Dornbracht WATER CURVE: concealed side spray in chrome, product shot", "Dornbracht WATER CURVE : jet latéral encastré chromé, photo produit", "Dornbracht WATER CURVE: getto laterale a incasso cromato, foto prodotto")),
    ],
    herstellerUrl: `${DA}bad/duschen/water-modules`,
    quellen: [`${DA}bad/duschen/water-modules`, `${DA}bad/inhalt-duschen/water-modules`],
  }),

  // ------------------------------------------------------------ Duschen / Brausen
  produkt({
    slug: "dornbracht-big-rain",
    bereich: "bad",
    kategorie: "dusche",
    name: "BIG RAIN",
    kurz: T(
      "Regenpaneel aus Edelstahl für den Deckeneinbau oder die Deckenunterbaumontage. Gelistet unter den Regenpaneelen der Dornbracht Spa-Duschen.",
      "Stainless steel rain panel for recessed or surface ceiling mounting. Listed among the rain panels of the Dornbracht spa showers.",
      "Panneau de pluie en inox à encastrer au plafond ou à poser sous plafond. Référencé parmi les panneaux de pluie des douches spa Dornbracht.",
      "Pannello pioggia in acciaio inox per installazione a incasso o sotto soffitto. Elencato tra i pannelli pioggia delle docce spa Dornbracht."
    ),
    merkmale: [T("Deckeneinbau bzw. -unterbau", "Recessed or surface ceiling mounting", "Encastré ou sous plafond", "A incasso o sotto soffitto"), T("Ausführung Edelstahl", "Stainless steel finish", "Finition inox", "Finitura acciaio inox")],
    bilder: [b("big-rain-1", "freisteller", T("Dornbracht BIG RAIN: rechteckiges Regenpaneel aus Edelstahl, Produktfoto", "Dornbracht BIG RAIN: rectangular stainless steel rain panel, product shot", "Dornbracht BIG RAIN : panneau de pluie rectangulaire en inox, photo produit", "Dornbracht BIG RAIN: pannello pioggia rettangolare in acciaio inox, foto prodotto"))],
    herstellerUrl: U.spaDuschen,
    quellen: [U.spaDuschen],
  }),
  produkt({
    slug: "dornbracht-regenbrausen",
    bereich: "bad",
    kategorie: "dusche",
    name: "Regenbrausen",
    kurz: T(
      "Regenbrausen in eckiger, runder oder softer Designsprache, wandangebunden, deckenangebunden oder deckenintegriert. Varianten mit zweiter Strahlart und mit Lichtintegration; serienbezogen (z. B. COYA, MADISON, LULU) oder serienübergreifend.",
      "Rain showers in square, round or soft design language, wall-mounted, ceiling-mounted or ceiling-integrated. Versions with a second spray type and with integrated light; series-specific (e.g. COYA, MADISON, LULU) or cross-series.",
      "Douches pluie au design carré, rond ou adouci, murales, suspendues au plafond ou intégrées au plafond. Versions à second type de jet et à éclairage intégré ; propres à une série (p. ex. COYA, MADISON, LULU) ou transversales.",
      "Soffioni a pioggia in design squadrato, tondo o morbido, a parete, a soffitto o integrati nel soffitto. Versioni con secondo tipo di getto e con luce integrata; specifici per serie (ad es. COYA, MADISON, LULU) o trasversali."
    ),
    merkmale: [
      T("Größen u. a. 200, 220, 300 und 400 mm sowie 300 × 240 mm", "Sizes including 200, 220, 300 and 400 mm and 300 × 240 mm", "Tailles notamment 200, 220, 300 et 400 mm et 300 × 240 mm", "Misure tra cui 200, 220, 300 e 400 mm e 300 × 240 mm"),
      T("Viele Modelle auch als FlowReduce-Variante mit reduziertem Wasserverbrauch", "Many models also as FlowReduce version with reduced water consumption", "Nombreux modèles aussi en version FlowReduce à consommation d’eau réduite", "Molti modelli anche in versione FlowReduce con consumo d’acqua ridotto"),
      T("62 Artikel im Herstellerkatalog (Stand 31.10.2026)", "62 items in the manufacturer’s catalogue (as of 31 Oct 2026)", "62 articles au catalogue du fabricant (au 31/10/2026)", "62 articoli nel catalogo del produttore (al 31/10/2026)"),
    ],
    ausfuehrungen: Object.freeze([
      gruppe(GROESSE, [["200-mm", "200 mm"], ["220-mm", "220 mm"], ["300-mm", "300 mm"], ["400-mm", "400 mm"], ["300-x-240-mm", "300 × 240 mm"]]),
      gruppe(G("Anbindung", "Mounting", "Fixation", "Attacco"), [["wand", T("Wandanbindung", "Wall-mounted", "Murale", "A parete")], ["decke", T("Deckenanbindung", "Ceiling-mounted", "Au plafond", "A soffitto")], ["deckenintegriert", T("Deckenintegriert", "Ceiling-integrated", "Intégrée au plafond", "Integrato nel soffitto")]]),
      gruppe(G("Form", "Shape", "Forme", "Forma"), [["eckig", T("Eckig", "Square", "Carrée", "Squadrata")], ["rund", T("Rund", "Round", "Ronde", "Tonda")], ["soft", T("Soft", "Soft", "Soft", "Soft")]]),
    ]),
    bilder: [
      b("regenbrausen-1", "ambiente", T("Dornbracht Regenbrausen: deckenintegrierte Regenbrause in einem hellen Bad mit Oberlicht", "Dornbracht rain showers: ceiling-integrated rain shower in a bright bathroom with skylight", "Douches pluie Dornbracht : douche pluie intégrée au plafond dans une salle de bains claire avec puits de lumière", "Soffioni a pioggia Dornbracht: soffione integrato nel soffitto in un bagno luminoso con lucernario")),
      b("regenbrausen-2", "freisteller", T("Dornbracht Regenbrause mit Wandanbindung 220 mm in Chrom, Produktfoto", "Dornbracht wall-mounted rain shower 220 mm in chrome, product shot", "Douche pluie murale Dornbracht 220 mm chromée, photo produit", "Soffione a pioggia a parete Dornbracht 220 mm cromato, foto prodotto")),
    ],
    herstellerUrl: `${DA}bad/duschen/regenbrausen`,
    quellen: [`${DA}bad/duschen/regenbrausen`, `${DA}bad/inhalt-duschen/regenduschen`, `${DA}bad/inhalt-duschen/flowreduce`],
  }),
  produkt({
    slug: "dornbracht-kopfbrausen",
    bereich: "bad",
    kategorie: "dusche",
    name: "Kopfbrausen",
    kurz: T(
      "Schwenkbare Kopfbrausen, teilweise mit mehreren Strahlarten, in unterschiedlichen Designs von Rosette und Brausekopf. Auch mit Deckenanbindung und als FlowReduce-Variante.",
      "Swivelling overhead showers, some with several spray types, in different rosette and shower head designs. Also with ceiling connection and as FlowReduce version.",
      "Douches de tête orientables, certaines à plusieurs types de jet, avec différents designs de rosace et de pomme. Aussi avec fixation au plafond et en version FlowReduce.",
      "Soffioni orientabili, alcuni con più tipi di getto, con diversi design di rosetta e testa. Anche con attacco a soffitto e in versione FlowReduce."
    ),
    merkmale: [
      T("Serienbezogene Modelle u. a. für MADISON, LULU und COYA", "Series-specific models including MADISON, LULU and COYA", "Modèles propres aux séries notamment MADISON, LULU et COYA", "Modelli specifici per serie tra cui MADISON, LULU e COYA"),
      T("16 Artikel im Herstellerkatalog (Stand 31.10.2026)", "16 items in the manufacturer’s catalogue (as of 31 Oct 2026)", "16 articles au catalogue du fabricant (au 31/10/2026)", "16 articoli nel catalogo del produttore (al 31/10/2026)"),
    ],
    ausfuehrungen: Object.freeze([
      gruppe(G("Anbindung", "Mounting", "Fixation", "Attacco"), [["wand", T("Wandanbindung", "Wall-mounted", "Murale", "A parete")], ["decke", T("Deckenanbindung", "Ceiling-mounted", "Au plafond", "A soffitto")]]),
    ]),
    bilder: [
      b("kopfbrausen-1", "detail", T("Dornbracht Kopfbrause mit Wandanbindung und fallendem Wasser vor dunkler Wand", "Dornbracht overhead shower with wall connection and falling water against a dark wall", "Douche de tête murale Dornbracht avec l’eau qui tombe devant un mur sombre", "Soffione Dornbracht con attacco a parete e acqua che cade davanti a una parete scura")),
      b("kopfbrausen-2", "freisteller", T("Dornbracht Kopfbrause in Chrom, Produktfoto", "Dornbracht overhead shower in chrome, product shot", "Douche de tête Dornbracht chromée, photo produit", "Soffione Dornbracht cromato, foto prodotto")),
    ],
    herstellerUrl: `${DA}bad/duschen/kopfbrausen`,
    quellen: [`${DA}bad/duschen/kopfbrausen`],
  }),
  produkt({
    slug: "dornbracht-handbrausen",
    bereich: "bad",
    kategorie: "dusche",
    name: "Handbrausen",
    kurz: T(
      "Handbrausen in verschiedenen Designs mit einer, drei, vier oder fünf Strahlarten, je nach Ausführung. Serienneutrale Modelle und serienbezogene wie die MADISON Metall-Handbrause mit Porzellangriff.",
      "Hand showers in various designs with one, three, four or five spray types depending on the version. Cross-series models and series-specific ones such as the MADISON metal hand shower with porcelain handle.",
      "Douchettes de différents designs à un, trois, quatre ou cinq types de jet selon la version. Modèles neutres et modèles de série comme la douchette métal MADISON à poignée en porcelaine.",
      "Doccette in diversi design con uno, tre, quattro o cinque tipi di getto a seconda della versione. Modelli neutri e specifici per serie come la doccetta in metallo MADISON con impugnatura in porcellana."
    ),
    merkmale: [
      T("Brausekopf u. a. 100, 120 und 130 mm", "Spray head including 100, 120 and 130 mm", "Tête notamment 100, 120 et 130 mm", "Testa tra cui 100, 120 e 130 mm"),
      T("Auch als FlowReduce-Variante", "Also as FlowReduce version", "Aussi en version FlowReduce", "Anche in versione FlowReduce"),
      T("21 Artikel im Herstellerkatalog (Stand 31.10.2026)", "21 items in the manufacturer’s catalogue (as of 31 Oct 2026)", "21 articles au catalogue du fabricant (au 31/10/2026)", "21 articoli nel catalogo del produttore (al 31/10/2026)"),
    ],
    ausfuehrungen: Object.freeze([
      gruppe(GROESSE, [["100-mm", "100 mm"], ["120-mm", "120 mm"], ["130-mm", "130 mm"]]),
      gruppe(G("Strahlarten", "Spray types", "Types de jet", "Tipi di getto"), [["1", "1"], ["3", "3"], ["4", "4"], ["5", "5"]]),
    ]),
    bilder: [
      b("handbrausen-1", "ambiente", T("Dornbracht Handbrause an einer Brausestange in einer hellen Dusche mit Regenbrause", "Dornbracht hand shower on a shower rail in a bright shower with rain shower", "Douchette Dornbracht sur barre de douche dans une douche claire avec douche pluie", "Doccetta Dornbracht su asta doccia in una doccia luminosa con soffione")),
      b("handbrausen-2", "freisteller", T("Dornbracht Handbrause in Chrom, serienneutral, Produktfoto", "Dornbracht hand shower in chrome, cross-series, product shot", "Douchette Dornbracht chromée, modèle neutre, photo produit", "Doccetta Dornbracht cromata, modello neutro, foto prodotto")),
    ],
    herstellerUrl: `${DA}bad/duschen/handbrausen`,
    quellen: [`${DA}bad/duschen/handbrausen`],
  }),
  produkt({
    slug: "dornbracht-brausegarnituren",
    bereich: "bad",
    kategorie: "dusche",
    name: "Brausegarnituren",
    kurz: T(
      "Duschgarnituren aus Handbrause, Bedienelement und Wandrohr sowie Schlauchbrausegarnituren, in verschiedenen Rosettendesigns und Handbrausefunktionen. Serienbezogen (z. B. VAIA, MADISON, TARA, COYA, LULU) oder serienübergreifend.",
      "Shower sets made of hand shower, control and wall bar, plus hand shower sets, in different rosette designs and hand shower functions. Series-specific (e.g. VAIA, MADISON, TARA, COYA, LULU) or cross-series.",
      "Garnitures de douche composées de douchette, commande et barre murale, ainsi que garnitures de douchette, avec différents designs de rosace et fonctions. Propres à une série (p. ex. VAIA, MADISON, TARA, COYA, LULU) ou transversales.",
      "Set doccia composti da doccetta, comando e asta a parete, oltre a set doccetta, con diversi design di rosetta e funzioni. Specifici per serie (ad es. VAIA, MADISON, TARA, COYA, LULU) o trasversali."
    ),
    merkmale: [
      T("Auch UP-Einhandbatterie mit integriertem Brauseanschluss und Hand- bzw. Duschgarnitur", "Also concealed single-lever mixer with integrated shower connection and hand or shower set", "Aussi mitigeur encastré avec raccord de douche intégré et garniture de douchette ou de douche", "Anche monocomando a incasso con attacco doccia integrato e set doccetta o doccia"),
      T("49 Artikel im Herstellerkatalog (Stand 31.10.2026)", "49 items in the manufacturer’s catalogue (as of 31 Oct 2026)", "49 articles au catalogue du fabricant (au 31/10/2026)", "49 articoli nel catalogo del produttore (al 31/10/2026)"),
    ],
    ausfuehrungen: Object.freeze([
      gruppe(AUSF, [["duschgarnitur", T("Duschgarnitur", "Shower set", "Garniture de douche", "Set doccia")], ["schlauchbrausegarnitur", T("Schlauchbrausegarnitur", "Hand shower set", "Garniture de douchette", "Set doccetta")]]),
    ]),
    zubehoer: z("handbrausen"),
    bilder: [
      b("brausegarnituren-1", "ambiente", T("Dornbracht Brausegarnitur in einer hellen Dusche mit Glaswand und Holzrost", "Dornbracht shower set in a bright shower with glass wall and wooden grate", "Garniture de douche Dornbracht dans une douche claire avec paroi vitrée et caillebotis", "Set doccia Dornbracht in una doccia luminosa con parete in vetro e pedana in legno")),
      b("brausegarnituren-2", "freisteller", T("Dornbracht Duschgarnitur mit Wandstange und Handbrause in Chrom, Produktfoto", "Dornbracht shower set with wall bar and hand shower in chrome, product shot", "Garniture de douche Dornbracht avec barre murale et douchette chromées, photo produit", "Set doccia Dornbracht con asta a parete e doccetta cromate, foto prodotto")),
    ],
    herstellerUrl: `${DA}bad/duschen/brausegarnituren`,
    quellen: [`${DA}bad/duschen/brausegarnituren`],
  }),
  produkt({
    slug: "dornbracht-duschsysteme",
    bereich: "bad",
    kategorie: "dusche",
    name: "Duschsysteme",
    kurz: T(
      "Showerpipes mit Brause-Thermostat oder Brausebatterie, wahlweise mit oder ohne Handbrause, in verschiedenen Größen der Regenbrause. Serienbezogen (z. B. MADISON, TARA, COYA, VAIA) oder serienübergreifend.",
      "Shower pipes with thermostat or shower mixer, with or without hand shower, in different rain shower sizes. Series-specific (e.g. MADISON, TARA, COYA, VAIA) or cross-series.",
      "Colonnes de douche avec thermostat ou mitigeur, avec ou sans douchette, en différentes tailles de douche pluie. Propres à une série (p. ex. MADISON, TARA, COYA, VAIA) ou transversales.",
      "Colonne doccia con termostato o miscelatore, con o senza doccetta, in diverse misure di soffione. Specifiche per serie (ad es. MADISON, TARA, COYA, VAIA) o trasversali."
    ),
    merkmale: [
      T("Regenbrause u. a. 200, 220 und 300 mm sowie 300 × 240 mm", "Rain shower including 200, 220 and 300 mm and 300 × 240 mm", "Douche pluie notamment 200, 220 et 300 mm et 300 × 240 mm", "Soffione tra cui 200, 220 e 300 mm e 300 × 240 mm"),
      T("37 Artikel im Herstellerkatalog (Stand 31.10.2026)", "37 items in the manufacturer’s catalogue (as of 31 Oct 2026)", "37 articles au catalogue du fabricant (au 31/10/2026)", "37 articoli nel catalogo del produttore (al 31/10/2026)"),
    ],
    ausfuehrungen: Object.freeze([
      gruppe(G("Regenbrause", "Rain shower", "Douche pluie", "Soffione"), [["200-mm", "200 mm"], ["220-mm", "220 mm"], ["300-mm", "300 mm"], ["300-x-240-mm", "300 × 240 mm"]]),
      gruppe(G("Steuerung", "Control", "Commande", "Comando"), [["thermostat", T("Brause-Thermostat", "Shower thermostat", "Thermostat de douche", "Termostato doccia")], ["brausebatterie", T("Brausebatterie", "Shower mixer", "Mitigeur de douche", "Miscelatore doccia")]]),
    ]),
    zubehoer: z("handbrausen"),
    bilder: [
      b("duschsysteme-1", "ambiente", T("Dornbracht Duschsystem in einem Bad mit grüner Marmorwand, Armaturen in Champagne gebürstet", "Dornbracht shower system in a bathroom with green marble wall, fittings in Brushed Champagne", "Système de douche Dornbracht dans une salle de bains au mur de marbre vert, robinetterie Champagne brossé", "Sistema doccia Dornbracht in un bagno con parete in marmo verde, rubinetteria Champagne spazzolato")),
      b("duschsysteme-2", "freisteller", T("Dornbracht Shower Pipe mit Brause-Thermostat und eckiger Regenbrause in Chrom, Produktfoto", "Dornbracht shower pipe with thermostat and square rain shower in chrome, product shot", "Colonne de douche Dornbracht avec thermostat et douche pluie carrée chromées, photo produit", "Colonna doccia Dornbracht con termostato e soffione squadrato cromati, foto prodotto")),
    ],
    herstellerUrl: `${DA}bad/duschen/duschsysteme`,
    quellen: [`${DA}bad/duschen/duschsysteme`],
  }),
  produkt({
    slug: "dornbracht-seitenbrausen",
    bereich: "bad",
    kategorie: "dusche",
    name: "Seitenbrausen",
    kurz: T(
      "Seitenbrausen als Massagemodule zur Erweiterung der Dusche, mit oder ohne Mengenregulierung. Ergänzend gibt es die Seitenbrausen der WATER MODULES.",
      "Side sprays as massage modules to extend the shower, with or without volume control. The WATER MODULES side sprays complement them.",
      "Jets latéraux comme modules de massage pour compléter la douche, avec ou sans réglage de débit. Les jets latéraux des WATER MODULES les complètent.",
      "Getti laterali come moduli massaggio per ampliare la doccia, con o senza regolazione di portata. Si aggiungono i getti laterali dei WATER MODULES."
    ),
    merkmale: [T("Seitenbrause; Seitenbrause ohne Mengenregulierung", "Side spray; side spray without volume control", "Jet latéral ; jet latéral sans réglage de débit", "Getto laterale; getto laterale senza regolazione di portata")],
    ausfuehrungen: Object.freeze([
      gruppe(AUSF, [["mit-mengenregulierung", T("Mit Mengenregulierung", "With volume control", "Avec réglage de débit", "Con regolazione di portata")], ["ohne-mengenregulierung", T("Ohne Mengenregulierung", "Without volume control", "Sans réglage de débit", "Senza regolazione di portata")]]),
    ]),
    bilder: [
      b("seitenbrausen-1", "ambiente", T("Dornbracht Seitenbrausen in einer Dusche mit dunkler Wand und Regenbrause", "Dornbracht side sprays in a shower with dark wall and rain shower", "Jets latéraux Dornbracht dans une douche au mur sombre avec douche pluie", "Getti laterali Dornbracht in una doccia con parete scura e soffione")),
      b("seitenbrausen-2", "freisteller", T("Dornbracht Seitenbrause in Chrom, Produktfoto", "Dornbracht side spray in chrome, product shot", "Jet latéral Dornbracht chromé, photo produit", "Getto laterale Dornbracht cromato, foto prodotto")),
    ],
    herstellerUrl: `${DA}bad/duschen/seitenbrausen`,
    quellen: [`${DA}bad/duschen/seitenbrausen`],
  }),

  // ------------------------------------------------------------ Spiegel, Accessoires, WC
  produkt({
    slug: "dornbracht-lichtspiegel",
    bereich: "bad",
    kategorie: "spiegel",
    name: "Lichtspiegel",
    kurz: T(
      "Spiegel mit dimmbarem kalt- und warmweißem LED-Licht, in runder oder eckiger Form. Rahmen in Weiß matt.",
      "Mirror with dimmable cool and warm white LED light, in round or square form. Frame in matt white.",
      "Miroir à éclairage LED blanc froid et chaud dimmable, de forme ronde ou carrée. Cadre blanc mat.",
      "Specchio con luce LED bianca fredda e calda dimmerabile, in forma tonda o squadrata. Cornice bianco opaco."
    ),
    merkmale: [T("Rund oder eckig, je zwei Varianten (4 Artikel)", "Round or square, two variants each (4 items)", "Rond ou carré, deux variantes chacun (4 articles)", "Tondo o squadrato, due varianti ciascuno (4 articoli)"), T("LED dimmbar, kalt- und warmweiß", "Dimmable LED, cool and warm white", "LED dimmable, blanc froid et chaud", "LED dimmerabile, bianco freddo e caldo")],
    ausfuehrungen: Object.freeze([
      gruppe(G("Form", "Shape", "Forme", "Forma"), [["rund", T("Rund", "Round", "Rond", "Tondo")], ["eckig", T("Eckig", "Square", "Carré", "Squadrato")]]),
    ]),
    bilder: [
      b("lichtspiegel-1", "freisteller", T("Dornbracht Lichtspiegel, eckig, Rahmen in Weiß matt", "Dornbracht light mirror, square, frame in matt white", "Miroir lumineux Dornbracht, carré, cadre blanc mat", "Specchio luminoso Dornbracht, squadrato, cornice bianco opaco")),
      b("lichtspiegel-2", "freisteller", T("Dornbracht Lichtspiegel, rund, Weiß matt, Produktfoto", "Dornbracht light mirror, round, matt white, product shot", "Miroir lumineux Dornbracht, rond, blanc mat, photo produit", "Specchio luminoso Dornbracht, tondo, bianco opaco, foto prodotto")),
    ],
    herstellerUrl: `${DA}bad/accessoires/lichtspiegel`,
    quellen: [`${DA}bad/accessoires/lichtspiegel`],
  }),
  produkt({
    slug: "dornbracht-handtuchwaermer",
    bereich: "bad",
    kategorie: "handtuchwaermer",
    name: "Handtuchwärmer",
    kurz: T(
      "Handtuchwärmer aus Heizstäben, gestaltet passend zum Design der Bad-Armaturen. In 4- oder 6-facher Ausführung, mit Ausladung links oder rechts, mit oder ohne Bedienelement.",
      "Towel warmers made of heated rails, designed to match the bathroom taps. In 4- or 6-rail versions, projecting left or right, with or without control.",
      "Sèche-serviettes à barres chauffantes, assortis au design de la robinetterie. En version 4 ou 6 barres, déport à gauche ou à droite, avec ou sans commande.",
      "Scaldasalviette a barre riscaldanti, in linea con il design della rubinetteria. In versione a 4 o 6 barre, sporgenza a sinistra o a destra, con o senza comando."
    ),
    merkmale: [
      T("Elektronische Bedienelemente und Attrappe als Zubehör", "Electronic controls and a dummy cover as accessories", "Commandes électroniques et cache factice en accessoires", "Comandi elettronici e copertura cieca come accessori"),
      T("20 Artikel im Herstellerkatalog (Stand 31.10.2026)", "20 items in the manufacturer’s catalogue (as of 31 Oct 2026)", "20 articles au catalogue du fabricant (au 31/10/2026)", "20 articoli nel catalogo del produttore (al 31/10/2026)"),
    ],
    ausfuehrungen: Object.freeze([
      gruppe(GROESSE, [["4-fach", T("4-fach", "4 rails", "4 barres", "4 barre")], ["6-fach", T("6-fach", "6 rails", "6 barres", "6 barre")]]),
      gruppe(G("Ausladung", "Projection", "Déport", "Sporgenza"), [["links", T("Links", "Left", "À gauche", "A sinistra")], ["rechts", T("Rechts", "Right", "À droite", "A destra")]]),
      gruppe(G("Bedienelement", "Control", "Commande", "Comando"), [["mit", T("Mit Bedienelement", "With control", "Avec commande", "Con comando")], ["ohne", T("Ohne Bedienelement", "Without control", "Sans commande", "Senza comando")]]),
    ]),
    zubehoer: z("bad-accessoires"),
    bilder: [
      b("handtuchwaermer-1", "freisteller", T("Dornbracht Handtuchwärmer, 4-fach, in goldfarbener Oberfläche", "Dornbracht towel warmer, 4 rails, in a gold-coloured finish", "Sèche-serviettes Dornbracht, 4 barres, finition dorée", "Scaldasalviette Dornbracht, 4 barre, in finitura dorata")),
      b("handtuchwaermer-2", "freisteller", T("Dornbracht Handtuchwärmer, 4-fach, Ausladung links, in Chrom, Produktfoto", "Dornbracht towel warmer, 4 rails, projecting left, in chrome, product shot", "Sèche-serviettes Dornbracht, 4 barres, déport à gauche, chromé, photo produit", "Scaldasalviette Dornbracht, 4 barre, sporgenza a sinistra, cromato, foto prodotto")),
    ],
    herstellerUrl: `${DA}bad/handtuchwaermer/`,
    quellen: [`${DA}bad/handtuchwaermer/`],
  }),
  produkt({
    slug: "dornbracht-bad-accessoires",
    bereich: "bad",
    kategorie: "accessoire",
    name: "Accessoires",
    kurz: T(
      "Bad-Accessoires von Ablagen über Griffe und Handtuchhalter bis zum Zahnbürstenhalter, überwiegend im Design der Armaturenserien. So lässt sich die Formensprache einer Serie im ganzen Bad fortsetzen.",
      "Bathroom accessories from shelves, grab bars and towel holders to toothbrush holders, mostly in the design of the tap series, carrying a series’ design language through the whole bathroom.",
      "Accessoires de salle de bains, des tablettes aux barres d’appui, porte-serviettes et porte-brosses à dents, surtout au design des séries de robinetterie, pour prolonger le style d’une série dans toute la pièce.",
      "Accessori bagno da mensole, maniglioni e portasciugamani fino al portaspazzolini, perlopiù nel design delle serie di rubinetteria, per estendere lo stile di una serie a tutto il bagno."
    ),
    merkmale: [
      T(
        "Ablagen, Duschkörbe und Abzieher, Halte- und Stützgriffe, Handtuchhalter, Seifen-Accessoires, Toilettenpapierhalter, Toilettenbürstengarnituren, Zahnbürstenhalter",
        "Shelves, shower baskets and squeegees, grab and support bars, towel holders, soap accessories, toilet roll holders, toilet brush sets, toothbrush holders",
        "Tablettes, paniers de douche et raclettes, barres d’appui, porte-serviettes, accessoires à savon, porte-rouleaux, garnitures de brosse WC, porte-brosses à dents",
        "Mensole, cestini doccia e tergivetri, maniglioni di sostegno, portasciugamani, accessori per sapone, portarotolo, set scopino WC, portaspazzolini"
      ),
      T("Im Design u. a. von CL.1, VAIA, MADISON, COYA, TARA, IMO und META", "In designs including CL.1, VAIA, MADISON, COYA, TARA, IMO and META", "Aux designs notamment CL.1, VAIA, MADISON, COYA, TARA, IMO et META", "Nei design tra cui CL.1, VAIA, MADISON, COYA, TARA, IMO e META"),
      T("103 Artikel im Herstellerkatalog (Stand 31.10.2026)", "103 items in the manufacturer’s catalogue (as of 31 Oct 2026)", "103 articles au catalogue du fabricant (au 31/10/2026)", "103 articoli nel catalogo del produttore (al 31/10/2026)"),
    ],
    bilder: [
      b("bad-accessoires-1", "ambiente", T("Dornbracht Accessoires: Waschplatz mit Wandarmatur, Spiegelschrank und Accessoires", "Dornbracht accessories: washstand with wall-mounted tap, mirror cabinet and accessories", "Accessoires Dornbracht : coin lavabo avec robinet mural, armoire de toilette et accessoires", "Accessori Dornbracht: zona lavabo con rubinetto a parete, pensile a specchio e accessori")),
      b("bad-accessoires-2", "freisteller", T("Dornbracht TARA Badetuchhalter, Produktfoto", "Dornbracht TARA bath towel bar, product shot", "Porte-serviette de bain Dornbracht TARA, photo produit", "Portasciugamani da bagno Dornbracht TARA, foto prodotto")),
    ],
    herstellerUrl: U.accessoires,
    quellen: [U.accessoires, `${U.badserien}vaia`, `${U.badserien}imo`, `${U.badserien}meta`],
  }),
  produkt({
    slug: "dornbracht-drueckerplatten-wc",
    bereich: "bad",
    kategorie: "wc",
    name: "Drückerplatten WC",
    kurz: T(
      "WC-Betätigungsplatten in Chrom für Unterputz-Spülkästen. Für Spülkästen von Geberit in runder oder eckiger Ausführung, für TeCe als Abdeckplatte.",
      "WC flush plates in chrome for concealed cisterns. For Geberit cisterns in round or square versions, for TeCe as a cover plate.",
      "Plaques de commande WC chromées pour réservoirs encastrés. Pour réservoirs Geberit en version ronde ou carrée, pour TeCe en plaque de recouvrement.",
      "Placche di comando WC cromate per cassette a incasso. Per cassette Geberit in versione tonda o squadrata, per TeCe come placca di copertura."
    ),
    merkmale: [T("3 Artikel: Geberit rund, Geberit eckig, TeCe", "3 items: Geberit round, Geberit square, TeCe", "3 articles : Geberit rond, Geberit carré, TeCe", "3 articoli: Geberit tondo, Geberit squadrato, TeCe"), T("Oberfläche Chrom", "Chrome finish", "Finition chrome", "Finitura cromo")],
    ausfuehrungen: Object.freeze([
      gruppe(G("Spülkasten", "Cistern", "Réservoir", "Cassetta"), [["geberit-rund", T("Geberit, rund", "Geberit, round", "Geberit, rond", "Geberit, tonda")], ["geberit-eckig", T("Geberit, eckig", "Geberit, square", "Geberit, carré", "Geberit, squadrata")], ["tece", "TeCe"]]),
    ]),
    bilder: [
      b("drueckerplatten-wc-1", "freisteller", T("Dornbracht Drückerplatte WC in Chrom mit flacher Taste", "Dornbracht WC flush plate in chrome with flat button", "Plaque de commande WC Dornbracht chromée à touche plate", "Placca di comando WC Dornbracht cromata con tasto piatto")),
      b("drueckerplatten-wc-2", "freisteller", T("Dornbracht Betätigungsplatte WC, rund, in Chrom, Produktfoto", "Dornbracht WC flush plate, round, in chrome, product shot", "Plaque de commande WC Dornbracht, ronde, chromée, photo produit", "Placca di comando WC Dornbracht, tonda, cromata, foto prodotto")),
    ],
    herstellerUrl: `${DA}bad/drueckerplatten-wc/`,
    quellen: [`${DA}bad/drueckerplatten-wc/`],
  }),
]);

/**
 * Küchenarmaturen und Küchenbecken (bereich "kueche"). Seit K2 (31.10.2026,
 * Welt je Produkt) in PRODUKTE mit welt "kuechengeraete" – sie erscheinen unter
 * /kuechengeraete/… (Markenseite /kuechengeraete/marke/dornbracht).
 * @type {import("../schema.js").KatalogProdukt[]}
 */
export const KUECHE_VORBEREITET = Object.freeze([
  produkt({
    slug: "dornbracht-vaia-kueche",
    bereich: "kueche",
    kategorie: "armatur",
    name: "VAIA",
    serie: "VAIA",
    kurz: T(
      "Küchenarmaturen mit weichen Radien, feiner Silhouette und filigranem, offenem Auslauf, Design: Sieger Design. Neben dem Einhebelmischer gibt es eine Pull-down-Variante, einen POT FILLER und eine seitliche Spülbrause.",
      "Kitchen taps with soft radii, a fine silhouette and a delicate, open spout, design: Sieger Design. Besides the single-lever mixer there is a pull-down version, a POT FILLER and a side spray.",
      "Robinets de cuisine aux rayons doux, à la silhouette fine et au bec ouvert et délicat, design : Sieger Design. Outre le mitigeur : version pull-down, POT FILLER et douchette latérale.",
      "Rubinetti da cucina con raggi morbidi, silhouette sottile e bocca aperta e filigranata, design: Sieger Design. Oltre al monocomando: versione pull-down, POT FILLER e doccetta laterale."
    ),
    merkmale: [
      T("Pull-down mit Brausefunktion: Umschalten zwischen Luftsprudler- und Brausestrahl auch bei fließendem Wasser", "Pull-down with spray function: switch between aerated and spray jet even while the water is running", "Pull-down avec fonction douchette : passage du jet aéré au jet pluie même en cours d’écoulement", "Pull-down con funzione doccetta: commutazione tra getto aerato e a pioggia anche ad acqua aperta"),
      T("POT FILLER Kaltwasserventil", "POT FILLER cold-water valve", "POT FILLER robinet eau froide", "POT FILLER rubinetto acqua fredda"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "platin", "platinGeb", "champagne", "champagneGeb", "messing", "messingGeb", "darkChrome", "darkPlatinumGeb", "schwarzMatt"], "vaia-kueche-2"),
      gruppe(FUNKTION, [["einhebelmischer", T("Einhebelmischer", "Single-lever mixer", "Mitigeur", "Monocomando")], ["pull-down", T("Pull-down mit Brausefunktion", "Pull-down with spray function", "Pull-down avec douchette", "Pull-down con doccetta")], ["pot-filler", "POT FILLER"]]),
    ]),
    bilder: [
      b("vaia-kueche-1", "freisteller", T("Dornbracht VAIA Küche: Zweigriff-Küchenarmatur in Platin gebürstet vor grün-gelbem Verlauf", "Dornbracht VAIA kitchen: two-handle kitchen tap in brushed platinum against a green-yellow gradient", "Dornbracht VAIA cuisine : robinet de cuisine à deux poignées en platine brossé sur dégradé vert-jaune", "Dornbracht VAIA cucina: rubinetto da cucina a due maniglie in platino spazzolato su sfumatura verde-gialla")),
      b("vaia-kueche-2", "freisteller", T("Dornbracht VAIA Einhebelmischer Pull-down mit Brausefunktion in Chrom, Produktfoto", "Dornbracht VAIA pull-down single-lever mixer with spray function in chrome, product shot", "Mitigeur pull-down Dornbracht VAIA avec fonction douchette, chromé, photo produit", "Miscelatore monocomando pull-down Dornbracht VAIA con funzione doccetta cromato, foto prodotto")),
      b("vaia-kueche-3", "ambiente", T("Dornbracht VAIA in der Küche: Hände waschen Gemüse unter dem POT FILLER am Becken", "Dornbracht VAIA in the kitchen: hands washing vegetables under the POT FILLER at the sink", "Dornbracht VAIA en cuisine : mains lavant des légumes sous le POT FILLER à l’évier", "Dornbracht VAIA in cucina: mani che lavano verdure sotto il POT FILLER al lavello")),
    ],
    herstellerUrl: `${U.kuechenserien}vaia`,
    quellen: [`${U.kuechenserien}vaia`],
  }),
  produkt({
    slug: "dornbracht-meta-square",
    bereich: "kueche",
    kategorie: "armatur",
    name: "META SQUARE",
    kurz: T(
      "Küchenarmatur mit quadratischem Auslaufbogen und sonst runder, reduzierter Formensprache, Design: Sieger Design. Als klassischer Einhebelmischer, ausziehbar als Pull-down und als Bar Tap erhältlich.",
      "Kitchen tap with a square spout arch and an otherwise round, reduced design language, design: Sieger Design. Available as a classic single-lever mixer, as a pull-down and as a bar tap.",
      "Robinet de cuisine au bec carré et au langage formel par ailleurs rond et épuré, design : Sieger Design. En mitigeur classique, en pull-down et en bar tap.",
      "Rubinetto da cucina con arco della bocca quadrato e linguaggio formale per il resto tondo ed essenziale, design: Sieger Design. Come monocomando classico, pull-down e bar tap."
    ),
    merkmale: [T("Einhebelmischer, Einhebelmischer Pull-down mit Brausefunktion, Bar Tap", "Single-lever mixer, pull-down single-lever mixer with spray function, bar tap", "Mitigeur, mitigeur pull-down avec fonction douchette, bar tap", "Monocomando, monocomando pull-down con funzione doccetta, bar tap")],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      gruppe(FUNKTION, [["einhebelmischer", T("Einhebelmischer", "Single-lever mixer", "Mitigeur", "Monocomando")], ["pull-down", T("Pull-down mit Brausefunktion", "Pull-down with spray function", "Pull-down avec douchette", "Pull-down con doccetta")], ["bar-tap", "Bar Tap"]]),
    ]),
    bilder: [
      b("meta-square-1", "freisteller", T("Dornbracht META SQUARE: Küchenarmatur mit quadratischem Auslaufbogen in Champagne gebürstet vor gelbem Verlauf", "Dornbracht META SQUARE: kitchen tap with square spout arch in Brushed Champagne against a yellow gradient", "Dornbracht META SQUARE : robinet de cuisine à bec carré en Champagne brossé sur dégradé jaune", "Dornbracht META SQUARE: rubinetto da cucina con bocca quadrata in Champagne spazzolato su sfumatura gialla")),
      b("meta-square-2", "freisteller", T("Dornbracht META SQUARE Einhebelmischer Pull-down mit Brausefunktion in Chrom, Produktfoto", "Dornbracht META SQUARE pull-down single-lever mixer with spray function in chrome, product shot", "Mitigeur pull-down Dornbracht META SQUARE avec fonction douchette, chromé, photo produit", "Miscelatore monocomando pull-down Dornbracht META SQUARE con funzione doccetta cromato, foto prodotto")),
      b("meta-square-3", "ambiente", T("Dornbracht META SQUARE in der Küche: Armatur in Schwarz matt an einer Spüle mit Terrazzo-Rückwand", "Dornbracht META SQUARE in the kitchen: tap in matt black at a sink with terrazzo splashback", "Dornbracht META SQUARE en cuisine : robinet noir mat sur un évier avec crédence en terrazzo", "Dornbracht META SQUARE in cucina: rubinetto nero opaco su un lavello con alzatina in terrazzo")),
    ],
    herstellerUrl: `${U.kuechenserien}meta-square`,
    quellen: [`${U.kuechenserien}meta-square`],
  }),
  produkt({
    slug: "dornbracht-tara-ultra",
    bereich: "kueche",
    kategorie: "armatur",
    name: "TARA ULTRA",
    kurz: T(
      "Küchenarmatur mit hohem, schlankem Auslauf und rechtwinklig, ergonomisch platziertem Hebel, Design: Sieger Design. Der schwenkbare Auslass mit integrierter Brause bietet die Wahl zwischen Luftsprudler und Brausestrahl.",
      "Kitchen tap with a tall, slim spout and a right-angled, ergonomically placed lever, design: Sieger Design. The swivelling outlet with integrated spray offers a choice of aerated or spray jet.",
      "Robinet de cuisine au bec haut et fin et au levier à angle droit placé de façon ergonomique, design : Sieger Design. La sortie orientable avec douchette intégrée offre jet aéré ou jet pluie.",
      "Rubinetto da cucina con bocca alta e sottile e leva ad angolo retto posizionata in modo ergonomico, design: Sieger Design. L’uscita girevole con doccetta integrata offre getto aerato o a pioggia."
    ),
    merkmale: [
      T("Einhebelmischer Pull-down mit Brausefunktion, Profi-Einhebelmischer (schwenkbar), Spülbrausegarnitur, POT FILLER Kaltwasserventil, Zweilochbatterie mit Einzelrosetten", "Pull-down single-lever mixer with spray function, professional single-lever mixer (swivelling), rinsing spray set, POT FILLER cold-water valve, two-hole mixer with individual rosettes", "Mitigeur pull-down avec douchette, mitigeur professionnel orientable, garniture de douchette de rinçage, POT FILLER eau froide, mélangeur deux trous à rosaces séparées", "Monocomando pull-down con doccetta, monocomando professionale girevole, set doccetta di risciacquo, POT FILLER acqua fredda, miscelatore a due fori con rosette singole"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "platin", "platinGeb", "messing", "messingGeb", "darkPlatinumGeb", "champagne", "champagneGeb", "darkBronzeGeb", "darkChrome"], "tara-ultra-2"),
      gruppe(FUNKTION, [["pull-down", T("Pull-down mit Brausefunktion", "Pull-down with spray function", "Pull-down avec douchette", "Pull-down con doccetta")], ["profi", T("Profi-Einhebelmischer", "Professional single-lever mixer", "Mitigeur professionnel", "Monocomando professionale")], ["spuelbrause", T("Spülbrausegarnitur", "Rinsing spray set", "Garniture de douchette de rinçage", "Set doccetta di risciacquo")], ["pot-filler", "POT FILLER"], ["zweiloch", T("Zweilochbatterie", "Two-hole mixer", "Mélangeur deux trous", "Miscelatore a due fori")]]),
    ]),
    bilder: [
      b("tara-ultra-1", "freisteller", T("Dornbracht TARA ULTRA: Küchenarmatur mit hohem Auslauf in Dark Chrome vor türkisem Verlauf", "Dornbracht TARA ULTRA: kitchen tap with tall spout in Dark Chrome against a turquoise gradient", "Dornbracht TARA ULTRA : robinet de cuisine à bec haut en Dark Chrome sur dégradé turquoise", "Dornbracht TARA ULTRA: rubinetto da cucina con bocca alta in Dark Chrome su sfumatura turchese")),
      b("tara-ultra-2", "freisteller", T("Dornbracht TARA ULTRA Einhebelmischer Pull-down mit Brausefunktion in Chrom, Produktfoto", "Dornbracht TARA ULTRA pull-down single-lever mixer with spray function in chrome, product shot", "Mitigeur pull-down Dornbracht TARA ULTRA avec fonction douchette, chromé, photo produit", "Miscelatore monocomando pull-down Dornbracht TARA ULTRA con funzione doccetta cromato, foto prodotto")),
      b("tara-ultra-3", "ambiente", T("Dornbracht TARA ULTRA in der Küche: POT FILLER in Dark Chrome über dem Kochfeld beim Kochen", "Dornbracht TARA ULTRA in the kitchen: POT FILLER in Dark Chrome above the hob while cooking", "Dornbracht TARA ULTRA en cuisine : POT FILLER Dark Chrome au-dessus de la plaque pendant la cuisson", "Dornbracht TARA ULTRA in cucina: POT FILLER in Dark Chrome sopra il piano cottura durante la cottura")),
    ],
    herstellerUrl: `${U.kuechenserien}tara-ultra`,
    quellen: [`${U.kuechenserien}tara-ultra`],
  }),
  produkt({
    slug: "dornbracht-mem-kueche",
    bereich: "kueche",
    kategorie: "armatur",
    name: "MEM",
    serie: "MEM",
    kurz: T(
      "Küchenarmatur mit hybrider Formensprache aus runden und eckigen Elementen und 180-Grad-Schwallauslauf, Design: Sieger Design. Ein integrierter Luftsprudler sorgt für einen weichen, mit Luft angereicherten Strahl.",
      "Kitchen tap with a hybrid design language of round and square elements and a 180-degree cascade spout, design: Sieger Design. An integrated aerator provides a soft, aerated jet.",
      "Robinet de cuisine au langage hybride mêlant éléments ronds et carrés, avec bec cascade à 180 degrés, design : Sieger Design. Un aérateur intégré donne un jet doux et aéré.",
      "Rubinetto da cucina dal linguaggio ibrido tra elementi tondi e squadrati, con bocca a cascata a 180 gradi, design: Sieger Design. Un aeratore integrato crea un getto morbido e aerato."
    ),
    merkmale: [
      T("Einhebelmischer, BAR TAP Einhebelmischer, kombinierbar mit seitlicher Spülbrause", "Single-lever mixer, BAR TAP single-lever mixer, combinable with a side spray", "Mitigeur, mitigeur BAR TAP, combinable avec douchette latérale", "Monocomando, monocomando BAR TAP, abbinabile a doccetta laterale"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "platin", "platinGeb", "champagne", "champagneGeb", "messing", "messingGeb", "darkChrome", "darkPlatinumGeb", "schwarzMatt"], "mem-kueche-2"),
      gruppe(FUNKTION, [["einhebelmischer", T("Einhebelmischer", "Single-lever mixer", "Mitigeur", "Monocomando")], ["bar-tap", "BAR TAP"]]),
    ]),
    bilder: [
      b("mem-kueche-1", "freisteller", T("Dornbracht MEM Küche: Küchenarmatur mit Bogenauslauf in Champagne vor gelbem Verlauf", "Dornbracht MEM kitchen: kitchen tap with arched spout in Champagne against a yellow gradient", "Dornbracht MEM cuisine : robinet de cuisine à bec en arc, finition Champagne, sur dégradé jaune", "Dornbracht MEM cucina: rubinetto da cucina con bocca ad arco in Champagne su sfumatura gialla")),
      b("mem-kueche-2", "freisteller", T("Dornbracht MEM Einhebelmischer für die Küche in Chrom, Produktfoto", "Dornbracht MEM kitchen single-lever mixer in chrome, product shot", "Mitigeur de cuisine Dornbracht MEM chromé, photo produit", "Miscelatore monocomando da cucina Dornbracht MEM cromato, foto prodotto")),
      b("mem-kueche-3", "ambiente", T("Dornbracht MEM in der Küche: Armaturen in Platin gebürstet an einer dunklen Arbeitsplatte mit Kräuterwand", "Dornbracht MEM in the kitchen: taps in brushed platinum at a dark worktop with herb wall", "Dornbracht MEM en cuisine : robinets en platine brossé sur un plan sombre avec mur d’herbes", "Dornbracht MEM in cucina: rubinetti in platino spazzolato su un piano scuro con parete di erbe")),
    ],
    herstellerUrl: `${U.kuechenserien}mem`,
    quellen: [`${U.kuechenserien}mem`],
  }),
  produkt({
    slug: "dornbracht-sync",
    bereich: "kueche",
    kategorie: "armatur",
    name: "SYNC",
    kurz: T(
      "Küchenarmatur mit konischem Übergang zwischen Körper und Auslauf und parallel verlaufender Innenkontur des kerbschnittlosen Hebels, Design: Sieger Design. Als Pull-down mit Brausefunktion und als kompakter Profi-Einhebelmischer.",
      "Kitchen tap with a conical transition between body and spout and a parallel inner contour of the notch-free lever, design: Sieger Design. As a pull-down with spray function and as a compact professional single-lever mixer.",
      "Robinet de cuisine à transition conique entre corps et bec et contour intérieur parallèle du levier sans encoche, design : Sieger Design. En pull-down avec douchette et en mitigeur professionnel compact.",
      "Rubinetto da cucina con passaggio conico tra corpo e bocca e profilo interno parallelo della leva senza intaglio, design: Sieger Design. In versione pull-down con doccetta e come monocomando professionale compatto."
    ),
    merkmale: [
      T("Profi-Einhebelmischer: Höhe 45 cm, Ausladung 20 cm (für Nischen, unter Hängeschränken oder Regalen)", "Professional single-lever mixer: height 45 cm, projection 20 cm (for niches, under wall cabinets or shelves)", "Mitigeur professionnel : hauteur 45 cm, saillie 20 cm (pour niches, sous meubles hauts ou étagères)", "Monocomando professionale: altezza 45 cm, sporgenza 20 cm (per nicchie, sotto pensili o mensole)"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "platin", "platinGeb", "champagne", "champagneGeb", "messing", "messingGeb", "darkBronzeGeb", "darkChrome", "darkPlatinumGeb", "schwarzMatt"], "sync-2"),
      gruppe(FUNKTION, [["pull-down", T("Pull-down mit Brausefunktion", "Pull-down with spray function", "Pull-down avec douchette", "Pull-down con doccetta")], ["profi", T("Profi-Einhebelmischer", "Professional single-lever mixer", "Mitigeur professionnel", "Monocomando professionale")]]),
    ]),
    zubehoer: z("kuechenbecken"),
    bilder: [
      b("sync-1", "freisteller", T("Dornbracht SYNC: Küchenarmatur in Schwarz matt vor türkisem Verlauf", "Dornbracht SYNC: kitchen tap in matt black against a turquoise gradient", "Dornbracht SYNC : robinet de cuisine noir mat sur dégradé turquoise", "Dornbracht SYNC: rubinetto da cucina nero opaco su sfumatura turchese")),
      b("sync-2", "freisteller", T("Dornbracht SYNC Einhebelmischer Pull-down mit Brausefunktion in Chrom, Produktfoto", "Dornbracht SYNC pull-down single-lever mixer with spray function in chrome, product shot", "Mitigeur pull-down Dornbracht SYNC avec fonction douchette, chromé, photo produit", "Miscelatore monocomando pull-down Dornbracht SYNC con funzione doccetta cromato, foto prodotto")),
      b("sync-3", "ambiente", T("Dornbracht SYNC in der Küche: Armatur in Dark Chrome an einer Küchenzeile mit Kupfer- und Steinfronten", "Dornbracht SYNC in the kitchen: tap in Dark Chrome on a kitchen run with copper and stone fronts", "Dornbracht SYNC en cuisine : robinet Dark Chrome sur un linéaire aux façades cuivre et pierre", "Dornbracht SYNC in cucina: rubinetto in Dark Chrome su una cucina con frontali in rame e pietra")),
    ],
    herstellerUrl: `${U.kuechenserien}sync`,
    quellen: [`${U.kuechenserien}sync`],
  }),
  produkt({
    slug: "dornbracht-tara-kueche",
    bereich: "kueche",
    kategorie: "armatur",
    name: "TARA",
    serie: "TARA",
    kurz: T(
      "Küchenarmatur mit schlanken Formen, symmetrischer Geometrie und Proportionen nach dem Goldenen Schnitt, Design: Sieger Design. Erweiterbar um Zusatzfunktionen wie Profibrause, Pull-down, POT FILLER und WATER DISPENSER.",
      "Kitchen tap with slim forms, symmetrical geometry and golden-ratio proportions, design: Sieger Design. Expandable with additional functions such as professional spray, pull-down, POT FILLER and WATER DISPENSER.",
      "Robinet de cuisine aux formes fines, à la géométrie symétrique et aux proportions du nombre d’or, design : Sieger Design. Extensible avec douchette professionnelle, pull-down, POT FILLER et WATER DISPENSER.",
      "Rubinetto da cucina dalle forme sottili, geometria simmetrica e proporzioni secondo la sezione aurea, design: Sieger Design. Ampliabile con doccetta professionale, pull-down, POT FILLER e WATER DISPENSER."
    ),
    merkmale: [
      T("3-Loch-Variante mit Kreuzgriffen; Einhebelmischer mit integrierter Profibrause und Pendelarm; PULL DOWN; POT FILLER; WATER DISPENSER mit hohem, schlankem Rohrauslauf", "Three-hole version with cross handles; single-lever mixer with integrated professional spray and swing arm; PULL DOWN; POT FILLER; WATER DISPENSER with tall, slim tubular spout", "Version trois trous à croisillons ; mitigeur avec douchette professionnelle intégrée et bras pendulaire ; PULL DOWN ; POT FILLER ; WATER DISPENSER à bec tubulaire haut et fin", "Versione a tre fori con maniglie a croce; monocomando con doccetta professionale integrata e braccio a pendolo; PULL DOWN; POT FILLER; WATER DISPENSER con bocca tubolare alta e sottile"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "platin", "platinGeb", "champagne", "messing", "messingGeb", "darkBronzeGeb", "darkChrome", "darkPlatinumGeb", "schwarzMatt"], "tara-kueche-1"),
      gruppe(FUNKTION, [["einhebelmischer", T("Einhebelmischer", "Single-lever mixer", "Mitigeur", "Monocomando")], ["dreiloch", T("3-Loch mit Kreuzgriffen", "Three-hole with cross handles", "Trois trous à croisillons", "Tre fori con maniglie a croce")], ["profibrause", T("Einhebelmischer mit Profibrause", "Single-lever mixer with professional spray", "Mitigeur avec douchette professionnelle", "Monocomando con doccetta professionale")], ["pull-down", "PULL DOWN"], ["pot-filler", "POT FILLER"], ["water-dispenser", "WATER DISPENSER"]]),
    ]),
    bilder: [
      b("tara-kueche-1", "freisteller", T("Dornbracht TARA Einhebelmischer für die Küche in Chrom, Produktfoto", "Dornbracht TARA kitchen single-lever mixer in chrome, product shot", "Mitigeur de cuisine Dornbracht TARA chromé, photo produit", "Miscelatore monocomando da cucina Dornbracht TARA cromato, foto prodotto")),
      b("tara-kueche-2", "freisteller", T("Dornbracht TARA Küchenarmatur in der Oberfläche Messing (Durabrass)", "Dornbracht TARA kitchen tap in a brass finish (Durabrass)", "Robinet de cuisine Dornbracht TARA, finition laiton (Durabrass)", "Rubinetto da cucina Dornbracht TARA in finitura ottone (Durabrass)")),
      b("tara-kueche-3", "ambiente", T("Dornbracht TARA in der Küche: helle Küchenzeile mit Holzfronten und Armatur über dem Becken", "Dornbracht TARA in the kitchen: light kitchen run with wooden fronts and tap above the sink", "Dornbracht TARA en cuisine : cuisine claire aux façades bois avec robinet au-dessus de l’évier", "Dornbracht TARA in cucina: cucina chiara con frontali in legno e rubinetto sopra il lavello")),
    ],
    herstellerUrl: `${U.kuechenserien}tara`,
    quellen: [`${U.kuechenserien}tara`],
  }),
  produkt({
    slug: "dornbracht-lot",
    bereich: "kueche",
    kategorie: "armatur",
    name: "LOT",
    kurz: T(
      "Skulpturale Küchenarmatur mit extrem flachem, aus einem Stück gefertigtem Auslauf in rechtwinkliger Form, Design: Sieger Design. Als Einhebelmischer und als BAR TAP Zweilochbatterie.",
      "Sculptural kitchen tap with an extremely flat, right-angled spout made from a single piece, design: Sieger Design. As a single-lever mixer and as a BAR TAP two-hole mixer.",
      "Robinet de cuisine sculptural au bec très plat à angle droit, réalisé d’une seule pièce, design : Sieger Design. En mitigeur et en mélangeur deux trous BAR TAP.",
      "Rubinetto da cucina scultoreo con bocca estremamente piatta ad angolo retto, ricavata da un unico pezzo, design: Sieger Design. Come monocomando e come miscelatore a due fori BAR TAP."
    ),
    merkmale: [
      T("Einhebelmischer; BAR TAP Zweilochbatterie mit Einzelrosetten", "Single-lever mixer; BAR TAP two-hole mixer with individual rosettes", "Mitigeur ; mélangeur deux trous BAR TAP à rosaces séparées", "Monocomando; miscelatore a due fori BAR TAP con rosette singole"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "platin", "platinGeb", "champagne", "champagneGeb", "messingGeb", "darkChrome", "darkPlatinumGeb"], "lot-2"),
      gruppe(FUNKTION, [["einhebelmischer", T("Einhebelmischer", "Single-lever mixer", "Mitigeur", "Monocomando")], ["bar-tap", "BAR TAP"]]),
    ]),
    bilder: [
      b("lot-1", "freisteller", T("Dornbracht LOT: Küchenarmatur mit flachem, rechtwinkligem Auslauf in Dark Platinum vor türkisem Verlauf", "Dornbracht LOT: kitchen tap with flat, right-angled spout in Dark Platinum against a turquoise gradient", "Dornbracht LOT : robinet de cuisine à bec plat à angle droit en Dark Platinum sur dégradé turquoise", "Dornbracht LOT: rubinetto da cucina con bocca piatta ad angolo retto in Dark Platinum su sfumatura turchese")),
      b("lot-2", "freisteller", T("Dornbracht LOT Einhebelmischer in Chrom, Produktfoto", "Dornbracht LOT single-lever mixer in chrome, product shot", "Mitigeur Dornbracht LOT chromé, photo produit", "Miscelatore monocomando Dornbracht LOT cromato, foto prodotto")),
      b("lot-3", "ambiente", T("Dornbracht LOT in der Küche: Armatur in Dark Platinum an einer weißen Kücheninsel vor goldfarbener Wand", "Dornbracht LOT in the kitchen: tap in Dark Platinum at a white kitchen island in front of a gold-coloured wall", "Dornbracht LOT en cuisine : robinet Dark Platinum sur un îlot blanc devant un mur doré", "Dornbracht LOT in cucina: rubinetto in Dark Platinum su un’isola bianca davanti a una parete dorata")),
    ],
    herstellerUrl: `${U.kuechenserien}lot`,
    quellen: [`${U.kuechenserien}lot`],
  }),
  produkt({
    slug: "dornbracht-eno",
    bereich: "kueche",
    kategorie: "armatur",
    name: "ENO",
    kurz: T(
      "Sachliche Küchenarmatur mit zylindrischem Körper und präzisem 90°-Öffnungswinkel des Hebels, Design: Sieger Design. In neutraler Hebelstellung fließt ausschließlich kaltes Wasser.",
      "Functional kitchen tap with a cylindrical body and a precise 90° opening angle of the lever, design: Sieger Design. In the neutral lever position only cold water flows.",
      "Robinet de cuisine sobre au corps cylindrique, avec angle d’ouverture du levier de 90°, design : Sieger Design. En position neutre du levier, seule l’eau froide coule.",
      "Rubinetto da cucina essenziale con corpo cilindrico e angolo di apertura della leva di 90°, design: Sieger Design. In posizione neutra della leva esce solo acqua fredda."
    ),
    merkmale: [
      T("Drei Funktionsvarianten: Einhebelmischer, PULL-OUT mit herausziehbarer Brause, PULL-OUT mit herausziehbarem Auslauf", "Three function variants: single-lever mixer, PULL-OUT with pull-out spray, PULL-OUT with pull-out spout", "Trois variantes : mitigeur, PULL-OUT à douchette extractible, PULL-OUT à bec extractible", "Tre varianti: monocomando, PULL-OUT con doccetta estraibile, PULL-OUT con bocca estraibile"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "platinGeb", "messingGeb", "platin", "schwarzMatt", "messing", "darkPlatinumGeb"]),
      gruppe(FUNKTION, [["einhebelmischer", T("Einhebelmischer", "Single-lever mixer", "Mitigeur", "Monocomando")], ["pull-out-brause", T("PULL-OUT mit herausziehbarer Brause", "PULL-OUT with pull-out spray", "PULL-OUT à douchette extractible", "PULL-OUT con doccetta estraibile")], ["pull-out-auslauf", T("PULL-OUT mit herausziehbarem Auslauf", "PULL-OUT with pull-out spout", "PULL-OUT à bec extractible", "PULL-OUT con bocca estraibile")]]),
    ]),
    bilder: [
      b("eno-1", "freisteller", T("Dornbracht ENO: Küchenarmatur in Chrom vor grün-gelbem Verlauf", "Dornbracht ENO: kitchen tap in chrome against a green-yellow gradient", "Dornbracht ENO : robinet de cuisine chromé sur dégradé vert-jaune", "Dornbracht ENO: rubinetto da cucina cromato su sfumatura verde-gialla")),
      b("eno-2", "ambiente", T("Dornbracht ENO: PULL-OUT-Küchenarmatur an einem Edelstahlbecken in einer dunklen Küche", "Dornbracht ENO: PULL-OUT kitchen tap at a stainless steel sink in a dark kitchen", "Dornbracht ENO : robinet de cuisine PULL-OUT sur un évier inox dans une cuisine sombre", "Dornbracht ENO: rubinetto da cucina PULL-OUT su un lavello inox in una cucina scura")),
    ],
    herstellerUrl: `${U.kuechenserien}eno`,
    quellen: [`${U.kuechenserien}eno`],
  }),
  produkt({
    slug: "dornbracht-elio",
    bereich: "kueche",
    kategorie: "armatur",
    name: "ELIO",
    kurz: T(
      "Küchenarmatur mit runden, harmonischen Formen, ausgelegt auf ergonomische Bewegungsabläufe im Küchenalltag, Design: Sieger Design. Als PULL-OUT-Einhebelmischer mit herausziehbarem Auslauf und Strahlumstellung per Knopfdruck.",
      "Kitchen tap with round, harmonious forms, designed for ergonomic everyday movements, design: Sieger Design. As a PULL-OUT single-lever mixer with pull-out spout and push-button spray switching.",
      "Robinet de cuisine aux formes rondes et harmonieuses, pensé pour des gestes ergonomiques au quotidien, design : Sieger Design. En mitigeur PULL-OUT à bec extractible et changement de jet par bouton.",
      "Rubinetto da cucina dalle forme tonde e armoniose, pensato per movimenti ergonomici quotidiani, design: Sieger Design. Come monocomando PULL-OUT con bocca estraibile e cambio getto a pulsante."
    ),
    merkmale: [
      T("Gewebeumflochtener Schlauch, laut Hersteller knickbeständig und nahezu geräuschlos", "Fabric-braided hose, according to the manufacturer kink-resistant and almost silent", "Flexible tressé textile, selon le fabricant résistant au pliage et quasi silencieux", "Tubo rivestito in tessuto, secondo il produttore resistente alle pieghe e quasi silenzioso"),
      T("Kombinierbar mit dem TARA ULTRA POT FILLER", "Combinable with the TARA ULTRA POT FILLER", "Combinable avec le POT FILLER TARA ULTRA", "Abbinabile al POT FILLER TARA ULTRA"),
    ],
    designer: "Sieger Design",
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "chromGeb", "platinGeb", "messingGeb", "platin", "schwarzMatt", "messing", "darkBronzeGeb", "darkPlatinumGeb"]),
    ]),
    zubehoer: z("tara-ultra", "kuechenbecken"),
    bilder: [
      b("elio-1", "freisteller", T("Dornbracht ELIO: Küchenarmatur in Chrom gebürstet vor grün-gelbem Verlauf", "Dornbracht ELIO: kitchen tap in brushed chrome against a green-yellow gradient", "Dornbracht ELIO : robinet de cuisine en chrome brossé sur dégradé vert-jaune", "Dornbracht ELIO: rubinetto da cucina in cromo spazzolato su sfumatura verde-gialla")),
      b("elio-2", "ambiente", T("Dornbracht ELIO: PULL-OUT-Küchenarmatur mit herausgezogener Brause an einem Edelstahlbecken", "Dornbracht ELIO: PULL-OUT kitchen tap with extended spray at a stainless steel sink", "Dornbracht ELIO : robinet de cuisine PULL-OUT, douchette sortie, sur un évier inox", "Dornbracht ELIO: rubinetto da cucina PULL-OUT con doccetta estratta su un lavello inox")),
    ],
    herstellerUrl: `${U.kuechenserien}elio`,
    quellen: [`${U.kuechenserien}elio`],
  }),
  produkt({
    slug: "dornbracht-piur",
    bereich: "kueche",
    kategorie: "armatur",
    name: "DORNBRACHT PIUR",
    kurz: T(
      "Küchenarmatur der Projektserien in L-Form, die laut Hersteller unter Oberschränke und auf jede Kücheninsel passt. Einhebelmischer mit Kalt-Start-Funktion und 360° Schwenkbarkeit.",
      "L-shaped kitchen tap from the project series which, according to the manufacturer, fits under wall cabinets and on any kitchen island. Single-lever mixer with cold-start function and 360° swivel.",
      "Robinet de cuisine en L de la gamme projet qui, selon le fabricant, se place sous les meubles hauts et sur tout îlot. Mitigeur à démarrage à froid et rotation à 360°.",
      "Rubinetto da cucina a L della linea progetti che, secondo il produttore, si adatta sotto i pensili e a qualsiasi isola. Monocomando con avvio a freddo e rotazione di 360°."
    ),
    merkmale: [
      T("Einhebelmischer; Pull-out mit oder ohne Brausefunktion", "Single-lever mixer; pull-out with or without spray function", "Mitigeur ; pull-out avec ou sans fonction douchette", "Monocomando; pull-out con o senza funzione doccetta"),
    ],
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "edelstahlFinishGeb", "softBlack"], "piur-2"),
      gruppe(FUNKTION, [["einhebelmischer", T("Einhebelmischer", "Single-lever mixer", "Mitigeur", "Monocomando")], ["pull-out", "Pull-out"], ["pull-out-brause", T("Pull-out mit Brausefunktion", "Pull-out with spray function", "Pull-out avec douchette", "Pull-out con doccetta")]]),
    ]),
    bilder: [
      b("piur-1", "ambiente", T("DORNBRACHT PIUR: Küchenarmatur in L-Form an einem Edelstahlbecken in heller Küche", "DORNBRACHT PIUR: L-shaped kitchen tap at a stainless steel sink in a bright kitchen", "DORNBRACHT PIUR : robinet de cuisine en L sur un évier inox dans une cuisine claire", "DORNBRACHT PIUR: rubinetto da cucina a L su un lavello inox in una cucina luminosa")),
      b("piur-2", "freisteller", T("DORNBRACHT PIUR Einhebelmischer in Chrom, Produktfoto", "DORNBRACHT PIUR single-lever mixer in chrome, product shot", "Mitigeur DORNBRACHT PIUR chromé, photo produit", "Miscelatore monocomando DORNBRACHT PIUR cromato, foto prodotto")),
    ],
    herstellerUrl: U.piurLyv,
    quellen: [U.piurLyv, U.projektserien],
  }),
  produkt({
    slug: "dornbracht-lyv",
    bereich: "kueche",
    kategorie: "armatur",
    name: "DORNBRACHT LYV",
    kurz: T(
      "Kompakte Küchenarmatur der Projektserien mit 23,3 cm Höhe für flexiblen Einbau. Pull-out-Einhebelmischer mit optionaler Brausefunktion und 120° Schwenkbarkeit.",
      "Compact kitchen tap from the project series, 23.3 cm high for flexible installation. Pull-out single-lever mixer with optional spray function and 120° swivel.",
      "Robinet de cuisine compact de la gamme projet, haut de 23,3 cm pour une pose flexible. Mitigeur pull-out avec douchette en option et rotation à 120°.",
      "Rubinetto da cucina compatto della linea progetti, alto 23,3 cm per un’installazione flessibile. Monocomando pull-out con doccetta opzionale e rotazione di 120°."
    ),
    merkmale: [
      T("Einhebelmischer Pull-out, auch mit Brausefunktion", "Pull-out single-lever mixer, also with spray function", "Mitigeur pull-out, aussi avec fonction douchette", "Monocomando pull-out, anche con funzione doccetta"),
    ],
    masse: [mass("hoehe", "23,3 cm")],
    ausfuehrungen: Object.freeze([
      oberflaechen(["chrom", "edelstahlFinishGeb", "softBlack"], "lyv-2"),
      gruppe(FUNKTION, [["pull-out", "Pull-out"], ["pull-out-brause", T("Pull-out mit Brausefunktion", "Pull-out with spray function", "Pull-out avec douchette", "Pull-out con doccetta")]]),
    ]),
    bilder: [
      b("lyv-1", "ambiente", T("DORNBRACHT LYV: kompakte Küchenarmatur in Edelstahl-Optik an einer Spüle vor türkiser Wand", "DORNBRACHT LYV: compact kitchen tap in stainless-steel look at a sink in front of a turquoise wall", "DORNBRACHT LYV : robinet de cuisine compact aspect inox sur un évier devant un mur turquoise", "DORNBRACHT LYV: rubinetto da cucina compatto effetto acciaio su un lavello davanti a una parete turchese")),
      b("lyv-2", "freisteller", T("DORNBRACHT LYV Einhebelmischer Pull-out in Chrom, Produktfoto", "DORNBRACHT LYV pull-out single-lever mixer in chrome, product shot", "Mitigeur pull-out DORNBRACHT LYV chromé, photo produit", "Miscelatore monocomando pull-out DORNBRACHT LYV cromato, foto prodotto")),
    ],
    herstellerUrl: U.piurLyv,
    quellen: [U.piurLyv, U.projektserien],
  }),
  produkt({
    slug: "dornbracht-kuechenbecken",
    bereich: "kueche",
    kategorie: "spuele",
    name: "Küchenbecken",
    kurz: T(
      "Küchenbecken in Edelstahl gebürstet und in glasiertem Stahl (Schwarz matt), als Einzel- oder Doppelbecken. Laut Hersteller steht beim Edelstahl das Ablaufverhalten im Vordergrund.",
      "Kitchen sinks in brushed stainless steel and in glazed steel (matt black), as single or double bowls. According to the manufacturer, drainage behaviour is the focus for the stainless steel models.",
      "Éviers de cuisine en inox brossé et en acier émaillé (noir mat), à simple ou double cuve. Selon le fabricant, l’écoulement est au premier plan pour les modèles inox.",
      "Lavelli da cucina in acciaio inox spazzolato e in acciaio smaltato (nero opaco), a vasca singola o doppia. Secondo il produttore, per i modelli in inox è centrale il deflusso."
    ),
    merkmale: [
      T("Edelstahl gebürstet: sechs Einzelbecken, ein Doppelbecken; glasierter Stahl Schwarz matt: drei Einzelbecken", "Brushed stainless steel: six single bowls, one double bowl; glazed steel matt black: three single bowls", "Inox brossé : six cuves simples, une double ; acier émaillé noir mat : trois cuves simples", "Inox spazzolato: sei vasche singole, una doppia; acciaio smaltato nero opaco: tre vasche singole"),
    ],
    ausfuehrungen: Object.freeze([
      gruppe(G("Material", "Material", "Matériau", "Materiale"), [["edelstahl-gebuerstet", T("Edelstahl gebürstet", "Brushed stainless steel", "Inox brossé", "Acciaio inox spazzolato"), { code: "86", standard: true, bilder: Object.freeze([src("kuechenspuelen-2")]) }], ["glasierter-stahl-schwarz-matt", T("Glasierter Stahl, Schwarz matt", "Glazed steel, matt black", "Acier émaillé, noir mat", "Acciaio smaltato, nero opaco"), { code: "71" }]]),
      gruppe(G("Becken", "Bowl", "Cuve", "Vasca"), [["einzelbecken", T("Einzelbecken", "Single bowl", "Cuve simple", "Vasca singola")], ["doppelbecken", T("Doppelbecken", "Double bowl", "Cuve double", "Vasca doppia")]]),
    ]),
    zubehoer: z("elio", "sync"),
    bilder: [
      b("kuechenspuelen-1", "ambiente", T("Dornbracht Doppelbecken aus gebürstetem Edelstahl mit zwei Küchenarmaturen in heller Steinarbeitsplatte", "Dornbracht double sink in brushed stainless steel with two kitchen taps in a light stone worktop", "Évier double Dornbracht en inox brossé avec deux robinets dans un plan en pierre clair", "Lavello doppio Dornbracht in inox spazzolato con due rubinetti in un piano in pietra chiara")),
      b("kuechenspuelen-2", "freisteller", T("Dornbracht Einzelbecken aus gebürstetem Edelstahl mit Küchenarmatur, Produktfoto", "Dornbracht single bowl in brushed stainless steel with kitchen tap, product shot", "Évier simple Dornbracht en inox brossé avec robinet, photo produit", "Lavello singolo Dornbracht in inox spazzolato con rubinetto, foto prodotto")),
    ],
    herstellerUrl: `${DA}kueche/kuechenspuelen/`,
    quellen: [`${DA}kueche/kuechenspuelen/`, `${DA}kueche/kuechenspuelen/aus-edelstahl`, `${DA}kueche/kuechenspuelen/aus-glasiertem-stahl`],
  }),
]);

/** Alle Produkte: Bad & Wellness + Küche (Feld welt, K2). @type {import("../schema.js").KatalogProdukt[]} */
export const PRODUKTE = Object.freeze([...BAD_WELLNESS, ...KUECHE_VORBEREITET.map((p) => Object.freeze({ ...p, welt: "kuechengeraete" }))]);
