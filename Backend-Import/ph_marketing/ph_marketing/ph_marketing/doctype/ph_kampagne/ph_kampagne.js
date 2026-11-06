// PH Kampagne – Buttons: Kennzahl erfassen, Anfragen dieser Kampagne, Anfragen zählen, Auswertung, Bericht drucken.
frappe.ui.form.on("PH Kampagne", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Entwurf: "gray", Aktiv: "green", Pausiert: "orange", Beendet: "blue" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.budget_cent && frm.doc.ausgaben_cent > frm.doc.budget_cent) frm.dashboard.set_headline_alert(__("Budget überschritten."), "red");

		frm.add_custom_button(__("Kennzahl erfassen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Kennzahl erfassen"),
				fields: [
					{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), default: frappe.datetime.get_today(), reqd: 1 },
					{ fieldname: "impressionen", fieldtype: "Int", label: __("Impressionen") },
					{ fieldname: "klicks", fieldtype: "Int", label: __("Klicks") },
					{ fieldname: "kosten_cent", fieldtype: "Int", label: __("Kosten (Cent)") },
					{ fieldname: "anfragen", fieldtype: "Int", label: __("Anfragen (manuell, nur ohne UTM-Zuordnung)") },
					{ fieldname: "notiz", fieldtype: "Data", label: __("Notiz") },
				],
				primary_action_label: __("Speichern"),
				primary_action(v) {
					frm.call({ method: "kennzahl_erfassen", doc: frm.doc, args: v }).then(() => { d.hide(); frm.reload_doc(); });
				},
			});
			d.show();
		}, __("Aktionen"));
		frm.add_custom_button(__("Anfragen dieser Kampagne"), () => frappe.set_route("List", "PH Anfrage", { ph_marketing_kampagne: frm.doc.name }), __("Aktionen"));
		frm.add_custom_button(__("Anfragen zählen"), () => frm.call({ method: "anfragen_zaehlen", doc: frm.doc }).then((r) => { frappe.show_alert({ message: __("{0} Anfragen", [r.message]), indicator: "blue" }); frm.reload_doc(); }), __("Aktionen"));
		frm.add_custom_button(__("Auswertung"), () => {
			frm.call({ method: "auswertung", doc: frm.doc }).then((r) => {
				const a = r.message || {};
				const cent = (c) => format_currency((c || 0) / 100, "EUR");
				frappe.msgprint({
					title: __("Auswertung {0}", [frappe.utils.escape_html(frm.doc.titel)]),
					message: `<table class="table table-sm"><tbody>
						<tr><td>${__("Ausgaben / Budget")}</td><td>${cent(frm.doc.ausgaben_cent)} / ${cent(frm.doc.budget_cent)} (${__("Rest")} ${cent(a.budget_rest_cent)})</td></tr>
						<tr><td>${__("Impressionen / Klicks")}</td><td>${frm.doc.impressionen_gesamt || 0} / ${frm.doc.klicks_gesamt || 0} (${(frm.doc.klickrate_promille || 0) / 10} %)</td></tr>
						<tr><td>${__("Anfragen / gewonnen")}</td><td>${(a.anfragen || []).length} / ${a.gewonnen || 0}</td></tr>
						<tr><td>${__("Kosten je Anfrage")}</td><td>${cent(frm.doc.kosten_je_anfrage_cent)}</td></tr>
						<tr><td>${__("Beiträge / Newsletter / Events")}</td><td>${a.beitraege || 0} / ${a.newsletter || 0} / ${(a.events || []).length}</td></tr>
					</tbody></table>`,
				});
			});
		}, __("Aktionen"));
		frm.add_custom_button(__("Kampagnenbericht drucken"), () => frappe.set_route("print", frm.doctype, frm.doc.name), __("Aktionen"));
	},
});

// Lücken 04.11.: Attribution (Umsatz/ROI) und CSV-Import der Plattform-Kennzahlen
frappe.ui.form.on("PH Kampagne", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Attribution berechnen"), () => frm.call({ method: "attribution_berechnen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		frm.add_custom_button(__("Kennzahlen aus CSV"), () => {
			const d = new frappe.ui.Dialog({
				title: __("CSV-Export (Meta, Google, Pinterest)"),
				fields: [{ fieldname: "csv_text", fieldtype: "Code", label: __("CSV-Inhalt einfügen"), reqd: 1 }, { fieldname: "vorschau", fieldtype: "HTML" }],
				primary_action_label: __("Prüfen"),
				primary_action(v) {
					frm.call({ method: "kennzahlen_import", doc: frm.doc, args: { csv_text: v.csv_text, vorschau: 1 } }).then((r) => {
						const m = r.message || {};
						if (m.fehler && m.fehler.length) {
							d.fields_dict.vorschau.$wrapper.html(m.fehler.map((f) => frappe.utils.escape_html(f)).join("<br>"));
							return;
						}
						frappe.confirm(__("{0} Zeilen, Kosten {1} € übernehmen?", [m.anzahl, (m.kosten_cent / 100).toFixed(2)]), () => {
							frm.call({ method: "kennzahlen_import", doc: frm.doc, args: { csv_text: v.csv_text, vorschau: 0 } }).then(() => { d.hide(); frm.reload_doc(); });
						});
					});
				},
			});
			d.show();
		}, __("Aktionen"));
	},
});
