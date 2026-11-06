// PH Zahlung – Rückerstatten (Teil/Voll, Grund, Vier-Augen), Freigabe, Beleg, Stripe-Link.
const FARBEN_ZAHLUNG = { Angekuendigt: "blue", Bezahlt: "green", Fehlgeschlagen: "red", Erstattet: "gray", Teilerstattet: "orange", Storniert: "gray", "Erstattung angefordert": "purple" };
const euroZ = (cent) => format_currency((cent || 0) / 100, "EUR");

frappe.ui.form.on("PH Zahlung", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), FARBEN_ZAHLUNG[frm.doc.status] || "gray");
		if (!frm.doc.livemode && frm.doc.kanal && frm.doc.kanal.startsWith("Stripe")) frm.dashboard.set_headline_alert(__("Stripe-Testzahlung (livemode = 0)."), "orange");
		if (frm.doc.radar_markiert) frm.dashboard.set_headline_alert(__("Stripe Radar: erhöhtes Risiko ({0}, Wert {1}).", [frappe.utils.escape_html(frm.doc.radar_risk_level || "–"), frm.doc.radar_risk_score ?? "–"]), "red");
		if (frm.doc.dispute_id) frm.dashboard.set_headline_alert(__("Zahlungsstreit {0}: {1} · {2} · Antwort bis {3}", [frappe.utils.escape_html(frm.doc.dispute_id), frappe.utils.escape_html(frm.doc.dispute_status || "–"), euroZ(frm.doc.dispute_betrag_cent), frm.doc.dispute_frist ? frappe.datetime.str_to_user(frm.doc.dispute_frist) : "–"]), "red");
		const leitungAnk = frappe.user.has_role(["PH Shop Leitung", "PH Geschäftsführung", "System Manager", "PH Faktura Leitung", "PH Kassa Leitung"]);
		if (!frm.is_new() && frm.doc.docstatus === 0 && frm.doc.status === "Angekuendigt" && leitungAnk) {
			frm.add_custom_button(__("Ankündigung stornieren"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Data", label: __("Grund"), reqd: 1 }, (v) => frm.call({ method: "ankuendigung_stornieren", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Stornieren")), __("Aktionen"));
		}
		if (!frm.is_new() && frm.doc.radar_markiert && !frm.doc.radar_geprueft_von) frm.add_custom_button(__("Risiko geprüft"), () => frm.call({ method: "radar_geprueft", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		if (frm.is_new() || frm.doc.docstatus !== 1) return;
		const offen =(frm.doc.betrag_cent || 0) - (frm.doc.erstattet_cent || 0);
		const leitung = frappe.user.has_role(["PH Shop Leitung", "PH Geschäftsführung", "System Manager", "PH Faktura Leitung", "PH Kassa Leitung"]);
		const gf = frappe.user.has_role(["PH Geschäftsführung", "System Manager"]);

		if (frm.doc.art === "Eingang" && offen > 0 && leitung && frm.doc.status !== "Erstattung angefordert") {
			frm.add_custom_button(__("Rückerstatten"), () => rueckerstatten(frm, offen), __("Aktionen"));
		}
		if (frm.doc.status === "Erstattung angefordert") {
			frm.dashboard.set_headline_alert(__("Erstattung über {0} angefordert von {1} – Freigabe durch Geschäftsführung.", [euroZ(frm.doc.erstattung_angefordert_cent), frm.doc.erstattung_angefordert_von]), "purple");
			if (gf) {
				frm.add_custom_button(__("Erstattung freigeben"), () => frappe.confirm(__("Erstattung über {0} jetzt ausführen?", [euroZ(frm.doc.erstattung_angefordert_cent)]), () => frm.call({ method: "erstattung_freigeben", doc: frm.doc, freeze: true }).then(() => frm.reload_doc())), __("Aktionen"));
				frm.add_custom_button(__("Erstattung ablehnen"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Data", label: __("Grund") }, (v) => frm.call({ method: "erstattung_ablehnen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Ablehnen")), __("Aktionen"));
			}
		}
		frm.add_custom_button(__("Beleg (PDF)"), () => frappe.set_route("print", "PH Zahlung", frm.doc.name), __("Aktionen"));
		if (frm.doc.kanal && frm.doc.kanal.startsWith("Stripe") && !frm.doc.stripe_auszahlung) {
			frm.add_custom_button(__("Auszahlung zuordnen"), () => frappe.prompt({ fieldname: "auszahlung", fieldtype: "Link", options: "PH Stripe Auszahlung", label: __("Auszahlung"), reqd: 1 }, (v) => frm.call({ method: "auszahlung_zuordnen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Zuordnen")), __("Aktionen"));
		}
		if (frm.doc.bezug_doctype && frm.doc.bezug) frm.add_custom_button(__("Bezug öffnen"), () => frappe.set_route("Form", frm.doc.bezug_doctype, frm.doc.bezug));
		if (frm.doc.ursprung) frm.add_custom_button(__("Ursprungszahlung"), () => frappe.set_route("Form", "PH Zahlung", frm.doc.ursprung));
		if (frm.doc.stripe_payment_intent) {
			const live = frm.doc.livemode ? "" : "test/";
			frm.add_custom_button(__("In Stripe öffnen"), () => window.open(`https://dashboard.stripe.com/${live}payments/${frm.doc.stripe_payment_intent}`, "_blank"));
		}
		frm.dashboard.add_indicator(__("{0} {1}", [frm.doc.art, euroZ(frm.doc.betrag_cent)]), frm.doc.art === "Erstattung" ? "orange" : "green");
		if (frm.doc.erstattet_cent) frm.dashboard.add_indicator(__("Erstattet {0}", [euroZ(frm.doc.erstattet_cent)]), "orange");
	},
});

function rueckerstatten(frm, offen) {
	const d = new frappe.ui.Dialog({
		title: __("Rückerstatten"),
		fields: [
			{ fieldname: "art", fieldtype: "Select", label: __("Umfang"), options: [__("Voll"), __("Teil")], default: __("Voll") },
			{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent)"), default: offen, reqd: 1, description: __("Offen: {0}", [euroZ(offen)]) },
			{ fieldname: "grund", fieldtype: "Select", label: __("Grund"), options: ["Widerruf", "Retoure", "Storno", "Doppelte Zahlung", "Kulanz", "Reklamation", "Sonstiges"], reqd: 1 },
			{ fieldname: "hinweis", fieldtype: "Data", label: __("Hinweis") },
		],
		primary_action_label: __("Erstatten"),
		primary_action(v) {
			const betrag = v.art === __("Voll") ? offen : v.betrag_cent;
			d.hide();
			frappe.confirm(__("{0} über {1} erstatten? Bei Stripe wird der Refund sofort ausgelöst.", [frm.doc.kanal, euroZ(betrag)]), () => {
				frm.call({ method: "rueckerstatten", doc: frm.doc, args: { betrag_cent: betrag, grund: v.hinweis ? `${v.grund}: ${v.hinweis}` : v.grund }, freeze: true }).then((r) => {
					const m = r.message || {};
					if (m.angefordert) frappe.msgprint(__("Über der Vier-Augen-Grenze: Freigabe durch die Geschäftsführung angefordert."));
					else frappe.show_alert({ message: __("Gegenbuchung {0}{1}", [m.gegenbuchung, m.simuliert ? " (Stripe simuliert)" : ""]), indicator: "green" });
					frm.reload_doc();
				});
			});
		},
	});
	d.show();
}
