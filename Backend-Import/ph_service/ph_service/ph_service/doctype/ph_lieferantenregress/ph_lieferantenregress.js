frappe.ui.form.on("PH Lieferantenregress", {
	refresh(frm) {
		const f = { Offen: "blue", Gemeldet: "orange", Anerkannt: "cyan", Abgelehnt: "red", Verrechnet: "green" };
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), f[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (["Gemeldet", "Anerkannt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Lieferant erinnern"), () => frappe.prompt({ fieldname: "empfaenger", fieldtype: "Data", options: "Email", label: __("E-Mail (leer = Bestell-E-Mail)") }, (v) => frm.call({ method: "erinnern", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Erinnern")), __("Aktionen"));
		}
		frm.add_custom_button(__("Servicefall öffnen"), () => frappe.set_route("Form", "PH Servicefall", frm.doc.servicefall));
		frm.add_custom_button(__("Reklamationsmeldung (PDF)"), () => frappe.set_route("print", "PH Servicefall", frm.doc.servicefall), __("Drucken"));
		if (frm.doc.frist_bis && frappe.datetime.get_diff(frm.doc.frist_bis, frappe.datetime.get_today()) < 0 && ["Offen"].includes(frm.doc.status)) frm.dashboard.set_headline_alert(__("Regressfrist (§ 933b ABGB) abgelaufen – Meldung dennoch versuchen, Kulanz des Herstellers."), "red");
		else if (frm.doc.frist_hinweis) frm.dashboard.set_headline_alert(frappe.utils.escape_html(frm.doc.frist_hinweis), "blue");
	},
});
