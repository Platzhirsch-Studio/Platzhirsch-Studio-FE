// PH Meldebestand – Buttons: Jetzt prüfen, Empfehlung übernehmen, Vorschläge zeigen.
frappe.ui.form.on("PH Meldebestand", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Jetzt prüfen"), () => frm.call({ method: "jetzt_pruefen", doc: frm.doc, freeze: true }).then((r) => {
			const m = r.message || {};
			frappe.show_alert({ message: m.vorschlag ? __("Vorschlag {0}", [m.vorschlag]) : __("Kein Vorschlag nötig"), indicator: m.vorschlag ? "orange" : "green" });
			frm.reload_doc();
		}), __("Aktionen"));
		if (frm.doc.empfehlung_meldebestand && frm.doc.empfehlung_meldebestand !== frm.doc.meldebestand) {
			frm.add_custom_button(__("Empfehlung übernehmen ({0})", [frm.doc.empfehlung_meldebestand]), () => frm.call({ method: "empfehlung_uebernehmen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		frm.add_custom_button(__("Vorschläge"), () => frappe.set_route("List", "PH Bestellvorschlag", { meldebestand_regel: frm.doc.name }), __("Aktionen"));
		if (frm.doc.unter_meldebestand) frm.dashboard.add_indicator(__("Unter Meldebestand: verfügbar {0}", [frm.doc.verfuegbar]), "orange");
	},
});
