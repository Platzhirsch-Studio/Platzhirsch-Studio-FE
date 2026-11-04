frappe.query_reports["PH Kontakt Datenauskunft"] = {
	filters: [{ fieldname: "kontakt", label: __("Kontakt"), fieldtype: "Link", options: "PH Kontakt", reqd: 1 }],
	onload(report) {
		report.page.add_inner_button(__("Als PDF (Druckformat)"), () => {
			const k = report.get_filter_value("kontakt");
			if (k) window.open(frappe.urllib.get_full_url(`/printview?doctype=${encodeURIComponent("PH Kontakt")}&name=${encodeURIComponent(k)}&format=${encodeURIComponent("PH Kontakt DSGVO-Auskunft")}&no_letterhead=1`));
		});
	},
};
