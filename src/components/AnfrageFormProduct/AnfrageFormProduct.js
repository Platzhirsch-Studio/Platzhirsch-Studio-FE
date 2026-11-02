"use client";
// Produktanfrage aus der Merkliste (Neuauftritt). Payload unchanged:
//   anfrage_type ("Person" | "Geschäft"), anfrage_vorname, anfrage_nachname,
//   anfrage_email, anfrage_phone, anfrage_country, anfrage_city,
//   anfrage_address, anfrage_beschreibung, produkte [ids]
//   + anfrage_company, anfrage_fiscal_number for "Geschäft"
// plus `website` (honeypot) and `_t` (ms since render), through
// /api/upload/inquiry/produkt (→ /api/anfrage_produkt, upload ticket).
// Errors at the field, focus on the first bad field, summary in a polite
// live region; request errors as translated `code` (never the API's English
// `error`, and the success text is ours, not the API's `message`).
// Removed: the always-green check icons (looked like "valid" before any input).
// R5-leads-perf: <UploadHandoff> loads only after the send (Forms/
// lazyHandoff.js); optional Selbstauskunft, sent as `lead.selfReport` into
// the Herkunft text block (no new API field).
import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCart, wishlistImageSrc } from "@/context/CartContext";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Heading from "@/components/ui/Heading";
import { trackLead } from "@/lib/analytics";
import { firstError, isEmail, postForm } from "@/lib/forms/client";
import { productsPath } from "@/utils/routing";
import { UploadHandoff, handoffAfterSend, prefetchHandoff } from "@/components/Forms/lazyHandoff";
import SelfReportField from "@/components/Forms/SelfReportField";
import { selfReportFrom } from "@/lib/forms/selfReport";
import FormField, { RadioCards, cleanLabel } from "@/components/Forms/FormField";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import { FormAlert, FormSuccess } from "@/components/Forms/FormAlert";
import useFormGuard, { focusField, useHydrated, useServerFieldError } from "@/components/Forms/useFormGuard";
import useFormText from "@/components/Forms/useFormText";

const BUSINESS = "Geschäft";

const initialFormData = {
  userType: "",
  firstName: "",
  lastName: "",
  companyName: "",
  nrFiscal: "",
  country: "",
  city: "",
  address: "",
  alternativeAddress: "",
  email: "",
  phone: "",
};

// Form field → element id and API field (for a server 400 with `field`).
const FIELDS = {
  userType: { id: "anfrage-userType-0", api: "anfrage_type" },
  companyName: { id: "anfrage-companyName", api: "anfrage_company" },
  nrFiscal: { id: "anfrage-nrFiscal", api: "anfrage_fiscal_number" },
  firstName: { id: "anfrage-firstName", api: "anfrage_vorname" },
  lastName: { id: "anfrage-lastName", api: "anfrage_nachname" },
  email: { id: "anfrage-email", api: "anfrage_email" },
  phone: { id: "anfrage-phone", api: "anfrage_phone" },
  country: { id: "anfrage-country", api: "anfrage_country" },
  city: { id: "anfrage-city", api: "anfrage_city" },
  address: { id: "anfrage-address", api: "anfrage_address" },
  alternativeAddress: { id: "anfrage-description", api: "anfrage_beschreibung" },
};
const ORDER = Object.keys(FIELDS);
const API_TO_FIELD = Object.fromEntries(ORDER.map((k) => [FIELDS[k].api, k]));

export default function AnfrageFormProduct({ onBack }) {
  const { cartItems, clearCart } = useCart();
  const t = useTranslations("enquiry");
  const { text, errorText, locale } = useFormText();
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const serverError = useServerFieldError();
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [handoff, setHandoff] = useState(null);
  const successRef = useRef(null);

  const isRequired = (name, data = formData) =>
    ["userType", "firstName", "lastName", "email", "phone", "country", "city", "address"].includes(name) ||
    (data.userType === BUSINESS && (name === "companyName" || name === "nrFiscal"));

  const validate = (name, data = formData) => {
    const value = String(data[name] ?? "");
    if (name === "userType") return value ? null : text("field.choose");
    if (isRequired(name, data) && !value.trim()) return text("field.required");
    if (name === "email" && !isEmail(value)) return t("error.invalidEmail");
    // Same rule as before (min. 5 characters); the API allows up to 40.
    if (name === "phone" && (value.trim().length < 5 || value.length > 40)) return t("error.invalidPhone");
    return null;
  };

  const set = (name, value) => {
    const next = { ...formData, [name]: value };
    setFormData(next);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: validate(name, next) }));
  };

  const onBlur = (e) => {
    const name = e.target.name;
    if (!FIELDS[name] || (!e.target.value && !errors[name])) return;
    // A server-rejected value keeps its error until it is changed.
    if (serverError.holds(name, e.target.value)) return;
    setErrors((prev) => ({ ...prev, [name]: validate(name) }));
  };

  const labelOf = (k) =>
    ({
      userType: String(t("buyingAs")).replace(/:\s*$/, ""),
      companyName: t("companyName"),
      nrFiscal: t("taxNumber"),
      firstName: t("firstName"),
      lastName: t("lastName"),
      email: t("email"),
      phone: t("phone"),
      country: t("country"),
      city: t("city"),
      address: t("address"),
      alternativeAddress: t("description"),
    })[k] || k;

  const showErrors = (found) => {
    const keys = ORDER.filter((k) => found[k]);
    setErrors(found);
    setStatus({
      type: "summary",
      title: text("summary", { count: keys.length }),
      // "Vorname: Bitte füllen Sie …" – the generic message alone says nothing in a list.
      items: keys.map((k) => ({ id: FIELDS[k].id, text: `${cleanLabel(labelOf(k))}: ${found[k]}` })),
    });
    focusField(FIELDS[firstError(found, ORDER)]?.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    const found = {};
    for (const k of ORDER) {
      const message = validate(k);
      if (message) found[k] = message;
    }
    if (Object.keys(found).length) return showErrors(found);

    const payload = {
      anfrage_type: formData.userType,
      anfrage_vorname: formData.firstName,
      anfrage_nachname: formData.lastName,
      anfrage_email: formData.email,
      anfrage_phone: formData.phone,
      anfrage_country: formData.country,
      anfrage_city: formData.city,
      anfrage_address: formData.address,
      anfrage_beschreibung: formData.alternativeAddress || "",
      ...(formData.userType === BUSINESS && {
        anfrage_company: formData.companyName,
        anfrage_fiscal_number: formData.nrFiscal,
      }),
      produkte: cartItems.map((item) => item.produkte_id),
    };

    serverError.clear();
    setLoading(true);
    setStatus(null);
    const formEl = e.currentTarget;
    const self = selfReportFrom(formEl);
    const result = await postForm("/api/upload/inquiry/produkt", guard(payload, formEl), self ? { lead: { selfReport: self } } : undefined);
    setLoading(false);

    if (!result.ok) {
      const key = result.code === "invalid" ? API_TO_FIELD[result.field] : undefined;
      if (key) {
        serverError.set(key, formData[key]);
        return showErrors({ [key]: validate(key) || text("field.check") });
      }
      setStatus({ type: "error", text: errorText(result.code) });
      return;
    }

    trackLead("produkt_anfrage", { items: cartItems?.length || 0, transaction_id: result.leadRef });
    handoffAfterSend("produkt", { email: formData.email, result: result.data, locale }).then(setHandoff);
    clearCart();
    setFormData(initialFormData);
    setErrors({});
    setSent(true);
    // The way back to the catalogue waits for the visitor (upload card),
    // so the QR code stays readable.
    requestAnimationFrame(() => successRef.current?.focus());
  };

  const field = (name, props) => ({
    id: FIELDS[name].id,
    name,
    value: formData[name],
    onChange: (e) => set(name, e.target.value),
    onBlur,
    error: errors[name] || undefined,
    required: isRequired(name),
    ...props,
  });

  const toProducts = () => router.push(productsPath(locale));

  return (
    <div className="mx-auto w-full max-w-page px-gutter py-10 md:py-14">
      {/* One term for the saved pieces: „Merkliste“ (Lead-Restliste P3-3). */}
      <Button variant="link" onClick={onBack} className="mb-6 gap-2">
        <span className="inline-flex items-center gap-2">
          <ArrowLeft aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
          {text("backToList")}
        </span>
      </Button>

      {sent ? (
        <div className="max-w-text space-y-6">
          <FormSuccess ref={successRef} title={t("success.submitted")} />
          {handoff ? (
            <UploadHandoff {...handoff} onContinue={toProducts} continueLabel={text("continueToProducts")} />
          ) : (
            <Button variant="secondary" arrow onClick={toProducts}>
              {text("continueToProducts")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-y-10 gap-x-grid lg:grid-cols-12">
          {cartItems.length > 0 && (
            <section aria-labelledby="anfrage-produkte-title" className="min-w-0 lg:col-span-4">
              <Eyebrow as="h2" id="anfrage-produkte-title" tone="soft" className="mb-stack-s">
                {String(t("productsInRequest")).replace(/:\s*$/, "")}
              </Eyebrow>
              <ul className="divide-y divide-line border-y border-line">
                {cartItems.map((item, idx) => (
                  <li key={`${item.id}-${idx}`} className="flex items-center gap-4 py-3">
                    <div className="relative size-20 flex-none bg-surface-raised">
                      <Image
                        src={wishlistImageSrc(item.image) || "/Images/fallback-banner.jpg"}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-ui text-text">{item.name}</p>
                      {item.category && <p className="text-small text-text-soft">{item.category}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <form
            method="post"
            onSubmit={handleSubmit}
            onFocus={() => prefetchHandoff(locale)}
            noValidate
            aria-describedby="anfrage-pflicht"
            className={`relative min-w-0 space-y-6 ${cartItems.length > 0 ? "lg:col-span-7 lg:col-start-6" : "lg:col-span-8"}`}
          >
            <FormAlert status={status} />
            <p id="anfrage-pflicht" className="text-small text-text-soft">
              {text("requiredHint")}
            </p>

            <RadioCards
              id="anfrage-userType"
              name="userType"
              legend={String(t("buyingAs")).replace(/:\s*$/, "")}
              legendSize="label"
              options={[
                { value: "Person", label: t("person") },
                { value: BUSINESS, label: t("business") },
              ]}
              value={formData.userType || null}
              onChange={(v) => set("userType", v)}
              error={errors.userType || undefined}
            />

            {formData.userType === BUSINESS && (
              <div className="grid gap-6 md:grid-cols-2">
                <FormField {...field("companyName", { label: t("companyName"), type: "text", autoComplete: "organization" })} />
                <FormField {...field("nrFiscal", { label: t("taxNumber"), type: "text", autoComplete: "off" })} />
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <FormField {...field("firstName", { label: t("firstName"), type: "text", autoComplete: "given-name" })} />
              <FormField {...field("lastName", { label: t("lastName"), type: "text", autoComplete: "family-name" })} />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField {...field("email", { label: t("email"), type: "email", inputMode: "email", autoComplete: "email", spellCheck: false })} />
              <FormField {...field("phone", { label: t("phone"), type: "tel", inputMode: "tel", autoComplete: "tel" })} />
            </div>
            <FormField {...field("address", { label: t("address"), type: "text", autoComplete: "street-address" })} />
            <div className="grid gap-6 md:grid-cols-2">
              <FormField {...field("city", { label: t("city"), type: "text", autoComplete: "address-level2" })} />
              <FormField {...field("country", { label: t("country"), type: "text", autoComplete: "country-name" })} />
            </div>
            <FormField
              {...field("alternativeAddress", {
                as: "textarea",
                label: t("description"),
                optionalText: text("optional"),
                rows: 4,
              })}
            />
            <SelfReportField id="anfrage-selbstauskunft" optionalText={text("optional")} />

            <Honeypot id="anfrage-website" />

            <div className="space-y-4">
              <Button
                type="submit"
                variant="primary"
                arrow={!loading}
                disabled={!hydrated || undefined}
                aria-disabled={loading || undefined}
                className="w-full sm:w-auto"
              >
                {loading ? text("sending") : t("sendMessage")}
              </Button>
              <FormPrivacyNote />
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
