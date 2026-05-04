import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  active?: boolean;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex mb-8 pl-4 md:pl-6", className)}
    >
      <ol className="flex items-center space-x-2 text-xs font-medium text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center">
            {index > 0 && <span className="mx-2 text-border">/</span>}
            {item.active || !item.href ? (
              <span
                className={cn(
                  "text-foreground",
                  item.active && "font-semibold"
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-primary/70 hover:text-primary transition-colors font-semibold"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
