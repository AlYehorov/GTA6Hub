import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format-date";
import type { NewsArticle } from "@/lib/types";

interface NewsCardProps {
  article: NewsArticle;
}

const categoryVariant: Record<
  NewsArticle["category"],
  "default" | "secondary" | "outline"
> = {
  Trailer: "default",
  Leak: "secondary",
  Official: "outline",
  Analysis: "secondary",
};

export function NewsCard({ article }: NewsCardProps) {
  return (
    <Card className="group border-border/60 bg-card/50 transition-all hover:border-gta-pink/30 hover:bg-card/80">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={categoryVariant[article.category]}>
            {article.category}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {article.readTimeMinutes} min
          </span>
        </div>
        <CardTitle className="font-heading text-lg leading-snug transition-colors group-hover:text-gta-pink">
          {article.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {article.excerpt}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <time
            dateTime={article.publishedAt}
            className="text-xs text-muted-foreground"
          >
            {formatDate(article.publishedAt)}
          </time>
          <Link
            href="/news"
            className="inline-flex items-center gap-1 text-xs font-medium text-gta-cyan transition-colors hover:text-gta-cyan/80"
          >
            Read more
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
