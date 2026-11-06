// PH Kasse – Buttons des RKSV-Kerns (WP10a): Startbeleg, Nullbeleg, Monats-/Jahresbeleg, Schlussbeleg,
// DEP exportieren, SEE-Ausfall melden/beenden, Kette prüfen, AES-Schlüssel, Registrierungsdaten.

frappe.ui.form.on("PH Kasse", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Angelegt: "gray", Registriert: "blue", Aktiv: "green", Ausgefallen: "red", "Ausser Betrieb": "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) {
			frm.dashboard.set_headline_alert(__("Nach dem Speichern: AES-Schlüssel erzeugen, in site_config eintragen, SEE zuordnen, FinanzOnline-Checkliste abarbeiten."), "blue");
			return;
		}
		if (!frm.doc.aes_schluessel_vorhanden) frm.dashboard.set_headline_alert(__("Kein AES-Schlüssel in site_config ({0}).", [frm.doc.aes_schluessel_name]), "red");
		else if (!frm.doc.startbeleg) frm.dashboard.set_headline_alert(__("Noch kein Startbeleg. Vorher: SEE und Kasse in FinanzOnline registrieren."), "orange");
		else if (!frm.doc.startbeleg_geprueft_am) frm.dashboard.set_headline_alert(__("Startbeleg mit der BMF Belegcheck-App prüfen und in der Checkliste bestätigen."), "orange");
		if (frm.doc.status === "Ausgefallen") frm.dashboard.set_headline_alert(__("SEE ausgefallen – Belege erhalten die Ausfallsignatur. Nach > 48 h FinanzOnline-Meldung."), "red");

		const ausser = frm.doc.status === "Ausser Betrieb";
		const leitung = frappe.user.has_role(["PH Kassa Leitung", "System Manager"]);

		if (!frm.doc.aes_schluessel_vorhanden) {
			frm.add_custom_button(__("AES-Schlüssel erzeugen"), () => {
				frm.call({ method: "aes_schluessel_erzeugen", doc: frm.doc }).then((r) => {
					if (!r.message) return;
					const m = r.message;
					frappe.msgprint({
						title: __("Einmalige Anzeige – jetzt sichern"),
						indicator: "red",
						message: `<p>${__("In sites/&lt;site&gt;/site_config.json eintragen, dann bench restart:")}</p><pre>"${m.schluesselname}": "${m.schluessel_b64}"</pre><p>${__("Prüfwert für FinanzOnline")}: <b>${m.pruefwert}</b></p><p>${__("Schlüssel zusätzlich im Passwort-Tresor ablegen. Verlust = DEP nicht prüfbar.")}</p>`,
					});
				});
			}, __("Einrichtung"));
		}
		frm.add_custom_button(__("Registrierungsdaten FinanzOnline"), () => {
			frm.call({ method: "registrierungsdaten", doc: frm.doc }).then((r) => {
				if (!r.message) return;
				const d = r.message;
				let html = `<table class="table table-bordered"><tr><td>${__("Kassen-ID")}</td><td><b>${frappe.utils.escape_html(d.kassenidentifikationsnummer)}</b></td></tr><tr><td>${__("AES-Prüfwert")}</td><td><b>${d.aes_schluessel_pruefwert}</b></td></tr><tr><td>${__("Kassentyp")}</td><td>${d.kassentyp}</td></tr>`;
				if (d.see) html += `<tr><td>${__("SEE")}</td><td>${d.see.art} · ${d.see.vertrauensdiensteanbieter}<br>${__("Seriennummer hex")}: <b>${d.see.zertifikat_seriennummer_hex || "–"}</b><br>${__("dezimal")}: ${d.see.zertifikat_seriennummer_dezimal || "–"}</td></tr>`;
				frappe.msgprint({ title: __("Registrierung in FinanzOnline (manuell durch Inhaber)"), message: html + "</table>" });
			});
		}, __("Einrichtung"));

		if (ausser) return;

		if (!frm.doc.startbeleg) {
			frm.add_custom_button(__("Startbeleg erstellen"), () => {
				frappe.confirm(__("Startbeleg jetzt erzeugen? Voraussetzung: SEE und Kasse sind in FinanzOnline registriert, AES-Schlüssel ist hinterlegt. Danach Startbeleg mit der BMF Belegcheck-App prüfen."), () => {
					frm.call({ method: "startbeleg_erstellen", doc: frm.doc, freeze: true, freeze_message: __("Startbeleg wird signiert …") }).then((r) => {
						frm.reload_doc();
						if (r.message) frappe.set_route("Form", "PH Kassenbeleg", r.message);
					});
				});
			}, __("Aktionen"));
		} else {
			const nullbeleg = (art) => frm.call({ method: "nullbeleg_erstellen", doc: frm.doc, args: { belegart: art }, freeze: true }).then((r) => {
				frm.reload_doc();
				if (r.message) frappe.set_route("Form", "PH Kassenbeleg", r.message);
			});
			frm.add_custom_button(__("Nullbeleg"), () => nullbeleg("Nullbeleg"), __("Aktionen"));
			const pruefung = (methode, titel) => frappe.prompt([{ fieldname: "datum", fieldtype: "Date", label: __("Geprüft am"), default: frappe.datetime.get_today(), reqd: 1 }, { fieldname: "nachweis", fieldtype: "Attach", label: __("Nachweis (Screenshot BMF-App)") }], (v) => frm.call({ method: methode, doc: frm.doc, args: v }).then(() => frm.reload_doc()), titel);
			if (frm.doc.startbeleg && !frm.doc.startbeleg_geprueft_am) frm.add_custom_button(__("Startbeleg geprüft (BMF-App)"), () => pruefung("startbeleg_geprueft", __("Startbeleg geprüft")), __("FinanzOnline"));
			frm.add_custom_button(__("Jahresbeleg geprüft (BMF-App)"), () => pruefung("jahresbeleg_geprueft", __("Jahresbeleg geprüft")), __("FinanzOnline"));
			frm.add_custom_button(__("Kassenausfall melden"), () => frappe.prompt({ fieldname: "notiz", fieldtype: "Small Text", label: __("Notiz") }, (v) => frm.call({ method: "kassenausfall_melden", doc: frm.doc, args: v }).then(() => frm.reload_doc())), __("Ausfall"));
			frm.add_custom_button(__("Kassenausfall beenden"), () => frm.call({ method: "kassenausfall_beenden", doc: frm.doc }).then((r) => { frm.reload_doc(); if (r.message && r.message.meldepflicht) frappe.msgprint(__("Ausfall über 48 h: binnen einer Woche in FinanzOnline melden.")); }), __("Ausfall"));
			if (leitung) {
				frm.add_custom_button(__("Monatsbeleg"), () => frappe.confirm(__("Monatsbeleg manuell erzeugen? (Automatisch am Monatsletzten 23:50.)"), () => nullbeleg("Monatsbeleg")), __("Aktionen"));
				frm.add_custom_button(__("Jahresbeleg"), () => frappe.confirm(__("Jahresbeleg erzeugen? Nur am 31.12. bzw. als letzter Beleg des Jahres; danach bis 15.02. mit der BMF-App prüfen."), () => nullbeleg("Jahresbeleg")), __("Aktionen"));
				frm.add_custom_button(__("Schlussbeleg (Außerbetriebnahme)"), () => {
					frappe.confirm(__("Kasse endgültig außer Betrieb nehmen? Danach sind keine Belege mehr möglich. Vorher DEP vollständig exportieren."), () => {
						frm.call({ method: "schlussbeleg_erstellen", doc: frm.doc, freeze: true }).then(() => frm.reload_doc());
					});
				}, __("Aktionen"));
			}
			frm.add_custom_button(__("DEP exportieren"), () => {
				const d = new frappe.ui.Dialog({
					title: __("DEP7-Export"),
					fields: [
						{ fieldname: "art", fieldtype: "Select", label: __("Art"), options: ["Zeitraum", "Vollstaendig", "Pruefung Finanzamt"], default: "Zeitraum" },
						{ fieldname: "von", fieldtype: "Date", label: __("Von"), default: frappe.datetime.month_start(), depends_on: "eval:doc.art!='Vollstaendig'" },
						{ fieldname: "bis", fieldtype: "Date", label: __("Bis"), default: frappe.datetime.get_today(), depends_on: "eval:doc.art!='Vollstaendig'" },
					],
					primary_action_label: __("Exportieren"),
					primary_action(v) {
						frm.call({ method: "dep_exportieren", doc: frm.doc, args: v, freeze: true }).then((r) => {
							d.hide();
							frm.reload_doc();
							if (r.message) frappe.set_route("Form", "PH DEP Export", r.message);
						});
					},
				});
				d.show();
			}, __("Aktionen"));
			frm.add_custom_button(__("Kette prüfen"), () => {
				frm.call({ method: "kette_pruefen", doc: frm.doc, freeze: true, freeze_message: __("Signaturen und Verkettung werden geprüft …") }).then((r) => {
					if (!r.message) return;
					const e = r.message;
					frappe.msgprint({
						title: e.ok ? __("Belegkette in Ordnung") : __("Belegkette fehlerhaft"),
						indicator: e.ok ? "green" : "red",
						message: `${__("{0} Belege geprüft.", [e.anzahl])}${e.fehler.length ? "<ul><li>" + e.fehler.map(frappe.utils.escape_html).join("</li><li>") + "</li></ul>" : ""}<p class="text-muted">${__("Ersetzt nicht die Prüfung mit der BMF Belegcheck-App.")}</p>`,
					});
				});
			}, __("Aktionen"));
		}

		if (leitung && frm.doc.see) {
			if (frm.doc.status !== "Ausgefallen") {
				frm.add_custom_button(__("SEE-Ausfall melden"), () => {
					frappe.prompt({ fieldname: "notiz", fieldtype: "Small Text", label: __("Grund/Notiz"), reqd: 1 }, (v) => {
						frm.call({ method: "see_ausfall_melden", doc: frm.doc, args: v }).then(() => frm.reload_doc());
					}, __("SEE-Ausfall melden"));
				}, __("Ausfall"));
			} else {
				frm.add_custom_button(__("SEE-Ausfall beenden"), () => {
					frappe.confirm(__("SEE wieder in Betrieb nehmen? Erreichbarkeit wird geprüft, ein Sammelbeleg über die Ausfallbelege signiert."), () => {
						frm.call({ method: "see_ausfall_beenden", doc: frm.doc, freeze: true }).then((r) => {
							frm.reload_doc();
							if (r.message && r.message.meldepflicht) frappe.msgprint({ title: __("FinanzOnline-Meldung nötig"), indicator: "orange", message: __("Ausfall dauerte {0} h (> 48 h): Ausfall und Wiederinbetriebnahme in FinanzOnline melden.", [r.message.dauer_h]) });
						});
					});
				}, __("Ausfall"));
			}
		}
	},
});
