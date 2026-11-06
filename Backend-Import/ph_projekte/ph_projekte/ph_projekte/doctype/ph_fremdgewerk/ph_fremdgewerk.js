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
		frm.add_custom_button(__("Termin hinzufügen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Termin des Gewerks"),
				fields: [
					{ fieldname: "art", fieldtype: "Select", label: __("Art"), options: "Aufmass
Vorinstallation
Montage
Nacharbeit
Abnahme", default: "Montage", reqd: 1 },
					{ fieldname: "von", fieldtype: "Datetime", label: __("Von"), reqd: 1 },
					{ fieldname: "bis", fieldtype: "Datetime", label: __("Bis") },
					{ fieldname: "notiz", fieldtype: "Data", label: __("Notiz") },
				],
				primary_action_label: __("Hinzufügen"),
				primary_action(v) { frm.call({ method: "termin_hinzufuegen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); }); },
			});
			d.show();
		}, __("Aktionen"));
		if (["Geplant", "In Arbeit", "Erledigt"].includes(frm.doc.status)) frm.add_custom_button(__("Leistung abnehmen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Abnahme der Fremdleistung"),
				fields: [
					{ fieldname: "ergebnis", fieldtype: "Select", label: __("Ergebnis"), options: [{ value: "abgenommen", label: __("abgenommen") }, { value: "mit Maengeln", label: __("mit Mängeln") }, { value: "verweigert", label: __("verweigert") }], reqd: 1, default: "abgenommen" },
					{ fieldname: "notiz", fieldtype: "Small Text", label: __("Notiz") },
					{ fieldname: "maengel", fieldtype: "Table", label: __("Mängel"), fields: [
						{ fieldname: "beschreibung", fieldtype: "Data", label: __("Mangel"), in_list_view: 1 },
						{ fieldname: "frist", fieldtype: "Date", label: __("Frist"), in_list_view: 1 },
					], data: [] },
				],
				primary_action_label: __("Abnehmen"),
				primary_action(v) { frm.call({ method: "abnehmen", doc: frm.doc, args: { ergebnis: v.ergebnis, notiz: v.notiz, maengel: v.maengel || [] }, freeze: true }).then(() => { d.hide(); frm.reload_doc(); }); },
			});
			d.show();
		}, __("Aktionen"));
		frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
		if (frm.doc.abhaengigkeit_hinweis) frm.dashboard.add_comment(frappe.utils.escape_html(frm.doc.abhaengigkeit_hinweis), "orange", true);
		frm.dashboard.set_headline_alert(__("Nur Terminkoordination – kein Bauleitungs- oder Haftungsverhältnis."), "blue");
	},
});
