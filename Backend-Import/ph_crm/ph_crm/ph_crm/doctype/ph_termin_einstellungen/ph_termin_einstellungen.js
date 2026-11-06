frappe.ui.form.on("PH Termin Einstellungen", {
	refresh(frm) {
		frm.add_custom_button(__("Feiertage Österreich ergänzen"), () => {
			frappe.prompt({ fieldname: "jahr", fieldtype: "Int", label: __("Jahr"), default: new Date().getFullYear() + 1, reqd: 1 }, (v) => {
				frappe.call({ method: "ph_crm.install.feiertage_ergaenzen", args: { jahr: v.jahr }, freeze: true }).then((r) => {
					frappe.show_alert({ message: __("{0} Feiertage ergänzt", [r.message || 0]), indicator: "green" });
					frm.reload_doc();
				});
			}, __("Feiertage"));
		}, __("Aktionen"));
		frm.add_custom_button(__("Meet-Verbindung prüfen"), () => {
			frm.call({ method: "meet_verbindung_pruefen", doc: frm.doc, freeze: true }).then((r) => {
				const m = r.message || {};
				frappe.msgprint({ title: __("Videoberatung"), message: frappe.utils.escape_html(m.meldung || ""), indicator: m.ok ? "green" : "red" });
			});
		}, __("Aktionen"));
		frm.add_custom_button(__("Beratungsvorlagen"), () => frappe.set_route("List", "PH Beratungsvorlage"), __("Aktionen"));
		frm.add_custom_button(__("Terminarten"), () => frappe.set_route("List", "PH Terminart"), __("Aktionen"));
		frm.add_custom_button(__("Verfügbarkeiten"), () => frappe.set_route("List", "PH Verfuegbarkeit"), __("Aktionen"));
	},
});
