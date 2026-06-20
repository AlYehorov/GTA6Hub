import Link from "next/link";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS } from "@/lib/constants/navigation";

interface NavLinksProps {
  className?: string;
  onNavigate?: () => void;
  compact?: boolean;
}

export function NavLinks({ className, onNavigate, compact }: NavLinksProps) {
  return (
    <nav className={cn("flex items-center gap-0.5", className)}>
      {MAIN_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "rounded-lg font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white",
            compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
