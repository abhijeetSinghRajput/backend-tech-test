import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";

import type { PagebuilderType } from "@/types";
import { SanityImage } from "./elements/sanity-image";

type ImageLinkCard = NonNullable<
  NonNullable<PagebuilderType<"imageLinkCards">["cards"]>
>[number];

export type CTACardProps = {
  card: ImageLinkCard;
  className?: string;
};

export function CTACard({ card, className }: CTACardProps) {
  const { image, description, title, href } = card ?? {};
  return (
    <Link
      className={cn(
        "group relative flex h-[350px] flex-col overflow-hidden rounded-3xl bg-neutral-50 transition-all duration-500 hover:shadow-2xl dark:bg-neutral-900 md:h-[400px]",
        className
      )}
      href={href ?? "#"}
    >
      {/* Image Container: Fixed height for consistency, shrinks on hover */}
      <div className="relative w-full h-[75%] shrink-0 overflow-hidden transition-all duration-500 group-hover:h-[40%]">
        {image?.id && (
          <SanityImage
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            height={1080}
            image={image}
            loading="eager"
            width={1920}
          />
        )}
      </div>

      {/* Content Container: Expands on hover */}
      <div className="flex flex-col p-5 transition-all duration-500 group-hover:bg-white dark:group-hover:bg-neutral-800 md:p-6">
        <h3 className="text-lg text-center font-bold text-neutral-900 dark:text-white md:text-xl tracking-tight transition-colors group-hover:text-primary">
          {title}
        </h3>
        
        {/* Description: Revealed via grid-row transition */}
        <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-hover:mt-4">
          <div className="overflow-hidden">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed md:text-base line-clamp-6">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
