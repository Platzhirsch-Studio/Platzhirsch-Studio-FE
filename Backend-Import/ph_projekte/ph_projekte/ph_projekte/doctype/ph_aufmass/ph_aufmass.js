// PH Aufmass – Erfassen, Prüfen, Räume ins Projekt, Planung anlegen, Protokoll.
frappe.ui.form.on("PH Aufmass", {
	refresh(frm) {
		const farben = { Entwurf: "gray", Erfasst: "blue", Geprueft: "green" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.doc.plausibilitaet) frm.dashboard.set_headline_alert(frappe.utils.escape_html(frm.doc.plausibilitaet).replace(/\n/g, "<br>"), "orange");
		if (frm.is_new()) return;
		const rufe = (method, args) => frm.call({ method, doc: frm.doc, args: args || {}, freeze: true }).then(() => frm.reload_doc());
		if (frm.doc.status === "Entwurf") frm.add_custom_button(__("Als erfasst melden"), () => rufe("erfasst_melden"), __("Aktionen"));
		if (frm.doc.status !== "Geprueft") frm.add_custom_button(__("Prüfen"), () => rufe("pruefen"), __("Aktionen"));
		if (frm.doc.status !== "Entwurf") frm.add_custom_button(__("Zurück auf Entwurf"), () => frappe.confirm(__("Aufmaß wieder bearbeiten?"), () => rufe("zuruecksetzen")), __("Aktionen"));
		frm.add_custom_button(__("Räume ins Projekt"), () => {
			frm.call({ method: "raeume_ins_projekt", doc: frm.doc, freeze: true }).then((r) => frappe.show_alert({ message: __("{0} Räume übernommen", [r.message || 0]), indicator: "green" }));
		}, __("Aktionen"));
		frm.add_custom_button(__("Planung anlegen"), () => {
			frm.call({ method: "planung_anlegen", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Planung", r.message));
		}, __("Aktionen"));
		frm.add_custom_button(__("Protokoll PDF"), () => {
			window.open(`/api/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent(frm.doctype)}&name=${encodeURIComponent(frm.doc.name)}&format=${encodeURIComponent("PH Aufmass Protokoll")}&no_letterhead=1`);
		}, __("Aktionen"));
		frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
	},
});

frappe.ui.form.on("PH Aufmass Raum", {
	laenge_mm(frm, cdt, cdn) { flaeche(frm, cdt, cdn); },
	breite_mm(frm, cdt, cdn) { flaeche(frm, cdt, cdn); },
});

function flaeche(frm, cdt, cdn) {
	const r = locals[cdt][cdn];
	const l = parseInt(r.laenge_mm || 0, 10);
	const b = parseInt(r.breite_mm || 0, 10);
	frappe.model.set_value(cdt, cdn, "flaeche_m2", l > 0 && b > 0 ? Math.round((l * b) / 10000) / 100 : 0);
}
