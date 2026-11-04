"""bench --site <site> run-tests --app ph_projekte --doctype "PH Rendering Feedback" """

import base64

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_projekte.ph_projekte.doctype.ph_projekt.test_ph_projekt import kunden_token, testprojekt


def testrendering(projekt):
    name = frappe.db.get_value("PH Rendering", {"projekt": projekt, "bezeichnung": "Test-Rendering"}, "name")
    if name:
        return frappe.get_doc("PH Rendering", name)
    r = frappe.get_doc({"doctype": "PH Rendering", "projekt": projekt, "bezeichnung": "Test-Rendering", "variante": "A", "version": 1, "status": "Vorgelegt", "kunde_sichtbar": 1})
    r.insert()
    return r


class TestPHRenderingFeedback(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        self.p = testprojekt("Feedback Test")
        self.r = testrendering(self.p.name)

    def test_pin_validierung(self):
        doc = frappe.get_doc({"doctype": "PH Rendering Feedback", "projekt": self.p.name, "rendering": self.r.name, "art": "annotation", "text": "Hier", "punkt_x": 120, "punkt_y": 10})
        with self.assertRaises(frappe.ValidationError):
            doc.insert()
        doc.punkt_x = 40
        doc.insert()
        self.assertEqual(doc.status, "Offen")
        self.assertIn("40 %", doc.titel)
        self.r.reload()
        self.assertEqual(self.r.feedback_offen, frappe.db.count("PH Rendering Feedback", {"rendering": self.r.name, "status": "Offen", "von": "kunde", "art": ("!=", "vote")}))

    def test_rendering_muss_zum_projekt_gehoeren(self):
        anderes = testprojekt("Anderes Projekt")
        doc = frappe.get_doc({"doctype": "PH Rendering Feedback", "projekt": anderes.name, "rendering": self.r.name, "art": "kommentar", "text": "x"})
        with self.assertRaises(frappe.ValidationError):
            doc.insert()

    def test_antwort_setzt_beantwortet(self):
        fb = frappe.get_doc({"doctype": "PH Rendering Feedback", "projekt": self.p.name, "rendering": self.r.name, "art": "kommentar", "text": "Frage"}).insert()
        antwort = fb.antworten("Antwort vom Studio")
        self.assertEqual(frappe.db.get_value("PH Rendering Feedback", fb.name, "status"), "Beantwortet")
        self.assertEqual(frappe.db.get_value("PH Rendering Feedback", antwort, "von"), "studio")

    def test_api_add_feedback_annotation_und_freigabe(self):
        from ph_projekte.api import portal_add_feedback, portal_feedback_list

        token = kunden_token(self.p.kontakt)
        r = portal_add_feedback(kontakt=self.p.kontakt, kunde_token=token, eintrag={"kind": "annotation", "projectId": self.p.name, "renderingId": self.r.name, "body": "Lampe weiter links", "point": {"x": 12.5, "y": 80}}, website_id="PF-test-1", idempotency_key="fb-idem-1")
        self.assertEqual(r["id"], "PF-test-1")
        self.assertEqual(r["entry"]["point"], {"x": 12.5, "y": 80.0})
        wieder = portal_add_feedback(kontakt=self.p.kontakt, kunde_token=token, eintrag={"kind": "annotation", "projectId": self.p.name, "renderingId": self.r.name, "body": "Lampe weiter links", "point": {"x": 12.5, "y": 80}}, website_id="PF-test-1", idempotency_key="fb-idem-1")
        self.assertEqual(wieder["frappeId"], r["frappeId"])
        fehler = portal_add_feedback(kontakt=self.p.kontakt, kunde_token=token, eintrag={"kind": "annotation", "projectId": self.p.name, "renderingId": self.r.name, "body": "x", "point": {"x": 500, "y": 1}})
        self.assertEqual(fehler.get("code"), "invalid")
        frei = portal_add_feedback(kontakt=self.p.kontakt, kunde_token=token, eintrag={"kind": "freigabe", "projectId": self.p.name, "renderingId": self.r.name, "confirm": True, "body": "Passt so"})
        self.assertEqual(frappe.db.get_value("PH Rendering", self.r.name, "freigabe_feedback"), frei["frappeId"])
        liste = portal_feedback_list(kontakt=self.p.kontakt, kunde_token=token, projekt=self.p.name)
        self.assertTrue(any(e["kind"] == "freigabe" for e in liste))

    def test_api_sprachnachricht(self):
        from ph_projekte.api import portal_add_feedback

        token = kunden_token(self.p.kontakt)
        audio = b"OggS" + b"\0" * 1024
        r = portal_add_feedback(kontakt=self.p.kontakt, kunde_token=token, eintrag={"kind": "sprachnachricht", "projectId": self.p.name, "renderingId": self.r.name, "durationSec": 12.4, "consent": "ja"}, audio_base64=base64.b64encode(audio).decode(), audio_mime="audio/ogg")
        self.assertEqual(r["entry"]["audio"]["durationSec"], 12.4)
        self.assertEqual(r["entry"]["audio"]["mime"], "audio/ogg")
        datei = frappe.db.get_value("File", {"attached_to_doctype": "PH Rendering Feedback", "attached_to_name": r["frappeId"]}, "is_private")
        self.assertEqual(datei, 1)
        falsch = portal_add_feedback(kontakt=self.p.kontakt, kunde_token=token, eintrag={"kind": "sprachnachricht", "projectId": self.p.name, "durationSec": 3, "consent": "ja"}, audio_base64=base64.b64encode(b"GIF89a" + b"\0" * 1024).decode(), audio_mime="audio/ogg")
        self.assertEqual(falsch.get("code"), "invalid")

    def test_fremder_kontakt_kein_zugriff(self):
        from ph_projekte.api import portal_add_feedback

        fremd = frappe.get_doc({"doctype": "PH Kontakt", "vorname": "Fremd", "nachname": "Feedback", "email": "fremd-feedback@example.com", "kontaktart": "Privat"})
        fremd.flags.ignore_mandatory = True
        fremd.insert(ignore_permissions=True)
        token = kunden_token(fremd.name)
        r = portal_add_feedback(kontakt=fremd.name, kunde_token=token, eintrag={"kind": "kommentar", "projectId": self.p.name, "body": "fremd"})
        self.assertEqual(r.get("code"), "not_found")
