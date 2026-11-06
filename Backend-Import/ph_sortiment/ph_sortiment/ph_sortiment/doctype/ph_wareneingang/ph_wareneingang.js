// PH Wareneingang – Positionen aus der Bestellung laden, Zustand farbig, Reklamation.
frappe.ui.form.on("PH Wareneingang", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "blue", Teilweise: "orange", Vollstaendig: "green", Reklamiert: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) {
			if (frm.doc.herstellerbestellung && !(frm.doc.positionen || []).length) positionen_laden(frm);
			return;
		}
		if (frm.doc.reklamation) {
			frm.dashboard.set_headline_alert(__("Reklamation nötig – Lieferant informieren, Fotos sichern."), "red");
			frm.add_custom_button(__("Reklamation an Lieferant"), () => {
				frappe.confirm(__("Reklamationsmail mit Positionen und Fotos an den Lieferanten senden?"), () => {
					frm.call({ method: "reklamation_melden", doc: frm.doc, freeze: true }).then((r) => frappe.show_alert({ message: __("Gesendet an {0}", [r.message]), indicator: "green" }));
				});
			}, __("Aktionen"));
			// Servicefall: Knopf „Schaden → Servicefall“ (unten)
		}
		frm.add_custom_button(__("Bestellung öffnen"), () => frappe.set_route("Form", "PH Herstellerbestellung", frm.doc.herstellerbestellung), __("Ansehen"));
	},
	herstellerbestellung(frm) {
		if (frm.is_new() && frm.doc.herstellerbestellung) positionen_laden(frm);
	},
});

frappe.ui.form.on("PH Wareneingang Position", {
	zustand(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		if (row.zustand === "fehlt") frappe.model.set_value(cdt, cdn, "menge_erhalten", 0);
	},
});

function positionen_laden(frm) {
	frappe.db.get_doc("PH Herstellerbestellung", frm.doc.herstellerbestellung).then((hb) => {
		frm.clear_table("positionen");
		(hb.positionen || []).forEach((p) => {
			if (p.status === "Storniert") return;
			const rest = (p.ab_menge || p.menge) - (p.menge_erhalten || 0);
			if (rest <= 0) return;
			frm.add_child("positionen", { position: p.idx, produkt: p.produkt, bezeichnung: p.bezeichnung, menge_erwartet: rest, menge_erhalten: rest, zustand: "ok" });
		});
		frm.refresh_field("positionen");
	});
}

// ── Ergänzung 04.11. (Backend-Lücken 51)
frappe.ui.form.on("PH Wareneingang", {
	refresh(frm) {
		if (frm.is_new()) return;
		const schaden = (frm.doc.positionen || []).some((z) => ["Transportschaden", "beschaedigt", "falsch", "fehlt"].includes(z.zustand));
		if (frm.doc.unterlieferung || frm.doc.ueberlieferung) frm.dashboard.add_indicator(__("Unterlieferung {0} · Überlieferung {1}", [frm.doc.unterlieferung || 0, frm.doc.ueberlieferung || 0]), "orange");
		if (frm.doc.servicefall_ref) frm.add_custom_button(__("Servicefall {0}", [frm.doc.servicefall_ref]), () => frappe.set_route("Form", "PH Servicefall", frm.doc.servicefall_ref), __("Ansehen"));
		if (schaden && !frm.doc.servicefall_ref) {
			frm.add_custom_button(__("Schaden → Servicefall"), () => {
				frappe.prompt([
					{ fieldname: "beschreibung", fieldtype: "Small Text", label: __("Beschreibung (leer = aus Positionen)") },
					{ fieldname: "regress", fieldtype: "Check", label: __("Lieferantenregress anlegen") },
				], (v) => {
					frm.call({ method: "schaden_melden", doc: frm.doc, args: v, freeze: true }).then((r) => {
						const m = r.message || {};
						frappe.show_alert({ message: m.servicefall ? __("Servicefall {0} angelegt", [m.servicefall]) : __("Aufgabe angelegt: {0}", [m.hinweis]), indicator: "green" });
						frm.reload_doc();
					});
				}, __("Schaden melden"), __("Anlegen"));
			}, __("Aktionen"));
		}
	},
});
