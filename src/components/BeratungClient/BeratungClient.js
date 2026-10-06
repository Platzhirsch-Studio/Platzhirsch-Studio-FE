"use client";
import { useState } from "react";
import FadeInView from "@/components/Reusable/FadeInView";
import {
  Home,
  Building,
  Wrench,
  Building2,
  User,
  Mail,
  Phone,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";


const Notification = ({ type, text }) => (
  <FadeInView
    direction="top"
    duration={300}
    distance={10}
    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-md mb-4 text-sm font-medium text-center mx-auto w-full max-w-lg
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

const MultiStepForm = () => {
  const t = useTranslations("MultiStepForm");
  const [step, setStep] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({
    step1: null,
    step2: null,
    message: "",
    vorname: "",
    nachname: "",
    email: "",
    telefon: "",
  });
  const [successMessageVisible, setSuccessMessageVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const step1Icons = [
    <Building key="building" size={45} />,
    <Wrench key="tools" size={45} />,
    <Building2  key="city" size={45} />,
  ];
  const step2Icons = [
    <Home key="home" size={45} />,
    <Building key="building" size={45} />,
    <Building2  key="city" size={45} />,
  ];

  const handleOptionSelect = (stepNumber, optionId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [`step${stepNumber}`]: optionId,
    }));
    setTimeout(() => {
      if (stepNumber === 1) setStep(2);
      if (stepNumber === 2) setStep(3);
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { step1, step2, message, vorname, nachname, email, telefon } = selectedOptions;

    if (!step1 || !step2) {
      setErrorMessage(t("notification.selectAll"));
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage(
        !message.trim()
          ? t("notification.describeRequired")
          : t("notification.describeMinLength")
      );
      return;
    }
    if (!vorname.trim() || !nachname.trim()) {
      setErrorMessage(t("notification.nameRequired"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage(t("notification.emailInvalid"));
      return;
    }
    const phoneRegex = /^[0-9+\-()\s]{6,20}$/;
    if (!phoneRegex.test(telefon.trim())) {
      setErrorMessage(t("notification.telefonInvalid"));
      return;
    }

    try {
      // Use internal API route instead of direct external call
      const response = await fetch('/api/beratung_anfrage', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bei_meiner_anfrage_geht_es_um: step1,
          das_projekt_soll_verwirklicht_werden: step2,
          bitte_beschreiben_sie_ihr_vorhaben: message,
          vorname,
          nachname,
          email,
          telefon,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to submit form");
      }

      setErrorMessage("");
      setSuccessMessageVisible(true);
      setSelectedOptions({
        step1: null,
        step2: null,
        message: "",
        vorname: "",
        nachname: "",
        email: "",
        telefon: "",
      });
      setStep(5);
      setTimeout(() => {
        setSuccessMessageVisible(false);
        setStep(1);
      }, 5000);
    } catch (error) {
      console.error("Submit error:", error);
      setErrorMessage(error.message || t("notification.submitError"));
    }
  };

  const fadeVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } },
  };

  return (
    <div className="max-w-4xl mx-auto my-10 lg:my-16 px-4">
      <h2 className="text-md mb-3 text-center text-[#d1b250] uppercase">{t("formTitle")}</h2>
      <form onSubmit={handleSubmit} className="space-y-8">

        {[1, 2].map((stepNum) =>
          step === stepNum && (
            <FadeInView
              key={`step${stepNum}`}
              direction="bottom"
              duration={500}
              distance={20}
            >
              <h3 className="text-xl mb-10 text-center">
                {stepNum === 1 ? t("step1Title") : t("step2Title")}
              </h3>
              {errorMessage && <Notification type="error" text={errorMessage} />}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 lg:gap-x-0 place-items-center">
                {t.raw(stepNum === 1 ? "step1Options" : "step2Options").map((label, idx) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => handleOptionSelect(stepNum, label)}
                    aria-pressed={selectedOptions[`step${stepNum}`] === label}
                    className={`cursor-pointer mx-auto p-6 rounded-xl w-[240px] lg:w-[260px] border transition-all duration-300 shadow-sm hover:shadow-md hover:border-[#d1b250] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d1b250] focus-visible:ring-offset-2 ${selectedOptions[`step${stepNum}`] === label
                      ? "border-[#d1b250] bg-[#fdf9f1]"
                      : "border-gray-200"
                      }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="text-[#d1b250]">
                        {stepNum === 1 ? step1Icons[idx] : step2Icons[idx]}
                      </div>
                      <p className="text-sm font-medium mt-3 text-gray-700">{label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </FadeInView>
          )
        )}

        {step === 3 && (
          <FadeInView
            key="step3"
            direction="bottom"
            duration={500}
            distance={20}
          >
            <h3 className="text-xl mb-10 text-center">{t("step3Title")}</h3>
            {errorMessage && <Notification type="error" text={errorMessage} />}

            <textarea
              value={selectedOptions.message}
              onChange={(e) => {
                setSelectedOptions({
                  ...selectedOptions,
                  message: e.target.value,
                });
                if (errorMessage) setErrorMessage("");
              }}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d1b250] text-sm"
              rows={5}
              placeholder={t("describePlaceholder")}
              aria-label={t("describePlaceholder")}
              required
            />
            <div className="mt-8 flex justify-center">
              <div className=" button-custom7 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedOptions.message.trim()) {
                      setErrorMessage(t("notification.describeRequired"));
                      return;
                    }
                    if (selectedOptions.message.trim().length < 10) {
                      setErrorMessage(t("notification.describeMinLength"));
                      return;
                    }
                    setErrorMessage("");
                    setStep(4);
                  }}
                  aria-label={t("continue")}
                  className="w-full py-3 bg-[#171717] text-white font-semibold rounded-lg hover:bg-[#d1b250] transition"
                >
                  <span></span>
                  <p data-title={t("continue")} data-text={t("continue")}></p>
                </button>
              </div>

              <style jsx>{`
                  .button-custom7{
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
    }}
                `}</style>
            </div>
          </FadeInView>
        )}

        {step === 4 && (
          <FadeInView
            key="step4"
            direction="bottom"
            duration={500}
            distance={20}
          >
            <h3 className="text-xl mb-10 text-center">{t("step4Title")}</h3>
            {errorMessage && <Notification type="error" text={errorMessage} />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {[
                {
                  icon: <User />,
                  placeholder: t("field.vorname"),
                  value: selectedOptions.vorname,
                  name: "vorname",
                  type: "text",
                  autoComplete: "given-name",
                },
                {
                  icon: <User />,
                  placeholder: t("field.nachname"),
                  value: selectedOptions.nachname,
                  name: "nachname",
                  type: "text",
                  autoComplete: "family-name",
                },
                {
                  icon: <Mail />,
                  placeholder: t("field.email"),
                  value: selectedOptions.email,
                  name: "email",
                  type: "email",
                  autoComplete: "email",
                },
                {
                  icon: <Phone />,
                  placeholder: t("field.telefon"),
                  value: selectedOptions.telefon,
                  name: "telefon",
                  type: "tel",
                  autoComplete: "tel",
                },
              ].map((input, index) => (
                <div key={index} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    {input.icon}
                  </div>
                  <input
                    type={input.type}
                    name={input.name}
                    autoComplete={input.autoComplete}
                    aria-label={input.placeholder}
                    placeholder={input.placeholder}
                    className="pl-10 pr-3 py-3 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-[#d1b250]"
                    value={input.value}
                    onChange={(e) =>
                      setSelectedOptions({
                        ...selectedOptions,
                        [input.name]: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="flex justify-center">
                <button
                  type="submit"
                  aria-label={t("send")}
                  className="
      group
      relative
      flex
      h-11.25
      w-full
      items-center
      justify-center
      overflow-hidden
      rounded-[3px]
      border-2
      border-[#d1b250]
      bg-transparent
      p-1.25
      text-[13px]
      font-medium
      uppercase
      tracking-[1px]
      text-[#30373e]
      transition-all
      duration-500

      max-sm:h-10
      max-sm:w-65
      max-sm:text-[12px]

      before:absolute
      before:right-0
      before:top-0
      before:h-0.5
      before:w-0
      before:bg-[rgb(92,92,92)]
      before:transition-all
      before:duration-500
      before:ease-[cubic-bezier(0.35,0.1,0.25,1)]

      after:absolute
      after:bottom-0
      after:left-0
      after:h-0.5
      after:w-0
      after:bg-[rgb(92,92,92)]
      after:transition-all
      after:duration-500
      after:ease-[cubic-bezier(0.35,0.1,0.25,1)]

      hover:before:w-full
      hover:after:w-full
    ">
                  <span className="
        absolute
        left-0
        top-0
        z-1
        h-full
        w-full

        before:absolute
        before:right-0
        before:top-0
        before:h-0
        before:w-0.5
        before:bg-[rgb(92,92,92)]
        before:transition-all
        before:duration-500
        before:ease-[cubic-bezier(0.35,0.1,0.25,1)]

        after:absolute
        after:bottom-0
        after:left-0
        after:h-0
        after:w-0.5
        after:bg-[rgb(92,92,92)]
        after:transition-all
        after:duration-500
        after:ease-[cubic-bezier(0.35,0.1,0.25,1)]

        group-hover:before:h-full
        group-hover:after:h-full
      "></span>
                  <p className="relative z-2 inline-flex items-center gap-2 p-0 text-black" data-title={t("send")} data-text={t("send")}></p>
                </button>
              </div>
            </div>
          </FadeInView>
        )}

        {step === 5 && successMessageVisible && (
          <FadeInView
            key="success"
            direction="bottom"
            duration={500}
            distance={20}
            className="text-center"
          >
            <Notification
              type="success"
              text={t("thankYou")}
              onClose={() => setSuccessMessageVisible(false)}
            />
          </FadeInView>
        )}
      </form>
    </div>
  );
};

export default MultiStepForm;
