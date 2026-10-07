# Frappe integration — `Produkte` and `Marken` doctypes

This folder is a drop-in Frappe app module for the `platzhirsch_studio` app that
powers `/produkte/*` and the brand-story pages (`/ueber-uns/marken/*` + its en/fr/it
siblings) on this site. It was reverse-engineered from every place the Next.js
frontend reads a product or brand field, or calls their APIs
(`src/lib/api/fetchProdukteDetails.js`, `fetchProdukteData.js`, `fetchProdukteByMarken.js`,
`fetchProdukteDimension.js`, `fetchRelatedProducts.js`, `fetchMarkenData.js`,
`src/app/[locale]/produkte/**`, `src/app/[locale]/{ueber-uns/marken,about-us/brands,a-propos/marques,chi-siamo/marche}/**`,
`src/components/ProdukteDetails`, `src/components/InformationProduct`,
`src/components/DimensionProdukte`, `src/components/Produkte`, `src/components/RelatedProducts`,
`src/components/MarkenItems`, `src/components/ProdukteItem`, `src/lib/seo/brandSchema.js`).

**One doctype for every product category.** Beds, sofas, tables, chairs, lamps,
outdoor pieces, etc. all live in the single `Produkte` doctype — there is no
per-category doctype. A category is just a value of the `kategories` field
(stored as `"{Category}-{Brand}"`, e.g. `"Betten-Poliform"`) plus the
`indoor_and_outdoor` select. This matches how the frontend already treats products
today (one shared page template, one shared card component) — it just needed the
backend schema written down and made consistent.

## Folder layout

```
frappe-integration/
  platzhirsch_studio/                        <- copy into your app's module folder
    doctype/
      produkte/                              <- the main product doctype
        produkte.json
        produkte.py
        api.py                               <- all 5 whitelisted endpoints
      produkte_bild/                         <- child table: gallery images
      produkte_additional_information/       <- child table: weight/dimensions/material/color
      produkte_pdf/                          <- child table: 2D/3D/catalog downloads
      produkte_dimension/                    <- child table: technical drawing images
      produkte_keyword/                      <- child table: one row = one SEO keyword
      marken/                                <- the brand doctype
        marken.json
        marken.py
        api.py                               <- the 1 whitelisted endpoint (marken_data)
      marken_bild/                           <- child table: brand hero/gallery images
```

To install: copy `platzhirsch_studio/doctype/*` into your existing
`apps/platzhirsch_studio/platzhirsch_studio/platzhirsch_studio/doctype/` folder
(module name must be **Platzhirsch Studio** to match `module` in the JSON files —
rename if your app's module is named differently), then run:

```bash
bench --site <your-site> migrate
bench --site <your-site> clear-cache
```

`Produkte.marken` links to `Marken` by doctype — create/migrate `Marken` first (or
in the same migrate run) if your site doesn't have it yet. This package does not
redefine `Anfrage Produkt` (the inquiry/lead form the wishlist "request" flow submits
to) or `Products Keywords` (shop-listing-page SEO singleton) — both already exist in
the live backend (confirmed by the API paths + fields the frontend already calls)
and are out of scope here; only referenced where `Produkte`/`Marken` link to or are
consumed alongside them.

Deliberately NOT modeled as doctype fields: the static "Kollektion" showcase content
(category tiles, craftsmanship blocks, sample product cards, showroom copy) currently
hardcoded in `src/components/MarkenItems/markenitems.js`'s `BRAND` object. That's
placeholder design copy for a single brand, not CMS-driven data any real brand record
feeds today — only the fields below, which the component and its sibling
`src/components/ProdukteItem/produkteitem.js` actually read off a `marke` prop, are
part of the `Marken` schema.

## Field reference

| Field | Type | Used by (frontend) | Notes |
|---|---|---|---|
| `product_name` | Data, required | everywhere — card titles, `<h1>`, alt text | |
| `url_slug` | Data, required, **unique** | product-detail URL, cart/inquiry item id, sitemap | Must be unique across *all* products, not just per brand — it's the whole last URL segment. |
| `marken` | Link → Marken, required | brand link, breadcrumb, cart item `category` | |
| `status` | Select Aktiv/Inaktiv, required | detail page 404s and listings filter on `=== "Aktiv"` | Inactive-brand products also 404 even if the product itself is Aktiv. |
| `kategories` | Data | filter dropdown, `<title>`/`<h1>` category word, related-products matching | Raw value, brand suffix included (`"Betten-Poliform"`); frontend strips it. |
| `indoor_and_outdoor` | Select Indoor/Outdoor | shop listing top-level filter | |
| `category_name_en/_fr/_it` | Data (optional) | `getCategoryLabel()` in `produkte/[title]/[produkte]/page.js` | Leave blank to let the frontend's own `productCategories.js` map handle translation. API nests these into a `category: {...}` object to match the existing `produkt.category.category_name_en` read — no frontend change needed. |
| `beschreibung(_en/_fr/_it)` | Text Editor | short description next to the gallery (`ProdukteDetails.js`) | `beschreibung` (no suffix) = German/default. |
| `mehr_beschreibung(_en/_fr/_it)` | Text Editor | "Beschreibung" tab body (`InformationProduct.js`) | Tab is hidden if empty for the active locale. |
| `metadata_description_de/_en/_fr/_it` | Small Text | `<meta name="description">` per locale | Falls back to a generated sentence if blank. |
| `keywords`, `keywords_mid`, `keywords_long` (+ `_en`/`_fr`/`_it`) | Table → Produkte Keyword | `getProductKeyword.js` | 12 tables total; every row is just `{ keyword: "..." }`. |
| `bannerbild` | Attach Image | detail-page banner | Falls back to first gallery image, then a static fallback. |
| `bild_anhangen` | Table → Produkte Bild | image slider + PhotoSwipe lightbox | Columns: `bild_anhangen` (file), `produkt_name` (per-image alt override), `image_name` (lightbox caption — API re-keys to `imageName`, see below). See **known inconsistency** below. |
| `additional_information` | Table → Produkte Additional Information | "Additional Information" tab | Columns: `gewicht`, `dimensions`, `material`, `farbe`. |
| `pdf_produkte` | Table → Produkte PDF | "Download" tab, split into 2D/3D/Digital Catalog sections | Doctype columns are `attach_2d`/`attach_3d`/`katalog`; `api.py` re-keys to `"2d"`/`"3d"`/`"katalog"` because JS object keys can start with a digit but Frappe fieldnames can't. |
| `produkte_dimension` | Table → Produkte Dimension | "Technische Merkmale" grid, **rendered separately from the tabs** below the description | Columns: `attach_image`, `alt_text_image`. |

### Known frontend inconsistency worth fixing

`src/components/ProdukteDetails/ProdukteDetails.js` (the actual visible product
gallery) and `src/components/Produkte/produkte.js` (the shop listing cards) both
read each gallery row's file as `img.bild_anhangen` (both n's) — that's the spelling
this doctype standardizes on, since it's what's rendering real images on the live
site today. `src/app/[locale]/produkte/[title]/[produkte]/page.js`, however, reads
the *same* row as `produkt.bild_anhangen[0].bild_anhagen` (missing the second "n")
in three places — the Open Graph/Twitter image, the banner fallback, and the
Product JSON-LD image (lines ~190, ~295, ~327). That typo doesn't break page
rendering (it just silently falls through to the fallback image), which is exactly
why it can ship unnoticed — worth a quick fix to `bild_anhangen` in that file so
shared links and structured data show the real product photo.

Separately, `ProdukteDetails.js` reads each row's lightbox caption as `img.imageName`
(camelCase), but a real Frappe fieldname can't be camelCase by convention — the
doctype field is `image_name`; `api.py`'s `_remap_bild_row()` re-keys it to
`imageName` in the response so no frontend change is needed for that one.

## API contract (`platzhirsch_studio.platzhirsch_studio.doctype.produkte.api`)

All five are `@frappe.whitelist(allow_guest=True)` — the frontend calls every one
of them with no `Authorization` header, so none may leak Inaktiv-only data.

| Method | HTTP | Params | Returns |
|---|---|---|---|
| `get_produkt_by_path_field_api` | POST | body `{ path_field, lang }` | `{ message: <full product dict, incl. all child tables> \| null }` |
| `produkte_data_short_list` | GET | — | `{ message: [{ name, product_name, url_slug, marken, status, modified }] }` |
| `get_produkte_by_marke_api` | POST or GET | `marken` | `{ message: [<card-shape product>] }` |
| `product_dimensions_data` | GET | `name`, `product_name`, `path_field` (any one resolves the product; `path_field` preferred) | `{ message: [{ name, attach_image, alt_text_image }] }` |
| `related_products` | GET | `marken`, `kategories`, `currentProductPath`, `limit` (default 4) | `{ message: [{ product_name, marken, kategories, url_slug, bild_anhangen }] }` — `bild_anhangen` here is a **flattened image-path string**, not the child table, because `RelatedProducts.js` reads it directly. |

`related_products` fills from the same brand + same category first, then backfills
from the same brand only if that tier doesn't reach `limit` — otherwise brands with
few SKUs per category would show an empty "related products" strip.

Every list/short-form response deliberately omits `beschreibung`/`mehr_beschreibung`/
metadata/keyword fields — those are only needed on the full detail fetch, which is
the one call per page load, keeping listing payloads small.

---

## `Marken` doctype

### Field reference

| Field | Type | Used by (frontend) | Notes |
|---|---|---|---|
| `name1` | Data, required, **unique** | everywhere — `<h1>`, URL slug, breadcrumbs, JSON-LD `Brand.name`, `generateStaticParams` | The only "name" field the frontend actually reads; see the doctype field description for the `marke.name` (docname) frontend quirk. |
| `status` | Select Aktiv/Inaktiv, required | story page 404s, listing grid filters, product-listing header 404s | Not filtered server-side — `marken_data` returns every brand, same pattern as `Produkte`'s raw endpoints. |
| `es_gibt_produkte` | Check | `fetchMarkenWithProducts()` in `fetchMarkenData.js` | Editorial toggle for whether the brand shows on `/produkte`; independent of whether `Produkte` rows actually link here. |
| `grundungsjahr` / `herkunftsland` / `grunder` | Data | the three "fact" info boxes on the story page (`Calendar`/`Flag`/`CircleUser` slider) | All optional; each box only renders when its field is set. |
| `firmenlink` | Data (URL) | "Offizielle Website" link/button on the story page | `brandSchema.js` normalizes this to its origin for JSON-LD `Brand.sameAs`. |
| `logo` | Attach Image | brand-listing grid thumbnail (`fetchMarkenData()` default export), JSON-LD `Brand.logo` | Distinct from `bild_anhagen` (story-page hero/gallery). |
| `bild_anhagen` | Table → Marken Bild | story-page hero + gallery slider, Open Graph/Twitter/JSON-LD image (always row `[0]`) | Spelled with **one** `n` — opposite of `Produkte`'s `bild_anhangen`. Do not swap. |
| `beschreibung(_en/_fr/_it)` | Text Editor | "Über die Marke" block on the story page | `beschreibung` (no suffix) = German/default. |
| `produkte(_en/_fr/_it)` | Text Editor | "Produkte" block on the story page + brand-detail meta-description fallback | Free text describing the assortment — not a link to `Produkte` records. |
| `metadata_description_de/_en/_fr/_it` | Small Text | `<meta name="description">` per locale on the story page | Falls back to `produkte`/`beschreibung` if blank (see `page.js`'s `brandDesc` chain). |

### API contract (`platzhirsch_studio.platzhirsch_studio.doctype.marken.api`)

| Method | HTTP | Params | Returns |
|---|---|---|---|
| `marken_data` | GET | — | `{ message: [<full brand dict, incl. bild_anhagen child rows>] }` |

`allow_guest=True` — the frontend's single `fetchRawMarkenData()` call has no
`Authorization` header and every other helper in `fetchMarkenData.js`
(`getActiveMarken`, `getMarkenByName`, `fetchMarkenWithProducts`, the default export,
the sitemap's `fetchBrands()`) builds on top of this one response, so it intentionally
returns the full field set for every brand rather than a slimmed-down list shape.
