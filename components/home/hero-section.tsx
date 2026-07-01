import Link from "next/link";
import { Map, Newspaper, Play } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HeroBackground } from "@/components/home/hero-background";
import { GTA6_IMAGES } from "@/lib/constants/images";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative h-[80vh] h-[80dvh] min-h-[28rem] max-h-[900px] w-full overflow-hidden bg-black sm:min-h-[35rem]">
      <HeroBackground
        src={GTA6_IMAGES.heroViceCity}
        alt="Jason and Lucia with Vice City skyline — GTA VI official artwork"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/55 to-black/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

      <div className="relative flex h-full flex-col justify-end px-6 pb-14 pt-28 sm:px-10 sm:pb-16 lg:px-16 lg:pb-20">
        <p className="animate-fade-up mb-5 text-[11px] font-medium uppercase tracking-[0.45em] text-white/40 sm:text-xs">
          GTA<span className="text-gta-pink">6</span>Hub
        </p>

        <h1 className="animate-fade-up max-w-4xl font-heading text-[2rem] font-light leading-[1.08] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem] [animation-delay:80ms]">
          Vice City{" "}
          <span className="font-semibold tracking-[-0.03em]">starts here.</span>
        </h1>

        <p className="animate-fade-up mt-5 max-w-lg text-sm leading-relaxed tracking-wide text-white/45 sm:text-base [animation-delay:160ms]">
          News, maps, guides and everything happening in Leonida.
        </p>

        <div className="animate-fade-up mt-8 flex flex-wrap gap-3 [animation-delay:240ms]">
          <Link
            href="/newsroom"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 gap-2 bg-white px-7 text-sm text-black hover:bg-white/90"
            )}
          >
            <Newspaper className="size-4" />
            Explore News
          </Link>
          <Link
            href="/videos"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 gap-2 border-white/20 bg-white/5 px-7 text-sm text-white backdrop-blur-sm hover:bg-white/10"
            )}
          >
            <Play className="size-4 fill-current" />
            Watch Trailers
          </Link>
          <Link
            href="/map"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "h-11 gap-2 px-5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Map className="size-4" />
            View Map
          </Link>
        </div>
      </div>
    </section>
  );
}
