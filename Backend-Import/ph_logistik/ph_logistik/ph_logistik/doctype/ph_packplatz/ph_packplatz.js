// PH Packplatz – Profil je Gerät; „Packtisch öffnen“ übergibt den Gerätenamen.
frappe.ui.form.on("PH Packplatz", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Packtisch öffnen"), () => {
			try { localStorage.setItem("ph_packplatz", frm.doc.geraet); } catch (e) { /* ohne Speicher */ }
			frappe.set_route("ph-packtisch");
		}, __("Aktionen"));
	},
});
