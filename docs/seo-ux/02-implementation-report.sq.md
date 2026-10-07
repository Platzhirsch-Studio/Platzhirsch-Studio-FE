# Platzhirsch Home Living – Përmirësimi SEO / UX / Inxhinierik, raport i zbatimit

Data: 2026-10-06 · Branch: `feature/seo-ux-overhaul` (nga `develop`) · Statusi: zbatuar lokalisht, **pa commit, pa deploy**.
Versioni anglisht: `02-implementation-report.md`.

## 1. Ku ndodhet faqja (gjendja fillestare)

| Sinjali | Gjetja |
|---|---|
| Visibiliteti (SISTRIX, DE/AT) | ≈ 0. 52 fjalë kyçe në renditje në Gjermani, indeksi i visibilitetit arriti maksimumin 0.045 në 2021. URL-të që renditen janë faqet e vjetra `/de/produkte/{marka}` dhe `/de/produkte/{marka}/{produkt}`. |
| Konkurrentët në SERP | Për "minotti" (AT): m-studio.at, kramerundkramer.at, moebelfirst.de, seipp.com, wohnsinnspreise.at. Për "designermöbel" (AT): kare.at, wohndesign-maierhofer.at, ambientedirect.com, boconcept.com, connox.at. Platzhirsch nuk shfaqet. |
| Faqja live vs. `develop` | Prodhimi (`main`) ende shërben faqen e vjetër me 3.517 URL në sitemap, 3.209 prej tyre URL produkte nën `/{locale}/produkte/{marka}/…`. Në `develop` çdo njëra prej tyre kthente **404** – rreziku më i madh i relaunch-it. |
| SEO teknik në `develop` | Bazë e mirë ekzistonte (canonical + hreflang, sitemap index, robots, JSON-LD, `next/font`). Mangësi: H1 i faqes kryesore vinte nga CMS dhe ishte i fshehur derisa të ngarkohej JS; landing pages lokale ishin `noindex`, jashtë sitemap-it dhe redirect-et e vjetra i anashkalonin; faqet e markave kishin bio gjermane të pashkurtuar si meta description dhe `og:description` "Learn more about undefined"; fushat CMS mund të mbishkruanin canonical-in; faqet e produkteve EN/FR/IT merrnin titull/përshkrim gjerman (tituj dublikatë); një artikull lajmesh i papërkthyer rrëzohej me HTTP 500 në EN/FR/IT. |
| Privatësia | Google Maps dhe Street View ngarkoheshin para pëlqimit, ndonëse banner-i i cookies e liston Maps si opt-in; çdo klik pëlqimi ringarkonte faqen; preconnect te Google para pëlqimit. |
| Aksesueshmëria | Ari (#d1b250) për tekst të vogël mbi të bardhë = kontrast 2.0:1 (dështon WCAG AA); ndërruesi i gjuhës ishte një `div` me hover-toggle (i prishur në tabletë touch, i paarritshëm me tastierë); butonat hamburger/mbyll/social pa emër; etiketat e formularit të kërkesës të palidhura me fushat; karuseli pa buton pauze. |
| Inxhinieria | ~20 skedarë të vdekur (faqe të vjetra, komponentë të papërdorur, një konfigurim i dytë i18n, një layout root që lexonte cookies çdo 500 ms), një "/" i tepërt në faqen kryesore, `JSON.parse` i pambrojtur i `localStorage.cart` që mund të zbardhte gjithë faqen, pa timeout në fetch (një render dev zgjati 4,7 min me backend të bllokuar). |

Kujdes për matjet: serveri në portin 3100 që përdorën auditet e mëparshme është server **development** (React i paminifikuar, devtools). Të gjitha numrat e performancës më poshtë vijnë nga një `next build` + `next start` real.

## 2. Çfarë u ndryshua

### 2.1 Rikuperimi i renditjeve të vjetra (P0)
- **URL-të e vjetra të katalogut kthejnë 308 në vend të 404** (`src/lib/seo/legacyProductRedirects.js`, i lidhur në `produkte/[category]/page.js` dhe `produkte/[category]/[product]/page.js`):
  - `/{locale}/produkte/{marka}` → faqja e markës `/{locale}/…/marken/{marka}` (funksionon edhe për `/en/products/…`, `/fr/produits/…`, `/it/prodotti/…`).
  - `/{locale}/produkte/{marka}/{slug-i-vjetër}` → rekordi i vjetër "Produkte" merret nga backoffice-i i prodhimit (ende online) për emrin + markën, katalogu i ri kërkohet për të njëjtin produkt dhe vizitori del në `/produkte/{kategori}/{path_field}`. Nëse produkti nuk ekziston më, faqja e markës është fallback, kështu që ekuiteti i linkeve bie te entiteti i duhur.
  - Një produkt valid nën segment kategorie të gabuar tani ridrejtohet në URL-në kanonike në vend të 404.
- URL-të e vjetra lokale (`/exklusive-kuechen-vorarlberg`, `/interior-design-beratung-planung-vorarlberg`, `/wohnkonzepte-wohnzimmer-vorarlberg`) tani çojnë te landing pages përkatëse (`next.config.js`).

### 2.2 SEO on-page
- **H1 i faqes kryesore** është tani një rresht statik, i renderuar në server, në hero ("Designermöbel & Interior Design in Vorarlberg", i përkthyer), i dukshëm në çdo slide. Emrat e markave në slide nuk janë më `h2` (react-slick klonon çdo slide, që prodhonte ~15 tituj dublikatë). Titulli CMS i seksionit About u bë `h2` i parë.
- **Landing pages lokale** (`/de/kuechen-vorarlberg`, `/de/designermoebel-bregenz`, `/de/moebel-bodensee`, `/de/interior-design-vorarlberg`, `/de/wohnzimmer-einrichten-vorarlberg`): `index,follow`, të shtuara në `sitemap-static.xml`, JSON-LD `WebPage` + `BreadcrumbList` + `FAQPage`, Open Graph, titull më i shkurtër për faqen e interior design.
- **Faqet e markave**: meta description e shkurtuar në gjatësi snippet-i (`toMetaDescription`), `og:description`/`og:image alt` të rregulluara, markat e panjohura `noindex`.
- **Faqet e produkteve**: titujt dhe përshkrimet EN/FR/IT preferojnë tani tekstin e lokalizuar të produktit mbi meta-n gjermane të CMS (jo më tituj identikë në 4 gjuhë). Emri i markës lidhet me faqen e markës.
- **Lajmet**: artikujt nuk rrëzohen më kur mungon përkthimi (fallback te titulli gjerman për `<title>` dhe `<h1>`); gabimi i regex-it (`/s+/` hiqte shkronjën "s") u rregullua; `<title>` i hub-it përdor realisht titullin nga CMS.
- **Canonical-et** nuk mund të mbishkruhen më nga një fushë URL e CMS në beratung, kontakt, news, karriere, marken, partner, presse, team. Breadcrumb JSON-LD nuk nxjerr më `…/de/de`.
- **URL-të e përkthyera**: `/en/beratung`, `/fr/kontakt`, `/it/merkliste`, `/fr/news` etc. tani bëjnë 308 te URL-ja kanonike e përkthyer në vend që të shërbejnë dublikatë (middleware `src/proxy.js`).
- Fallback-u i metadata-s së home (CMS poshtë) mban tani canonical, hreflang dhe robots. H1 i faqes About është përshkrues, jo vetëm fjala "PLATZHIRSCH". Faqja 404 ka H1 real dhe linke te produktet, markat dhe kontakti.
- `/[locale]/[slug]` eksporton `revalidate = 3600` dhe pre-renderon vetëm slug-et që shërben realisht.

### 2.3 Privatësia dhe pëlqimi
- `ConsentEmbed` vendos Google Maps (kontakt) dhe Street View (rreth nesh) pas opt-in-it ekzistues "Google Maps", me një placeholder "Ngarko hartën" me një klik; pëlqimi i ruajtur nga banner-i merret live përmes eventit `ph-consent-change`.
- Banner-i i cookies: jo më `window.location.reload()`; zgjedhja aplikohet në vend (Consent Mode update, ngarkim GA kur lejohet). Modali i cilësimeve është `role="dialog"` real me buton mbylljeje dhe Escape; "shfaq preferencat" është buton; Prano dhe Refuzo kanë peshë vizuale të barabartë; shiriti është më kompakt në telefon dhe nuk fut më një `<h3>` në outline-in e çdo faqeje.
- Hequr preconnect/dns-prefetch te Google që ndizeshin para pëlqimit.

### 2.4 UX, aksesueshmëri, konvertim
- Token dizajni `--color-gold-text` (#8a6d1f, ≈4.9:1 mbi të bardhë) për eyebrow/etiketa mbi sfonde të çelëta; `#d1b250` mbetet për butona, kornizë dhe panele të errëta. Outline global `:focus-visible` dhe `scroll-padding-top` që ankorat të mos bien nën header-in fiks.
- Navbar: ndërruesi i gjuhës është buton real (`aria-expanded`, hapet me klik, pa bug hover-toggle në tabletë), Escape mbyll menutë/drawer-in/kërkimin, mega-menutë hapen me fokus tastiere, hamburger dhe butoni mbyll me etiketë dhe 44 px, drawer-i është `dialog` me etiketë, navigimi desktop është landmark `<nav>`, fusha e kërkimit me etiketë, alt i logos kuptimplotë, linku i merkliste-s njofton numrin, **tap-to-call në header-in mobil**, link "Të gjitha produktet" brenda akordeonit mobil të produkteve, karta Outdoor çon te grupi Outdoor, `prefetch={true}` hequr nga çdo link i navbar-it.
- Faqja e markës: paneli i errët i showroom-it ofron tani **Rezervo konsultë** (primar), **telefon** dhe e-mail në vend të një `mailto:` të vetëm; `<main>`/`<header>` të ndërfutura u zëvendësuan me `<section>`/`<div>`.
- Faqja e produktit: **CTA telefoni** pranë "Kërko konsultë"; emri i markës lidhet me faqen e markës.
- Faqja e kontaktit: linku "udhëzime" gjithmonë i dukshëm (ishte vetëm në hover); imazhi i marker-it dekorativ.
- Karuseli hero: kontroll pauzë/luaj (WCAG 2.2.2), CTA e slide-it ka tekst real linku, `setInterval` 300 ms që skanonte DOM-in u hoq (rendi i tab-it rregullohet me `afterChange`).
- Formulari i kërkesës për produkt: çdo etiketë e lidhur me fushën e saj (`htmlFor`/`id`), `autocomplete` për emër/e-mail/adresë, focus ring në ngjyrën e markës.
- Footer dhe shiriti i pëlqimit u nxorën jashtë `<main>`; rikthimi i scroll-it nga shfletuesi u riaktivizua (Back nuk hidhet më në krye të faqeve të katalogut).

### 2.5 Higjienë inxhinierike
- Timeout 15 s në fetch-et e produkteve, markave, layout-it dhe home.
- `JSON.parse(localStorage.cart)` i mbrojtur; vlerat e korruptuara hidhen në vend që të rrëzojnë aplikacionin.
- "/" i tepërt në faqen kryesore u hoq; imazhi i sfondit CSS 355 KB i seksionit të përfitimeve kalon tani përmes `next/image`.
- Kod i vdekur i hequr: `produkte/pageold.js`, `components/Unusable/page.js`, `i18n/request.js`, `i18n/routing.js`, `app/ClientLayout.js`, 14 komponentë të papërdorur (banner-a të vjetër, faqet Outdoor/Wohnen, itemsgrid, services, work me gabim sintakse, seksioni vernissage), 4 PNG flamuj të papërdorur. Popup-i i Vernissage-s i skaduar (shfaqja e fundit 2026-09-04) nuk montohet më; komponenti mbetet për eventin tjetër.
- `*.log` ignorohet nga git. Çelësa të rinj përkthimi në të katër `messages/*.json`.

### 2.6 Ridizajnimi i faqes kryesore (kërkuar gjatë sesionit)
Të dhënat e fjalëve kyçe (SISTRIX, klikime/muaj): "minotti" AT 500, "poliform" AT 350, "designermöbel" AT 200 / CH 300 / IT ("mobili di design") 300, "einrichtungshaus" AT 40, "interior design vorarlberg" 20, "küchenstudio vorarlberg" 20; qëllimi i kërkimit për "designermöbel" është **do + visit**. Prandaj faqja kryesore hapet me markat dhe showroom-in, jo me një slideshow markash.

Rendi i ri i seksioneve (të gjitha seksionet e reja janë komponentë server, pa JavaScript karuseli në faqen kryesore):
1. **Hero** (`Home/Hero.js`): imazh Minotti full-bleed me gradient majtas, eyebrow, H1 "Designermöbel, Küchen & Interior Design in Vorarlberg", nëntitull, CTA primar *Beratungstermin vereinbaren*, sekondar *Marken entdecken*, rresht besimi (35+ marka · showroom Lochau · dërgesë AT/DE/CH) dhe shtatë emrat më të fortë të markave si linke mbi fold.
2. **Muri i markave** (`Home/BrandWall.js`): 12 logo nga doctype-i Marken (Minotti, Poliform, Rimadesio, Flos, Paola Lenti, Tom Dixon, ClassiCon, Treca, Eichholtz, Gloster, Tonon, Next125 të parat), secili link te faqja e markës, link "të gjitha 36 markat". Zëvendëson marquee-n e logove me react-slick në seksionin About.
3. **Pllakat e kategorive** (`Home/CategoryTiles.js`): gjashtë botë produktesh me numër live produktesh (divane, krevate, tavolina, kuzhina, ndriçim, outdoor lounge) që çojnë te `/produkte/[category]`.
4. About (tekst CMS, i pandryshuar), produktet trend, përfitimet.
5. **Rajone & shërbime** (`Home/RegionLinks.js`, vetëm gjermanisht): pesë landing pages lokale si karta plus zona e shërbimit (Lochau · Bregenz · Dornbirn · Feldkirch · Lindau · Friedrichshafen · St. Gallen · Vaduz).
6. Teaser lajmesh.
7. **CTA e showroom-it** (`Home/ShowroomCta.js`): eyebrow + CTA nga CMS, buton telefoni dhe një kartë `<address>` me rrugën, orarin, shënimin për termin dhe link *Route planen*. Zëvendëson `Home/choice.js` (tekst butoni i gjeneruar me CSS, pa adresë).

Hequr nga repo: `Home/banner.js` (hero react-slick), `Home/choice.js`; seksioni About humbi marquee-n slick. Gjuha e dizajnit u ruajt: Montserrat, ink `#30373e`, ar `#d1b250` (butona/panele të errëta) dhe `#8a6d1f` (tekst mbi të bardhë), radius 3 px, hapësirë editoriale, pllaka imazhi 4/3.

### 2.7 Identiteti vizual dhe lëvizja (raundi i dytë i dizajnit, kërkuar gjatë sesionit)
- **Fonti display**: Bodoni Moda (përmes `next/font`, i vetë-hostuar, variabël me madhësi optike) për H1 dhe të gjithë titujt e seksioneve të faqes kryesore; Montserrat mbetet për UI dhe tekst. Serifi italian me kontrast të lartë është tipografia e markave në showroom (Minotti, Poliform, Flos), prandaj lexohet si *ky* showroom dhe jo si template. I ekspozuar si utility `font-display`; token-at e dizajnit `stone` (#ece8e1), `bone` (#f7f5f1), `walnut`, `gold`, `gold-text`, `ink` jetojnë në `globals.css` `@theme`.
- **Lëvizja, vetëm tre mjete, të gjitha CSS dhe të gjitha të fikura nën `prefers-reduced-motion`**: (1) një hyrje e vetme në ngarkim – teksti i hero-s ngjitet butë ndërsa fotografia zbutet nga një zoom 6 %; (2) shfaqje seksionesh të drejtuara nga scroll-i me CSS `animation-timeline: view()` (pa JavaScript, pa IntersectionObserver; shfletuesit pa të e tregojnë përmbajtjen statike); (3) një brez tipografik i ngadaltë me të 36 emrat e markave në Bodoni mbi murin e logove, në pauzë në hover/fokus. Hover: fotot e kategorive zmadhohen 3 %, logot kalojnë nga gri në ngjyrë.
- **Struktura e faqes kryesore**: hero full-bleed (H1, fjali hyrëse, dy CTA, rresht besimi, shtatë linke markash) → brez markash + mur logosh → shtrirje kategorish (një pllakë 2×2, pesë pllaka 4:3, pa boshllëqe) → About (CMS) → produkte trend → përfitime → **bllok editorial SEO me FAQ** → rajone (DE) → lajme → seksioni i showroom-it në të njëjtën sipërfaqe guri gëlqeror si seksionet e tjera full-width (adresa, orari, rruga, telefoni).
- **Përmbajtje për katër tregjet** (`src/lib/content/homeSeo.js`): tekst editorial me dy paragrafë dhe FAQ me katër pyetje për gjuhë, shkruar rreth grupimeve SISTRIX – termat e markave, "designermöbel" (AT/CH), "mobili di design" (IT) dhe grupi lokal (Vorarlberg, Bodensee, Bregenz, Lindau, Ostschweiz). Përdoren vetëm fakte që faqja i thotë tashmë (36 marka, adresa, orari, planifikimi, dërgesa dhe montimi në AT·DE·CH). FAQ nxirret edhe si JSON-LD `FAQPage`.
- **Kapje leads pa forma** (zgjedhja e pronarit: pa forma shtesë): një shirit ngjitës vetëm për telefon me *Anrufen* dhe *Termin anfragen* që shfaqet pas ekranit të parë; CTA-të e hero-s; telefon në faqet e markave dhe produkteve; seksioni i showroom-it me link rruge.
- **Gabime të gjetura nga rishikimi i screenshot-eve**: transformimi hyrës i seksionit About e shtynte layout viewport-in mobil në 441 px (scroll horizontal në çdo telefon) – u rregullua (hyrje vertikale, `overflow-x: clip` në `<main>`); teksti i zbehtë me 60–75 % opacitet mbi gurin dështonte kontrastin – u errësua; grid-i i kategorive linte një pllakë jetime – u rirreshtua.

### 2.8 Footer, header-at e faqeve të brendshme dhe përmbajtja me fjalë kyçe (raundi i tretë)
- **Footer** (`Reusable/Footer.js`, të gjitha faqet): sipërfaqe ink, tituj me fontin display, një tagline me fjalë kyçe ("Einrichtungshaus für Designermöbel, Designerküchen und Leuchten am Bodensee …"), dy butona konvertimi (konsultë, telefon), pastaj katër kolona – Showroom (adresa, orari, e-mail, rruga, social), Markat (10 faqe markash), Botët e produkteve (8 faqe kategorish), Shërbime & rajone (konsultë, kontakt, rreth nesh, newsletter, pesë landing pages gjermane, café) – dhe rreshti ligjor. Titujt e footer-it janë `h2` (jo më `h3` pas `h1`).
- **Header-at e katalogut** (`Reusable/breadcrumbBar.js`): header guri gëlqeror me breadcrumb semantik (`<nav>`/`<ol>`, `aria-current`), titulli në Bodoni dhe një fjali hyrëse identike me meta description – hub-i dhe çdo faqe kategorie e kanë tani.
- **Header-at e faqeve të përmbajtjes** (`Reusable/singlePageSlider.js`, 13 faqe: Beratung, Kontakt, Team, News, landing pages …): tekst poshtë-majtas mbi gradient, H1 me fontin display, breadcrumb semantik, pa animacion hyrjeje.
- **Faqet e produkteve dhe markave**: H1 dhe titujt e seksioneve me fontin display (emri i markës jo më me shkronja kapitale të detyruara).
- **Fjalë kyçe nga SISTRIX (DE, klikime/muaj)**: designermöbel 1.550 · designer sofa 1.350 · einrichtungshaus 1.250 · interior design (AT) 1.250 · esstisch design 500 · minotti sofa 450 · luxus sofa 400 · design gartenmöbel 400 · innenarchitekt (AT) 300 · designerleuchten 250 · designerbetten 150 · designerküchen 150. Të aplikuara si:
  - `<title>`/description gjermane për kategori sipas çelësit (`shopSeoCopy.js`): "Designer Sofas in Vorarlberg – Sofas & Couches | …", "Designerbetten …", "Designerküchen …", "Designerleuchten …", "Design Esstische …", "Design Gartenmöbel & Loungemöbel …" etj., me tri markat më të forta të kategorisë në description.
  - Metadata fallback e faqes Beratung synon tani grupin *interior design*: "Interior Design & Einrichtungsberatung in Vorarlberg" me Innenarchitektur në description (vlerat CMS fitojnë kur janë vendosur).
  - Tagline e footer-it dhe blloku SEO i faqes kryesore përdorin *Einrichtungshaus*, *Designermöbel*, *Designerküchen*, *Leuchten*, *Bodensee*, *Vorarlberg*; termat e markave mbarten nga linket e markave në çdo faqe.

### 2.9 Ndërrimi i gjuhës (pronari raportoi një gabim gjatë ndërrimit)
U riprodhua me shfletues të automatizuar (Puppeteer kundër serverit dev) në 19 faqe nisjeje × çdo gjuhë tjetër = 57 ndërrime, duke mbledhur URL-në finale, `<html lang>`, gjendjen 404 dhe gabimet e konsolës.
- Çdo ndërrim del në URL-në e saktë të përkthyer me `lang` të saktë (p.sh. `/de/produkte/beds` → `/en/products/beds`, `/en/about-us/brands/minotti` → `/it/chi-siamo/marche/minotti`, `/de/news` → `/fr/nouvelles`).
- **Gabimi i raportuar**: në çdo ndërrim overlay-i i dev tregonte *"Encountered a script tag while rendering React component"* nga React. Shkaku: default-i i Google Consent Mode ishte një `<script>` inline (pa tip data-block) në layout-in `[locale]`; ndërrimi i gjuhës e rimonton atë layout në klient dhe React e rikrijon elementin script. Rregullimi: default-i i pëlqimit ekzekutohet tani nga `Cookies/cookiecomponent.js` (`ensureGtag`) pak para se të kërkohet gtag.js – asnjë tag i Google nuk ngarkohet para pëlqimit, kështu që sjellja është e njëjtë dhe layout-i nuk mban më asnjë `<script>` të papërpunuar. Skriptet JSON-LD (`type="application/ld+json"`) janë data block dhe nuk e shkaktonin.
- Rregulluar gjithashtu në ndërrues: pesë landing pages vetëm gjermanisht kalojnë tani te faqja kryesore e gjuhës së synuar në vend të 404; query string (`?marke=`, `?q=`) ruhet gjatë ndërrimit.
- Rezultati pas rregullimit: 57 ndërrime, 0 gabime konsole, 0 gjuhë të gabuara, 0 faqe 404.

### 2.10 Kontrolli për bugs (50 faqe, 4 gjuhë, ndërveprimet kryesore)
Ekzekutim i automatizuar me shfletues kundër serverit dev: 50 URL (gjermanisht, anglisht, frëngjisht, italisht; hub, kategori, produkte, marka, koleksion, artikull lajmesh, landing pages, faqe ligjore, 404 të qëllimshme) plus ndërveprime (pranimi i cookies, kërkimi live, merkliste, menyja mobile, Escape, shiriti i telefonit, overflow horizontal).
- Të gjitha faqet 200 (dy 404-at e qëllimshme kthejnë 404), saktësisht një `<h1>` secila, asnjë kërkesë e dështuar, asnjë gabim konsole ose JavaScript, përveç një:
- **Faqet e produkteve regjistronin një gabim hidratimi React** (ekzistonte më parë): përshkrimi nga CMS është tekst i pasur me tage `<p>` dhe renderohej brenda një elementi `<p>`. Një `<p>` brenda një `<p>` është HTML i pavlefshëm, shfletuesi e mbyll të jashtmin dhe HTML-ja e serverit nuk përputhet më me pemën e React-it. U rregullua në `ShopCatalog/productInfoTabs.js` (kontejneri është tani `<div>`). U rikontrollua në tre faqe produktesh në dy gjuhë: pa gabime.
- Ndërveprimet: pëlqimi i cookies ruhet pa ringarkim dhe shiriti zhduket; kërkimi "minotti" kthen rezultate; merkliste e ruan artikullin; menyja mobile hapet dhe mbyllet me Escape; shiriti i telefonit shfaqet pas scroll-it; gjerësia e layout-it mobil saktësisht 390 px.

### 2.11 Code review (siguri, logjikë, raste të veçanta) dhe kontrolli responsive
Tre rishikime të pavarura të gjithë ndryshimeve (siguri, korrektësi, dyfishim) plus një kontroll responsive i automatizuar (9 gjerësi nga 320 deri 1920 px × 12 faqe = 108 renderime).

**Siguria (rregulluar)**
- Zgjidhësi i URL-ve të vjetra mund të përdorej për të shumëfishuar kërkesa të pa-cache-uara te backend-i (çdo shkrim i slug-ut të markës + çdo slug i vjetër → deri në N kërkime, pa cache). Tani: vetëm slug i saktë i markës, forma e slug-ut e validuar, maksimumi dy kërkime, të dyja me cache 24 h; kërkimi në backoffice me cache 24 h.
- Segmenti i URL-së futej i papërpunuar në log → i koduar me JSON.
- Cookie `cookieConsent` ka tani `secure` në https (banner-i dhe opt-in-i i hartës).
- 13 faqe nxirrnin JSON-LD me `<script>` të papërpunuar pa escape të `<` (XSS i ruajtur nëse një vlerë CMS përmbante `</script>`) → të gjitha përdorin komponentin `JsonLd` që bën escape.
- Teksti i pasur CMS i renderuar si HTML (përshkrimet e produkteve dhe koleksioneve) reduktohet tani në një allowlist në server (`sanitizeCmsHtml`: p/br/strong/em/ul/ol/li/a me href të sigurt; script/iframe/event handler të hequr).
- Linku CTA i faqes kryesore nga CMS pranohet vetëm si rrugë relative e faqes.
- Pëlqimi: ridhënia e pëlqimit për analytics në të njëjtin sesion dërgon tani realisht "granted"; tërheqja fshin cookies `_ga`/`_ga_*`.
- Verifikuar në rregull: pa open redirect (të gjitha objektivat fillojnë me `/{locale}` + konstante rrugësh + të dhëna të slugifikuara), pa SSRF (host konstant + `encodeURIComponent`), asnjë kërkesë te Google para pëlqimit, parse i cookie-t i mbrojtur, header-at të pandryshuar.

**Logjika dhe rastet e veçanta (rregulluar)**
- Zoom-i i hero-s dilte jashtë seksionit për 1,6 s në ngarkim → `overflow-hidden`.
- Mbyllja e dialogut të cookies me Escape/sfond pa zgjedhje fshihte shiritin për gjithë sesionin SPA → shiriti kompakt mbetet derisa të ruhet një zgjedhje.
- "Cilësimet e privatësisë" në footer hapnin shiritin kompakt në vend të dialogut (dhe mund të dyfishonin shiritin) → hap dialogun direkt.
- Opt-in-i i hartës dhe banner-i mund të ndryshonin ("ruaj zgjedhjen" mbishkruante pëlqimin për hartën) → banner-i dëgjon eventin e pëlqimit.
- Shiriti i telefonit në mobil mbulonte linket ligjore të footer-it → footer-i rezervon hapësirë në telefon.
- Gjatë një ndërprerjeje të backend-it të markave çdo URL e vjetër bëhej soft 404 → gabimi propagohet (500 i ripërsëritshëm, jo de-indeksim).
- Zgjidhësi mund të bënte 308 të përhershëm te një produkt *i ngjashëm* i së njëjtës markë → vetëm përputhje e saktë e emrit, përndryshe faqja e markës.
- Faqja e kategorisë: meta description dhe hyrja e dukshme emërtonin marka të ndryshme → një `topBrandsOf()` për të dyja.
- Tastiera: mega-menutë hapeshin me fokus por nuk mbylleshin kurrë me blur → mbyllen kur fokusi largohet nga trigger-i dhe paneli; trigger-i i produkteve mori `aria-haspopup`/`aria-expanded`.
- Verifikuar në rregull: pa loop redirect-esh, pa akses `window` në SSR, të gjithë çelësat e përkthimit ekzistojnë në 4 gjuhë, skedarët e fshirë nuk importohen askund, harta `pathnames` e next-intl përputhet me dosjet reale, sitemap/landing pages konsistente.

**Kodi i dyfishtë (centralizuar tani)**
- `src/lib/site.js` është burimi i vetëm për telefonin, e-mailin, adresën, URL-në e rrugës dhe linket sociale (numri i telefonit ishte shkruar në 12 skedarë, në dy formate; faqja e kontaktit përdorte `tel:` me hapësira). Header, footer, shiriti mobil, seksioni i showroom-it, faqet e markave, veprimet e produktit, landing pages dhe faqja e kontaktit lexojnë prej tij.
- `src/lib/content/brands.js` (markat kryesore me slug, të renditura sipas slug-ut që shkrimet CMS si "Tréca"/"Treca" të mos heqin një markë) ushqen hero-n, murin e markave dhe footer-in; `src/lib/content/landingPages.js` ushqen footer-in, bllokun e rajoneve, sitemap-in dhe ndërruesin e gjuhës (katër lista më parë, dy prej tyre me komente "keep in sync").
- Token-at `night` dhe `ink-deep` zëvendësojnë hex-et e papërpunuara të overlay-ve/sfondeve në komponentët e rinj; linku i vetëm ar-mbi-të-bardhë në landing pages përdor `gold-text`.
- Tre gabime copy-paste rrugësh u rregulluan: rruga e merkliste-s kontrollonte rrugën e kontaktit, faqja About kontrollonte rrugën e partnerëve, dhe breadcrumb-i i artikujve çonte te `/fr/news` në vend të `/fr/nouvelles`.
- Konflikt përmbajtjeje u rregullua: blloku i rajoneve pretendonte kuzhina Schüller, landing page e kuzhinave emërton vetëm next125 dhe Poliform.
- Shtatë skedarë të pareferuar u hoqën (`lib/baseUrl.js`, `utils/routeMap.js`, `utils/getRoute.js`, `utils/getPathbyLocale.js`, `utils/getProductKeyword.js`, `api/Keywords/fetchProductsKeywords.js`, `components/Marken/marken.js`); nëntë çelësa përkthimi të papërdorur u hoqën nga të katër gjuhët.

**Kodi i dyfishtë (backlog, i dokumentuar nga auditi, i pandryshuar)**
- 14 skedarë faqesh përcaktojnë secili `getBaseUrl()`/`get…PageUrl()` dhe ternarë "Home"/"Produkte" (68 zinxhirë `locale === "it" ?` në 21 skedarë); ndihmësit `localeUrl`/`hreflangAlternates`/`ROUTES` ekzistojnë tashmë.
- Locale e Open Graph `de_DE` kundrejt `de_AT` dhe `inLanguage` `en` kundrejt `en-US` ndryshojnë mes faqeve → një modul `OG_LOCALE`/`IN_LANGUAGE`.
- 9 fetcher-a pothuajse identikë `lib/api/Keywords/*` → një `fetchPageKeywords(doctype)`.
- ~290 klasa inline `#30373e` dhe ~290 `#d1b250` në komponentët e vjetër ndonëse token-at ekzistojnë; dy stile butonash (i ri sentence-case kundrejt i vjetri uppercase) → një hartë e përbashkët klasash.
- 18 namespace të tërë përkthimi që asnjë komponent nuk i ngarkon (mbetje nga komponentë të fshirë).

**Kontrolli responsive**
- Pa scroll horizontal në asnjë nga 9 gjerësitë në asnjë nga 12 faqet.
- Dy overflow të gjetura dhe të rregulluara: header-i i grupit të kategorive në hub-in e katalogut në 320 px (tani thyhet) dhe adresa e-mail në kolonën e showroom-it të landing page në 1024 px (tani thyhet).
- Objektivat e vogla të prekjes (nën 32 px) që mbeten ekzistonin më parë: linket e breadcrumb (tekst 16 px), pikat e galerisë react-slick (20 px) në faqet e markave, shigjetat e thumbnail-ëve (28 px) në faqet e produkteve. Auditi i Lighthouse për tap-target kalon; zmadhimi i pikave slick është një rresht CSS si hap pasues.

### 2.12 Vazhdimi i auditit nga shfletuesi (raporti i extension-it Claude i pronarit, 2026-10-07)

Pronari e kaloi faqen nëpër një agjent shfletuesi që klikoi çdo faqe dhe ktheu një listë me prioritete. Gjetjet u ndanë në tri grupe; ky seksion mbulon grupin që rregullohet në kod. Dy të tjerët (të pavlefshme ose tashmë të rregulluara; kërkojnë material nga pronari) janë në §4/§5.

**Pretendime përmbajtjeje të zëvendësuara me fakte (të katër gjuhët)**
- `Benefits.service1/2/4` premtonin "dorëzim premium falas", "teknikë të certifikuar" dhe "garanci cilësie për gjithë jetën" — asnjëra nuk është e dokumentuar. U zëvendësuan me USP të verifikueshme: dorëzim dhe montim nga ekipi i vet në AT/DE/CH, planifikim me masë, copë origjinale në showroom.
- Eyebrow-i i faqeve të markave "Exklusiv in Österreich" → "Im Showroom in Lochau" (ekskluziviteti është pretendim kontrate që nuk mund ta verifikojmë).
- Formulari i kontaktit: "Willkommen zurück!" (pa kuptim për një vizitë të parë) → "Schreiben Sie uns"; "Hauptsitz" → "Showroom Lochau".
- Italisht: "CASA" / "Casa" si etiketë e faqes kryesore në navbar dhe në 19 skedarë breadcrumb → "Home" (konventa e web-it italian).

**Navigimi**
- Mega-menuja e produkteve: "Küchen" (kuzhina, aksesorë kuzhine) dhe "Licht" (ndriçim) janë grupe më vete, jo më të fshehura nën "Wohnaccessoires". Outdoor mban indeksin 4, kështu që ankora `#group-5` punon ende.
- Ndërruesi i gjuhës: opsionet janë linke të vërteta (`<a hreflang href>`), kështu që crawler-i i sheh dhe middle-click / long-press punojnë. URL-ja e synuar llogaritet për çdo faqe, përfshirë rrugët dinamike (produkt, markë, artikull) me përputhje të prefiksit më të gjatë në `ROUTES` — më parë `/en/produkte/beds` punonte vetëm përmes 308-ës së middleware-it. Lista mbyllet me 250 ms tolerancë që kursori të kalojë nga butoni te lista (gjetja e auditit "dropdown-i mbyllet para se të klikoj").

**Të dhënat e produktit siç shfaqen**
- Emrat e produkteve: prapashtesat e importit "(Sofas)", "(Sofas 2)", "(Variant)" hiqen në shfaqje te kartat, faqja e detajit, produktet e ngjashme dhe faqja kryesore (`cleanProductName`; slug-et të paprekura).
- Emrat e markave: "Schueller" → "Schüller", "Treca" → "Tréca" (`displayBrandName`, te kartat, faqja e produktit dhe H1 i faqes së markës).
- Përshkrimi i produktit: paragrafët e `mehr_beschreibung` që përsërisin `beschreibung` (≥ 60 % fjalë të përbashkëta) hiqen — auditi shihte të njëjtin tekst të prodhuesit dy herë te shumica e produkteve.
- Etiketa e kategorisë në faqen e produktit (breadcrumb, chip, linku "kthehu", footer): emri i kategorisë nga CMS përmes `fetchKategorien`, kështu "sofas-couches" nuk del më si slug i papërpunuar. Rezervë: tabela e vjetër e përkthimit, pastaj slug-u i humanizuar.
- Meta-përshkrimet e hub-eve nuk përmendin më Cassina (nuk është markë e shtëpisë) — Rimadesio në vend të saj.
- Blloku "trending" i faqes kryesore: produktet më të reja të Minotti-t në krye, jo alfabetikisht.

**Konvertimi**
- "Beratung anfragen" në faqen e produktit çon te wizard-i i konsultimit me `?produkt=<markë> <emër>`; fusha e mesazhit fillon me "Anfrage zu: …" që vizitori të mos ketë nevojë të thotë për cilën copë bëhet fjalë. `BeratungClient` e lexon me `useSearchParams` brenda një kufiri `<Suspense>`.
- Katalogu: 24 produkte për hap "shfaq më shumë" (ishte 12); opsionet e filtrit me zero produkte fshihen nëse nuk janë të zgjedhura, dhe një filtër me një opsion të vetëm zhduket (nuk vendos asgjë).
- Galeria e produktit: shigjetat 44 px (ishin 28 px, nën minimumin për prekje); imazhi kryesor është 4:3 në telefon dhe katror nga `lg` e lart, që titulli dhe zona e çmimit të duken pa scroll.

**Qëndrueshmëria e animacionit**
- `FadeInView`: pas 1.2 s përmbajtja detyrohet e dukshme pavarësisht IntersectionObserver-it (auditi gjeti ekipin, rrjetin e markave dhe hapat e konsultimit bosh në automatizim dhe në disa nivele zoom-i), dhe vonesat e stagger-it kufizohen në 600 ms (`index × 70 ms` i rrjetit të markave arrinte ~3 s karta bosh).

**Më të vogla**
- Gjatësia e titullit të artikujve për meta-titullin: 58 → 65 karaktere.
- Ndërrimi i gjuhës nuk navigonte me klik (raportuar nga pronari pas merge-it): header-i mbyll çdo meny kur fokusi bie jashtë një rrënje menyje, dhe lista e gjuhëve (desktop) e sirtari mobile nuk ishin shënuar si rrënjë. Mousedown-i mbi një opsion e fokusonte, lista çmontohej, dhe klikimi nuk ndodhte kurrë — në desktop që kur opsionet u bënë linke, në mobile edhe më parë. Rregulluar duke shënuar mbështjellësin e gjuhëve si rrënjë menyje dhe duke përjashtuar sirtarin mobile; verifikuar me klikime reale pointer/touch në 4 faqe desktop dhe 3 mobile (të gjitha dalin në URL-në e lokalizuar, query string i ruajtur).
- Hero i faqes kryesore në telefon dhe tablet (raportuar nga pronari): seksioni kishte lartësi fikse 600 px, ndërsa titulli + teksti + CTA-të + rreshti i besimit kërkojnë më shumë, kështu blloku dilte lart nën header-in fiks dhe H1 pritej në 360–768 px. Hero ka tani lartësi minimale në vend të fikses, H1 është 36 px në telefon (ishte 41.6 px) dhe 56 px në tablet; verifikuar me screenshot-e në 360, 390, 430, 768 dhe 1024 px.

**Verifikuar në serverin dev të pronarit (porti 3001)**: pa gabime console ose page në home, kategori, produkt, konsultim (me `?produkt=`), markë (Schüller), ekip, produktet italisht, home frëngjisht; textarea e wizard-it e parambushur pas dy hapave; linket e gjuhës zgjidhen në URL të lokalizuara në 6 lloje rrugësh; 0 blloqe FadeInView të padukshme pas 2 s në faqet e markave, lajmeve dhe home.

## 3. Verifikimi

- `next build`: **sukses** (7.560 faqe statike, ~2 min).
- Redirect-et në build-in e prodhimit (porti 3200):

| URL | Rezultati |
|---|---|
| `/de/produkte/minotti` | 308 → `/de/ueber-uns/marken/minotti` |
| `/de/produkte/solpuri/classic-esstisch-tables-solpuri` | 308 → `/de/ueber-uns/marken/solpuri` (produkti nuk është më në katalogun e ri → fallback te marka) |
| `/en/products/rimadesio` | 308 → `/en/about-us/brands/rimadesio` |
| `/en/beratung` | 308 → `/en/consultation` |
| `/fr/news` | 308 → `/fr/nouvelles` |
| `/de/kuechen-vorarlberg` | 200, `index,follow`, JSON-LD FAQPage + WebPage + BreadcrumbList |
| `/de/nonexistent` | 404 |

- Faqja kryesore: saktësisht një `<h1>`, titujt e seksioneve `h2`, asnjë kërkesë te Google para pëlqimit.
- Faqja e produktit EN: titull dhe përshkrim në anglisht (ishin në gjermanisht).

- Lighthouse 13, emulim mobil, `next build` + `next start` lokal, mediana e ekzekutimeve. "Para" = ky branch para ridizajnimit të faqes kryesore (hero i vjetër me react-slick); build-i i paprekur `develop` nuk u mat veçmas. (Shifrat e mëparshme nga porti 3100 vinin nga një server *development* dhe nuk krahasohen.)

| Faqja | Perf para → pas | A11y | Best practices | SEO | LCP para → pas | TBT para → pas |
|---|---|---|---|---|---|---|
| Home `/de` | 57 → **83** | 96 → 100¹ | 100 | 100 | 5.3 s → 4.5 s | 860 ms → **130 ms** |
| Marka `/de/ueber-uns/marken/minotti` | 80 → **83** | 96 → **100** | 100 | 100 | 4.0 s → 4.2 s | 290 ms → **100 ms** |
| Hub katalogu `/de/produkte` | 84 → **88** | 96 → 100¹ | 100 | 100 | 4.1 s → 3.8 s | 190 ms → **100 ms** |
| Kategori `/de/produkte/beds` | 86 → 84 | 94 → 100¹ | 100 | 100 | 3.6 s → 4.2 s | 220 ms → **160 ms** |

¹ Ekzekutimi final raportoi ende dy gjetje aksesueshmërie (një `<dl>` i pavlefshëm në kartën e re të showroom-it dhe tekst i zbehtë me 60 % opacitet në 3.9:1); të dyja u rregulluan menjëherë pas matjes, gjë që e verifikon ekzekutimi i konfirmimit në seksionin 3.1.

LCP-ja e mbetur (≈4 s në profil mobil 4G të ngadalësuar) është vetë fotoja e hero-s; hapat e ardhshëm janë një crop më i vogël për mobil (`<picture>`/art direction) dhe shërbimi i hero-s si AVIF.

### 3.1 Ekzekutimi i konfirmimit (build-i final, pas raundeve të dizajnit 2.6–2.8)

| Faqja | Perf | A11y | Best practices | SEO | LCP | TBT |
|---|---|---|---|---|---|---|
| Home `/de` (hero i ri, brez markash, kategori, bllok SEO, footer) | 78 | **100** | 100 | 100 | 5.0 s | 210 ms |
| Kategori `/de/produkte/beds` (header i ri, footer) | 78 | **100** | 100 | 100 | 4.7 s | 250 ms |
| Konsultë `/de/beratung` | 79 | 96 | 100 | 100 | 4.8 s | 160 ms |

Kontrolli i overflow-it horizontal në mobil (390 px): 0 elemente më të gjera se viewport-i në faqen kryesore dhe të kategorisë. LCP-ja e mbetur është fotografia full-bleed e hero-s në profil 4G të ngadalësuar; hapi tjetër është një crop i dedikuar për mobil dhe AVIF.

Të gjitha chunk-et statike të build-it final kthejnë 200, faqja kryesore nuk dërgon më JavaScript karuseli dhe redirect-et më sipër u riverifikuan në të njëjtin server.

- ESLint: repository-ja dështonte tashmë në `develop` me gabime `react-hooks/set-state-in-effect` (rregull i React Compiler në konfigurimin e Next 16, p.sh. `productGallery.js`, `CartContext.js`). Nuk u shtuan shkelje të reja; build-i nuk ekzekuton ESLint.

## 4. Vendime që duhet t'i konfirmojë pronari

1. **Landing pages janë tani të indeksueshme.** Teksti i tyre ishte shënuar në kod si "placeholder, kontrollo para indeksimit". Faktet e përdorura (Landstraße 9, Ma–Pr 10–18, Sh 10–14, dërgesë në gjithë Austrinë, lista e markave) përputhen me footer-in dhe pjesën tjetër të faqes, por ju lutem lexojini pesë faqet një herë.
2. **Pretendimet për markat**: faqet thonë "bei Platzhirsch" / "Händler" në tituj për Minotti, Poliform, Tonon, Next125, Paola Lenti. Konfirmoni që janë shitës të autorizuar para publikimit (nuk u ndryshua këtu).
3. **Adresa**: kodi dhe schema përdorin *Landstraße 9*; footer-i i vjetër live tregon *Landstraße 11*. Google Business Profile, Impressum dhe schema duhet të përputhen.
4. **NEW_API_SERVER** nuk është vendosur në `.env.local`, kështu që katalogu lexon nga instanca e brendshme dev `10.30.70.201:8000`. Duhet të tregojë backend-in e prodhimit para deploy-it.
5. **Schema e produkteve nuk ka `offers`** (nuk publikohen çmime). Search Console do tregojë paralajmërime "not eligible for rich results" për produktet; kjo pritet, derisa të shtohen çmime ose oferta "çmim me kërkesë".
6. Popup-i i Vernissage-s është çmontuar (eventi mbaroi). Rimontojeni në `client-layout.js` për eventin tjetër.
7. **Gjetje të auditit që nuk janë defekte** (raporti i agjentit të shfletuesit, 2026-10-07): "header-i sticky fsheh breadcrumb-in" (ka `scroll-padding-top`), "pa hreflang" (ekziston në çdo faqe), "formulari i Merkliste-s kërkon adresë" (API-ja e backend-it `anfrage_produkt` kërkon shtet/qytet/adresë — heqja e fushave kërkon ndryshim backend), "mungojnë datat e lajmeve" (CMS nuk i ka), "banner-i i cookies rishfaqet" (vetëm sa nuk është ruajtur asnjë zgjedhje).

## 5. Çfarë mbetet hapur (sprinti tjetër, sipas ndikimit)

1. **Deploy** i `develop` + këtij branch-i në prodhim: URL-të e vjetra rikuperohen vetëm kur 308-at janë live. Pastaj në Search Console: dërgo `sitemap.xml`, kërko indeksim për 5 landing pages dhe 10 faqet kryesore të markave, ndiq "Page with redirect".
2. **Përmbajtje marke-shitës** për AT/DE/CH/IT: çdo faqe e markave kryesore ka nevojë për 300–500 fjalë tekst origjinal për gjuhë (pjesët në showroom, shërbimet, "Minotti Händler Vorarlberg / Bodensee / Ostschweiz"), plus një seksion lokal (Lochau, Bregenz, Dornbirn, Lindau, St. Gallen). Kjo është leva kryesore kundër m-studio.at, kramerundkramer.at dhe shitësve gjermanë.
3. **Google Business Profile**: orari, fotot, produktet, postimet; faqja lidhet tani me të përmes `hasMap`.
4. **Core Web Vitals**: pesha e mbetur JS është react-slick (hero, about, faqja e markës, galeria) dhe navbar-i client prej 1.150 rreshtash. Hapat e ardhshëm: hero me CSS scroll-snap pa react-slick, ndarja e navbar-it (linke të renderuara në server + ishuj të vegjël client), `useLocale()` në vend të `usePathname()` në 15 komponentët që janë client vetëm për locale-in.
5. Pika a11y të mbetura: toggle-t e detajeve të cookies janë ende `<span onClick>`; tab-et e produktit pa navigim me shigjeta; drawer-i mobil pa focus trap.
6. Faqet e koleksioneve dhe faqja About nuk kanë ende JSON-LD; URL-të e artikujve mbeten `/fr/news/…` ndërsa hub-i është `/fr/nouvelles` (konsistente, por vlen të unifikohen).
7. Backlinks: dealer locator-ët e prodhuesve (Minotti, Poliform, Rimadesio, Flos …) duhet të lidhen me faqet e markave; direktoritë lokale (WKO, Herold, Vorarlberg Tourismus).
8. **Material nga pronari që kërkon auditi** (nuk mund të shpiket): foto projektesh/referencash me nga një paragraf; faqe "Ausstellungsstücke" me copë dhe çmime; diapazone çmimesh "ab" për kategori; vlerësime Google (link ose widget me consent); rolet e ekipit dhe kontaktet direkte; koleksionet dhe fotot e showroom-it për markë; përkthimet FR/IT të blloqeve të dealer-it në CMS; faktet e dorëzimit dhe doganës për DE/CH; numër WhatsApp ose mjet rezervimi për takime në showroom; tekstet USP "below products" në CMS.
