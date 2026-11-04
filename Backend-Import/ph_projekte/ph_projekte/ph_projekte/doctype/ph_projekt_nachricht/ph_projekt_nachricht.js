// PH Projekt Nachricht – Antworten, als gelesen markieren.
frappe.ui.form.on("PH Projekt Nachricht", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), frm.doc.status === "Ungelesen" ? "orange" : "gray");
		if (frm.is_new()) return;
		if (frm.doc.richtung === "eingehend") {
			frm.add_custom_button(__("Antworten"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Antwort an den Kunden"),
					fields: [{ fieldname: "text", fieldtype: "Small Text", label: __("Text"), reqd: 1 }],
					primary_action_label: __("Senden"),
					primary_action(values) {
						frm.call({ method: "antworten", doc: frm.doc, args: values, freeze: true }).then((r) => { d.hide(); if (r.message) frappe.set_route("Form", "PH Projekt Nachricht", r.message); });
					},
				});
				d.show();
			}, __("Aktionen"));
			if (frm.doc.status === "Ungelesen") frm.add_custom_button(__("Als gelesen"), () => frm.call({ method: "als_gelesen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (frm.doc.projekt) frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
	},
});
