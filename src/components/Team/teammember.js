"use client";
import Image from "next/image";
import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";

const TeamClient = ({ team }) => {
  const t = useTranslations("TeamClient")
  const activeTeam = team?.filter((item) => item.status === "Aktiv") || [];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:mt-16 lg:mb-16 mt-10 mb-10 text-center">
      <p className="text-[#d1b250] uppercase tracking-widest font-semibold mb-2 animate-fade-in-up">
        {t("pretitle")}
      </p>

      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1f1f1f] lg:mb-16 mb-10 animate-fade-in-up [animation-delay:0.1s]">
        {t("headline")}<br className="hidden md:block" />{t("headlineAfterBreak")}
      </h2>

      <div className="flex justify-center">
        {activeTeam.length === 0 ? (
          <div className="py-20">{t("noTeam")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {activeTeam.map((member, index) => (
              <div
                key={index}
                className="text-center group overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-500 relative opacity-0"
                style={{
                  animation: "fade-in-up-smooth 0.3s ease-in-out forwards",
                }}
              >
                <div className="relative w-[350px] h-[400px] overflow-hidden">
                  <Image
                    src={`/cms${member?.image}`}
                    alt={member?.title || "Team member"}
                    fill
                    className="object-cover transform group-hover:scale-105 transition-transform duration-500 ease-in-out"
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 350px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="flex justify-between bg-gray-800 p-4 items-center">
                  <div className="text-left">
                    <p className="text-white text-xl font-medium">{member?.title}</p>
                    <p className="text-sm text-gray-400">{member?.role}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <a
                      href={`mailto:${member?.email}`}
                      className="text-white text-xl hover:text-[#d1b250] transition"
                    >
                      <div className="flex items-center justify-center h-[40px] w-[40px] border border-white rounded-full group-hover:scale-110 transition-transform">
                        <Mail />
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

export default TeamClient;
