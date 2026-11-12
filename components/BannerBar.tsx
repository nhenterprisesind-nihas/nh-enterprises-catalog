import BannerSlider from "@/components/BannerSlider";
import { getDealSlides } from "@/lib/dealBanners";

export default async function BannerBar() {
  const slides = await getDealSlides();
  return <BannerSlider slides={slides} />;
}
