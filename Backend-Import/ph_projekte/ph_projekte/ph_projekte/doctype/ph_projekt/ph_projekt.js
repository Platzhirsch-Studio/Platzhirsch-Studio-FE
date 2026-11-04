// PH Projekt – Formular: Phasen-Indikator, Buttons, Galerie (Renderings, Tagebuch, Bild-Dokumente), Kennzahlen.
// Regeln CONVENTIONS 8: Buttons nur bei gespeichertem Dokument, Server-Logik als Dokument-Methoden.

const PH_PROJEKT_FARBEN = { Anfrage: "blue", Planung: "cyan", Angebot: "orange", Auftrag: "purple", Bestellung: "yellow", Lieferung: "light-blue", Montage: "pink", Uebergabe: "green", Abgeschlossen: "gray", Abgebrochen: "red" };

frappe.ui.form.on("PH Projekt", {
	onload(frm) {
		if (frm.is_new() && !frm.doc.eingang) frm.set_value("eingang", frappe.datetime.now_datetime());
	},

	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), PH_PROJEKT_FARBEN[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		frm.add_custom_button(__("Auftragsmappe öffnen"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.name }));

		frm.add_custom_button(__("Montageauftrag anlegen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Montageauftrag aus Projekt"),
				fields: [
					{ fieldname: "start", fieldtype: "Datetime", label: __("Beginn"), reqd: 1, default: frm.doc.montage_von ? `${frm.doc.montage_von} 08:00:00` : null },
					{ fieldname: "ende", fieldtype: "Datetime", label: __("Ende (geplant)") },
					{ fieldname: "montageleiter", fieldtype: "Link", options: "User", label: __("Montageleiter"), default: frm.doc.montageleiter },
				],
				primary_action_label: __("Anlegen"),
				primary_action(values) {
					frm.call({ method: "montageauftrag_anlegen", doc: frm.doc, args: values, freeze: true }).then((r) => {
						d.hide();
						if (r.message) frappe.set_route("Form", "PH Montageauftrag", r.message);
					});
				},
			});
			d.show();
		}, __("Aktionen"));

		frm.add_custom_button(frm.doc.abnahme ? __("Abnahme öffnen") : __("Abnahme anlegen"), () => {
			if (frm.doc.abnahme) return frappe.set_route("Form", "PH Abnahme", frm.doc.abnahme);
			frm.call({ method: "abnahme_anlegen", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Abnahme", r.message));
		}, __("Aktionen"));

		frm.add_custom_button(__("Produktpässe erzeugen"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Produktpässe aus Positionen"),
				fields: [{ fieldname: "lieferdatum", fieldtype: "Date", label: __("Lieferdatum"), default: frm.doc.liefertermin_geplant }],
				primary_action_label: __("Erzeugen"),
				primary_action(values) {
					frm.call({ method: "produktpaesse_erzeugen", doc: frm.doc, args: values, freeze: true }).then((r) => {
						d.hide();
						frappe.show_alert({ message: __("{0} Produktpässe angelegt", [(r.message || []).length]), indicator: "green" });
						frm.reload_doc();
					});
				},
			});
			d.show();
		}, __("Aktionen"));

		frm.add_custom_button(__("Portal-Status senden"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Nachricht an den Kunden"),
				fields: [{ fieldname: "text", fieldtype: "Small Text", label: __("Text"), default: __("Ihr Projekt „{0}“ ist jetzt in der Phase „{1}“.", [frm.doc.titel, __(frm.doc.status)]) }],
				primary_action_label: __("Senden"),
				primary_action(values) {
					frm.call({ method: "portal_status_senden", doc: frm.doc, args: values, freeze: true }).then(() => {
						d.hide();
						frappe.show_alert({ message: __("Nachricht gespeichert"), indicator: "green" });
					});
				},
			});
			d.show();
		}, __("Aktionen"));

		frm.add_custom_button(__("Summen aktualisieren"), () => {
			frm.call({ method: "summen_aktualisieren", doc: frm.doc, freeze: true }).then(() => frm.reload_doc());
		}, __("Aktionen"));

		// Schnellanlage verknüpfter Dokumente
		[["PH Planung", __("Planung")], ["PH Rendering", __("Rendering")], ["PH Projekt Dokument", __("Dokument")], ["PH Fremdgewerk", __("Fremdgewerk")], ["PH Projekt Aufgabe", __("Aufgabe")], ["PH Projektzeit", __("Zeit buchen")]].forEach(([dt, label]) => {
			frm.add_custom_button(label, () => frappe.new_doc(dt, { projekt: frm.doc.name }), __("Neu"));
		});

		if (frm.doc.kontakt) frm.add_custom_button(__("Kunde öffnen"), () => frappe.set_route("Form", "PH Kontakt", frm.doc.kontakt));

		if (!frm.doc.portal_sichtbar) frm.dashboard.set_headline_alert(__("Projekt ist im Kundenportal nicht sichtbar."), "orange");
		ph_projekt_galerie(frm);
	},

	kontakt(frm) {
		if (frm.doc.kontakt && !frm.doc.titel) frm.set_value("titel", "");
	},
});

function ph_projekt_galerie(frm) {
	const feld = frm.get_field("galerie_html");
	if (!feld) return;
	feld.$wrapper.html(`<div class="text-muted">${__("Galerie wird geladen …")}</div>`);
	frappe.call({ method: "ph_projekte.api.auftragsmappe", args: { projekt: frm.doc.name } }).then((r) => {
		const d = r.message || {};
		const bilder = [];
		(d.renderings || []).forEach((x) => x.bild && bilder.push({ src: x.bild, titel: `${x.titel}${x.ki_generiert ? " · KI" : ""}`, route: ["Form", "PH Rendering", x.name], tag: __("Rendering"), farbe: "#1d4ed8" }));
		(d.fotos || []).forEach((x) => x.bild && bilder.push({ src: x.bild, titel: `${x.phase}: ${x.titel || ""}`, route: ["Form", "PH Tagebuch Foto", x.name], tag: __("Tagebuch"), farbe: "#8a7a66" }));
		(d.dokumente || []).forEach((x) => x.mime && x.mime.startsWith("image/") && bilder.push({ src: x.datei, titel: x.titel, route: ["Form", "PH Projekt Dokument", x.name], tag: x.kategorie, farbe: "#15803d" }));
		if (!bilder.length) {
			feld.$wrapper.html(`<div class="text-muted">${__("Noch keine Bilder – Renderings, Tagebuch-Fotos und Bild-Dokumente erscheinen hier.")}</div>`);
			return;
		}
		const html = bilder.map((b, i) => `
			<a class="ph-galerie-kachel" data-i="${i}" href="#" style="display:block;position:relative;border-radius:8px;overflow:hidden;background:#f3f1ec;aspect-ratio:4/3">
				<img src="${frappe.utils.escape_html(b.src)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" alt="">
				<span style="position:absolute;left:6px;top:6px;background:${b.farbe};color:#fff;font-size:10px;letter-spacing:.06em;padding:2px 6px;border-radius:4px">${frappe.utils.escape_html(b.tag)}</span>
				<span style="position:absolute;left:0;right:0;bottom:0;background:rgba(48,55,62,.78);color:#fff;font-size:11px;padding:4px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${frappe.utils.escape_html(b.titel || "")}</span>
			</a>`).join("");
		feld.$wrapper.html(`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">${html}</div>`);
		feld.$wrapper.find(".ph-galerie-kachel").on("click", function (e) {
			e.preventDefault();
			frappe.set_route(...bilder[Number(this.dataset.i)].route);
		});
	});
}
