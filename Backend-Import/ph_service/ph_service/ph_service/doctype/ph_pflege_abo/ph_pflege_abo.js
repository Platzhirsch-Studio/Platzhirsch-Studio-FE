frappe.ui.form.on("PH Pflege Abo", {
	refresh(frm) {
		const f = { Angefragt: "blue", Angeboten: "orange", Aktiv: "green", Pausiert: "yellow", Gekuendigt: "red", Beendet: "gray" };
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), f[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (["Aktiv", "Angeboten"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Nächsten Termin planen"), () => {
				frappe.prompt([
					{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), reqd: 1, default: frm.doc.naechster_termin || frappe.datetime.add_days(frappe.datetime.get_today(), 14) },
					{ fieldname: "zeit_von", fieldtype: "Time", label: __("von"), default: "08:00:00" },
					{ fieldname: "zeit_bis", fieldtype: "Time", label: __("bis"), default: "12:00:00" },
					{ fieldname: "techniker", fieldtype: "Link", options: "User", label: __("Techniker"), default: frm.doc.techniker },
				], (v) => frm.call({ method: "einsatz_planen", doc: frm.doc, args: v, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Serviceeinsatz", r.message)), __("Einsatz planen"));
			}, __("Aktionen"));
		}
		if (frm.doc.status === "Aktiv" && frm.doc.kontakt_email) {
			frm.add_custom_button(__("Erinnerung senden"), () => frappe.confirm(__("Wartungs-/Pflegeerinnerung an {0} senden?", [frm.doc.kontakt_email]), () => frm.call({ method: "erinnerung_senden", doc: frm.doc, freeze: true }).then(() => frm.reload_doc())), __("Aktionen"));
		}
		frm.add_custom_button(__("Protokoll erfassen"), () => {
			frappe.prompt([
				{ fieldname: "datum", fieldtype: "Date", label: __("Datum"), reqd: 1, default: frappe.datetime.get_today() },
				{ fieldname: "durchgefuehrt_von", fieldtype: "Data", label: __("Durchgeführt von") },
				{ fieldname: "leistungen", fieldtype: "Small Text", label: __("Leistungen"), reqd: 1 },
				{ fieldname: "empfohlene_produkte", fieldtype: "Small Text", label: __("Empfohlene Pflegemittel") },
				{ fieldname: "im_portal", fieldtype: "Check", label: __("Im Kundenportal zeigen"), default: 1 },
			], (v) => frm.call({ method: "protokoll_erfassen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Protokoll"));
		}, __("Aktionen"));
		frm.add_custom_button(__("Pflegeprotokoll (PDF)"), () => frm.print_doc("PH Pflegeprotokoll"), __("Drucken"));
		if (frm.doc.ueberfaellig) frm.dashboard.set_headline_alert(__("Wartung/Pflege überfällig (fällig {0}).", [frappe.datetime.str_to_user(frm.doc.naechster_termin)]), "red");
		if (!frm.doc.preis_cent) frm.dashboard.add_indicator(__("Preis auf Anfrage"), "orange");
		frm.call({ method: "geplante_termine", doc: frm.doc, args: { anzahl: 4 } }).then((r) => {
			if (r.message && r.message.length) frm.dashboard.add_comment(__("Nächste Termine: {0}", [r.message.map((d) => frappe.datetime.str_to_user(d)).join(" · ")]), "blue", true);
		});
	},
	bereich(frm) {
		const std = { Whirlpool: 12, Sauna: 12, "Pool-Technik": 6 }[frm.doc.bereich];
		if (std && !frm.doc.intervall_monate) frm.set_value("intervall_monate", std);
		if (["Whirlpool", "Sauna", "Pool-Technik"].includes(frm.doc.bereich) && frm.doc.art !== "Wartungsvertrag") frm.set_value("art", "Wartungsvertrag");
	},
});
