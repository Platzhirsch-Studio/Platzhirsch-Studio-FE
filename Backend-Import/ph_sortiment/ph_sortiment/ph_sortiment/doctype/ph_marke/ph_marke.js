// PH Marke – Client-Script: Händlerstatus-Hinweis, Logo-Vorschau, Buttons.
frappe.ui.form.on("PH Marke", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Aktiv: "green", Pausiert: "orange", Inaktiv: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		frm.dashboard.clear_headline();
		if (frm.is_new()) return;

		const mit_status = ["Haendler", "Vertragshaendler", "Exklusiv", "Partner"].includes(frm.doc.haendlerstatus);
		if (!mit_status) frm.dashboard.set_headline_alert(__("Kein belegter Händlerstatus – die Website darf keinen Händlersatz zeigen (Claim-Guard)."), "orange");
		else if (frm.doc.vertrag_gueltig_bis && frappe.datetime.get_diff(frm.doc.vertrag_gueltig_bis, frappe.datetime.get_today()) < 60) frm.dashboard.set_headline_alert(__("Händlervertrag läuft am {0} aus.", [frappe.datetime.str_to_user(frm.doc.vertrag_gueltig_bis)]), "red");
		if (frm.doc.bildfreigabe_status !== "schriftlich erteilt") frm.dashboard.add_indicator(__("Bildfreigabe {0}", [frm.doc.bildfreigabe_status]), "orange");
		frm.dashboard.add_indicator(__("{0} aktive Produkte", [frm.doc.produkte_anzahl || 0]), frm.doc.produkte_anzahl ? "green" : "gray");

		frm.add_custom_button(__("Händlerstatus/Claims prüfen"), () => {
			frm.call({ method: "produkte_ohne_freigabe", doc: frm.doc, freeze: true }).then((r) => {
				const m = r.message || {};
				const esc = frappe.utils.escape_html;
				const zeilen = (m.produkte || []).slice(0, 50).map((p) => `<tr><td><a href="/app/ph-produkt/${encodeURIComponent(p.name)}">${esc(p.name_herstellerbezeichnung)}</a></td><td>${esc(p.status)}</td><td class="text-right">${p.bilder_anzahl || 0}</td></tr>`).join("");
				frappe.msgprint({
					title: __("Prüfung {0}", [frm.doc.marke]),
					message: `<p><b>${__("Händlerstatus")}:</b> ${esc(m.haendlerstatus)} · <b>${__("Bildfreigabe")}:</b> ${esc(m.bildfreigabe_status)}</p><p>${__("{0} Produkte ohne freigegebenes Bild", [m.anzahl])}</p>${zeilen ? `<table class="table table-sm"><thead><tr><th>${__("Produkt")}</th><th>${__("Status")}</th><th class="text-right">${__("Bilder")}</th></tr></thead><tbody>${zeilen}</tbody></table>` : ""}`,
					wide: true,
				});
			});
		}, __("Aktionen"));

		frm.add_custom_button(__("Bildfreigabe anfordern"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Bildfreigabe anfordern"),
				fields: [
					{ fieldname: "empfaenger", fieldtype: "Data", label: __("Empfänger (E-Mail)"), options: "Email", default: frm.doc.bestell_email || ((frm.doc.ansprechpartner || []).find((a) => a.email) || {}).email },
					{ fieldname: "nachricht", fieldtype: "Small Text", label: __("Nachricht (leer = Standardtext)") },
				],
				primary_action_label: __("Senden"),
				primary_action(v) {
					frm.call({ method: "bildfreigabe_anfordern", doc: frm.doc, args: v, freeze: true }).then((r) => {
						d.hide();
						frappe.show_alert({ message: __("Anfrage an {0} gesendet", [r.message]), indicator: "green" });
						frm.reload_doc();
					});
				},
			});
			d.show();
		}, __("Aktionen"));

		if (!frm.doc.lieferant) {
			frm.add_custom_button(__("Lieferant anlegen"), () => {
				frm.call({ method: "lieferant_anlegen", doc: frm.doc, freeze: true }).then((r) => {
					frappe.show_alert({ message: __("Lieferant {0} verknüpft", [r.message]), indicator: "green" });
					frm.reload_doc();
				});
			}, __("Aktionen"));
		} else {
			frm.add_custom_button(__("Lieferant öffnen"), () => frappe.set_route("Form", "PH Lieferant", frm.doc.lieferant), __("Ansehen"));
		}
		frm.add_custom_button(__("Produkte"), () => frappe.set_route("List", "PH Produkt", { marke: frm.doc.name }), __("Ansehen"));
		frm.add_custom_button(__("Produkte ohne Bildfreigabe"), () => frappe.set_route("query-report", "PH Produkte ohne Bildfreigabe", { marke: frm.doc.name }), __("Ansehen"));
		frm.add_custom_button(__("Neue Bestellung"), () => frappe.new_doc("PH Herstellerbestellung", { lieferant: frm.doc.lieferant, marke: frm.doc.name }), __("Ansehen"));
	},
	marke(frm) {
		if (!frm.doc.slug && frm.doc.marke) frm.set_value("slug", frappe.scrub(frm.doc.marke).replace(/_/g, "-"));
	},
});
