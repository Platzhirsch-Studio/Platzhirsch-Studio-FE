// PH Gutschein Bestellung – Codes erneut senden, erstatten, Verknüpfungen.
const FARBEN_GB = { offen: "blue", zahlung_ausstehend: "orange", bezahlt: "green", fehlgeschlagen: "red", abgelaufen: "gray", erstattet: "gray", teilerstattet: "orange", widerrufen: "red", pruefen: "pink" };

frappe.ui.form.on("PH Gutschein Bestellung", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), FARBEN_GB[frm.doc.status] || "gray");
		if (frm.doc.status === "pruefen") frm.dashboard.set_headline_alert(__("Betrag/Währung weicht von Stripe ab – keine Codes erzeugt."), "red");
		if (frm.is_new()) return;
		const leitung = frappe.user.has_role(["PH Shop Leitung", "PH Geschäftsführung", "System Manager"]);
		if (frm.doc.gutscheine && frm.doc.gutscheine.length) frm.add_custom_button(__("Gutschein-Mail erneut senden"), () => frm.call({ method: "codes_erneut_senden", doc: frm.doc, freeze: true }).then(() => { frappe.show_alert({ message: __("Gesendet"), indicator: "green" }); frm.reload_doc(); }), __("Aktionen"));
		if (leitung && frm.doc.zahlung && ["bezahlt", "teilerstattet", "widerrufen", "pruefen"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Erstatten"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Erstatten"),
					fields: [
						{ fieldname: "grund", fieldtype: "Select", label: __("Grund"), options: ["Widerruf", "Storno", "Kulanz", "Doppelte Zahlung", "Sonstiges"], reqd: 1 },
						{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent, leer = voll)") },
					],
					primary_action_label: __("Erstatten"),
					primary_action(v) {
						d.hide();
						frappe.confirm(__("Zahlung erstatten? Ungenutzte Gutscheine werden gesperrt."), () => frm.call({ method: "erstatten", doc: frm.doc, args: v, freeze: true }).then(() => frm.reload_doc()));
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		if (frm.doc.zahlung) frm.add_custom_button(__("Zahlung öffnen"), () => frappe.set_route("Form", "PH Zahlung", frm.doc.zahlung));
		if (frm.doc.payment_intent) {
			const live = frm.doc.livemode ? "" : "test/";
			frm.add_custom_button(__("In Stripe öffnen"), () => window.open(`https://dashboard.stripe.com/${live}payments/${frm.doc.payment_intent}`, "_blank"));
		}
		if (frm.doc.widerruf) frm.add_custom_button(__("Widerruf öffnen"), () => frappe.set_route("Form", "PH Widerruf", frm.doc.widerruf));
	},
	betrag_cent(frm) { frm.set_value("summe_cent", (frm.doc.betrag_cent || 0) * (frm.doc.anzahl || 1)); },
	anzahl(frm) { frm.set_value("summe_cent", (frm.doc.betrag_cent || 0) * (frm.doc.anzahl || 1)); },
});
