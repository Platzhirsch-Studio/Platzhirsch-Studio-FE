// PH Abwesenheit – Selbstservice-Vorbelegung, Buttons „Stornieren“, „Früher zurück“ (Leitung), Konto-Hinweis.
// Tage rechnet der Server (Arbeitszeitmodell + Feiertage); die Vorschau hier ist nur eine Mo–Fr-Schätzung.
frappe.ui.form.on("PH Abwesenheit", {
	onload(frm) {
		if (frm.is_new() && !frm.doc.mitarbeiter) {
			frappe.db.get_value("PH Mitarbeiter", { user: frappe.session.user }, "name").then((r) => {
				if (r.message && r.message.name) frm.set_value("mitarbeiter", r.message.name);
			});
		}
	},
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Beantragt: "orange", Genehmigt: "green", Abgelehnt: "red", Storniert: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.doc.art === "Urlaub" && frm.doc.urlaub_rest < 0) frm.dashboard.set_headline_alert(__("Urlaubskonto wird um {0} Tage überschritten.", [Math.abs(frm.doc.urlaub_rest)]), "red");
		if (frm.doc.urlaub_verjaehrung) frm.dashboard.add_comment(__("Ältester Resturlaub verjährt am {0} (§ 4 Abs 5 UrlG).", [frappe.datetime.str_to_user(frm.doc.urlaub_verjaehrung)]), "blue", true);
		if (frm.is_new()) return;
		if (["Beantragt", "Genehmigt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Stornieren"), () => {
				frappe.confirm(__("Abwesenheit stornieren?"), () => frm.call({ method: "stornieren", doc: frm.doc }).then(() => frm.reload_doc()));
			}, __("Aktionen"));
		}
		if (frm.doc.status === "Genehmigt" && frappe.user.has_role("PH Personal Leitung")) {
			frm.add_custom_button(__("Früher zurück …"), () => {
				frappe.prompt({ fieldname: "neues_bis", fieldtype: "Date", label: __("Letzter Abwesenheitstag"), reqd: 1 },
					(v) => frm.call({ method: "verkuerzen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Abwesenheit verkürzen"));
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Mitarbeiter öffnen"), () => frappe.set_route("Form", "PH Mitarbeiter", frm.doc.mitarbeiter));
		frm.add_custom_button(__("Kalender"), () => frappe.set_route("List", "PH Abwesenheit", "Calendar", "default"));
	},
	von(frm) {
		if (frm.doc.von && (!frm.doc.bis || frm.doc.bis < frm.doc.von)) frm.set_value("bis", frm.doc.von);
		tageVorschau(frm);
	},
	bis: tageVorschau,
	halbtags: tageVorschau,
});

function tageVorschau(frm) {
	if (!frm.doc.von || !frm.doc.bis) return;
	if (frm.doc.halbtags) { frm.set_value("tage", 0.5); return; }
	let d = frappe.datetime.str_to_obj(frm.doc.von);
	const ende = frappe.datetime.str_to_obj(frm.doc.bis);
	let tage = 0;
	while (d <= ende) { if (d.getDay() !== 0 && d.getDay() !== 6) tage += 1; d.setDate(d.getDate() + 1); }
	frm.set_value("tage", tage);
}
