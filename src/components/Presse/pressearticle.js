import React from 'react';
import Image from "next/image";
import { useTranslations } from 'next-intl';
import FadeInView from "@/components/Reusable/FadeInView";

const magazines = [
  { title: "New Collections", src: "/Images/Presse/mag1.jpg" },
  { title: "Auf Wolken gebettet", src: "/Images/Presse/mag2.jpg" },
  { title: "Home of Minotti", src: "/Images/Presse/mag3.jpg" },
  { title: "Minotti 2022 Collection", src: "/Images/Presse/mag4.jpg" },
  { title: "Schlafen auf Treca Paris", src: "/Images/Presse/mag5.jpg" },
  { title: "Küchenkultur für Jahre", src: "/Images/Presse/mag6.jpg" },
  { title: "Für ein schönes Zuhause", src: "/Images/Presse/mag7.jpg" },
  { title: "Design Ton in Ton", src: "/Images/Presse/mag8.jpg" },
  { title: "Cooler Outdoor-Style", src: "/Images/Presse/mag9.jpg" },
  { title: "Mehr als nur Möbel", src: "/Images/Presse/mag10.jpg" },
  { title: "Indoor & Outdoor", src: "/Images/Presse/mag11.jpg" },
  { title: "Talk: Susanne Messmer", src: "/Images/Presse/mag12.jpg" },
  { title: "Die individuelle Küche", src: "/Images/Presse/mag12.jpg" },
  { title: "Die Platzhirsch(in)", src: "/Images/Presse/mag13.jpg" },
  { title: "Stilvolles Kochen", src: "/Images/Presse/mag14.jpeg" },
  { title: "In Sommerlaune", src: "/Images/Presse/mag14.jpeg" },
  { title: "Neueröffnung: Platzhirsch Home Living", src: "/Images/Presse/mag16.jpg" },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const PresseArticle = () => {
  const t = useTranslations();
  const magazineTitles = t.raw("presse.magazines");
  return (
    <div className="max-w-7xl mx-auto px-6 mb-10 lg:mb-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {magazines.map((mag, index) => (
          <FadeInView
            key={index}
            as="div"
            direction="bottom"
            duration={600}
            distance={30}
            delay={index * 100}
            className="group relative overflow-hidden"
          >
            {/* Image container */}
            <div className="relative w-full h-[400px] shadow-md overflow-hidden">
              <Image
                src={mag.src}
                alt={mag.title || "Press article"}
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 25vw"
                className="transition-transform duration-500 group-hover:scale-105 object-cover"
              />

              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-4 left-4 text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {magazineTitles[index]}
              </div>
            </div>
          </FadeInView>
        ))}
      </div>
    </div>
  );
};

export default PresseArticle;
