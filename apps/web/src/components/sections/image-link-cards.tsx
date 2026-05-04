import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";

import type { PagebuilderType } from "@/types";
import { SanityButtons } from "../elements/sanity-buttons";
import { CTACard } from "../image-link-card";
import { RichText } from "../elements/rich-text";

export type ImageLinkCardsProps = PagebuilderType<"imageLinkCards">;

export function ImageLinkCards({
  richText,
  title,
  eyebrow,
  cards,
  buttons,
}: ImageLinkCardsProps) {
  return (
    <section className="my-16" id="image-link-cards">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex w-full flex-col items-center">
          <div className="flex flex-col items-center space-y-4 text-center sm:space-y-6 md:text-center">
            {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
            <h2 className="text-balance font-semibold text-3xl md:text-5xl">
              {title}
            </h2>
            <RichText className="text-balance" richText={richText} />
          </div>

          {/* Social Media Grid */}
          {Array.isArray(cards) && cards.length > 0 && (
            <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-1">
              {cards?.map((card, idx) => (
                <CTACard
                  card={card}
                  className={cn(
                    "bg-muted/50 dark:bg-muted",
                    idx === 0 && "lg:rounded-r-none lg:rounded-l-3xl",
                    idx === cards.length - 1 &&
                    "lg:rounded-r-3xl lg:rounded-l-none",
                    idx !== 0 && idx !== cards.length - 1 && "lg:rounded-none"
                  )}
                  key={card._key}
                />
              ))}
            </div>
          )}

          <div className="flex w-full items-center justify-center py-6">
            <SanityButtons buttons={buttons} />
          </div>
        </div>
      </div>
    </section>
  );
}
