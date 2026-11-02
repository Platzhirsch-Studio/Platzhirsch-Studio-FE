// CookieDetails.js – service facts in the consent dialog (Neuauftritt: no
// radius, tokens only, R3-shell).
import React from "react";
import { useTranslations } from "next-intl";

// `texts`: own texts of a service that are not in the client messages
// (Besucher-Einblicke: src/lib/einblicke/consentCopy.js) – purpose, the
// sessionStorage type, minutes and "no third country".
const CookieDetails = ({ service, texts = null }) => {
  const t = useTranslations("Cookies");

  const formatDuration = ({ count, unit }) => {
    if (unit === "minute" && texts) return (count === 1 ? texts.minuteOne : texts.minuteOther).replace("#", String(count));
    return unit === "none" ? t("durations.none") : t(`durations.${unit}`, { count });
  };
  const cookieType = (type) => (type === "sessionStorage" && texts ? texts.sessionStorage : t(`cookieTypes.${type}`));

  return (
    <div className="mt-2 space-y-3 border border-line bg-surface-raised p-4 text-small text-text [&_strong]:font-medium">
      <p>
        <strong>{t("details.purpose")}</strong> {texts ? texts.purpose : t(`services.${service.id}.purpose`)}
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
            className="inline-flex min-h-6 items-center text-text underline decoration-line-strong underline-offset-4 hover:decoration-current"
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
                    &nbsp;&nbsp;&nbsp;&nbsp;<strong>{t("details.type")}</strong> {cookieType(cookie.type)}{" "}
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
                <strong>{item.name}</strong> ({cookieType(item.type)}) - {item.host} -{" "}
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
        {/* Own services (Besucher-Einblicke): no third country at all. */}
        {service?.dataProcessing?.countries?.length === 0 && texts?.noThirdCountry}
      </p>

      {service?.dataProcessing?.mechanisms?.length !== 0 && (
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
      )}
    </div>
  );
};

export default CookieDetails;
