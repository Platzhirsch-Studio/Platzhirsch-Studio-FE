// PH Krankmeldung – Bestätigung, Gesundmeldung, Verlängern, Stornieren (Leitung). Keine Diagnose erfassen.
frappe.ui.form.on("PH Krankmeldung", {
	onload(frm) {
		if (frm.is_new() && !frm.doc.mitarbeiter) {
			frappe.db.get_value("PH Mitarbeiter", { user: frappe.session.user }, "name").then((r) => {
				if (r.message && r.message.name) {
					frm.set_value("mitarbeiter", r.message.name);
					frm.set_value("meldeweg", "Selbstservice");
				}
			});
		}
	},
	refresh(frm) {
		const farben = { Gemeldet: "orange", Bestaetigt: "blue", Beendet: "green", Storniert: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new() || frm.doc.status === "Storniert") return;
		if (!frm.doc.bestaetigung_eingelangt_am) {
			frm.add_custom_button(__("Bestätigung erfasst"), () => {
				new frappe.ui.Dialog({
					title: __("Arbeitsunfähigkeitsbestätigung"),
					fields: [
						{ fieldname: "datum", fieldtype: "Date", label: __("Eingelangt am"), default: frappe.datetime.get_today(), reqd: 1 },
						{ fieldname: "datei", fieldtype: "Attach", label: __("Datei (wird privat gespeichert)") },
					],
					primary_action_label: __("Speichern"),
					primary_action(v) { this.hide(); frm.call({ method: "bestaetigung_erfasst", doc: frm.doc, args: v }).then(() => frm.reload_doc()); },
				}).show();
			}, __("Aktionen"));
		}
		if (frm.doc.status !== "Beendet") {
			frm.add_custom_button(__("Gesundmeldung"), () => {
				frappe.prompt({ fieldname: "bis", fieldtype: "Date", label: __("Letzter Krankenstandstag"), reqd: 1, default: frappe.datetime.add_days(frappe.datetime.get_today(), -1) },
					(v) => frm.call({ method: "gesund_melden", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Gesundmeldung"));
			}, __("Aktionen"));
			frm.add_custom_button(__("Verlängern"), () => {
				frappe.prompt({ fieldname: "bis_voraussichtlich", fieldtype: "Date", label: __("Voraussichtlich bis"), reqd: 1 },
					(v) => frm.call({ method: "verlaengern", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Verlängern"));
			}, __("Aktionen"));
		}
		if (frappe.user.has_role("PH Personal Leitung")) {
			frm.add_custom_button(__("Stornieren"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 },
					(v) => frm.call({ method: "stornieren", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Krankmeldung stornieren"));
			}, __("Aktionen"));
		}
	},
});
