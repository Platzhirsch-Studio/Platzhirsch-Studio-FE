// PH Stripe Auszahlung – Abgleich Payout ↔ PH Zahlung.
frappe.ui.form.on("PH Stripe Auszahlung", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { angekuendigt: "blue", unterwegs: "orange", bezahlt: "green", fehlgeschlagen: "red", storniert: "gray", abgeglichen: "green" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.doc.abgeglichen_am && frm.doc.differenz_cent) frm.dashboard.set_headline_alert(__("Differenz {0} zwischen Auszahlung und gebuchten Zahlungen.", [format_currency(frm.doc.differenz_cent / 100, "EUR")]), "red");
		if (frm.is_new()) return;
		frm.add_custom_button(__("Abgleichen"), () => frm.call({ method: "abgleichen", doc: frm.doc, freeze: true }).then((r) => {
			const m = r.message || {};
			frappe.show_alert({ message: __("{0} Transaktionen, Differenz {1}{2}", [m.zeilen, format_currency((m.differenz_cent || 0) / 100, "EUR"), m.simuliert ? " (simuliert)" : ""]), indicator: m.differenz_cent ? "orange" : "green" });
			frm.reload_doc();
		}), __("Aktionen"));
		frm.add_custom_button(__("Report Stripe-Abgleich"), () => frappe.set_route("query-report", "PH Stripe Abgleich"));
		const live = frm.doc.livemode ? "" : "test/";
		frm.add_custom_button(__("In Stripe öffnen"), () => window.open(`https://dashboard.stripe.com/${live}payouts/${frm.doc.name}`, "_blank"));
	},
});
