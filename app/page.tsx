import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { NewsSection } from "@/components/home/news-section";
import { ContentCarousel } from "@/components/home/content-carousel";
import {
  MOCK_CHARACTERS,
  MOCK_VEHICLES,
  MOCK_GUIDES,
  MOCK_MAP_LOCATIONS,
} from "@/lib/data/mock-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "GTA VI Community Hub",
  description:
    "News, maps, guides and everything happening in Leonida. Your unofficial GTA VI community hub.",
  path: "/",
});

export default function HomePage() {
  return (
    <div className="bg-black">
      <HeroSection />

      <div className="relative space-y-16 py-16 sm:space-y-24 sm:py-24">
        <NewsSection />

        <ContentCarousel
          title="Characters"
          subtitle="The faces of Leonida"
          seeAllHref="/characters"
          items={MOCK_CHARACTERS}
        />

        <ContentCarousel
          title="Explore Leonida"
          subtitle="Skylines, beaches, swamps & neon"
          seeAllHref="/map"
          items={MOCK_MAP_LOCATIONS}
        />

        <ContentCarousel
          title="Vehicles"
          subtitle="Cars, boats, choppers & more"
          seeAllHref="/vehicles"
          items={MOCK_VEHICLES}
        />

        <ContentCarousel
          title="Guides"
          subtitle="Walkthroughs, secrets & completion"
          seeAllHref="/guides"
          items={MOCK_GUIDES}
        />
      </div>
    </div>
  );
}
