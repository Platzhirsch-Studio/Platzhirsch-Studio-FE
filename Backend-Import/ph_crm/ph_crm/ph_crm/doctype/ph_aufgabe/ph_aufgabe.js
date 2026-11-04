// PH Aufgabe – Schnellaktionen: In Arbeit, Erledigt (mit Ergebnis), Verwerfen, Verschieben, Vorgang öffnen.
frappe.ui.form.on("PH Aufgabe", {
	setup(frm) {
		frm.set_query("referenz_doctype", () => ({ filters: { name: ["in", ["PH Anfrage", "PH Kontakt", "PH Termin", "PH Beratungsgespraech", "PH Projekt", "PH Bestellung", "PH Angebot", "PH Auftragsbestaetigung", "PH Rechnung", "PH Servicefall"]] } }));
		frm.set_query("zugewiesen_an", () => ({ filters: { enabled: 1, user_type: "System User" } }));
	},

	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "orange", "In Arbeit": "blue", Erledigt: "green", Verworfen: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (["Offen", "In Arbeit"].includes(frm.doc.status) && frm.doc.faellig && frm.doc.faellig < frappe.datetime.get_today()) {
			frm.dashboard.set_headline_alert(__("Überfällig seit {0}", [frappe.datetime.str_to_user(frm.doc.faellig)]), "red");
		}
		if (frm.is_new()) {
			if (!frm.doc.faellig) frm.set_value("faellig", frappe.datetime.add_days(frappe.datetime.get_today(), 1));
			return;
		}
		const setze = (status, ergebnis) => frm.call({ method: "status_setzen", doc: frm.doc, args: { status, ergebnis } }).then(() => frm.reload_doc());
		if (frm.doc.status === "Offen") frm.add_custom_button(__("In Arbeit"), () => setze("In Arbeit"), __("Aktionen"));
		if (["Offen", "In Arbeit"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Erledigt"), () => {
				frappe.prompt({ fieldname: "ergebnis", fieldtype: "Small Text", label: __("Ergebnis (optional)") }, (v) => setze("Erledigt", v.ergebnis), __("Aufgabe erledigen"));
			}, __("Aktionen"));
			frm.add_custom_button(__("Verwerfen"), () => frappe.confirm(__("Aufgabe verwerfen?"), () => setze("Verworfen")), __("Aktionen"));
			frm.add_custom_button(__("Um 1 Tag verschieben"), () => frm.call({ method: "verschieben", doc: frm.doc, args: { tage: 1 } }).then(() => frm.reload_doc()), __("Aktionen"));
			frm.add_custom_button(__("Um 1 Woche verschieben"), () => frm.call({ method: "verschieben", doc: frm.doc, args: { tage: 7 } }).then(() => frm.reload_doc()), __("Aktionen"));
		} else {
			frm.add_custom_button(__("Wieder öffnen"), () => setze("Offen"), __("Aktionen"));
		}
		if (frm.doc.referenz_doctype && frm.doc.referenz_name) {
			frm.add_custom_button(__("Vorgang öffnen"), () => frappe.set_route("Form", frm.doc.referenz_doctype, frm.doc.referenz_name));
		}
		if (frm.doc.kontakt) frm.add_custom_button(__("Kontakt öffnen"), () => frappe.set_route("Form", "PH Kontakt", frm.doc.kontakt));
	},
});
