// PH Anzahlung – Zahlungslink senden, doppelte Zahlung erstatten.
const FARBEN_AZ = { offen: "blue", zahlung_ausstehend: "orange", bezahlt: "green", fehlgeschlagen: "red", abgelaufen: "gray", doppelt: "pink", erstattet: "gray", teilerstattet: "orange", pruefen: "pink" };

frappe.ui.form.on("PH Anzahlung", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), FARBEN_AZ[frm.doc.status] || "gray");
		if (frm.doc.status === "doppelt") frm.dashboard.set_headline_alert(__("Doppelte Zahlung eingegangen – bitte erstatten."), "red");
		if (frm.is_new()) return;
		if (["offen", "fehlgeschlagen", "zahlung_ausstehend"].includes(frm.doc.status) && frm.doc.kunde_email) {
			frm.add_custom_button(__("Zahlungslink senden"), () => frm.call({ method: "link_senden", doc: frm.doc, freeze: true }).then(() => { frappe.show_alert({ message: __("Link gesendet"), indicator: "green" }); frm.reload_doc(); }), __("Aktionen"));
		}
		const offenDoppelt = (frm.doc.doppelt || []).some((d) => (d.erstattet_cent || 0) < (d.betrag_cent || 0));
		if (offenDoppelt && frappe.user.has_role(["PH Shop Leitung", "PH Geschäftsführung", "System Manager"])) {
			frm.add_custom_button(__("Doppelte Zahlung erstatten"), () => frappe.confirm(__("Alle offenen doppelten Zahlungen erstatten?"), () => frm.call({ method: "doppelte_erstatten", doc: frm.doc, freeze: true }).then(() => frm.reload_doc())), __("Aktionen"));
		}
		if (frm.doc.zahlung) frm.add_custom_button(__("Zahlung öffnen"), () => frappe.set_route("Form", "PH Zahlung", frm.doc.zahlung));
		if (frm.doc.payment_intent) {
			const live = frm.doc.livemode ? "" : "test/";
			frm.add_custom_button(__("In Stripe öffnen"), () => window.open(`https://dashboard.stripe.com/${live}payments/${frm.doc.payment_intent}`, "_blank"));
		}
		frm.dashboard.add_indicator(__("Betrag {0}", [format_currency((frm.doc.betrag_cent || 0) / 100, "EUR")]), frm.doc.bezahlt_am ? "green" : "blue");
	},
});
