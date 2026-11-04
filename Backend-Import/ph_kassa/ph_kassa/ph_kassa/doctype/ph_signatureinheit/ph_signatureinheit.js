// PH Signatureinheit – Zertifikat abrufen, Verbindung prüfen, Testschlüssel, Ausfall (WP10a).

frappe.ui.form.on("PH Signatureinheit", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Angelegt: "gray", Registriert: "blue", Aktiv: "green", Ausgefallen: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.art === "Test") frm.dashboard.set_headline_alert(__("Test-SEE: Belege sind NICHT RKSV-gültig. Nur Staging."), "orange");
		if (!frm.doc.zertifikat_seriennummer) frm.dashboard.set_headline_alert(__("Noch kein Zertifikat – „Zertifikat abrufen“ (Zugang in site_config: {0}).", [frm.doc.zugang_schluesselname]), "orange");

		frm.add_custom_button(__("Zertifikat abrufen"), () => {
			frm.call({ method: "zertifikat_abrufen", doc: frm.doc, freeze: true, freeze_message: __("Zertifikat wird abgerufen …") }).then((r) => {
				frm.reload_doc();
				if (r.message) frappe.show_alert({ message: __("Seriennummer {0} ({1}), gültig bis {2}", [r.message.seriennummer, r.message.vda_id, r.message.gueltig_bis]), indicator: "green" });
			});
		}, __("Aktionen"));
		frm.add_custom_button(__("Verbindung prüfen"), () => {
			frm.call({ method: "verbindung_pruefen", doc: frm.doc, freeze: true }).then((r) => {
				frm.reload_doc();
				if (r.message) frappe.msgprint({ title: __("Verbindungstest"), indicator: r.message.ok ? "green" : "red", message: frappe.utils.escape_html(r.message.text) });
			});
		}, __("Aktionen"));
		if (frm.doc.art === "Test") {
			frm.add_custom_button(__("Testschlüssel erzeugen"), () => {
				frm.call({ method: "testschluessel_erzeugen", doc: frm.doc }).then((r) => {
					if (!r.message) return;
					frappe.msgprint({
						title: __("Einmalige Anzeige – in site_config eintragen"),
						indicator: "orange",
						message: `<p>${__("Schlüsselname")}: <code>${r.message.schluesselname}</code></p><pre style="white-space:pre-wrap">${frappe.utils.escape_html(r.message.pem)}</pre><p>${__("Als JSON-String (Zeilenumbrüche als \\n) eintragen, dann bench restart und „Zertifikat abrufen“.")}</p>`,
					});
				});
			}, __("Aktionen"));
		}
		if (frappe.user.has_role(["PH Kassa Leitung", "System Manager"])) {
			if (frm.doc.status !== "Ausgefallen") {
				frm.add_custom_button(__("Ausfall melden"), () => {
					frappe.prompt({ fieldname: "notiz", fieldtype: "Small Text", label: __("Grund/Notiz"), reqd: 1 }, (v) => frm.call({ method: "ausfall_melden", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("SEE-Ausfall melden"));
				}, __("Ausfall"));
			} else {
				frm.add_custom_button(__("Ausfall beenden"), () => {
					frappe.confirm(__("SEE wieder in Betrieb nehmen? Je Kasse wird ein Sammelbeleg signiert."), () => frm.call({ method: "ausfall_beenden", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()));
				}, __("Ausfall"));
			}
		}
	},
});
