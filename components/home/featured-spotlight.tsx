import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { GTA6_IMAGES } from "@/lib/constants/images";
import { cn } from "@/lib/utils";

export function FeaturedSpotlight() {
  return (
    <section className="animate-fade-up px-4 sm:px-6 lg:px-8">
      <Link
        href="/trailers"
        className="group relative block aspect-[21/9] min-h-[240px] overflow-hidden rounded-2xl bg-black sm:min-h-[300px] lg:min-h-[360px]"
      >
        <Image
          src={GTA6_IMAGES.jasonLucia03Landscape}
          alt="Jason and Lucia — GTA VI official artwork by Rockstar Games"
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
          <div className="mb-3 flex items-center gap-3 text-sm font-medium text-white/70">
            <span>Lucia</span>
            <span className="text-white/30">·</span>
            <span>Jason</span>
          </div>

          <h2 className="max-w-lg font-heading text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
            Trailer Breakdown
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/70 sm:text-base">
            Frame-by-frame analysis of Trailer 2
          </p>

          <span
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-5 inline-flex w-fit gap-2 bg-white px-6 text-black hover:bg-white/90"
            )}
          >
            Read article
            <ArrowRight className="size-4" />
          </span>
        </div>
      </Link>
    </section>
  );
}
