// PH Empfehlung – Buttons: Code senden, Gutschein senden (nach Frist), Ablehnen.
frappe.ui.form.on("PH Empfehlung", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { "Code ausgegeben": "blue", "Anfrage eingegangen": "cyan", "Auftrag erteilt": "purple", "Gutschein faellig": "orange", "Gutschein ausgegeben": "green", Verfallen: "gray", Abgelehnt: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (!frm.doc.code_gesendet_am) {
			frm.add_custom_button(__("Code senden"), () => frm.call({ method: "code_senden", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (frm.doc.status === "Gutschein faellig") {
			frm.add_custom_button(__("Gutschein senden"), () => {
				frappe.prompt({ fieldname: "gutschein_code", fieldtype: "Data", label: __("Gutscheincode (aus ph_shop)"), reqd: 1 }, (v) => frm.call({ method: "gutschein_senden", doc: frm.doc, args: v, freeze: true }).then(() => frm.reload_doc()), __("Danke-Mail mit Gutschein"));
			}, __("Aktionen"));
		}
		if (!["Gutschein ausgegeben", "Abgelehnt", "Verfallen"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Ablehnen"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Data", label: __("Grund") }, (v) => frm.call({ method: "ablehnen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Empfehlung ablehnen"));
			}, __("Aktionen"));
		}
	},
});
