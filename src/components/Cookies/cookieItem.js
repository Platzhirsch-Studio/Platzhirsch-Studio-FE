// CookieDetails.js
import React from "react";
import { useTranslations } from "next-intl";

const CookieDetails = ({ service }) => {
  const t = useTranslations("Cookies");

  const formatDuration = ({ count, unit }) =>
    unit === "none" ? t("durations.none") : t(`durations.${unit}`, { count });

  return (
    <div className="mt-3 p-4 bg-gray-50 border border-[#30373e]/10 rounded-lg text-sm leading-relaxed space-y-3 text-[#30373e] [&_strong]:font-semibold [&_strong]:text-[#30373e]">
      <p>
        <strong>{t("details.purpose")}</strong> {t(`services.${service.id}.purpose`)}
      </p>

      <p className="font-medium mt-2">{t("details.provider")}</p>
      <p>{service?.provider}</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          {t("details.phone")} {service?.contact.phone}
        </li>
        <li>
          {t("details.email")} {service?.contact.email}
        </li>
        <li>
          <a
            href={service?.contact.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {t("details.providerPrivacy")}
          </a>
        </li>
      </ul>

      {service?.cookies && (
        <>
          <p className="font-medium mt-2">{t("details.cookiesUsed")}</p>
          <ul className="list-disc pl-5 space-y-1">
            {service?.cookies.map((cookie, index) => (
              <li key={index}>
                {cookie.name && (
                  <span>
                    <strong>{t("details.cookieName")}</strong> {cookie.name} <br />
                  </span>
                )}
                {cookie.type && (
                  <span>
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>{t("details.type")}</strong> {t(`cookieTypes.${cookie.type}`)}{" "}
                    <br />
                  </span>
                )}
                {cookie.host && (
                  <span>
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>{t("details.host")}</strong> {cookie.host} <br />
                  </span>
                )}
                {cookie.duration && (
                  <span>
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>{t("details.duration")}</strong> {formatDuration(cookie.duration)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {service?.storage && (
        <>
          <p className="font-medium mt-2">{t("details.localStorage")}</p>
          <ul className="list-disc pl-5 space-y-1">
            {service?.storage.map((item, index) => (
              <li key={index}>
                <strong>{item.name}</strong> ({t(`cookieTypes.${item.type}`)}) - {item.host} -{" "}
                {formatDuration(item.duration)}
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="font-medium mt-2">
        {t("details.thirdCountries")}{" "}
        {service?.dataProcessing?.countries?.map((country, index) => (
          <span key={country.code}>
            {index > 0 && ", "}
            {t(`countries.${country.code}`)}
            {country.sub && <sup>{country.sub}</sup>}
          </span>
        ))}
      </p>

      <p className="font-medium mt-2">
        {t("details.securityMechanisms")}{" "}
        {service?.dataProcessing?.mechanisms?.map((mechanism, index) => (
          <span key={mechanism.key}>
            {index > 0 && ", "}
            {t(`mechanisms.${mechanism.key}`)}
            {mechanism.sub && <sup>{mechanism.sub}</sup>}
          </span>
        ))}
      </p>
    </div>
  );
};

export default CookieDetails;
