// PH Montageauftrag – Statusfarbe, Galerie vorher/nachher, Unterschrift (mobil), Bericht-PDF, Mängel → Servicefall, Zeit buchen.
const PH_MONTAGE_FARBEN = { Geplant: "blue", Unterwegs: "cyan", "In Arbeit": "orange", Erledigt: "green", Abgenommen: "green", Abgebrochen: "red" };

frappe.ui.form.on("PH Montageauftrag", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), PH_MONTAGE_FARBEN[frm.doc.status] || "gray");
		if (frm.doc.kollisionen) frm.dashboard.set_headline_alert(frappe.utils.escape_html(frm.doc.kollisionen).replace(/
/g, "<br>"), "orange");
		if (frm.is_new()) return;

		if (frm.doc.ware_hinweis) frm.dashboard.add_comment(frappe.utils.escape_html(frm.doc.ware_hinweis).replace(/\n/g, "<br>"), "orange", true);
		frm.add_custom_button(__("Montagezeit vorschlagen"), () => {
			frm.call({ method: "montagezeit_vorschlagen", doc: frm.doc, args: { uebernehmen: 0 } }).then((r) => {
				const e = r.message || {};
				const ohne = (e.ohne_richtwert || []).length ? "<br>" + __("Ohne Richtwert: {0}", [frappe.utils.escape_html(e.ohne_richtwert.join(", "))]) : "";
				frappe.confirm(__("Vorschlag: {0} h aus {1} Positionen.", [e.stunden, (e.details || []).length]) + ohne + "<br>" + __("Als Leistung übernehmen?"), () =>
					frm.call({ method: "montagezeit_vorschlagen", doc: frm.doc, args: { uebernehmen: 1 } }).then(() => frm.reload_doc()), () => frm.reload_doc());
			});
		}, __("Planung"));
		frm.add_custom_button(__("Qualifikationen vorschlagen"), () => {
			frm.call({ method: "qualifikationen_vorschlagen", doc: frm.doc, args: { uebernehmen: 1 }, freeze: true }).then((r) => {
				const e = r.message || {};
				frappe.show_alert({ message: __("Benötigt: {0} · geeignet: {1}", [(e.vorschlag || []).join(", ") || "–", (e.geeignet || []).join(", ") || "–"]), indicator: "blue" }, 8);
				frm.reload_doc();
			});
		}, __("Planung"));
		frm.add_custom_button(__("E-Geräte aus Stückliste"), () => {
			frm.call({ method: "geraete_aus_stueckliste", doc: frm.doc, freeze: true }).then((r) => { frappe.show_alert({ message: __("{0} Geräte übernommen", [r.message || 0]), indicator: "green" }); frm.reload_doc(); });
		}, __("Planung"));
		frm.add_custom_button(__("Unterschrift erfassen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Unterschrift des Kunden"),
				fields: [
					{ fieldname: "name_kunde", fieldtype: "Data", label: __("Name"), default: frm.doc.unterschrift_name || frm.doc.kunde_anwesend },
					{ fieldname: "unterschrift", fieldtype: "Signature", label: __("Unterschrift"), reqd: 1 },
				],
				primary_action_label: __("Speichern"),
				primary_action(values) {
					frm.call({ method: "unterschrift_erfassen", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
				},
			});
			d.show();
		}, __("Aktionen"));

		frm.add_custom_button(__("Bericht PDF"), () => {
			const sprache = frm.doc.sprache_bericht || "de";
			window.open(`/api/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent(frm.doctype)}&name=${encodeURIComponent(frm.doc.name)}&format=${encodeURIComponent("PH Montagebericht")}&no_letterhead=1&_lang=${sprache}`);
		}, __("Aktionen"));

		frm.add_custom_button(__("Bericht in Auftragsmappe"), () => {
			frm.call({ method: "bericht_als_dokument", doc: frm.doc, freeze: true, freeze_message: __("PDF wird erzeugt …") }).then((r) => {
				frappe.show_alert({ message: __("Dokument {0} angelegt", [r.message]), indicator: "green" });
			});
		}, __("Aktionen"));

		frm.add_custom_button(__("Zeit buchen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Montagezeit buchen"),
				fields: [
					{ fieldname: "user", fieldtype: "Link", options: "User", label: __("Monteur"), reqd: 1, default: frappe.session.user },
					{ fieldname: "dauer_min", fieldtype: "Int", label: __("Dauer (Minuten)"), reqd: 1, default: 60 },
					{ fieldname: "taetigkeit", fieldtype: "Select", options: ["Montage", "Fahrt", "Service"], default: "Montage", label: __("Tätigkeit") },
					{ fieldname: "beschreibung", fieldtype: "Data", label: __("Beschreibung") },
				],
				primary_action_label: __("Buchen"),
				primary_action(values) {
					frm.call({ method: "zeit_buchen", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frappe.show_alert({ message: __("Zeit gebucht"), indicator: "green" }); });
				},
			});
			d.show();
		}, __("Aktionen"));

		if ((frm.doc.maengel || []).some((m) => !m.servicefall_ref)) {
			frm.add_custom_button(__("Mängel → Servicefall"), () => {
				const offen = frm.doc.maengel.filter((m) => !m.servicefall_ref);
				const d = new frappe.ui.Dialog({
					title: __("Servicefall aus Mangel"),
					fields: [{ fieldname: "zeile", fieldtype: "Select", label: __("Mangel"), reqd: 1, options: offen.map((m) => ({ value: m.name, label: m.beschreibung })) }],
					primary_action_label: __("Anlegen"),
					primary_action(values) {
						frm.call({ method: "mangel_an_service", doc: frm.doc, args: values, freeze: true }).then((r) => { d.hide(); if (r.message) frappe.set_route("Form", "PH Servicefall", r.message); });
					},
				});
				d.show();
			}, __("Aktionen"));
		}

		frm.add_custom_button(__("Abnahme anlegen"), () => {
			frm.call({ method: "abnahme_anlegen", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Abnahme", r.message));
		}, __("Aktionen"));
		frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
		ph_montage_galerie(frm);
	},
	fotos_add(frm) { ph_montage_galerie(frm); },
	fotos_remove(frm) { ph_montage_galerie(frm); },
});

frappe.ui.form.on("PH Montage Foto", {
	bild(frm) { ph_montage_galerie(frm); },
	art(frm) { ph_montage_galerie(frm); },
});

function ph_montage_galerie(frm) {
	const feld = frm.get_field("galerie_html");
	if (!feld) return;
	const gruppen = { vorher: [], nachher: [], detail: [], mangel: [] };
	(frm.doc.fotos || []).forEach((f) => f.bild && (gruppen[f.art] || gruppen.detail).push(f));
	const spalte = (titel, liste, farbe) => `
		<div><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${farbe};margin-bottom:6px">${titel} (${liste.length})</div>
		<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">${liste.map((f) => `<a href="${frappe.utils.escape_html(f.bild)}" target="_blank" style="display:block;aspect-ratio:4/3;border-radius:6px;overflow:hidden;background:#f3f1ec" title="${frappe.utils.escape_html(f.hinweis || "")}"><img src="${frappe.utils.escape_html(f.bild)}" style="width:100%;height:100%;object-fit:cover" alt=""></a>`).join("") || `<span class="text-muted" style="font-size:12px">–</span>`}</div></div>`;
	feld.$wrapper.html(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">${spalte(__("Vorher"), gruppen.vorher, "#b45309")}${spalte(__("Nachher"), gruppen.nachher, "#15803d")}${spalte(__("Details"), gruppen.detail, "#30373e")}${spalte(__("Mängel"), gruppen.mangel, "#b91c1c")}</div>`);
}
