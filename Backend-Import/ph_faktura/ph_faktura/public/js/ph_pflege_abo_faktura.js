// ph_faktura (doctype_js – ph_service wird nach ph_faktura installiert): Button „Angebot erstellen“ aus dem Pflege-/Wartungsvertrag (Integration Runde 3)
frappe.ui.form.on("PH Pflege Abo", {
	refresh(frm) {
		if (frm.is_new()) return;
		if (frm.doc.angebot) frm.add_custom_button(__("Angebot öffnen"), () => frappe.set_route("Form", "PH Angebot", frm.doc.angebot), __("Faktura"));
		if (["Angefragt", "Angeboten", "Aktiv"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Angebot erstellen"), () => frappe.call({ method: "ph_faktura.api.create_quote_from_care_contract", args: { pflege_abo: frm.doc.name }, freeze: true }).then((r) => {
				if (r.message) frappe.set_route("Form", "PH Angebot", r.message);
			}), __("Faktura"));
		}
	},
});
