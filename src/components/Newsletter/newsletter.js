"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";

// Error codes from /api/newsletter_subscribe → translated messages.
const ERROR_KEYS = {
  invalid_email: "errInvalid",
  already_subscribed: "errAlready",
};

const Newsletter = () => {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  // Honeypot — hidden from people, only bots fill it in (see the route).
  const [website, setWebsite] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Posts to our own server route — the backend address never reaches the
  // browser (src/app/api/newsletter_subscribe/route.js forwards it).
  const handleSubscribe = async (event) => {
    event?.preventDefault();
    if (loading) return;
    setEmailError("");
    setSubscribed(false);
    const value = email.trim();
    if (!validateEmail(value)) {
      setEmailError(t("errInvalid"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/newsletter_subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, website }),
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        setSubscribed(true);
        setEmail("");
      } else {
        setEmailError(t(ERROR_KEYS[result.code] || "errGeneric"));
      }
    } catch {
      setEmailError(t("errGeneric"));
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
        <form
          onSubmit={handleSubscribe}
          noValidate
          className="relative flex border border-transparent bg-gray-100 hover:border-[#d1b250] transition-colors duration-200 rounded-r"
        >
          <input
            type="email"
            name="email"
            autoComplete="email"
            aria-label={t("inputPlaceholder")}
            aria-invalid={emailError ? "true" : undefined}
            aria-describedby={emailError ? "newsletter-error" : undefined}
            placeholder={t("inputPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 text-gray-800 text-sm outline-none bg-gray-100 rounded-r "
          />
          {/* Honeypot: off-screen and skipped by keyboard/screen readers. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] h-px w-px opacity-0"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs text-white bg-[#d1b250] cursor-pointer rounded-r disabled:opacity-70"
          >
            {loading ? t("btnLoading") : t("btnSubscribe")}
          </button>
        </form>

        {emailError && (
          <p id="newsletter-error" role="alert" className="text-red-600 text-sm mt-2">
            {emailError}
          </p>
        )}

        {subscribed && (
          <div
            role="status"
            className="mt-3 px-4 py-3 bg-[#d1b250] text-white text-sm font-medium rounded transition-opacity duration-300 ease-in-out"
          >
            {t("success")}
          </div>
        )}
      </div>
    </div>
  );
};

export default Newsletter;
