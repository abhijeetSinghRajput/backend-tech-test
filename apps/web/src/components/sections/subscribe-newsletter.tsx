"use client";
import { Button } from "@workspace/ui/components/button";
import { ChevronRight, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import type { PagebuilderType } from "@/types";
import { RichText } from "../elements/rich-text";

type SubscribeNewsletterProps = PagebuilderType<"subscribeNewsletter">;

export default function SubscribeNewsletterButton() {
  // if using useFormStatus, for the submission logic, you need to use the form action
  const { pending } = useFormStatus();
  return (
    <Button
      aria-label={pending ? "Subscribing..." : "Subscribe to newsletter"}
      className="aspect-square size-8 bg-secondary hover:bg-secondary/80 dark:bg-accent dark:hover:bg-accent/80"
      disabled={pending}
      size="icon"
      type="submit"
    >
      <span className="flex items-center justify-center gap-2">
        {pending ? (
          <LoaderCircle
            aria-hidden="true"
            className="animate-spin text-foreground"
            size={16}
            strokeWidth={2}
          />
        ) : (
          <ChevronRight
            aria-hidden="true"
            className="text-foreground dark:text-muted-foreground"
            size={16}
            strokeWidth={2}
          />
        )}
      </span>
    </Button>
  );
}

export function SubscribeNewsletter({
  title,
  subTitle,
  helperText,
}: SubscribeNewsletterProps) {
  return (
    <section className="px-4 py-8 sm:py-12 md:py-16" id="subscribe">
      <div className="container relative mx-auto overflow-hidden rounded-3xl bg-muted/30 px-4 py-8 sm:py-16 md:px-8 md:py-24 lg:py-32 dark:bg-muted/10">
        <div className="relative z-10 mx-auto text-center">
          <h2 className="mb-4 text-balance font-semibold text-foreground text-xl sm:text-3xl md:text-5xl dark:text-foreground">
            {title}
          </h2>
          {subTitle && (
            <RichText
              className="mb-6 text-balance text-muted-foreground text-sm sm:mb-8 sm:text-base dark:text-muted-foreground"
              richText={subTitle}
            />
          )}
          <form
            className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              // custom submit logic
            }}
          >
            <div className="flex items-center justify-between rounded-xl border bg-background p-2 pl-4 drop-shadow-lg md:w-96 dark:bg-muted">
              <input
                className="w-full rounded-e-none border-e-0 bg-transparent outline-none focus-visible:ring-0 dark:text-foreground dark:placeholder:text-muted-foreground"
                name="email"
                placeholder="Enter your email address"
                required
                type="email"
              />
              <SubscribeNewsletterButton />
            </div>
          </form>
          {helperText && (
            <RichText
              className="mt-3 text-foreground/80 text-sm opacity-80 sm:mt-4 dark:text-muted-foreground"
              richText={helperText}
            />
          )}
        </div>
      </div>
    </section>
  );
}
