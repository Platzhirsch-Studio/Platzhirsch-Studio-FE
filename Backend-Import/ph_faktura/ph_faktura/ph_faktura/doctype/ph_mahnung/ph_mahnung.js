frappe.ui.form.on("PH Mahnung", {
	refresh(frm) {
		ph_faktura.indicator(frm);
		if (frm.is_new()) return;
		if (frm.doc.status === "Entwurf") {
			frm.add_custom_button(__("Senden"), () => {
				if (frm.doc.kanal === "Post") {
					frappe.confirm(__("Mahnung als per Post gesendet markieren?"), () => frm.call({ method: "senden", doc: frm.doc }).then(() => frm.reload_doc()));
				} else {
					ph_faktura.senden_dialog(frm, "senden");
				}
			}, __("Aktionen"));
			frm.add_custom_button(__("Stornieren"), () => frm.call({ method: "stornieren", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (frm.doc.status === "Gesendet") frm.add_custom_button(__("Erledigt"), () => frm.call({ method: "erledigen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		frm.add_custom_button(__("Rechnung öffnen"), () => frappe.set_route("Form", "PH Rechnung", frm.doc.rechnung));
	},
	mahngebuehr_cent: summe, verzugszinsen_cent: summe,
});
function summe(frm) {
	frm.set_value("gesamt_cent", (frm.doc.offen_cent || 0) + (frm.doc.mahngebuehr_cent || 0) + (frm.doc.verzugszinsen_cent || 0));
}
