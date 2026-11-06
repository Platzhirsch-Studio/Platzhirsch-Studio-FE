"""Hilfsskript für setup.sh/test.sh – läuft IM Frappe-Container mit dem Bench-Python.

Aufruf (aus /home/frappe/frappe-bench/sites):
    ../env/bin/python /opt/ph-deploy/ph_staging.py konfigurieren <site> [--produktion]
    ../env/bin/python /opt/ph-deploy/ph_staging.py token <site> <email>
    ../env/bin/python /opt/ph-deploy/ph_staging.py pruefen <site>
    ../env/bin/python /opt/ph-deploy/ph_staging.py testbericht <ordner>     (ohne Frappe, nur XML lesen)

Schreibt keine Geheimnisse in Dateien. "token" gibt key:secret EINMAL auf stdout aus – setup.sh legt es
in ergebnisse/tokens.env (chmod 600, gitignored) ab.
"""

import json
import os
import sys
import xml.etree.ElementTree as ET

WEBSITE_USER = "website@platzhirsch.studio"
BACKOFFICE_USER = "backoffice@platzhirsch.studio"
APPS = [
    "ph_core", "ph_crm", "ph_sortiment", "ph_projekte", "ph_shop", "ph_faktura",
    "ph_logistik", "ph_personal", "ph_marketing", "ph_kassa", "ph_service", "ph_kundenkarte",
]


def _verbinden(site):
    import frappe

    frappe.init(site=site, sites_path=".")
    frappe.connect()
    frappe.set_user("Administrator")
    return frappe


def _single_setzen(frappe, doctype, werte):
    """Setzt Felder einer Single nur, wenn DocType und Feld existieren (Befund statt Absturz)."""
    if not frappe.db.exists("DocType", doctype):
        print(f"  WARNUNG: {doctype} fehlt – App nicht installiert?")
        return
    meta = frappe.get_meta(doctype)
    for feld, wert in werte.items():
        if not meta.has_field(feld):
            print(f"  WARNUNG: {doctype}.{feld} gibt es nicht – übersprungen")
            continue
        frappe.db.set_single_value(doctype, feld, wert)
        print(f"  {doctype}.{feld} = {wert}")


def _benutzer(frappe, email, vorname, nachname, rollen):
    if frappe.db.exists("User", email):
        user = frappe.get_doc("User", email)
    else:
        user = frappe.get_doc({
            "doctype": "User", "email": email, "first_name": vorname, "last_name": nachname,
            "user_type": "System User", "send_welcome_email": 0, "enabled": 1,
        })
        user.flags.no_welcome_mail = True
        user.insert(ignore_permissions=True)
        print(f"  Benutzer {email} angelegt")
    vorhandene = [r for r in rollen if frappe.db.exists("Role", r)]
    fehlend = sorted(set(rollen) - set(vorhandene))
    if fehlend:
        print(f"  WARNUNG: Rollen fehlen für {email}: {', '.join(fehlend)}")
    if vorhandene:
        user.add_roles(*vorhandene)
    return user


def konfigurieren(site, produktion=False):
    frappe = _verbinden(site)
    try:
        print("PH Einstellungen / Testmodus")
        if produktion:
            # Produktion: testmodus bleibt AN (Standard der DocType) und die Website-API AUS, bis der
            # Inhaber den Livegang freigibt (deploy/CHECKLISTE-LIVEGANG.md, Schritt "Umschalten").
            _single_setzen(frappe, "PH Einstellungen", {"testmodus": 1, "api_aktiv": 0, "api_protokoll_nutzdaten": 0})
        else:
            # Staging: API an, damit Website/Backoffice gegen Staging testen können.
            _single_setzen(frappe, "PH Einstellungen", {"testmodus": 1, "api_aktiv": 1, "api_protokoll_nutzdaten": 0})
        if not produktion:
            _single_setzen(frappe, "PH Kassa Einstellungen", {"terminal_testmodus": 1})

        print("Integrationsbenutzer")
        # website@: legt ph_core.install bereits an – hier nur sicherstellen (Rolle PH Website Integration).
        _benutzer(frappe, WEBSITE_USER, "Website", "Integration", ["PH Website Integration"])
        # backoffice@: Service-Benutzer des Next-Backoffice (backoffice/src/lib/backoffice/frappe/core.js
        # erwartet System Manager für Systemaufgaben wie Meta-Lesen). Anmeldungen der Mitarbeiter laufen
        # mit deren eigener Frappe-Sitzung, nicht über dieses Token.
        _benutzer(frappe, BACKOFFICE_USER, "Backoffice", "Dienst", ["System Manager", "PH Backoffice-Admin"])
        frappe.db.commit()
    finally:
        frappe.destroy()


def token(site, email):
    """Erzeugt ein NEUES API-Secret (altes wird ungültig) und gibt key:secret aus."""
    frappe = _verbinden(site)
    try:
        user = frappe.get_doc("User", email)
        if not user.api_key:
            user.api_key = frappe.generate_hash(length=15)
        secret = frappe.generate_hash(length=15)
        user.api_secret = secret
        user.save(ignore_permissions=True)
        frappe.db.commit()
        print(f"{user.api_key}:{secret}")
    finally:
        frappe.destroy()


def pruefen(site):
    """Kurzer Zustand nach der Installation: installierte Apps, Error-Log, Workflows, Fixtures."""
    frappe = _verbinden(site)
    try:
        installiert = frappe.get_installed_apps()
        ergebnis = {
            "installiert": installiert,
            "fehlend": [a for a in APPS if a not in installiert],
            "developer_mode": frappe.conf.get("developer_mode"),
            "allow_tests": frappe.conf.get("allow_tests"),
            "testmodus": frappe.db.get_single_value("PH Einstellungen", "testmodus")
            if frappe.db.exists("DocType", "PH Einstellungen") else None,
            "ph_doctypes": frappe.db.count("DocType", {"module": ["like", "PH %"]}),
            "workflows": frappe.get_all("Workflow", filters={"name": ["like", "PH %"]}, pluck="name"),
            "rollen_ph": frappe.db.count("Role", {"name": ["like", "PH %"]}),
            "error_log_eintraege": frappe.db.count("Error Log"),
            "letzte_fehler": frappe.get_all(
                "Error Log", fields=["method", "creation"], order_by="creation desc", limit=10
            ),
        }
        print(json.dumps(ergebnis, indent=2, ensure_ascii=False, default=str))
    finally:
        frappe.destroy()


def testbericht(ordner):
    """Liest <app>.xml (JUnit) und status.tsv (app, exit, sekunden) → zusammenfassung.md."""
    zeilen = ["# Testlauf PH-Apps (Staging)", "",
              "| App | Exit | Tests | Fehler | Abbrüche | Übersprungen | Dauer (s) |",
              "|---|---|---|---|---|---|---|"]
    status = {}
    pfad_status = os.path.join(ordner, "status.tsv")
    if os.path.exists(pfad_status):
        with open(pfad_status, encoding="utf-8") as f:
            for zeile in f:
                teile = zeile.rstrip("\n").split("\t")
                if len(teile) >= 3:
                    status[teile[0]] = (teile[1], teile[2])
    fehlerliste = []
    summe = {"tests": 0, "failures": 0, "errors": 0, "skipped": 0}
    for app in APPS:
        exitcode, dauer = status.get(app, ("–", "–"))
        xml = os.path.join(ordner, f"{app}.xml")
        werte = {"tests": "–", "failures": "–", "errors": "–", "skipped": "–"}
        if os.path.exists(xml):
            try:
                wurzel = ET.parse(xml).getroot()
                suites = [wurzel] if wurzel.tag == "testsuite" else wurzel.findall("testsuite")
                for k in werte:
                    werte[k] = sum(int(s.get(k, 0) or 0) for s in suites)
                    summe[k] += werte[k]
                for s in suites:
                    for case in s.findall("testcase"):
                        for art in ("failure", "error"):
                            el = case.find(art)
                            if el is not None:
                                text = (el.get("message") or el.text or "").strip().splitlines()
                                fehlerliste.append(
                                    f"- **{app}** `{case.get('classname')}.{case.get('name')}` ({art}): "
                                    f"{(text[0] if text else '')[:200]}"
                                )
            except ET.ParseError as e:
                werte["tests"] = f"XML defekt ({e})"
        zeilen.append(
            f"| {app} | {exitcode} | {werte['tests']} | {werte['failures']} | {werte['errors']} "
            f"| {werte['skipped']} | {dauer} |"
        )
    zeilen += ["", f"Summe: {summe['tests']} Tests, {summe['failures']} Fehler, {summe['errors']} Abbrüche, "
               f"{summe['skipped']} übersprungen.", ""]
    zeilen += ["## Fehlgeschlagene Tests", ""] + (fehlerliste or ["Keine."])
    zeilen += ["", "Volle Ausgabe je App: `<app>.log`, JUnit: `<app>.xml` (gleicher Ordner).", ""]
    ziel = os.path.join(ordner, "zusammenfassung.md")
    with open(ziel, "w", encoding="utf-8") as f:
        f.write("\n".join(zeilen))
    print("\n".join(zeilen))


def main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    if len(argv) < 2:
        print(__doc__)
        return 2
    befehl = argv[1]
    if befehl == "konfigurieren" and len(argv) >= 3:
        konfigurieren(argv[2], produktion="--produktion" in argv)
    elif befehl == "token" and len(argv) == 4:
        token(argv[2], argv[3])
    elif befehl == "pruefen" and len(argv) == 3:
        pruefen(argv[2])
    elif befehl == "testbericht" and len(argv) == 3:
        testbericht(argv[2])
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
