// PH Zeiterfassung – Netto-Vorschau, Button „Gehen (jetzt)“, Mitarbeiter-Vorbelegung im Selbstservice.
frappe.ui.form.on("PH Zeiterfassung", {
	onload(frm) {
		if (frm.is_new() && !frm.doc.mitarbeiter) {
			frappe.db.get_value("PH Mitarbeiter", { user: frappe.session.user }, "name").then((r) => {
				if (r.message && r.message.name) frm.set_value("mitarbeiter", r.message.name);
			});
		}
		if (frm.is_new() && !frm.doc.datum) frm.set_value("datum", frappe.datetime.get_today());
	},
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "orange", Erfasst: "green", Korrigiert: "blue" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (!frm.doc.gehen) {
			frm.add_custom_button(__("Gehen (jetzt)"), () => {
				frm.call({ method: "gehen_jetzt", doc: frm.doc, freeze: true }).then(() => frm.reload_doc());
			}).addClass("btn-primary");
		}
		frm.add_custom_button(__("Mitarbeiter öffnen"), () => frappe.set_route("Form", "PH Mitarbeiter", frm.doc.mitarbeiter));
	},
	kommen: vorschau,
	gehen: vorschau,
	pause_min: vorschau,
});

function vorschau(frm) {
	if (!frm.doc.kommen || !frm.doc.gehen) { frm.set_value("dauer_text", ""); return; }
	const min = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
	const netto = Math.max(0, min(frm.doc.gehen) - min(frm.doc.kommen) - (frm.doc.pause_min || 0));
	frm.set_value("dauer_text", `${Math.floor(netto / 60)}:${String(netto % 60).padStart(2, "0")}`);
	if (netto > 600) frm.dashboard.set_headline_alert(__("Mehr als 10 Stunden netto – Arbeitszeitgesetz prüfen."), "orange");
}
