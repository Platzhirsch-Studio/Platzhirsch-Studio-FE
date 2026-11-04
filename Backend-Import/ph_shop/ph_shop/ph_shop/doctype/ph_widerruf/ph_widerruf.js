// PH Widerruf – Eingangsbestätigung, Retoure, Ware erhalten, Erstatten, Ablehnen; Fristen im Kopf.
const FARBEN_W = { Eingegangen: "blue", Bestaetigt: "cyan", "Ware erwartet": "orange", "Ware erhalten": "purple", Erstattet: "green", Abgelehnt: "red" };

frappe.ui.form.on("PH Widerruf", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), FARBEN_W[frm.doc.status] || "gray");
		if (frm.doc.docstatus === 0 && !frm.is_new() && !frm.doc.zugeordnet) frm.dashboard.set_headline_alert(__("Nicht zugeordnet – Bestellung/E-Mail passen nicht zusammen. Bitte prüfen und Bestellung eintragen."), "orange");
		if (frm.doc.fristgerecht === 0) frm.dashboard.set_headline_alert(__("Widerrufsfrist war am {0} abgelaufen.", [frappe.datetime.str_to_user(frm.doc.frist_ende)]), "red");
		if (frm.is_new()) return;
		const s = frm.doc.status;
		if (frm.doc.mail_status !== "gesendet") frm.add_custom_button(__("Eingangsbestätigung senden"), () => frm.call({ method: "bestaetigung_senden", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
		if (frm.doc.bestellung && !frm.doc.retoure && ["Eingegangen", "Bestaetigt"].includes(s)) frm.add_custom_button(__("Retoure anlegen"), () => frm.call({ method: "retoure_anlegen", doc: frm.doc, freeze: true }).then((r) => frappe.set_route("Form", "PH Retoure", r.message)), __("Aktionen"));
		if (["Bestaetigt", "Ware erwartet"].includes(s)) frm.add_custom_button(__("Ware erhalten"), () => frm.call({ method: "ware_erhalten", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		if (["Bestaetigt", "Ware erhalten", "Ware erwartet"].includes(s) && frappe.user.has_role(["PH Shop Leitung", "PH Geschäftsführung", "System Manager"])) {
			frm.add_custom_button(__("Erstatten"), () => frappe.prompt([
				{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent, leer = voll)"), default: frm.doc.erstattungsbetrag_cent },
				{ fieldname: "grund", fieldtype: "Data", label: __("Grund"), default: __("Widerruf {0}", [frm.doc.name]) },
			], (v) => frm.call({ method: "erstatten", doc: frm.doc, args: v, freeze: true }).then(() => frm.reload_doc()), __("Erstatten")), __("Aktionen"));
			frm.add_custom_button(__("Ablehnen"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Ablehnungsgrund"), reqd: 1 }, (v) => frm.call({ method: "ablehnen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Ablehnen")), __("Aktionen"));
		}
		if (frm.doc.bestellung) frm.add_custom_button(__("Bestellung öffnen"), () => frappe.set_route("Form", "PH Bestellung", frm.doc.bestellung));
		if (frm.doc.gutschein_bestellung) frm.add_custom_button(__("Gutschein-Bestellung öffnen"), () => frappe.set_route("Form", "PH Gutschein Bestellung", frm.doc.gutschein_bestellung));
		if (frm.doc.retoure) frm.add_custom_button(__("Retoure öffnen"), () => frappe.set_route("Form", "PH Retoure", frm.doc.retoure));
		if (frm.doc.erstattung_bis) frm.dashboard.add_indicator(__("Rückzahlung bis {0}", [frappe.datetime.str_to_user(frm.doc.erstattung_bis)]), frappe.datetime.get_diff(frm.doc.erstattung_bis, frappe.datetime.get_today()) < 3 ? "red" : "blue");
	},
});
