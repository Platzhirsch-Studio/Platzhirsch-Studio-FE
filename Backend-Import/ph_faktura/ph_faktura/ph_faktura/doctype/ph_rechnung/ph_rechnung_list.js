frappe.listview_settings["PH Rechnung"] = {
	add_fields: ["status", "art", "zahlbar_cent", "offen_cent", "faellig", "mahnstufe"],
	filters: [["status", "in", ["Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt"]]],
	get_indicator(doc) {
		const label = ph_faktura.status_label[doc.status] || doc.status;
		return [__(label), ph_faktura.farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: { zahlbar_cent: (v) => ph_faktura.betrag(v), offen_cent: (v) => ph_faktura.betrag(v) },
	onload(listview) {
		listview.page.add_inner_button(__("Mahnlauf (Vorschlag)"), () => {
			frappe.call({ method: "ph_faktura.ph_faktura.doctype.ph_mahnwesen_einstellungen.ph_mahnwesen_einstellungen.mahnlauf_starten", args: { nur_vorschlag: 1 }, freeze: true }).then((r) => {
				const rows = r.message || [];
				frappe.msgprint({ title: __("Mahnvorschlag"), message: rows.length ? "<ul>" + rows.map((x) => `<li>${x.rechnung}: ${__("Stufe")} ${x.stufe}, ${ph_faktura.betrag(x.offen_cent)}, ${x.verzugstage} ${__("Tage")}</li>`).join("") + "</ul>" : __("Nichts zu mahnen.") });
			});
		});
	},
};
