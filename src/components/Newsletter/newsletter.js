"use client";
import React, { useId, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import Button from "@/components/ui/Button";
import { SuccessIcon } from "@/components/Forms/FormField";
import { withAttributionFields } from "@/lib/forms/client";

// Error codes from /api/newsletter_subscribe → keys of `labels.errors`.
const ERROR_KEYS = {
  invalid_email: "invalid",
  already_subscribed: "already",
};

/**
 * Newsletter sign-up form (client island). All copy comes from the server
 * component (NewsletterContent) as `labels`, so no translation fallback ships
 * to the browser.
 * labels: { emailLabel, submit, sending, success, errors: { invalid, already, generic } }
 * Visible label, autocomplete, error at the field (aria-invalid +
 * aria-describedby) and focus back to the field on error (Bibel §14).
 */
const Newsletter = ({ labels }) => {
  const id = useId();
  const inputRef = useRef(null);
  const [email, setEmail] = useState("");
  // Honeypot — hidden from people, only bots fill it in (see the route).
  const [website, setWebsite] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const fail = (message) => {
    setEmailError(message);
    inputRef.current?.focus();
  };

  // Posts to our own server route — the backend address never reaches the
  // browser (src/app/api/newsletter_subscribe/route.js forwards it).
  const handleSubscribe = async (event) => {
    event?.preventDefault();
    if (loading) return;
    setEmailError("");
    setSubscribed(false);
    const value = email.trim();
    if (!validateEmail(value)) {
      fail(labels.errors.invalid);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/newsletter_subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // utm_* / klick_id nur mit Ads-Einwilligung (Bericht 60, Abschnitt 2.3).
        body: JSON.stringify(withAttributionFields("/api/newsletter_subscribe", { email: value, website })),
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        setSubscribed(true);
        setEmail("");
        trackEvent("sign_up", { method: "newsletter" });
      } else {
        fail(labels.errors[ERROR_KEYS[result.code]] || labels.errors.generic);
      }
    } catch {
      fail(labels.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const errorId = `${id}-error`;

  return (
    <form onSubmit={handleSubscribe} noValidate className="relative">
      <label htmlFor={`${id}-email`} className="block text-ui text-text">
        {labels.emailLabel}
      </label>
      {/* Error sits at the field, before the button, with icon + text
          (QA Runde 1, P2-8; Bibel §4.5 "Statusmeldungen immer Icon + Text"). */}
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            id={`${id}-email`}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            aria-invalid={emailError ? "true" : undefined}
            aria-describedby={emailError ? errorId : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 w-full min-w-0 border border-line-control bg-paper px-4 text-ui text-text placeholder:text-text-soft aria-invalid:border-error lg:min-h-13"
          />
          {emailError && (
            <p
              id={errorId}
              className="ph-arrive mt-2 flex items-start gap-2 text-small text-error"
            >
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
                strokeWidth={1.5}
              />
              <span>{emailError}</span>
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          aria-disabled={loading || undefined}
          className="shrink-0"
        >
          {loading ? labels.sending : labels.submit}
        </Button>
      </div>
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

      <p
        role="status"
        className={
          subscribed
            ? "mt-4 border-l-2 border-success pl-4 text-body text-text"
            : "sr-only"
        }
      >
        {/* Motion: the confirmation settles in and its tick draws once
            (ph-arrive + ph-tick, @starting-style; instant when calm). The
            live region itself stays mounted, so the text is still announced. */}
        {subscribed ? (
          <span className="ph-arrive flex items-start gap-2">
            <SuccessIcon className="mt-0.5 text-success" />
            <span>{labels.success}</span>
          </span>
        ) : (
          ""
        )}
      </p>
    </form>
  );
};

export default Newsletter;
