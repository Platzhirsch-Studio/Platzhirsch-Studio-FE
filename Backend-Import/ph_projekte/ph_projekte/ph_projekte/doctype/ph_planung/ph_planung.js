// PH Planung – Versionen, Kunden vorlegen (Dokument + Nachricht), Freigeben, Import Küchenplanung, Positionen ins Projekt.
frappe.ui.form.on("PH Planung", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Entwurf: "gray", "Kunde vorgelegt": "orange", "Aenderung gewuenscht": "orange", Freigegeben: "green", Verworfen: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status === "Aenderung gewuenscht" ? "Änderung gewünscht" : frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		const bearbeitbar = ["Entwurf", "Aenderung gewuenscht"].includes(frm.doc.status);
		if (bearbeitbar) {
			frm.add_custom_button(__("Kunden vorlegen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Planung dem Kunden vorlegen"),
					fields: [{ fieldname: "nachricht", fieldtype: "Small Text", label: __("Nachricht an den Kunden (optional)") }],
					primary_action_label: __("Vorlegen"),
					primary_action(v) { frm.call({ method: "kunden_vorlegen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); }); },
				});
				d.show();
			}, __("Aktionen"));
			frm.add_custom_button(__("Küchenplanung importieren"), () => import_dialog(frm), __("Aktionen"));
		}
		if (frm.doc.status !== "Verworfen" && (frm.doc.positionen || []).length) frm.add_custom_button(__("Re-Import abgleichen"), () => abgleich_dialog(frm), __("Aktionen"));
		if (["Entwurf", "Kunde vorgelegt", "Aenderung gewuenscht"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Freigeben"), () => {
				frappe.confirm(__("Planung freigeben? (Kundenfreigabe liegt vor)"), () => frm.call({ method: "freigeben", doc: frm.doc, args: { durch_kunde: 1 } }).then(() => frm.reload_doc()));
			}, __("Aktionen"));
			frm.add_custom_button(__("Verwerfen"), () => frappe.confirm(__("Planung verwerfen?"), () => frm.call({ method: "verwerfen", doc: frm.doc }).then(() => frm.reload_doc())), __("Aktionen"));
		}
		if (frm.doc.status === "Verworfen") frm.add_custom_button(__("Verwerfen zurücknehmen"), () => frm.call({ method: "verwerfen_zuruecknehmen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		frm.add_custom_button(__("Neue Version"), () => frm.call({ method: "neue_version", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Planung", r.message)), __("Aktionen"));
		if ((frm.doc.positionen || []).length) frm.add_custom_button(__("Positionen ins Projekt"), () => frm.call({ method: "positionen_ins_projekt", doc: frm.doc, freeze: true }).then((r) => frappe.show_alert({ message: __("{0} Positionen übernommen", [r.message]), indicator: "green" })), __("Aktionen"));
		frm.add_custom_button(__("Rendering anlegen"), () => frappe.new_doc("PH Rendering", { projekt: frm.doc.projekt, planung: frm.doc.name, bezeichnung: frm.doc.bezeichnung }), __("Neu"));
		frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
		if (frm.doc.kunde_kommentar) frm.dashboard.set_headline_alert(__("Kunde: {0}", [frappe.utils.escape_html(frm.doc.kunde_kommentar)]), "orange");
		if (frm.doc.vorschau) frm.dashboard.add_section(`<img src="${frappe.utils.escape_html(frm.doc.vorschau)}" style="max-width:100%;max-height:320px;border-radius:8px" alt="">`, __("Vorschau"));
	},
	quelle_planung(frm) {
		if (["Handskizze", "Modell"].includes(frm.doc.quelle_planung)) frappe.show_alert({ message: __("Handskizze/Modell: bitte „Echtes Original“ bestätigen."), indicator: "orange" });
	},
});

function abgleich_dialog(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Geänderte Planung abgleichen"),
		fields: [
			{ fieldname: "datei", fieldtype: "Attach", label: __("Neue Exportdatei"), reqd: 1 },
			{ fieldname: "format", fieldtype: "Data", label: __("Format"), default: frm.doc.import_format || "csv", reqd: 1 },
			{ fieldname: "mapping_json", fieldtype: "Code", options: "JSON", label: __("Mapping (optional)") },
			{ fieldname: "nachtrag_vorschlag", fieldtype: "Check", label: __("Änderungen am Auftrag als Nachtrag vorschlagen"), default: 1 },
			{ fieldname: "ergebnis", fieldtype: "HTML" },
		],
		primary_action_label: __("Vorschau"),
		primary_action(v) {
			frm.call({ method: "import_abgleich_vorschau", doc: frm.doc, args: { datei: v.datei, format: v.format, mapping_json: v.mapping_json }, freeze: true }).then((r) => {
				const e = r.message || {};
				const esc = frappe.utils.escape_html;
				const liste = (titel, arr, f) => arr.length ? `<h5>${titel} (${arr.length})</h5><ul>${arr.slice(0, 40).map((x) => `<li>${f(x)}</li>`).join("")}</ul>` : "";
				d.fields_dict.ergebnis.$wrapper.html(
					(e.verifiziert ? "" : `<div class="text-warning">${__("Format unverifiziert – Ergebnis prüfen")}</div>`) +
					liste(__("Neu"), e.neu || [], (p) => esc(`${p.pos_nr || ""} ${p.hersteller_artikelnr || ""} ${p.bezeichnung}`)) +
					liste(__("Geändert"), e.geaendert || [], (g) => esc(`${g.schluessel}: ${Object.keys(g.felder).join(", ")}`) + (g.bestellt ? ` <b>${__("bestellt")}</b>` : "")) +
					liste(__("Entfällt (wird storniert)"), e.entfallen || [], (x) => esc(x.bezeichnung || x.schluessel) + (x.bestellt ? ` <b>${__("bestellt")}</b>` : "")) +
					`<p>${__("Unverändert: {0}", [e.unveraendert || 0])}</p>`
				);
				d.set_primary_action(__("Übernehmen"), (v2) => frm.call({ method: "import_abgleichen", doc: frm.doc, args: v2, freeze: true }).then((r2) => {
					d.hide();
					const m = r2.message || {};
					frappe.msgprint(__("Abgleich übernommen.") + (m.nachtrag ? "<br>" + __("Nachtrag-Entwurf {0}", [m.nachtrag]) : "") + (m.aufgabe ? "<br>" + __("Aufgabe {0}: Hersteller informieren", [m.aufgabe]) : ""));
					frm.reload_doc();
				}));
			});
		},
	});
	d.show();
}

function import_dialog(frm) {
	frm.call({ method: "import_formate", doc: frm.doc }).then((r) => {
		const formate = (r.message || []).map((f) => ({ value: f.key, label: f.label + (f.verifiziert ? "" : " – " + __("unverifiziert")) }));
		const d = new frappe.ui.Dialog({
			title: __("Küchenplanung importieren (CSV/XML-Export)"),
			fields: [
				{ fieldname: "datei", fieldtype: "Attach", label: __("Exportdatei"), reqd: 1 },
				{ fieldname: "format", fieldtype: "Select", label: __("Format"), options: formate, default: "csv", reqd: 1 },
				{ fieldname: "mapping_json", fieldtype: "Code", options: "JSON", label: __("Mapping (optional)"), description: __("z. B. {\"spalten\": {\"bezeichnung\": \"Text\"}, \"einheit_masse\": \"cm\"}") },
				{ fieldname: "ersetzen", fieldtype: "Check", label: __("Vorhandene Positionen ersetzen") },
				{ fieldname: "vorschau_html", fieldtype: "HTML" },
			],
			primary_action_label: __("Vorschau"),
			primary_action(v) {
				frm.call({ method: "import_vorschau", doc: frm.doc, args: { datei: v.datei, format: v.format, mapping_json: v.mapping_json }, freeze: true }).then((res) => {
					const e = res.message || {};
					const esc = frappe.utils.escape_html;
					const zeilen = (e.positionen || []).slice(0, 30).map((p) => `<tr><td>${esc(p.pos_nr || "")}</td><td>${esc(p.hersteller_artikelnr || "")}</td><td>${esc(p.bezeichnung || "")}</td><td>${p.menge}</td><td>${p.breite_mm || ""}</td><td>${esc(p.raum || "")}</td></tr>`).join("");
					const warn = (e.warnungen || []).map((w) => `<div class="text-warning">${esc(w)}</div>`).join("");
					d.fields_dict.vorschau_html.$wrapper.html(`${warn}<p>${__("{0} Positionen erkannt", [e.anzahl || 0])}</p><table class="table table-bordered table-sm"><tr><th>Pos</th><th>Art.-Nr.</th><th>Bezeichnung</th><th>Menge</th><th>B mm</th><th>Raum</th></tr>${zeilen}</table>`);
					d.set_primary_action(__("Übernehmen"), (v2) => {
						frm.call({ method: "import_uebernehmen", doc: frm.doc, args: v2, freeze: true }).then((r2) => { d.hide(); frappe.show_alert({ message: __("{0} Positionen importiert", [r2.message.importiert]), indicator: "green" }); frm.reload_doc(); });
					});
				});
			},
		});
		d.show();
	});
}
