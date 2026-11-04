// PH Planung – Versionen, Kunden vorlegen, Freigeben, Positionen ins Projekt.
frappe.ui.form.on("PH Planung", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Entwurf: "gray", "Kunde vorgelegt": "orange", Freigegeben: "green", Verworfen: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.status === "Entwurf") frm.add_custom_button(__("Kunden vorlegen"), () => frm.call({ method: "kunden_vorlegen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		if (["Entwurf", "Kunde vorgelegt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Freigeben"), () => {
				frappe.confirm(__("Planung freigeben? (Kundenfreigabe liegt vor)"), () => frm.call({ method: "freigeben", doc: frm.doc, args: { durch_kunde: 1 } }).then(() => frm.reload_doc()));
			}, __("Aktionen"));
			frm.add_custom_button(__("Verwerfen"), () => frm.call({ method: "verwerfen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		frm.add_custom_button(__("Neue Version"), () => frm.call({ method: "neue_version", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Planung", r.message)), __("Aktionen"));
		if ((frm.doc.positionen || []).length) frm.add_custom_button(__("Positionen ins Projekt"), () => frm.call({ method: "positionen_ins_projekt", doc: frm.doc, freeze: true }).then((r) => frappe.show_alert({ message: __("{0} Positionen übernommen", [r.message]), indicator: "green" })), __("Aktionen"));
		frm.add_custom_button(__("Rendering anlegen"), () => frappe.new_doc("PH Rendering", { projekt: frm.doc.projekt, planung: frm.doc.name, bezeichnung: frm.doc.bezeichnung }), __("Neu"));
		frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
		if (frm.doc.vorschau) frm.dashboard.add_section(`<img src="${frappe.utils.escape_html(frm.doc.vorschau)}" style="max-width:100%;max-height:320px;border-radius:8px" alt="">`, __("Vorschau"));
	},
	quelle_planung(frm) {
		if (["Handskizze", "Modell"].includes(frm.doc.quelle_planung)) frappe.show_alert({ message: __("Handskizze/Modell: bitte „Echtes Original“ bestätigen."), indicator: "orange" });
	},
});
