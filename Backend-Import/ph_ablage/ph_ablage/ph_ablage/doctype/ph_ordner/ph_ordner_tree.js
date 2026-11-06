frappe.treeview_settings["PH Ordner"] = {
	breadcrumb: "PH Ablage",
	title: __("Ablage"),
	root_label: __("Ablage"),
	get_tree_root: false,
	filters: [],
	fields: [
		{ fieldtype: "Data", fieldname: "titel", label: __("Ordnername"), reqd: true },
		{ fieldtype: "Select", fieldname: "rechte_modus", label: __("Rechte-Modus"), options: "\nintern\nteam\nleitung" },
		{ fieldtype: "Check", fieldname: "is_group", label: __("Gruppe"), default: 1, hidden: 1 },
	],
	ignore_fields: ["parent_ph_ordner"],
	onload(treeview) {
		treeview.page.add_inner_button(__("Dateien"), () => frappe.set_route("List", "PH Datei"));
	},
};
