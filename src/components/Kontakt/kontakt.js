"use client";
import { PHONE_DISPLAY, PHONE_HREF, EMAIL, EMAIL_HREF } from "@/lib/site";
import React, { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import FadeInView from "@/components/Reusable/FadeInView";
import ConsentEmbed from "@/components/Cookies/ConsentEmbed";
import {
  Phone,
  Mail,
  Clock,
  Home,
  Building,
  Contact,
  User,
  MessageSquare,
  CircleCheck,
  CircleAlert,
} from "lucide-react";

const Notification = ({ type, text }) => (
  <FadeInView
    as="div"
    direction="top"
    duration={300}
    distance={10}
    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-md mb-4 text-sm font-medium text-center mx-auto w-full max-w-lg
        ${type === "error"
        ? "bg-red-100 text-red-700"
        : "bg-green-100 text-green-700"
      }`}
  >
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs
  ${type === "error" ? "bg-red-500" : "bg-green-500"}`}
    >
      {type === "error" ? <CircleAlert size={12} /> : <CircleCheck size={12} />}
    </div>
    <p role={type === "error" ? "alert" : "status"}>{text}</p>
  </FadeInView>
);

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePhone = (phone) => {
  const re = /^[0-9+\-()\s]{6,20}$/;
  return phone.trim() === "" || re.test(phone);
};

const validateName = (name) => {
  return name.trim().length >= 2;
};

const validateMessage = (message) => {
  return message.trim().length >= 10;
};

const Kontakt = () => {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email_address: "",
    telefon: "",
    ihre_nachricht: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const t = useTranslations('contact')

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!validateName(formData.name)) {
      setMessage({
        type: "error",
        text: t("formErrorName"),
      });
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email_address)) {
      setMessage({
        type: "error",
        text: t("formErrorMail"),
      });
      setLoading(false);
      return;
    }

    if (!validatePhone(formData.telefon)) {
      setMessage({
        type: "error",
        text: t("formErrorPhone"),
      });
      setLoading(false);
      return;
    }

    if (!validateMessage(formData.ihre_nachricht)) {
      setMessage({
        type: "error",
        text: t("formErrorMsg"),
      });
      setLoading(false);
      return;
    }

    try {
      // Use internal API route instead of direct external call
      const response = await fetch('/api/kontakt', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok || !responseData.success) {
        throw new Error("send_failed");
      }

      setMessage({
        type: "success",
        text: t('formSuccess')
      });

      setFormData({
        name: "",
        company: "",
        email_address: "",
        telefon: "",
        ihre_nachricht: "",
      });
    } catch (error) {
      // Details stay in the console; visitors get the translated message.
      console.error("Kontakt form:", error);
      setMessage({ type: "error", text: t("formErrorSend") });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <FadeInView
      as="div"
      direction="bottom"
      duration={600}
      distance={0}
    >
      {/* Rendered straight away (no client-only mount gate) so the address,
          map and form are in the server HTML that search engines read. */}
        <>
          {/* CONTACT INFO SECTION */}
          <FadeInView
            as="div"
            direction="bottom"
            duration={600}
            distance={30}
            className="max-w-7xl mx-auto px-6 my-10 lg:my-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-[#303030]"
          >
            <div className="md:col-span-2">
              <p className="uppercase text-[#d1b250] font-semibold tracking-wide mb-2">
                {t('headline')}
              </p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-[#30373e]">
                {t('stepHeadline')}
              </h2>
              <p className="text-[#30373e]/80">
                {t('desc')}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 font-semibold text-[#30373e]">
                  <Home className="text-[#d1b250]" /> {t('location')}
                </div>
                <p className="text-sm mt-1 text-[#30373e]/80">
                  {t('address')}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 font-semibold text-[#30373e]">
                  <Phone className="text-[#d1b250]" /> {t('phone')}
                </div>
                <p className="text-sm mt-1 text-[#30373e]/80">
                  <a href={PHONE_HREF} className="hover:text-[#d1b250]">{PHONE_DISPLAY}</a>
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 font-semibold text-[#30373e]">
                  <Clock className="text-[#d1b250]" /> {t('opening')}
                </div>
                <p className="text-sm mt-1 text-[#30373e]/80">
                  {t('openTimes')}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 font-semibold text-[#30373e]">
                  <Mail className="text-[#d1b250]" /> {t('email')}
                </div>
                <p className="text-sm mt-1 text-[#30373e]/80">
                  <a
                    href={EMAIL_HREF}
                    className="hover:text-[#d1b250]"
                  >
                    {EMAIL}
                  </a>
                </p>
              </div>
            </div>
          </FadeInView>
          <FadeInView
            as="div"
            direction="bottom"
            duration={800}
            distance={0}
            className="relative w-full h-[400px] overflow-hidden shadow-lg group cursor-pointer"
          >
            {/* Loads only after the visitor opts in (Google Maps is an opt-in
                "functional" service in the cookie banner). */}
            <ConsentEmbed service="googleMaps">
              <iframe
                title="Google Maps – Platzhirsch Home Living, Landstraße 9, 6911 Lochau"
                // Google Business Profile pin (Landstraße 9, 6911 Lochau).
                src="https://maps.google.com/maps?q=Platzhirsch%20Home%20Living%2C%20Landstra%C3%9Fe%209%2C%206911%20Lochau&ll=47.5302782,9.7517183&z=17&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, pointerEvents: "none" }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              ></iframe>
            </ConsentEmbed>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-[43%] left-1/2 z-20 -translate-x-1/2 -translate-y-full pointer-events-none animate-bounce-slow h-[80px]  w-[60px]">
              <Image
                src="/Images/Licht/custom-marker.png"
                alt=""
                fill
                sizes="60px"
                className="w-[60px] h-auto drop-shadow-md"
              />
            </div>
            <style jsx>
              {`
              @keyframes bounce-slow {
  0%,
  100% {
    transform: translate(2%, 65%);
  }
  50% {
    transform: translate(2%, 70%);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 0.7s infinite;
}
              `}
            </style>
            {/* Always visible: a hover-only link doesn't exist for touch or keyboard users. */}
            <div className="absolute mt-8 top-[52%] left-1/2 z-30 -translate-x-1/2">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Landstraße+9,+6911+Lochau,+Austria"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#d1b250] text-white px-5 py-2 rounded-full shadow-lg hover:bg-[#bfa047] transition"
              >
                {t("directions")}
              </a>
            </div>
          </FadeInView>
          <FadeInView
            as="div"
            direction="bottom"
            duration={800}
            distance={40}
            className="max-w-7xl mx-auto px-6 my-10 lg:my-16 relative"
          >
            <div className="bg-white flex w-full overflow-hidden relative z-20">
              <div
                className="hidden md:flex w-1/2 relative"
                style={{
                  borderRadius: "0px 100px 0px 100px",
                  overflow: "hidden",
                  // boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
                  backgroundImage: "url('/Images/Home/bannerImage.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gray-800/70 z-10"></div>
                <div className="text-white flex flex-col justify-center items-center text-center relative z-20 px-5 lg:px-20">
                  <h2 className="text-3xl font-bold mb-2 text-white">
                    {t('welcomeBack')}
                  </h2>
                  <p className="text-sm">
                    {t('welcomeMsg')}
                  </p>
                </div>
              </div>

              <div className="w-full md:w-1/2 lg:p-10 md:pl-10 md:pr-10  p-0 sm:p-0">
                <h2 className="text-md uppercase font-bold text-center mb-2 text-[#d1b250]">
                  {t('sendForm')}
                </h2>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-2 text-[#30373e]">
                  {t('formHeadline')}
                </h2>
                <p className="text-center text-[#30373e]/80 mb-6 ">
                  {t('formDesc')}
                </p>

                {message && (
                  <Notification
                    type={message.type}
                    text={
                      message.type === "success"
                        ? t('formSuccess')
                        : message.text
                    }
                  />
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="relative">
                    <User aria-hidden="true" className="absolute top-3 left-3 text-[#30373e]/75 text-lg" />
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      aria-label={t('formName')}
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('formName')}
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 focus:ring-2 focus:ring-[#d1b250]"
                    />
                  </div>
                  <div className="relative">
                    <Building aria-hidden="true" className="absolute top-3 left-3 text-[#30373e]/75 text-lg" />
                    <input
                      type="text"
                      name="company"
                      autoComplete="organization"
                      aria-label={t('formCompany')}
                      value={formData.company}
                      onChange={handleChange}
                      placeholder={t('formCompany')}
                      className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 focus:ring-2 focus:ring-[#d1b250]"
                    />
                  </div>
                  <div className="relative">
                    <Mail aria-hidden="true" className="absolute top-3 left-3 text-[#30373e]/75 text-lg" />
                    <input
                      type="email"
                      name="email_address"
                      autoComplete="email"
                      aria-label={t('formMail')}
                      value={formData.email_address}
                      onChange={handleChange}
                      placeholder={t('formMail')}
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 focus:ring-2 focus:ring-[#d1b250]"
                    />
                  </div>
                  <div className="relative">
                    <Contact aria-hidden="true" className="absolute top-3 left-3 text-[#30373e]/75 text-lg" />
                    <input
                      type="tel"
                      name="telefon"
                      autoComplete="tel"
                      aria-label={t('formPhone')}
                      value={formData.telefon}
                      onChange={handleChange}
                      placeholder={t('formPhone')}
                      className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 focus:ring-2 focus:ring-[#d1b250]"
                    />
                  </div>
                  <div className="relative">
                    <MessageSquare aria-hidden="true" className="absolute top-3 left-3 text-[#30373e]/75 text-lg" />
                    <textarea
                      name="ihre_nachricht"
                      aria-label={t('formMessage')}
                      value={formData.ihre_nachricht}
                      onChange={handleChange}
                      placeholder={t('formMessage')}
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 min-h-[120px] focus:ring-2 focus:ring-[#d1b250] "
                    ></textarea>
                  </div>
                  <div className="button-custom2">
                    <button type="submit" disabled={loading} aria-label={loading ? t('formSending') : t('formSend')}>
                      <span></span>
                      <p data-title={t('formSend')}>
                        {loading ? (
                          t('formSending')
                        ) : (
                          <>
                            <svg
                              className="ml-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                              />
                            </svg>
                          </>
                        )}
                      </p>
                    </button>
                  </div>

                  <style jsx>{`
                  .button-custom2{
                     display: flex;
  justify-content: center;

  button {
    width: 100%;
    padding: 10px;
    height: 45px;
    background-color: transparent;
    color: #30373e;
    position: relative;
    overflow: hidden;
    font-size: 13px;
    letter-spacing: 1px;
    font-weight: 500;
    text-transform: uppercase;
    transition: all 0.5s ease;
    cursor: pointer;
    border: 2px solid #d1b250;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;

    @media (max-width: 640px) {
      width: 260px;
      height: 40px;
      font-size: 12px;
    }

    &::before,
    &::after {
      content: "";
      position: absolute;
      width: 0;
      height: 2px;
      background-color: rgb(92, 92, 92);
      transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
    }

    &::before {
      right: 0;
      top: 0;
    }

    &::after {
      left: 0;
      bottom: 0;
    }

    &:hover::before,
    &:hover::after {
      width: 100%;
    }

    span {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;

      &::before,
      &::after {
        content: "";
        position: absolute;
        width: 2px;
        height: 0;
        background-color: rgb(92, 92, 92);
        transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1);
      }

      &::before {
        right: 0;
        top: 0;
      }

      &::after {
        left: 0;
        bottom: 0;
      }
    }

    &:hover span::before,
    &:hover span::after {
      height: 100%;
    }

    p {
      padding: 0;
      margin: 0;
      position: relative;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: color 0.3s ease;

      &::before {
        content: attr(data-title);
      }

      &::after {
        display: none;
      }

      svg {
        width: 16px;
        height: 16px;
        transition: transform 0.3s ease;
      }
    }

    &:hover p svg {
      transform: translateX(4px);
    }
  }
                  }`} </style>
                </form>
              </div>
            </div>
          </FadeInView>
        </>
    </FadeInView>
  );
};

export default Kontakt;
