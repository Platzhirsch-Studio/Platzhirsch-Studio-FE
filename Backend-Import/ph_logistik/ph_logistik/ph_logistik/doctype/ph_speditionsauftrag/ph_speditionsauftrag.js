// PH Speditionsauftrag – Buttons (CONVENTIONS 8)
frappe.ui.form.on("PH Speditionsauftrag", {
	refresh(frm) {
		if (frm.is_new()) return;
		const st = frm.doc.status;
		const g = __("Aktionen");
		if (["Entwurf", "Gesendet"].includes(st)) {
			frm.add_custom_button(__("An Spediteur senden"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Speditionsauftrag senden"),
					fields: [
						{ fieldname: "an", fieldtype: "Data", options: "Email", label: __("E-Mail Spediteur"), default: frm.doc.spediteur_email, reqd: 1 },
						{ fieldname: "text", fieldtype: "Small Text", label: __("Zusatztext") },
					],
					primary_action_label: __("Senden"),
					primary_action(v) {
						d.hide();
						frm.call({ method: "per_email_senden", doc: frm.doc, args: { an: v.an, text: v.text } }).then(() => frm.reload_doc());
					},
				});
				d.show();
			}, g);
		}
		if (["Gesendet", "Bestaetigt"].includes(st)) {
			frm.add_custom_button(__("Bestätigung erfassen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Bestätigung des Spediteurs"),
					fields: [
						{ fieldname: "preis", fieldtype: "Currency", label: __("Preis (EUR)") },
						{ fieldname: "abhol_datum", fieldtype: "Date", label: __("Abholdatum"), default: frm.doc.abhol_datum },
						{ fieldname: "zustell_datum", fieldtype: "Date", label: __("Zustelldatum"), default: frm.doc.zustell_datum },
						{ fieldname: "referenz", fieldtype: "Data", label: __("Auftragsnummer Spediteur") },
					],
					primary_action_label: __("Speichern"),
					primary_action(v) {
						d.hide();
						const preis_cent = v.preis ? Math.round(v.preis * 100) : null;
						frm.call({ method: "bestaetigen", doc: frm.doc, args: { preis_cent, abhol_datum: v.abhol_datum, zustell_datum: v.zustell_datum, referenz: v.referenz } }).then(() => frm.reload_doc());
					},
				});
				d.show();
			}, g);
			frm.add_custom_button(__("Abgeholt"), () => frm.call({ method: "abgeholt", doc: frm.doc }).then(() => frm.reload_doc()), g);
		}
		if (["Gesendet", "Bestaetigt", "Abgeholt"].includes(st)) {
			frm.add_custom_button(__("Zugestellt (Quittung)"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Zustellung quittieren"),
					fields: [
						{ fieldname: "empfaenger_name", fieldtype: "Data", label: __("Empfänger"), reqd: 1 },
						{ fieldname: "unterschrift", fieldtype: "Signature", label: __("Unterschrift") },
					],
					primary_action_label: __("Buchen"),
					primary_action(v) {
						d.hide();
						frm.call({ method: "zugestellt", doc: frm.doc, args: v }).then(() => frm.reload_doc());
					},
				});
				d.show();
			}, g);
		}
		if (!["Zugestellt", "Storniert"].includes(st)) {
			frm.add_custom_button(__("Stornieren"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }, (v) => {
					frm.call({ method: "stornieren", doc: frm.doc, args: { grund: v.grund } }).then(() => frm.reload_doc());
				}, __("Speditionsauftrag stornieren"));
			}, g);
		}
		frm.add_custom_button(__("Auftrag drucken"), () => frm.print_doc(), g);
		if (frm.doc.lademeter) {
			frm.dashboard.add_comment(__("{0} Packstücke · {1} kg · {2} m³ · {3} Lademeter (Planwerte)", [frm.doc.anzahl_packstuecke, ((frm.doc.gewicht_g || 0) / 1000).toFixed(1), frm.doc.volumen_m3, frm.doc.lademeter]), "blue", true);
		}
	},
});
