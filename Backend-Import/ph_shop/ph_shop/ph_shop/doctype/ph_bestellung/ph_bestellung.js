// PH Bestellung – Buttons, Statusfarben, Dashboard-Hinweise (CONVENTIONS 8).
const FARBEN_BESTELLUNG = {
	offen: "blue", zahlung_ausstehend: "orange", bezahlt: "green", versandbereit: "cyan", versendet: "purple",
	reserviert: "yellow", abholbereit: "cyan", abgeholt: "green", abgeschlossen: "gray", fehlgeschlagen: "red",
	abgelaufen: "gray", storniert: "red", widerrufen: "red", erstattet: "gray", teilerstattet: "orange",
	checkout_fehler: "red", pruefen: "pink",
};
const euro = (cent) => format_currency((cent || 0) / 100, "EUR");

frappe.ui.form.on("PH Bestellung", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), FARBEN_BESTELLUNG[frm.doc.status] || "gray");
		if (frm.doc.modus === "test") frm.dashboard.set_headline_alert(__("Testbestellung – keine echte Zahlung."), "orange");
		if (frm.doc.status === "pruefen") frm.dashboard.set_headline_alert(__("Betrag weicht von Stripe ab – bitte prüfen."), "red");
		if (frm.doc.radar_markiert) frm.dashboard.set_headline_alert(__("Stripe Radar: erhöhtes Risiko ({0}, Wert {1}) – vor Versand/Übergabe prüfen.", [frappe.utils.escape_html(frm.doc.radar_risk_level || "–"), frm.doc.radar_risk_score ?? "–"]) + (frm.doc.radar_geprueft_von ? " " + __("Geprüft von {0}", [frappe.utils.escape_html(frm.doc.radar_geprueft_von)]) : ""), frm.doc.radar_geprueft_von ? "orange" : "red");
		if (frm.doc.bestellart === "Ersatz" && frm.doc.ersatz_fuer) frm.dashboard.set_headline_alert(__("Ersatzlieferung (0 €) zu {0}", [frappe.utils.escape_html(frm.doc.ersatz_fuer)]), "blue");
		if (frm.is_new()) return;
		const s = frm.doc.status;
		const bezahlt = Boolean(frm.doc.bezahlt_am);
		const leitung = frappe.user.has_role(["PH Shop Leitung", "PH Geschäftsführung", "System Manager"]);

		if (!bezahlt && !["storniert", "abgelaufen", "erstattet", "abgeschlossen"].includes(s)) {
			frm.add_custom_button(__("Zahlung erfassen"), () => zahlungErfassen(frm), __("Aktionen"));
			frm.add_custom_button(__("Gutschein einlösen"), () => gutscheinEinloesen(frm), __("Aktionen"));
		}
		if (frm.doc.lieferart === "abholung" && ["bezahlt", "reserviert", "pruefen"].includes(s)) {
			frm.add_custom_button(__("Abholbereit melden"), () => aufruf(frm, "abholbereit_melden", {}, __("Abholcode {0} gesendet", ["{0}"])), __("Aktionen"));
		}
		if (s === "abholbereit") frm.add_custom_button(__("Abgeholt"), () => aufruf(frm, "abgeholt_melden"), __("Aktionen"));
		if (frm.doc.lieferart === "versand" && s === "bezahlt") frm.add_custom_button(__("Packen / Lieferschein"), () => aufruf(frm, "packen"), __("Aktionen"));
		if (frm.doc.lieferart === "versand" && ["versandbereit", "bezahlt"].includes(s)) {
			frm.add_custom_button(__("Versendet melden"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Versendet"),
					fields: [
						{ fieldname: "awb", fieldtype: "Data", label: __("Sendungsnummer"), default: frm.doc.awb },
						{ fieldname: "carrier", fieldtype: "Data", label: __("Carrier"), default: frm.doc.carrier },
					],
					primary_action_label: __("Versendet"),
					primary_action(v) { d.hide(); aufruf(frm, "versendet_melden", v); },
				});
				d.show();
			}, __("Aktionen"));
		}
		if (["versendet", "abgeholt"].includes(s)) frm.add_custom_button(__("Abschließen"), () => aufruf(frm, "abschliessen"), __("Aktionen"));
		frm.add_custom_button(__("Bestellbestätigung senden"), () => aufruf(frm, "bestaetigung_senden", {}, __("Bestellbestätigung gesendet")), __("Aktionen"));
		if (!frm.doc.widerruf) frm.add_custom_button(__("Widerruf erfassen"), () => widerrufErfassen(frm), __("Aktionen"));
		if (bezahlt) frm.add_custom_button(__("Rechnung erstellen"), () => aufruf(frm, "rechnung_erstellen"), __("Aktionen"));
		if (leitung && !["storniert", "erstattet", "abgeschlossen"].includes(s)) {
			frm.add_custom_button(__("Stornieren & erstatten"), () => stornieren(frm), __("Aktionen"));
		}
		const offen = (frm.doc.gesamt_cent || 0) - (frm.doc.betrag_bezahlt_cent || 0);
		if (!bezahlt && offen > 0 && ["offen", "fehlgeschlagen", "checkout_fehler", "zahlung_ausstehend"].includes(s)) {
			frm.add_custom_button(__("Zahlungslink erzeugen/senden"), () => frappe.confirm(__("Zahlungslink über {0} erzeugen und an {1} senden?", [euro(offen), frappe.utils.escape_html(frm.doc.kunde_email || "–")]), () => aufruf(frm, "zahlungslink_erstellen", { senden: 1 }).then((r) => {
				const m = r.message || {};
				frappe.msgprint({ title: __("Zahlungslink"), message: `<a href="${encodeURI(m.url || "")}" target="_blank" rel="noopener">${frappe.utils.escape_html(m.url || "")}</a>${m.simuliert ? "<br>" + __("(simuliert – kein echter Stripe-Aufruf)") : ""}`, indicator: "green" });
			})), __("Aktionen"));
		}
		if (!["storniert", "abgeschlossen", "erstattet", "versendet", "abgeholt", "widerrufen"].includes(s)) {
			frm.add_custom_button(__("Positionen stornieren"), () => teilDialog(frm, "positionen_stornieren"), __("Aktionen"));
		}
		if (leitung && (bezahlt || frm.doc.betrag_bezahlt_cent > 0) && !["erstattet", "storniert"].includes(s)) {
			frm.add_custom_button(__("Teilerstattung"), () => teilDialog(frm, "teilerstatten"), __("Aktionen"));
		}
		if (bezahlt && frm.doc.bestellart !== "Ersatz") frm.add_custom_button(__("Ersatzlieferung anlegen"), () => teilDialog(frm, "ersatzlieferung_anlegen"), __("Aktionen"));
		if (s === "abholbereit" && frm.doc.abholcode) frm.add_custom_button(__("Abholcode erneut senden"), () => aufruf(frm, "abholcode_erneut_senden", {}, __("Gesendet")), __("Aktionen"));
		if (s === "abgeholt" && leitung) frm.add_custom_button(__("Übergabe zurücknehmen"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Data", label: __("Grund"), reqd: 1 }, (v) => aufruf(frm, "abholung_zuruecknehmen", v), __("Übergabe zurücknehmen")), __("Aktionen"));
		if (frm.doc.radar_markiert && !frm.doc.radar_geprueft_von) frm.add_custom_button(__("Risiko geprüft"), () => frappe.prompt({ fieldname: "notiz", fieldtype: "Data", label: __("Notiz (z. B. Kunde telefonisch bestätigt)") }, (v) => aufruf(frm, "radar_geprueft", v)), __("Aktionen"));
		if (frm.doc.zahlung_ref) frm.add_custom_button(__("Zahlung öffnen"), () => frappe.set_route("Form", "PH Zahlung", frm.doc.zahlung_ref));
		if (frm.doc.payment_intent) {
			const live = frm.doc.livemode ? "" : "test/";
			frm.add_custom_button(__("Stripe-Zahlung öffnen"), () => window.open(`https://dashboard.stripe.com/${live}payments/${frm.doc.payment_intent}`, "_blank"));
		}
		if (frm.doc.widerruf) frm.add_custom_button(__("Widerruf öffnen"), () => frappe.set_route("Form", "PH Widerruf", frm.doc.widerruf));
		if (frm.doc.kunde_email) {
			frm.add_custom_button(__("E-Mail schreiben"), () => new frappe.views.CommunicationComposer({ doc: frm.doc, frm, subject: __("Ihre Bestellung {0}", [frm.doc.name]), recipients: frm.doc.kunde_email }));
		}
		// Kopfzeile: Summen auf einen Blick
		frm.dashboard.add_indicator(__("Gesamt {0}", [euro(frm.doc.gesamt_cent)]), "blue");
		if (bezahlt) frm.dashboard.add_indicator(__("Bezahlt {0}", [euro(frm.doc.betrag_bezahlt_cent)]), "green");
		if (frm.doc.erstattet_cent) frm.dashboard.add_indicator(__("Erstattet {0}", [euro(frm.doc.erstattet_cent)]), "orange");
	},
	lieferart(frm) {
		if (frm.doc.lieferart === "abholung") frm.set_value("versand_cent", 0);
		else frm.set_value("zahlung", "online");
	},
});

frappe.ui.form.on("PH Bestellung Position", {
	menge: summeZeile,
	einzel_cent: summeZeile,
});

function summeZeile(frm, cdt, cdn) {
	const row = locals[cdt][cdn];
	frappe.model.set_value(cdt, cdn, "summe_cent", (row.menge || 1) * (row.einzel_cent || 0));
}

function aufruf(frm, method, args = {}, erfolg = null) {
	return frm.call({ method, doc: frm.doc, args, freeze: true }).then((r) => {
		if (erfolg) frappe.show_alert({ message: erfolg.replace("{0}", r.message), indicator: "green" });
		frm.reload_doc();
		return r;
	});
}

function zahlungErfassen(frm) {
	const offen = (frm.doc.gesamt_cent || 0) - (frm.doc.betrag_bezahlt_cent || 0);
	const d = new frappe.ui.Dialog({
		title: __("Zahlung erfassen"),
		fields: [
			{ fieldname: "kanal", fieldtype: "Select", label: __("Kanal"), options: ["Bar", "Karte extern", "Ueberweisung", "Stripe Terminal", "Verrechnung"], default: frm.doc.zahlung === "vorort" ? "Bar" : "Ueberweisung", reqd: 1 },
			{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent)"), default: offen, reqd: 1, description: euro(offen) },
			{ fieldname: "referenz", fieldtype: "Data", label: __("Referenz (Bon, Überweisungstext)") },
		],
		primary_action_label: __("Buchen"),
		primary_action(v) {
			d.hide();
			aufruf(frm, "zahlung_erfassen", v, __("Zahlung {0} gebucht"));
		},
	});
	d.show();
}

function gutscheinEinloesen(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Gutschein einlösen"),
		fields: [
			{ fieldname: "code", fieldtype: "Data", label: __("Gutscheincode"), reqd: 1 },
			{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent, leer = so viel wie möglich)") },
		],
		primary_action_label: __("Einlösen"),
		primary_action(v) {
			d.hide();
			frm.call({ method: "gutschein_einloesen", doc: frm.doc, args: v, freeze: true }).then((r) => {
				const m = r.message || {};
				frappe.msgprint(__("{0} angerechnet, Gutschein-Rest {1}, offen {2}", [euro(m.betrag_cent), euro(m.rest_cent), euro(m.offen_cent)]));
				frm.reload_doc();
			});
		},
	});
	d.show();
}

function widerrufErfassen(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Widerruf erfassen"),
		fields: [
			{ fieldname: "kanal", fieldtype: "Select", label: __("Kanal"), options: ["E-Mail", "Brief", "Showroom", "Telefon"], default: "E-Mail" },
			{ fieldname: "text", fieldtype: "Small Text", label: __("Widerrufene Artikel / Text") },
		],
		primary_action_label: __("Anlegen"),
		primary_action(v) {
			d.hide();
			frm.call({ method: "widerruf_anlegen", doc: frm.doc, args: v, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Widerruf", r.message));
		},
	});
	d.show();
}

function stornieren(frm) {
	const bezahlt = Boolean(frm.doc.bezahlt_am);
	const d = new frappe.ui.Dialog({
		title: __("Stornieren & erstatten"),
		fields: [
			{ fieldname: "grund", fieldtype: "Data", label: __("Grund"), reqd: 1 },
			{ fieldname: "erstatten", fieldtype: "Check", label: __("Zahlung erstatten"), default: bezahlt ? 1 : 0, depends_on: `eval:${bezahlt}` },
			{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent, leer = voll)"), depends_on: "eval:doc.erstatten" },
		],
		primary_action_label: __("Stornieren"),
		primary_action(v) {
			d.hide();
			frappe.confirm(__("Bestellung {0} wirklich stornieren?", [frm.doc.name]), () => aufruf(frm, "stornieren", v, __("Storniert ({0})")));
		},
	});
	d.show();
}

// Teilstorno / Teilerstattung / Ersatzlieferung: Mengen je Position, Vorschau vom Server (USt je Satz)
function teilDialog(frm, methode) {
	const ersatz = methode === "ersatzlieferung_anlegen";
	const titel = { positionen_stornieren: __("Positionen stornieren"), teilerstatten: __("Teilerstattung"), ersatzlieferung_anlegen: __("Ersatzlieferung (0 €)") }[methode];
	const zeilen = (frm.doc.positionen || []).map((p) => ({ idx: p.idx, bezeichnung: p.bezeichnung, offen: (p.menge || 0) - (ersatz ? 0 : p.zurueck_menge || 0) }));
	const felder = zeilen.map((z) => ({ fieldname: `m_${z.idx}`, fieldtype: "Int", label: `${z.idx}. ${frappe.utils.escape_html(z.bezeichnung || "")} (${__("max.")} ${z.offen})`, default: 0 }));
	if (methode === "teilerstatten") {
		felder.push({ fieldname: "versand_cent", fieldtype: "Int", label: __("Versandanteil (Cent)"), default: 0 });
		felder.push({ fieldname: "kulanz_cent", fieldtype: "Int", label: __("Kulanz/Preisminderung ohne Rücknahme (Cent)"), default: 0 });
	}
	felder.push({ fieldname: "grund", fieldtype: "Data", label: __("Grund"), reqd: 1 });
	if (!ersatz) felder.push({ fieldname: "vorschau", fieldtype: "HTML" });
	const d = new frappe.ui.Dialog({ title: titel, fields: felder });
	const args = () => {
		const v = d.get_values(true) || {};
		const z = {};
		zeilen.forEach((r) => { if (v[`m_${r.idx}`] > 0) z[r.idx] = v[`m_${r.idx}`]; });
		return { zeilen: JSON.stringify(z), versand_cent: v.versand_cent || 0, kulanz_cent: v.kulanz_cent || 0, grund: v.grund };
	};
	const vorschau = () => {
		if (ersatz) return;
		const a = args();
		frm.call({ method: "erstattung_vorschau", doc: frm.doc, args: { zeilen: a.zeilen, versand_cent: a.versand_cent, kulanz_cent: a.kulanz_cent } }).then((r) => {
			const m = r.message || {};
			const posten = (m.posten || []).map((p) => `${p.satz_promille / 100} %: ${euro(p.brutto_cent)} (USt ${euro(p.ust_cent)})`).join("<br>");
			const weg = (m.verteilung || []).map((t) => `${frappe.utils.escape_html(t.kanal || "")} ${euro(t.betrag_cent)}`).join(", ");
			d.fields_dict.vorschau.$wrapper.html(`<div class="text-muted">${m.nur_forderung ? __("Unbezahlt – mindert nur die Forderung") : __("Erstattung")} <b>${euro(m.betrag_cent)}</b><br>${posten}${weg ? "<br>" + __("über") + " " + weg : ""}</div>`);
		}).catch(() => d.fields_dict.vorschau.$wrapper.html(""));
	};
	felder.filter((f) => f.fieldtype === "Int").forEach((f) => d.fields_dict[f.fieldname].$input.on("change", vorschau));
	d.set_primary_action(ersatz ? __("Anlegen") : __("Buchen"), () => {
		const a = args();
		if (!a.grund) return;
		const los = () => {
			d.hide();
			aufruf(frm, methode, ersatz ? { zeilen: a.zeilen, grund: a.grund } : a).then((r) => { if (ersatz && r.message) frappe.set_route("Form", "PH Bestellung", r.message); });
		};
		if (methode === "teilerstatten") frappe.confirm(__("Erstattung wirklich auslösen? Geld geht an den Kunden zurück."), los);
		else los();
	});
	d.show();
}
