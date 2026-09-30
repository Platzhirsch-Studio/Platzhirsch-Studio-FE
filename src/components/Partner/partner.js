"use client";
import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

// Partnerat
const partners = [
  {
    name: "SM Immobilienverwaltung GmbH",
    logo: "/Images/Partner/partner1.png",
    role: "partner1.role",
    address: ["Grünegger 10", "6911 Lochau"],
    phone: "+43 5574 46255",
    email: "info@platzhirsch.studio"
  },
  {
    name: "Wertz Immobilien GmbH",
    logo: "/Images/Partner/partner2.png",
    role: "partner2.role",
    address: ["Am Schönbühl 1", "88131 Lindau (Bodensee)"],
    phone: "+49 8382 911 211 3",
    website: "https://wertz-immobilien.de",
  },
  {
    name: "FB Future Bauart Immobilien",
    logo: "/Images/Partner/partner3.png",
    role: "partner3.role",
    address: ["Rosamichlweg 10", "6800 Feldkirch"],
    phone: "+43 5574 581 58",
    website: "https://www.bauart.at/",
  },
  {
    name: "Ökovolt Solartechnik GmbH",
    logo: "/Images/Partner/partner4.png",
    role: "partner3.role",
    address: ["Gewerbegebiet 10", "5121 Ostermiething"],
    phone: "+43 6278 71030",
    website: "https://www.oekovolt.com/",
  },
  {
    name: "Rusch Abdichter, Spengler + Dachdecker GmbH",
    logo: "/Images/Partner/partner5.png",
    role: "partner4.role",
    address: ["Funkenstraße 8", "6923 Lauterach"],
    phone: "+43 5574 716 70",
    website: "https://rusch.at/de-de",
  },
  {
    name: "Stecher Elektrotechnik",
    logo: "/Images/Partner/partner6.png",
    role: "partner5.role",
    address: ["Alberlochstraße 7", "6911 Lochau"],
    phone: "+43 5574 53565",
    website: "https://elektro-stecher.at",
  },
  {
    name: "Platzhirsch Café Lounge",
    logo: "/Images/Partner/partner1.png",
    role: "partner6.role",
    address: ["Landstrasse 9", "6911 Lochau"],
    phone: "+43 5574 46257",
    website: "https://platzhirsch.cafe",
  },
  {
    name: "Gasthaus Moosegg",
    logo: "/Images/Partner/partner8.png",
    role: "partner7.role",
    address: ["Moosegg 1", "6911 Lochau"],
    phone: "+43 5574 58696",
    website: "https://www.moosegg.at",
  },
];

const PartnerSection = () => {
  const t = useTranslations("partners");
  return (
    <div className="max-w-7xl mx-auto px-4 my-10 lg:my-16">
      <div
        className="text-center mb-10 lg:mb-16" style={{
          animation: "fade-in-up-smooth 0.5s ease-out forwards",
        }}>

        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#30373e] mb-4">{t("headline")}</h2>
        <p className="text-[#30373e]/80 max-w-xl mx-auto">
          {t("description")}
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center"
        style={{
          animation: "fade-in-up-smooth 0.6s ease-in-out forwards",
        }}
      >
        {partners.map((partner, idx) => (
          <div
            key={partner.name}
            className="flex flex-col items-center transition-all duration-300"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div
              className="relative w-[160px] h-[80px] mb-6"
              style={{
                animation: "fade-in-up-smooth 0.5s ease-out forwards",
              }}>
              <Image
                src={partner.logo}
                alt={partner.name || "Partner logo"}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 140px, 160px"
              />
            </div>

            <div
              className="text-sm text-[#30373e]/90"
              style={{
                animation: "fade-in-up-smooth 0.5s ease-out forwards",
              }}
            >
              <p className="font-semibold">{partner.name}</p>
              {partner.role && <p className="mb-2">{t(`${idx}.role`)}</p>}
              {partner.address.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              {partner.phone && (
                <p className="mt-2">
                  {t("phone")}: <a href={`tel:${partner.phone}`} className="text-[#d1b250] hover:underline">{partner.phone}</a>
                </p>
              )}
              {partner.email && (
                <p>
                  {t("email")}: <a href={`mailto:${partner.email}`} className="text-[#d1b250] hover:underline">{partner.email}</a>
                </p>
              )}
              {partner.website && (
                <p>
                  <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-[#d1b250] hover:underline">
                    {t("website")}
                  </a>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <style jsx>
        {`@keyframes fade-in-up-smooth {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}`}
      </style>
    </div>
  );
};

export default PartnerSection;
