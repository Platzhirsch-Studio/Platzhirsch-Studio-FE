"use client";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { Truck, Wrench, Palette, ShieldCheck, Star, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export default function Home({ data }) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const t = useTranslations("Benefits");
  return (
    <div
      className="h-full relative"
      style={{
        backgroundImage: `url('/Images/Home/bannerImage-4.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      /<div className="absolute inset-0 bg-black/50"></div>
      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-16">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-6">
            <div className="flex flex-col items-center">
              <div className="flex space-x-1 text-[#d1b250] mb-3">
                <Star className="w-5 h-5" />
                <Star className="w-5 h-5" />
                <Star className="w-5 h-5" />
              </div>
              <div className="bg-[#d1b250] p-3 rounded-lg border border-amber-200">
                <ThumbsUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-lg mb-4 text-[#d1b250] text-center uppercase">
            {data?.[`second_title_${locale}`]}
          </h2>
          <p className="text-lg text-white max-w-2xl mx-auto leading-relaxed">
            {data?.[`second_description_${locale}`]}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {data?.[`item_list_${locale}`]?.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
              <div className="flex flex-col items-start">
                <div className="bg-[#d1b250] p-3 rounded-lg mb-4 border border-amber-100">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl  text-gray-900 mb-3">{data?.[`item_list_${locale}`]?.[0].title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {data?.[`item_list_${locale}`]?.[0]?.description}
                </p>
              </div>
            </div>
          )}
          {data?.[`item_list_${locale}`] && data?.[`item_list_${locale}`].length > 1 && (
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
              <div className="flex flex-col items-start">
                <div className="bg-[#d1b250] p-3 rounded-lg mb-4 border border-amber-100">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl  text-gray-900 mb-3">{data?.[`item_list_${locale}`]?.[1].title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {data?.[`item_list_${locale}`]?.[1].description}
                </p>
              </div>
            </div>
          )}
          {data?.[`item_list_${locale}`] && data?.[`item_list_${locale}`].length > 2 && (
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
              <div className="flex flex-col items-start">
                <div className="bg-[#d1b250] p-3 rounded-lg mb-4 border border-amber-100">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl  text-gray-900 mb-3">{data?.[`item_list_${locale}`]?.[2].title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {data?.[`item_list_${locale}`]?.[2].description}
                </p>
              </div>
            </div>
          )}
          {data?.[`item_list_${locale}`] && data?.[`item_list_${locale}`].length > 3 && (
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
              <div className="flex flex-col items-start">
                <div className="bg-[#d1b250] p-3 rounded-lg mb-4 border border-amber-100">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl  text-gray-900 mb-3">{data?.[`item_list_${locale}`]?.[3].title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {data?.[`item_list_${locale}`]?.[3].description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
