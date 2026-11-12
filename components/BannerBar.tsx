import BannerSlider from "@/components/BannerSlider";
import { getDealSlides } from "@/lib/dealBanners";

export default async function BannerBar() {
  const slides = await getDealSlides();
  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden">
      <BannerSlider slides={slides} />
    </div>
  );
}
