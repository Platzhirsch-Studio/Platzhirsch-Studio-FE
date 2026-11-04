// PH Produkt – Client-Script: Statusfarbe, Bildvorschau, Buttons (CONVENTIONS 8).
const PRODUKT_FARBEN = { Entwurf: "gray", Geprueft: "blue", Aktiv: "green", Pausiert: "orange", Ausgelaufen: "red" };

frappe.ui.form.on("PH Produkt", {
	setup(frm) {
		frm.set_query("ausfuehrung", "bilder", () => ({ filters: { produkt: frm.doc.name } }));
		frm.set_query("ausfuehrung", "preise", () => ({ filters: { produkt: frm.doc.name } }));
		frm.set_query("produkt", "zubehoer", () => ({ filters: { name: ["!=", frm.doc.name] } }));
		frm.set_query("produkt", "verwandt", () => ({ filters: { name: ["!=", frm.doc.name] } }));
	},

	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), PRODUKT_FARBEN[frm.doc.status] || "gray");
		zeige_vorschau(frm);
		zeige_hinweise(frm);
		if (frm.is_new()) return;

		// Preis mit Stand hinzufügen (Dialog → Dokument-Methode)
		frm.add_custom_button(__("Preis mit Stand hinzufügen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Preis mit Stand"),
				fields: [
					{ fieldname: "brutto_euro", fieldtype: "Currency", label: __("Brutto (EUR)"), reqd: 1, options: "EUR" },
					{ fieldname: "preisart", fieldtype: "Select", label: __("Preisart"), options: ["Verkaufspreis", "UVP", "Herstellerpreis", "Angebot"], default: frm.doc.preisart === "UVP" ? "UVP" : "Verkaufspreis", reqd: 1 },
					{ fieldname: "stand", fieldtype: "Date", label: __("Preisstand (Prüfdatum)"), default: frappe.datetime.get_today(), reqd: 1 },
					{ fieldname: "ab", fieldtype: "Date", label: __("Gültig ab"), default: frappe.datetime.get_today() },
					{ fieldname: "quelle", fieldtype: "Select", label: __("Quelle"), options: ["Herstellershop", "Herstellerliste", "Inhaber-Preisliste", "Eigen"], default: "Herstellershop", reqd: 1 },
					{ fieldname: "quelle_url", fieldtype: "Data", label: __("Quelle (URL)"), options: "URL" },
					{ fieldname: "ausfuehrung", fieldtype: "Link", label: __("Ausführung (optional)"), options: "PH Produkt Ausfuehrung", get_query: () => ({ filters: { produkt: frm.doc.name } }) },
					{ fieldname: "variante_name", fieldtype: "Data", label: __("Variantenname (Anzeige)") },
					{ fieldname: "freigegeben", fieldtype: "Check", label: __("Freigegeben (Quelle liegt vor)"), default: 1 },
				],
				primary_action_label: __("Hinzufügen"),
				primary_action(v) {
					if (!v.quelle_url && !["Inhaber-Preisliste", "Eigen"].includes(v.quelle) && v.freigegeben) {
						frappe.msgprint(__("Freigabe braucht eine Quelle (URL) – nie schätzen."));
						return;
					}
					frm.call({ method: "preis_hinzufuegen", doc: frm.doc, args: { ...v, brutto_cent: Math.round(flt(v.brutto_euro) * 100) }, freeze: true }).then(() => {
						d.hide();
						frm.reload_doc();
					});
				},
			});
			d.show();
		}, __("Aktionen"));

		// Ausführung anlegen
		if ((frm.doc.ausfuehrungen || []).length) {
			frm.add_custom_button(__("Ausführung anlegen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Ausführung (Option)"),
					fields: [
						{ fieldname: "gruppe_key", fieldtype: "Select", label: __("Gruppe"), options: frm.doc.ausfuehrungen.map((g) => g.gruppe_key), reqd: 1 },
						{ fieldname: "option_id", fieldtype: "Data", label: __("Option-Schlüssel (Slug)"), reqd: 1 },
						{ fieldname: "name_de", fieldtype: "Data", label: __("Bezeichnung (DE)"), reqd: 1 },
						{ fieldname: "name_en", fieldtype: "Data", label: __("Bezeichnung (EN)") },
						{ fieldname: "code", fieldtype: "Data", label: __("Code / RAL") },
						{ fieldname: "farbe_hex", fieldtype: "Color", label: __("Farbe") },
						{ fieldname: "aufpreis_euro", fieldtype: "Currency", label: __("Aufpreis (EUR)"), options: "EUR" },
						{ fieldname: "standard", fieldtype: "Check", label: __("Standardoption") },
					],
					primary_action_label: __("Anlegen"),
					primary_action(v) {
						frm.call({ method: "ausfuehrung_anlegen", doc: frm.doc, args: { ...v, aufpreis_cent: Math.round(flt(v.aufpreis_euro) * 100) }, freeze: true }).then((r) => {
							d.hide();
							if (r.message) frappe.show_alert({ message: __("Ausführung {0} angelegt", [r.message]), indicator: "green" });
							frm.reload_doc();
						});
					},
				});
				d.show();
			}, __("Aktionen"));
		}

		frm.add_custom_button(__("Website-Cache erneuern"), () => {
			frm.call({ method: "website_cache_erneuern", doc: frm.doc }).then((r) => frappe.show_alert({ message: __("Revalidate: {0}", [r.message]), indicator: "blue" }));
		}, __("Aktionen"));

		frm.add_custom_button(__("Vorschau auf Website"), () => {
			frm.call({ method: "website_url", doc: frm.doc, args: { sprache: "de" } }).then((r) => r.message && window.open(r.message, "_blank"));
		}, __("Aktionen"));

		frm.add_custom_button(__("Duplizieren"), () => {
			frappe.prompt({ fieldname: "neuer_name", fieldtype: "Data", label: __("Neuer Produktname"), reqd: 1, default: `${frm.doc.name_herstellerbezeichnung} (Kopie)` }, (v) => {
				frm.call({ method: "duplizieren", doc: frm.doc, args: v, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Produkt", r.message));
			}, __("Produkt duplizieren"));
		}, __("Aktionen"));

		frm.add_custom_button(__("Als Ausstellungsstück anlegen"), () => {
			frappe.confirm(__("Kopie als Ausstellungsstück (Lagerartikel, nicht online) anlegen?"), () => {
				frm.call({ method: "ausstellungsstueck_anlegen", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Produkt", r.message));
			});
		}, __("Aktionen"));

		frm.add_custom_button(__("Ausführungen"), () => frappe.set_route("List", "PH Produkt Ausfuehrung", { produkt: frm.doc.name }), __("Ansehen"));
		frm.add_custom_button(__("Bestellpositionen"), () => frappe.set_route("List", "PH Herstellerbestellung", { "PH Herstellerbestellung Position.produkt": frm.doc.name }), __("Ansehen"));
	},

	marke: aktualisiere_titel,
	name_herstellerbezeichnung: aktualisiere_titel,
	bild_hauptbild: zeige_vorschau,
});

frappe.ui.form.on("PH Produkt Bild", {
	bild: zeige_vorschau,
	freigabe: zeige_vorschau,
	bilder_remove: zeige_vorschau,
});

function aktualisiere_titel(frm) {
	frm.set_value("titel", `${frm.doc.marke || ""} ${frm.doc.name_herstellerbezeichnung || ""}`.trim());
}

function zeige_vorschau(frm) {
	const bilder = (frm.doc.bilder || []).filter((b) => b.bild);
	const haupt = bilder.find((b) => b.freigabe === "erteilt") || bilder[0];
	const esc = frappe.utils.escape_html;
	let html = "";
	if (haupt) {
		html += `<div style="display:flex;gap:12px;align-items:flex-start"><img src="${esc(haupt.bild)}" alt="" style="max-width:220px;max-height:160px;object-fit:contain;border:1px solid var(--border-color);border-radius:6px;background:#fff">`;
		html += `<div class="text-muted small">${bilder.length} ${__("Bilder")} · ${bilder.filter((b) => b.freigabe === "erteilt").length} ${__("freigegeben")}<br>${haupt.freigabe === "erteilt" ? "<span class='indicator-pill green'>" + __("Freigabe erteilt") + "</span>" : "<span class='indicator-pill orange'>" + __("Freigabe offen") + "</span>"}</div></div>`;
		const weitere = bilder.slice(0, 8).map((b) => `<img src="${esc(b.bild)}" alt="" title="${esc(b.typ || "")}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;border:2px solid ${b.freigabe === "erteilt" ? "#15803d" : "#b45309"}">`).join("");
		html += `<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">${weitere}</div>`;
	} else {
		html = `<div class="text-muted">${__("Noch kein Bild. Bilder nur mit Quelle und Freigabe (Herstellerfreigabe).")}</div>`;
	}
	frm.fields_dict.bild_vorschau && frm.fields_dict.bild_vorschau.$wrapper.html(html);
}

function zeige_hinweise(frm) {
	frm.dashboard.clear_headline();
	if (frm.is_new()) return;
	const hinweise = [];
	if (!frm.doc.bild_freigegeben) hinweise.push(__("Kein freigegebenes Bild – Veröffentlichen gesperrt."));
	if (frm.doc.preisstand_alt) hinweise.push(__("Preisstand veraltet – die Website zeigt keinen Preis."));
	if (frm.doc.verkauf_online && !frm.doc.aktueller_preis_cent) hinweise.push(__("Online-Verkauf ohne gültigen Preis."));
	if (frm.doc.verkauf_online && !frm.doc.lieferzeit_freigegeben) hinweise.push(__("Lieferzeit nicht freigegeben – Shop zeigt „auf Anfrage“."));
	if (hinweise.length) frm.dashboard.set_headline_alert(hinweise.join(" "), frm.doc.status === "Aktiv" ? "red" : "orange");
	if (frm.doc.aktueller_preis_cent) frm.dashboard.add_indicator(__("ab {0}", [format_currency(frm.doc.aktueller_preis_cent / 100, frm.doc.waehrung || "EUR")]), "green");
}
