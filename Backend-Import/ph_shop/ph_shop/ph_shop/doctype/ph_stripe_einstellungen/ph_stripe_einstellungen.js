// PH Stripe Einstellungen – Schlüssel-Vorhandensein prüfen (nie Werte), Webhook-URL anzeigen.
frappe.ui.form.on("PH Stripe Einstellungen", {
	refresh(frm) {
		const url = `${window.location.origin}${frm.doc.webhook_pfad || "/api/method/ph_shop.api.stripe.webhook"}`;
		frm.dashboard.set_headline_alert(__("Webhook-URL für das Stripe-Dashboard: <code>{0}</code>", [url]), "blue");
		frm.add_custom_button(__("Schlüssel prüfen"), () => frm.call({ method: "pruefen", doc: frm.doc, freeze: true }).then((r) => {
			const m = r.message || {};
			const z = (ok) => (ok ? "✓" : "✗");
			frappe.msgprint({ title: __("Stripe-Konfiguration"), message: `${z(m.secret_key)} ph_stripe_secret_key<br>${z(m.webhook_secret)} ph_stripe_webhook_secret<br>${z(m.livemode)} ph_stripe_livemode<br>${z(m.paket)} Python-Paket stripe`, indicator: m.secret_key && m.webhook_secret ? "green" : "orange" });
			frm.reload_doc();
		}), __("Aktionen"));
		frm.add_custom_button(__("Ereignisse"), () => frappe.set_route("List", "PH Stripe Ereignis"));
		frm.add_custom_button(__("Report Stripe-Abgleich"), () => frappe.set_route("query-report", "PH Stripe Abgleich"));
		if (frm.doc.simulation) frm.dashboard.add_indicator(__("Simulation aktiv – keine Stripe-Aufrufe"), "orange");
		if (frm.doc.testmodus) frm.dashboard.add_indicator(__("Testmodus"), "blue");
	},
});
