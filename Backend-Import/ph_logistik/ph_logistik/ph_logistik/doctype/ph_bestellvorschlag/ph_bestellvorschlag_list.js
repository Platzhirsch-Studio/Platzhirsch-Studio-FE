// Liste: Standardfilter offen; Button „Herstellerbestellung aus Vorschlägen“ (ausgewählte bzw. alle offenen → ph_sortiment.api.bestellungen_sammeln).
frappe.listview_settings["PH Bestellvorschlag"] = {
	add_fields: ["status"],
	filters: [["status", "=", "Offen"]],
	get_indicator(doc) {
		const farben = { Offen: "orange", Bestellt: "blue", Erledigt: "green", Verworfen: "gray" };
		return [__(doc.status), farben[doc.status] || "gray", "status,=," + doc.status];
	},
	onload(listview) {
		if (!frappe.user.has_role(["PH Logistik Leitung", "PH Backoffice-Admin", "System Manager"])) return;
		listview.page.add_inner_button(__("Herstellerbestellung aus Vorschlägen"), async () => {
			let namen = listview.get_checked_items(true);
			if (!namen.length) namen = (await frappe.db.get_list("PH Bestellvorschlag", { filters: { status: "Offen" }, pluck: "name", limit: 500 })) || [];
			if (!namen.length) return frappe.msgprint(__("Keine offenen Vorschläge."));
			frappe.confirm(__("{0} Vorschläge als Herstellerbestellungs-Entwürfe (je Lieferant) anlegen?", [namen.length]), () =>
				frappe.call({ method: "ph_logistik.ph_logistik.nachbestellung.bestellungen_aus_vorschlaegen", args: { namen }, freeze: true }).then((r) => {
					const m = r.message || {};
					const hb = (m.bestellungen || []).map((b) => b.name).join(", ");
					frappe.msgprint(__("Entwürfe: {0}<br>Ohne Lieferant: {1}", [frappe.utils.escape_html(hb || "–"), frappe.utils.escape_html((m.ohne_lieferant || []).join(", ") || "–")]));
					listview.refresh();
				}));
		});
	},
};
