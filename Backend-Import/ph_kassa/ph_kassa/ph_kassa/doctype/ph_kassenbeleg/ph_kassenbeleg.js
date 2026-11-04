// PH Kassenbeleg – unveränderlicher Beleg. Buttons: Stornieren (Leitung), Nullbeleg, Beleg prüfen (Code anzeigen).

frappe.ui.form.on("PH Kassenbeleg", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Entwurf: "gray", Signiert: "green", Ausfall: "orange", Nachsigniert: "blue", Storniert: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) {
			frm.dashboard.set_headline_alert(__("Kassenbelege entstehen nur über die Kassa-Oberfläche oder die Buttons in PH Kasse – nicht manuell."), "red");
			frm.disable_save();
			return;
		}
		if (frm.doc.trainings) frm.dashboard.set_headline_alert(__("TRAININGSBELEG – kein Umsatz."), "orange");
		if (frm.doc.see_ausgefallen && !frm.doc.nachsigniert) frm.dashboard.set_headline_alert(__("Signatur „Sicherheitseinrichtung ausgefallen“ – Sammelbeleg folgt nach Wiederanlauf der SEE."), "orange");
		if (frm.doc.storniert_durch) frm.dashboard.set_headline_alert(__("Storniert durch {0}", [frm.doc.storniert_durch]), "red");

		if (frm.doc.docstatus !== 1) return;

		frm.add_custom_button(__("Beleg prüfen (Code anzeigen)"), () => {
			frm.call({ method: "pruefen", doc: frm.doc, freeze: true }).then((r) => {
				if (!r.message) return;
				const e = r.message;
				const status = e.ausfall ? __("Ausfallsignatur (nicht prüfbar)") : e.signatur_ok === null ? __("nicht geprüft") : e.signatur_ok ? __("gültig, Verkettung stimmt") : __("UNGÜLTIG");
				const farbe = e.ausfall ? "orange" : e.signatur_ok ? "green" : "red";
				const f = e.felder;
				frappe.msgprint({
					title: __("RKSV-Beleg {0}", [frm.doc.name]),
					indicator: farbe,
					wide: true,
					message: `<p><b>${__("Signatur")}:</b> ${status}${e.fehler.length ? "<ul><li>" + e.fehler.map(frappe.utils.escape_html).join("</li><li>") + "</li></ul>" : ""}</p>
<table class="table table-bordered table-sm"><tr><td>${__("Kassen-ID / Belegnr.")}</td><td>${frappe.utils.escape_html(f.kassen_id)} / ${f.belegnummer}</td></tr>
<tr><td>${__("Datum")}</td><td>${f.datum}</td></tr><tr><td>${__("ZDA / Zertifikat")}</td><td>${f.zda_id} / ${frappe.utils.escape_html(f.zertifikat_seriennummer)}</td></tr>
<tr><td>${__("Zählerfeld")}</td><td><code>${f.zaehler_feld}</code></td></tr><tr><td>${__("Sig. Vorbeleg")}</td><td><code>${f.sig_vorbeleg}</code></td></tr></table>
<p><b>${__("Maschinenlesbarer Code (QR)")}</b></p><pre style="white-space:pre-wrap;word-break:break-all">${frappe.utils.escape_html(e.code)}</pre>
<p><b>${__("OCR")}</b></p><pre style="white-space:pre-wrap;word-break:break-all">${frappe.utils.escape_html(e.ocr || "")}</pre>
<p class="text-muted">${__("Zur amtlichen Prüfung den QR-Code mit der BMF Belegcheck-App scannen.")}</p>`,
				});
			});
		}, __("Aktionen"));

		frm.add_custom_button(__("Nullbeleg"), () => {
			frm.call({ method: "nullbeleg", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Kassenbeleg", r.message));
		}, __("Aktionen"));

		const stornierbar = ["Standard", "Trainingsbeleg"].includes(frm.doc.belegart) && !frm.doc.storniert_durch && frappe.user.has_role(["PH Kassa Leitung", "System Manager"]);
		if (stornierbar) {
			frm.add_custom_button(__("Stornieren"), () => {
				frappe.prompt(
					{ fieldname: "grund", fieldtype: "Small Text", label: __("Stornogrund"), reqd: 1 },
					(v) => {
						frappe.confirm(__("Stornobeleg (Gegenbeleg mit negativen Beträgen) erzeugen? Der Originalbeleg bleibt in der Kette."), () => {
							frm.call({ method: "stornieren", doc: frm.doc, args: v, freeze: true, freeze_message: __("Stornobeleg wird signiert …") }).then((r) => {
								frm.reload_doc();
								if (r.message) frappe.set_route("Form", "PH Kassenbeleg", r.message);
							});
						});
					},
					__("Beleg stornieren"),
					__("Stornobeleg erzeugen")
				);
			}, __("Aktionen"));
		}
		if (frm.doc.vorbeleg) frm.add_custom_button(__("Vorbeleg"), () => frappe.set_route("Form", "PH Kassenbeleg", frm.doc.vorbeleg));
		if (frm.doc.storno_von) frm.add_custom_button(__("Originalbeleg"), () => frappe.set_route("Form", "PH Kassenbeleg", frm.doc.storno_von));

		// QR-Vorschau im Formular (RKSV-Abschnitt)
		frm.call({ method: "qr_svg", doc: frm.doc }).then((r) => {
			if (r.message) frm.set_df_property("maschinenlesbarer_code", "description", `<div style="max-width:180px">${r.message}</div>`);
		});
	},
});
