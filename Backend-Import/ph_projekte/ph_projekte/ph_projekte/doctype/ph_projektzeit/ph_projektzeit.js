// PH Projektzeit – Dauer aus Von/Bis, Abrechnen (Leitung).
frappe.ui.form.on("PH Projektzeit", {
	onload(frm) {
		if (frm.is_new()) {
			if (!frm.doc.user) frm.set_value("user", frappe.session.user);
			if (!frm.doc.datum) frm.set_value("datum", frappe.datetime.get_today());
		}
	},
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "blue", Abgerechnet: "green", "Nicht abrechenbar": "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.status === "Offen" && (frappe.user.has_role("PH Projekte Leitung") || frappe.user.has_role("System Manager"))) {
			frm.add_custom_button(__("Als abgerechnet markieren"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Abgerechnet"),
					fields: [{ fieldname: "beleg_ref", fieldtype: "Data", label: __("Rechnungsnummer") }],
					primary_action_label: __("Speichern"),
					primary_action(values) {
						frm.call({ method: "als_abgerechnet", doc: frm.doc, args: values }).then(() => { d.hide(); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
	},
	start(frm) { ph_zeit_dauer(frm); },
	ende(frm) { ph_zeit_dauer(frm); },
});

function ph_zeit_dauer(frm) {
	if (!frm.doc.start || !frm.doc.ende) return;
	const s = moment(frm.doc.start, "HH:mm:ss"), e = moment(frm.doc.ende, "HH:mm:ss");
	let min = e.diff(s, "minutes");
	if (min < 0) min += 24 * 60;
	frm.set_value("dauer_min", min);
}
