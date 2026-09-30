import React from 'react'
import Image from 'next/image'
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from 'next-intl';
import bgImage from "../../../public/Images/Presse/cool-living-room.jpg";

const Pressebanner = () => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations('press'); // <--- NEW

  return (
    <div>
      <div className="relative w-full h-150 pt-25">
        {/* Background image */}
        <Image
          src={bgImage}
          alt={t('headline')}
          fill
          placeholder="blur"
          priority
          sizes="100vw"
          className='object-cover object-center'
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-30 z-10" />

        <div className="relative z-20 flex flex-col items-center justify-center h-full">
          <div className="flex items-center justify-center text-white gap-2 mb-8">
            <div>
              <Link href="/" locale={locale}>
                <p className="text-sm font-normal">{t('navHome')}</p>
              </Link>
            </div>
            <div><p>/</p></div>
            <div>
              <p className="text-sm font-normal">{t('navPress')}</p>
            </div>
          </div>
          <p className="font-bold text-4xl md:text-5xl tracking-normal text-white text-center">
            {t('headline')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Pressebanner
