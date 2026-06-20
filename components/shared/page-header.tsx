import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("border-b border-white/10 bg-black pt-20", className)}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gta-pink">
          GTA VI
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
