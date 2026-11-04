// PH Bankumsatz – Buttons: Zuordnen (Dialog mit Vorschlägen), Ignorieren, Wieder öffnen.
frappe.ui.form.on("PH Bankumsatz", {
	refresh(frm) {
		ph_faktura.indicator(frm);
		if (frm.is_new()) return;
		if (frm.doc.vorschlag_beleg && frm.doc.status === "Offen") {
			frm.dashboard.set_headline_alert(__("Vorschlag: {0} ({1}, {2} %)", [frm.doc.vorschlag_beleg, frm.doc.vorschlag_grund, frm.doc.vorschlag_sicherheit]), frm.doc.vorschlag_sicherheit >= 80 ? "green" : "orange");
		}
		if (["Offen", "Teilweise"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Zuordnen"), () => zuordnen_dialog(frm), __("Aktionen"));
			frm.add_custom_button(__("Ignorieren"), () => {
				frappe.prompt([{ fieldname: "grund", fieldtype: "Data", label: __("Grund"), default: __("Kein Beleg (Gebühr, Umbuchung)") }], (v) => frm.call({ method: "ignorieren", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Umsatz ignorieren"), __("Ignorieren"));
			}, __("Aktionen"));
		}
		if (frm.doc.status === "Ignoriert") frm.add_custom_button(__("Wieder öffnen"), () => frm.call({ method: "wieder_oeffnen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
	},
});

function zuordnen_dialog(frm) {
	frm.call({ method: "vorschlaege", doc: frm.doc, freeze: true }).then((r) => {
		const { vorschlag, belege } = r.message || {};
		const rest = Math.abs(frm.doc.betrag_cent) - (frm.doc.zugeordnet_cent || 0);
		const optionen = (belege || []).map((b) => ({ label: `${b.name} · ${b.kunde_name || ""} · ${ph_faktura.betrag(b.offen_cent)}`, value: `${b.doctype}|${b.name}` }));
		const d = new frappe.ui.Dialog({
			title: __("Bankumsatz zuordnen"),
			fields: [
				{ fieldtype: "HTML", options: `<p>${frappe.utils.escape_html(frm.doc.auftraggeber || "")} · <b>${ph_faktura.betrag(frm.doc.betrag_cent)}</b><br><span class="text-muted small">${frappe.utils.escape_html(frm.doc.verwendungszweck || "")}</span></p>` },
				{ fieldname: "beleg", fieldtype: "Autocomplete", label: __("Beleg"), options: optionen, reqd: 1, default: vorschlag ? `${vorschlag.doctype}|${vorschlag.name}` : undefined },
				{ fieldname: "betrag_cent", fieldtype: "Int", label: __("Betrag (Cent)"), default: rest, reqd: 1 },
			],
			primary_action_label: __("Zuordnen und Zahlung buchen"),
			primary_action: (v) => {
				const [beleg_doctype, beleg] = String(v.beleg).split("|");
				frm.call({ method: "zuordnen", doc: frm.doc, args: { beleg_doctype, beleg, betrag_cent: v.betrag_cent }, freeze: true }).then(() => { d.hide(); frm.reload_doc(); });
			},
		});
		d.show();
	});
}
