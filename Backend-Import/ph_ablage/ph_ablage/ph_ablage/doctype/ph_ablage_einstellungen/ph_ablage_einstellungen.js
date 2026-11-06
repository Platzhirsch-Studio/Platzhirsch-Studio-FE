frappe.ui.form.on("PH Ablage Einstellungen", {
	setup(frm) {
		frm.set_query("bezug_doctype", "ordnervorlagen", () => ({ filters: { name: ["in", ["PH Kontakt", "PH Projekt", "PH Lieferant", "PH Mitarbeiter", "PH Servicefall"]] } }));
	},
	refresh(frm) {
		frm.add_custom_button(__("Speicher prüfen"), () =>
			frm.call({ method: "speicher_pruefen", doc: frm.doc }).then((r) => {
				const m = r.message || {};
				frappe.msgprint({ title: __("Speicher"), message: frappe.utils.escape_html(m.meldung || ""), indicator: m.ok ? "green" : "red" });
				frm.reload_doc();
			}), __("Aktionen"));
		frm.add_custom_button(__("Ordnervorlagen auf Standard"), () =>
			frappe.confirm(__("Alle Ordnervorlagen durch den Standard ersetzen?"), () =>
				frm.call({ method: "vorlagen_zuruecksetzen", doc: frm.doc }).then(() => frm.reload_doc())), __("Aktionen"));
		frm.add_custom_button(__("Bestand übernehmen"), () =>
			frappe.call({ method: "ph_ablage.api.bestand_uebernehmen", args: { bezug_doctype: null, limit: 500 } }).then(() => frappe.show_alert(__("Im Hintergrund eingereiht"))), __("Aktionen"));
	},
});
