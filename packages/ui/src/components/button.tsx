import { Slot } from "@radix-ui/react-slot";
import { cn } from "@workspace/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./tooltip";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-none font-medium text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-none px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-none px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  tooltip?: React.ReactNode;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  tooltip,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  // Recursively check if children contain any text to determine if it's an "icon only" button
  const hasVisibleText = React.useMemo(() => {
    const check = (node: React.ReactNode): boolean => {
      return React.Children.toArray(node).some((child) => {
        if (typeof child === "string" || typeof child === "number") return true;
        if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.props.children) {
          return check(child.props.children);
        }
        return false;
      });
    };
    return check(children);
  }, [children]);

  const isIconButton = size === "icon";
  const effectiveTooltip = tooltip || (isIconButton && !hasVisibleText ? props["aria-label"] : undefined);
  
  // Ensure icon buttons have an aria-label if tooltip is provided
  const ariaLabel = props["aria-label"] || (typeof effectiveTooltip === "string" ? effectiveTooltip : undefined);

  const buttonElement = (
    <Comp
      suppressHydrationWarning
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot="button"
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </Comp>
  );

  if (effectiveTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Ensure TooltipTrigger always has a single child element */}
          {asChild ? buttonElement : <span>{buttonElement}</span>}
        </TooltipTrigger>
        <TooltipContent>{effectiveTooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return buttonElement;
}

export { Button, buttonVariants };
