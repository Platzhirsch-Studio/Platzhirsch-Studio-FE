// PH Bewerbungsgespräch – Buttons: Kalender, Durchgeführt (Ergebnis), Bewerbung öffnen.
frappe.ui.form.on("PH Bewerbungsgespraech", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Geplant: "blue", Durchgefuehrt: "green", Abgesagt: "gray", "Nicht erschienen": "red" };
		const label = { Durchgefuehrt: "Durchgeführt" };
		if (frm.doc.status) frm.page.set_indicator(__(label[frm.doc.status] || frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		frm.add_custom_button(__("Bewerbung öffnen"), () => frappe.set_route("Form", "PH Bewerbung", frm.doc.bewerbung));

		if (frm.doc.status === "Geplant") {
			if (!frm.doc.kalender_event) {
				frm.add_custom_button(__("In Kalender eintragen"), () => {
					frm.call({ method: "kalender_eintragen", doc: frm.doc, freeze: true }).then(() => frm.reload_doc());
				}, __("Aktionen"));
			} else {
				frm.add_custom_button(__("Kalendereintrag öffnen"), () => frappe.set_route("Form", "Event", frm.doc.kalender_event), __("Aktionen"));
			}
			frm.add_custom_button(__("Durchgeführt"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Gespräch abschließen"),
					fields: [
						{ fieldname: "ergebnis", fieldtype: "Select", label: __("Ergebnis"), options: ["Offen", "Weiter im Verfahren", "Angebot", "Absage"], default: "Offen", reqd: 1 },
						{ fieldname: "naechster_schritt", fieldtype: "Data", label: __("Nächster Schritt") },
					],
					primary_action_label: __("Speichern"),
					primary_action(values) {
						frm.call({ method: "abschliessen", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
		}
	},
	start: endeBerechnen,
	dauer_min: endeBerechnen,
});

function endeBerechnen(frm) {
	if (frm.doc.start && frm.doc.dauer_min) frm.set_value("ende", frappe.datetime.add_minutes(frm.doc.start, frm.doc.dauer_min));
}
