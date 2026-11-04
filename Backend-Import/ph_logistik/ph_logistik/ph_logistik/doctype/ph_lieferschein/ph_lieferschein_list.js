frappe.listview_settings["PH Lieferschein"] = {
	add_fields: ["status", "lieferart", "datum", "tour"],
	filters: [["status", "in", ["Entwurf", "Gepackt", "Uebergeben"]]],
	get_indicator(doc) {
		const farben = { Entwurf: "blue", Gepackt: "orange", Uebergeben: "purple", Zugestellt: "green", Storniert: "gray" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Packtisch"), () => frappe.set_route("ph-packtisch"));
	},
};
