export type CardVariant = "hero" | "landscape" | "portrait" | "square";

export interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  tag?: string;
  image: string;
  imagePosition?: string;
  variant?: CardVariant;
}

export interface SpotlightItem {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  cta: string;
  image: string;
}
