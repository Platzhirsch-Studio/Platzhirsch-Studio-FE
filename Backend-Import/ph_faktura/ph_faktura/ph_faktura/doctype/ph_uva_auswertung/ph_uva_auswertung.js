frappe.ui.form.on("PH UVA Auswertung", {
	refresh(frm) {
		ph_faktura.indicator(frm);
		kennzahlen(frm);
		if (frm.is_new()) return;
		if (frm.doc.status !== "Uebergeben") frm.add_custom_button(__("Berechnen"), () => frm.call({ method: "berechnen", doc: frm.doc, freeze: true }).then(() => frm.reload_doc()), __("Aktionen"));
		if (frm.doc.status === "Berechnet") frm.add_custom_button(__("An Steuerberater übergeben"), () => frm.call({ method: "als_uebergeben", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		frm.add_custom_button(__("UVA Zuarbeit (Report)"), () => frappe.set_route("query-report", "PH UVA Zuarbeit", { von: frm.doc.zeitraum_von, bis: frm.doc.zeitraum_bis }));
	},
});
function kennzahlen(frm) {
	if (!frm.fields_dict.kennzahlen_html || frm.is_new()) return;
	const d = frm.doc;
	const b = (c) => ph_faktura.betrag(c);
	const row = (k, l, bem, st) => `<tr><td class="text-muted">${k}</td><td>${l}</td><td class="text-right">${bem === null ? "" : b(bem)}</td><td class="text-right">${st === null ? "" : b(st)}</td></tr>`;
	frm.fields_dict.kennzahlen_html.$wrapper.html(`<table class="table table-sm" style="max-width:720px;font-size:13px"><thead><tr><th>KZ</th><th>${__("Bezeichnung")}</th><th class="text-right">${__("Bemessung")}</th><th class="text-right">${__("Steuer")}</th></tr></thead><tbody>
		${row("000", __("Umsätze gesamt"), d.kz000_cent, null)}${row("022", "20 %", d.kz022_cent, d.kz022_ust_cent)}${row("029", "10 %", d.kz029_cent, d.kz029_ust_cent)}${row("006", "13 %", d.kz006_cent, d.kz006_ust_cent)}
		${row("017", __("igL"), d.kz017_cent, null)}${row("021", __("Reverse Charge"), d.kz021_cent, null)}${row("011", __("Ausfuhr"), d.kz011_cent, null)}
		${row("070/072", __("igE"), d.kz070_cent, d.kz072_cent)}${row("057", __("RC Steuerschuld"), null, d.kz057_cent)}${row("060", __("Vorsteuer"), null, d.kz060_cent)}${row("065/066", __("Vorsteuer igE/RC"), null, (d.kz065_cent || 0) + (d.kz066_cent || 0))}
		${row("—", __("Anzahlungen vereinnahmt"), d.anzahlungen_vereinnahmt_cent, d.anzahlungen_ust_cent)}${row("OSS", __("OSS gesamt"), d.oss_umsatz_cent, d.oss_ust_cent)}
		<tr style="font-weight:600;border-top:2px solid var(--text-color)"><td></td><td>${__("Zahllast / Gutschrift")}</td><td></td><td class="text-right" style="color:${d.zahllast_cent > 0 ? "#b45309" : "#15803d"}">${b(d.zahllast_cent)}</td></tr></tbody></table>`);
}
