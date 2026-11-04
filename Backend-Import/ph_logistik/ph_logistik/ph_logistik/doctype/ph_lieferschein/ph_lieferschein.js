// PH Lieferschein – Buttons: Packtisch öffnen, Etikett erzeugen (Tarif-Dialog), Übergeben, Als abgeholt/zugestellt buchen
// (Unterschrift), Lieferbestätigung senden, Teilrechnung (ph_faktura), Produktpässe (ph_projekte), Stornieren.
const LS_FARBEN = { Entwurf: "blue", Gepackt: "orange", Uebergeben: "purple", Zugestellt: "green", Storniert: "gray" };

frappe.ui.form.on("PH Lieferschein", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), LS_FARBEN[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		const st = frm.doc.status;

		if (["Entwurf", "Gepackt"].includes(st)) {
			frm.add_custom_button(__("Packtisch öffnen"), () => frappe.set_route("ph-packtisch", { lieferschein: frm.doc.name }), __("Aktionen"));
		}
		if (st === "Entwurf") {
			frm.add_custom_button(__("Pakete vorschlagen"), () => frm.call({ method: "pakete_vorschlagen", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
			frm.add_custom_button(__("Als gepackt melden"), () => frm.call({ method: "als_gepackt", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (["Entwurf", "Gepackt"].includes(st) && ["Versand", "Spedition"].includes(frm.doc.lieferart)) {
			frm.add_custom_button(__("Etikett erzeugen"), () => ph_logistik_tarif_dialog(frm), __("Aktionen"));
		}
		if (st === "Gepackt") {
			frm.add_custom_button(__("Übergeben (Dienstleister/Fahrer)"), () => {
				frappe.prompt({ fieldname: "an", fieldtype: "Select", label: __("Übergeben an"), options: ["Dienstleister", "Fahrer", "Spedition"], default: "Dienstleister", reqd: 1 }, (v) => {
					frm.call({ method: "uebergeben", doc: frm.doc, args: { an: v.an } }).then(() => frm.reload_doc());
				}, __("Übergabe"));
			}, __("Aktionen"));
		}
		if (["Gepackt", "Uebergeben"].includes(st)) {
			frm.add_custom_button(frm.doc.lieferart === "Abholung" ? __("Als abgeholt buchen") : __("Als zugestellt buchen"), () => ph_logistik_unterschrift_dialog(frm), __("Aktionen"));
		}
		if (st === "Zugestellt" && (frm.doc.kunde_email || frm.doc.liefer_email)) {
			frm.add_custom_button(__("Lieferbestätigung senden"), () => frm.call({ method: "lieferbestaetigung_senden", doc: frm.doc, freeze: true }).then(() => { frappe.show_alert({ message: __("Gesendet"), indicator: "green" }); frm.reload_doc(); }), __("Aktionen"));
		}
		if (frm.doc.auftrag && ["Uebergeben", "Zugestellt"].includes(st) && !frm.doc.teilrechnung) {
			frm.add_custom_button(__("Teilrechnung erstellen"), () => frm.call({ method: "teilrechnung_erstellen", doc: frm.doc, freeze: true }).then((r) => r.message && frappe.set_route("Form", "PH Rechnung", r.message)), __("Aktionen"));
		}
		if (st === "Zugestellt") {
			frm.add_custom_button(__("Produktpässe erzeugen"), () => frm.call({ method: "produktpaesse_erzeugen", doc: frm.doc, freeze: true }).then(() => frappe.show_alert({ message: __("Produktpässe angelegt"), indicator: "green" })), __("Aktionen"));
		}
		if (!["Zugestellt", "Storniert"].includes(st)) {
			frm.add_custom_button(__("Stornieren"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }, (v) => {
					frappe.confirm(__("Lieferschein stornieren? Offene Sendungen werden beim Dienstleister storniert."), () => frm.call({ method: "stornieren", doc: frm.doc, args: { grund: v.grund } }).then(() => frm.reload_doc()));
				}, __("Storno"));
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Packliste drucken"), () => frappe.utils.print(frm.doctype, frm.docname, "PH Lieferschein Packliste", frm.doc.letter_head, "de"), __("Drucken"));
		frm.add_custom_button(__("Lieferschein drucken"), () => frappe.utils.print(frm.doctype, frm.docname, "PH Lieferschein Standard", frm.doc.letter_head, "de"), __("Drucken"));

		if (frm.doc.teillieferung) frm.dashboard.set_headline_alert(__("Teillieferung – Restmengen bleiben im Beleg offen."), "orange");
		if (frm.doc.versichern) frm.dashboard.add_indicator(__("Versichert: {0} €", [(frm.doc.versicherungswert_cent / 100).toFixed(2)]), "blue");
		const offen = (frm.doc.positionen || []).filter((p) => (p.menge_gepackt || 0) < p.menge).length;
		if (st === "Entwurf") frm.dashboard.add_indicator(offen ? __("{0} Position(en) offen", [offen]) : __("Alles gepackt"), offen ? "orange" : "green");
	},
});

function ph_logistik_tarif_dialog(frm) {
	frm.call({ method: "tarife", doc: frm.doc, freeze: true, freeze_message: __("Tarife werden abgefragt …") }).then((r) => {
		const t = r.message;
		if (!t || !t.tarife || !t.tarife.length) return;
		const opts = t.tarife.map((x) => ({ label: `${x.carrier} – ${x.name} · ${(x.cent / 100).toFixed(2)} €${x.tage != null ? ` · ${x.tage} Tag(e)` : ""}`, value: x.id }));
		const d = new frappe.ui.Dialog({
			title: __("Etikett erzeugen ({0})", [t.env === "mock" ? __("MOCK – kein echter Tarif") : t.env]),
			fields: [
				{ fieldname: "tarif", fieldtype: "Select", label: __("Dienst"), options: opts, default: t.empfehlung, reqd: 1 },
				{ fieldname: "hinweis", fieldtype: "HTML", options: `<p class="text-muted">${__("Empfehlung laut Einstellungen ist vorausgewählt. Gültig bis {0}.", [frappe.datetime.str_to_user(t.gueltig_bis.replace("T", " ").slice(0, 19))])}</p>` },
			],
			primary_action_label: __("Buchen und Etikett abrufen"),
			primary_action(v) {
				d.hide();
				frm.call({ method: "etikett_erzeugen", doc: frm.doc, args: { tarif_id: v.tarif }, freeze: true, freeze_message: __("Sendung wird gebucht …") }).then((r2) => {
					frm.reload_doc();
					if (r2.message) frappe.show_alert({ message: __("Sendung {0} gebucht", [r2.message]), indicator: "green" });
				});
			},
		});
		d.show();
	});
}

function ph_logistik_unterschrift_dialog(frm) {
	const d = new frappe.ui.Dialog({
		title: __("Übergabe bestätigen"),
		fields: [
			{ fieldname: "empfaenger_name", fieldtype: "Data", label: __("Empfangen von"), default: frm.doc.kunde_name, reqd: 1 },
			{ fieldname: "unterschrift", fieldtype: "Signature", label: __("Unterschrift") },
		],
		primary_action_label: __("Buchen"),
		primary_action(v) {
			d.hide();
			frm.call({ method: "als_zugestellt", doc: frm.doc, args: v, freeze: true }).then(() => frm.reload_doc());
		},
	});
	d.show();
}
