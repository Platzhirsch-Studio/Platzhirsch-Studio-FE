// PH Datenschutzanfrage – Buttons: Bearbeiten, Auskunft erstellen, Löschplan, Löschung ausführen, Abschließen, Ablehnen.
frappe.ui.form.on("PH Datenschutzanfrage", {
	refresh(frm) {
		const farben = { Offen: "orange", "In Arbeit": "blue", Erledigt: "green", Abgelehnt: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		const offen = !["Erledigt", "Abgelehnt"].includes(frm.doc.status);
		if (offen && frm.doc.frist && frappe.datetime.get_diff(frm.doc.frist, frappe.datetime.get_today()) <= 7) {
			frm.dashboard.set_headline_alert(__("Antwortfrist {0} – bitte priorisieren.", [frappe.datetime.str_to_user(frm.doc.frist)]), "orange");
		}
		if (!offen) return;
		const call = (method, args) => frm.call({ method, doc: frm.doc, args, freeze: true }).then(() => frm.reload_doc());
		if (frm.doc.status === "Offen") frm.add_custom_button(__("In Bearbeitung nehmen"), () => call("bearbeiten"), __("Aktionen"));
		if (["Auskunft", "Datenuebertragbarkeit", "Loeschung"].includes(frm.doc.art)) {
			frm.add_custom_button(__("Auskunft erstellen (JSON)"), () => call("auskunft_erstellen"), __("Aktionen"));
		}
		if (frm.doc.art === "Loeschung") {
			frm.add_custom_button(__("Löschplan anzeigen"), () => {
				frm.call({ method: "loeschplan_erstellen", doc: frm.doc, freeze: true }).then((r) => {
					const zeilen = (r.message || []).map((z) => `<tr><td>${frappe.utils.escape_html(z.doctype)}</td><td>${frappe.utils.escape_html(z.name || "")}</td><td>${frappe.utils.escape_html(__(z.aktion))}</td><td>${frappe.utils.escape_html(z.frist_bis || "")}</td><td>${frappe.utils.escape_html(z.grund || "")}</td></tr>`).join("");
					frappe.msgprint({ title: __("Lösch- und Aufbewahrungsplan"), wide: true, message: `<table class="table table-bordered"><thead><tr><th>${__("Art")}</th><th>${__("Beleg")}</th><th>${__("Aktion")}</th><th>${__("Frist")}</th><th>${__("Grund")}</th></tr></thead><tbody>${zeilen}</tbody></table>` });
					frm.reload_doc();
				});
			}, __("Aktionen"));
			frm.add_custom_button(__("Löschung ausführen"), () => {
				frappe.prompt({ fieldname: "bestaetigung", fieldtype: "Data", label: __("Zur Bestätigung ANONYMISIEREN eintippen"), reqd: 1 }, (v) => call("loeschung_ausfuehren", v), __("Endgültig löschen / anonymisieren"));
			}, __("Aktionen"));
		}
		if (["Berichtigung", "Einschraenkung", "Widerspruch"].includes(frm.doc.art)) {
			frm.add_custom_button(__("Abschließen"), () => {
				frappe.prompt({ fieldname: "ergebnis", fieldtype: "Small Text", label: __("Ergebnis"), reqd: 1, default: frm.doc.ergebnis }, (v) => call("abschliessen", v), __("Abschließen"));
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Ablehnen"), () => {
			frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Begründung"), reqd: 1 }, (v) => call("ablehnen", v), __("Ablehnen"));
		}, __("Aktionen"));
	},
});
