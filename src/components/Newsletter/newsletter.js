"use client";
import React, { useState } from "react";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { useTranslations } from "next-intl";

const Newsletter = () => {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubscribe = async () => {
    setEmailError("");
    setSubscribed(false);
    if (!validateEmail(email)) {
      setEmailError(t("errInvalid"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.newsletter_website.api.subscribe_newsletter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const result = await response.json();

      if (result.exc) {
        const errorMsg = result._server_messages
          ? JSON.parse(result._server_messages)[0]
          : t("errGeneric");
        throw new Error(JSON.parse(errorMsg).message);
      }

      if (response.ok) {
        setSubscribed(true);
        setEmail("");
      } else {
        throw new Error(result.message || t("errGeneric"));
      }
    } catch (error) {
      if (
        error.message.includes("bereits angemeldet") ||
        error.message.includes("already subscribed")
      ) {
        setEmailError(t("errAlready"));
      } else {
        setEmailError(
          error.message ||
          t("errGeneric")
        );
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className='py-10 lg:py-16'>
      <div className="max-w-4xl mx-auto px-6 text-[#303030]">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">{t("headline")}</h2>

        <p className="text-gray-700 leading-relaxed">
          {t("intro1")}
        </p>

        <p className="mb-8 text-gray-700 leading-relaxed">
          {t("intro2")}
        </p>

        <h3 className="text-xl font-semibold mb-3">{t("reasonsHeadline")}</h3>
        <ul className="list-disc list-inside mb-8 space-y-2 text-gray-700 ">
          <li>{t("reasons1")}</li>
          <li>{t("reasons2")}</li>
          <li>{t("reasons3")}</li>
          <li>{t("reasons4")}</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">{t("howHeadline")}</h3>
        <p className="text-gray-700 leading-relaxed">
          {t("howText")}
        </p>

        <p className="text-gray-700 leading-relaxed mb-8">
          {t("outro")}
        </p>
      </div>
      <div className="max-w-4xl mx-auto px-6  text-[#303030]">
        <h3 className="text-xl font-semibold mb-3">{t("subscribeHeadline")}</h3>
        <div className="flex border border-transparent bg-gray-100 hover:border-[#d1b250] transition-colors duration-200 rounded-r">
          <input
            type="email"
            placeholder={t("inputPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 text-gray-800 text-sm outline-none bg-gray-100 rounded-r "
          />
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="px-4 py-2 text-xs text-white bg-[#d1b250] cursor-pointer rounded-r"
            aria-label={t("btnSubscribe")}
          >
            {loading ? t("btnLoading") : t("btnSubscribe")}
          </button>
        </div>

        {emailError && <p className="text-red-600 text-sm mt-2">{emailError}</p>}

        {subscribed && (
          <div className="mt-3 px-4 py-3 bg-[#d1b250] text-white text-sm font-medium rounded transition-opacity duration-300 ease-in-out">
            {t("success")}
          </div>
        )}
      </div>
    </div>
  );
};

export default Newsletter;
