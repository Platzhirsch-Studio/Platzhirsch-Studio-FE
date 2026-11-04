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
