// PH Kontakt – Buttons: Portal-Zugang erzeugen/sperren, Alle Vorgänge, DSGVO-Auskunft, Termin/Aufgabe anlegen.
frappe.ui.form.on("PH Kontakt", {
	setup(frm) {
		frm.set_query("berater", () => ({ filters: { enabled: 1, user_type: "System User" } }));
	},

	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Interessent: "blue", Kunde: "green", Inaktiv: "gray", Gesperrt: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");

		if (frm.doc.nicht_kontaktieren) {
			frm.dashboard.set_headline_alert(__("Widerspruch gegen Kontaktaufnahme ({0}) – keine Werbung, keine Anrufe ohne Anlass.", [frappe.datetime.str_to_user(frm.doc.widerspruchshinweis_am) || "–"]), "red");
		}
		if (frm.doc.anonymisiert_am) {
			frm.dashboard.set_headline_alert(__("Anonymisiert am {0} (DSGVO). Aufbewahrung bis {1}.", [frappe.datetime.str_to_user(frm.doc.anonymisiert_am), frm.doc.aufbewahren_bis ? frappe.datetime.str_to_user(frm.doc.aufbewahren_bis) : "–"]), "gray");
			frm.disable_form();
			return;
		}
		if (frm.is_new()) return;

		const leitung = frappe.user.has_role("PH CRM Leitung") || frappe.user.has_role("System Manager");
		const aehnliche = (frm.doc.__onload && frm.doc.__onload.aehnliche) || [];
		if (aehnliche.length) {
			frm.dashboard.set_headline_alert(__("Mögliche Dublette: {0}", [aehnliche.map((k) => `<a href="/app/ph-kontakt/${encodeURIComponent(k.name)}">${frappe.utils.escape_html(k.titel)}</a> (${frappe.utils.escape_html(k.gruende.join(", "))})`).join(" · ")]), "orange");
		}
		frm.add_custom_button(__("Ähnliche Kontakte"), () => aehnlicheDialog(frm, leitung), __("Übersicht"));

		// Portal
		if (!frm.doc.portal_aktiv) {
			frm.add_custom_button(__("Portal-Zugang erzeugen"), () => {
				frappe.confirm(__("Neuen Portal-Zugang erzeugen? Ein bestehender Token wird ungültig."), () => {
					frm.call({ method: "portal_zugang_erzeugen", doc: frm.doc, freeze: true }).then((r) => {
						if (!r.message) return;
						const d = new frappe.ui.Dialog({
							title: __("Portal-Token (einmalig sichtbar)"),
							fields: [
								{ fieldtype: "Data", fieldname: "token", label: __("Token"), default: r.message.token, read_only: 1 },
								{ fieldtype: "HTML", options: `<p class="text-muted">${frappe.utils.escape_html(r.message.hinweis)}</p>` },
							],
							primary_action_label: __("Kopieren"),
							primary_action() {
								frappe.utils.copy_to_clipboard(r.message.token);
								d.hide();
							},
						});
						d.show();
						frm.reload_doc();
					});
				});
			}, __("Portal"));
		} else {
			frm.add_custom_button(__("Portal-Zugang sperren"), () => {
				frappe.confirm(__("Portal-Zugang sperren?"), () => frm.call({ method: "portal_sperren", doc: frm.doc }).then(() => frm.reload_doc()));
			}, __("Portal"));
			frm.add_custom_button(__("Token erneuern"), () => {
				frm.call({ method: "portal_zugang_erzeugen", doc: frm.doc, freeze: true }).then((r) => {
					if (r.message) frappe.msgprint({ title: __("Neuer Portal-Token"), message: `<code>${frappe.utils.escape_html(r.message.token)}</code><br><small>${frappe.utils.escape_html(r.message.hinweis)}</small>`, indicator: "green" });
					frm.reload_doc();
				});
			}, __("Portal"));
		}

		// Aktionen
		frm.add_custom_button(__("Termin anlegen"), () => {
			frappe.new_doc("PH Termin", { kontakt: frm.doc.name, vorname: frm.doc.vorname, nachname: frm.doc.nachname, email: frm.doc.email, telefon: frm.doc.telefon || frm.doc.mobil, sprache: frm.doc.sprache, quelle: "backoffice", kundenmail: "backoffice" });
		}, __("Aktionen"));
		frm.add_custom_button(__("Aufgabe anlegen"), () => {
			frappe.new_doc("PH Aufgabe", { referenz_doctype: "PH Kontakt", referenz_name: frm.doc.name, titel: __("Kontakt: {0}", [frm.doc.titel]) });
		}, __("Aktionen"));
		frm.add_custom_button(__("Beratungsgespräch anlegen"), () => {
			frappe.new_doc("PH Beratungsgespraech", { kontakt: frm.doc.name, berater: frm.doc.berater || frappe.session.user });
		}, __("Aktionen"));
		if (frm.doc.status === "Interessent") {
			frm.add_custom_button(__("Als Kunde markieren"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Data", label: __("Anlass (z. B. AB-Nummer)") }, (v) => {
					frm.call({ method: "als_kunde_markieren", doc: frm.doc, args: v }).then(() => frm.reload_doc());
				}, __("Als Kunde markieren"));
			}, __("Aktionen"));
		}
		if (!frm.doc.nicht_kontaktieren) {
			frm.add_custom_button(__("Widerspruch erfassen"), () => {
				frappe.prompt({ fieldname: "quelle", fieldtype: "Data", label: __("Widerspruch über"), reqd: 1 }, (v) => {
					frm.call({ method: "widerspruch_erfassen", doc: frm.doc, args: v }).then(() => frm.reload_doc());
				}, __("Widerspruch (Art. 21 DSGVO)"));
			}, __("Aktionen"));
		}

		frm.add_custom_button(__("Wiedervorlage"), () => {
			frappe.prompt([
				{ fieldname: "datum", fieldtype: "Date", label: __("Am"), default: frm.doc.wiedervorlage || frappe.datetime.add_days(frappe.datetime.get_today(), 14) },
				{ fieldname: "notiz", fieldtype: "Data", label: __("Anlass"), default: frm.doc.wiedervorlage_notiz },
			], (v) => frm.call({ method: "wiedervorlage_setzen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Wiedervorlage"));
		}, __("Aktionen"));
		frm.add_custom_button(__("Adressetikett drucken"), () => {
			window.open(frappe.urllib.get_full_url(`/printview?doctype=${encodeURIComponent("PH Kontakt")}&name=${encodeURIComponent(frm.doc.name)}&format=${encodeURIComponent("PH Kontakt Etikett")}&no_letterhead=1`));
		}, __("Aktionen"));

		// Datenschutz (Leitung/GF)
		if (leitung || frappe.user.has_role("PH Geschäftsführung")) {
			frm.add_custom_button(__("Datenauskunft exportieren (JSON)"), () => {
				frm.call({ method: "datenauskunft_export", doc: frm.doc, freeze: true }).then((r) => {
					if (r.message) window.open(r.message);
					frm.reload_doc();
				});
			}, __("Datenschutz"));
			frm.add_custom_button(__("Datenschutzanfrage erfassen"), () => frappe.new_doc("PH Datenschutzanfrage", { kontakt: frm.doc.name }), __("Datenschutz"));
			frm.add_custom_button(__("Löschplan anzeigen"), () => {
				frm.call({ method: "loeschplan", doc: frm.doc, freeze: true }).then((r) => {
					const zeilen = (r.message || []).map((z) => `<tr><td>${frappe.utils.escape_html(z.doctype)}</td><td>${frappe.utils.escape_html(z.name || "")}</td><td>${frappe.utils.escape_html(__(z.aktion))}</td><td>${frappe.utils.escape_html(z.frist_bis || "")}</td><td>${frappe.utils.escape_html(z.grund || "")}</td></tr>`).join("");
					frappe.msgprint({ title: __("Lösch- und Aufbewahrungsplan"), wide: true, message: `<p>${__("Ausführen über eine PH Datenschutzanfrage (Art „Loeschung“), damit Frist und Nachweis dokumentiert sind.")}</p><table class="table table-bordered"><thead><tr><th>${__("Art")}</th><th>${__("Beleg")}</th><th>${__("Aktion")}</th><th>${__("Frist")}</th><th>${__("Grund")}</th></tr></thead><tbody>${zeilen}</tbody></table>` });
				});
			}, __("Datenschutz"));
		}

		// Übersicht
		frm.add_custom_button(__("Alle Vorgänge"), () => {
			frm.dashboard.show();
			frappe.utils.scroll_to(frm.dashboard.wrapper, true, 60);
		}, __("Übersicht"));
		frm.add_custom_button(__("DSGVO-Auskunft (Bericht)"), () => {
			frappe.set_route("query-report", "PH Kontakt Datenauskunft", { kontakt: frm.doc.name });
		}, __("Übersicht"));
		frm.add_custom_button(__("DSGVO-Auskunft drucken"), () => {
			window.open(frappe.urllib.get_full_url(`/printview?doctype=${encodeURIComponent("PH Kontakt")}&name=${encodeURIComponent(frm.doc.name)}&format=${encodeURIComponent("PH Kontakt DSGVO-Auskunft")}&no_letterhead=1`));
		}, __("Übersicht"));

		if (frm.doc.email) {
			frm.add_custom_button(__("E-Mail schreiben"), () => {
				if (frm.doc.nicht_kontaktieren) {
					frappe.confirm(__("Widerspruch erfasst – nur vertragsbezogene Nachrichten (Termin, Lieferung, Rechnung). Fortfahren?"), () => new frappe.views.CommunicationComposer({ doc: frm.doc, frm, recipients: frm.doc.email }));
				} else {
					new frappe.views.CommunicationComposer({ doc: frm.doc, frm, recipients: frm.doc.email });
				}
			});
		}
	},

	vorname: aktualisiereTitel,
	nachname: aktualisiereTitel,
	firma: aktualisiereTitel,
	kontaktart: aktualisiereTitel,

	geburtstag_einwilligung(frm) {
		if (!frm.doc.geburtstag_einwilligung) frm.set_value("geburtstag", null);
	},
});

function aehnlicheDialog(frm, leitung) {
	frm.call({ method: "aehnliche_kontakte", doc: frm.doc, freeze: true }).then((r) => {
		const liste = r.message || [];
		if (!liste.length) {
			frappe.show_alert({ message: __("Keine ähnlichen Kontakte gefunden."), indicator: "green" });
			return;
		}
		const zeilen = liste.map((k) => `<tr><td><a href="/app/ph-kontakt/${encodeURIComponent(k.name)}">${frappe.utils.escape_html(k.titel)}</a><br><small>${frappe.utils.escape_html(k.name)} · ${frappe.utils.escape_html(k.ort || "")}</small></td><td>${k.punkte}</td><td>${frappe.utils.escape_html(k.gruende.join(", "))}</td><td>${frappe.utils.escape_html(__(k.status || ""))}</td></tr>`).join("");
		const d = new frappe.ui.Dialog({
			title: __("Ähnliche Kontakte"),
			size: "large",
			fields: [
				{ fieldtype: "HTML", fieldname: "liste", options: `<table class="table table-bordered"><thead><tr><th>${__("Kontakt")}</th><th>${__("Punkte")}</th><th>${__("Gründe")}</th><th>${__("Status")}</th></tr></thead><tbody>${zeilen}</tbody></table>` },
				{ fieldtype: "Select", fieldname: "quelle", label: __("Kontakt"), options: liste.map((k) => k.name).join("\n"), default: liste[0].name, reqd: 1 },
				{ fieldtype: "Small Text", fieldname: "felder", label: __("Felder aus dem anderen Kontakt übernehmen (Komma-Liste, z. B. telefon, strasse)"), hidden: leitung ? 0 : 1 },
			],
			primary_action_label: leitung ? __("In diesen Kontakt zusammenführen") : __("Schließen"),
			primary_action(v) {
				if (!leitung) return d.hide();
				frappe.confirm(__("{0} wird in {1} zusammengeführt und gelöscht. Alle Vorgänge aller Bereiche wandern hierher. Fortfahren?", [v.quelle, frm.doc.name]), () => {
					frm.call({ method: "zusammenfuehren", doc: frm.doc, args: { quelle: v.quelle, felder: v.felder }, freeze: true }).then(() => {
						d.hide();
						frm.reload_doc();
					});
				});
			},
			secondary_action_label: __("Keine Dublette"),
			secondary_action() {
				const v = d.get_values();
				frm.call({ method: "keine_dublette", doc: frm.doc, args: { anderer: v.quelle } }).then(() => {
					d.hide();
					frm.reload_doc();
				});
			},
		});
		d.show();
	});
}

function aktualisiereTitel(frm) {
	const person = [frm.doc.titel_akad, frm.doc.vorname, frm.doc.nachname].filter(Boolean).join(" ");
	let t = person || __("ohne Namen");
	if (frm.doc.firma && frm.doc.kontaktart !== "Privat") t = person ? `${frm.doc.firma} – ${person}` : frm.doc.firma;
	else if (frm.doc.firma) t = `${person} (${frm.doc.firma})`;
	frm.set_value("titel", t);
}
