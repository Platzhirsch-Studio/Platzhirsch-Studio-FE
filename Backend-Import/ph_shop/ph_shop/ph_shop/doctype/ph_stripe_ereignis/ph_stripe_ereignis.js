// PH Stripe Ereignis – erneut verarbeiten, Bezug öffnen.
frappe.ui.form.on("PH Stripe Ereignis", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { empfangen: "blue", verarbeitet: "green", ignoriert: "gray", fehler: "red", wiederholt: "orange" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.doc.fehler) frm.dashboard.set_headline_alert(frappe.utils.escape_html(frm.doc.fehler).slice(0, 300), "red");
		if (frm.is_new()) return;
		if (["fehler", "ignoriert"].includes(frm.doc.status) && frm.doc.payload_json) {
			frm.add_custom_button(__("Erneut verarbeiten"), () => frappe.confirm(__("Ereignis {0} erneut verarbeiten?", [frm.doc.name]), () => frm.call({ method: "erneut_verarbeiten", doc: frm.doc, freeze: true }).then((r) => { frappe.show_alert({ message: __("Ergebnis: {0}", [r.message]), indicator: "green" }); frm.reload_doc(); })), __("Aktionen"));
		}
		if (frm.doc.bezug_doctype && frm.doc.bezug) frm.add_custom_button(__("Bezug öffnen"), () => frappe.set_route("Form", frm.doc.bezug_doctype, frm.doc.bezug));
		if (frm.doc.name.startsWith("evt_")) {
			const live = frm.doc.livemode ? "" : "test/";
			frm.add_custom_button(__("In Stripe öffnen"), () => window.open(`https://dashboard.stripe.com/${live}events/${frm.doc.name}`, "_blank"));
		}
	},
});
