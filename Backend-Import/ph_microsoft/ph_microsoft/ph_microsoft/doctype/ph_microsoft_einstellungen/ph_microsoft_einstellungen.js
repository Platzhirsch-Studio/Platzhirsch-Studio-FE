// PH Microsoft Einstellungen – Verbindung testen, Abos prüfen (Server-Methoden, nie Token im Browser).
frappe.ui.form.on("PH Microsoft Einstellungen", {
	refresh(frm) {
		frm.add_custom_button(__("Verbindung testen"), () => {
			frm.call({ method: "verbindung_testen", doc: frm.doc }).then((r) => {
				const m = r.message || {};
				frappe.msgprint({ title: __("Microsoft Graph"), indicator: m.ok ? "green" : "red", message: frappe.utils.escape_html(m.meldung || "") });
			});
		}, __("Aktionen"));
		frm.add_custom_button(__("Webhook-Abos jetzt prüfen"), () => {
			frm.call({ method: "abos_pruefen", doc: frm.doc }).then(() => frappe.show_alert({ message: __("Abo-Prüfung eingereiht"), indicator: "blue" }));
		}, __("Aktionen"));
	},
});
