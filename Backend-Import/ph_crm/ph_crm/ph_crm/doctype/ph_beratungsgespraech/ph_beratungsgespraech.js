// PH Beratungsgespraech – Buttons: Aufgabe für nächsten Schritt, Planung beauftragen, Angebot, Abschließen, Protokoll drucken.
frappe.ui.form.on("PH Beratungsgespraech", {
	setup(frm) {
		frm.set_query("berater", () => ({ filters: { enabled: 1, user_type: "System User" } }));
		frm.set_query("termin", () => ({ filters: { kontakt: frm.doc.kontakt || ["is", "set"] } }));
	},

	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "orange", "Planung beauftragt": "blue", Angebot: "purple", Abgeschlossen: "green" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) {
			if (!frm.doc.datum) frm.set_value("datum", frappe.datetime.get_today());
			if (!frm.doc.berater) frm.set_value("berater", frappe.session.user);
			return;
		}
		const setze = (status) => frm.call({ method: "status_setzen", doc: frm.doc, args: { status } }).then(() => frm.reload_doc());

		if (frm.doc.__onload && frm.doc.__onload.aufgabe_vorschlagen) {
			frm.dashboard.set_headline_alert(__("Nächster Schritt eingetragen – als Aufgabe übernehmen? (Aktionen → Aufgabe: nächster Schritt)"), "blue");
		}
		frm.add_custom_button(__("Vorlage übernehmen"), () => {
			frappe.prompt({ fieldname: "vorlage", fieldtype: "Link", options: "PH Beratungsvorlage", label: __("Vorlage"), reqd: 1, default: frm.doc.vorlage, get_query: () => ({ filters: { aktiv: 1 } }) }, (v) => frm.call({ method: "vorlage_anwenden", doc: frm.doc, args: v, freeze: true }).then((r) => {
				frappe.show_alert({ message: __("{0} Fragen übernommen", [r.message || 0]), indicator: "green" });
				frm.reload_doc();
			}), __("Gesprächsleitfaden"));
		}, __("Aktionen"));
		frm.add_custom_button(__("Protokoll an Kunden senden"), () => {
			frappe.db.get_value("PH Kontakt", frm.doc.kontakt, "email").then((r) => {
				frappe.prompt([
					{ fieldname: "empfaenger", fieldtype: "Data", options: "Email", label: __("An"), reqd: 1, default: (r.message || {}).email },
					{ fieldname: "nachricht", fieldtype: "Text Editor", label: __("Nachricht (leer = Standardtext)") },
				], (v) => frm.call({ method: "protokoll_senden", doc: frm.doc, args: v, freeze: true }).then(() => {
					frappe.show_alert({ message: __("Protokoll gesendet an {0}", [v.empfaenger]), indicator: "green" });
					frm.reload_doc();
				}), __("Protokoll senden"));
			});
		}, __("Aktionen"));
		frm.add_custom_button(__("Aufgabe: nächster Schritt"), () => {
			frm.call({ method: "aufgabe_anlegen", doc: frm.doc }).then((r) => r.message && frappe.set_route("Form", "PH Aufgabe", r.message));
		}, __("Aktionen"));
		if (frm.doc.status === "Offen") {
			frm.add_custom_button(__("Planung beauftragen"), () => {
				frappe.prompt({ fieldname: "planer", fieldtype: "Link", options: "User", label: __("Planer (optional)") }, (v) => frm.call({ method: "planung_beauftragen", doc: frm.doc, args: v, freeze: true }).then((r) => (r.message ? frappe.set_route("Form", "PH Projekt", r.message) : frm.reload_doc())), __("Planung beauftragen und Projekt anlegen"));
			}, __("Aktionen"));
		}
		if (["Offen", "Planung beauftragt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Angebot"), () => {
				if (frappe.boot.user.can_create && frappe.boot.user.can_create.includes("PH Angebot")) {
					frappe.new_doc("PH Angebot", { kontakt: frm.doc.kontakt });
					setze("Angebot");
				} else {
					setze("Angebot");
				}
			}, __("Aktionen"));
		}
		if (frm.doc.status !== "Abgeschlossen") frm.add_custom_button(__("Abschließen"), () => setze("Abgeschlossen"), __("Aktionen"));
		else frm.add_custom_button(__("Wieder öffnen"), () => setze("Offen"), __("Aktionen"));

		frm.add_custom_button(__("Protokoll drucken"), () => {
			window.open(frappe.urllib.get_full_url(`/printview?doctype=${encodeURIComponent("PH Beratungsgespraech")}&name=${encodeURIComponent(frm.doc.name)}&format=${encodeURIComponent("PH Beratungsgespraech Protokoll")}&no_letterhead=1`));
		});
		if (frm.doc.kontakt) frm.add_custom_button(__("Kontakt öffnen"), () => frappe.set_route("Form", "PH Kontakt", frm.doc.kontakt));
		if (frm.doc.termin) frm.add_custom_button(__("Termin öffnen"), () => frappe.set_route("Form", "PH Termin", frm.doc.termin));
	},

	termin(frm) {
		if (!frm.doc.termin) return;
		frappe.db.get_value("PH Termin", frm.doc.termin, ["kontakt", "start", "berater", "modus", "dauer_min"]).then((r) => {
			const t = r.message || {};
			if (t.kontakt && !frm.doc.kontakt) frm.set_value("kontakt", t.kontakt);
			if (t.start) frm.set_value("datum", t.start.slice(0, 10));
			if (t.berater) frm.set_value("berater", t.berater);
			if (t.modus) frm.set_value("ort", t.modus);
			if (t.dauer_min) frm.set_value("dauer_min", t.dauer_min);
		});
	},
});

frappe.ui.form.on("PH Beratungsgespraech Raum", {
	budget_cent: summe,
	raeume_remove: summe,
});

function summe(frm) {
	frm.set_value("budget_gesamt_cent", (frm.doc.raeume || []).reduce((s, z) => s + (parseInt(z.budget_cent, 10) || 0), 0));
}
