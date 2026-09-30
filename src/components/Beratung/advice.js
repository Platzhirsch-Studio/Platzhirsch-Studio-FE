import { CircleCheck } from 'lucide-react';
import Image from "next/image";
import { useTranslations } from "next-intl";
import FadeInView from "@/components/Reusable/FadeInView";

const FeaturesSection = () => {
  const t = useTranslations('FeaturesSection')
  const features = [
    {
      title: t("features.0.title"),
      description: t("features.0.description"),
      bullets: t.raw("features.0.bullets"),
      image: "/Images/Home/inspiration.jpg",
    },
    {
      title: t("features.1.title"),
      description: t("features.1.description"),
      bullets: t.raw("features.1.bullets"),
      image: "/Images/Home/Poliform-Kitchen.jpg",
    },
    {
      title: t("features.2.title"),
      description: t("features.2.description"),
      bullets: t.raw("features.2.bullets"),
      image: "/Images/Home/Rimadesio-Modulor-1.jpg",
    },
    {
      title: t("features.3.title"),
      description: t("features.3.description"),
      bullets: t.raw("features.3.bullets"),
      image: "/Images/Home/classicon.jpg",
    },
    {
      title: t("features.4.title"),
      description: t("features.4.description"),
      bullets: t.raw("features.4.bullets"),
      image: "/Images/Home/aboutHome.jpg",
    },
    {
      title: t("features.5.title"),
      description: t("features.5.description"),
      bullets: t.raw("features.5.bullets"),
      image: "/Images/Home/trecaparis.webp",
    },
    {
      title: t("features.6.title"),
      description: t("features.6.description"),
      bullets: t.raw("features.6.bullets"),
      image: "/Images/Home/thidImage.jpg",
    },
  ];

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.15 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="mt-10 lg:mt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <FadeInView
        direction="bottom"
        duration={500}
        distance={30}
        className="text-center"
      >
        <h2 className="text-lg text-[#d1b250] uppercase tracking-wider mb-4">
          {t("header.stepTitle")}
        </h2>
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#30373e]">
          {t("header.headline")}
        </h3>
        <p className="max-w-2xl mx-auto text-[#30373e]/80 text-md mt-4">
          {t("header.subline")}
        </p>
      </FadeInView>

      {/* Feature Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10 lg:mt-16"
      >
        {features.map((feature, featureIndex) => (
          <FadeInView
            key={feature.title}
            direction="bottom"
            duration={600}
            distance={30}
            delay={featureIndex * 150}
            className="relative group group-hover:scale-105 overflow-hidden rounded-xl shadow-xl duration-300"
          >
            <div className="h-60 w-full relative">
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                loading="lazy"
                className="object-cover transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/40 transition-all duration-500" />
              <div className="absolute top-4 left-4 bg-[#d1b250] text-white text-sm font-bold px-3 py-1 rounded-full">
                {featureIndex + 1}
              </div>
            </div>
            <div className="p-6 bg-white">
              <h4 className="text-xl font-semibold text-[#30373e] mb-3">{feature.title}</h4>
              <p className="text-[#30373e]/80 mb-3">{feature.description}</p>
              <ul className="space-y-2">
                {feature.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#30373e]/80">
                    <CircleCheck className="text-[#d1b250] mt-1" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeInView>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
