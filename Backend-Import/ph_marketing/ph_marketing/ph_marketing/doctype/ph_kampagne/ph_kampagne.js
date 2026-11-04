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
