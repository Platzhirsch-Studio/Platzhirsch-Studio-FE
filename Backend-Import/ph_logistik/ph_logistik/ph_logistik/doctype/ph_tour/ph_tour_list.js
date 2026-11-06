frappe.listview_settings["PH Tour"] = {
	add_fields: ["status", "datum", "fahrer", "anzahl_stopps", "anzahl_erledigt"],
	filters: [["status", "in", ["Geplant", "Freigegeben", "Unterwegs"]]],
	get_indicator(doc) {
		const farben = { Geplant: "blue", Freigegeben: "cyan", Unterwegs: "orange", Abgeschlossen: "green", Abgebrochen: "gray" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Tour heute (mobil)"), () => frappe.set_route("ph-tour"));
		listview.page.add_inner_button(__("Liefertermin vorschlagen"), () => ph_logistik_liefertermin_dialog());
	},
};

// Liefertermin-Generator: Bedarf eingeben → Vorschläge über alle Fahrzeuge → Vorschlag als Stopp einplanen.
function ph_logistik_liefertermin_dialog() {
	const d = new frappe.ui.Dialog({
		title: __("Liefertermin vorschlagen"),
		fields: [
			{ fieldname: "lieferschein", fieldtype: "Link", options: "PH Lieferschein", label: __("Lieferschein") },
			{ fieldname: "plz", fieldtype: "Data", label: __("PLZ (Region)") },
			{ fieldname: "ab", fieldtype: "Date", label: __("Frühestens (Ware komplett)") },
			{ fieldname: "cb1", fieldtype: "Column Break" },
			{ fieldname: "dauer_min", fieldtype: "Int", label: __("Liefer-/Abladezeit (min)"), default: 30, reqd: 1 },
			{ fieldname: "montage_min", fieldtype: "Int", label: __("Montagezeit (min)"), default: 0 },
			{ fieldname: "monteure", fieldtype: "Int", label: __("Monteure"), default: 2 },
			{ fieldname: "gewicht_kg", fieldtype: "Float", label: __("Gewicht (kg)") },
			{ fieldname: "volumen_m3", fieldtype: "Float", label: __("Volumen (m³)") },
		],
		primary_action_label: __("Vorschläge holen"),
		primary_action(v) {
			frappe.call({
				method: "ph_logistik.ph_logistik.doctype.ph_tour.ph_tour.liefertermine_vorschlagen",
				args: { dauer_min: v.dauer_min, montage_min: v.montage_min, plz: v.plz, ab: v.ab, monteure: v.monteure, gewicht_g: Math.round((v.gewicht_kg || 0) * 1000), volumen_m3: v.volumen_m3 || 0, anzahl: 8 },
			}).then((r) => {
				const vs = r.message || [];
				if (!vs.length) return frappe.msgprint(__("Kein freier Termin im Planungszeitraum."));
				d.hide();
				const w = new frappe.ui.Dialog({
					title: __("Terminvorschläge"),
					fields: [{ fieldname: "wahl", fieldtype: "Select", label: __("Vorschlag"), reqd: 1, options: vs.map((x, i) => ({ value: String(i), label: `${frappe.datetime.str_to_user(x.datum)} ${x.von}–${x.bis} · ${x.fahrzeug} · ${__(x.grund)}` })) }],
					primary_action_label: __("Einplanen"),
					primary_action(w2) {
						w.hide();
						frappe.call({
							method: "ph_logistik.ph_logistik.doctype.ph_tour.ph_tour.stopp_einplanen",
							args: { vorschlag: vs[Number(w2.wahl)], lieferschein: v.lieferschein, dauer_min: v.dauer_min, montage_min: v.montage_min, plz: v.lieferschein ? null : v.plz },
						}).then((r2) => r2.message && frappe.set_route("Form", "PH Tour", r2.message.tour));
					},
				});
				w.show();
			});
		},
	});
	d.show();
}
