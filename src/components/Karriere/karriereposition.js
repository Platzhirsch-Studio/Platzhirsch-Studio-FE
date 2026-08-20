"use client";
import React from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import teamImage from "../../../public/Images/Home/helmut.jpg";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import FadeInView from "@/components/Reusable/FadeInView";
import {
  Clock,
  Briefcase,
  MapPin,
  BriefcaseBusiness,
  Users,
} from "lucide-react";

const KarrierePosition = ({ karriere }) => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("KarrierePosition");

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 lg:mt-16 mt-10">
        <FadeInView
          as="div"
          direction="bottom"
          duration={600}
          distance={30}
          className="text-center mb-10 lg:mb-16"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#171717] mb-3">
            {t("headline")}
          </h2>
          <p className="text-[#30373e]/70">
            {t("desc")}
          </p>
        </FadeInView>

        <div className="space-y-6">
          {karriere.filter((item) => item.status === "Aktiv").length === 0 ? (
            <p className="text-center text-[#d1b250] text-md">
              {t("noJobs")}
            </p>
          ) : (
            karriere
              .filter((item) => item.status === "Aktiv")
              .map((job, index) => (
                <FadeInView
                  key={index}
                  as="div"
                  direction="bottom"
                  duration={400}
                  distance={30}
                  delay={index * 100}
                  className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition duration-300 p-6"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-semibold text-[#30373e] mb-2">
                        {job.title}
                      </h3>
                      <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-2">
                        <span className="flex items-center gap-1">
                          <BriefcaseBusiness className="text-[#d1b250]" />{" "}
                          Platzhirsch Studio
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="text-[#d1b250]" /> Lochau,
                          Österreich
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-[#d1b250]">€</span> {job.salary}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="text-[#d1b250]" />{" "}
                          {job.positions} {t("positions")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="text-[#d1b250]" />{" "}
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <div className="w-full md:w-auto flex flex-col justify-end gap-3 mt-4 md:mt-0">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="text-[#d1b250]" />
                        {t("posted")}{" "}
                        {new Date(job.posted).toLocaleDateString("de-AT", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>

                      <Link
                        href={`/ueber-uns/karriere/${job.slug}`}
                        locale={locale}
                      >

                        <div className="button-custom">
                          <button>
                            <span></span>
                            <p
                              className=""
                              data-title={t("applyNow")} data-text={t("applyNow")}
                            >
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
                            </p>
                          </button>

                        </div>


                      </Link>
                    </div>
                  </div>
                </FadeInView>
              ))
          )}
        </div>
      </div>

      {/* Helmut Section */}
      <FadeInView
        as="div"
        direction="bottom"
        duration={800}
        distance={30}
        className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 px-6 my-10 lg:my-16 max-w-7xl mx-auto rounded-2xl"
      >
        {/* LEFT: Text & Icons */}
        <div className="w-full lg:w-1/2">
          <p className="uppercase text-sm tracking-wide text-[#d1b250] font-semibold mb-3 mt-3">
            {t("helmut.section")}
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-5 leading-tight">
            {t("helmut.headline")}
          </h2>
          <p className="text-[#30373e]/80 mb-4">
            {t("helmut.desc")}
          </p>

          <ul className="text-[#30373e]/80 space-y-3 mb-4">
            {t.raw("helmut.bullets").map((bullet, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[#30373e]/80 text-xl">✔</span>
                {bullet}
              </li>
            ))}
          </ul>

          <Link href="mailto:helmut.schuster@platzhirsch.studio">
            <div className="button-custom">
              <button>
                <span></span>
                <p
                  className=""
                  data-title={t("applyNow")} data-text={t("applyNow")}
                >
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
                </p>
              </button>
            </div>

          </Link>
        </div>

        {/* RIGHT: Helmut Circle Image & Floating Cards */}
        <div className="relative w-full lg:w-1/2 flex justify-center items-center group m-0 md:m-15">
          <div className="relative z-10 w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[400px] lg:h-[400px] rounded-full overflow-hidden border-4 border-white shadow-xl">
            <Image
              src={teamImage}
              alt="Helmut"
              fill
              className="object-cover"
              sizes="(max-width: 767px) 300px, 400px"
            />
          </div>

          {/* Floating Box 1 */}
          <div className="absolute text-white m-1 top-10 right-0 bg-gray-800 rounded-xl px-2 py-2 lg:px-4 lg:py-5 md:px-4 md:py-5 shadow-lg z-20 text-sm font-semibold flex items-center gap-2 transition-all duration-1000 group-hover:bottom-10 group-hover:left-0 group-hover:top-auto group-hover:right-auto">
            <span className="text-[#d1b250]">+15%</span> {t("helmut.floating1")}
          </div>

          {/* Floating Box 2 */}
          <div className="absolute bottom-10 left-0 bg-[#d1b250] text-white rounded-xl px-2 py-2 lg:px-4 lg:py-5 md:px-4 md:py-5 shadow-lg z-20 text-sm font-semibold flex items-center gap-2 transition-all duration-1000 group-hover:top-10 group-hover:right-0 group-hover:bottom-auto group-hover:left-auto">
            <span className="text-gray-800">#1</span> {t("helmut.floating2")}
          </div>

          {/* Circle Background Shape */}
          <div className="hidden md:block absolute w-[440px] h-[440px] rounded-full bg-[#d1b250]/20 -z-10"></div>
          <div className="hidden md:block absolute w-[480px] h-[480px] rounded-full border border-[#d1b250]/50 -z-20"></div>
        </div>
      </FadeInView>

      <style jsx> {`
            .button-custom{
              display: flex;

  button {
    width: auto;
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
      margin: 8px;
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
        background-color: #30373e;
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

    &:hover::before,
    &:hover::after {
      width: 100%;
    }

    &:hover span::before,
    &:hover span::after {
      height: 100%;
    }

    &:hover p svg {
      transform: translateX(4px);
    }
  }
            }
            `} </style>
    </>
  );
};

export default KarrierePosition;