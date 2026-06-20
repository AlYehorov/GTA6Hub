import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { FEATURED_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function FeaturedSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <SectionHeader
        title="Explore the Hub"
        description="Everything you need to stay ahead of the GTA VI launch."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURED_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="group block h-full">
            <Card
              className={cn(
                "h-full border-border/60 bg-card/40 transition-all hover:border-gta-pink/40 hover:bg-card/70",
                "bg-gradient-to-br",
                item.accent
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="font-heading text-xl transition-colors group-hover:text-gta-pink">
                    {item.title}
                  </CardTitle>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gta-cyan" />
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-xs font-medium uppercase tracking-wider text-gta-cyan">
                  Browse →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
