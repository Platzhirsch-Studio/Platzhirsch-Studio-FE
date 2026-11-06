"""Marktfunktionen-Scan mit lokalem LLM (Ollama, GPU) – Vollständigkeitsprüfung für das Backoffice.

Phase 1  python -I tools/research/markt-funktionen.py sammeln
         Lädt öffentliche Funktionsseiten von Branchen- und Standardsoftware (Liste QUELLEN), extrahiert
         mit qwen2.5-coder:7b je Seite eine Funktionsliste (JSON) und schreibt
         Marktresearch/digital/backoffice/markt/<quelle>.json sowie 30-marktfunktionen.md (dedupliziert
         über nomic-embed-text).
Phase 2  python -I tools/research/markt-funktionen.py vergleichen
         Vergleicht alle Marktfunktionen per Embedding mit den Bereichskonzepten
         Marktresearch/digital/backoffice/10-konzept-*.md und schreibt 31-luecken.md (Funktionen ohne
         Entsprechung im Konzept, nach Bereich, mit Ähnlichkeitswert und Quelle).

Nur Standardbibliothek + laufender Ollama-Dienst (http://localhost:11434). Rohseiten landen im Scratch-
Ordner (untrusted), nie im Repo. Inhaber-Freigabe für lokale LLM/GPU: 04.11.2026. Keine Geheimnisse.
"""

import html
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request
from html.parser import HTMLParser

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "Marktresearch", "digital", "backoffice")
MARKT = os.path.join(OUT, "markt")
RAW = os.environ.get("MARKT_RAW_DIR") or os.path.join(os.environ.get("TEMP", "."), "ph-markt-raw")
OLLAMA = os.environ.get("OLLAMA_URL", "http://localhost:11434")
MODELL = os.environ.get("MARKT_MODELL", "qwen2.5-coder:7b")
EMBED = os.environ.get("MARKT_EMBED", "nomic-embed-text")
UA = "Mozilla/5.0 (Marktrecherche Platzhirsch Backoffice; Kontakt: office@platzhirsch.studio)"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BEREICHE = ["crm", "sortiment", "projekte", "shop", "faktura", "logistik", "personal", "marketing", "kassa", "service", "kundenkarte", "zentrale"]

# (Kennung, Produkt, Bereichs-Hinweis, URL) – öffentliche Funktions-/Produktseiten. Fehlschläge werden übersprungen.
QUELLEN = [
    ("shd-marahplus", "SHD marahplus (Möbelhandel)", "projekte,faktura,logistik,crm", "https://www.shd.de/"),
    ("shd-moebelhandel", "SHD Möbelhandel", "projekte,faktura,logistik", "https://www.shd.de/branchen/moebelhandel/"),
    ("moebelpilot", "MöbelPilot", "projekte,faktura,logistik,crm", "https://www.moebelpilot.de/"),
    ("bewidata", "bewidata euro-BIS (Möbelhandel)", "projekte,faktura,logistik", "https://www.bewidata.de/"),
    ("storis", "STORIS (Furniture Retail ERP)", "projekte,faktura,logistik,kassa", "https://www.storis.com/software/"),
    ("furniturewizard", "Furniture Wizard", "kassa,logistik,sortiment", "https://www.furniturewizard.com/features/"),
    ("odoo-pos", "Odoo Point of Sale", "kassa", "https://www.odoo.com/app/point-of-sale-features"),
    ("odoo-crm", "Odoo CRM", "crm", "https://www.odoo.com/app/crm-features"),
    ("odoo-sales", "Odoo Sales", "faktura,shop", "https://www.odoo.com/app/sales-features"),
    ("odoo-inventory", "Odoo Inventory", "logistik,sortiment", "https://www.odoo.com/app/inventory-features"),
    ("odoo-accounting", "Odoo Accounting", "faktura", "https://www.odoo.com/app/accounting-features"),
    ("odoo-project", "Odoo Project", "projekte", "https://www.odoo.com/app/project-features"),
    ("odoo-helpdesk", "Odoo Helpdesk", "service", "https://www.odoo.com/app/helpdesk-features"),
    ("odoo-fieldservice", "Odoo Field Service", "service,projekte", "https://www.odoo.com/app/field-service-features"),
    ("odoo-recruitment", "Odoo Recruitment", "personal", "https://www.odoo.com/app/recruitment-features"),
    ("odoo-timeoff", "Odoo Time Off", "personal", "https://www.odoo.com/app/time-off-features"),
    ("odoo-marketing", "Odoo Email Marketing", "marketing", "https://www.odoo.com/app/email-marketing-features"),
    ("odoo-loyalty", "Odoo Loyalty", "kundenkarte", "https://www.odoo.com/app/point-of-sale-loyalty"),
    ("erpnext-selling", "ERPNext Selling", "faktura,crm", "https://docs.frappe.io/erpnext/user/manual/en/selling"),
    ("erpnext-stock", "ERPNext Stock", "logistik,sortiment", "https://docs.frappe.io/erpnext/user/manual/en/stock"),
    ("erpnext-pos", "ERPNext POS", "kassa", "https://docs.frappe.io/erpnext/user/manual/en/point-of-sales"),
    ("lightspeed-retail", "Lightspeed Retail POS", "kassa,sortiment,kundenkarte", "https://www.lightspeedhq.com/pos/retail/"),
    ("square-pos", "Square Point of Sale", "kassa,kundenkarte", "https://squareup.com/us/en/point-of-sale"),
    ("square-loyalty", "Square Loyalty", "kundenkarte", "https://squareup.com/us/en/software/loyalty"),
    ("shopify-admin", "Shopify Admin", "shop", "https://www.shopify.com/tour/ecommerce-features"),
    ("stripe-dashboard", "Stripe Dashboard", "shop,faktura", "https://stripe.com/payments/features"),
    ("pipedrive", "Pipedrive CRM", "crm", "https://www.pipedrive.com/en/features"),
    ("attio", "Attio CRM", "crm", "https://attio.com/product"),
    ("linear", "Linear", "zentrale,projekte", "https://linear.app/features"),
    ("personio", "Personio", "personal", "https://www.personio.com/hr-software/"),
    ("brevo", "Brevo Marketing", "marketing", "https://www.brevo.com/features/"),
    ("zendesk", "Zendesk Support", "service", "https://www.zendesk.com/service/ticketing-system/"),
    ("sendcloud", "Sendcloud Versand", "logistik", "https://www.sendcloud.de/funktionen/"),
    ("ready2order", "ready2order Kassa (AT, RKSV)", "kassa", "https://ready2order.com/at/kassensystem/"),
    ("helloCash", "helloCash Registrierkasse (AT)", "kassa", "https://hellocash.at/registrierkasse/"),
    ("bmd", "BMD Business Software (AT)", "faktura", "https://www.bmd.com/at/produkte.html"),
]


class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript", "svg", "nav", "footer", "header"):
            self.skip += 1
        if tag in ("p", "li", "h1", "h2", "h3", "h4", "br", "div", "tr", "section"):
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "svg", "nav", "footer", "header") and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def lade(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "de,en;q=0.8"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read(3_000_000)
        enc = r.headers.get_content_charset() or "utf-8"
    return raw.decode(enc, errors="replace")


def text_aus(html_text):
    p = Text()
    p.feed(html_text)
    t = html.unescape("".join(p.parts))
    t = re.sub(r"[ \t\r\f\v]+", " ", t)
    t = re.sub(r"\n\s*\n+", "\n", t)
    return t.strip()


def ollama(pfad, body, timeout=600):
    req = urllib.request.Request(f"{OLLAMA}{pfad}", data=json.dumps(body).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


SCHEMA = {
    "type": "object",
    "properties": {
        "funktionen": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "beschreibung": {"type": "string"},
                    "bereich": {"type": "string", "enum": BEREICHE},
                    "nutzen": {"type": "string"},
                },
                "required": ["name", "beschreibung", "bereich"],
            },
        }
    },
    "required": ["funktionen"],
}


def extrahiere(produkt, hinweis, text):
    prompt = (
        "Du bist Produktanalyst für Backoffice-Software eines Einrichtungshauses (Möbel, Küchen, Bad, Planung, Montage, "
        "Kassa, Onlineshop, Service). Extrahiere aus dem Seitentext ALLE konkreten Software-Funktionen des Produkts "
        f"„{produkt}“ (Schwerpunkt: {hinweis}). Jede Funktion: kurzer deutscher Name (max. 8 Wörter), Beschreibung "
        "(1 Satz, deutsch, was der Benutzer damit tut), bereich (einer von: " + ", ".join(BEREICHE) + "), nutzen "
        "(warum ein Möbelhaus das braucht, 1 Satz). Keine Marketingfloskeln, keine Preise, keine Wiederholungen. "
        "Wenn der Text keine Funktionen enthält, gib eine leere Liste zurück.\n\nSEITENTEXT:\n" + text[:14000]
    )
    r = ollama("/api/chat", {"model": MODELL, "messages": [{"role": "user", "content": prompt}], "format": SCHEMA, "stream": False, "options": {"temperature": 0.1, "num_ctx": 16384}})
    try:
        return json.loads(r["message"]["content"]).get("funktionen", [])
    except (KeyError, ValueError):
        return []


def embed(texte):
    r = ollama("/api/embed", {"model": EMBED, "input": texte})
    return r.get("embeddings", [])


def cos(a, b):
    s = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return s / (na * nb)


def sammeln():
    os.makedirs(MARKT, exist_ok=True)
    os.makedirs(RAW, exist_ok=True)
    alle = []
    for kennung, produkt, hinweis, url in QUELLEN:
        ziel = os.path.join(MARKT, f"{kennung}.json")
        if os.path.exists(ziel):
            with open(ziel, encoding="utf-8") as f:
                alle.extend(json.load(f)["funktionen"])
            print(f"= {kennung}: vorhanden")
            continue
        t0 = time.time()
        try:
            seite = lade(url)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as e:
            print(f"x {kennung}: {type(e).__name__} {str(e)[:80]}")
            continue
        with open(os.path.join(RAW, f"{kennung}.html"), "w", encoding="utf-8") as f:
            f.write(seite)
        text = text_aus(seite)
        if len(text) < 400:
            print(f"x {kennung}: zu wenig Text ({len(text)} Zeichen, vermutlich JS-Seite)")
            continue
        fn = extrahiere(produkt, hinweis, text)
        for x in fn:
            x["quelle"] = produkt
            x["url"] = url
        with open(ziel, "w", encoding="utf-8") as f:
            json.dump({"produkt": produkt, "url": url, "stand": time.strftime("%Y-%m-%d"), "zeichen": len(text), "funktionen": fn}, f, ensure_ascii=False, indent=1)
        alle.extend(fn)
        print(f"+ {kennung}: {len(fn)} Funktionen aus {len(text)} Zeichen in {time.time() - t0:.0f}s")
        time.sleep(1.5)  # höflich gegenüber den Anbietern
    # Deduplizieren über Embeddings (Name + Beschreibung)
    texte = [f"{x['name']}: {x.get('beschreibung', '')}" for x in alle]
    vek = embed(texte) if texte else []
    behalten, gruppen = [], []
    for i, v in enumerate(vek):
        dup = next((g for g in gruppen if cos(v, g["v"]) > 0.90), None)
        if dup:
            dup["quellen"].add(alle[i]["quelle"])
        else:
            g = {"v": v, "idx": i, "quellen": {alle[i]["quelle"]}}
            gruppen.append(g)
            behalten.append(i)
    zeilen = [f"# Marktfunktionen – Backoffice-Vollständigkeit\n\nStand {time.strftime('%Y-%m-%d')} · Quelle: öffentliche Funktionsseiten, extrahiert mit lokalem Modell {MODELL}, dedupliziert mit {EMBED} (Schwelle 0,90). Roh-JSON je Anbieter unter `markt/`. Zahlen sind Extraktionsergebnisse, keine geprüften Fakten – vor Übernahme in Konzepte die Quelle lesen.\n"]
    zeilen.append(f"\n{len(alle)} extrahierte Einträge aus {len({x['quelle'] for x in alle})} Produkten → {len(behalten)} eindeutige Funktionen.\n")
    for b in BEREICHE:
        rows = [(alle[g["idx"]], g) for g in gruppen if alle[g["idx"]].get("bereich") == b]
        if not rows:
            continue
        zeilen.append(f"\n## {b} ({len(rows)})\n\n| Funktion | Was der Benutzer tut | Nutzen | Gesehen bei |\n|---|---|---|---|")
        for x, g in sorted(rows, key=lambda r: -len(r[1]["quellen"])):
            zeilen.append(f"| {x['name']} | {x.get('beschreibung', '')} | {x.get('nutzen', '')} | {', '.join(sorted(g['quellen']))} |")
    with open(os.path.join(OUT, "30-marktfunktionen.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(zeilen) + "\n")
    print(f"→ {os.path.join(OUT, '30-marktfunktionen.md')}")


def vergleichen(schwelle=0.62):
    alle = []
    for name in sorted(os.listdir(MARKT)):
        if name.endswith(".json"):
            with open(os.path.join(MARKT, name), encoding="utf-8") as f:
                alle.extend(json.load(f)["funktionen"])
    konzepte = {}
    for name in sorted(os.listdir(OUT)):
        m = re.match(r"10-konzept-(.+)\.md$", name)
        if m:
            with open(os.path.join(OUT, name), encoding="utf-8") as f:
                konzepte[m.group(1)] = f.read()
    if not konzepte:
        print("Keine 10-konzept-*.md vorhanden – erst die Designphase abwarten.")
        return
    # Konzepte in Absätze zerlegen (Überschrift + Text), einbetten
    stuecke = []
    for slug, text in konzepte.items():
        for abs_ in re.split(r"\n(?=#{1,4} )|\n\n+", text):
            abs_ = abs_.strip()
            if 40 <= len(abs_) <= 1800:
                stuecke.append((slug, abs_))
    kv = []
    for i in range(0, len(stuecke), 64):
        kv.extend(embed([s[1] for s in stuecke[i:i + 64]]))
    mv = []
    texte = [f"{x['name']}: {x.get('beschreibung', '')}" for x in alle]
    for i in range(0, len(texte), 64):
        mv.extend(embed(texte[i:i + 64]))
    luecken = []
    for x, v in zip(alle, mv):
        best, best_slug, best_abs = 0.0, None, ""
        for (slug, abs_), kvv in zip(stuecke, kv):
            c = cos(v, kvv)
            if c > best:
                best, best_slug, best_abs = c, slug, abs_
        if best < schwelle:
            luecken.append((x, best, best_slug))
    luecken.sort(key=lambda r: (r[0].get("bereich", ""), r[1]))
    zeilen = [f"# Lücken gegenüber dem Markt\n\nStand {time.strftime('%Y-%m-%d')} · Marktfunktionen (30-marktfunktionen.md) gegen die Bereichskonzepte 10-konzept-*.md, Ähnlichkeit per {EMBED}; Schwelle {schwelle}. Niedriger Wert = im Konzept nichts Vergleichbares gefunden. **Jede Zeile ist ein Prüfauftrag**, kein Beweis: Treffer können an Formulierungen scheitern.\n\n{len(luecken)} von {len(alle)} Marktfunktionen ohne klare Entsprechung.\n"]
    akt = None
    for x, best, slug in luecken:
        if x.get("bereich") != akt:
            akt = x.get("bereich")
            zeilen.append(f"\n## {akt}\n\n| Marktfunktion | Beschreibung | Nutzen | Quelle | Ähnlichkeit | nächstes Konzept |\n|---|---|---|---|---|---|")
        zeilen.append(f"| {x['name']} | {x.get('beschreibung', '')} | {x.get('nutzen', '')} | {x.get('quelle', '')} | {best:.2f} | {slug or '–'} |")
    with open(os.path.join(OUT, "31-luecken.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(zeilen) + "\n")
    print(f"→ {os.path.join(OUT, '31-luecken.md')} ({len(luecken)} Lücken)")


if __name__ == "__main__":
    befehl = sys.argv[1] if len(sys.argv) > 1 else "sammeln"
    try:
        ollama("/api/tags", {}) if False else urllib.request.urlopen(f"{OLLAMA}/api/tags", timeout=5).read()
    except OSError:
        sys.exit("Ollama nicht erreichbar unter " + OLLAMA)
    if befehl == "sammeln":
        sammeln()
    elif befehl == "vergleichen":
        vergleichen(float(sys.argv[2]) if len(sys.argv) > 2 else 0.62)
    else:
        sys.exit("Befehl: sammeln | vergleichen [schwelle]")
