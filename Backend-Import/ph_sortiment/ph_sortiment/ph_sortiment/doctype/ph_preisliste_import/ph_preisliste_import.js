// PH Preisliste Import – Datei einlesen, Prüfen (Schwelle), Übernehmen (Leitung).
frappe.ui.form.on("PH Preisliste Import", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Hochgeladen: "blue", Geprueft: "orange", Uebernommen: "green", Verworfen: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.zeilen_auffaellig) frm.dashboard.set_headline_alert(__("{0} Zeilen über der Prüfschwelle ({1} %) – werden nicht übernommen, solange „Übernehmen“ nicht gesetzt ist.", [frm.doc.zeilen_auffaellig, frm.doc.schwelle_prozent]), "orange");

		if (frm.doc.datei && ["Hochgeladen", "Geprueft"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Datei einlesen"), () => {
				frappe.confirm(__("Zeilen aus der Datei neu einlesen? Vorhandene Zeilen werden ersetzt."), () => {
					frm.call({ method: "datei_einlesen", doc: frm.doc, freeze: true }).then((r) => {
						frappe.show_alert({ message: __("{0} Zeilen eingelesen", [r.message]), indicator: "green" });
						frm.reload_doc();
					});
				});
			}, __("Aktionen"));
		}
		if (["Hochgeladen", "Geprueft"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Prüfen"), () => {
				frm.call({ method: "pruefen", doc: frm.doc, freeze: true }).then((r) => {
					frappe.show_alert({ message: __("{0} Zeilen, {1} über Schwelle", [r.message.zeilen, r.message.auffaellig]), indicator: r.message.auffaellig ? "orange" : "green" });
					frm.reload_doc();
				});
			}, __("Aktionen"));
		}
		if (frm.doc.status === "Geprueft" && frappe.user.has_role(["PH Sortiment Leitung", "PH Geschäftsführung", "System Manager"])) {
			frm.add_custom_button(__("Übernehmen"), () => {
				const n = (frm.doc.zeilen || []).filter((z) => z.uebernehmen && z.produkt && z.neu_cent).length;
				frappe.confirm(__("{0} Preise mit Stand {1} in die Produkte schreiben?", [n, frappe.datetime.str_to_user(frm.doc.stand)]), () => {
					frm.call({ method: "uebernehmen", doc: frm.doc, freeze: true }).then((r) => {
						frappe.show_alert({ message: __("{0} Preise übernommen", [r.message]), indicator: "green" });
						frm.reload_doc();
					});
				});
			}, __("Aktionen"));
		}
	},
});

// ── Ergänzung 04.11. (Backend-Lücken 51)
frappe.ui.form.on("PH Preisliste Import", {
	refresh(frm) {
		if (frm.is_new() || !frm.doc.datei) return;
		frm.add_custom_button(__("Vorschau"), () => {
			frm.call({ method: "vorschau", doc: frm.doc, freeze: true }).then((r) => {
				const v = r.message;
				frappe.msgprint({ title: __("Vorschau: {0} Zeilen, {1} zugeordnet, {2} ohne Produkt", [v.zeilen, v.zugeordnet, v.ohne]), message: v.html, wide: true });
			});
		}, __("Aktionen"));
		if (frm.doc.lieferant && frm.doc.mapping_json !== undefined) {
			frm.add_custom_button(__("Mapping beim Lieferanten speichern"), () => {
				frm.call({ method: "mapping_speichern", doc: frm.doc }).then((r) => frappe.show_alert({ message: __("Vorlage bei {0} gespeichert", [r.message]), indicator: "green" }));
			}, __("Aktionen"));
		}
	},
	preisart(frm) {
		if (frm.doc.preisart === "Einkaufspreis" && !frappe.user.has_role(["PH Sortiment Leitung", "PH Geschäftsführung", "System Manager"])) frappe.msgprint(__("Einkaufspreislisten liest nur die Leitung ein."));
	},
});
