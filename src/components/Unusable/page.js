import { useTranslations } from "next-intl";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import Uberuns from "@/components/UberUns/uberuns";
import Austellung from "@/components/UberUns/austellung";

export default function UberUns() {
  const t = useTranslations("about");

  const BannerInfo = {
    image: "/Images/UberUns/white-sofas.jpg",
    links: [
      {
        linkName: t("breadcrumb.home"),
        link: "/",
      },
      {
        linkName: t("breadcrumb.aboutUs"),
        link: "/ueber-uns",
      },
    ],
    title: t("pageTitle"),
  };

  return (
    <div>
      <SinglePageBanner info={BannerInfo} />
      <Uberuns />
      <Austellung />
    </div>
  );
}
