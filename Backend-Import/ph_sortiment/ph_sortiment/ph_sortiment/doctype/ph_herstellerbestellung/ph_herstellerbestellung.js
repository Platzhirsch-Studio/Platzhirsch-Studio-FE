// PH Herstellerbestellung – Buttons: Senden, AB einlesen, AB-Abgleich, Wareneingang, Export; Abweichungen farbig.
const HB_FARBEN = { Entwurf: "gray", Gesendet: "blue", "AB erhalten": "cyan", "AB geprueft": "purple", Teilgeliefert: "orange", Geliefert: "green", Abgeschlossen: "green", Storniert: "red" };

frappe.ui.form.on("PH Herstellerbestellung", {
	setup(frm) {
		frm.set_query("produkt", "positionen", () => ({ filters: frm.doc.marke ? { marke: frm.doc.marke } : {} }));
		frm.set_query("ausfuehrung", "positionen", (doc, cdt, cdn) => ({ filters: { produkt: locals[cdt][cdn].produkt || "" } }));
		frm.set_query("bezug_doctype", () => ({ filters: { name: ["in", ["PH Auftragsbestaetigung", "PH Projekt", "PH Bestellung", "PH Anfrage", "PH Servicefall"]] } }));
	},

	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), HB_FARBEN[frm.doc.status] || "gray");
		frm.dashboard.clear_headline();
		if (frm.is_new()) return;

		if (frm.doc.abweichungen_offen) frm.dashboard.set_headline_alert(__("{0} AB-Abweichungen offen – bitte bewerten (Tab Auftragsbestätigung).", [frm.doc.abweichungen_offen]), "orange");
		else if (frm.doc.abweichungen_anzahl) frm.dashboard.add_indicator(__("{0} Abweichungen bewertet", [frm.doc.abweichungen_anzahl]), "green");
		if (frm.doc.status === "Gesendet" && frm.doc.gesendet_am && frappe.datetime.get_diff(frappe.datetime.get_today(), frm.doc.gesendet_am) > 5) frm.dashboard.add_indicator(__("AB ausständig seit {0} Tagen", [frappe.datetime.get_diff(frappe.datetime.get_today(), frm.doc.gesendet_am)]), "red");
		if (frm.doc.menge_bestellt) frm.dashboard.add_progress(__("Geliefert"), (100 * (frm.doc.menge_erhalten || 0)) / frm.doc.menge_bestellt);

		if (frm.doc.status === "Entwurf" || frm.doc.status === "Gesendet") {
			frm.add_custom_button(__("Per E-Mail senden"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Bestellung senden"),
					fields: [
						{ fieldname: "empfaenger", fieldtype: "Data", label: __("Empfänger"), options: "Email", default: frm.doc.gesendet_an },
						{ fieldname: "nachricht", fieldtype: "Small Text", label: __("Nachricht (leer = Standardtext)") },
					],
					primary_action_label: __("Senden (PDF anhängen)"),
					primary_action(v) {
						frm.call({ method: "per_email_senden", doc: frm.doc, args: v, freeze: true, freeze_message: __("PDF wird erzeugt und gesendet …") }).then((r) => {
							d.hide();
							frappe.show_alert({ message: __("Gesendet an {0}", [r.message]), indicator: "green" });
							frm.reload_doc();
						});
					},
				});
				d.show();
			}, __("Aktionen"));
		}

		if (["Gesendet", "AB erhalten", "AB geprueft"].includes(frm.doc.status)) {
			frm.add_custom_button(__("AB einlesen"), () => ab_dialog(frm), __("Aktionen"));
			frm.add_custom_button(__("AB-Abgleich erzeugen"), () => {
				frm.call({ method: "ab_abgleich_erzeugen", doc: frm.doc, freeze: true }).then((r) => {
					frappe.show_alert({ message: __("{0} Abweichungen, {1} offen", [r.message.abweichungen, r.message.offen]), indicator: r.message.abweichungen ? "orange" : "green" });
					frm.reload_doc();
				});
			}, __("Aktionen"));
		}

		if (["Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Wareneingang anlegen"), () => {
				frm.call({ method: "wareneingang_anlegen", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Wareneingang", r.message));
			}, __("Aktionen"));
		}

		frm.add_custom_button(__("Als IWOfurn/pCon exportieren"), () => {
			frm.call({ method: "export_schnittstelle", doc: frm.doc, args: { format: "csv" } }).then((r) => {
				if (r.message) window.open(r.message, "_blank");
				frm.reload_doc();
			});
		}, __("Aktionen"));

		frm.add_custom_button(__("Wareneingänge"), () => frappe.set_route("List", "PH Wareneingang", { herstellerbestellung: frm.doc.name }), __("Ansehen"));
		if (frm.doc.ab_datei) frm.add_custom_button(__("AB-Datei"), () => window.open(frm.doc.ab_datei, "_blank"), __("Ansehen"));
	},

	lieferant(frm) {
		if (!frm.doc.lieferant) return;
		frappe.db.get_value("PH Lieferant", frm.doc.lieferant, ["bestell_email", "bestellweg", "marke", "lieferzeit_wochen_standard"]).then((r) => {
			const v = r.message || {};
			if (!frm.doc.gesendet_an) frm.set_value("gesendet_an", v.bestell_email);
			if (!frm.doc.bestellweg) frm.set_value("bestellweg", v.bestellweg);
			if (!frm.doc.marke) frm.set_value("marke", v.marke);
			if (!frm.doc.wunschtermin && v.lieferzeit_wochen_standard) frm.set_value("wunschtermin", frappe.datetime.add_days(frappe.datetime.get_today(), 7 * v.lieferzeit_wochen_standard));
		});
	},
});

frappe.ui.form.on("PH Herstellerbestellung Position", {
	produkt(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		if (!row.produkt) return;
		frappe.db.get_value("PH Produkt", row.produkt, ["titel", "hersteller_artikelnr", "aktueller_preis_cent", "einkaufspreis_cent"]).then((r) => {
			const v = r.message || {};
			frappe.model.set_value(cdt, cdn, { bezeichnung: v.titel, hersteller_artikelnr: v.hersteller_artikelnr, vk_cent: v.aktueller_preis_cent || row.vk_cent, ek_cent: v.einkaufspreis_cent || row.ek_cent });
		});
	},
});

frappe.ui.form.on("PH AB Abgleich", {
	bewertung(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		if (row.bewertung === "abgelehnt" && !frappe.user.has_role(["PH Sortiment Leitung", "PH Geschäftsführung", "System Manager"])) {
			frappe.msgprint(__("Ablehnen darf nur die Leitung."));
			frappe.model.set_value(cdt, cdn, "bewertung", "pruefen");
		}
	},
});

function ab_dialog(frm) {
	const felder = [
		{ fieldname: "ab_nummer", fieldtype: "Data", label: __("AB-Nummer"), reqd: 1, default: frm.doc.ab_nummer },
		{ fieldname: "ab_datum", fieldtype: "Date", label: __("AB-Datum"), reqd: 1, default: frm.doc.ab_datum || frappe.datetime.get_today() },
		{ fieldname: "ab_datei", fieldtype: "Attach", label: __("AB-Datei (PDF)") },
		{ fieldname: "sb", fieldtype: "Section Break", label: __("Bestätigte Werte je Position (leer = wie bestellt)") },
		{
			fieldname: "positionen",
			fieldtype: "Table",
			label: __("Positionen"),
			cannot_add_rows: true,
			cannot_delete_rows: true,
			in_place_edit: true,
			data: (frm.doc.positionen || []).map((p) => ({ idx: p.idx, bezeichnung: p.bezeichnung, menge: p.menge, ab_menge: p.ab_menge, ab_ek_eur: p.ab_ek_cent ? p.ab_ek_cent / 100 : null, bestaetigter_termin: p.bestaetigter_termin || p.wunschtermin, ab_artikelnr: p.ab_artikelnr || p.hersteller_artikelnr })),
			fields: [
				{ fieldname: "idx", fieldtype: "Int", label: __("Pos."), in_list_view: 1, read_only: 1, columns: 1 },
				{ fieldname: "bezeichnung", fieldtype: "Data", label: __("Bezeichnung"), in_list_view: 1, read_only: 1, columns: 3 },
				{ fieldname: "menge", fieldtype: "Int", label: __("Bestellt"), in_list_view: 1, read_only: 1, columns: 1 },
				{ fieldname: "ab_menge", fieldtype: "Int", label: __("AB Menge"), in_list_view: 1, columns: 1 },
				{ fieldname: "ab_ek_eur", fieldtype: "Currency", label: __("AB EK (EUR)"), in_list_view: 1, columns: 2, options: "EUR" },
				{ fieldname: "bestaetigter_termin", fieldtype: "Date", label: __("AB Termin"), in_list_view: 1, columns: 2 },
				{ fieldname: "ab_artikelnr", fieldtype: "Data", label: __("AB Artikelnr."), columns: 2 },
			],
		},
	];
	const d = new frappe.ui.Dialog({
		title: __("Auftragsbestätigung einlesen"),
		size: "extra-large",
		fields: felder,
		primary_action_label: __("Übernehmen und abgleichen"),
		primary_action(v) {
			const positionen = (v.positionen || []).map((z) => ({ idx: z.idx, ab_menge: z.ab_menge, ab_ek_cent: z.ab_ek_eur != null && z.ab_ek_eur !== "" ? Math.round(flt(z.ab_ek_eur) * 100) : null, bestaetigter_termin: z.bestaetigter_termin, ab_artikelnr: z.ab_artikelnr }));
			frm.call({ method: "ab_einlesen", doc: frm.doc, args: { ab_nummer: v.ab_nummer, ab_datum: v.ab_datum, ab_datei: v.ab_datei, positionen }, freeze: true }).then((r) => {
				d.hide();
				frappe.show_alert({ message: __("AB erfasst, {0} Abweichungen", [r.message.abweichungen]), indicator: r.message.abweichungen ? "orange" : "green" });
				frm.reload_doc();
			});
		},
	});
	d.show();
}
