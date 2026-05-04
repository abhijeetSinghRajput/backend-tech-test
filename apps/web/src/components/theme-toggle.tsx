"use client";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = [
  { id: "system", value: "system", icon: Monitor, label: "System" },
  { id: "light", value: "light", icon: Sun, label: "Light" },
  { id: "dark", value: "dark", icon: Moon, label: "Dark" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/60">
          Theme
        </span>
        <div className="flex h-[38px] w-fit items-center rounded-md border border-border bg-muted/20 p-[3px]">
          <div className="flex h-[30px] w-11 items-center justify-center rounded-[4px]" />
          <div className="flex h-[30px] w-11 items-center justify-center rounded-[4px]" />
          <div className="flex h-[30px] w-11 items-center justify-center rounded-[4px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="mb-6 font-semibold">Theme</h3>

      <div className="flex h-[38px] w-fit items-center rounded-md border border-border bg-muted/20 p-[3px]">
        {THEMES.map(({ id, value, icon: Icon, label }) => {
          const isActive = theme === value;
          return (
            <Button
              key={id}
              variant="ghost"
              size="icon"
              onClick={() => setTheme(value)}
              className={cn(
                "h-[30px] w-11 rounded-[4px] transition-all duration-200",
                isActive
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
              aria-label={label}
            >
              <Icon className="h-[14px] w-[14px]" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}
