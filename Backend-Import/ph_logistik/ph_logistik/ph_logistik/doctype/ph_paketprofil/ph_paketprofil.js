frappe.ui.form.on("PH Paketprofil", {
	refresh(frm) {
		if (!frm.doc.geprueft) frm.dashboard.set_headline_alert(__("Schätzung – gilt nur im Testmodus. Karton messen, Werte eintragen, „Geprüft“ setzen (PAKETPROFILE.md)."), "orange");
		if (frm.doc.versand_gesperrt) frm.dashboard.set_headline_alert(__("Versand gesperrt: {0}", [frm.doc.versand_gesperrt]), "red");
	},
	glas(frm) {
		if (frm.doc.glas) frm.set_value("zerbrechlich", 1);
	},
});
