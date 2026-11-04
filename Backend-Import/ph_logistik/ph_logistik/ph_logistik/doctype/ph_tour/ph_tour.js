// PH Tour – Buttons: Stopps hinzufügen (Dialog Datum/Region), Reihenfolge optimieren (PLZ), Freigeben, Starten,
// Tourenblatt drucken, Mobil öffnen („Tour heute“), Abschließen, Abbrechen.
const TOUR_FARBEN = { Geplant: "blue", Freigegeben: "cyan", Unterwegs: "orange", Abgeschlossen: "green", Abgebrochen: "gray" };

frappe.ui.form.on("PH Tour", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), TOUR_FARBEN[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		const st = frm.doc.status;
		if (["Geplant", "Freigegeben"].includes(st)) {
			frm.add_custom_button(__("Stopps hinzufügen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Lieferscheine als Stopps"),
					fields: [
						{ fieldname: "datum_von", fieldtype: "Date", label: __("Wunschtermin von"), default: frm.doc.datum },
						{ fieldname: "datum_bis", fieldtype: "Date", label: __("Wunschtermin bis"), default: frm.doc.datum },
						{ fieldname: "plz_prefix", fieldtype: "Data", label: __("PLZ beginnt mit (Region)") },
						{ fieldname: "lieferscheine", fieldtype: "MultiSelectList", label: __("oder bestimmte Lieferscheine"), get_data: (txt) => frappe.db.get_link_options("PH Lieferschein", txt, { lieferart: ["in", ["Eigenlieferung", "Spedition"]], status: ["in", ["Entwurf", "Gepackt"]] }) },
					],
					primary_action_label: __("Hinzufügen"),
					primary_action(v) {
						d.hide();
						frm.call({ method: "stopps_hinzufuegen", doc: frm.doc, args: { lieferscheine: v.lieferscheine || [], datum_von: v.datum_von, datum_bis: v.datum_bis, plz_prefix: v.plz_prefix }, freeze: true }).then((r) => { frappe.show_alert({ message: __("{0} Stopp(s) hinzugefügt", [r.message]), indicator: "green" }); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
			frm.add_custom_button(__("Reihenfolge optimieren (PLZ)"), () => frm.call({ method: "reihenfolge_optimieren", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (st === "Geplant") frm.add_custom_button(__("Freigeben"), () => frm.call({ method: "freigeben", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		if (["Geplant", "Freigegeben"].includes(st)) {
			frm.add_custom_button(__("Tour starten"), () => frappe.prompt({ fieldname: "km_start", fieldtype: "Int", label: __("km-Stand Start") }, (v) => frm.call({ method: "starten", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Start")), __("Aktionen"));
		}
		if (st === "Unterwegs") {
			frm.add_custom_button(__("Abschließen"), () => frappe.prompt({ fieldname: "km_ende", fieldtype: "Int", label: __("km-Stand Ende") }, (v) => frm.call({ method: "abschliessen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Abschluss")), __("Aktionen"));
		}
		if (!["Abgeschlossen", "Abgebrochen"].includes(st)) {
			frm.add_custom_button(__("Abbrechen"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund") }, (v) => frappe.confirm(__("Tour abbrechen?"), () => frm.call({ method: "abbrechen", doc: frm.doc, args: v }).then(() => frm.reload_doc())), __("Abbruch")), __("Aktionen"));
		}
		frm.add_custom_button(__("Mobil öffnen (Tour heute)"), () => frappe.set_route("ph-tour", { tour: frm.doc.name }), __("Aktionen"));
		frm.add_custom_button(__("Tourenblatt drucken"), () => frappe.utils.print(frm.doctype, frm.docname, "PH Tour Tourenblatt", frm.doc.letter_head, "de"), __("Drucken"));
		if (frm.doc.route_url) frm.add_custom_button(__("Route in Google Maps"), () => window.open(frm.doc.route_url, "_blank"));
		frm.dashboard.add_indicator(__("{0} / {1} Stopps erledigt", [frm.doc.anzahl_erledigt || 0, frm.doc.anzahl_stopps || 0]), frm.doc.anzahl_erledigt === frm.doc.anzahl_stopps && frm.doc.anzahl_stopps ? "green" : "orange");
	},
});
