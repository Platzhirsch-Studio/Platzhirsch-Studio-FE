// PH Newsletter Abo – Buttons: DOI erneut senden, Abmelden (Protokoll), Auskunft, Daten löschen (Leitung).
const ABO_FARBEN = { "Angemeldet unbestaetigt": "orange", Aktiv: "green", Abgemeldet: "gray", Bounce: "red", Beschwerde: "red" };

frappe.ui.form.on("PH Newsletter Abo", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), ABO_FARBEN[frm.doc.status] || "gray");
		if (frm.is_new()) {
			frm.dashboard.set_headline_alert(__("Abos aus dem Desk starten immer unbestätigt – die DOI-Mail geht beim Speichern nicht automatisch. Danach „DOI erneut senden“."), "blue");
			return;
		}
		if (frm.doc.altbestand_ohne_doi) frm.dashboard.set_headline_alert(__("Altbestand ohne Double-Opt-in: kein Versand bis Kanzlei-Entscheid."), "orange");
		if (frm.doc.status === "Angemeldet unbestaetigt") {
			const h = frm.doc.doi_gesendet_am ? moment().diff(moment(frm.doc.doi_gesendet_am), "hours") : null;
			if (h !== null && h > 48) frm.dashboard.set_headline_alert(__("DOI-Link seit {0} Stunden ausstehend (abgelaufen).", [h]), "orange");
		}

		if (frm.doc.status !== "Aktiv" && frm.doc.status !== "Beschwerde") {
			frm.add_custom_button(__("DOI erneut senden"), () => {
				frm.call({ method: "doi_erneut_senden", doc: frm.doc, freeze: true }).then(() => {
					frappe.show_alert({ message: __("DOI-Mail gesendet"), indicator: "green" });
					frm.reload_doc();
				});
			}, __("Aktionen"));
		}
		if (frm.doc.status !== "Abgemeldet") {
			frm.add_custom_button(__("Abmelden (Protokoll)"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Abmeldung erfassen"),
					fields: [
						{ fieldname: "kanal", fieldtype: "Select", label: __("Abmeldung über"), options: ["backoffice", "antwort_mail"], default: "backoffice", reqd: 1 },
						{ fieldname: "grund", fieldtype: "Data", label: __("Grund (optional)") },
					],
					primary_action_label: __("Abmelden"),
					primary_action(v) {
						frm.call({ method: "abmelden", doc: frm.doc, args: v }).then(() => { d.hide(); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Auskunft (Art. 15)"), () => {
			frm.call({ method: "auskunft", doc: frm.doc }).then((r) => {
				const a = r.message || {};
				const esc = frappe.utils.escape_html;
				const zeilen = (a.einwilligungen || []).map((e) => `<tr><td>${esc(e.zweck)}</td><td>${esc(e.status)}</td><td>${esc(frappe.datetime.str_to_user(e.zeitpunkt))}</td><td>${esc(e.kanal || "")}</td><td>${esc(e.textversion || "")}</td></tr>`).join("");
				frappe.msgprint({
					title: __("Gespeicherte Daten zu {0}", [esc(frm.doc.email)]),
					wide: true,
					message: `<p><b>${__("Abo")}</b>: ${esc(a.abo?.status)} · ${__("Quelle")} ${esc(a.abo?.quelle || "")} · ${__("Interessen")}: ${esc((a.interessen || []).join(", ") || "–")}</p>
						<table class="table table-bordered table-sm"><thead><tr><th>${__("Zweck")}</th><th>${__("Status")}</th><th>${__("Zeitpunkt")}</th><th>${__("Kanal")}</th><th>${__("Textversion")}</th></tr></thead><tbody>${zeilen}</tbody></table>
						<p>${__("Zustellungen")}: ${(a.zustellungen || []).length} · ${__("Reise-Mails")}: ${(a.reisen || []).length}</p>`,
				});
			});
		}, __("Aktionen"));
		if (frappe.user.has_role("PH Marketing Leitung") && ["Abgemeldet", "Angemeldet unbestaetigt", "Bounce", "Beschwerde"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Daten löschen (DSGVO)"), () => {
				frappe.confirm(__("Abo endgültig löschen? Die Einwilligungs-Einträge bleiben als Nachweis mit Widerruf."), () => {
					frm.call({ method: "loeschen_dsgvo", doc: frm.doc }).then(() => frappe.set_route("List", "PH Newsletter Abo"));
				});
			}, __("Aktionen"));
		}
		if (frm.doc.einwilligung) frm.add_custom_button(__("Einwilligung öffnen"), () => frappe.set_route("Form", "PH Einwilligung", frm.doc.einwilligung));
	},
});
