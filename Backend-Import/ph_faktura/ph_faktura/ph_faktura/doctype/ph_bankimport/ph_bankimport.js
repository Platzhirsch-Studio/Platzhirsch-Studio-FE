frappe.ui.form.on("PH Bankimport", {
	refresh(frm) {
		ph_faktura.indicator(frm);
		if (frm.is_new() || frm.doc.status === "Importiert") {
			if (!frm.is_new()) frm.add_custom_button(__("Umsätze anzeigen"), () => frappe.set_route("List", "PH Bankumsatz", { import: frm.doc.name }));
			return;
		}
		frm.add_custom_button(__("Importieren"), () => {
			frm.call({ method: "importieren", doc: frm.doc, args: { auto_zuordnen: 1 }, freeze: true, freeze_message: __("CAMT.053 wird gelesen …") }).then((r) => {
				const m = r.message || {};
				frappe.show_alert({ message: __("{0} neu, {1} doppelt, {2} Vorschläge, {3} automatisch zugeordnet", [m.neu, m.doppelt, m.vorschlag, m.zugeordnet]), indicator: "green" });
				frm.reload_doc();
			});
		}, __("Aktionen"));
	},
});
