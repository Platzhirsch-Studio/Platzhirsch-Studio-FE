// PH Eingangsrechnung – Buttons: Prüfen, Freigeben (Leitung), Ablehnen, Als bezahlt buchen, Zurück an Erfassung.
frappe.ui.form.on("PH Eingangsrechnung", {
	refresh(frm) {
		ph_faktura.indicator(frm);
		if (frm.is_new()) return;
		const leitung = frappe.user.has_role(["PH Faktura Leitung", "PH Geschäftsführung", "System Manager"]);
		if (frm.doc.status === "Erfasst") {
			frm.add_custom_button(__("Sachlich prüfen"), () => {
				frappe.prompt([{ fieldname: "vermerk", fieldtype: "Small Text", label: __("Prüfvermerk (Menge/Preis gegen Bestellung)") }], (v) => frm.call({ method: "pruefen", doc: frm.doc, args: v }).then((r) => { if (r.message) frappe.msgprint(__("Abweichung: {0}", [r.message])); frm.reload_doc(); }), __("Sachliche Prüfung"), __("Geprüft"));
			}, __("Aktionen"));
		}
		if (["Erfasst", "Sachlich geprueft"].includes(frm.doc.status) && leitung) {
			frm.add_custom_button(__("Freigeben"), () => frm.call({ method: "freigeben", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (["Erfasst", "Sachlich geprueft", "Freigegeben"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Ablehnen"), () => frappe.prompt([{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }], (v) => frm.call({ method: "ablehnen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Ablehnen"), __("Ablehnen")), __("Aktionen"));
		}
		if (frm.doc.belegart === "Gutschrift" && ["Freigegeben", "Bezahlt"].includes(frm.doc.status)) {
			if (frm.doc.lieferantenregress && !frm.doc.regress_gebucht) frm.add_custom_button(__("Im Regress erfassen"), () => frm.call({ method: "regress_erfassen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
			if (frm.doc.lieferantenregress) frm.add_custom_button(__("Regress öffnen"), () => frappe.set_route("Form", "PH Lieferantenregress", frm.doc.lieferantenregress));
			if (frm.doc.status === "Freigegeben") frm.add_custom_button(__("Als verrechnet buchen"), () => frm.call({ method: "als_verrechnet_buchen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (frm.doc.status === "Freigegeben" && frm.doc.belegart !== "Gutschrift") {
			frm.add_custom_button(__("Als bezahlt buchen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Zahlung an Lieferant"),
					fields: [
						{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent)"), default: frm.doc.zahlbetrag_cent || frm.doc.brutto_cent, reqd: 1, description: frm.doc.skonto_cent ? __("Skonto {0} bis {1}", [ph_faktura.betrag(frm.doc.skonto_cent), frappe.datetime.str_to_user(frm.doc.skonto_bis)]) : "" },
						{ fieldname: "kanal", fieldtype: "Select", label: __("Kanal"), options: ["Ueberweisung", "Bar", "Karte extern"], default: "Ueberweisung", reqd: 1 },
						{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), default: frappe.datetime.get_today(), reqd: 1 },
					],
					primary_action_label: __("Buchen"),
					primary_action: (v) => frm.call({ method: "als_bezahlt_buchen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); }),
				});
				d.show();
			}, __("Aktionen"));
			frm.add_custom_button(__("Zurück an Erfassung"), () => frm.call({ method: "zurueck_an_erfassung", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		ph_er_kostenzuordnung(frm, leitung);
		frm.add_custom_button(__("Zahllauf-Vorschlag"), () => frappe.set_route("query-report", "PH Zahllauf Vorschlag"));
		if (frm.doc.herstellerbestellung) frm.add_custom_button(__("Herstellerbestellung öffnen"), () => frappe.set_route("Form", "PH Herstellerbestellung", frm.doc.herstellerbestellung));
	},
	netto_cent: brutto, ust_cent: brutto, ust_fall: brutto,
});
function brutto(frm) {
	if (frm.doc.ust_fall !== "Vorsteuer AT" && frm.doc.ust_fall !== "Einfuhr Drittland") frm.set_value("ust_cent", 0);
	frm.set_value("brutto_cent", (frm.doc.netto_cent || 0) + (frm.doc.ust_cent || 0));
}

// ── Kostenzuordnung (Projektnachkalkulation): Vorschlag, Umbuchen nach Freigabe, Statusanzeige ─────────────
function ph_er_kostenzuordnung(frm, leitung) {
	const offen = ["Erfasst", "Sachlich geprueft"].includes(frm.doc.status);
	if (offen) {
		frm.add_custom_button(__("Zuordnung vorschlagen"), () => frm.call({ method: "zuordnung_vorschlagen", doc: frm.doc }).then(() => { frm.refresh_fields(); frm.dirty(); frappe.show_alert({ message: __("Vorschlag übernommen – bitte prüfen und speichern."), indicator: "blue" }); }), __("Kostenzuordnung"));
		frm.add_custom_button(__("Nicht zugeordnete Rechnungen"), () => frappe.set_route("query-report", "PH Nicht zugeordnete Eingangsrechnungen"), __("Kostenzuordnung"));
	}
	if (["Freigegeben", "Bezahlt"].includes(frm.doc.status) && (leitung || frappe.user.has_role("PH Projekte Leitung"))) {
		frm.add_custom_button(__("Umbuchen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Kostenzuordnung umbuchen"),
				size: "extra-large",
				fields: [
					{ fieldname: "modus", fieldtype: "Select", label: __("Zuordnung"), options: ["Ganz einem Projekt", "Nach Positionen", "Aliquot", "Gemeinkosten"], default: frm.doc.zuordnung_modus || "Aliquot", reqd: 1 },
					{ fieldname: "projekt", fieldtype: "Link", options: "PH Projekt", label: __("Projekt"), default: frm.doc.projekt, depends_on: "eval:doc.modus=='Ganz einem Projekt'" },
					{ fieldname: "kostenart", fieldtype: "Link", options: "PH Kostenart", label: __("Kostenart"), default: frm.doc.kostenart, depends_on: "eval:doc.modus=='Ganz einem Projekt'" },
					{
						fieldname: "zeilen", fieldtype: "Table", label: __("Zeilen"), depends_on: "eval:doc.modus=='Aliquot'||doc.modus=='Nach Positionen'",
						data: (frm.doc.zuordnung || []).map((z) => ({ projekt: z.projekt, kostenart: z.kostenart, prozent: z.prozent, betrag_cent: z.betrag_cent, belegposition: z.belegposition, bemerkung: z.bemerkung })),
						fields: [
							{ fieldname: "projekt", fieldtype: "Link", options: "PH Projekt", label: __("Projekt"), in_list_view: 1 },
							{ fieldname: "kostenart", fieldtype: "Link", options: "PH Kostenart", label: __("Kostenart"), in_list_view: 1 },
							{ fieldname: "prozent", fieldtype: "Percent", label: __("%"), in_list_view: 1 },
							{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent)"), in_list_view: 1 },
							{ fieldname: "belegposition", fieldtype: "Int", label: __("Pos."), in_list_view: 1 },
							{ fieldname: "bemerkung", fieldtype: "Data", label: __("Bemerkung"), in_list_view: 1 },
						],
					},
					{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund der Umbuchung"), reqd: 1 },
				],
				primary_action_label: __("Umbuchen"),
				primary_action(v) {
					frm.call({ method: "zuordnung_umbuchen", doc: frm.doc, args: { modus: v.modus, zeilen: v.zeilen || [], grund: v.grund, projekt: v.projekt, kostenart: v.kostenart }, freeze: true })
						.then((r) => { d.hide(); frappe.show_alert({ message: frappe.utils.escape_html(r.message || ""), indicator: "green" }); frm.reload_doc(); });
				},
			});
			d.show();
		}, __("Kostenzuordnung"));
	}
	if (frm.doc.zuordnung_status === "Offen" && frm.doc.status !== "Abgelehnt") {
		frm.dashboard.set_headline(__("Kostenzuordnung offen: {0} nicht zugeordnet – Pflicht vor der Freigabe.", [format_currency((frm.doc.zuordnung_differenz_cent || frm.doc.netto_cent || 0) / 100, "EUR")]), "orange");
	} else if (frm.doc.budget_hinweis) {
		frm.dashboard.set_headline(frappe.utils.escape_html(frm.doc.budget_hinweis), "orange");
	}
}
