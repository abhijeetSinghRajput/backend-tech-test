"use client";
import { Logger } from "@workspace/logger";
import { useRouter } from "next/navigation";
import type { FC } from "react";
import { useTransition } from "react";

import { disableDraftMode } from "@/app/actions";

const logger = new Logger("PreviewBar");

export const PreviewBar: FC = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const disable = () => {
    logger.info("Disabling draft mode");
    startTransition(async () => {
      await disableDraftMode();
      router.refresh();
    });
  };

  return (
    <div className="fixed right-0 bottom-1 left-0 z-10 px-2 md:bottom-2 md:px-4">
      <div className="mx-auto max-w-96 rounded-md border border-border bg-muted/80 p-2 backdrop-blur-sm dark:border-border dark:bg-background/80">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-xs text-foreground dark:text-muted-foreground">
              Viewing the website in preview mode.
            </p>
          </div>
          {pending ? (
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">
              Disabling draft mode...
            </span>
          ) : (
            <button
              className="text-xs text-muted-foreground transition-colors hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
              onClick={disable}
              type="button"
            >
              Exit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
