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
		if (frm.is_new()) return;

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
				new frappe.views.CommunicationComposer({ doc: frm.doc, frm, recipients: frm.doc.email });
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

function aktualisiereTitel(frm) {
	const person = [frm.doc.titel_akad, frm.doc.vorname, frm.doc.nachname].filter(Boolean).join(" ");
	let t = person || __("ohne Namen");
	if (frm.doc.firma && frm.doc.kontaktart !== "Privat") t = person ? `${frm.doc.firma} – ${person}` : frm.doc.firma;
	else if (frm.doc.firma) t = `${person} (${frm.doc.firma})`;
	frm.set_value("titel", t);
}
