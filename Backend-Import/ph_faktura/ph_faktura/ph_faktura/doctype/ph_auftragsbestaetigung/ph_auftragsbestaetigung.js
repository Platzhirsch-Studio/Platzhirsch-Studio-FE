// PH Auftragsbestaetigung – Buttons: Anzahlungsrechnung, Teil-/Schlussrechnung, Herstellerbestellungen, Lieferung melden, Stornieren, PDF senden.
frappe.ui.form.on("PH Auftragsbestaetigung", {
	refresh(frm) {
		ph_faktura.indicator(frm);
		ph_faktura.summenblock(frm);
		standblock(frm);
		if (frm.is_new()) return;
		const aktiv = !["Storniert", "Abgerechnet"].includes(frm.doc.status);
		const dts = (frm.doc.__onload && frm.doc.__onload.doctypes) || {};

		frm.add_custom_button(__("Als PDF senden"), () => ph_faktura.senden_dialog(frm), __("Aktionen"));
		if (aktiv) {
			const offeneAnzahlung = (frm.doc.zahlungsplan || []).some((z) => z.art === "Anzahlung" && !z.rechnung && z.betrag_cent > 0);
			if (offeneAnzahlung) {
				frm.add_custom_button(__("Anzahlungsrechnung erstellen"), () => {
					frm.call({ method: "anzahlungsrechnung_erstellen", doc: frm.doc, freeze: true }).then((r) => {
						const n = Array.isArray(r.message) ? r.message[0] : r.message;
						if (n) frappe.set_route("Form", "PH Rechnung", n);
					});
				}, __("Aktionen"));
			}
			frm.add_custom_button(__("Teilrechnung erstellen"), () => teilrechnung_dialog(frm), __("Aktionen"));
			frm.add_custom_button(__("Schlussrechnung erstellen"), () => {
				frappe.confirm(__("Schlussrechnung über alle offenen Positionen erzeugen? Anzahlungen werden verrechnet."), () => {
					frm.call({ method: "rechnung_erstellen", doc: frm.doc, args: { art: "Schlussrechnung" }, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Rechnung", r.message));
				});
			}, __("Aktionen"));
			if (dts["PH Herstellerbestellung"]) {
				frm.add_custom_button(__("Herstellerbestellungen erzeugen"), () => {
					frm.call({ method: "herstellerbestellungen_erzeugen", doc: frm.doc, freeze: true }).then((r) => { frappe.show_alert({ message: __("Erzeugt: {0}", [(r.message || []).join(", ")]), indicator: "green" }); frm.reload_doc(); });
				}, __("Aktionen"));
			}
			if (dts["PH Lieferschein"]) {
				frm.add_custom_button(__("Lieferschein erzeugen"), () => frappe.new_doc("PH Lieferschein", { auftrag: frm.doc.name, kontakt: frm.doc.kontakt, projekt: frm.doc.projekt }), __("Aktionen"));
			}
			frm.add_custom_button(__("Lieferung melden"), () => lieferung_dialog(frm), __("Aktionen"));
			frm.add_custom_button(__("Stornieren"), () => {
				frappe.prompt([{ fieldname: "grund", fieldtype: "Small Text", label: __("Stornogrund"), reqd: 1 }], (v) => {
					frm.call({ method: "stornieren", doc: frm.doc, args: v, freeze: true }).then(() => frm.reload_doc());
				}, __("Auftrag stornieren"), __("Stornieren"));
			}, __("Aktionen"));
		}
		if (frm.doc.angebot) frm.add_custom_button(__("Angebot öffnen"), () => frappe.set_route("Form", "PH Angebot", frm.doc.angebot));
		if (frm.doc.projekt) frm.add_custom_button(__("Projekt öffnen"), () => frappe.set_route("Form", "PH Projekt", frm.doc.projekt));
		if (frm.doc.fagg_frist_ende && frappe.datetime.get_diff(frm.doc.fagg_frist_ende, frappe.datetime.get_today()) >= 0) {
			frm.dashboard.set_headline_alert(__("FAGG: Rücktrittsrecht des Kunden bis {0}.", [frappe.datetime.str_to_user(frm.doc.fagg_frist_ende)]), "orange");
		}
	},
	zahlungsbedingung(frm) {
		if (!frm.doc.zahlungsbedingung) return;
		frappe.db.get_doc("PH Zahlungsbedingung", frm.doc.zahlungsbedingung).then((zb) => {
			frm.clear_table("zahlungsplan");
			if (zb.anzahlung_prozent) frm.add_child("zahlungsplan", { art: "Anzahlung", prozent: zb.anzahlung_prozent, faellig_bei: "Auftrag" });
			if (zb.teilzahlung_prozent) frm.add_child("zahlungsplan", { art: "Teilzahlung", prozent: zb.teilzahlung_prozent, faellig_bei: "Lieferung" });
			const rest = 100 - (zb.anzahlung_prozent || 0) - (zb.teilzahlung_prozent || 0);
			if (rest > 0) frm.add_child("zahlungsplan", { art: "Schlusszahlung", prozent: rest, faellig_bei: "Montage" });
			frm.refresh_field("zahlungsplan");
		});
	},
});

function standblock(frm) {
	const d = frm.doc;
	if (!frm.fields_dict.stand_html || frm.is_new()) return;
	const b = (c) => ph_faktura.betrag(c, d.waehrung);
	const pct = (a, g) => (g ? Math.min(100, Math.round((a / g) * 100)) : 0);
	const bar = (label, ist, soll, farbe) => `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><span>${label}</span><span>${b(ist)} / ${b(soll)}</span></div>
		<div style="background:var(--border-color);height:8px;border-radius:4px"><div style="width:${pct(ist, soll)}%;background:${farbe};height:8px;border-radius:4px"></div></div></div>`;
	frm.fields_dict.stand_html.$wrapper.html(`<div style="max-width:520px">
		${bar(__("Anzahlung"), d.anzahlung_ist_cent, d.anzahlung_soll_cent, "#1d4ed8")}
		${bar(__("Geliefert (nach Wert)"), d.geliefert_cent, d.auftragswert_cent, "#8a7a66")}
		${bar(__("Abgerechnet"), d.abgerechnet_cent, d.auftragswert_cent, "#b45309")}
		${bar(__("Bezahlt"), d.bezahlt_cent, d.auftragswert_cent, "#15803d")}
		<div style="font-size:13px;margin-top:8px"><b>${__("Offen")}: ${b(d.offen_cent)}</b></div></div>`);
}

function teilrechnung_dialog(frm) {
	const zeilen = (frm.doc.positionen || []).filter((p) => !["Text", "Zwischensumme"].includes(p.art) && !p.alternativ);
	const d = new frappe.ui.Dialog({
		title: __("Teilrechnung – Mengen"),
		fields: [{
			fieldname: "mengen", fieldtype: "Table", label: __("Positionen"), cannot_add_rows: true, in_place_edit: true,
			data: zeilen.map((p) => ({ zeile: p.name, bezeichnung: p.bezeichnung, menge: p.menge, geliefert: p.lieferschein_menge, abgerechnet: p.rechnung_menge, jetzt: Math.max((p.lieferschein_menge || 0) - (p.rechnung_menge || 0), 0) })),
			fields: [
				{ fieldname: "zeile", fieldtype: "Data", hidden: 1 },
				{ fieldname: "bezeichnung", fieldtype: "Data", label: __("Position"), in_list_view: 1, read_only: 1, columns: 4 },
				{ fieldname: "menge", fieldtype: "Float", label: __("Menge"), in_list_view: 1, read_only: 1, columns: 1 },
				{ fieldname: "geliefert", fieldtype: "Float", label: __("Geliefert"), in_list_view: 1, read_only: 1, columns: 1 },
				{ fieldname: "abgerechnet", fieldtype: "Float", label: __("Abgerechnet"), in_list_view: 1, read_only: 1, columns: 1 },
				{ fieldname: "jetzt", fieldtype: "Float", label: __("Jetzt abrechnen"), in_list_view: 1, columns: 2 },
			],
		}],
		primary_action_label: __("Teilrechnung erzeugen"),
		primary_action: () => {
			const mengen = {};
			(d.get_value("mengen") || []).forEach((r) => { if (r.jetzt > 0) mengen[r.zeile] = r.jetzt; });
			if (!Object.keys(mengen).length) return frappe.msgprint(__("Keine Mengen angegeben."));
			frm.call({ method: "rechnung_erstellen", doc: frm.doc, args: { art: "Teilrechnung", mengen }, freeze: true }).then((r) => { d.hide(); r.message && frappe.set_route("Form", "PH Rechnung", r.message); });
		},
	});
	d.show();
}

function lieferung_dialog(frm) {
	frappe.confirm(__("Alle Positionen als vollständig geliefert melden? (Teilmengen: über ph_logistik Lieferschein)"), () => {
		frm.call({ method: "lieferung_melden", doc: frm.doc, args: { vollstaendig: 1 }, freeze: true }).then(() => frm.reload_doc());
	});
}
