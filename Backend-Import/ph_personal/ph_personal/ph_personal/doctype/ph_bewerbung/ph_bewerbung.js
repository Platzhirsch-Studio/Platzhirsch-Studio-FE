// PH Bewerbung – Client-Script: Statusfarbe, Datenschutz-Hinweise, Buttons (Gesprächstermin, Absage senden,
// Einstellen, Unterlagen löschen, Evidenz verlängern, Deckblatt/Briefe drucken).
const BEW_FARBEN = { Eingegangen: "blue", Gesichtet: "cyan", Gespraech: "purple", Angebot: "orange", Eingestellt: "green", Abgesagt: "gray", Zurueckgezogen: "red" };
const BEW_LABEL = { Gespraech: "Gespräch", Zurueckgezogen: "Zurückgezogen" };

frappe.ui.form.on("PH Bewerbung", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(BEW_LABEL[frm.doc.status] || frm.doc.status), BEW_FARBEN[frm.doc.status] || "gray");

		if (frm.doc.pseudonymisiert) {
			frm.dashboard.set_headline_alert(__("Unterlagen gelöscht und pseudonymisiert am {0}.", [frappe.datetime.str_to_user(frm.doc.unterlagen_geloescht_am)]), "gray");
		} else if (frm.doc.loeschfrist) {
			const tage = frappe.datetime.get_diff(frm.doc.loeschfrist, frappe.datetime.get_today());
			frm.dashboard.set_headline_alert(
				tage <= 0 ? __("Löschfrist abgelaufen – Unterlagen werden beim nächsten Lauf gelöscht.") : __("Löschfrist: {0} (in {1} Tagen).", [frappe.datetime.str_to_user(frm.doc.loeschfrist), tage]),
				tage <= 14 ? "red" : "orange"
			);
		} else if (!frm.doc.einwilligung_datenschutz && !frm.is_new()) {
			frm.dashboard.set_headline_alert(__("Datenschutzinformation (Art 13 DSGVO) noch nicht bestätigt/zugesandt."), "orange");
		}

		if (frm.is_new()) return;
		const offen = ["Eingegangen", "Gesichtet", "Gespraech", "Angebot"].includes(frm.doc.status);

		if (offen) {
			frm.add_custom_button(__("Gesprächstermin"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Bewerbungsgespräch vereinbaren"),
					fields: [
						{ fieldname: "start", fieldtype: "Datetime", label: __("Beginn"), reqd: 1 },
						{ fieldname: "dauer_min", fieldtype: "Int", label: __("Dauer (Minuten)"), default: 60 },
						{ fieldname: "modus", fieldtype: "Select", label: __("Modus"), options: ["Vor Ort", "Video", "Telefon"], default: "Vor Ort" },
						{ fieldname: "ort", fieldtype: "Data", label: __("Ort / Link") },
						{ fieldname: "verantwortlich", fieldtype: "Link", label: __("Gesprächsführung"), options: "User", default: frm.doc.zugewiesen_an || frappe.session.user },
					],
					primary_action_label: __("Anlegen"),
					primary_action(values) {
						frm.call({ method: "gespraech_anlegen", doc: frm.doc, args: values, freeze: true }).then((r) => {
							d.hide();
							if (r.message) frappe.set_route("Form", "PH Bewerbungsgespraech", r.message);
						});
					},
				});
				d.show();
			}, __("Aktionen"));

			frm.add_custom_button(__("Absage senden"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Absage"),
					fields: [
						{ fieldname: "grund", fieldtype: "Select", label: __("Grund (intern)"), options: ["Qualifikation", "Anderer Kandidat", "Stelle besetzt", "Keine Rückmeldung", "Gehaltsvorstellung", "Sonstiges"], default: "Anderer Kandidat", reqd: 1 },
						{ fieldname: "per_mail", fieldtype: "Check", label: __("Absage per E-Mail senden (Vorlage aus PH Personal Einstellungen)"), default: frm.doc.email ? 1 : 0 },
						{ fieldtype: "HTML", options: `<p class="text-muted small">${__("Die Löschfrist für die Unterlagen beginnt mit der Absage (Standard 7 Monate).")}</p>` },
					],
					primary_action_label: __("Absagen"),
					primary_action(values) {
						frm.call({ method: "absage_senden", doc: frm.doc, args: values, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
		}

		if (["Gespraech", "Angebot"].includes(frm.doc.status) && !frm.doc.mitarbeiter) {
			frm.add_custom_button(__("Einstellen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Einstellen – Mitarbeiter anlegen"),
					fields: [
						{ fieldname: "eintritt", fieldtype: "Date", label: __("Eintritt"), reqd: 1, default: frm.doc.verfuegbar_ab || frappe.datetime.get_today() },
						{ fieldname: "rolle_intern", fieldtype: "Select", label: __("Rolle"), options: ["Geschaeftsfuehrung", "Verkauf", "Planung", "Montage", "Verwaltung", "Lehrling"], default: "Verkauf", reqd: 1 },
						{ fieldname: "stelle_schliessen", fieldtype: "Check", label: __("Stelle als besetzt schließen"), default: frm.doc.stelle ? 1 : 0 },
						{ fieldname: "beschaeftigungsart", fieldtype: "Select", label: __("Beschäftigungsart"), options: ["", "Vollzeit", "Teilzeit", "Geringfuegig", "Lehre", "Praktikum"] },
						{ fieldname: "wochenstunden", fieldtype: "Float", label: __("Wochenstunden") },
						{ fieldname: "user", fieldtype: "Link", options: "User", label: __("Benutzer (Selbstservice)") },
					],
					primary_action_label: __("Einstellen"),
					primary_action(values) {
						frm.call({ method: "einstellen", doc: frm.doc, args: values, freeze: true }).then((r) => {
							d.hide();
							if (r.message) frappe.set_route("Form", "PH Mitarbeiter", r.message);
						});
					},
				});
				d.show();
			}, __("Aktionen"));
		}

		if (frm.doc.mitarbeiter) frm.add_custom_button(__("Mitarbeiter öffnen"), () => frappe.set_route("Form", "PH Mitarbeiter", frm.doc.mitarbeiter));
		if (frm.doc.status === "Eingestellt" && frappe.user.has_role("PH Personal Leitung")) {
			frm.add_custom_button(__("Nicht angetreten"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund") },
					(v) => frm.call({ method: "nichtantritt", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Nicht angetreten"));
			}, __("Aktionen"));
		}
		if (frm.doc.status === "Abgesagt" && !frm.doc.absage_versand_am) {
			frm.dashboard.set_headline_alert(__("Übermittlung der Absage noch nicht dokumentiert – die Löschfrist läuft ab Zugang (§ 15 GlBG)."), "orange");
			frm.add_custom_button(__("Absage dokumentieren"), () => {
				new frappe.ui.Dialog({
					title: __("Absage übermittelt"),
					fields: [
						{ fieldname: "versand", fieldtype: "Select", label: __("Per"), options: ["Post", "Telefon", "Persönlich", "E-Mail"], default: "Post", reqd: 1 },
						{ fieldname: "am", fieldtype: "Datetime", label: __("Am"), default: frappe.datetime.now_datetime(), reqd: 1 },
					],
					primary_action_label: __("Speichern"),
					primary_action(v) { this.hide(); frm.call({ method: "absage_dokumentieren", doc: frm.doc, args: v }).then(() => frm.reload_doc()); },
				}).show();
			}, __("Aktionen"));
		}
		if (!frm.doc.eingang_bestaetigt_am && !frm.doc.pseudonymisiert && ["Eingegangen", "Gesichtet"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Eingang bestätigen"), () => {
				frappe.confirm(frm.doc.email ? __("Eingangsbestätigung mit Datenschutzinformation per E-Mail senden?") : __("Keine E-Mail – Bestätigung als per Post versendet vermerken?"),
					() => frm.call({ method: "eingang_bestaetigen", doc: frm.doc, args: { per_mail: frm.doc.email ? 1 : 0 } }).then(() => frm.reload_doc()));
			}, __("Aktionen"));
		}

		if (!offen && !frm.doc.pseudonymisiert && frappe.user.has_role(["PH Personal Leitung", "System Manager"])) {
			frm.add_custom_button(__("Unterlagen jetzt löschen"), () => {
				frappe.confirm(__("Unterlagen, Anschreiben und Personendaten unwiderruflich löschen (Pseudonymisierung)?"), () => {
					frm.call({ method: "unterlagen_loeschen", doc: frm.doc, freeze: true }).then(() => frm.reload_doc());
				});
			}, __("Aktionen"));
			if (frm.doc.status !== "Eingestellt") {
				frm.add_custom_button(__("Evidenz verlängern"), () => {
					frappe.prompt(
						[{ fieldname: "bis", fieldtype: "Date", label: __("Evidenz bis (mit Einwilligung)"), reqd: 1, default: frappe.datetime.add_months(frappe.datetime.get_today(), 12) }],
						(v) => frm.call({ method: "evidenz_verlaengern", doc: frm.doc, args: v }).then(() => frm.reload_doc()),
						__("Einwilligung zur Evidenzhaltung"),
						__("Speichern")
					);
				}, __("Aktionen"));
			}
		}

		frm.add_custom_button(__("Deckblatt"), () => frappe.utils.print(frm.doctype, frm.docname, "PH Bewerbung Deckblatt", frm.doc.letter_head, "de"), __("Drucken"));
		if (frm.doc.status === "Abgesagt") frm.add_custom_button(__("Absagebrief"), () => frappe.utils.print(frm.doctype, frm.docname, "PH Bewerbung Absage", frm.doc.letter_head, "de"), __("Drucken"));
		if (["Angebot", "Eingestellt"].includes(frm.doc.status)) frm.add_custom_button(__("Zusagebrief"), () => frappe.utils.print(frm.doctype, frm.docname, "PH Bewerbung Zusage", frm.doc.letter_head, "de"), __("Drucken"));

		if (frm.doc.email && !frm.doc.pseudonymisiert) {
			frm.add_custom_button(__("E-Mail schreiben"), () => {
				new frappe.views.CommunicationComposer({ doc: frm.doc, frm, subject: __("Ihre Bewerbung bei Platzhirsch ({0})", [frm.doc.stelle_titel || __("Initiativbewerbung")]), recipients: frm.doc.email });
			});
		}
	},

	vorname: aktualisiereTitel,
	nachname: aktualisiereTitel,
	stelle: aktualisiereTitel,
	einwilligung_datenschutz(frm) {
		if (frm.doc.einwilligung_datenschutz && !frm.doc.einwilligung_zeitpunkt) frm.set_value("einwilligung_zeitpunkt", frappe.datetime.now_datetime());
	},
});

function aktualisiereTitel(frm) {
	const person = [frm.doc.vorname, frm.doc.nachname].filter(Boolean).join(" ") || __("ohne Namen");
	frm.set_value("titel", `${person} – ${frm.doc.stelle_titel || __("Initiativ")}`);
}
