// PH Fremdgewerk – Status setzen (erlaubte Übergänge), Termin anlegen, Haftungshinweis.
frappe.ui.form.on("PH Fremdgewerk", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "gray", Angefragt: "blue", Geplant: "cyan", "In Arbeit": "orange", Erledigt: "green", Abgesagt: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		const folge = { Offen: ["Angefragt", "Geplant", "Abgesagt"], Angefragt: ["Geplant", "Offen", "Abgesagt"], Geplant: ["In Arbeit", "Angefragt", "Abgesagt"], "In Arbeit": ["Erledigt", "Geplant"], Erledigt: ["In Arbeit"], Abgesagt: ["Offen"] };
		(folge[frm.doc.status] || []).forEach((s) => {
			frm.add_custom_button(__(s), () => frm.call({ method: "status_setzen", doc: frm.doc, args: { status: s } }).then(() => frm.reload_doc()), __("Status setzen"));
		});
		if (!frm.doc.termin) frm.add_custom_button(__("Termin anlegen (PH Termin)"), () => frm.call({ method: "termin_anlegen", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
		frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
		frm.dashboard.set_headline_alert(__("Nur Terminkoordination – kein Bauleitungs- oder Haftungsverhältnis."), "blue");
	},
});
