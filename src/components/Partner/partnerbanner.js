import React from 'react'
import Image from 'next/image'
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from 'next-intl';
import bgImage from "../../../public/Images/Partner/dinner-area.jpg";

const PartnerBanner = () => {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations('partner'); // Translation namespace

  return (
    <div className="relative w-full h-[600px]">
      <Image
        src={bgImage}
        alt={t('headline')}
        fill
        placeholder="blur"
        priority
        className='object-cover center'
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black opacity-30 z-10" />
      <div className="relative z-20 flex flex-col items-center justify-center h-full">
        <div className="flex items-center justify-center text-white gap-2 mb-8">
          <Link href="/" locale={locale}>
            <p className="text-sm font-normal">{t('navHome')}</p>
          </Link>
          <p>/</p>
          <p className="text-sm font-normal">{t('navPartner')}</p>
        </div>
        <p className="font-bold text-4xl md:text-5xl tracking-normal text-white text-center">
          {t('headline')}
        </p>
      </div>
    </div>
  )
}

export default PartnerBanner;
