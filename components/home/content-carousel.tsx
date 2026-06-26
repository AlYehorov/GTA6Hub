import { CarouselScrollRail } from "@/components/home/carousel-scroll-rail";
import { MediaCard } from "@/components/shared/media-card";
import { cn } from "@/lib/utils";
import type { CarouselItem } from "@/lib/types";

interface ContentCarouselProps {
  title: string;
  seeAllHref: string;
  items: CarouselItem[];
  className?: string;
  subtitle?: string;
  hideHeader?: boolean;
}

export function ContentCarousel({
  title,
  seeAllHref,
  items,
  className,
  subtitle,
  hideHeader = false,
}: ContentCarouselProps) {
  return (
    <section className={cn("section-reveal defer-paint", className)}>
      <CarouselScrollRail
        title={title}
        seeAllHref={seeAllHref}
        subtitle={subtitle}
        hideHeader={hideHeader}
      >
        {items.map((item, index) => (
          <MediaCard
            key={item.id}
            item={item}
            eager={index === 0}
            style={{ animationDelay: `${index * 70}ms` }}
            className="animate-fade-up"
          />
        ))}
      </CarouselScrollRail>
    </section>
  );
}
