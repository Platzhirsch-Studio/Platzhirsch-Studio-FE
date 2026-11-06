// PH Inventurbewertung – Buttons: Berechnen, Festschreiben (Leitung/GF), Verwerfen, CSV-Export, Drucken „PH Inventurbewertung“.
frappe.ui.form.on("PH Inventurbewertung", {
	refresh(frm) {
		const farben = { Entwurf: "orange", Festgeschrieben: "green", Verworfen: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.status === "Entwurf") {
			frm.add_custom_button(__("Berechnen"), () => frm.call({ method: "berechnen", doc: frm.doc, freeze: true, freeze_message: __("Bewerte Bestand zum Stichtag …") }).then(() => frm.reload_doc()), __("Aktionen"));
			if (frm.doc.berechnet_am && frappe.user.has_role(["PH Logistik Leitung", "PH Geschäftsführung", "PH Backoffice-Admin", "System Manager"])) {
				frm.add_custom_button(__("Festschreiben"), () => frappe.confirm(__("Bewertung zum {0} festschreiben? Danach unveränderlich.", [frappe.datetime.str_to_user(frm.doc.stichtag)]), () => frm.call({ method: "festschreiben", doc: frm.doc }).then(() => frm.reload_doc())), __("Aktionen"));
			}
			frm.add_custom_button(__("Verwerfen"), () => frappe.confirm(__("Entwurf verwerfen?"), () => frm.call({ method: "verwerfen", doc: frm.doc }).then(() => frm.reload_doc())), __("Aktionen"));
		}
		if (frm.doc.berechnet_am) {
			frm.add_custom_button(__("CSV exportieren"), () => frm.call({ method: "csv_exportieren", doc: frm.doc }).then((r) => { if (r.message) window.open(r.message); frm.reload_doc(); }), __("Export"));
			frm.add_custom_button(__("Drucken (Unterschrift)"), () => frappe.utils.print(frm.doctype, frm.docname, "PH Inventurbewertung", frm.doc.letter_head, "de"), __("Export"));
		}
		frm.add_custom_button(__("Bericht"), () => frappe.set_route("query-report", "PH Inventurbewertung", { stichtag: frm.doc.stichtag, lagerort: frm.doc.lagerort, methode: frm.doc.methode }), __("Export"));
		if (frm.doc.abwertung_platzhalter) frm.dashboard.add_comment(__("Abwertungssätze sind Platzhalter – Steuerberater bestätigt."), "orange", true);
		if (frm.doc.ohne_ek) frm.dashboard.add_indicator(__("{0} Positionen ohne EK", [frm.doc.ohne_ek]), "red");
	},
});
