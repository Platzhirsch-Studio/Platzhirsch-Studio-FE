// PH Kassenabschluss – Buttons: Neu berechnen, Zählen, Abschließen (Leitung), Öffnen (Leitung), Kassa öffnen.
frappe.ui.form.on("PH Kassenabschluss", {
	refresh(frm) {
		const farben = { Offen: "blue", Gezaehlt: "orange", Abgeschlossen: "green", Korrigiert: "purple" };
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		zeigeSummen(frm);
		if (frm.is_new()) return;

		const leitung = frappe.user.has_role("PH Kassa Leitung") || frappe.user.has_role("System Manager");

		if (frm.doc.status !== "Abgeschlossen") {
			frm.add_custom_button(__("Soll neu berechnen"), () => {
				frm.call({ method: "neu_berechnen", doc: frm.doc, freeze: true }).then(() => frm.reload_doc());
			}, __("Aktionen"));
			frm.add_custom_button(__("Zählung übernehmen"), () => {
				frm.call({ method: "zaehlen", doc: frm.doc, args: { zaehlprotokoll: frm.doc.zaehlprotokoll.map((z) => ({ stueckelung_cent: z.stueckelung_cent, anzahl: z.anzahl })), bargeld_anfang_cent: frm.doc.bargeld_anfang_cent, unterschrift: frm.doc.unterschrift, unterschrift_name: frm.doc.unterschrift_name }, freeze: true }).then((r) => {
					frm.reload_doc();
					frappe.show_alert({ message: __("Gezählt: {0}, Differenz {1}", [format_currency(r.message.bargeld_ist_cent / 100, "EUR"), format_currency(r.message.differenz_cent / 100, "EUR")]), indicator: r.message.differenz_cent ? "orange" : "green" });
				});
			}, __("Aktionen"));
		}
		if (frm.doc.status === "Gezaehlt" && leitung) {
			frm.add_custom_button(__("Tag abschließen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Tagesabschluss {0}", [frm.doc.kasse]),
					fields: [
						{ fieldname: "info", fieldtype: "HTML", options: `<p>${__("Soll")}: <b>${format_currency(frm.doc.bargeld_soll_cent / 100, "EUR")}</b> · ${__("Ist")}: <b>${format_currency(frm.doc.bargeld_ist_cent / 100, "EUR")}</b> · ${__("Differenz")}: <b>${format_currency(frm.doc.differenz_cent / 100, "EUR")}</b></p>` },
						{ fieldname: "differenz_grund", fieldtype: "Small Text", label: __("Grund der Differenz"), default: frm.doc.differenz_grund, reqd: !!frm.doc.differenz_cent },
					],
					primary_action_label: __("Abschließen"),
					primary_action(v) {
						frappe.confirm(__("Danach sind für diese Kasse heute keine Belege mehr möglich. Abschließen?"), () => {
							frm.call({ method: "abschliessen", doc: frm.doc, args: v, freeze: true, freeze_message: __("Tag wird abgeschlossen …") }).then(() => { d.hide(); frm.reload_doc(); });
						});
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		if (frm.doc.status === "Abgeschlossen" && leitung) {
			frm.add_custom_button(__("Öffnen (Korrektur)"), () => {
				frappe.prompt([{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }], (v) => {
					frm.call({ method: "oeffnen", doc: frm.doc, args: v }).then(() => frm.reload_doc());
				}, __("Abschluss öffnen"));
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Kassenbuch des Tages"), () => frappe.set_route("List", "PH Kassenbuch", { kasse: frm.doc.kasse, datum: frm.doc.datum }));
		frm.add_custom_button(__("Kassa öffnen"), () => frappe.set_route("ph-kassa", { kasse: frm.doc.kasse }));
		if (frm.doc.status === "Abgeschlossen") frm.set_read_only();
	},
});

frappe.ui.form.on("PH Kassenabschluss Zaehlung", {
	anzahl(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		row.summe_cent = (row.stueckelung_cent || 0) * (row.anzahl || 0);
		frm.refresh_field("zaehlprotokoll");
		zeigeSummen(frm);
	},
});

function zeigeSummen(frm) {
	const ist = (frm.doc.zaehlprotokoll || []).reduce((s, z) => s + (z.stueckelung_cent || 0) * (z.anzahl || 0), 0);
	const diff = ist - (frm.doc.bargeld_soll_cent || 0);
	frm.dashboard.clear_headline();
	frm.dashboard.set_headline(
		`${__("Soll")} <b>${format_currency((frm.doc.bargeld_soll_cent || 0) / 100, "EUR")}</b> · ${__("Gezählt")} <b>${format_currency(ist / 100, "EUR")}</b> · ${__("Differenz")} <b style="color:${diff ? "#b45309" : "#15803d"}">${format_currency(diff / 100, "EUR")}</b>`
	);
}
