// PH Inventur – Buttons: Zählliste erzeugen, Zählung starten, Freigeben (Leitung), Verwerfen, Zählliste drucken.
frappe.ui.form.on("PH Inventur", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Geplant: "blue", Laufend: "orange", Abgeschlossen: "green", Verworfen: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.status === "Geplant") {
			frm.add_custom_button(__("Zählliste erzeugen"), () => frm.call({ method: "zaehlliste_erzeugen", doc: frm.doc, freeze: true }).then((r) => { frappe.show_alert({ message: __("{0} Positionen", [r.message]), indicator: "green" }); frm.reload_doc(); }), __("Aktionen"));
			frm.add_custom_button(__("Zählung starten"), () => frm.call({ method: "starten", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
			if (frm.doc.inventur_art !== "Stichtag") {
				frm.add_custom_button(__("Nächste Plätze vorschlagen"), () => frappe.prompt({ fieldname: "anzahl", fieldtype: "Int", label: __("Anzahl Plätze (leer = Einstellung)") },
					(v) => frm.call({ method: "plaetze_vorschlagen", doc: frm.doc, args: v }).then((r) => { frappe.show_alert({ message: __("Plätze: {0}", [frappe.utils.escape_html((r.message || []).join(", "))]), indicator: "green" }); frm.reload_doc(); }),
					__("Teilinventur")), __("Aktionen"));
			}
		}
		frm.add_custom_button(__("Abdeckung je Platz"), () => frappe.set_route("query-report", "PH Inventur Abdeckung", { lagerort: frm.doc.lagerort }), __("Berichte"));
		if (frm.doc.status === "Abgeschlossen") frm.add_custom_button(__("Bewertung zum Stichtag"), () => frappe.set_route("query-report", "PH Inventurbewertung", { stichtag: frm.doc.datum, lagerort: frm.doc.lagerort }), __("Berichte"));
		if (frm.doc.status === "Laufend") {
			frm.add_custom_button(__("Scan zählen"), () => {
				frappe.prompt([{ fieldname: "lagerbestand", fieldtype: "Link", options: "PH Lagerbestand", label: __("Bestand (QR/Scan)"), reqd: 1 }, { fieldname: "ist", fieldtype: "Int", label: __("Gezählt"), default: 1, reqd: 1 }], (v) => frm.call({ method: "zaehlen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Zählen"));
			}, __("Aktionen"));
			frm.add_custom_button(__("Stückscan (+1)"), () => {
				frappe.prompt([{ fieldname: "code", fieldtype: "Data", label: __("Bestand-QR, Seriennummer oder EAN"), reqd: 1 }, { fieldname: "anzahl", fieldtype: "Int", label: __("Anzahl"), default: 1 }], (v) => frm.call({ method: "zaehlen_plus", doc: frm.doc, args: v }).then((r) => {
					frappe.show_alert({ message: __("Ist {0} / Soll {1}", [r.message.ist, r.message.soll]), indicator: r.message.differenz ? "orange" : "green" });
					frm.reload_doc();
				}), __("Zählen"));
			}, __("Aktionen"));
			frm.add_custom_button(__("Als Fund erfassen"), () => {
				frappe.prompt([
					{ fieldname: "lagerbestand", fieldtype: "Link", options: "PH Lagerbestand", label: __("Bestand (falls vorhanden)") },
					{ fieldname: "produkt", fieldtype: "Link", options: "PH Produkt", label: __("oder Produkt") },
					{ fieldname: "ist", fieldtype: "Int", label: __("Gezählt"), default: 1, reqd: 1 },
					{ fieldname: "platz", fieldtype: "Data", label: __("Platz") },
					{ fieldname: "seriennummer", fieldtype: "Data", label: __("Seriennummer") },
					{ fieldname: "bemerkung", fieldtype: "Data", label: __("Bemerkung") },
				], (v) => frm.call({ method: "position_hinzufuegen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Fund"));
			}, __("Aktionen"));
			if (frappe.user.has_role(["PH Logistik Leitung", "System Manager", "PH Backoffice-Admin"])) {
				frm.add_custom_button(__("Freigeben und Differenzen buchen"), () => frappe.confirm(__("{0} Positionen mit Differenz werden als Inventur-Bewegungen gebucht. Fortfahren?", [frm.doc.differenz_positionen || 0]), () => frm.call({ method: "freigeben", doc: frm.doc, freeze: true }).then(() => frm.reload_doc())), __("Aktionen"));
			}
		}
		if (!["Abgeschlossen", "Verworfen"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Verwerfen"), () => frappe.confirm(__("Inventur verwerfen?"), () => frm.call({ method: "verwerfen", doc: frm.doc }).then(() => frm.reload_doc())), __("Aktionen"));
		}
		frm.add_custom_button(__("Zählliste drucken"), () => frappe.utils.print(frm.doctype, frm.docname, "PH Inventur Zaehlliste", frm.doc.letter_head, "de"), __("Drucken"));
		if (frm.doc.differenz_positionen) frm.dashboard.add_indicator(__("{0} Differenzen ({1} Stück)", [frm.doc.differenz_positionen, frm.doc.differenz_summe]), "red");
	},
});

frappe.ui.form.on("PH Inventur Position", {
	ist(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		row.gezaehlt = 1;
		row.differenz = (row.ist || 0) - (row.soll || 0);
		frm.refresh_field("positionen");
	},
});
