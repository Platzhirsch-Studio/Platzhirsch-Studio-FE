// PH Gutschein – Einlösung buchen, Sperren/Entsperren, PDF senden, Ersetzen; Klartext-Code nur einmalig.
const FARBEN_GS = { Erstellt: "blue", Aktiv: "green", "Teilweise eingeloest": "orange", Eingeloest: "gray", Gesperrt: "red", Abgelaufen: "gray", Erstattet: "gray" };
const euroG = (cent) => format_currency((cent || 0) / 100, "EUR");

frappe.ui.form.on("PH Gutschein", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), FARBEN_GS[frm.doc.status] || "gray");
		if (frm.doc.test) frm.dashboard.set_headline_alert(__("Testgutschein – nicht einlösbar im Live-Betrieb."), "orange");
		if (frm.doc.hinweis) frm.dashboard.set_headline_alert(frappe.utils.escape_html(frm.doc.hinweis), "red");
		if (frm.is_new()) {
			frm.dashboard.set_headline_alert(__("Der Code wird beim Speichern erzeugt und genau einmal angezeigt."), "blue");
			return;
		}
		const einloesbar = ["Aktiv", "Teilweise eingeloest"].includes(frm.doc.status);
		const leitung = frappe.user.has_role(["PH Shop Leitung", "PH Geschäftsführung", "System Manager"]);
		if (einloesbar) {
			frm.add_custom_button(__("Einlösung buchen"), () => einloesen(frm), __("Aktionen"));
			frm.add_custom_button(__("Ersetzen (neuer Code)"), () => frappe.confirm(__("Alten Code sperren und Ersatzgutschein über {0} ausstellen?", [euroG(frm.doc.rest_cent)]), () => {
				frm.call({ method: "ersetzen", doc: frm.doc, freeze: true }).then((r) => {
					const m = r.message || {};
					frappe.msgprint({ title: __("Ersatzgutschein {0}", [m.gutschein]), message: __("Neuer Code (nur jetzt sichtbar): <b>{0}</b>", [m.code]), indicator: "green" });
					frm.reload_doc();
				});
			}), __("Aktionen"));
		}
		if (einloesbar && leitung) frm.add_custom_button(__("Sperren"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Data", label: __("Sperrgrund"), reqd: 1 }, (v) => frm.call({ method: "sperren", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Sperren")), __("Aktionen"));
		if (frm.doc.status === "Gesperrt" && leitung) frm.add_custom_button(__("Entsperren"), () => frm.call({ method: "entsperren", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		if (frm.doc.pdf) {
			frm.add_custom_button(__("PDF senden"), () => frappe.prompt({ fieldname: "empfaenger", fieldtype: "Data", options: "Email", label: __("An"), default: frm.doc.kaeufer_email, reqd: 1 }, (v) => frm.call({ method: "pdf_senden", doc: frm.doc, args: v, freeze: true }).then(() => { frappe.show_alert({ message: __("Gesendet"), indicator: "green" }); frm.reload_doc(); }), __("Senden")), __("Aktionen"));
			frm.add_custom_button(__("PDF öffnen"), () => window.open(frm.doc.pdf, "_blank"));
		} else {
			frm.add_custom_button(__("PDF erzeugen (ohne Code)"), () => frappe.msgprint(__("Der Klartext-Code ist nicht gespeichert. PDF mit Code gibt es nur bei der Ausgabe oder über „Ersetzen“.")), __("Aktionen"));
		}
		if (frm.doc.gutschein_bestellung) frm.add_custom_button(__("Bestellung öffnen"), () => frappe.set_route("Form", "PH Gutschein Bestellung", frm.doc.gutschein_bestellung));
		frm.dashboard.add_indicator(__("Rest {0} von {1}", [euroG(frm.doc.rest_cent), euroG(frm.doc.wert_cent)]), frm.doc.rest_cent > 0 ? "green" : "gray");
	},
});

function einloesen(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Einlösung buchen"),
		fields: [
			{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent)"), default: frm.doc.rest_cent, reqd: 1, description: __("Restwert {0}", [euroG(frm.doc.rest_cent)]) },
			{ fieldname: "kanal", fieldtype: "Select", label: __("Kanal"), options: ["Showroom", "Online", "Kassa"], default: "Showroom", reqd: 1 },
			{ fieldname: "beleg_doctype", fieldtype: "Link", options: "DocType", label: __("Beleg (Typ)"), get_query: () => ({ filters: { name: ["in", ["PH Bestellung", "PH Rechnung", "PH Kassenbeleg", "PH Auftragsbestaetigung"]] } }) },
			{ fieldname: "beleg", fieldtype: "Dynamic Link", options: "beleg_doctype", label: __("Beleg") },
			{ fieldname: "zahlung_buchen", fieldtype: "Check", label: __("PH Zahlung (Kanal Gutschein) buchen"), default: 1 },
			{ fieldname: "hinweis", fieldtype: "Data", label: __("Hinweis") },
		],
		primary_action_label: __("Einlösen"),
		primary_action(v) {
			if (v.betrag_cent > frm.doc.rest_cent) return frappe.msgprint(__("Betrag übersteigt den Restwert."));
			d.hide();
			frm.call({ method: "einloesen", doc: frm.doc, args: v, freeze: true }).then((r) => {
				frappe.show_alert({ message: __("Eingelöst, Rest {0}", [euroG(r.message.rest_cent)]), indicator: "green" });
				frm.reload_doc();
			});
		},
	});
	d.show();
}
