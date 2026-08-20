"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { Download, ChevronUp } from "lucide-react";

// Helper to group additional info values by key
function groupAdditionalInformation(additional_information) {
  const grouped = {
    gewicht: [],
    dimensions: [],
    material: [],
    farbe: [],
  };

  additional_information.forEach((row) => {
    if (row.gewicht) grouped.gewicht.push(row.gewicht);
    if (row.dimensions) grouped.dimensions.push(row.dimensions);
    if (row.material) grouped.material.push(row.material);
    if (row.farbe) grouped.farbe.push(row.farbe);
  });

  return grouped;
} // Default description if not found

// Helper to get the correct description by locale
function getMehrBeschreibungByLocale(produkt, locale) {
  switch (locale) {
    case "en":
      return produkt?.mehr_beschreibung_en || "";
    case "it":
      return produkt?.mehr_beschreibung_it || "";
    case "fr":
      return produkt?.mehr_beschreibung_fr || "";
    case "de":
      return produkt?.mehr_beschreibung || "";
    default:
      return produkt?.beschreibung || "";
  }
}

// Helper for file extension
function getFileType(filepath = "") {
  if (!filepath) return "";
  const ext = filepath.split(".").pop().toUpperCase();
  return ext;
}

export default function ProductDescriptionTabs({ produkt }) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname) || "de";
  const [activeTab, setActiveTab] = useState("description");
  const [expandedSections, setExpandedSections] = useState({
    "2d": true,
    "3d": true,
    digital: true,
  });

  const additional_information = produkt?.additional_information || [];
  const pdf_produkte = produkt?.pdf_produkte || [];
  const grouped = groupAdditionalInformation(additional_information);

  const description = getMehrBeschreibungByLocale(produkt, locale);

  // A ka përmbajtje secila seksion?
  const hasDescription = Boolean(description && description.trim().length > 0);
  const hasAdditional =
    grouped.gewicht.length > 0 ||
    grouped.dimensions.length > 0 ||
    grouped.material.length > 0 ||
    grouped.farbe.length > 0;
  const hasFiles = Array.isArray(pdf_produkte)
    ? pdf_produkte.some((file) => file?.["2d"] || file?.["3d"] || file?.katalog)
    : false;

  // Ndërto tab‑at vetëm për seksionet që kanë të dhëna
  const tabs = [];

  if (hasDescription) {
    tabs.push({
      id: "description",
      label:
        locale === "en"
          ? "Description"
          : locale === "it"
          ? "Descrizione"
          : locale === "fr"
          ? "Description"
          : "Beschreibung",
    });
  }

  if (hasAdditional) {
    tabs.push({
      id: "additional",
      label:
        locale === "en"
          ? "Additional Information"
          : locale === "it"
          ? "Informazioni Aggiuntive"
          : locale === "fr"
          ? "Informations Supplémentaires"
          : "Zusätzliche Informationen",
    });
  }

  if (hasFiles) {
    tabs.push({
      id: "files",
      label:
        locale === "en"
          ? "Download"
          : locale === "it"
          ? "Scarica"
          : locale === "fr"
          ? "Télécharger"
          : "Dateien ",
    });
  }

  // Nëse asnjë seksion nuk ka të dhëna, mos shfaq komponentin fare
  if (!hasDescription && !hasAdditional && !hasFiles) {
    return null;
  }

  // Sigurohu që tab aktiv ekziston; përndryshe përdor të parin nga lista
  const effectiveActiveTab =
    tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0]?.id || null;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-6 bg-white rounded-2xl shadow-sm">
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row border-b border-gray-200 mb-8 gap-2 sm:gap-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 font-medium transition-colors duration-200 border-b-2
        ${
          effectiveActiveTab === tab.id
            ? "text-black border-black text-normal"
            : "text-gray-500 border-transparent hover:text-gray-700 text-sm"
        }
      `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* --- Description Tab --- */}
        {effectiveActiveTab === "description" && (
          <div className="space-y-6">
            {description ? (
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg whitespace-pre-line">{description}</p>
            ) : (
              <p className="text-gray-500 text-base">
                {" "}
                {locale === "en"
                  ? "No description available."
                  : locale === "it"
                  ? "Nessuna descrizione disponibile."
                  : locale === "fr"
                  ? "Aucune description disponible."
                  : "Keine Beschreibung verfügbar."}
              </p>
            )}
          </div>
        )}

        {/* --- Additional Information Tab --- */}
        {effectiveActiveTab === "additional" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {locale === "en"
                ? "Additional Information"
                : locale === "it"
                ? "Informazioni Aggiuntive"
                : locale === "fr"
                ? "Informations Supplémentaires"
                : "Zusätzliche Informationen"}
            </h3>
            {grouped.gewicht.length > 0 ||
            grouped.dimensions.length > 0 ||
            grouped.material.length > 0 ||
            grouped.farbe.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <tbody>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-gray-600 whitespace-nowrap">Weight</td>
                      <td className="py-2 text-gray-800">{grouped.gewicht.join(", ") || "-"}</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-gray-600 whitespace-nowrap">Dimensions</td>
                      <td className="py-2 text-gray-800">{grouped.dimensions.join(", ") || "-"}</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-gray-600 whitespace-nowrap">Material</td>
                      <td className="py-2 text-gray-800">{[...new Set(grouped.material)].join(", ") || "-"}</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-gray-600 whitespace-nowrap">Color</td>
                      <td className="py-2 text-gray-800">{grouped.farbe.join(", ") || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-base">
                {" "}
                {locale === "en"
                  ? "No description available."
                  : locale === "it"
                  ? "Nessuna descrizione disponibile."
                  : locale === "fr"
                  ? "Aucune description disponible."
                  : "Keine Beschreibung verfügbar."}
              </p>
            )}
          </div>
        )}

        {/* --- Files (PDF Produkte) Tab --- */}
        {effectiveActiveTab === "files" && (
          <div className="space-y-8">
            {/* 2D Section */}
            <div className="border-b border-gray-200 pb-8">
              <div
                className="flex items-center justify-between cursor-pointer mb-6"
                onClick={() => toggleSection("2d")}
              >
                <h3 className="text-sm sm:text-base font-medium text-gray-800 tracking-wide">2D</h3>
                <ChevronUp
                  className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections["2d"] ? "" : "rotate-180"}`}
                />
              </div>
              {expandedSections["2d"] &&
                (() => {
                  const files2D = pdf_produkte.filter((file) => file["2d"]);
                  if (files2D.length > 0) {
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {files2D.map((file, idx) => (
                          <div key={idx} className="flex flex-col items-start">
                            <div className="w-16 h-20 border border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50 mb-3">
                              <span className="text-xs text-gray-600 font-medium">{getFileType(file["2d"])}</span>
                            </div>
                            <a
                              href={file["2d"]}
                              download
                              className="flex items-center gap-1 text-xs text-blue-600 mt-1 hover:underline"
                            >
                              <Download className="w-3 h-3" />
                              <span>
                                {locale === "en"
                                  ? "Download"
                                  : locale === "it"
                                  ? "Scarica"
                                  : locale === "fr"
                                  ? "Télécharger"
                                  : "Dateien "}
                              </span>
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-gray-500 text-base">
                        {locale === "en"
                          ? "No 2D files available."
                          : locale === "it"
                          ? "Nessun file 2D disponibile."
                          : locale === "fr"
                          ? "Aucun fichier 2D disponible."
                          : "Keine 2D-Dateien verfügbar."}
                      </div>
                    );
                  }
                })()}
            </div>

            {/* 3D Section */}
            <div className="border-b border-gray-200 pb-8">
              <div
                className="flex items-center justify-between cursor-pointer mb-6"
                onClick={() => toggleSection("3d")}
              >
                <h3 className="text-sm sm:text-base font-medium text-gray-800 tracking-wide">3D</h3>
                <ChevronUp
                  className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections["3d"] ? "" : "rotate-180"}`}
                />
              </div>
              {expandedSections["3d"] &&
                (() => {
                  const files3D = pdf_produkte.filter((file) => file["3d"]);
                  if (files3D.length > 0) {
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {files3D.map((file, idx) => (
                          <div key={idx} className="flex flex-col items-start">
                            <div className="w-16 h-20 border border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50 mb-3">
                              <span className="text-xs text-gray-600 font-medium">{getFileType(file["3d"])}</span>
                            </div>
                            <a
                              href={file["3d"]}
                              download
                              className="flex items-center gap-1 text-xs text-blue-600 mt-1 hover:underline"
                            >
                              <Download className="w-3 h-3" />
                              <span>
                                {locale === "en"
                                  ? "Download"
                                  : locale === "it"
                                  ? "Scarica"
                                  : locale === "fr"
                                  ? "Télécharger"
                                  : "Dateien "}
                              </span>
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-gray-500 text-base">
                        {" "}
                        {locale === "en"
                          ? "No 3D files available."
                          : locale === "it"
                          ? "Nessun file 3D disponibile."
                          : locale === "fr"
                          ? "Aucun fichier 3D disponible."
                          : "Keine 3D-Dateien verfügbar."}
                      </div>
                    );
                  }
                })()}
            </div>

            {/* Digital Catalog Section */}
            <div>
              <div
                className="flex items-center justify-between cursor-pointer mb-6"
                onClick={() => toggleSection("digital")}
              >
                <h3 className="text-sm sm:text-base font-medium text-gray-800 tracking-wide">
                  {" "}
                  {locale === "en"
                    ? "Digital Catalog"
                    : locale === "it"
                    ? "Catalogo digitale"
                    : locale === "fr"
                    ? "Catalogue numérique"
                    : "Digitaler Katalog "}
                </h3>
                <ChevronUp
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedSections["digital"] ? "" : "rotate-180"
                  }`}
                />
              </div>
              {expandedSections["digital"] &&
                (() => {
                  const filesCatalog = pdf_produkte.filter((file) => file.katalog);
                  if (filesCatalog.length > 0) {
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filesCatalog.map((file, idx) => (
                          <div key={idx} className="flex flex-col items-start">
                            <div className="w-16 h-20 border border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50 mb-3">
                              <span className="text-xs text-gray-600 font-medium">{getFileType(file.katalog)}</span>
                            </div>
                            <a
                              href={file.katalog}
                              download
                              className="flex items-center gap-1 text-xs text-blue-600 mt-1 hover:underline"
                            >
                              <Download className="w-3 h-3" />
                              <span>
                                {locale === "en"
                                  ? "Download"
                                  : locale === "it"
                                  ? "Scarica"
                                  : locale === "fr"
                                  ? "Télécharger"
                                  : "Dateien "}
                              </span>
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-gray-500 text-base">
                        {" "}
                        {locale === "en"
                          ? "No Digital Catalog available."
                          : locale === "it"
                          ? "Nessun catalogo digitale disponibile."
                          : locale === "fr"
                          ? "Aucun catalogue numérique disponible."
                          : "Kein digitaler Katalog verfügbar."}
                      </div>
                    );
                  }
                })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
