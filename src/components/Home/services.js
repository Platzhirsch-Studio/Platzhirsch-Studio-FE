import Image from "next/image";
import Image1 from "../../../public/Images/Home/download.jpg";
import { ChevronRight, Box, UserCog, House, UserRoundCog   } from "lucide-react";
import { useTranslations } from "next-intl";

const Services = () => {
  const t = useTranslations("services")
  return (
    <div className="py-20">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="relative h-[560px]"> {/* h-140 => 560px */}
          <Image
            src={Image1}
            alt="Interior Design Service Image"
            fill
            className="object-cover rounded-sm mr-10"
            placeholder="blur"
            priority
           sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>
      </div>

      <div className="w-full bg-[#30373e] pt-50 -mt-50">
        <div className="py-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex-1 p-6 justify-between md:col-span-2 lg:col-span-1">
              <h2 className="text-lg md:text-xl font-bold text-amber-400 mb-10">{t('services.title')}</h2>
              <p className="text-3xl md:text-5xl text-white mb-10">
                {t('subtitle')}
              </p>
              <button className="text-sm md:text-base text-white font-bold bg-amber-600 px-6 py-2 uppercase flex justify-center items-center gap-1 mt-10">
                {t('readMore')} <ChevronRight />
              </button>
            </div>
            <div className="flex-1 p-6">
              <h3 className="text-xl font-bold text-white mb-3 flex justify-start items-center gap-2">
                <UserRoundCog className="font-4xl w-15 h-15" />
                {t('smartCareTitle')}
              </h3>
              <p className="text-white mb-4">
                {t('smartCareDesc')}
              </p>

              <h3 className="text-xl font-bold text-white mb-3 mt-6 flex justify-start items-center gap-2">
                <Box className="font-4xl w-15 h-15" />
                {t('kitchenPlannerTitle')}
              </h3>
              <p className="text-white">
                {t('kitchenPlannerDesc')}
              </p>
            </div>
            <div className="flex-1 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-3 flex justify-start items-center gap-2">
                <House className="font-4xl w-15 h-15" />
               {t('homeCheckTitle')}
              </h3>
              <p className="text-white mb-4">
                {t('homeCheckDesc')}
              </p>

              <h3 className="text-xl font-bold text-white mb-3 mt-6 flex justify-start items-center gap-2">
                <UserCog className="font-4xl w-15 h-15" />
                 {t('kitchenDesignTitle')}
              </h3>
              <p className="text-white">
                {t('kitchenDesignDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
