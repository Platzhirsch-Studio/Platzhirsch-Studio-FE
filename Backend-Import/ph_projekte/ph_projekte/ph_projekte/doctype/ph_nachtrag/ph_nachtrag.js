// PH Nachtrag – Vorlegen, Unterschrift des Kunden (Freigabe), Ablehnen, Druck.
frappe.ui.form.on("PH Nachtrag", {
	refresh(frm) {
		const farben = { Entwurf: "gray", Vorgelegt: "blue", Freigegeben: "green", Abgelehnt: "red", Storniert: "gray" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.status === "Entwurf") {
			frm.add_custom_button(__("Kunden vorlegen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Nachtrag vorlegen"),
					fields: [
						{ fieldname: "nachricht", fieldtype: "Small Text", label: __("Nachricht (optional)") },
						{ fieldname: "frist", fieldtype: "Date", label: __("Freigabe bis") },
					],
					primary_action_label: __("Vorlegen"),
					primary_action(v) { frm.call({ method: "kunden_vorlegen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); }); },
				});
				d.show();
			}, __("Aktionen"));
		}
		if (frm.doc.status === "Vorgelegt") {
			frm.add_custom_button(__("Unterschrift Kunde (Freigabe)"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Freigabe durch den Kunden"),
					fields: [
						{ fieldname: "name_kunde", fieldtype: "Data", label: __("Name"), reqd: 1 },
						{ fieldname: "unterschrift", fieldtype: "Signature", label: __("Unterschrift"), reqd: 1 },
					],
					primary_action_label: __("Freigeben"),
					primary_action(v) { frm.call({ method: "freigabe_erfassen", doc: frm.doc, args: v, freeze: true }).then(() => { d.hide(); frm.reload_doc(); }); },
				});
				d.show();
			}, __("Aktionen"));
			frm.add_custom_button(__("Ablehnen"), () => {
				frappe.prompt({ fieldname: "grund", fieldtype: "Small Text", label: __("Grund") }, (v) => frm.call({ method: "ablehnen", doc: frm.doc, args: v }).then(() => frm.reload_doc()), __("Nachtrag ablehnen"));
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Nachtrag PDF"), () => {
			window.open(`/api/method/frappe.utils.print_format.download_pdf?doctype=${encodeURIComponent(frm.doctype)}&name=${encodeURIComponent(frm.doc.name)}&format=${encodeURIComponent("PH Nachtrag Standard")}&no_letterhead=1`);
		}, __("Aktionen"));
		frm.add_custom_button(__("Auftragsmappe"), () => frappe.set_route("ph-auftragsmappe", { projekt: frm.doc.projekt }));
	},
});
