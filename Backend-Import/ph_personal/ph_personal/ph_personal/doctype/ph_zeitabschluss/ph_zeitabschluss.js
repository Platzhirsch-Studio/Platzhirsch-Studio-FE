// PH Zeitabschluss – Wieder öffnen (Leitung, Grund) und erneut abschließen.
frappe.ui.form.on("PH Zeitabschluss", {
	refresh(frm) {
		if (frm.is_new() || !frappe.user.has_role("PH Personal Leitung")) return;
		if (frm.doc.status === "Abgeschlossen") {
			frm.add_custom_button(__("Wieder öffnen"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 },
					(v) => frm.call({ method: "wieder_oeffnen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Monat wieder öffnen"));
			}, __("Aktionen"));
		} else {
			frm.add_custom_button(__("Erneut abschließen"), () => frm.call({ method: "erneut_abschliessen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
	},
});
