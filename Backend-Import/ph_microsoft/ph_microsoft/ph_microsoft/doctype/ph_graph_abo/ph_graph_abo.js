// PH Graph Abo – erneuern oder bei Microsoft löschen.
frappe.ui.form.on("PH Graph Abo", {
	refresh(frm) {
		if (frm.is_new() || frm.doc.status === "Geloescht") return;
		frm.add_custom_button(__("Erneuern"), () => {
			frm.call({ method: "erneuern", doc: frm.doc }).then(() => frm.reload_doc());
		}, __("Aktionen"));
		frm.add_custom_button(__("Bei Microsoft löschen"), () => {
			frappe.confirm(__("Abo bei Microsoft löschen? Die stündliche Prüfung legt es neu an, solange Postfach/Kalender aktiv sind."), () =>
				frm.call({ method: "in_microsoft_loeschen", doc: frm.doc }).then(() => frm.reload_doc()));
		}, __("Aktionen"));
	},
});
