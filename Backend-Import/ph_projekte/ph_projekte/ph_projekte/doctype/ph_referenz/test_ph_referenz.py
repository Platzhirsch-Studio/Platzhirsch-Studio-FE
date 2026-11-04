"""bench --site <site> run-tests --app ph_projekte --doctype "PH Referenz" – Statusregeln der Spec (tagebuch/README.md)."""

import base64

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_projekte.ph_projekte.doctype.ph_projekt.test_ph_projekt import kunden_token, testprojekt

PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")


def testfoto(projekt, phase="nachher", von="kunde"):
    f = frappe.get_doc({"doctype": "PH Tagebuch Foto", "projekt": projekt, "phase": phase, "von": von, "titel": f"Foto {phase}", "breite": 1920, "hoehe": 1280, "varianten": [{"w": 640, "h": 427}], "echt_bestaetigt": 1 if phase in ("skizze", "modell") else 0}).insert(ignore_permissions=True)
    datei = frappe.get_doc({"doctype": "File", "file_name": f"{f.name}-640.png", "is_private": 1, "content": PNG, "attached_to_doctype": "PH Tagebuch Foto", "attached_to_name": f.name}).insert(ignore_permissions=True)
    f.db_set("bild", datei.file_url)
    return f


class TestPHReferenz(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.db.set_single_value("PH Projekte Einstellungen", "referenz_freigabe_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        self.p = testprojekt("Referenz Test")
        for name in frappe.get_all("PH Referenz", filters={"projekt": self.p.name}, pluck="name"):
            frappe.delete_doc("PH Referenz", name, force=True)

    def _referenz(self, foto, **extra):
        werte = {"doctype": "PH Referenz", "projekt": self.p.name, "kontakt": self.p.kontakt, "anzeige_art": "anonym", "einwilligung_version": "tagebuch-referenz-2026-10-29-v2", "einwilligung_textstatus": "entwurf", "einwilligung_text": "Ich bin einverstanden …", "bilder": [{"foto": foto.name, "phase": foto.phase, "titel": foto.titel}]}
        werte.update(extra)
        return frappe.get_doc(werte).insert()

    def test_nur_eine_aktive_je_projekt(self):
        foto = testfoto(self.p.name)
        self._referenz(foto)
        with self.assertRaises(frappe.ValidationError):
            self._referenz(foto)

    def test_skizze_nicht_veroeffentlichbar(self):
        skizze = testfoto(self.p.name, "skizze", "team")
        with self.assertRaises(frappe.ValidationError):
            self._referenz(skizze)

    def test_adresse_in_nennung_verboten(self):
        foto = testfoto(self.p.name)
        with self.assertRaises(frappe.ValidationError):
            self._referenz(foto, anzeige_art="vorname_ort", anzeige_vorname="Anna", anzeige_ort="Landstraße 11")

    def test_veroeffentlichen_braucht_pflichtfelder_dann_widerruf_loescht_dateien(self):
        foto = testfoto(self.p.name)
        ref = self._referenz(foto)
        with self.assertRaises(frappe.ValidationError):
            ref.veroeffentlichen()
        ref.reload()
        ref.update({"slug": "wohnzimmer-test-0001", "titel": "Wohnzimmer mit Seeblick", "typologie": "Wohnung", "leistungen": '["planung"]', "zeitraum_von": "2026-03", "zeitraum_bis": "2026-10", "ausgangslage": "Alt", "loesung": [{"raum": "Wohnzimmer", "text": "Neu"}]})
        ref.bilder[0].alt = "Wohnzimmer"
        ref.save()
        ref.veroeffentlichen()
        self.assertEqual(ref.status, "Veroeffentlicht")
        kopie = frappe.get_doc({"doctype": "File", "file_name": "kopie.png", "is_private": 1, "content": PNG, "attached_to_doctype": "PH Referenz", "attached_to_name": ref.name}).insert(ignore_permissions=True)
        ref.widerruf_erfassen("Telefon")
        self.assertEqual(ref.status, "Widerrufen")
        self.assertFalse(frappe.db.exists("File", kopie.name))
        ref.reload()
        ref.status = "Eingereicht"
        with self.assertRaises(frappe.ValidationError):
            ref.save()

    def test_api_create_und_widerruf_durch_kunden(self):
        from ph_projekte.api import referenz_create, referenz_list, referenz_update

        foto = testfoto(self.p.name)
        token = kunden_token(self.p.kontakt)
        r = referenz_create(kontakt=self.p.kontakt, kunde_token=token, projekt=self.p.name, eintrag={"fotoIds": [foto.name], "anzeige": "vorname_ort", "vorname": "Anna", "ort": "Lochau", "einwilligung": True, "version": "tagebuch-referenz-2026-10-29-v2", "einwilligung_text": ["Absatz 1", "Absatz 2"]}, idempotency_key="ref-1")
        self.assertEqual(r["status"], "eingereicht")
        self.assertEqual(r["anzeige"], {"art": "vorname_ort", "vorname": "Anna", "ort": "Lochau"})
        self.assertTrue(frappe.db.exists("File", {"attached_to_doctype": "PH Referenz", "attached_to_name": r["id"]}))
        nochmal = referenz_create(kontakt=self.p.kontakt, kunde_token=token, projekt=self.p.name, eintrag={"fotoIds": [foto.name], "anzeige": "anonym", "einwilligung": True, "version": "v2"})
        self.assertEqual(nochmal.get("code"), "conflict")
        liste = referenz_list(kontakt=self.p.kontakt, kunde_token=token, projekt=self.p.name, status=["eingereicht"])
        self.assertEqual(len(liste), 1)
        w = referenz_update(freigabe_id=r["id"], aktion="widerrufen", kontakt=self.p.kontakt, kunde_token=token)
        self.assertEqual(w["status"], "widerrufen")
        self.assertFalse(frappe.db.exists("File", {"attached_to_doctype": "PH Referenz", "attached_to_name": r["id"]}))

    def test_api_team_veroeffentlichen_prueft_pflichtfelder(self):
        from ph_projekte.api import referenz_file, referenz_update

        foto = testfoto(self.p.name)
        ref = self._referenz(foto)
        fehler = referenz_update(freigabe_id=ref.name, aktion="veroeffentlichen", rolle="team", daten={"slug": "x"})
        self.assertEqual(fehler.get("code"), "invalid")
        ok = referenz_update(freigabe_id=ref.name, aktion="veroeffentlichen", rolle="team", daten={"slug": "wohnzimmer-test-0002", "titel": "Wohnzimmer", "typologie": "Wohnung", "leistungen": ["planung"], "zeitraumVon": "2026-01", "zeitraumBis": "2026-06", "ausgangslage": "Alt", "loesung": [{"raum": "Wohnzimmer", "text": "Neu"}], "alt": {foto.name: "Wohnzimmer"}})
        self.assertEqual(ok["status"], "veroeffentlicht")
        self.assertEqual(ok["pruefung"]["slug"], "wohnzimmer-test-0002")
        nicht = referenz_file(freigabe_id="fg-0000000000", datei="x.png")
        self.assertEqual(nicht.get("code"), "not_found")
