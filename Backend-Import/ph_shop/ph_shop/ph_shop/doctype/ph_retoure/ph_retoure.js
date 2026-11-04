// PH Retoure – Eingang, Prüfung, Erstattung, Ablehnung.
const FARBEN_R = { Angekuendigt: "blue", "Label gesendet": "cyan", Unterwegs: "orange", Eingegangen: "purple", Geprueft: "yellow", Erstattet: "green", Abgelehnt: "red" };

frappe.ui.form.on("PH Retoure", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), FARBEN_R[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		const s = frm.doc.status;
		if (["Angekuendigt", "Label gesendet", "Unterwegs"].includes(s)) frm.add_custom_button(__("Ware eingegangen"), () => frm.call({ method: "eingegangen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		if (s === "Eingegangen") frm.add_custom_button(__("Prüfung abschließen"), () => frappe.confirm(__("Wertminderung {0}, Erstattung {1} – Prüfung abschließen?", [format_currency((frm.doc.wertminderung_cent || 0) / 100, "EUR"), format_currency((frm.doc.erstattungsbetrag_cent || 0) / 100, "EUR")]), () => frm.call({ method: "pruefung_abschliessen", doc: frm.doc }).then(() => frm.reload_doc())), __("Aktionen"));
		if (s === "Geprueft" && frappe.user.has_role(["PH Shop Leitung", "PH Geschäftsführung", "System Manager"])) frm.add_custom_button(__("Erstatten"), () => frappe.confirm(__("{0} erstatten?", [format_currency((frm.doc.erstattungsbetrag_cent || 0) / 100, "EUR")]), () => frm.call({ method: "erstatten", doc: frm.doc, freeze: true }).then(() => frm.reload_doc())), __("Aktionen"));
		if (!["Erstattet", "Abgelehnt"].includes(s)) frm.add_custom_button(__("Ablehnen"), () => frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }, (v) => frm.call({ method: "ablehnen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Ablehnen")), __("Aktionen"));
		frm.add_custom_button(__("Bestellung öffnen"), () => frappe.set_route("Form", "PH Bestellung", frm.doc.bestellung));
		if (frm.doc.widerruf) frm.add_custom_button(__("Widerruf öffnen"), () => frappe.set_route("Form", "PH Widerruf", frm.doc.widerruf));
	},
});

frappe.ui.form.on("PH Retoure Position", {
	wertminderung_cent(frm) {
		frm.set_value("wertminderung_cent", (frm.doc.positionen || []).reduce((s, p) => s + (p.wertminderung_cent || 0), 0));
	},
});
