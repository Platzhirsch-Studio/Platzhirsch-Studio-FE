frappe.ui.form.on("PH Lieferantenregress", {
	refresh(frm) {
		const f = { Offen: "blue", Gemeldet: "orange", Anerkannt: "cyan", Abgelehnt: "red", Verrechnet: "green" };
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), f[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (["Gemeldet", "Anerkannt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Lieferant erinnern"), () => frappe.prompt({ fieldname: "empfaenger", fieldtype: "Data", options: "Email", label: __("E-Mail (leer = Bestell-E-Mail)") }, (v) => frm.call({ method: "erinnern", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Erinnern")), __("Aktionen"));
		}
		const callR = (method, args) => frm.call({ method, doc: frm.doc, args, freeze: true }).then((r) => { frm.reload_doc(); return r; });
		if (!["Verrechnet", "Abgelehnt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Kosten aus Servicefall übernehmen"), () => callR("kosten_uebernehmen", { ersetzen: 1 }).then((r) => frappe.show_alert(__("Forderung {0} €", [((r.message.betrag_gefordert_cent || 0) / 100).toFixed(2)]))), __("Belastung"));
			frm.add_custom_button(frm.doc.belastung_gesendet_am ? __("Belastungsanzeige erneut senden") : __("Belastungsanzeige senden"), () => frappe.prompt([{ fieldname: "empfaenger", fieldtype: "Data", options: "Email", label: __("E-Mail (leer = Bestell-E-Mail)") }, { fieldname: "zusatz", fieldtype: "Small Text", label: __("Zusatz") }], (v) => frappe.confirm(__("Belastungsanzeige über {0} € an den Lieferanten senden?", [((frm.doc.betrag_gefordert_cent || 0) / 100).toFixed(2)]), () => callR("belastung_senden", v)), __("Belastungsanzeige")), __("Belastung"));
		}
		if (["Gemeldet", "Anerkannt"].includes(frm.doc.status) && frm.doc.zahlungsfrist_bis) {
			frm.add_custom_button(__("Mahnen (Stufe {0})", [(frm.doc.mahnstufe || 0) + 1]), () => frappe.confirm(__("Mahnung an den Lieferanten senden?"), () => callR("mahnen")), __("Belastung"));
			if (frm.doc.mahnung_faellig) frm.dashboard.add_comment(__("Gutschriftfrist {0} überschritten – Mahnung fällig.", [frappe.datetime.str_to_user(frm.doc.zahlungsfrist_bis)]), "red", true);
		}
		if (!frm.doc.abgeholt_am && !["Abgelehnt"].includes(frm.doc.status)) {
			frm.add_custom_button(frm.doc.abholung_angefordert_am ? __("Abholung anmahnen") : __("Abholaufforderung senden"), () => frappe.prompt([{ fieldname: "lagerplatz", fieldtype: "Data", label: __("Lagerplatz"), default: frm.doc.ruecksendung_lagerplatz }, { fieldname: "frist_tage", fieldtype: "Int", label: __("Frist (Tage)"), default: 14 }], (v) => callR("abholung_anfordern", v), __("Rücksendung an den Hersteller")), __("Rücksendung"));
			if (frm.doc.abholung_angefordert_am) frm.add_custom_button(__("Abgeholt"), () => callR("abholung_bestaetigen"), __("Rücksendung"));
		}
		frm.add_custom_button(__("Belastungsanzeige (PDF)"), () => frm.print_doc("PH Lieferantenregress Belastungsanzeige"), __("Drucken"));
		if (["Gemeldet", "Anerkannt", "Verrechnet"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Gutschrift erfassen"), () => {

				const offen = (frm.doc.betrag_anerkannt_cent || frm.doc.betrag_gefordert_cent || 0) - (frm.doc.betrag_erhalten_cent || 0);
				const d = new frappe.ui.Dialog({
					title: __("Gutschrift des Lieferanten erfassen"),
					fields: [
						{ fieldname: "betrag", fieldtype: "Currency", options: "EUR", label: __("Betrag (€)"), reqd: 1, default: Math.max(0, offen) / 100 },
						{ fieldname: "nummer", fieldtype: "Data", label: __("Gutschrift-Nr.") },
						{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), default: frappe.datetime.get_today() },
						{ fieldname: "beleg", fieldtype: "Attach", label: __("Beleg") },
					],
					primary_action_label: __("Erfassen"),
					primary_action(v) {
						frm.call({ method: "gutschrift_erfassen", doc: frm.doc, args: { betrag_cent: Math.round(v.betrag * 100), nummer: v.nummer, datum: v.datum, beleg: v.beleg }, freeze: true }).then((r) => {
							d.hide();
							frappe.show_alert({ message: __("Abgleich: {0}", [__(r.message.abgleich_status)]), indicator: r.message.abgleich_status === "Ausgeglichen" ? "green" : "orange" });
							frm.reload_doc();
						});
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		if (frm.doc.abgleich_status === "Unterdeckung" && frappe.user.has_role(["PH Service Leitung", "PH Geschäftsführung", "System Manager"])) {
			frm.add_custom_button(__("Differenz ausbuchen"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }, (v) => frm.call({ method: "differenz_ausbuchen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Differenz {0} € ausbuchen", [((frm.doc.differenz_cent || 0) / 100).toFixed(2)])), __("Aktionen"));
		}
		if (["Unterdeckung", "Ueberdeckung"].includes(frm.doc.abgleich_status)) frm.dashboard.add_comment(__("Gutschrift weicht um {0} € vom anerkannten Betrag ab.", [((frm.doc.differenz_cent || 0) / 100).toFixed(2)]), "orange", true);
		frm.add_custom_button(__("Servicefall öffnen"), () => frappe.set_route("Form", "PH Servicefall", frm.doc.servicefall));

		frm.add_custom_button(__("Reklamationsmeldung (PDF)"), () => frappe.set_route("print", "PH Servicefall", frm.doc.servicefall), __("Drucken"));
		if (frm.doc.frist_bis && frappe.datetime.get_diff(frm.doc.frist_bis, frappe.datetime.get_today()) < 0 && ["Offen"].includes(frm.doc.status)) frm.dashboard.set_headline_alert(__("Regressfrist (§ 933b ABGB) abgelaufen – Meldung dennoch versuchen, Kulanz des Herstellers."), "red");
		else if (frm.doc.frist_hinweis) frm.dashboard.set_headline_alert(frappe.utils.escape_html(frm.doc.frist_hinweis), "blue");
	},
});
