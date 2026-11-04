// PH Wareneingang – Positionen aus der Bestellung laden, Zustand farbig, Reklamation.
frappe.ui.form.on("PH Wareneingang", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "blue", Teilweise: "orange", Vollstaendig: "green", Reklamiert: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) {
			if (frm.doc.herstellerbestellung && !(frm.doc.positionen || []).length) positionen_laden(frm);
			return;
		}
		if (frm.doc.reklamation) {
			frm.dashboard.set_headline_alert(__("Reklamation nötig – Lieferant informieren, Fotos sichern."), "red");
			frm.add_custom_button(__("Reklamation an Lieferant"), () => {
				frappe.confirm(__("Reklamationsmail mit Positionen und Fotos an den Lieferanten senden?"), () => {
					frm.call({ method: "reklamation_melden", doc: frm.doc, freeze: true }).then((r) => frappe.show_alert({ message: __("Gesendet an {0}", [r.message]), indicator: "green" }));
				});
			}, __("Aktionen"));
			if (frappe.boot.single_types && frappe.get_meta("PH Servicefall")) frm.add_custom_button(__("Servicefall anlegen"), () => frappe.new_doc("PH Servicefall", { lieferschein: frm.doc.name }), __("Aktionen"));
		}
		frm.add_custom_button(__("Bestellung öffnen"), () => frappe.set_route("Form", "PH Herstellerbestellung", frm.doc.herstellerbestellung), __("Ansehen"));
	},
	herstellerbestellung(frm) {
		if (frm.is_new() && frm.doc.herstellerbestellung) positionen_laden(frm);
	},
});

frappe.ui.form.on("PH Wareneingang Position", {
	zustand(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		if (row.zustand === "fehlt") frappe.model.set_value(cdt, cdn, "menge_erhalten", 0);
	},
});

function positionen_laden(frm) {
	frappe.db.get_doc("PH Herstellerbestellung", frm.doc.herstellerbestellung).then((hb) => {
		frm.clear_table("positionen");
		(hb.positionen || []).forEach((p) => {
			if (p.status === "Storniert") return;
			const rest = (p.ab_menge || p.menge) - (p.menge_erhalten || 0);
			if (rest <= 0) return;
			frm.add_child("positionen", { position: p.idx, produkt: p.produkt, bezeichnung: p.bezeichnung, menge_erwartet: rest, menge_erhalten: rest, zustand: "ok" });
		});
		frm.refresh_field("positionen");
	});
}
