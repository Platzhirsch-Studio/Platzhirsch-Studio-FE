"use client";
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/dist/photoswipe.css";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";

// dimensionImages vjen nga produkte_data -> produkte_dimension
const DimensionProdukte = ({ dimensionImages = [], produktName }) => {
  // Merr vetëm rreshtat që kanë attach_image
  const validImages = dimensionImages.filter((row) => row?.attach_image);

  // Gjej locale nga URL-ja
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname) || "de";

  const pswpLightbox = useRef(null);

  useEffect(() => {
    if (!validImages.length || pswpLightbox.current) return;

    const items = validImages.map((row) => ({
      src: `/cms${row.attach_image}`,
      width: 1200,
      height: 900,
      alt: row.alt_text_image || produktName,
      title: row.alt_text_image || produktName,
    }));

    const lightbox = new PhotoSwipeLightbox({
      pswpModule: () => import("photoswipe"),
      dataSource: items,
      paddingFn: (viewportSize) =>
        viewportSize.x < 768
          ? { top: 0, bottom: 0, left: 0, right: 0 }
          : { top: 30, bottom: 30, left: 50, right: 50 },
    });

    lightbox.init();
    pswpLightbox.current = lightbox;

    return () => {
      if (pswpLightbox.current) {
        pswpLightbox.current.destroy();
        pswpLightbox.current = null;
      }
    };
  }, [validImages, produktName]);

  const openPhotoSwipe = (index) => {
    if (pswpLightbox.current) {
      pswpLightbox.current.loadAndOpen(index);
    }
  };

  if (validImages.length === 0) {
    return null;
  }

  const title =
    locale === "en"
      ? "Technical Features"
      : locale === "it"
      ? "Caratteristiche tecniche"
      : locale === "fr"
      ? "Caractéristiques techniques"
      : "Technische Merkmale"; 

  return (
    <div className="max-w-7xl mx-auto px-4 my-10 lg:my-16">
      {/* Titulli & nën‑titulli */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-light mb-4">{title}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {validImages.map((row, index) => {
          const src = `/cms${row.attach_image}`;
          const alt = row.alt_text_image || produktName || `Dimension ${index + 1}`;

          return (
            <div
              key={row.name || index}
              className="relative w-full aspect-square rounded-xl overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
              onClick={() => openPhotoSwipe(index)}
            >
              <Image
                src={src}
                alt={alt}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                priority={index < 2}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DimensionProdukte;