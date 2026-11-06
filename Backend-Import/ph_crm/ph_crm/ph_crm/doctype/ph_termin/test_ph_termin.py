"""bench --site <site> run-tests --app ph_crm --doctype "PH Termin"

Deckt ab: Slot-Berechnung, Kollision (zwei create_termin gleicher Slot → 1× 409 slot_taken), Idempotenz,
verify (ok, bereits bestätigt, abgelaufen → verify_expired), cancel/reschedule mit Link-Version,
Fehlercodes der Website, Workflow-Endzustände über Server-Methoden.
"""

import hashlib
from datetime import datetime, timedelta

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, add_to_date, now_datetime

from ph_crm.api import cancel_termin, create_termin, get_freie_slots, get_termin, get_terminarten, reschedule_termin, verify_termin
from ph_crm.utils.zeit import iso

ART = "test_studio"
EMAIL_DOMAIN = "@termin-test.example"


def naechster_dienstag_10():
    d = now_datetime().date() + timedelta(days=2)
    while d.weekday() != 1:
        d += timedelta(days=1)
    return datetime.combine(d, datetime.min.time()).replace(hour=10)


def sha(s):
    return hashlib.sha256(s.encode()).hexdigest()


class TestPHTermin(FrappeTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        if not frappe.db.exists("PH Terminart", ART):
            frappe.get_doc({"doctype": "PH Terminart", "key": ART, "titel_de": "Test Studio", "modus": "Showroom", "dauer_min": 60, "puffer_min": 15, "vorlauf_stunden": 1, "max_tage_voraus": 60, "bestaetigung": "automatisch", "berater": [{"user": "Administrator", "anzeigename": "Admin"}]}).insert()
        if not frappe.db.exists("PH Terminart", "test_vor_ort"):
            frappe.get_doc({"doctype": "PH Terminart", "key": "test_vor_ort", "titel_de": "Test Vor Ort", "modus": "Vor Ort", "dauer_min": 90, "puffer_min": 60, "anfahrt_min": 60, "vorlauf_stunden": 1, "feste_startzeiten": "10:00,14:00", "bestaetigung": "manuell", "berater": [{"user": "Administrator"}]}).insert()
        frappe.db.delete("PH Verfuegbarkeit", {"user": "Administrator"})
        for tag in ("1 Dienstag", "2 Mittwoch", "3 Donnerstag", "4 Freitag"):
            frappe.get_doc({"doctype": "PH Verfuegbarkeit", "user": "Administrator", "wochentag": tag, "von": "10:00:00", "bis": "18:00:00"}).insert()
        frappe.db.commit()

    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("PH Termin", {"email": ("like", f"%{EMAIL_DOMAIN}")})
        frappe.db.delete("PH API Protokoll", {"methode": ("like", "ph_crm.api.termin.%")})
        frappe.cache().delete_keys("ph_crm:termin:")
        frappe.cache().delete_value("ph_crm:termin_einstellungen")
        self.start = naechster_dienstag_10()

    def buchung(self, start=None, email="a" + EMAIL_DOMAIN, idem=None, **extra):
        daten = {
            "terminart": ART,
            "modus": "studio",
            "start": iso(start or self.start),
            "zeitzone": "Europe/Vienna",
            "vorname": "Test",
            "nachname": "Termin",
            "email": email,
            "sprache": "de",
            "verify_hash": sha("verify-" + email),
            "link_version": 1,
            "kundenmail": "website",
            "quelle": "website",
        }
        if idem:
            daten["idempotency_key"] = idem
        daten.update(extra)
        return create_termin(**daten)

    # ── Lesen ────────────────────────────────────────────────────────────────

    def test_terminarten_und_slots(self):
        arten = get_terminarten(sprache="de")
        self.assertTrue(any(a["key"] == ART and a["modus"] == "studio" and a["bestaetigung"] == "sofort" for a in arten))
        slots = get_freie_slots(terminart=ART, modus="studio", von=str(self.start.date()), bis=str(self.start.date()), zeitzone="Europe/Vienna")
        starts = [s["start"] for s in slots]
        self.assertIn(iso(self.start), starts)
        self.assertEqual(slots[0]["berater"], ["Administrator"])

    # ── Buchen ───────────────────────────────────────────────────────────────

    def test_create_unbestaetigt_mit_reservierung(self):
        r = self.buchung()
        self.assertEqual(r["status"], "Unbestaetigt")
        self.assertTrue(r["referenz"].startswith("PT-"))
        self.assertTrue(r["reserviert_bis"])
        self.assertEqual(r["modus"], "studio")
        doc = frappe.get_doc("PH Termin", {"referenz": r["referenz"]})
        self.assertEqual(doc.berater, "Administrator")
        self.assertEqual(doc.ende, self.start + timedelta(minutes=60))
        # Slot ist jetzt belegt (Reservierung)
        slots = get_freie_slots(terminart=ART, modus="studio", von=str(self.start.date()), bis=str(self.start.date()))
        self.assertNotIn(iso(self.start), [s["start"] for s in slots])

    def test_create_speichert_kampagnenfelder(self):
        """utm_*/klick_id (Website withAttributionFields, nur mit Einwilligung) landen am PH Termin."""
        r = self.buchung(utm_source="google", utm_medium="cpc", utm_campaign="kueche-herbst", utm_term="kueche lochau", utm_content="anzeige-a", klick_id="gclid=abc123")
        doc = frappe.get_doc("PH Termin", {"referenz": r["referenz"]})
        self.assertEqual((doc.utm_source, doc.utm_medium, doc.utm_campaign), ("google", "cpc", "kueche-herbst"))
        self.assertEqual((doc.utm_term, doc.utm_content, doc.klick_id), ("kueche lochau", "anzeige-a", "gclid=abc123"))

    def test_kollision_409(self):
        self.buchung(email="eins" + EMAIL_DOMAIN)
        r = self.buchung(email="zwei" + EMAIL_DOMAIN)
        self.assertEqual(r.get("code"), "slot_taken")
        self.assertEqual(frappe.local.response.get("http_status_code"), 409)
        # 30 Minuten später kollidiert über den Puffer ebenfalls, 11:15 wäre frei, 11:30 im Raster frei
        r2 = self.buchung(start=self.start + timedelta(minutes=30), email="drei" + EMAIL_DOMAIN)
        self.assertEqual(r2.get("code"), "slot_taken")
        r3 = self.buchung(start=self.start + timedelta(minutes=90), email="vier" + EMAIL_DOMAIN)
        self.assertEqual(r3["status"], "Unbestaetigt")

    def test_idempotenz(self):
        a = self.buchung(idem="idem-termin-1")
        b = self.buchung(idem="idem-termin-1")
        self.assertEqual(a["referenz"], b["referenz"])
        self.assertEqual(frappe.db.count("PH Termin", {"email": "a" + EMAIL_DOMAIN}), 1)

    def test_fehlercodes(self):
        r = self.buchung(start=self.start.replace(hour=7))  # außerhalb der Verfügbarkeit
        self.assertEqual(r.get("code"), "outside_window")
        self.assertEqual(frappe.local.response.get("http_status_code"), 422)  # expliziter ApiFehler("outside_window", 422); ValidationError wäre 400 (ph_api)
        r = self.buchung(start=self.start.replace(minute=10))  # nicht im Raster
        self.assertEqual(r.get("code"), "outside_window")
        r = self.buchung(terminart="gibt_es_nicht")
        self.assertEqual(r.get("code"), "not_found")
        r = self.buchung(modus="video")
        self.assertEqual(r.get("code"), "invalid")
        r = create_termin(terminart=ART, start=iso(self.start))  # Pflichtfelder fehlen
        self.assertEqual(r.get("code"), "invalid")
        r = self.buchung(terminart="test_vor_ort", modus="vor_ort", start=self.start.replace(hour=14))  # Telefon/PLZ fehlen
        self.assertEqual(r.get("code"), "invalid")
        self.assertEqual(get_termin(referenz="PT-XXXXXX").get("code"), "invalid_token")
        self.assertEqual(frappe.local.response.get("http_status_code"), 404)

    # ── Bestätigen ───────────────────────────────────────────────────────────

    def test_verify_und_bereits_bestaetigt(self):
        r = self.buchung()
        self.assertEqual(verify_termin(referenz=r["referenz"], verify_hash="falsch").get("code"), "invalid_token")
        v = verify_termin(referenz=r["referenz"], verify_hash=sha("verify-a" + EMAIL_DOMAIN))
        self.assertEqual(v["status"], "Bestaetigt")
        self.assertEqual(v["bereits_bestaetigt"], 0)
        self.assertIsNone(v["reserviert_bis"])
        doc = frappe.get_doc("PH Termin", {"referenz": r["referenz"]})
        self.assertEqual(doc.email_verifiziert, 1)
        self.assertTrue(doc.event, "Kalender-Event wurde angelegt")
        self.assertEqual(doc.workflow_state, "PH Bestaetigt") if doc.meta.has_field("workflow_state") else None
        v2 = verify_termin(referenz=r["referenz"], verify_hash=sha("verify-a" + EMAIL_DOMAIN))
        self.assertEqual(v2["bereits_bestaetigt"], 1)

    def test_verify_abgelaufen_und_slot_vergeben(self):
        r = self.buchung()
        frappe.db.set_value("PH Termin", {"referenz": r["referenz"]}, "reserviert_bis", add_to_date(now_datetime(), minutes=-5))
        # Slot ist frei geworden – jemand anderes bucht ihn
        r2 = self.buchung(email="zweiter" + EMAIL_DOMAIN)
        self.assertEqual(r2["status"], "Unbestaetigt")
        v = verify_termin(referenz=r["referenz"], verify_hash=sha("verify-a" + EMAIL_DOMAIN))
        self.assertEqual(v.get("code"), "verify_expired")
        self.assertEqual(frappe.local.response.get("http_status_code"), 410)

    def test_verify_abgelaufen_aber_frei(self):
        r = self.buchung()
        frappe.db.set_value("PH Termin", {"referenz": r["referenz"]}, "reserviert_bis", add_to_date(now_datetime(), minutes=-5))
        v = verify_termin(referenz=r["referenz"], verify_hash=sha("verify-a" + EMAIL_DOMAIN))
        self.assertEqual(v["status"], "Bestaetigt")

    def test_vor_ort_manuell(self):
        r = self.buchung(terminart="test_vor_ort", modus="vor_ort", start=self.start.replace(hour=14), telefon="+43 660 1", plz_ort="6911 Lochau")
        self.assertEqual(r["status"], "Unbestaetigt")
        v = verify_termin(referenz=r["referenz"], verify_hash=sha("verify-a" + EMAIL_DOMAIN))
        self.assertEqual(v["status"], "Unbestaetigt")
        self.assertEqual(v["email_verifiziert"], 1)  # Website zeigt „angefragt“
        self.assertTrue(frappe.db.exists("PH Aufgabe", {"referenz_doctype": "PH Termin", "referenz_name": frappe.db.get_value("PH Termin", {"referenz": r["referenz"]}, "name")}))
        doc = frappe.get_doc("PH Termin", {"referenz": r["referenz"]})
        doc.bestaetigen(mail=0)
        doc.reload()
        self.assertEqual(doc.status, "Bestaetigt")

    # ── Verwalten ────────────────────────────────────────────────────────────

    def test_cancel_und_reschedule(self):
        r = self.buchung()
        # Unbestätigt: kein Verwaltungslink
        self.assertEqual(cancel_termin(referenz=r["referenz"], link_version=1).get("code"), "invalid_token")
        verify_termin(referenz=r["referenz"], verify_hash=sha("verify-a" + EMAIL_DOMAIN))
        self.assertEqual(reschedule_termin(referenz=r["referenz"], link_version=2, neuer_start=iso(self.start + timedelta(hours=2))).get("code"), "invalid_token")
        neu = reschedule_termin(referenz=r["referenz"], link_version=1, neuer_start=iso(self.start + timedelta(hours=2)))
        self.assertEqual(neu["link_version"], 2)
        self.assertEqual(neu["sequence"], 1)
        self.assertEqual(neu["start"], iso(self.start + timedelta(hours=2)))
        self.assertEqual(reschedule_termin(referenz=r["referenz"], link_version=2, neuer_start=iso(self.start.replace(hour=7))).get("code"), "outside_window")
        c = cancel_termin(referenz=r["referenz"], link_version=2)
        self.assertEqual(c["status"], "Storniert")
        self.assertEqual(c["sequence"], 2)
        c2 = cancel_termin(referenz=r["referenz"], link_version=2)
        self.assertEqual(c2.get("bereits_storniert"), 1)
        doc = frappe.get_doc("PH Termin", {"referenz": r["referenz"]})
        self.assertEqual(frappe.db.get_value("Event", doc.event, "status"), "Cancelled")
        # Slot wieder frei
        slots = get_freie_slots(terminart=ART, modus="studio", von=str(self.start.date()), bis=str(self.start.date()))
        self.assertIn(iso(self.start + timedelta(hours=2)), [s["start"] for s in slots])

    def test_too_late_to_change(self):
        r = self.buchung()
        verify_termin(referenz=r["referenz"], verify_hash=sha("verify-a" + EMAIL_DOMAIN))
        frappe.db.set_value("PH Termin", {"referenz": r["referenz"]}, {"start": add_to_date(now_datetime(), hours=-1), "ende": now_datetime()})
        self.assertEqual(cancel_termin(referenz=r["referenz"], link_version=1).get("code"), "too_late_to_change")
        self.assertEqual(frappe.local.response.get("http_status_code"), 409)

    # ── Backoffice-Aktionen / Endzustände ────────────────────────────────────

    def test_backoffice_termin_erledigt_mit_protokoll(self):
        doc = frappe.get_doc({"doctype": "PH Termin", "terminart": ART, "start": self.start + timedelta(hours=4), "vorname": "Büro", "nachname": "Termin", "email": "buero" + EMAIL_DOMAIN, "quelle": "backoffice", "kundenmail": "backoffice", "status": "Bestaetigt"}).insert()
        self.assertEqual(doc.status, "Bestaetigt")
        self.assertTrue(doc.referenz.startswith("PT-"))
        bg = doc.erledigt_mit_protokoll(protokoll=1)
        doc.reload()
        self.assertEqual(doc.status, "Erledigt")
        self.assertTrue(doc.kontakt)
        self.assertEqual(frappe.db.get_value("PH Beratungsgespraech", bg, "termin"), doc.name)
        with self.assertRaises(frappe.ValidationError):
            doc.delete()

    def test_nicht_erschienen_und_absagen(self):
        a = frappe.get_doc({"doctype": "PH Termin", "terminart": ART, "start": self.start + timedelta(days=1), "nachname": "NoShow", "email": "noshow" + EMAIL_DOMAIN, "status": "Bestaetigt"}).insert()
        a.nicht_erschienen("kein Anruf")
        a.reload()
        self.assertEqual(a.status, "Nicht erschienen")
        b = frappe.get_doc({"doctype": "PH Termin", "terminart": ART, "start": self.start + timedelta(days=1, hours=2), "nachname": "Absage", "email": "absage" + EMAIL_DOMAIN}).insert()
        b.absagen(grund="Krank", mail=0, abgelehnt=1)
        b.reload()
        self.assertEqual(b.status, "Abgelehnt")
        self.assertEqual(b.storno_grund, "Krank")

    def test_video_braucht_einwilligung(self):
        if not frappe.db.exists("PH Terminart", "test_video"):
            frappe.get_doc({"doctype": "PH Terminart", "key": "test_video", "titel_de": "Test Video", "modus": "Video", "dauer_min": 45, "vorlauf_stunden": 1, "berater": [{"user": "Administrator"}]}).insert()
        r = self.buchung(terminart="test_video", modus="video", start=self.start + timedelta(days=2))
        self.assertEqual(r.get("code"), "invalid")
        r = self.buchung(terminart="test_video", modus="video", start=self.start + timedelta(days=2), einwilligung_video=1, einwilligung_text_version="video-v2-2026-10-29")
        self.assertEqual(r["status"], "Unbestaetigt")
        self.assertEqual(frappe.db.get_value("PH Termin", {"referenz": r["referenz"]}, "einwilligung_text_version"), "video-v2-2026-10-29")

    def test_scheduler_reservierung_freigeben(self):
        from ph_crm.ph_crm.tasks import reservierungen_freigeben

        r = self.buchung()
        frappe.db.set_value("PH Termin", {"referenz": r["referenz"]}, "reserviert_bis", add_days(now_datetime(), -2))
        reservierungen_freigeben()
        self.assertEqual(frappe.db.get_value("PH Termin", {"referenz": r["referenz"]}, "status"), "Abgelehnt")
        self.assertEqual(verify_termin(referenz=r["referenz"], verify_hash=sha("verify-a" + EMAIL_DOMAIN)).get("code"), "cancelled")

    def test_no_show_aufgabe_und_wieder_bestaetigen(self):
        a = frappe.get_doc({"doctype": "PH Termin", "terminart": ART, "start": self.start + timedelta(days=1, hours=4), "nachname": "NoShow2", "email": "noshow2" + EMAIL_DOMAIN, "status": "Bestaetigt", "berater": "Administrator"}).insert()
        a.nicht_erschienen("kein Anruf")
        self.assertTrue(frappe.db.exists("PH Aufgabe", {"referenz_doctype": "PH Termin", "referenz_name": a.name, "quelle": "scheduler"}))
        a.reload()
        a.wieder_bestaetigen("Fehlbedienung")
        a.reload()
        self.assertEqual(a.status, "Bestaetigt")

    def test_serie_mit_konflikt(self):
        a = frappe.get_doc({"doctype": "PH Termin", "terminart": ART, "start": self.start + timedelta(hours=2), "nachname": "Serie", "email": "serie" + EMAIL_DOMAIN, "status": "Bestaetigt", "berater": "Administrator", "quelle": "backoffice", "kundenmail": "backoffice"}).insert()
        frappe.get_doc({"doctype": "PH Termin", "terminart": ART, "start": self.start + timedelta(days=7, hours=2), "nachname": "Blocker", "email": "blocker" + EMAIL_DOMAIN, "status": "Bestaetigt", "berater": "Administrator"}).insert()
        r = a.serie_anlegen("woechentlich", anzahl=3)
        self.assertEqual(len(r["angelegt"]), 1)
        self.assertEqual(len(r["konflikte"]), 1)
        self.assertEqual(frappe.db.count("PH Termin", {"serie": r["serie"]}), 2)
        a.reload()
        a.serie_stornieren("Projekt fertig")
        self.assertEqual(frappe.db.count("PH Termin", {"serie": r["serie"], "status": "Storniert"}), 2)
