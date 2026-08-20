"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import { useTranslations } from "next-intl";
import { generateSlug } from "@/lib/slugify";
import { Search, ChevronDown } from "lucide-react";

// CSS styles (pure CSS animation)
const style = `
.fade-in-up {
  opacity: 1 !important;
  transform: translateY(0) !important;
  transition: all 0.6s ease-out;
}
.animate-hidden {
  opacity: 0;
  transform: translateY(40px);
}
`;

const CustomDropdown = ({ options, selected, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full bg-white rounded-md shadow-md cursor-pointer select-none">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between px-4 py-3 border border-[#30373e]/50 rounded-md overflow-hidden bg-white focus-within:ring-1 focus-within:ring-[#30373e] shadow-sm transition"
      >
        <span
          className={`text-sm ${selected && selected !== "" && selected !== placeholder ? "font-normal text-gray-900" : "text-gray-900"
            }`}
        >
          {selected && selected !== "" ? selected : placeholder}
        </span>
        <ChevronDown className="text-gray-600" />
      </div>
      {open && (
        <ul className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border-2 border-[#30373e]/50 ">
          {options.map((option) => (
            <li
              key={option}
              onClick={() => {
                onChange(option.split("-")[0].trim());
                setOpen(false);
              }}
              className={`cursor-pointer px-4 py-3 text-sm ${option === selected ? "font-normal text-[#30373e] " : "font-normal text-[#30373e]/90"
                } hover:bg-gray-200`}
            >
              {option.split("-")[0].trim()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Produkte = ({ produkte, brands }) => {

  const t = useTranslations("products");

  const products = useMemo(() => {
    return Array.isArray(produkte) ? produkte : [];
  }, [produkte]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [indoorCategories, setIndoorCategories] = useState([]);
  const [outdoorCategories, setOutdoorCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Indoor");
  const [selectedBrands, setSelectedBrands] = useState(""); // Keep for brands list
  const [selectedBrand, setSelectedBrand] = useState(""); // Add this for selected brand
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  useEffect(() => {
    if (pathname && brands.length > 0) {
      // Match pattern: /en/produkte/brand-name or /produkte/brand-name
      const brandMatch = pathname.match(/\/produkte\/([^\/]+)/);
      if (brandMatch && brandMatch[1]) {
        const slugFromUrl = brandMatch[1]; // This is already slugified

        // Find the brand that matches the slug
        const matchedBrand = brands.find(brand => {
          const slugifiedBrand = generateSlug(brand);
          return slugifiedBrand === slugFromUrl;
        });

        if (matchedBrand) {
          setSelectedBrand(matchedBrand);
        }
      }
    }
  }, [pathname, brands]);

  useEffect(() => {
    if (products) {
      const indoor = products?.filter((produkt) => produkt?.indoor_and_outdoor === "Indoor");
      const outdoor = products?.filter((produkt) => produkt?.indoor_and_outdoor === "Outdoor");

      const indoorCat = [...new Set(indoor.map((produkt) => produkt?.kategories))];
      const outdoorCat = [...new Set(outdoor.map((produkt) => produkt.kategories))];

      setIndoorCategories(indoorCat);
      setOutdoorCategories(outdoorCat);
      setSelectedBrands(brands)

      // Extract brand names from brands array
      // if (brands && Array.isArray(brands)) {
      //   const brandNames = brands.map(brand => brand.name || brand);
      //   setBrandsList(brandNames);
      // }
    }
  }, [products, brands]);

  useEffect(() => {
    if (products) {
      const uniqueIndoorOutdoor = [...new Set(products?.map((produkt) => produkt?.indoor_and_outdoor)?.filter(Boolean))];

      setCategoryOptions(uniqueIndoorOutdoor);
    }
  }, [products]);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);

    setSelectedSubCategory("");
  };

  const handleBrandChange = (value) => {
    setSelectedBrand(value);
    setSelectedSubCategory("");

    // Update URL with new brand
    const params = new URLSearchParams(searchParams);
    router.push(`${generateSlug(value)}`, { scroll: false });
  };

  const handleSubCategoryChange = (value) => {
    setSelectedSubCategory(value === "View All" ? "" : value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredProducts = products?.filter((produkt) => {
    const matchesCategory = produkt?.indoor_and_outdoor?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSubCategory =
      selectedSubCategory && selectedSubCategory.toLowerCase() !== t("viewAll").toLowerCase()
        ? produkt?.kategories?.toLowerCase().split("-")[0].trim() === selectedSubCategory.toLowerCase()
        : true;

    const matchesSearchQuery = produkt?.produkt_name?.toLowerCase().includes(searchQuery?.toLowerCase());

    return matchesCategory && matchesSubCategory && matchesSearchQuery;
  });

  // Animate on scroll
  // Animate on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-up");
            entry.target.classList.remove("animate-hidden");
          } else {
            entry.target.classList.remove("fade-in-up");
            entry.target.classList.add("animate-hidden");
          }
        });
      },
      {
        threshold: 0.00002,
      }
    );

    const items = document.querySelectorAll(".product-card");
    items.forEach((item) => {
      observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{style}</style>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto justify-center items-center gap-2 mt-10 px-4 mb-10 lg:mt-16 lg:mb-16">
        <div className="w-full ">
          <CustomDropdown
            options={selectedBrands}
            selected={selectedBrand}
            onChange={handleBrandChange}
            placeholder={t("selectBrand")}
          />
        </div>
        <div className=" w-full">
          <CustomDropdown
            options={categoryOptions}
            selected={selectedCategory}
            onChange={handleCategoryChange}
            placeholder={t("selectCategory")}
          />
        </div>

        <div className=" w-full ">
          <CustomDropdown
            options={[t("viewAll")].concat(selectedCategory === "Indoor" ? indoorCategories : outdoorCategories)}
            selected={selectedSubCategory || t("viewAll")}
            onChange={handleSubCategoryChange}
            placeholder={t("viewAll")}
          />
        </div>

        <div className="flex w-full border border-[#30373e]/50 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#30373e]/80 shadow-sm transition">
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            className="px-4 py-[13px] text-sm outline-none placeholder-[#30373e] bg-white w-full"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button className="px-4 text-gray-600 hover:text-gray-800">
            <Search size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mb-16">
        <div className="w-12 h-[2px] bg-[#d1b250]" />
        <h2 className="text-2xl font-light">{selectedSubCategory.split("-")[0].trim() || selectedCategory}</h2>
        <div className="w-12 h-[2px] bg-[#d1b250]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 max-w-7xl mx-auto px-4 pb-16">
        {filteredProducts.map((produkt, index) => {
          const sortedImages = [...(produkt?.images || [])].sort((a, b) => a.idx - b.idx);
          const mainImage = sortedImages[0];

          return (
            <div key={index} className="text-center product-card">
              {produkt?.bild_anhangen?.[0]?.bild_anhangen ? (
                <Link
                  href={`/produkte/${generateSlug(produkt?.marken)}/${produkt.path_field}`}
                  prefetch={true}
                  className="inline-block"
                  locale={locale}
                >
                  <Image
                    src={`/cms${produkt?.bild_anhangen?.[0]?.bild_anhangen}`}
                    alt={produkt?.produkt_name}
                    width={350}
                    height={200}
                    sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 350px"
                    className="object-center h-[350px] w-full object-cover rounded-xl"
                  />
                </Link>
              ) : (
                <div className="h-[300px] w-full bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-gray-500 text-sm">{t("noImage")}</span>
                </div>
              )}
              <Link
                href={`/produkte/${generateSlug(produkt?.marken)}/${produkt.path_field}`}
                prefetch={true}
                locale={locale}
              >
                <p className="pt-2 text-lg capitalize cursor-pointer hover:text-[#d1b250]">{produkt?.produkt_name}</p>
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Produkte;