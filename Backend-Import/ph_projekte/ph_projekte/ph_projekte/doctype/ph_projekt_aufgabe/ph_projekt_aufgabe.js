// PH Projekt Aufgabe – Erledigen, Zeit buchen.
frappe.ui.form.on("PH Projekt Aufgabe", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "blue", "In Arbeit": "orange", Erledigt: "green", Verworfen: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.status !== "Erledigt") frm.add_custom_button(__("Erledigt"), () => frm.call({ method: "erledigen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		frm.add_custom_button(__("Zeit buchen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Zeit auf diese Aufgabe buchen"),
				fields: [
					{ fieldname: "dauer_min", fieldtype: "Int", label: __("Dauer (Minuten)"), reqd: 1, default: 30 },
					{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), default: frappe.datetime.get_today() },
					{ fieldname: "beschreibung", fieldtype: "Data", label: __("Beschreibung"), default: frm.doc.titel },
				],
				primary_action_label: __("Buchen"),
				primary_action(values) {
					frm.call({ method: "zeit_buchen", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
				},
			});
			d.show();
		}, __("Aktionen"));
		frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
		if (frm.doc.faellig && frm.doc.status !== "Erledigt" && frappe.datetime.get_diff(frm.doc.faellig, frappe.datetime.get_today()) < 0) frm.dashboard.set_headline_alert(__("Überfällig seit {0}", [frappe.datetime.str_to_user(frm.doc.faellig)]), "red");
	},
});
